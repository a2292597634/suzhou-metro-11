## Context

`server.js` 是 Express 5 单文件后端，前端为纯静态 HTML + Vanilla JS (ES Modules)。此前的安全修复引入了 Bearer Token + HTML data 属性注入的认证方案和 `default-src 'self'` CSP，但 GPT 复审发现这些方案存在根本性缺陷。本设计修正这些问题，并同时修复乐观锁、Docker、XSS、校验等方面的遗漏。

## Goals / Non-Goals

**Goals:**
1. Token 不通过任何方式泄露到浏览器可读的 HTML/JS 中
2. CSP 既阻止 XSS 又不阻止合法的内联样式和脚本
3. 乐观锁不可绕过，版本号正确在前后端同步
4. 测试完全隔离于生产数据库
5. Docker 环境开箱即用
6. Seed 不覆盖已有业务数据

**Non-Goals:**
- 不引入完整用户系统（无注册、无 RBAC、无密码重置）
- 不引入 HTTPS（内网部署场景）
- 不修改 Prisma 数据模型（仅补迁移）

## Decisions

### Decision 1: 认证 — HttpOnly 签名 Cookie + 登录端点

**选择**: 新增 `POST /api/login` 端点，验证 `AUTH_TOKEN` 后设置 `cookie-parser` 签名的 HttpOnly Cookie（名 `auth_token`）。前端通过 `credentials: 'include'` 自动携带。Bear Token 仍保留兼容。

**理由**:
- HttpOnly Cookie JavaScript 无法读取，彻底消除 Token 泄露
- 签名防篡改，`sameSite: 'lax'` 防 CSRF
- 保留 Bearer Token 用于 CI 测试和非浏览器调用
- 不引入 JWT——这是内部工具，共享密钥足够，JWT 的签发/刷新/过期在此场景下是过度设计

**替代方案**:
- 纯 JWT 方案：需要签发/验证/过期逻辑，复杂度过高
- 仅 Bearer Token（不改为 Cookie）：无法解决 Token 泄露到 HTML 的问题

### Decision 2: CSP — Nonce 机制

**选择**: 每个请求生成 `crypto.randomBytes(16)` 随机 nonce，注入两个位置：
1. CSP header: `style-src 'self' 'nonce-<N>' https://cdn.jsdelivr.net; script-src 'self' 'nonce-<N>'`
2. HTML: `<style>` → `<style nonce="<N>">`，`<script type="module">` → `<script type="module" nonce="<N>">`

**流程**:
```
请求 → setSecurityHeaders 生成 nonce → res.locals.nonce = nonce
     → CSP header 包含 nonce
     → serveHtml 读取 res.locals.nonce
     → 正则替换 <style> 和 <script> 标签注入 nonce
```

**理由**:
- Nonce 是 CSP Level 2 标准机制，不会降低安全性
- 比 `'unsafe-inline'` 安全——只有服务端生成的 nonce 匹配的脚本才执行
- 项目无外部托管的内联脚本，nonce 替换完全可控

**替代方案**:
- `'unsafe-inline'`：简单但完全放弃 CSP 对内联脚本的防护
- Hash 机制：需要为每个内联块计算 SHA，HTML 改动后需更新 hash，维护成本高

### Decision 3: 乐观锁 — 严格 null-check + 返回新版本

**选择**: 
- 版本检查：`s.version != null && s.version !== existing.version`（`== null` 覆盖 undefined 和 null）
- 响应格式：`{ success: true, updatedAt: "...", versions: { "stationId": N } }`
- 前端：`saveData()` 解析 `versions` 更新 `station.version`
- 409 处理：返回 `{ success: false, conflict: true }`，不在 catch 中回退 localStorage

**理由**:
- `!= null` 确保 `version: 0` 也必须参与校验（0 是合法的新建站点版本）
- 前端获取新版本是乐观锁闭环的关键——否则第二次保存必然冲突
- 409 不应该被静默回退——冲突意味着数据不一致，应提示用户刷新

### Decision 4: 测试隔离 — .env.test + globalSetup

**选择**: 通过 `vitest.config.js` 的 `config({ path: '.env.test' })` 加载测试专用环境变量，覆盖 `DATABASE_URL` 指向 `suzhou_metro_test`。`globalSetup` 在测试启动前运行 `prisma migrate deploy`，`setupFiles` 清理数据。

**流程**:
```
vitest.config.js 加载 .env.test
  → globalSetup: prisma migrate deploy（到 suzhou_metro_test）
  → setupFile: beforeAll 清理所有表
  → 测试执行
  → setupFile: afterAll 断开 prisma
```

**理由**:
- `.env.test` 显式声明测试数据库，一目了然
- `globalSetup` + `setupFiles` 是 Vitest 标准机制
- 优雅降级：DB 不可用时 `globalSetup` 设置 `TEST_DB_AVAILABLE=0`，`setupFile` 跳过 DB 操作

### Decision 5: Seed 幂等 — 存在性检查而非 upsert

**选择**: 在 seed.js 的 `main()` 开头检查 `prisma.station.count() > 0`，有数据则跳过。`--force` 参数强制覆盖。

**理由**:
- 现有 spec `docker-init` 要求 "不覆盖现有数据"，但原实现 `upsert` 会覆盖 name/grade/x/y
- 简单计数检查比逐个 upsert 的语义更清晰——要么全量 seed，要么跳过
- `--force` 提供显式的覆盖手段

