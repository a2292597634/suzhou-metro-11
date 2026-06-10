## Context

当前 `server.js` 是 Express 5 搭建的单文件后端，提供三个端点：`GET /api/data`、`POST /api/data`、`GET /api/ip`。CORS 中间件开放 `*` 来源，`express.static(__dirname)` 暴露项目根目录下所有文件。前端通过 `fetch` 直连 API，无任何认证信息。这是一个内部工具性质的项目（苏州地铁11号线商业作战图），预期部署在局域网或受限访问的环境中。

## Goals / Non-Goals

**Goals:**
1. `POST /api/data` 必须校验请求者身份，未认证请求返回 401
2. CORS 只允许配置白名单中的来源，拒绝其他来源的跨域请求
3. HTTP 静态服务只暴露前端所需的 HTML/CSS/JS/资源文件，不暴露后端代码和配置
4. 所有响应携带 CSP header，限制脚本来源为 `self`
5. 前端保存数据时自动附加认证信息，对用户透明

**Non-Goals:**
- 不引入完整的用户系统（登录页、会话管理、密码重置等）
- 不做复杂的 RBAC 权限分级（所有持有 Token 的用户拥有同等写入权限）
- 不修改 Prisma 模型或数据库结构
- 不修改前端业务逻辑（编辑、渲染、导入导出等保持不变）

## Decisions

### Decision 1: 认证方式 — 单 Bearer Token（共享密钥）

**选择**: 使用 `Authorization: Bearer <token>` 头部，Token 为环境变量 `AUTH_TOKEN` 中配置的随机字符串。

**理由**:
- 项目无用户系统，不需要 JWT 的签发/刷新/过期机制
- 共享密钥足够应对"防止任意访问者修改数据"这个威胁模型
- 实现极简，只需一个 Express 中间件即可
- 前端只需在 `fetch` 时附加固定 header

**替代方案**: JWT — 需要签发逻辑、过期处理、刷新机制，过度设计。

### Decision 2: Token 在前端的存储方式 — 从 HTML data 属性注入

**选择**: Token 通过 HTML `<html data-auth-token="xxx">` 的 `data-auth-token` 属性注入，由 `state.js` 在初始化时读取到 `state.authToken`。

**理由**:
- 前端是纯静态 HTML，无构建工具，无法通过环境变量注入
- `data-*` 属性比直接内联在 JS 中更安全（不暴露在 JS 源码中）
- 与现有 `data-api-base` 模式保持一致（`state.js` 已使用 `data-api-base`）
- Token 在页面刷新时重新获取，无需持久化存储

**替代方案**: localStorage 存储 Token — 增加复杂度，且 XSS 修复后 localStorage 读取也安全，但 `data-*` 属性更简单直接。

### Decision 3: CORS 白名单来源 — 环境变量配置

**选择**: `ALLOWED_ORIGINS` 环境变量，逗号分隔多个来源。

**理由**:
- 部署环境不同（本地开发、Docker、局域网），来源不同
- 环境变量比硬编码更灵活
- 无来源时默认只允许同域（开发体验友好）

### Decision 4: 静态目录方案 — 显式白名单路由

**选择**: 不使用 `express.static(__dirname)`，改为显式路由：
- `GET /` → `index.html`
- `GET /battle-map.html` → `battle-map.html`
- `GET /data-viz.html` → `data-viz.html`
- `GET /css/*` → `css/` 目录
- `GET /js/*` → `js/` 目录
- `GET /assets/*` → `assets/` 目录

**理由**:
- 白名单比黑名单更安全（默认拒绝）
- 不引入 `public/` 目录重构，避免移动文件产生额外变更
- 明确列出允许的文件类型，后端代码、数据库、配置文件自然被排除

**替代方案**: 创建 `public/` 目录并将静态文件移入 — 需要移动大量文件，变更范围过大，不适合作为安全修复的一部分。

### Decision 5: GET /api/data 保持公开

**选择**: 只给 `POST /api/data` 加认证，`GET /api/data` 和 `GET /api/ip` 保持无认证访问。

**理由**:
- 读取数据不是风险点（数据本身就是给前端展示用的）
- 保持首页/作战图/数据页可以正常加载，不破坏现有用户体验
- 只保护写操作，最小权限原则

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Token 泄露后攻击者可无限期利用 | Token 为环境变量配置，部署方应定期轮换；当前威胁模型下这是可接受的风险 |
| 前端 Token 暴露在 HTML 源码中 | 通过 `data-*` 属性注入，比硬编码在 JS 中稍好；XSS 修复后注入方式本身也是安全的 |
| 静态文件白名单遗漏了某个资源 | 在 tasks 中明确列出所有需要暴露的文件类型，逐个验证 |
| CSP 过严导致某些内联脚本失效 | CSP 使用 `default-src 'self'`，允许同域资源；项目无外部 CDN 脚本 |
| 认证破坏现有 E2E 测试 | E2E 测试需要在请求中携带 Token；在 `tasks.md` 中安排测试适配任务 |

## Migration Plan

1. **配置准备**: 在 `.env` 中添加 `AUTH_TOKEN=<随机字符串>` 和 `ALLOWED_ORIGINS=http://localhost:3000`
2. **服务端部署**: 更新 `server.js` 后重启服务
3. **前端适配**: 所有 HTML 文件添加 `<html data-auth-token="<%= AUTH_TOKEN %>">`（Node.js 模板注入，见 Open Questions）
4. **验证**: 用 curl 测试无 Token POST 返回 401、正确 Token 正常保存
5. **回滚**: 如出现问题，回退到 `server.js` 上一版本即可

## Open Questions

1. **HTML data-auth-token 的注入方式**: 目前前端是纯静态 HTML（无模板引擎），Token 如何安全注入？方案 A：在 server.js 中用字符串替换模板变量后返回；方案 B：用一个独立的 `/api/config` 端点返回 Token，前端在 `loadData()` 前先 fetch 配置。方案 B 更干净但需要额外请求。

2. **ALLOWED_ORIGINS 的默认值**: 开发环境下是否默认允许 `http://localhost:3000` 和 `http://localhost:8081`？如果用户未设置环境变量，应该拒绝所有跨域（安全默认）还是允许本地开发（体验友好）？

## 测试架构设计

### 测试分层策略

| 层级 | 覆盖范围 | 工具 | 文件位置 |
|------|---------|------|---------|
| 单元测试 | 认证中间件、CORS 中间件、静态路由白名单 | Vitest + jsdom（模拟 req/res） | `tests/auth-middleware.test.js` |
| 集成测试 | `state.js` Token 读取 → `data.js` 请求携带 → 服务端校验 完整链路 | Vitest + jsdom + 模拟 fetch | `tests/integration/auth-data-flow.test.js` |
| E2E 测试 | 真实浏览器中：无认证保存失败 → 有认证保存成功 | Puppeteer + 启动的服务 | `tests/e2e/auth-required.test.js` |

### 需要 Mock 的外部依赖

- **Prisma Client**: 认证中间件测试不涉及数据库操作，但集成测试需要 mock `prisma.$transaction`
- **fetch**: 前端 `data.js` 测试需要 mock `global.fetch` 验证请求头携带
- **环境变量**: 通过 `process.env.AUTH_TOKEN = 'test-token'` 在测试 setup 中设置
- **HTML data 属性**: 通过 `document.documentElement.dataset.authToken = 'test-token'` 在 jsdom 中设置
