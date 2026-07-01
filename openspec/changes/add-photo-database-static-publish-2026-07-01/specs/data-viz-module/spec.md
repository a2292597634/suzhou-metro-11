## ADDED Requirements

### Requirement: 商业信息管理页使用照片 API 管理现场主图
data-viz 模块 SHALL 在商铺行提供现场照片导入、替换和删除能力，并 SHALL 使用 `PUT /api/shops/:shopUid/photo` 和 `DELETE /api/shops/:shopUid/photo` 管理图片内容。data-viz 模块 MUST NOT 将图片 Data URL 写入 `shop.photo` 后再通过 `saveData()` 持久化。

#### Scenario: 上传现场照片
- **WHEN** 用户在商铺行点击导入照片并选择小于等于 2MB 的 JPEG、PNG 或 WebP 图片
- **THEN** data-viz 使用 `FormData` 字段名 `photo` 调用 `PUT /api/shops/:shopUid/photo`
- **AND** 上传成功后用响应中的 `photoUrl` 更新该商铺的 `photo`
- **AND** 页面显示已有照片状态

#### Scenario: 替换现场照片
- **WHEN** 商铺已有照片
- **AND** 用户选择新的合法图片
- **THEN** data-viz 调用同一个 `PUT /api/shops/:shopUid/photo`
- **AND** 新照片 URL 替换当前商铺 `photo`

#### Scenario: 删除现场照片
- **WHEN** 商铺已有照片
- **AND** 用户点击删除照片并确认
- **THEN** data-viz 调用 `DELETE /api/shops/:shopUid/photo`
- **AND** 成功后将该商铺 `photo` 和 `photoHash` 设为空字符串

### Requirement: 照片操作认证和错误反馈
data-viz 模块 SHALL 对照片上传、替换和删除结果显示中文 toast。401 SHALL 提示用户登录；400 SHALL 显示图片类型、大小或校验错误；网络失败 SHALL 显示未保存到服务器，不得显示成功。

#### Scenario: 未登录上传提示登录
- **WHEN** 照片上传 API 返回 HTTP 401
- **THEN** 页面显示“请先登录后再上传照片”或等价中文提示
- **AND** 不更新该商铺 `photo`

#### Scenario: 上传失败不误报成功
- **WHEN** 照片上传 API 返回 HTTP 400
- **THEN** 页面显示失败原因
- **AND** 不显示“照片已上传”成功提示

### Requirement: 静态发布状态反馈
data-viz 模块 SHALL 显示静态站发布状态。状态值为 `pending` 或 `running` 时，页面 SHALL 显示“静态站发布中”；状态值为 `success` 时显示最近发布时间；状态值为 `failed` 时显示失败原因和重试操作。

#### Scenario: 显示发布失败
- **WHEN** `GET /api/static-publish/status` 返回 `{ status: "failed", error: "push failed" }`
- **THEN** 页面显示静态站发布失败提示
- **AND** 页面提供重新请求发布的操作

#### Scenario: 请求重新发布
- **WHEN** 用户点击重新发布操作
- **THEN** data-viz 调用 `POST /api/static-publish/request`
- **AND** 请求成功后显示静态站发布中

### Requirement: 照片悬停预览兼容动态与静态路径
data-viz 模块 SHALL 对 `/api/shop-photos/*` 和 `/assets/shop-photos/*` 两类照片路径显示同样的悬停预览。无照片时 MUST NOT 渲染空 `src` 图片。

#### Scenario: 动态 URL 预览
- **WHEN** 商铺 `photo` 为 `/api/shop-photos/shop_abc?v=8f4e2c9a1b23`
- **AND** 用户悬停照片列
- **THEN** 页面显示包含该照片和商铺名称的预览浮层

#### Scenario: 静态路径预览
- **WHEN** 商铺 `photo` 为 `/assets/shop-photos/shop_abc-8f4e2c9a1b23.jpg`
- **AND** 用户悬停照片列
- **THEN** 页面显示包含该照片和商铺名称的预览浮层

## Testing Notes

- 单元测试：`tests/viz.test.js` 覆盖照片按钮渲染、成功/失败 toast、无照片不渲染空图片。
- 集成测试：`tests/integration/viz-data.test.js` 覆盖 `PUT`、`DELETE`、发布状态查询和重试请求。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 覆盖真实上传、刷新、删除和静态发布状态反馈。
