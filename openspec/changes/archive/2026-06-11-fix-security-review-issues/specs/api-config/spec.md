## MODIFIED Requirements

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

### Requirement: CORS 响应携带 Credentials 头
CORS 中间件 MUST 在响应中包含 `Access-Control-Allow-Credentials: true` header，以允许浏览器在跨域请求中携带 Cookie。

#### Scenario: 跨域请求允许凭证
- **WHEN** OPTIONS 预检请求（来自白名单来源）
- **THEN** 响应包含 `Access-Control-Allow-Credentials: true`

## Testing Notes

- **单元测试** (`tests/server-security.test.js`)：验证 CSP header 包含 nonce、HTML 中 style/script 标签被注入 nonce、外部 script 不被修改
