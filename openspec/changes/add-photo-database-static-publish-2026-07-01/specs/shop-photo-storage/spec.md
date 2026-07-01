## ADDED Requirements

### Requirement: 商铺稳定身份
系统 SHALL 为每个商铺维护稳定业务身份 `shopUid`。`shopUid` SHALL 是非空字符串，在数据库 `Shop.shopUid` 中全局唯一，并 SHALL 出现在 `GET /api/data`、`POST /api/data` 请求体、`data/default-data.json` 和静态快照中。

#### Scenario: 旧商铺回填稳定身份
- **WHEN** 数据库迁移运行在已有商铺记录上
- **THEN** 每个 `Shop` 都获得唯一非空 `shopUid`
- **AND** 后续 `GET /api/data` 返回每个商铺的 `shopUid`

#### Scenario: 新商铺生成稳定身份
- **WHEN** 已认证用户通过 `POST /api/data` 保存一个缺少 `shopUid` 的新商铺
- **THEN** 服务端为该商铺生成唯一 `shopUid`
- **AND** 保存成功后的 `GET /api/data` 返回该 `shopUid`

### Requirement: 商铺照片数据库模型
系统 SHALL 使用 `ShopPhoto` 数据模型为每个 `shopUid` 保存至多一张现场主图。`ShopPhoto` SHALL 包含 `shopUid`、`mimeType`、`byteSize`、`sha256`、`content Bytes`、`publishedStaticPath`、`publishedSha256`、`publishedAt`、`createdAt` 和 `updatedAt` 字段。

#### Scenario: 一铺一张主图
- **WHEN** 某个 `shopUid` 已有 `ShopPhoto`
- **AND** 已认证用户再次上传合法照片
- **THEN** 系统替换该 `shopUid` 对应的照片内容和元数据
- **AND** 数据库中该 `shopUid` 仍只有一条 `ShopPhoto` 记录

#### Scenario: 普通商铺保存不删除照片
- **WHEN** 某个商铺已有 `ShopPhoto`
- **AND** 已认证用户通过 `POST /api/data` 修改该商铺名称、面积或状态
- **THEN** 保存后该 `shopUid` 的 `ShopPhoto` 仍存在
- **AND** 照片 `sha256` 不变

### Requirement: 照片上传 API
系统 SHALL 提供 `PUT /api/shops/:shopUid/photo` 上传或替换商铺现场主图。该端点 MUST 要求认证、经过写接口限流，并使用 `multipart/form-data` 字段名 `photo` 接收文件。

#### Scenario: 上传合法照片
- **WHEN** 已认证用户向 `PUT /api/shops/shop_abc/photo` 上传字段名为 `photo` 的 JPEG、PNG 或 WebP 文件
- **AND** 文件大小小于等于 2MB
- **THEN** 服务端保存或替换该商铺照片
- **AND** 响应包含 `shopUid`、`photoUrl`、`sha256`、`mimeType` 和 `byteSize`

#### Scenario: 未认证上传被拒绝
- **WHEN** 未认证用户请求 `PUT /api/shops/shop_abc/photo`
- **THEN** 服务端返回 HTTP 401
- **AND** 数据库不创建或修改 `ShopPhoto`

### Requirement: 图片内容安全校验
照片上传 SHALL 只接受 JPEG、PNG 和 WebP。服务端 MUST 同时校验声明 MIME 和文件 magic bytes，MUST 拒绝超过 2MB、空文件、伪装 MIME、GIF、SVG、HTML 和其他非允许格式。

#### Scenario: 伪装 MIME 被拒绝
- **WHEN** 用户上传 `Content-Type: image/png` 但文件内容 magic bytes 不是 PNG
- **THEN** 服务端返回 HTTP 400
- **AND** 响应错误说明图片类型校验失败

#### Scenario: 超大图片被拒绝
- **WHEN** 用户上传大于 2MB 的图片
- **THEN** 服务端返回 HTTP 400 或 413
- **AND** 数据库不保存该照片

### Requirement: 照片读取 API
系统 SHALL 提供 `GET /api/shop-photos/:shopUid` 读取商铺现场主图。成功响应 SHALL 返回照片二进制内容、正确 `Content-Type`、`Cache-Control: public, max-age=31536000, immutable` 和基于 `sha256` 的 `ETag`。

#### Scenario: 读取已有照片
- **WHEN** 客户端请求已有照片的 `GET /api/shop-photos/shop_abc?v=<sha256>`
- **THEN** 服务端返回 HTTP 200
- **AND** 响应体为数据库中的照片二进制内容
- **AND** `Content-Type` 等于照片 `mimeType`

#### Scenario: 读取不存在照片
- **WHEN** 客户端请求没有照片的 `GET /api/shop-photos/shop_abc`
- **THEN** 服务端返回 HTTP 404

### Requirement: 删除照片 API
系统 SHALL 提供 `DELETE /api/shops/:shopUid/photo` 删除商铺现场主图。该端点 MUST 要求认证并经过写接口限流。

#### Scenario: 删除已有照片
- **WHEN** 已认证用户请求 `DELETE /api/shops/shop_abc/photo`
- **THEN** 服务端删除该 `shopUid` 对应的 `ShopPhoto`
- **AND** 后续 `GET /api/data` 返回该商铺 `photo` 为空字符串

### Requirement: 废弃 Data URL 照片写入
系统 MUST NOT 通过 `/api/data` 的 `shops[].photo` 保存非空 Data URL 图片内容。`POST /api/data` SHALL 接受空字符串或服务端生成的照片 URL 作为展示兼容值，但 SHALL 忽略该字段作为图片内容来源，图片内容只能通过照片 API 写入。

#### Scenario: 拒绝 Data URL 写入
- **WHEN** 已认证用户通过 `POST /api/data` 提交 `shops[0].photo` 为 `data:image/png;base64,...`
- **THEN** 服务端返回 HTTP 400
- **AND** 响应 details 指出照片内容必须通过照片 API 上传

## Testing Notes

- 单元测试：`tests/shop-photo-storage.test.js` 覆盖 magic bytes、MIME、大小、hash、URL 构造和 Data URL 拒绝。
- 集成测试：`tests/integration/auth-data-flow.test.js` 覆盖上传、读取、替换、删除和普通 `/api/data` 保存后照片不丢。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 覆盖真实页面选择图片并经照片 API 保存。
