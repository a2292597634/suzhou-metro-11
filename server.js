/**
 * 苏州地铁11号线商业作战图 - 本地服务器
 * 功能：提供静态文件 + PostgreSQL数据库API (Prisma ORM)
 * 启动：node server.js
 */

require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer');
const { z } = require('zod');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';

// 解析 JSON body
app.use(express.json({ limit: '10mb' }));

// multer 配置文件上传（Excel 导入）
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 .xlsx 文件格式'));
    }
  }
});

// 解析 Cookie（使用 SESSION_SECRET 签名）
app.use(cookieParser(SESSION_SECRET));

// ========== 限流中间件 ==========

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 分钟窗口
const RATE_LIMIT_MAX = 30;        // 每 IP 每分钟最多 30 次写请求

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
  }
  next();
}

// 定期清理过期限流记录
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.windowStart < cutoff) rateLimitMap.delete(ip);
  }
}, 120_000);

// ========== 认证中间件 ==========

// 认证中间件 — 校验签名 Cookie 或 Bearer Token
function authenticateToken(req, res, next) {
  const expectedToken = process.env.AUTH_TOKEN;

  // 方式 1: 检查签名 Cookie
  if (req.signedCookies?.auth_token && req.signedCookies.auth_token === expectedToken) {
    return next();
  }

  // 方式 2: 检查 Bearer Token header
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1] === expectedToken) {
      return next();
    }
  }

  if (!expectedToken) {
    return res.status(500).json({ error: '服务端未配置 AUTH_TOKEN' });
  }

  return res.status(401).json({ error: '未授权，请先登录' });
}

// ========== CSP Nonce 生成 ==========

function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

// CSP Header 中间件 — 使用 nonce 支持内联样式和脚本
function setSecurityHeaders(req, res, next) {
  const nonce = generateNonce();
  res.locals.nonce = nonce;

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; style-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net; script-src 'self' 'nonce-${nonce}'; img-src 'self' data:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'`
  );
  next();
}

// CORS 白名单中间件
function corsMiddleware(req, res, next) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}

app.use(setSecurityHeaders);
app.use(corsMiddleware);

// ========== API 路由 ==========

// 登录端点 — 验证密码后设置 HttpOnly 签名 Cookie（带限流）
app.post('/api/login', rateLimiter, (req, res) => {
  const { password } = req.body || {};
  const expectedToken = process.env.AUTH_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({ error: '服务端未配置 AUTH_TOKEN' });
  }

  if (!password || password !== expectedToken) {
    return res.status(401).json({ error: '密码错误' });
  }

  res.cookie('auth_token', expectedToken, {
    httpOnly: true,
    signed: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 24 小时
  });

  res.json({ success: true, message: '登录成功' });
});

// 登出端点
app.post('/api/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: '已登出' });
});

// 检查登录状态
app.get('/api/auth-status', (req, res) => {
  const expectedToken = process.env.AUTH_TOKEN;
  const isAuth =
    (req.signedCookies?.auth_token && req.signedCookies.auth_token === expectedToken);

  res.json({ authenticated: !!isAuth });
});

// 获取数据
app.get('/api/data', async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      include: { shops: true },
      orderBy: { x: 'asc' }
    });

    const globalStats = await prisma.globalStats.findUnique({
      where: { id: 1 }
    });

    const gradeInfos = await prisma.gradeInfo.findMany();

    // 转换为前端格式
    const gradeInfo = {};
    gradeInfos.forEach(g => {
      gradeInfo[g.id] = { name: g.name, desc: g.desc || '', color: g.color };
    });

    // 转换 stations 格式（移除 Prisma 元字段）
    const formattedStations = stations.map(s => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      x: s.x,
      y: s.y,
      pos: s.pos,
      transfer: s.transfer,
      version: s.version,
      transferLine: s.transferLine,
      shops: s.shops.map(shop => ({
        no: shop.no,
        shortNo: shop.shortNo,
        name: shop.name,
        type: shop.type,
        area: shop.area,
        tenant: shop.tenant || '',
        contact: shop.contact || '',
        openDate: shop.openDate || '',
        status: shop.status,
        remark: shop.remark || ''
      }))
    }));

    res.json({
      data: {
        stations: formattedStations,
        globalStats: globalStats || null,
        gradeInfo
      }
    });
  } catch (err) {
    console.error('读取失败:', err.message);
    res.status(500).json({ error: '数据库读取失败' });
  }
});

