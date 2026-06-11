## MODIFIED Requirements

### Requirement: 乐观锁使用严格的版本比对
保存站点时，若数据库中存在同名 ID 的站点且请求中的 `version` 不为 `null`/`undefined`，MUST 比对版本号。不匹配时 MUST 返回 HTTP 409 `{ error: '版本冲突', stationId: '<id>', detail: '...' }`。

`version` 值 `0` MUST 参与版本比对（不可用 falsy 检查绕过）。仅有 `undefined` 和 `null` 表示"跳过版本检查"（用于新站点首次同步或修复场景）。

保存成功后 `version` MUST 自增 1。

#### Scenario: version 匹配正常保存
- **WHEN** 数据库 station.version = 3，请求中 version = 3
- **THEN** 保存成功，新 version = 4

#### Scenario: version 为 0 也必须比对
- **WHEN** 数据库 station.version = 1，请求中 version = 0
- **THEN** 返回 409 版本冲突

#### Scenario: version 为 undefined 跳过检查
- **WHEN** 请求中未携带 version 字段（undefined）
- **THEN** 跳过版本检查，正常保存

### Requirement: 保存成功后返回新版本号
`POST /api/data` 成功保存后 MUST 在响应 JSON 中包含 `versions` 对象，映射每个站点 ID 到其新版本号。

#### Scenario: 保存返回版本信息
- **WHEN** 保存 3 个站点 A/B/C
- **THEN** 响应包含 `{ versions: { "A": 2, "B": 1, "C": 5 } }`

### Requirement: 409 冲突不可退回 localStorage
前端 `saveData()` 遇到 HTTP 409 响应时 MUST 返回 `{ success: false, conflict: true, error: '...' }`。MUST NOT 回退到 localStorage 保存。调用方 SHOULD 提示用户刷新页面。

401 响应时 MUST 返回 `{ success: false, needLogin: true, error: '请先登录后再保存' }`。

仅在网络连接失败（`fetch` 抛出异常）时 MAY 回退到 localStorage。

#### Scenario: 409 冲突不回落
- **WHEN** `saveData()` 收到 409 响应
- **THEN** 返回 `{ success: false, conflict: true }`
- **AND** 不调用 `saveToLocal()`

#### Scenario: 网络不可达回落 localStorage
- **WHEN** `fetch` 抛出网络异常
- **THEN** 调用 `saveToLocal()` 并返回 `{ success: true, source: 'local' }`

### Requirement: 前端更新站点版本号
`saveData()` 在收到服务端 200 响应后 MUST 从响应的 `versions` 对象中读取每个站点的新 `version` 值，并更新 `state.stations` 中对应站点的 `version` 字段。

#### Scenario: 版本号前端更新
- **WHEN** 服务端返回 `{ success: true, versions: { "station-x": 5 } }`
- **THEN** `state.stations` 中 `id === "station-x"` 的站点 `version` 变为 `5`

### Requirement: Zod 校验增强
所有 Zod schema 的字符串字段 MUST 添加 `.max()` 限制：
- `stationSchema.id`: `.max(100)`
- `stationSchema.name`: `.max(100)`
- `stationSchema.transferLine`: `.max(100)`
- `shopSchema.name`: `.max(200)`
- `shopSchema.shortNo`: `.max(50)`
- `shopSchema.type`: `.max(50)`
- `shopSchema.tenant`: `.max(100)`
- `shopSchema.contact`: `.max(100)`
- `shopSchema.openDate`: `.max(50)`
- `shopSchema.remark`: `.max(500)`
- `globalStatsSchema.statsDate`: `.max(100)`
- `globalStatsSchema.rentRate`: `.max(20)`
- `gradeInfoSchema` key: `.max(10)`, `name`: `.max(100)`, `desc`: `.max(500)`, `color`: `.max(20)`

`stations` 数组 MUST `.max(100)`。每个站点的 `shops` 数组 MUST `.max(200)`。

`dataSchema` MUST 通过 `.refine()` 检查 `stations` 数组无重复 `id`。

#### Scenario: 字符串超长被拒绝
- **WHEN** 站点 name 长度 > 100
- **THEN** 返回 400 校验失败

#### Scenario: 重复站点 ID 被拒绝
- **WHEN** stations 数组包含两个相同 id 的站点
- **THEN** 返回 400，错误信息提及重复 ID

### Requirement: 写接口限流
`POST /api/data` 端点 MUST 经过限流中间件。同一 IP 在 60 秒窗口内最多允许 30 次写请求。超出时 MUST 返回 HTTP 429 `{ error: '请求过于频繁，请稍后再试' }`。过期限流记录 MUST 定期清理。

#### Scenario: 限流拒绝过量请求
- **WHEN** 同一 IP 在 1 分钟内发送第 31 个 `POST /api/data` 请求
- **THEN** 返回 HTTP 429

#### Scenario: 窗口过期后恢复
- **WHEN** 上一窗口已过期
- **THEN** 新窗口的第一个请求正常处理

## Testing Notes

- **单元测试** (`tests/server-security.test.js`)：乐观锁 409 场景、Zod 长度/重复 ID 校验、限流 429 场景
- **单元测试** (`tests/data.test.js`)：前端 `saveData()` 版本更新、409/401 处理、credentials 模式
- **集成测试** (`tests/integration/viz-data.test.js`)：mock fetch 适配新返回格式
