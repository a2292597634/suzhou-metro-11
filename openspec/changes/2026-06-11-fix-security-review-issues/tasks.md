# Tasks: 修复 GPT 复审指出的全部安全与功能缺陷

> 每个功能点严格执行 TDD（Red → Green → Refactor）

## 依赖关系

```
1. 准备工作
   └─ 2. 数据库迁移 ─┐
   └─ 3. 测试基础设施 ─┤
                      ├─ 4. 认证改造 ────── 6. 乐观锁修复
                      ├─ 5. CSP Nonce    ├─ 7. Docker + Seed
                      └─ 8. XSS 补充修复 └─ 9. Zod 增强 + 限流
                                               └─ 10. 回归测试
```

---

## 1. 准备工作

### 1.1 安装依赖
- [ ] `npm install cookie-parser`
- [ ] `npm install -D wait-on`
- [ ] 确认 `package.json` 中 `cookie-parser` 在 dependencies、`wait-on` 在 devDependencies

### 1.T 验证依赖
- [ ] `node -e "require('cookie-parser')"` 不报错
- [ ] `npx wait-on --version` 正常输出

---

## 2. 数据库迁移（`prisma/migrations/`）

> 迁移为纯 DDL，无业务逻辑，豁免 TDD。但必须验证迁移成功执行。

### 2.1 创建 version 列迁移
- [ ] 新建目录 `prisma/migrations/20260611000001_add_version_column/`
- [ ] 创建 `migration.sql`：使用 `DO $$ ... IF NOT EXISTS` 幂等添加 `version INTEGER NOT NULL DEFAULT 1`

### 2.T 验证迁移
- [ ] `npx prisma migrate deploy` 在已有 Station 表上成功执行，不报错
- [ ] 再次运行不报错（幂等验证）
- [ ] 数据库 Station 表包含 `version` 列

---

## 3. 测试基础设施（`tests/`）

### 3.1 创建 .env.test
- [ ] 新建 `.env.test`，`DATABASE_URL` 指向 `suzhou_metro_test`
- [ ] 包含 `AUTH_TOKEN`、`ALLOWED_ORIGINS`、`SESSION_SECRET` 测试用值

### 3.2 创建 globalSetup.js
- [ ] 新建 `tests/globalSetup.js`：检测 `DATABASE_URL` 含 `_test`，运行 `prisma migrate deploy`
- [ ] DB 不可用时设置 `TEST_DB_AVAILABLE=0`，不抛异常

### 3.3 创建 setupFile.js
- [ ] 新建 `tests/setupFile.js`：`beforeAll` 清理四张表，`afterAll` 断开 prisma
- [ ] 仅在 `TEST_DB_AVAILABLE=1` 时执行

### 3.4 更新 vitest.config.js
- [ ] 使用 `dotenv.config({ path: '.env.test' })` 加载测试环境变量
- [ ] 添加 `globalSetup: ['tests/globalSetup.js']` 和 `setupFiles: ['tests/setupFile.js']`

### 3.5 更新 CI workflow
- [ ] `test.yml` 添加 `CREATE DATABASE suzhou_metro_test` 步骤
- [ ] 所有步骤的 `DATABASE_URL` 改为 `suzhou_metro_test`
- [ ] 添加 `SESSION_SECRET` 环境变量

### 3.T 验证测试隔离
- [ ] **Red**: 运行 `npm test` 预期因 DB 不可用而部分测试跳过（但测试流程不崩溃）
- [ ] **Green**: 无

---

## 4. 认证改造（`server.js`、`js/modules/state.js`、`js/modules/data.js`）

### 4.T 写认证测试（Red）
- [ ] 更新 `tests/server-security.test.js`：
  - [ ] 新增 Cookie 登录测试（正确密码 200+Set-Cookie、错误密码 401）
  - [ ] 新增 `/api/auth-status` 测试
  - [ ] 新增 `/api/logout` 测试
  - [ ] 修改无认证测试期望错误信息为 `'未授权，请先登录'`
  - [ ] 修改 HTML 测试：断言不含 `data-auth-token`、不含明文 Token
  - [ ] 修改 Bearer 认证测试适配新错误信息
- [ ] 更新 `tests/state.test.js`：`authToken` → `isAuthenticated` 测试
- [ ] 更新 `tests/data.test.js`：
  - [ ] 新增 `saveData()` 使用 `credentials: 'include'` 测试
  - [ ] 新增 `login()` 成功/失败测试
  - [ ] 新增 `checkAuth()` 测试
- [ ] 更新 `tests/integration/auth-data-flow.test.js`：
  - [ ] 新增 login → Cookie → POST 完整链路测试
  - [ ] 修改无认证测试期望 `'未授权，请先登录'`
  - [ ] 修改 HTML Token 测试：断言不含
- [ ] 运行测试确认全部 **失败**（Red）