// Zod 校验 schemas（增强版：添加长度限制和数组规模限制）
const shopSchema = z.object({
  no: z.number().int().min(0),
  shortNo: z.string().max(50).optional().default(''),
  name: z.string().min(1).max(200),
  type: z.string().max(50).optional().default('商铺'),
  area: z.number().min(0).optional().default(0),
  tenant: z.string().max(100).optional().default(''),
  contact: z.string().max(100).optional().default(''),
  openDate: z.string().max(50).optional().default(''),
  status: z.enum(['营业中', '未出租', '装修中']).optional().default('未出租'),
  power: z.union([z.enum(['20KW', '30KW']), z.literal('')]).optional().default(''),
  water: z.union([z.enum(['有', '/']), z.literal('')]).optional().default('/'),
  remark: z.string().max(500).optional().default('')
});

const stationSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  grade: z.enum(['S', 'A', 'B', 'C']),
  x: z.number().int().min(0).max(3000),
  y: z.number().int().min(0).max(3000),
  pos: z.enum(['top', 'bottom', 'left', 'right']),
  transfer: z.boolean().optional().default(false),
  transferLine: z.string().max(100).nullable().optional(),
  shops: z.array(shopSchema).max(200).optional().default([]),
  version: z.number().int().min(0).optional().default(0)
});

const globalStatsSchema = z.object({
  statsDate: z.string().max(100).optional().default(''),
  totalShops: z.number().int().min(0).optional().default(0),
  rentedShops: z.number().int().min(0).optional().default(0),
  vacantShops: z.number().int().min(0).optional().default(0),
  rentRate: z.string().max(20).optional().default('')
});

const gradeInfoSchema = z.record(z.string().max(10), z.object({
  name: z.string().min(1).max(100),
  desc: z.string().max(500).optional().default(''),
  color: z.string().min(1).max(20)
}));

// 完整数据 schema 带重复 ID 检查
const dataSchema = z.object({
  stations: z.array(stationSchema).max(100).optional().default([]),
  globalStats: globalStatsSchema.nullable().optional(),
  gradeInfo: gradeInfoSchema.optional().default({})
}).refine(
  (data) => {
    const ids = (data.stations || []).map(s => s.id);
    return new Set(ids).size === ids.length;
  },
  { message: 'stations 数组包含重复的 ID', path: ['stations'] }
);

