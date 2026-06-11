## Why

经过 GPT 对前期安全修复的复审，发现系统仍存在 9 个缺陷，其中 2 个严重、5 个高优先级、2 个中等。这些缺陷涉及认证安全、测试破坏生产数据、数据库迁移遗漏、CSP 阻止正常功能、乐观锁绕过、Docker 不可用、seed 数据覆盖、XSS 遗漏、校验不完整。必须在一个 change 中一次性修复所有问题。

## What Changes

### 认证改造（严重）
- **BREAKING** 删除 `injectAuthToken()` 函数，不再将 `AUTH_TOKEN` 注入 HTML `data-auth-token` 属性
- **BREAKING** `state.js` 移除 `authToken` 字段，改为 `isAuthenticated` 布尔字段
- 新增 `POST /api/login` 端点，验证密码后设置 HttpOnly 签名 Cookie
- 新增 `POST /api/logout`、`GET /api/auth-status` 端点
- `authenticateToken` 中间件同时支持签名 Cookie 和 Bearer header
- 新增依赖 `cookie-parser`，新增加密环境变量 `SESSION_SECRET`
- 前端 `data.js` 新增 `login()`/`checkAuth()` 函数，`saveData()` 改用 `credentials: 'include'`

### 测试隔离（严重）
- 新增 `.env.test` 文件指向独立测试数据库 `suzhou_metro_test`
- `vitest.config.js` 加载 `.env.test`，配置 `globalSetup` 和 `setupFiles`
- 新增 `tests/globalSetup.js`：运行 `prisma migrate deploy` 到测试库
- 新增 `tests/setupFile.js`：每个测试文件前清理数据
- CI workflow 创建独立 `suzhou_metro_test` 数据库并运行迁移
- 测试文件移除硬编码 `DATABASE_URL`

### 数据库迁移（高）
- 新增幂等迁移 `20260611000001_add_version_column/migration.sql` 添加 `version` 列

### CSP Nonce 机制（高）
- CSP header 改为使用每请求随机 nonce，支持内联 `<style>` 和 `<script>`
- `serveHtml()` 函数注入 nonce 到 `<style>` 和 `<script>` 标签

### 乐观锁修复（高）
- 版本检查改为 `s.version != null && s.version !== existing.version`（不再可被 0 绕过）
- 保存接口返回 `versions: { stationId: newVersion }`
- 前端 `saveData()` 解析响应更新各站点 `version`
- 409 冲突时返回 `{ success: false, conflict: true }`，不退回 localStorage

### Docker + Seed 修复（高）
- `docker-compose.yml` 添加 `AUTH_TOKEN`、`ALLOWED_ORIGINS`、`SESSION_SECRET`
- `prisma/seed.js` 检查 `station.count() > 0` 跳过已有数据，`--force` 参数强制覆盖

### XSS 补充修复（中）
- `render.js` SVG 渲染中站点名称和换乘线路使用 `escapeHtml()`
- `render.js` `renderGradePanel` 中 grade key 做白名单校验 + 转义
- `viz.js` `renderCard` 中 `data-id` 和 `data-grade` 属性值使用 `escapeHtml()`

### Zod 增强 + 限流 + wait-on（中）
- 所有 Zod schema 添加 `.max()` 长度限制、`.max(100)` 数组规模限制
- `dataSchema.refine()` 检查重复站点 ID
- 新增 `rateLimiter` 中间件（每 IP 每分钟 30 次写请求）
- `package.json` devDependencies 添加 `wait-on`

## Capabilities

### Modified Capabilities
- `api-authentication`: 彻底改写认证方案为 HttpOnly Cookie + 登录端点
- `api-config`: CSP 改为 nonce 机制；CORS 添加 `Access-Control-Allow-Credentials`
- `data-sync-and-validation`: 乐观锁修复；Zod 增强；限流
- `frontend-xss-protection`: 补充 SVG 渲染和 viz 卡片中的转义遗漏
- `docker-init`: 添加缺失环境变量；seed 幂等改进

### New Capabilities
- `test-isolation`: 测试使用独立数据库，测试前后自动化隔离

## Impact

