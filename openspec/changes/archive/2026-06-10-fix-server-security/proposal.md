## Why

当前 `server.js` 无任何身份认证，CORS 开放 `*` 允许任意来源，静态文件服务暴露整个项目根目录。这意味着局域网或公网部署后，任何人都可以调用 `POST /api/data` 覆盖全部数据，甚至通过暴露的静态文件下载 `server.js`、`.env`、数据库文件等敏感内容。这是一个必须立即修复的安全红线。

## What Changes

- **BREAKING** `POST /api/data` 新增 Bearer Token 认证校验，无 Token 或 Token 错误时返回 401
- **BREAKING** CORS `Access-Control-Allow-Origin` 从 `*` 改为从环境变量 `ALLOWED_ORIGINS` 读取的可配置白名单
- **BREAKING** 静态文件服务从 `express.static(__dirname)` 改为仅服务 `public/` 目录（或明确的静态文件清单）
- 新增 `Content-Security-Policy` 响应头，作为 XSS 的第二道防线
- 前端 `data.js` 的所有 `fetch` 请求统一携带 `Authorization: Bearer <token>` 请求头
- 新增 `AUTH_TOKEN` 环境变量用于服务端和客户端共享认证密钥

## Capabilities

### New Capabilities
- `api-authentication`: API 请求认证（Token 校验中间件、401 响应、前端请求头携带）

### Modified Capabilities
- `api-config`: CORS 配置从固定 `*` 改为可配置白名单；新增 CSP header 到所有响应

## Impact

| 文件/目录 | 变更内容 |
|----------|---------|
| `server.js` | 新增认证中间件、修改 CORS、修改静态目录路由、新增 CSP header |
| `js/modules/data.js` | `loadData()` 和 `saveData()` 的 `fetch` 请求携带 `Authorization` 头 |
| `js/modules/state.js` | 新增 `authToken` 状态字段，从环境变量或 HTML data 属性读取 |
| `.env` | 新增 `AUTH_TOKEN` 和 `ALLOWED_ORIGINS` 配置项 |
| `tests/` | 新增/修改测试以覆盖认证逻辑 |

## 测试策略

依据 `openspec/testing-strategy.md` 变更类型映射表：

| 变更类型 | 映射结果 |
|---------|---------|
| 修改模块（`data.js` 的请求逻辑） | 单元 ✅ 必做 |
| 新增后端中间件（认证、CORS、CSP） | 单元 ✅ 必做 |
| 模块间联动（`state.js` → `data.js` → API） | 集成 ✅ 必做 |
| 涉及核心操作流程（保存数据需认证） | E2E ✅ 必做 |

- **单元测试**：`tests/auth-middleware.test.js`（认证中间件正负向用例）、`tests/cors.test.js`（CORS 白名单校验）
- **集成测试**：`tests/integration/auth-data-flow.test.js`（认证 → 数据加载 → 数据保存 完整链路）
- **E2E 测试**：`tests/e2e/auth-required.test.js`（无认证时保存失败、有认证时保存成功）

## 成功标准

- [ ] `POST /api/data` 无 Token 时返回 401 Unauthorized
- [ ] `POST /api/data` 携带错误 Token 时返回 401 Unauthorized
- [ ] `POST /api/data` 携带正确 Token 时正常保存数据
- [ ] `GET /api/data` 不强制要求认证（保持公开读取）
- [ ] CORS 只响应白名单中的来源，其他来源被阻止
- [ ] `server.js`、`package.json`、`.env`、数据库文件不再通过 HTTP 暴露
- [ ] 所有 HTTP 响应包含 `Content-Security-Policy: default-src 'self'`
- [ ] 前端保存数据时自动携带认证 Token
- [ ] 所有新增/修改的测试用例通过（Red → Green → Refactor）
