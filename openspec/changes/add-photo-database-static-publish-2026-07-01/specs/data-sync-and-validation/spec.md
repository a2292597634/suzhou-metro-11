## MODIFIED Requirements

### Requirement: 保存时完整同步站点、商铺稳定身份和分级信息
`POST /api/data` MUST 在保存时删除数据库中存在于但不在请求中的站点和分级信息，确保数据完整同步。保存商铺时 MUST 使用 `shopUid` 保持商铺稳定身份；已有 `shopUid` 的商铺 SHALL 更新原记录，新商铺 SHALL 生成新 `shopUid`。普通资料保存 MUST NOT 删除或重建同一 `shopUid` 对应的 `ShopPhoto`。

#### Scenario: 删除站点
- **WHEN** 数据库中包含站点 A、B、C，而请求中只含 A、B
- **THEN** 站点 C 及其关联商铺被删除
- **AND** 站点 C 下商铺对应的 `ShopPhoto` 被级联删除或显式删除

#### Scenario: 新增站点
- **WHEN** 请求中包含数据库不存在的站点 D
- **THEN** 站点 D 被创建
- **AND** 站点 D 下缺少 `shopUid` 的商铺获得唯一 `shopUid`

#### Scenario: 保留已有商铺照片关系
- **WHEN** 数据库中商铺 `shopUid = "shop_abc"` 已有关联 `ShopPhoto`
- **AND** 请求中仍包含 `shopUid = "shop_abc"` 但修改了商铺名称
- **THEN** 保存成功后 `ShopPhoto.shopUid = "shop_abc"` 的照片仍存在

### Requirement: Zod 校验请求数据
服务端 MUST 使用 Zod schema 校验 `POST /api/data` 的请求体，非法数据返回 HTTP 400 和具体错误信息。

所有字符串字段 MUST 添加 `.max()` 长度限制：`stationSchema.id` ≤100、`stationSchema.name` ≤100、`shopSchema.shopUid` ≤100、`shopSchema.name` ≤200、`shopSchema.tenant` ≤100、`shopSchema.contact` ≤100、`shopSchema.remark` ≤500 等。

Shop schema MUST 新增或保留 `shopUid` 字段（非空字符串时最大 100 字符，可选，缺失时服务端生成）、`power` 字段（`z.union([z.enum(['20KW', '30KW']), z.literal('')]).optional().default('')`）和 `water` 字段（`z.union([z.enum(['有', '/']), z.literal('')]).optional().default('/')`）。

`shops[].photo` MUST NOT 接受 `data:image/*;base64,...` Data URL 作为图片内容。非空 `photo` 只允许为空字符串、`/api/shop-photos/<shopUid>?v=<sha256>` 或 `/assets/shop-photos/<shopUid>-<sha256-12>.<jpg|png|webp>` 展示引用。图片内容 MUST 通过照片 API 上传。

`stations` 数组 MUST ≤100，`shops` 数组 MUST ≤200。MUST 通过 `.refine()` 检查无重复站点 ID，并 MUST 在单次请求内拒绝重复非空 `shopUid`。

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

#### Scenario: 重复 shopUid 被拒绝
- **WHEN** 同一个 `POST /api/data` 请求包含两个 `shopUid = "shop_abc"` 的商铺
- **THEN** 返回 400，错误信息提及重复 `shopUid`

#### Scenario: Data URL 照片字段被拒绝
- **WHEN** 请求中某商铺 `photo` 为 `data:image/jpeg;base64,...`
- **THEN** 返回 400，错误信息说明图片内容必须通过照片 API 上传

## ADDED Requirements

### Requirement: API 返回轻量照片引用
`GET /api/data` SHALL 为每个商铺返回 `shopUid`、`photo` 和 `photoHash`。有数据库照片时，`photo` SHALL 为 `/api/shop-photos/<shopUid>?v=<sha256-12>`；无照片时，`photo` 和 `photoHash` SHALL 为空字符串。

#### Scenario: 返回数据库照片 URL
- **WHEN** 数据库中 `shopUid = "shop_abc"` 的商铺有 `ShopPhoto.sha256 = "8f4e2c9a1b23..."`
- **THEN** `GET /api/data` 返回该商铺 `photo = "/api/shop-photos/shop_abc?v=8f4e2c9a1b23"`
- **AND** 返回 `photoHash = "8f4e2c9a1b23..."`

#### Scenario: 无照片返回空字符串
- **WHEN** 数据库中某商铺没有 `ShopPhoto`
- **THEN** `GET /api/data` 返回该商铺 `photo = ""`
- **AND** 返回 `photoHash = ""`

### Requirement: 静态快照数据契约
导出的 `data/default-data.json` SHALL 使用同一站点和商铺数据结构，额外包含顶层 `snapshotId`。静态快照中的商铺 `photo` SHALL 为 `/assets/shop-photos/<shopUid>-<sha256-12>.<ext>` 或空字符串。

#### Scenario: 静态快照商铺字段完整
- **WHEN** 读取导出的 `data/default-data.json`
- **THEN** 每个商铺包含 `shopUid`
- **AND** 有照片商铺的 `photo` 指向 `/assets/shop-photos/`
- **AND** 无照片商铺的 `photo` 为空字符串

## Testing Notes

- 单元测试：`tests/shop-schema.test.js` 或 `tests/shop-photo-storage.test.js` 覆盖 `shopUid`、照片 URL、Data URL 拒绝和重复 `shopUid`。
- 集成测试：`tests/integration/auth-data-flow.test.js` 覆盖 `/api/data` 保存后 `shopUid` 稳定、照片关系保留和轻量 URL 返回。
- 静态测试：`tests/static-snapshot.test.js` 覆盖导出 JSON 的 `snapshotId`、`shopUid` 和静态照片路径。