| 文件/目录 | 变更内容 |
|----------|---------|
| `server.js` | 重写认证（删除 injectAuthToken，添加 login/logout/auth-status 端点，cookie 支持），CSP nonce 机制，乐观锁修复，Zod 增强，限流中间件 |
| `js/modules/state.js` | `authToken` → `isAuthenticated` |
| `js/modules/data.js` | 新增 `login()`/`checkAuth()`；`saveData()` 改用 credentials、解析 versions、处理 409/401 |
| `js/modules/render.js` | SVG 中站点名/换乘线名 escapeHtml，grade key 白名单+转义 |
| `js/modules/viz.js` | `data-id`/`data-grade` 属性值 escapeHtml |
| `.env` | 新增 `SESSION_SECRET` |
| `.env.example` | 新增 `SESSION_SECRET` |
| `.env.test` (新) | 测试数据库连接 + 测试用密钥 |
| `vitest.config.js` | 加载 `.env.test`，新增 globalSetup/setupFiles |
| `tests/globalSetup.js` (新) | 测试数据库迁移部署 |
| `tests/setupFile.js` (新) | 测试数据清理 |
| `tests/server-security.test.js` | 适配新认证方案（登录、Cookie、限流、CSP nonce） |
| `tests/integration/auth-data-flow.test.js` | 适配新认证方案，移除 data-auth-token 断言 |
| `tests/state.test.js` | `authToken` → `isAuthenticated` |
| `tests/data.test.js` | 适配 credentials 模式、409/401 处理、版本更新 |
| `tests/integration/viz-data.test.js` | 修复 mock 返回值 |
| `docker-compose.yml` | 添加 AUTH_TOKEN、ALLOWED_ORIGINS、SESSION_SECRET |
| `Dockerfile` | 无需修改（seed 已内置幂等检查） |
| `prisma/seed.js` | 添加数据存在性检查和 `--force` 参数 |
| `prisma/migrations/20260611000001_add_version_column/` (新) | version 列迁移 |
| `.github/workflows/test.yml` | 创建测试数据库，使用 `suzhou_metro_test` |
| `package.json` | devDependencies 添加 `wait-on`；dependencies 添加 `cookie-parser` |

## 测试策略

依据 `openspec/testing-strategy.md` 变更类型映射表：

| 变更类型 | 映射结果 |
|---------|---------|
| 修改模块（state.js、data.js、render.js、viz.js） | 单元 ✅ 必做 |
| 修改后端（认证中间件、CSP、乐观锁、限流） | 单元 ✅ 必做 |
| 模块间联动（登录 → Cookie → 保存 → 版本更新） | 集成 ✅ 必做 |
| 新增测试基础设施（.env.test、globalSetup） | 基础设施配置 ✅ 必做（在 tasks 中显式列出） |

- **单元测试**：`tests/server-security.test.js`（认证/登录/CSP/CORS）、`tests/state.test.js`（isAuthenticated）、`tests/data.test.js`（credentials/409/401）、`tests/render.test.js`（XSS 转义）、`tests/viz.test.js`（属性转义）
- **集成测试**：`tests/integration/auth-data-flow.test.js`（登录→Cookie→写数据 完整链路）
- E2E 测试本次不新增（修改的是后端安全机制，现有 E2E 适配即可）

## 成功标准

- [ ] `POST /api/login` 正确密码返回 200 + HttpOnly Cookie；错误密码返回 401
- [ ] Cookie 认证和 Bearer Token 均可用于 `POST /api/data`
- [ ] HTML 页面不再包含明文 Token（无 `data-auth-token`）
- [ ] CSP header 包含随机 nonce，内联样式/脚本不再被浏览器阻止
- [ ] 乐观锁 `version: 0` 或 `version: undefined` 不可绕过检查
- [ ] 保存成功后接口返回 `versions` 映射，前端更新 `station.version`
- [ ] 409 冲突时不退回 localStorage
- [ ] `npm test` 不连接生产数据库
- [ ] 测试数据库在测试前自动迁移、测试后自动清理
- [ ] `docker-compose.yml` 包含所有必需环境变量
- [ ] seed 在数据库有数据时跳过，`--force` 参数可强制覆盖
- [ ] `prisma migrate deploy` 成功创建 `version` 列
- [ ] render.js 和 viz.js 中所有 innerHTML 注入点均已转义
- [ ] Zod 拒绝超长字符串、超大数组、重复站点 ID
- [ ] 写接口限流生效（超过阈值返回 429）
- [ ] 所有 18 个测试文件 223+ 个测试通过
