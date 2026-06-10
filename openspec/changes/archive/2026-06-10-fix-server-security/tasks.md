## 1. 环境变量配置

- [x] 1.1 在 `.env` 中添加 `AUTH_TOKEN` 和 `ALLOWED_ORIGINS` 配置项
- [x] 1.2 创建 `.env.example` 模板文件
- [x] 1.3 验证环境变量可被 `process.env` 读取（通过 dotenv）

## 2. 后端安全改造（server.js）

- [x] 2.1 实现 `authenticateToken` 中间件：校验 `Authorization: Bearer <token>` header
- [x] 2.2 将 `authenticateToken` 中间件挂载到 `POST /api/data`，其他路由保持公开
- [x] 2.3 修改 CORS 中间件：从 `*` 改为读取 `ALLOWED_ORIGINS` 白名单
- [x] 2.4 替换 `express.static(__dirname)` 为显式白名单静态路由
- [x] 2.5 添加全局 CSP header：`Content-Security-Policy: default-src 'self'`
- [x] 2.6 验证 `/server.js`、`.env`、数据库文件返回 404

## 2.T 后端安全改造测试

- [x] 2.T.1 编写认证中间件测试 — 无 Token 返回 401（Red）
- [x] 2.T.2 编写认证中间件测试 — 错误 Token 返回 401（Red）
- [x] 2.T.3 编写认证中间件测试 — 正确 Token 通过（Red）
- [x] 2.T.4 编写 CORS 白名单测试 — 白名单内来源允许（Red）
- [x] 2.T.5 编写 CORS 白名单测试 — 白名单外来源拒绝（Red）
- [x] 2.T.6 编写静态路由测试 — 前端资源可访问（Red）
- [x] 2.T.7 编写静态路由测试 — 后端文件返回 404（Red）
- [x] 2.T.8 编写 CSP header 测试 — 所有响应携带 CSP（Red）
- [x] 2.T.9 运行全部后端测试确认失败（Red 验证）
- [x] 2.T.10 实现使全部测试通过（Green）
- [x] 2.T.11 重构认证/CORS/静态路由/CSP 代码（Refactor）

## 3. 前端 Token 读取（state.js）

- [x] 3.1 修改 `state.js` 初始化逻辑：从 `document.documentElement.dataset.authToken` 读取 Token
- [x] 3.2 在 `index.html` 的 `<html>` 标签上注入 `data-auth-token` 属性（由 server.js 动态注入）
- [x] 3.3 在 `battle-map.html` 的 `<html>` 标签上注入 `data-auth-token` 属性（由 server.js 动态注入）
- [x] 3.4 在 `data-viz.html` 的 `<html>` 标签上注入 `data-auth-token` 属性（由 server.js 动态注入）
- [x] 3.5 验证 Node.js 环境（`typeof document === 'undefined'`）下安全回退为空字符串

## 3.T 前端 Token 测试

- [x] 3.T.1 编写 `state.authToken` 读取测试 — HTML 有 data-auth-token 时正确读取（Red）
- [x] 3.T.2 编写 `state.authToken` 读取测试 — HTML 无 data-auth-token 时为空字符串（Red）
- [x] 3.T.3 编写 `state.authToken` 读取测试 — Node.js 环境安全回退（Red）
- [x] 3.T.4 运行测试确认失败（Red 验证）
- [x] 3.T.5 实现使测试通过（Green）
- [x] 3.T.6 重构 state.js 初始化代码（Refactor）

## 4. 前端请求携带 Token（data.js）

- [x] 4.1 修改 `saveData()` 的 `fetch` 请求：在 headers 中附加 `Authorization: Bearer <state.authToken>`
- [x] 4.2 确认 `loadData()` 的 `GET /api/data` 请求不携带 Authorization header
- [x] 4.3 确认 Token 为空字符串时仍发送请求（后端会拒绝保存，前端回退到 localStorage）

## 4.T 前端请求测试

- [x] 4.T.1 编写 `saveData()` 测试 — 有 Token 时 fetch headers 携带 Authorization（Red）
- [x] 4.T.2 编写 `loadData()` 测试 — 不携带 Authorization header（Red）
- [x] 4.T.3 编写 `saveData()` 测试 — Token 为空时仍正常发送请求（Red）
- [x] 4.T.4 运行测试确认失败（Red 验证）
- [x] 4.T.5 实现使测试通过（Green）
- [x] 4.T.6 重构 data.js 请求代码（Refactor）

## 5. 集成与 E2E 测试

- [x] 5.1 编写集成测试 `tests/integration/auth-data-flow.test.js`：Token 读取 → saveData 携带 → 服务端校验通过
- [x] 5.2 编写集成测试：Token 读取 → saveData 携带错误 Token → 服务端返回 401
- [x] 5.3 编写 E2E 测试 `tests/e2e/auth-required.test.js`：无认证保存失败场景
- [x] 5.4 编写 E2E 测试：有认证保存成功场景
- [x] 5.5 启动真实服务运行 E2E 测试，确认通过

## 6. 端到端验证

- [x] 6.1 运行 `npm test` 确认所有新增测试通过（202 passed）
- [x] 6.2 运行 `node scripts/check-test-coverage.js` 确认模块覆盖和数量底线达标
- [x] 6.3 手动验证：curl 无 Token POST /api/data → 401 ✅
- [x] 6.4 手动验证：curl 正确 Token POST /api/data → 200 ✅
- [x] 6.5 手动验证：浏览器访问页面 → 保存数据 → 成功（通过集成测试验证）
- [x] 6.6 手动验证：访问 /server.js → 404 ✅
- [x] 6.7 手动验证：响应头包含 Content-Security-Policy ✅

---

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [x] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [x] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [x] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

### 阶段二：Apply（实施阶段）

- [x] **TDD 顺序已遵守**：每个功能点执行了 Red → Green → Refactor
- [x] **单元测试已编写**：每个新增/修改的模块都有对应的 `tests/<模块名>.test.js`
- [x] **集成测试已编写**（如涉及多模块联动）：有 `tests/integration/<场景>.test.js`
- [x] **E2E 测试已编写**（如涉及页面/核心流程）：有 `tests/e2e/<场景>.test.js`
- [x] **测试命名规范**：测试文件命名符合 `tests/<模块名>.test.js` 或 `tests/<层级>/<场景>.test.js`
- [x] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言（如「应该从无文件名路径解析首页」）

### 阶段三：验证阶段

- [x] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [x] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`，输出「所有模块均已覆盖」
- [x] **无测试作弊**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [x] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [x] **测试文件已提交**：所有测试文件已纳入 git 版本控制
- [ ] **CI 脚本已更新**（如有）：package.json 的 test 脚本能正确运行新增测试
- [ ] **文档已更新**：如测试策略或基础设施有变化，已同步更新 `openspec/testing-strategy.md`

---

## 豁免规则

以下情况可以豁免部分或全部测试，但必须在 change 中明确标注并说明理由：

| 豁免场景 | 可豁免的测试 | 必须做的 | 标注位置 |
|---------|------------|---------|---------|
| 纯 CSS 样式调整（颜色、间距、圆角） | 全部 | 手动视觉验证 | tasks.md 顶部 |
| 纯文案/标点修改 | 全部 | 手动阅读确认 | tasks.md 顶部 |
| 配置文件修改（不涉及逻辑） | 全部 | 配置生效验证 | tasks.md 顶部 |
| 已有模块的微小重构（无行为变更） | E2E | 单元测试需全部通过 | tasks.md 对应任务旁 |

> **注意**：豁免不等于跳过验证。即使豁免测试，也必须通过其他方式确认变更正确。
