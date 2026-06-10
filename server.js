/**
 * 苏州地铁11号线商业作战图 - 本地服务器
 * 功能：提供静态文件 + PostgreSQL数据库API (Prisma ORM)
 * 启动：node server.js
 */

require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { z } = require('zod');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON body
app.use(express.json({ limit: '10mb' }));

// 认证中间件 — 校验 Bearer Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: '未授权，缺少认证信息' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: '未授权，Token 格式不正确' });
  }

  const token = parts[1];
  const expectedToken = process.env.AUTH_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return res.status(401).json({ error: '未授权，Token 无效' });
  }

  next();
}

// CSP Header 中间件
function setSecurityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
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
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}

app.use(setSecurityHeaders);
app.use(corsMiddleware);

// ========== API 路由 ==========

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

// Zod 校验 schemas
const shopSchema = z.object({
  no: z.number().int().min(0),
  shortNo: z.string().optional().default(''),
  name: z.string().min(1),
  type: z.string().optional().default('商铺'),
  area: z.number().min(0).optional().default(0),
  tenant: z.string().optional().default(''),
  contact: z.string().optional().default(''),
  openDate: z.string().optional().default(''),
  status: z.enum(['营业中', '未出租', '装修中']).optional().default('未出租'),
  remark: z.string().optional().default('')
});

const stationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  grade: z.enum(['S', 'A', 'B', 'C']),
  x: z.number().int().min(0).max(3000),
  y: z.number().int().min(0).max(3000),
  pos: z.enum(['top', 'bottom', 'left', 'right']),
  transfer: z.boolean().optional().default(false),
  transferLine: z.string().nullable().optional(),
  shops: z.array(shopSchema).optional().default([]),
  version: z.number().int().min(0).optional().default(0)
});

const globalStatsSchema = z.object({
  statsDate: z.string().optional().default(''),
  totalShops: z.number().int().min(0).optional().default(0),
  rentedShops: z.number().int().min(0).optional().default(0),
  vacantShops: z.number().int().min(0).optional().default(0),
  rentRate: z.string().optional().default('')
});

const gradeInfoSchema = z.record(z.string(), z.object({
  name: z.string().min(1),
  desc: z.string().optional().default(''),
  color: z.string().min(1)
}));

const dataSchema = z.object({
  stations: z.array(stationSchema).optional().default([]),
  globalStats: globalStatsSchema.nullable().optional(),
  gradeInfo: gradeInfoSchema.optional().default({})
});

// 保存数据（需要认证）
app.post('/api/data', authenticateToken, async (req, res) => {
  // Zod 校验
  const result = dataSchema.safeParse(req.body.data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({ error: '数据校验失败', details: errors });
  }

  const data = result.data;

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

      // 2. 保存站点和商铺（带版本号校验）
      for (const s of data.stations) {
        const existing = await tx.station.findUnique({ where: { id: s.id } });

        // 乐观锁校验
        if (existing && s.version && existing.version !== s.version) {
          throw new Error(`CONFLICT:${s.id}:期望版本 ${s.version}，实际版本 ${existing.version}`);
        }

        const newVersion = (existing?.version || 0) + 1;

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
    res.json({ success: true, updatedAt: new Date().toISOString() });
  } catch (err) {
    if (err.message && err.message.startsWith('CONFLICT:')) {
      const parts = err.message.split(':');
      return res.status(409).json({ error: '版本冲突', stationId: parts[1], detail: parts[2] });
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

// ========== 静态文件服务（白名单）==========

// 注入 data-auth-token 到 HTML
function injectAuthToken(htmlPath, res) {
  fs.readFile(htmlPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('读取文件失败');
    }
    const token = process.env.AUTH_TOKEN || '';
    const injected = data.replace(
      '<html lang="zh-CN"',
      `<html lang="zh-CN" data-auth-token="${token}"`
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(injected);
  });
}

// 显式白名单路由
app.get('/', (req, res) => injectAuthToken(path.join(__dirname, 'index.html'), res));
app.get('/index.html', (req, res) => injectAuthToken(path.join(__dirname, 'index.html'), res));
app.get('/battle-map.html', (req, res) => injectAuthToken(path.join(__dirname, 'battle-map.html'), res));
app.get('/data-viz.html', (req, res) => injectAuthToken(path.join(__dirname, 'data-viz.html'), res));

// 允许的前端资源目录
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 导出供测试使用
module.exports = { app, authenticateToken, corsMiddleware, setSecurityHeaders, injectAuthToken };

// 启动服务器
if (require.main === module) {
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
