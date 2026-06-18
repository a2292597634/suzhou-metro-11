# data-sync-and-validation Specification (Delta)

## MODIFIED Requirements

### Requirement: Zod 校验请求数据
服务端 MUST 使用 Zod schema 校验 `POST /api/data` 的请求体，非法数据返回 HTTP 400 和具体错误信息。

所有字符串字段 MUST 添加 `.max()` 长度限制：`stationSchema.id` ≤100、`stationSchema.name` ≤100、`shopSchema.name` ≤200、`shopSchema.tenant` ≤100、`shopSchema.contact` ≤100、`shopSchema.remark` ≤500 等。

Shop schema MUST 新增 `power` 字段（`z.enum(['20KW', '30KW']).optional().default('')`）和 `water` 字段（`z.enum(['有', '/']).optional().default('/')`）。

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

#### Scenario: 非法电量值
- **WHEN** shop power 不是 20KW 或 30KW
- **THEN** 返回 400，错误信息说明允许的值

#### Scenario: 非法上下水值
- **WHEN** shop water 不是「有」或「/」
- **THEN** 返回 400，错误信息说明允许的值

#### Scenario: 字符串超长被拒绝
- **WHEN** 站点 name 长度 > 100
- **THEN** 返回 400 校验失败

#### Scenario: 重复站点 ID 被拒绝
- **WHEN** stations 数组包含两个相同 id 的站点
- **THEN** 返回 400，错误信息提及重复 ID

## ADDED Requirements

### Requirement: Excel 导入后自动重算 GlobalStats
`POST /api/import-excel` 在事务成功提交后 MUST 自动重新计算并更新 GlobalStats 表。totalShops MUST 为所有商铺总数，rentedShops MUST 为 status='营业中' 的商铺数，vacantShops MUST = totalShops - rentedShops，rentRate MUST 为 `(rentedShops / totalShops * 100).toFixed(1) + '%'`。

#### Scenario: 导入后统计更新
- **WHEN** 导入完成后数据库有 74 个商铺，37 个营业中
- **THEN** GlobalStats.totalShops = 74，rentedShops = 37，vacantShops = 37，rentRate = '50.0%'

## Testing Notes

- **单元测试** (`tests/server-security.spec.js`)：更新 Zod 校验测试，覆盖 power/water 枚举值校验
- **单元测试** (`tests/excel-import.spec.js`)：GlobalStats 重算逻辑
- **集成测试** (`tests/integration/excel-api.spec.js`)：导入后查询 GlobalStats 验证更新