### 4.2 实现服务端认证改造（Green）
- [ ] `server.js`：添加 `cookieParser(SESSION_SECRET)`
- [ ] 添加 `POST /api/login`、`POST /api/logout`、`GET /api/auth-status` 端点
- [ ] 修改 `authenticateToken`：优先检查签名 Cookie，其次 Bearer header
- [ ] 删除 `injectAuthToken()` 函数
- [ ] 修改 `serveHtml()`：移除 Token 注入逻辑，保留 nonce 注入（后续 task 5 完成）
- [ ] 错误消息统一为 `'未授权，请先登录'`
- [ ] module.exports 添加导出项

### 4.3 实现前端认证改造（Green）
- [ ] `js/modules/state.js`：`authToken` → `isAuthenticated: false`
- [ ] `js/modules/data.js`：
  - [ ] 新增 `login(password)` 函数
  - [ ] 新增 `checkAuth()` 函数
  - [ ] `saveData()`：改用 `credentials: 'include'`，移除 `Authorization` header
  - [ ] `saveData()`：处理 409（conflict）和 401（needLogin）响应
- [ ] 运行测试确认全部 **通过**（Green）

### 4.4 重构（Refactor）
- [ ] 运行完整测试确认没有退化
- [ ] 确认 HTML 输出不含 Token（grep 验证）

---

## 5. CSP Nonce 机制（`server.js`）

### 5.T 写 CSP nonce 测试（Red）
- [ ] 更新 `tests/server-security.test.js` CSP 段：
  - [ ] 验证 CSP header 包含 `nonce-<base64-string>`
  - [ ] 验证 HTML 中 `<style>` 标签包含 `nonce="..."` 属性
  - [ ] 验证 HTML 中 `<script type="module">` 标签包含 `nonce="..."` 属性
  - [ ] 验证有 `src` 属性的 `<script>` 不被注入 nonce
  - [ ] 验证外部 CDN 在 `style-src` 和 `font-src` 中
- [ ] 运行确认 **失败**（Red）

### 5.2 实现 CSP nonce（Green）
- [ ] `server.js` 新增 `generateNonce()` 函数（`crypto.randomBytes(16).toString('base64')`）
- [ ] `setSecurityHeaders`：生成 nonce 存入 `res.locals.nonce`
- [ ] CSP header 更新为：`default-src 'self'; style-src 'self' 'nonce-<N>' https://cdn.jsdelivr.net; script-src 'self' 'nonce-<N>'; img-src 'self' data:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'`
- [ ] `serveHtml()`：正则替换 `<style>` → `<style nonce="<N>">`、`<script type="module">` → `<script type="module" nonce="<N>">`、`<script>` → `<script nonce="<N>">`
- [ ] 运行确认 **通过**（Green）

---

## 6. 乐观锁修复（`server.js` + `js/modules/data.js`）

### 6.T 写乐观锁测试（Red）
- [ ] 更新 `tests/server-security.test.js` / `tests/data.test.js`：
  - [ ] 测试 `version: 0` 时冲突（不能绕过）
  - [ ] 测试 `version: undefined` 时通过（兼容旧数据）
  - [ ] 测试 409 响应格式 `{ error, stationId, detail }`
- [ ] 更新 `tests/data.test.js`：
  - [ ] 测试 `saveData()` 解析 `versions` 更新 `station.version`
  - [ ] 测试 409 返回 `{ success: false, conflict: true }` 且不调用 `saveToLocal()`
  - [ ] 测试 401 返回 `{ success: false, needLogin: true }`
- [ ] 运行确认 **失败**（Red）

### 6.2 实现乐观锁修复（Green）
- [ ] `server.js`：版本检查改为 `if (existing && s.version != null && s.version !== existing.version)`
- [ ] `server.js`：构建 `updatedVersions` 对象，保存成功后返回 `{ versions: {...} }`
- [ ] `js/modules/data.js`：`saveData()` 解析 `versions` 更新各站点版本
- [ ] `js/modules/data.js`：409 返回 `conflict: true`，不回落 localStorage
- [ ] `js/modules/data.js`：401 返回 `needLogin: true`
- [ ] 运行确认 **通过**（Green）

---

## 7. Docker + Seed 修复

> 配置文件修改 + seed 幂等逻辑，豁免 TDD 但需手动验证。

### 7.1 更新 docker-compose.yml
- [ ] 在 `app` 服务的 `environment` 中添加 `AUTH_TOKEN`、`ALLOWED_ORIGINS`、`SESSION_SECRET`
- [ ] 使用 `${VAR:-default}` 语法提供 fallback

### 7.2 更新 prisma/seed.js
- [ ] `main()` 开头检查 `prisma.station.count() > 0`，有数据则跳过
- [ ] 添加 `--force` 参数支持：清空所有表后重新导入
- [ ] 打印清晰的状态信息

