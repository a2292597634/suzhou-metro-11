## Requirements

### Requirement: API 地址从 HTML 属性安全读取
`state.apiBase` MUST 从 `<html>` 元素的 `data-api-base` 属性读取。读取时 MUST 使用 `typeof document !== 'undefined'` 守卫防止 Node.js 环境报错。若属性不存在或无法读取则默认为空字符串。

#### Scenario: 显式配置 API 地址
- **WHEN** HTML 为 `<html data-api-base="http://192.168.1.100:3000">`
- **THEN** `state.apiBase` 值为 `"http://192.168.1.100:3000"`
- **AND** `loadData()` 使用 `"http://192.168.1.100:3000/api/data"` 作为请求地址

#### Scenario: 未配置时使用相对路径
- **WHEN** `<html>` 无 `data-api-base` 属性
- **THEN** `state.apiBase` 值为 `""`
- **AND** `loadData()` 使用 `"/api/data"` 相对路径

#### Scenario: 空字符串属性等同于未配置
- **WHEN** HTML 为 `<html data-api-base="">`
- **THEN** `state.apiBase` 值为 `""`

#### Scenario: Node.js 环境安全回退
- **WHEN** `typeof document === 'undefined'`（如纯 Node.js 测试环境）
- **THEN** `state.apiBase` 值为 `""`，不抛出 ReferenceError

### Requirement: CORS 只允许白名单中的来源
服务端 MUST 只在 `Access-Control-Allow-Origin` 中响应当前请求来源属于 `ALLOWED_ORIGINS` 环境变量配置的白名单时才允许跨域。白名单以逗号分隔，支持多个来源。若请求来源不在白名单中，服务端 MUST 不返回 `Access-Control-Allow-Origin` header。

#### Scenario: 白名单中的来源被允许
- **WHEN** `ALLOWED_ORIGINS` 环境变量值为 `"http://localhost:3000,http://192.168.1.100:3000"`
- **AND** 请求来源为 `http://localhost:3000`
- **THEN** 响应头 `Access-Control-Allow-Origin` 值为 `http://localhost:3000`

#### Scenario: 不在白名单的来源被拒绝
- **WHEN** `ALLOWED_ORIGINS` 环境变量值为 `"http://localhost:3000"`
- **AND** 请求来源为 `https://evil.com`
- **THEN** 响应不包含 `Access-Control-Allow-Origin` header

### Requirement: CORS 响应携带 Credentials 头
CORS 中间件 MUST 在响应中包含 `Access-Control-Allow-Credentials: true` header，以允许浏览器在跨域请求中携带 Cookie。

#### Scenario: 跨域请求允许凭证
- **WHEN** OPTIONS 预检请求（来自白名单来源）
- **THEN** 响应包含 `Access-Control-Allow-Credentials: true`

### Requirement: CSP 使用 Nonce 支持内联样式和脚本
服务端 MUST 为每个请求生成随机 nonce（`crypto.randomBytes(16).toString('base64')`），并：
1. 在 CSP header 中包含该 nonce：`style-src 'self' 'nonce-<N>' https://cdn.jsdelivr.net; script-src 'self' 'nonce-<N>'`
2. 在 HTML 响应的 `<style>` 和 `<script>`（无 `src` 属性的内联标签）中添加 `nonce="<N>"` 属性

MUST NOT 使用 `'unsafe-inline'` 关键字。

CSP MUST 额外包含 `img-src 'self' data:`（支持内嵌图片）、`font-src 'self' https://cdn.jsdelivr.net`（支持 Geist 字体）、`connect-src 'self'`（限制 Ajax 请求）。

#### Scenario: HTML 响应中的内联 style 带 nonce
- **WHEN** 请求 `GET /index.html`
- **THEN** 响应中 `<style>` 变为 `<style nonce="<random-string>">`
- **AND** CSP header 包含 `style-src 'self' 'nonce-<random-string>'`

#### Scenario: HTML 响应中的内联 script 带 nonce
- **WHEN** 请求 `GET /battle-map.html`
- **THEN** `<script type="module">` 变为 `<script type="module" nonce="<random-string>">`
- **AND** CSP header 包含 `script-src 'self' 'nonce-<random-string>'`

#### Scenario: 外部引用的 script 不注入 nonce
- **WHEN** HTML 中包含 `<script src="/js/modules/data.js">`
- **THEN** 该标签不被修改（`src` 属性不匹配替换模式）

### Requirement: 静态文件只暴露前端资源
服务端 MUST 只通过 HTTP 暴露以下路径：`/`、`/index.html`、`/battle-map.html`、`/data-viz.html`、`/css/*`、`/js/*`、`/assets/*`。任何其他路径 MUST 返回 404 Not Found。

#### Scenario: 前端资源正常访问
- **WHEN** 请求 `GET /js/modules/data.js`
- **THEN** 返回文件内容，HTTP 200

#### Scenario: 后端代码被阻止
- **WHEN** 请求 `GET /server.js`
- **THEN** 返回 HTTP 404 Not Found

## Testing Notes

- **单元测试** (`tests/state.test.js`)：在 jsdom 中设置 `document.documentElement.dataset.apiBase`，验证 state 初始化正确
- **单元测试** (`tests/server-security.test.js`)：验证 CORS 白名单、CSP header 包含 nonce、HTML 中 style/script 标签被注入 nonce、外部 script 不被修改、静态路由白名单
