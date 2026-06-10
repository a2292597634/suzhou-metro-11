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

// 保存数据（需要认证）
app.post('/api/data', authenticateToken, async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: '缺少 data 字段' });
  }

  try {
    // 使用事务保存所有数据
    await prisma.$transaction(async (tx) => {
      // 1. 保存站点和商铺
      for (const s of (data.stations || [])) {
        await tx.station.upsert({
          where: { id: s.id },
          update: {
            name: s.name,
            grade: s.grade,
            x: s.x,
            y: s.y,
            pos: s.pos,
            transfer: s.transfer || false,
            transferLine: s.transferLine || null
          },
          create: {
            id: s.id,
            name: s.name,
            grade: s.grade,
            x: s.x,
            y: s.y,
            pos: s.pos,
            transfer: s.transfer || false,
            transferLine: s.transferLine || null
          }
        });

        // 删除该站点的旧商铺
        await tx.shop.deleteMany({ where: { stationId: s.id } });

        // 插入新商铺
        for (const shop of (s.shops || [])) {
          await tx.shop.create({
            data: {
              no: shop.no,
              shortNo: shop.shortNo || '',
              name: shop.name,
              type: shop.type || '商铺',
              area: shop.area || 0,
              tenant: shop.tenant || '',
              contact: shop.contact || '',
              openDate: shop.openDate || '',
              status: shop.status || '未出租',
              remark: shop.remark || '',
              stationId: s.id
            }
          });
        }
      }

      // 2. 保存全局统计
      if (data.globalStats) {
        await tx.globalStats.upsert({
          where: { id: 1 },
          update: {
            statsDate: data.globalStats.statsDate || '',
            totalShops: data.globalStats.totalShops || 0,
            rentedShops: data.globalStats.rentedShops || 0,
            vacantShops: data.globalStats.vacantShops || 0,
            rentRate: data.globalStats.rentRate || ''
          },
          create: {
            id: 1,
            statsDate: data.globalStats.statsDate || '',
            totalShops: data.globalStats.totalShops || 0,
            rentedShops: data.globalStats.rentedShops || 0,
            vacantShops: data.globalStats.vacantShops || 0,
            rentRate: data.globalStats.rentRate || ''
          }
        });
      }

      // 3. 保存分级信息
      if (data.gradeInfo) {
        for (const [key, info] of Object.entries(data.gradeInfo)) {
          await tx.gradeInfo.upsert({
            where: { id: key },
            update: {
              name: info.name || '',
              desc: info.desc || '',
              color: info.color || ''
            },
            create: {
              id: key,
              name: info.name || '',
              desc: info.desc || '',
              color: info.color || ''
            }
          });
        }
      }
    });

    console.log(`数据已保存 [${new Date().toLocaleString()}]`);
    res.json({ success: true, updatedAt: new Date().toISOString() });
  } catch (err) {
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