### 7.3 更新 .env 和 .env.example
- [ ] `.env` 添加 `SESSION_SECRET="suzhou-metro-11-session-secret-2024"`
- [ ] `.env.example` 添加 `SESSION_SECRET="your-session-secret-here"`

### 7.T 验证
- [ ] 手动测试：`node prisma/seed.js --force` 强制覆盖
- [ ] 手动测试：`node prisma/seed.js`（有数据时）跳过
- [ ] 手动测试：`docker compose up` 正常启动

---

## 8. XSS 补充修复（`render.js`、`viz.js`）

### 8.T 写 XSS 测试（Red）
- [ ] 更新 `tests/render.test.js`：
  - [ ] 测试站点名称含 HTML 标签时 SVG text 已转义
  - [ ] 测试换乘线路名含 HTML 标签时 SVG text 已转义
  - [ ] 测试 `renderGradePanel` 对非法 key（如 `<script>`）回退到 C 且转义
- [ ] 更新 `tests/viz.test.js`：
  - [ ] 测试 `station.id` 含引号时 `data-id` 属性值已转义
- [ ] 运行确认 **失败**（Red）

### 8.2 实现 XSS 修复（Green）
- [ ] `js/modules/render.js` line 104：`escapeHtml(s.name.replace('站', ''))`
- [ ] `js/modules/render.js` line 111：`escapeHtml(s.transferLine)`
- [ ] `js/modules/render.js` `renderGradePanel`：`validGrades` 白名单 + `escapeHtml(key)`
- [ ] `js/modules/viz.js` line 172：`escapeHtml(station.id)`、`escapeHtml(grade)`
- [ ] 运行确认 **通过**（Green）

---

## 9. Zod 增强 + 限流（`server.js`）

### 9.T 写增强校验测试（Red）
- [ ] 更新 `tests/server-security.test.js`：
  - [ ] 测试超长 name（> 100）返回 400
  - [ ] 测试超长 remark（> 500）返回 400
  - [ ] 测试 stations 数组 > 100 返回 400
  - [ ] 测试重复 ID 返回 400
  - [ ] 新增限流测试：短时间内 > 30 次请求返回 429
- [ ] 运行确认 **失败**（Red）

### 9.2 实现 Zod 增强（Green）
- [ ] 所有 `shopSchema` 字符串字段加 `.max()` 限制
- [ ] 所有 `stationSchema` 字符串字段加 `.max()` 限制
- [ ] `globalStatsSchema` 和 `gradeInfoSchema` 字符串字段加 `.max()` 限制
- [ ] `stations` 数组 `.max(100)`，shops 数组 `.max(200)`
- [ ] `dataSchema.refine()` 检查重复 ID
- [ ] 运行确认 **通过**（Green）

### 9.3 实现限流中间件（Green）
- [ ] 新增 `rateLimitMap` / `rateLimiter` 函数
- [ ] `POST /api/data` 路由挂载 `rateLimiter`
- [ ] `setInterval` 清理过期记录
- [ ] 运行确认 **通过**（Green）

---

## 10. 回归测试与清理

### 10.1 完整回归测试
- [ ] 运行 `npm test`（单元 + 集成），确认 **18 个文件全部通过，0 失败**
- [ ] 运行 `node scripts/check-test-coverage.js`，确认通过
- [ ] 在每个 HTML 页面内联 `<script>` 中搜索 `authToken`：确保零命中

### 10.2 OpenSpec 清理
- [ ] 更新 `openspec/config.yaml`：Auth 描述改为 `HttpOnly 签名 Cookie + 登录端点（POST /api/login）`
- [ ] 更新 `openspec/config.yaml`：API 端点列表新增 `POST /api/login, POST /api/logout, GET /api/auth-status`
- [ ] 确认 `.env.test` 已在 `.gitignore` 或不含敏感值

---

## 验收清单（嵌入 testing-checklist）

### 阶段一：Propose
- [x] 测试策略已定义（见 proposal.md）
- [x] 测试任务已拆分（见各 task group 的 X.T 任务）
- [x] 测试基础设施已确认（新增 `globalSetup.js`、`setupFile.js`、`.env.test`）

### 阶段二：Apply
- [ ] TDD 顺序已遵守（Red → Green → Refactor）
- [ ] 单元测试已编写（每个修改的模块有对应测试）
- [ ] 集成测试已编写（`auth-data-flow.test.js` 覆盖完整链路）
- [ ] 测试命名规范
- [ ] 测试描述清晰（中文断言）

### 阶段三：验证
- [ ] 全部测试通过（`npm test` 零失败）
- [ ] 覆盖率检查通过
- [ ] 无测试作弊
- [ ] 手动验证完成

### 阶段四：归档
- [ ] 测试文件已提交
- [ ] CI 脚本已更新
- [ ] 文档已更新