// 保存数据（需要认证 + 限流）
app.post('/api/data', authenticateToken, rateLimiter, async (req, res) => {
  // Zod 校验
  const result = dataSchema.safeParse(req.body.data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({ error: '数据校验失败', details: errors });
  }

  const data = result.data;
  const updatedVersions = {};

  try {
    await prisma.$transaction(async (tx) => {
      // 1. 完整同步 — 删除不在请求中的站点
      const requestStationIds = data.stations.map(s => s.id);
      if (requestStationIds.length > 0) {
        await tx.shop.deleteMany({ where: { stationId: { notIn: requestStationIds } } });
        await tx.station.deleteMany({ where: { id: { notIn: requestStationIds } } });
      } else {
        // 清空所有数据
        await tx.shop.deleteMany();
        await tx.station.deleteMany();
      }

      // 2. 保存站点和商铺（原子乐观锁版本号校验）
      for (const s of data.stations) {
        const existing = await tx.station.findUnique({ where: { id: s.id } });

        if (existing && s.version != null) {
          // 原子乐观锁：在同一 SQL 中检查 id + version，避免竞态窗口
          const result = await tx.station.updateMany({
            where: { id: s.id, version: s.version },
            data: {
              name: s.name,
              grade: s.grade,
              x: s.x,
              y: s.y,
              pos: s.pos,
              transfer: s.transfer,
              transferLine: s.transferLine || null,
              version: s.version + 1
            }
          });

          if (result.count === 0) {
            // 版本不匹配——重新读取以获取实际版本
            const current = await tx.station.findUnique({ where: { id: s.id } });
            throw new Error(`CONFLICT:${s.id}:期望版本 ${s.version}，实际版本 ${current.version}`);
          }

          updatedVersions[s.id] = s.version + 1;
        } else {
          // 新建站点或无版本信息——使用 upsert
          const newVersion = (existing?.version || 0) + 1;
          updatedVersions[s.id] = newVersion;

          await tx.station.upsert({
            where: { id: s.id },
            update: {
              name: s.name,
              grade: s.grade,
              x: s.x,
              y: s.y,
              pos: s.pos,
              transfer: s.transfer,
              transferLine: s.transferLine || null,
              version: newVersion
            },
            create: {
              id: s.id,
              name: s.name,
              grade: s.grade,
              x: s.x,
              y: s.y,
              pos: s.pos,
              transfer: s.transfer,
              transferLine: s.transferLine || null,
              version: 1
            }
          });
        }

        // 删除该站点的旧商铺，插入新商铺
        await tx.shop.deleteMany({ where: { stationId: s.id } });

        for (const shop of (s.shops || [])) {
          await tx.shop.create({
            data: {
              no: shop.no,
              shortNo: shop.shortNo,
              name: shop.name,
              type: shop.type,
              area: shop.area,
              tenant: shop.tenant,
              contact: shop.contact,
              openDate: shop.openDate,
              status: shop.status,
              remark: shop.remark,
              stationId: s.id
            }
          });
        }
      }

      // 3. 保存全局统计
      if (data.globalStats) {
        await tx.globalStats.upsert({
          where: { id: 1 },
          update: {
            statsDate: data.globalStats.statsDate,
            totalShops: data.globalStats.totalShops,
            rentedShops: data.globalStats.rentedShops,
            vacantShops: data.globalStats.vacantShops,
            rentRate: data.globalStats.rentRate
          },
          create: {
            id: 1,
            statsDate: data.globalStats.statsDate,
            totalShops: data.globalStats.totalShops,
            rentedShops: data.globalStats.rentedShops,
            vacantShops: data.globalStats.vacantShops,
            rentRate: data.globalStats.rentRate
          }
        });
      }

      // 4. 完整同步分级信息 — 删除不在请求中的
      const requestGradeKeys = Object.keys(data.gradeInfo);
      if (requestGradeKeys.length > 0) {
        await tx.gradeInfo.deleteMany({ where: { id: { notIn: requestGradeKeys } } });
      }

      for (const [key, info] of Object.entries(data.gradeInfo)) {
        await tx.gradeInfo.upsert({
          where: { id: key },
          update: {
            name: info.name,
            desc: info.desc,
            color: info.color
          },
          create: {
            id: key,
            name: info.name,
            desc: info.desc,
            color: info.color
          }
        });
      }
    });

    console.log(`数据已保存 [${new Date().toLocaleString()}]`);
    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      versions: updatedVersions
    });
  } catch (err) {
    if (err.message && err.message.startsWith('CONFLICT:')) {
      const parts = err.message.split(':');
      return res.status(409).json({
        error: '版本冲突',
        stationId: parts[1],
        detail: parts[2]
      });
    }
    console.error('保存失败:', err.message);
    res.status(500).json({ error: '数据库保存失败' });
  }
});

// 获取本机 IP
app.get('/api/ip', (req, res) => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  res.json({ ips, port: PORT });
});

// ========== Excel 导入导出 API ==========

const { generateTemplate, generateExport } = require('./tools/excel-export');
const { importExcel } = require('./tools/excel-import');

// 下载空白模板（无需认证）
app.get('/api/template-excel', async (req, res) => {
  try {
    const wb = generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent('11号线商铺信息模板.xlsx')}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('模板生成失败:', err.message);
    res.status(500).json({ error: '模板生成失败' });
  }
});

