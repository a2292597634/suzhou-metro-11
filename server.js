/**
 * 苏州地铁11号线商业作战图 - 本地服务器
 * 功能：提供静态文件 + SQLite数据库API
 * 启动：node server.js
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON body
app.use(express.json({ limit: '10mb' }));

// 跨域支持（允许局域网内其他设备访问）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 确保数据目录存在
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化 SQLite 数据库
const DB_PATH = path.join(DATA_DIR, 'battle-map.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('SQLite 数据库已连接:', DB_PATH);
  }
});

// 创建数据表
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS battle_map (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('建表失败:', err.message);
    else console.log('数据表已就绪');
  });
});

// ========== API 路由 ==========

// 获取数据
app.get('/api/data', (req, res) => {
  db.get('SELECT data, updated_at FROM battle_map WHERE id = 1', (err, row) => {
    if (err) {
      console.error('读取失败:', err.message);
      return res.status(500).json({ error: '数据库读取失败' });
    }
    if (!row) {
      return res.json({ data: null, updatedAt: null });
    }
    try {
      const data = JSON.parse(row.data);
      res.json({ data, updatedAt: row.updated_at });
    } catch (e) {
      res.status(500).json({ error: '数据解析失败' });
    }
  });
});

// 保存数据
app.post('/api/data', (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: '缺少 data 字段' });
  }
  
  const jsonStr = JSON.stringify(data);
  
  db.run(
    'INSERT OR REPLACE INTO battle_map (id, data, updated_at) VALUES (1, ?, datetime("now"))',
    [jsonStr],
    function(err) {
      if (err) {
        console.error('保存失败:', err.message);
        return res.status(500).json({ error: '数据库保存失败' });
      }
      console.log(`数据已保存 [${new Date().toLocaleString()}]`);
      res.json({ success: true, updatedAt: new Date().toISOString() });
    }
  );
});

// 获取本机 IP（方便同事访问）
app.get('/api/ip', (req, res) => {
  const os = require('os');
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

// ========== 静态文件服务 ==========

// 根路径返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 静态资源
app.use(express.static(__dirname));

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('  苏州地铁11号线商业作战图 服务器已启动');
  console.log('========================================');
  console.log(`\n本机访问: http://localhost:${PORT}`);
  
  // 显示局域网 IP
  const os = require('os');
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
process.on('SIGINT', () => {
  console.log('\n正在关闭数据库连接...');
  db.close((err) => {
    if (err) console.error(err.message);
    else console.log('数据库已安全关闭');
    process.exit(0);
  });
});