### Decision 6: 限流 — 内存 Map

**选择**: 每 IP 每分钟最多 30 次 `POST /api/data`，使用内存 Map + `setInterval` 清理。不持久化，服务重启后重置。

**理由**:
- 项目规模小（单服务实例），内存方案足够
- 不需要 Redis 等外部依赖
- 每分钟 30 次对正常编辑操作绰绰有余

## 目录树

```
项目根目录/
├── server.js                        # [修改] 认证、CSP nonce、乐观锁、Zod、限流
├── .env                             # [修改] 新增 SESSION_SECRET
├── .env.example                     # [修改] 新增 SESSION_SECRET
├── .env.test                        # [新增] 测试数据库连接
├── vitest.config.js                 # [修改] 加载 .env.test + globalSetup
├── docker-compose.yml               # [修改] 添加环境变量
├── Dockerfile                       # [不变] CMD 中 seed 自带幂等
├── package.json                     # [修改] cookie-parser, wait-on
├── prisma/
│   ├── schema.prisma                # [不变]
│   ├── seed.js                      # [修改] 存在性检查 + --force
│   └── migrations/
│       └── 20260611000001_add_version_column/
│           └── migration.sql        # [新增] 幂等 ALTER TABLE
├── js/modules/
│   ├── state.js                     # [修改] authToken → isAuthenticated
│   ├── data.js                      # [修改] login/checkAuth, credentials, versions
│   ├── render.js                    # [修改] XSS 转义补充
│   └── viz.js                       # [修改] 属性值转义
├── tests/
│   ├── globalSetup.js               # [新增] 测试 DB 迁移
│   ├── setupFile.js                 # [新增] 测试 DB 清理
│   ├── server-security.test.js      # [修改] 适配新认证
│   ├── state.test.js                # [修改] authToken → isAuthenticated
│   ├── data.test.js                 # [修改] 适配 credentials/409/401
│   ├── integration/
│   │   ├── auth-data-flow.test.js   # [修改] 适配新认证
│   │   └── viz-data.test.js         # [修改] mock 修复
│   └── ...
└── .github/workflows/
    └── test.yml                     # [修改] 创建测试数据库
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Cookie 不支持跨域（不同端口） | CORS 已添加 `Access-Control-Allow-Credentials: true`，前端 `credentials: 'include'` |
| 限流在内存中，多实例不同步 | 当前为单实例部署，未来如需多实例可迁移到 Redis |
| CSP nonce 注入用正则替换 `<style>` | 正则仅匹配 `<style>` 和 `<script>` 标签的起始标记，不会误伤外部引用的标签（`<script src="...">` 不匹配） |
| seed `--force` 会删除所有业务数据 | `--force` 必须有用户显式传入，不会在 Docker CMD 或 npm script 中自动使用 |
| Supertest 不自动保存 Cookie | 测试中需手动从 `loginRes.headers['set-cookie']` 提取并传入后续请求的 `Cookie` header |

## Migration Plan

1. **配置准备**: `.env` 添加 `SESSION_SECRET`，`.env.test` 新建
2. **依赖安装**: `npm install cookie-parser wait-on`
3. **数据库迁移**: 先手动执行 `npx prisma migrate deploy` 到生产库以创建 `version` 列；CI 自动创建测试库
4. **服务部署**: 更新 `server.js` 后重启服务
5. **前端更新**: 刷新浏览器即可（无构建步骤），首次保存前需调用 `login()`
6. **回滚**: `git checkout` 上一版本 + 重启服务

## Open Questions

1. **登录 UI**：当前无登录页面。前端在首次 `saveData()` 遇到 401 时应该弹出登录框还是跳转到独立登录页？建议先用简单的 `prompt()` 方案，保持改动最小。

2. **Cookie 过期时间**：当前设为 24 小时。对于需要整日编辑的场景是否足够？是否需要可配置的过期时间？建议当前硬编码 24h，后续有需求再加环境变量。

3. **限流阈值**：每分钟 30 次的阈值是否合适？正常编辑操作（打开页面 → 逐个站点修改 → 保存）远低于此阈值，但批量导入场景可能触发。建议先设为 30，后续按实际使用调整。

## 测试架构设计

### 测试分层策略

| 层级 | 覆盖范围 | 工具 | 文件位置 |
|------|---------|------|---------|
| 单元测试 | 认证中间件（login/logout/authenticateToken）、CSP 中间件、限流中间件、Zod schema | Vitest + supertest | `tests/server-security.test.js` |
| 单元测试 | state.isAuthenticated 初始化、data.js 的 login/saveData credentials | Vitest + jsdom + mock fetch | `tests/state.test.js`、`tests/data.test.js` |
| 单元测试 | render.js SVG/gradePanel 转义、viz.js 属性转义 | Vitest + jsdom | `tests/render.test.js`、`tests/viz.test.js` |
| 集成测试 | login → Cookie → POST /api/data → versions 返回完整链路 | Vitest + supertest | `tests/integration/auth-data-flow.test.js` |

### 需要 Mock 的外部依赖

- **Prisma Client**: 服务端测试的 DB 操作（需要测试数据库可用，不可用时优雅跳过）
- **fetch**: 前端 `data.js` 测试需要 mock `global.fetch`
- **Cookie/supertest**: 集成测试需手动管理 Cookie 传递
- **crypto.randomBytes**: CSP nonce 测试不 mock，验证真实 nonce 生成逻辑