// 导出全量数据（无需认证）
app.get('/api/export-excel', async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      include: { shops: true },
      orderBy: { x: 'asc' }
    });
    const globalStats = await prisma.globalStats.findUnique({ where: { id: 1 } });
    const gradeInfos = await prisma.gradeInfo.findMany();
    const gradeInfo = {};
    gradeInfos.forEach(g => { gradeInfo[g.id] = { name: g.name, desc: g.desc || '', color: g.color }; });

    const wb = generateExport(stations, globalStats, gradeInfo);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent('轨道交通11号线商铺信息表')}_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出失败:', err.message);
    res.status(500).json({ error: '数据导出失败' });
  }
});

// 上传 Excel 导入（需要认证 + 限流）
app.post('/api/import-excel', authenticateToken, rateLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传 Excel 文件' });
  }
  try {
    const result = await importExcel(req.file.path, prisma);
    // 清理临时文件
    const fs = require('fs');
    fs.unlink(req.file.path, () => {});
    res.json(result);
  } catch (err) {
    console.error('导入失败:', err.message);
    // 清理临时文件
    if (req.file && req.file.path) {
      const fs = require('fs');
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: '导入处理失败：' + err.message });
  }
});

// ========== 静态文件服务（白名单）==========

// HTML 服务 — 注入 nonce 以支持内联样式和脚本，不注入 Token
function serveHtml(htmlPath, req, res) {
  fs.readFile(htmlPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('读取文件失败');
    }

    const nonce = res.locals.nonce || generateNonce();

    // 注入 nonce 到所有 <style> 和 <script> 标签（无 src 属性的内联标签）
    let result = data
      .replace(/<style>/g, `<style nonce="${nonce}">`)
      .replace(/<script type="module">/g, `<script type="module" nonce="${nonce}">`)
      .replace(/<script>/g, `<script nonce="${nonce}">`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(result);
  });
}

// 显式白名单路由
app.get('/', (req, res) => serveHtml(path.join(__dirname, 'index.html'), req, res));
app.get('/index.html', (req, res) => serveHtml(path.join(__dirname, 'index.html'), req, res));
app.get('/battle-map.html', (req, res) => serveHtml(path.join(__dirname, 'battle-map.html'), req, res));
app.get('/data-viz.html', (req, res) => serveHtml(path.join(__dirname, 'data-viz.html'), req, res));

// 允许的前端资源目录
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// 仅暴露 default-data.json，屏蔽其他数据文件
app.get('/data/default-data.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'default-data.json'));
});

// 导出供测试使用
module.exports = { app, authenticateToken, corsMiddleware, setSecurityHeaders, rateLimiter };

// 启动服务器
if (require.main === module) {
  // 安全检查：默认凭证警告
  if (SESSION_SECRET === 'change-me-in-production') {
    console.warn('\n⚠️  ══════════════════════════════════════════');
    console.warn('   警告: SESSION_SECRET 使用默认值！');
    console.warn('   请在 .env 中设置 SESSION_SECRET 为随机字符串。');
    console.warn('   ══════════════════════════════════════════\n');
  }
  if (process.env.AUTH_TOKEN === 'change-me-in-production') {
    console.warn('\n⚠️  ══════════════════════════════════════════');
    console.warn('   警告: AUTH_TOKEN 使用默认值！');
    console.warn('   请在 .env 中设置 AUTH_TOKEN 为随机字符串。');
    console.warn('   ══════════════════════════════════════════\n');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('  苏州地铁11号线商业作战图 服务器已启动');
    console.log('========================================');
    console.log(`\n本机访问: http://localhost:${PORT}`);

    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`局域网访问: http://${iface.address}:${PORT}`);
        }
      }
    }
    console.log('\n按 Ctrl+C 停止服务器');
    console.log('========================================\n');
  });

  // 优雅关闭
  process.on('SIGINT', async () => {
    console.log('\n正在关闭数据库连接...');
    await prisma.$disconnect();
    console.log('数据库已安全关闭');
    process.exit(0);
  });
}
