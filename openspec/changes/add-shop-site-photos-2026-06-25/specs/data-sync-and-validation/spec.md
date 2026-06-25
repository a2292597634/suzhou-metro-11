## MODIFIED Requirements

### Requirement: API 数据同步保留商铺照片字段
`/api/data` SHALL 在读取、校验、保存和返回站点数据时保留 `shops[].photo` 字段。

#### Scenario: GET 返回照片字段
- **WHEN** 数据库中的某个 Shop 记录 `photo` 非空
- **AND** 客户端请求 `GET /api/data`
- **THEN** 响应中对应 `stations[].shops[].photo` 等于数据库中的值

#### Scenario: POST 写入照片字段
- **WHEN** 已认证用户请求 `POST /api/data`
- **AND** 请求体中某商铺包含合法 `photo`
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

## Testing Notes

- 单元测试：`tests/shop-schema.test.js` 覆盖 schema 默认值和非法值。
- API/集成测试：`tests/integration/auth-data-flow.test.js` 覆盖 POST/GET 成功往返。
- 安全测试：`tests/server-security.test.js` 覆盖非法照片字段拒绝。
- 数据测试：`tests/data.test.js` 覆盖前端 `saveData()` 请求体保留照片字段。
