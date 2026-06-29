# data-sync-and-validation Specification

## Purpose
定义 API 数据同步、校验、乐观锁、限流和 localStorage 回退策略。
## Requirements
### Requirement: 保存时完整同步站点和分级信息
`POST /api/data` MUST 在保存时删除数据库中存在于但不在请求中的站点和分级信息，确保数据完整同步。

#### Scenario: 删除站点
- **WHEN** 数据库中包含站点 A、B、C，而请求中只含 A、B
- **THEN** 站点 C 及其关联商铺被删除

#### Scenario: 新增站点
- **WHEN** 请求中包含数据库不存在的站点 D
- **THEN** 站点 D 被创建

### Requirement: Zod 校验请求数据
服务端 MUST 使用 Zod schema 校验 `POST /api/data` 的请求体，非法数据返回 HTTP 400 和具体错误信息。

所有字符串字段 MUST 添加 `.max()` 长度限制：`stationSchema.id` ≤100、`stationSchema.name` ≤100、`shopSchema.name` ≤200、`shopSchema.tenant` ≤100、`shopSchema.contact` ≤100、`shopSchema.remark` ≤500 等。

Shop schema MUST 新增 `power` 字段（`z.union([z.enum(['20KW', '30KW']), z.literal('')]).optional().default('')`）和 `water` 字段（`z.union([z.enum(['有', '/']), z.literal('')]).optional().default('/')`）。

`stations` 数组 MUST ≤100，`shops` 数组 MUST ≤200。MUST 通过 `.refine()` 检查无重复站点 ID。

#### Scenario: 缺失必填字段
- **WHEN** 请求中某站点缺少 `name` 字段
- **THEN** 返回 400，包含字段名和期望类型

#### Scenario: 坐标超出范围
- **WHEN** 站点坐标 x > 3000 或 y > 3000
- **THEN** 返回 400

#### Scenario: 非法等级值
- **WHEN** 站点 grade 不是 S/A/B/C 之一
- **THEN** 返回 400

#### Scenario: 字符串超长被拒绝
- **WHEN** 站点 name 长度 > 100
- **THEN** 返回 400 校验失败

#### Scenario: 非法电量值
- **WHEN** shop power 不是 20KW 或 30KW
- **THEN** 返回 400，错误信息说明允许的值

#### Scenario: 非法上下水值
- **WHEN** shop water 不是「有」或「/」
- **THEN** 返回 400，错误信息说明允许的值

#### Scenario: 重复站点 ID 被拒绝
- **WHEN** stations 数组包含两个相同 id 的站点
- **THEN** 返回 400，错误信息提及重复 ID

### Requirement: Excel 导入后自动重算 GlobalStats
`POST /api/import-excel` 在事务成功提交后 MUST 自动重新计算并更新 GlobalStats 表。

#### Scenario: 导入后统计更新
- **WHEN** 导入完成后数据库有 74 个商铺，37 个营业中
- **THEN** GlobalStats.totalShops = 74，rentedShops = 37

### Requirement: 原子乐观锁防止并发覆盖
Station 表 MUST 包含 `version` 字段。保存时若站点已存在且请求携带了 version（非 null/undefined），MUST 使用原子 `updateMany({ where: { id, version } })` 进行版本检查和更新，消除 findUnique+upsert 之间的竞态窗口。

若 `updateMany` 返回 `count === 0`，MUST 返回 HTTP 409 `{ error: '版本冲突', stationId: '<id>', detail: '...' }`。

`version` 值 `0` MUST 参与版本比对。仅有 `undefined` 和 `null` 表示跳过版本检查。保存成功后 `version` MUST 自增 1。

#### Scenario: 原子更新成功
- **WHEN** 数据库 station.version = 3，请求中 version = 3
- **THEN** `updateMany` 返回 count = 1，保存成功，新 version = 4

#### Scenario: 并发冲突被检测
- **WHEN** 两个并发请求同时对同一站点发起带 version=3 的保存
- **THEN** 先到的更新成功（count=1），后到的 count=0 返回 409

#### Scenario: version 为 0 也必须比对
- **WHEN** 数据库 station.version = 1，请求中 version = 0
- **THEN** 返回 409 版本冲突

### Requirement: 保存成功后返回新版本号
`POST /api/data` 成功保存后 MUST 在响应 JSON 中包含 `versions` 对象，映射每个站点 ID 到其新版本号。

#### Scenario: 保存返回版本信息
- **WHEN** 保存 3 个站点 A/B/C
- **THEN** 响应包含 `{ success: true, versions: { "A": 2, "B": 1, "C": 5 } }`

### Requirement: 前端更新站点版本号
`saveData()` 在收到服务端 200 响应后 MUST 从响应的 `versions` 对象中读取每个站点的新 `version` 值，并更新 `state.stations` 中对应站点的 `version` 字段。

#### Scenario: 版本号前端更新
- **WHEN** 服务端返回 `{ success: true, versions: { "station-x": 5 } }`
- **THEN** `state.stations` 中 `id === "station-x"` 的站点 `version` 变为 `5`

### Requirement: 409 冲突不可退回 localStorage
前端 `saveData()` 遇到 HTTP 409 响应时 MUST 返回 `{ success: false, conflict: true, error: '...' }`。MUST NOT 回退到 localStorage 保存。

401 响应时 MUST 返回 `{ success: false, needLogin: true, error: '...' }`。

仅在网络连接失败（`fetch` 抛出异常）时 MAY 回退到 localStorage。

#### Scenario: 409 冲突不回落
- **WHEN** `saveData()` 收到 409 响应
- **THEN** 返回 `{ success: false, conflict: true }`
- **AND** 不调用 `saveToLocal()`

#### Scenario: 网络不可达回落 localStorage
- **WHEN** `fetch` 抛出网络异常
- **THEN** 调用 `saveToLocal()` 并返回 `{ success: true, source: 'local' }`

### Requirement: 写接口限流
`POST /api/data` 端点 MUST 经过限流中间件。同一 IP 在 60 秒窗口内最多允许 30 次写请求。超出时 MUST 返回 HTTP 429。过期限流记录 MUST 定期清理。

#### Scenario: 限流拒绝过量请求
- **WHEN** 同一 IP 在 1 分钟内发送第 31 个 `POST /api/data` 请求
- **THEN** 返回 HTTP 429

### Requirement: localStorage 失败返回真实结果
`saveToLocal()` 在写入失败时 MUST 抛出异常。`saveData()` MUST 在 localStorage 回退失败时返回 `{ success: false, error: message }`。

#### Scenario: localStorage 写入失败
- **WHEN** localStorage 已满或不可用
- **THEN** `saveToLocal()` 抛出异常
- **AND** `saveData()` 返回 `{ success: false, error: "..." }`

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

- **单元测试** (`tests/data.test.js`)：`saveToLocal()` 失败、`saveData()` 版本更新、409/401 处理、credentials 模式
- **单元测试** (`tests/server-security.test.js`)：乐观锁 409 场景、Zod 长度/重复 ID 校验、限流 429 场景
- **集成测试** (`tests/integration/viz-data.test.js`)：mock fetch 适配新返回格式
