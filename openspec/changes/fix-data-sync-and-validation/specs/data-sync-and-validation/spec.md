## ADDED Requirements

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

#### Scenario: 缺失必填字段
- **WHEN** 请求中某站点缺少 `name` 字段
- **THEN** 返回 400，包含字段名和期望类型

#### Scenario: 坐标超出范围
- **WHEN** 站点坐标 x > 3000 或 y > 3000
- **THEN** 返回 400

#### Scenario: 非法等级值
- **WHEN** 站点 grade 不是 S/A/B/C 之一
- **THEN** 返回 400

### Requirement: 乐观锁防止并发覆盖
Station 表 MUST 包含 `version` 字段。保存时如果请求中的 version 与数据库不匹配，MUST 返回 409 Conflict。

#### Scenario: 版本匹配正常保存
- **WHEN** 请求中 station.version = 数据库中的 version
- **THEN** 保存成功，version 自增 1

#### Scenario: 版本冲突拒绝保存
- **WHEN** 请求中 station.version != 数据库中的 version
- **THEN** 返回 409 Conflict

### Requirement: localStorage 失败返回真实结果
`saveToLocal()` 在写入失败时 MUST 抛出异常。`saveData()` MUST 在 localStorage 回退失败时返回 `{ success: false, error: message }`。

#### Scenario: localStorage 写入失败
- **WHEN** localStorage 已满或不可用
- **THEN** `saveToLocal()` 抛出异常
- **AND** `saveData()` 返回 `{ success: false, error: "..." }`

## Testing Notes

- **单元测试** (`tests/data.test.js`)：`saveToLocal()` 在 localStorage 失败时抛异常
- **集成测试** (`tests/data-sync.test.js`)：Zod 校验、完整同步、乐观锁
