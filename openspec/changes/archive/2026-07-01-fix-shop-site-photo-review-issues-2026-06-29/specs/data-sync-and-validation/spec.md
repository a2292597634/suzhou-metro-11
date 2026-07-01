## MODIFIED Requirements

### Requirement: API 数据同步保留商铺照片字段
`/api/data` SHALL 在读取、校验、保存和返回站点数据时保留 `shops[].photo` 字段。`shops[].photo` SHALL 默认为空字符串，合法非空值 SHALL 匹配 `data:image/(jpeg|png|webp);base64,` 前缀且长度小于等于 3_000_000 个字符。`/api/data` MUST reject `/assets/shop-photos/*` 等路径型照片值。

#### Scenario: GET 返回照片字段
- **WHEN** 数据库中的某个 Shop 记录 `photo` 非空
- **AND** 客户端请求 `GET /api/data`
- **THEN** 响应中对应 `stations[].shops[].photo` 等于数据库中的值

#### Scenario: POST 写入照片字段
- **WHEN** 已认证用户请求 `POST /api/data`
- **AND** 请求体中某商铺包含合法 `photo`
- **AND** `photo` 长度大于 500 且小于等于 3_000_000 个字符
- **THEN** 数据库对应 Shop 记录保存该 `photo`

#### Scenario: POST 不提供照片字段时兼容旧数据
- **WHEN** 已认证用户请求 `POST /api/data`
- **AND** 请求体中的商铺未包含 `photo`
- **THEN** 服务端使用空字符串作为该商铺照片默认值
- **AND** 保存流程不报错

#### Scenario: Prisma seed 兼容照片字段
- **WHEN** 执行 `prisma/seed.js`
- **AND** 默认数据未包含 `photo`
- **THEN** seed 仍可成功创建 Shop 记录
- **AND** 新记录 `photo` 为空字符串

#### Scenario: POST 拒绝路径型照片字段
- **WHEN** 已认证用户请求 `POST /api/data`
- **AND** 请求体中某商铺的 `photo` 为 `/assets/shop-photos/demo.png`
- **THEN** 服务端返回 HTTP 400
- **AND** 响应 details 指出 `photo` 校验失败

#### Scenario: POST 拒绝超过 3_000_000 字符的照片字段
- **WHEN** 已认证用户请求 `POST /api/data`
- **AND** 请求体中某商铺的 `photo` 长度大于 3_000_000 个字符
- **THEN** 服务端返回 HTTP 400
- **AND** 数据库不写入该照片字段

## Testing Notes

- API/集成测试：`tests/integration/auth-data-flow.test.js` 使用测试 PostgreSQL 数据库覆盖 500 字符以上合法 Data URL 成功 POST/GET 往返。
- 安全测试：`tests/server-security.test.js` 覆盖路径型照片字段和超过 3_000_000 字符照片字段返回 400。
- 单元测试：`tests/shop-schema.test.js` 的 schema 副本必须与真实 `server.js` 中 `shopSchema.photo` 规则保持一致。
