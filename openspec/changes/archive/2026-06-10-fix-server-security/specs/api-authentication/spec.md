## ADDED Requirements

### Requirement: POST /api/data 必须携带有效的 Bearer Token
`POST /api/data` 请求 MUST 在 HTTP header 中包含 `Authorization: Bearer <token>`。若 header 缺失、格式错误、或 Token 值与 `AUTH_TOKEN` 环境变量不匹配，服务端 MUST 返回 HTTP 401 Unauthorized 响应，且 MUST 不执行任何数据库操作。

#### Scenario: 携带正确 Token 成功保存
- **WHEN** 客户端发送 `POST /api/data` 且 header 包含 `Authorization: Bearer valid-token`
- **AND** `AUTH_TOKEN` 环境变量值为 `valid-token`
- **THEN** 服务端正常处理请求，返回 HTTP 200 和 `{ success: true }`

#### Scenario: 未携带 Token 被拒绝
- **WHEN** 客户端发送 `POST /api/data` 且无任何 `Authorization` header
- **THEN** 服务端返回 HTTP 401，响应体为 `{ error: '未授权，缺少认证信息' }`
- **AND** 数据库未被修改

#### Scenario: Token 格式错误被拒绝
- **WHEN** 客户端发送 `POST /api/data` 且 header 为 `Authorization: Basic dXNlcjpwYXNz`
- **THEN** 服务端返回 HTTP 401，响应体为 `{ error: '未授权，Token 格式不正确' }`
- **AND** 数据库未被修改

#### Scenario: Token 值不匹配被拒绝
- **WHEN** 客户端发送 `POST /api/data` 且 header 为 `Authorization: Bearer wrong-token`
- **AND** `AUTH_TOKEN` 环境变量值为 `valid-token`
- **THEN** 服务端返回 HTTP 401，响应体为 `{ error: '未授权，Token 无效' }`
- **AND** 数据库未被修改

### Requirement: 前端请求自动携带认证 Token
前端 `js/modules/data.js` 中的 `saveData()` 函数 MUST 在 `fetch` 请求的 `headers` 中附加 `Authorization: Bearer <token>`，其中 `<token>` 取自 `state.authToken`。`loadData()` 的 `GET /api/data` 请求 MUST 不携带认证 header（读取保持公开）。

#### Scenario: saveData 自动携带 Token
- **WHEN** `state.authToken` 值为 `"my-secret-token"`
- **AND** 调用 `saveData()`
- **THEN** `fetch` 请求的 headers 中包含 `Authorization: Bearer my-secret-token`

#### Scenario: loadData 不携带 Token
- **WHEN** `state.authToken` 值为 `"my-secret-token"`
- **AND** 调用 `loadData()`
- **THEN** `fetch` 请求不包含 `Authorization` header

### Requirement: state.js 从 HTML 读取 Token
`state.authToken` MUST 在初始化时从 `document.documentElement.dataset.authToken` 读取。若属性不存在或为空字符串，则值为空字符串。读取时 MUST 使用 `typeof document !== 'undefined'` 守卫防止 Node.js 环境报错。

#### Scenario: HTML 配置了 Token
- **WHEN** HTML 为 `<html data-auth-token="secret123">`
- **THEN** `state.authToken` 值为 `"secret123"`

#### Scenario: HTML 未配置 Token
- **WHEN** `<html>` 无 `data-auth-token` 属性
- **THEN** `state.authToken` 值为 `""`

#### Scenario: Node.js 环境安全回退
- **WHEN** `typeof document === 'undefined'`（纯 Node.js 测试环境）
- **THEN** `state.authToken` 值为 `""`，不抛出 ReferenceError

## Testing Notes

- **单元测试** (`tests/auth-middleware.test.js`)：模拟 Express req/res 对象，验证认证中间件对四种场景的正确响应
- **单元测试** (`tests/state.test.js`)：在 jsdom 中设置/移除 `data-auth-token`，验证 `state.authToken` 初始化
- **集成测试** (`tests/integration/auth-data-flow.test.js`)：mock `fetch`，验证 `saveData()` 的请求头携带和 `loadData()` 的不携带
- **E2E 测试** (`tests/e2e/auth-required.test.js`)：启动真实服务，Puppeteer 验证无 Token POST 返回 401、正确 Token 可保存
