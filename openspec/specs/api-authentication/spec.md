## Requirements

### Requirement: 认证使用 HttpOnly 签名 Cookie，不暴露到 HTML
`authenticateToken` 中间件 MUST 同时接受两种认证方式：
1. 签名 Cookie `auth_token`，值等于 `process.env.AUTH_TOKEN`
2. HTTP header `Authorization: Bearer <token>`，token 等于 `process.env.AUTH_TOKEN`

若两种方式均未提供有效认证，MUST 返回 HTTP 401 `{ error: '未授权，请先登录' }`。

若 `AUTH_TOKEN` 环境变量未配置，MUST 返回 HTTP 500 `{ error: '服务端未配置 AUTH_TOKEN' }`。

服务端 MUST NOT 通过任何途径将 `AUTH_TOKEN` 写入 HTML 或 JS 源码。HTML 页面 MUST NOT 包含 `data-auth-token` 属性或任何形式的内联 Token。

#### Scenario: 有效签名 Cookie 认证通过
- **WHEN** 请求携带 `Cookie: auth_token=<signed-value>` 且签名后值等于 `AUTH_TOKEN`
- **THEN** 认证通过，继续处理请求

#### Scenario: 有效 Bearer Token 认证通过
- **WHEN** 请求携带 `Authorization: Bearer <AUTH_TOKEN>`
- **THEN** 认证通过，继续处理请求

#### Scenario: 无认证信息被拒绝
- **WHEN** 请求既无 Cookie 也无 Authorization header
- **THEN** 返回 HTTP 401 `{ error: '未授权，请先登录' }`

#### Scenario: HTML 不含明文 Token
- **WHEN** 请求 `GET /` 或 `GET /index.html`
- **THEN** 响应 HTML 中不包含 `data-auth-token` 属性
- **AND** 响应 HTML 中不包含 `AUTH_TOKEN` 的值

### Requirement: 登录端点设置 HttpOnly Cookie
`POST /api/login` 端点 MUST 接收 `{ password }` JSON body。若 `password` 等于 `process.env.AUTH_TOKEN`，MUST 设置名为 `auth_token` 的签名 HttpOnly Cookie（`httpOnly: true, signed: true, sameSite: 'lax', maxAge: 86400000`）并返回 `{ success: true }`。若密码不匹配，MUST 返回 HTTP 401 `{ error: '密码错误' }`。登录端点 MUST 经过限流中间件。

#### Scenario: 正确密码登录成功
- **WHEN** `POST /api/login` body 为 `{ password: "<AUTH_TOKEN>" }`
- **THEN** 返回 HTTP 200 `{ success: true, message: '登录成功' }`
- **AND** `Set-Cookie` 响应头包含 `auth_token=<signed>; HttpOnly`

#### Scenario: 错误密码登录失败
- **WHEN** `POST /api/login` body 为 `{ password: "wrong" }`
- **THEN** 返回 HTTP 401 `{ error: '密码错误' }`

### Requirement: 登出端点清除 Cookie
`POST /api/logout` 端点 MUST 清除 `auth_token` Cookie 并返回 `{ success: true }`。

#### Scenario: 登出成功
- **WHEN** `POST /api/logout`
- **THEN** 返回 HTTP 200 `{ success: true, message: '已登出' }`
- **AND** `Set-Cookie` 响应头清除 `auth_token`

### Requirement: 认证状态检查端点
`GET /api/auth-status` 端点 MUST 返回 `{ authenticated: true/false }`，基于当前请求是否携带有效的认证 Cookie。

#### Scenario: 已认证用户
- **WHEN** 请求携带有效 `auth_token` Cookie
- **THEN** 返回 `{ authenticated: true }`

#### Scenario: 未认证用户
- **WHEN** 请求未携带或携带无效 Cookie
- **THEN** 返回 `{ authenticated: false }`

### Requirement: 前端使用 credentials 模式发送请求
`js/modules/data.js` 的 `saveData()` 函数 MUST 在 `fetch` 调用中使用 `credentials: 'include'` 以自动携带 Cookie。MUST NOT 手动设置 `Authorization` header。

`state.isAuthenticated` MUST 为布尔字段（取代旧 `authToken` 字符串字段），初始值为 `false`。`login(password)` 函数 MUST 调用 `POST /api/login`，成功后将 `state.isAuthenticated` 设为 `true`。`checkAuth()` 函数 MUST 调用 `GET /api/auth-status` 更新 `state.isAuthenticated`。

#### Scenario: saveData 使用 credentials: 'include'
- **WHEN** 调用 `saveData()`
- **THEN** `fetch` 的 options 中包含 `credentials: 'include'`
- **AND** `fetch` 的 headers 中不包含 `Authorization`

#### Scenario: login 成功更新状态
- **WHEN** `login(password)` 收到服务端 200
- **THEN** `state.isAuthenticated` 变为 `true`
- **AND** 返回 `{ success: true }`

#### Scenario: login 失败不更新状态
- **WHEN** `login(password)` 收到服务端 401
- **THEN** `state.isAuthenticated` 保持 `false`
- **AND** 返回 `{ success: false, error: '密码错误' }`

## Testing Notes

- **单元测试** (`tests/server-security.test.js`)：验证 login/logout/auth-status 端点、Cookie 和 Bearer 两种认证方式、HTML 不含 Token
- **单元测试** (`tests/state.test.js`)：验证 `state.isAuthenticated` 初始为 false
- **单元测试** (`tests/data.test.js`)：验证 `saveData()` 使用 `credentials: 'include'`、`login()` 成功/失败、`checkAuth()`
- **集成测试** (`tests/integration/auth-data-flow.test.js`)：完整 login → Cookie → POST /api/data 链路
