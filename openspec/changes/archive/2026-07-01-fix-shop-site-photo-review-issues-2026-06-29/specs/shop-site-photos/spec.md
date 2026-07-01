## MODIFIED Requirements

### Requirement: 商铺现场主图服务器持久化
系统 SHALL 为每个商铺保存至多一张现场主图，字段名为 `photo`，默认值为空字符串，并通过服务器数据库持久保存。首版 `photo` SHALL 只允许空字符串或合法图片 Data URL，合法格式为 `data:image/jpeg;base64,...`、`data:image/png;base64,...` 或 `data:image/webp;base64,...`，最大长度为 3_000_000 个字符。系统 MUST NOT 将 `/assets/shop-photos/*` 等静态文件路径视为合法现场主图值。

#### Scenario: 保存商铺照片后服务器返回同一照片
- **WHEN** 已认证用户通过 `POST /api/data` 保存包含 `shops[0].photo` 的站点数据
- **AND** `photo` 是合法的 `data:image/jpeg;base64,...`、`data:image/png;base64,...` 或 `data:image/webp;base64,...`
- **AND** `photo` 长度大于 500 且小于等于 3_000_000 个字符
- **THEN** 服务器保存成功
- **AND** 后续 `GET /api/data` 返回同一商铺的 `photo` 字段

#### Scenario: 商铺没有照片时使用空字符串
- **WHEN** 商铺数据未提供 `photo`
- **THEN** 服务端校验后的商铺 `photo` 值为空字符串
- **AND** 前端渲染时不显示破图

#### Scenario: 拒绝非法照片字段
- **WHEN** 已认证用户提交的 `photo` 不是空字符串或合法图片 Data URL
- **THEN** `/api/data` 返回 400
- **AND** 响应 details 指出照片字段校验失败

#### Scenario: 拒绝静态资源路径照片字段
- **WHEN** 已认证用户提交的 `photo` 为 `/assets/shop-photos/demo.png`
- **THEN** `/api/data` 返回 400
- **AND** 数据库不保存该路径型照片值

### Requirement: 商业信息管理页照片管理
商业信息管理页 SHALL 在每个商铺行提供现场照片导入、替换和删除能力，且每个商铺只保留一张主图。照片导入 SHALL 通过浏览器 `FileReader.readAsDataURL()` 写入 `shop.photo`，不得依赖独立照片上传接口。

#### Scenario: 导入现场照片
- **WHEN** 用户在商铺行点击导入照片并选择小于等于 2MB 的 JPEG、PNG 或 WebP 图片
- **THEN** 前端读取图片为 Data URL
- **AND** 将该 Data URL 写入对应 `shop.photo`
- **AND** 商铺行显示已有照片状态

#### Scenario: 替换现场照片
- **WHEN** 商铺已有 `photo`
- **AND** 用户再次选择一张合法图片
- **THEN** 新图片替换原 `shop.photo`
- **AND** 该商铺仍只有一张主图

#### Scenario: 删除现场照片
- **WHEN** 商铺已有 `photo`
- **AND** 用户点击删除照片并确认
- **THEN** 对应 `shop.photo` 被设置为空字符串
- **AND** 保存后服务器不再返回旧照片

#### Scenario: 拒绝不支持的图片类型或超大图片
- **WHEN** 用户选择非 JPEG、PNG、WebP 图片
- **OR** 图片原文件大于 2MB
- **THEN** 前端不修改 `shop.photo`
- **AND** 显示可理解的中文错误提示

### Requirement: 商业信息管理页照片悬停预览
商业信息管理页 SHALL 在鼠标悬停到对应商铺行或商铺预览项时，对已有照片的商铺显示现场照片预览。

#### Scenario: 悬停有照片的商铺显示预览
- **WHEN** 商铺 `photo` 非空
- **AND** 用户鼠标悬停到该商铺行或预览项
- **THEN** 页面显示包含该照片的预览浮层
- **AND** 预览浮层包含商铺名称或铺号作为上下文

#### Scenario: 悬停无照片的商铺不显示图片浮层
- **WHEN** 商铺 `photo` 为空字符串
- **AND** 用户鼠标悬停到该商铺行或预览项
- **THEN** 页面不显示空白图片浮层
- **AND** 不渲染 `src=""` 的图片元素

## ADDED Requirements

### Requirement: 照片功能不得新增独立上传接口
商铺现场照片首版 SHALL 只通过现有 `/api/data` 数据保存链路持久化。系统 MUST NOT 暴露 `POST /api/upload-photo`，也 MUST NOT 为照片新增独立 multer 存储目录或上传生命周期。

#### Scenario: 上传接口不存在
- **WHEN** 客户端请求 `POST /api/upload-photo`
- **THEN** 服务端不提供该照片上传端点
- **AND** 代码中不存在照片专用 `uploadPhoto` multer 配置

### Requirement: 默认数据不得引用缺失照片资源
默认数据文件 `data/default-data.json` 中的 `shops[].photo` SHALL 为空字符串或合法 Data URL。默认数据 MUST NOT 引用仓库未提交的 `/assets/shop-photos/*` 文件路径。

#### Scenario: 默认照片资源不破图
- **WHEN** 页面从 `/data/default-data.json` 加载默认站点数据
- **THEN** 任一商铺的 `photo` 不为 `/assets/shop-photos/*` 路径
- **AND** 没有照片的商铺按无照片状态渲染，不显示破图

## Testing Notes

- 单元测试：`tests/shop-schema.test.js` 覆盖合法长 Data URL、3_000_000 字符上限和路径型值拒绝。
- 集成/API 测试：`tests/integration/auth-data-flow.test.js` 覆盖 500 字符以上合法 Data URL 经 `/api/data` 保存并读取。
- 安全测试：`tests/server-security.test.js` 覆盖 `/assets/shop-photos/*.png` 路径型照片字段返回 400。
- 数据回归测试：`tests/data.test.js` 覆盖 `data/default-data.json` 不包含 `/assets/shop-photos/` 引用。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 覆盖真实页面照片导入、保存、悬停预览和删除。
