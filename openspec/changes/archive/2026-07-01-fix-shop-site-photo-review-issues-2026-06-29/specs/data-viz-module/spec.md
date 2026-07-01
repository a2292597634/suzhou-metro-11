## MODIFIED Requirements

### Requirement: 商业信息管理页商铺编辑表格支持现场照片
data-viz 模块 SHALL 在站点详情的商铺编辑表格中显示每个商铺的现场照片管理控件，并在保存站点详情时保留 `shop.photo` 字段。保存操作 SHALL 根据 `saveData()` 的 `success` 字段显示结果：仅当 `success === true` 时显示成功提示；当 `success === false` 时显示中文失败提示，不得显示成功提示。

#### Scenario: 商铺表格显示照片状态和操作
- **WHEN** 站点详情展开
- **THEN** 商铺表格包含“现场照片”列
- **AND** 每行显示“导入照片”或“替换照片”操作
- **AND** 有照片的行显示删除照片操作

#### Scenario: 保存站点详情保留照片字段
- **WHEN** 用户编辑商铺其他字段并点击“保存修改”
- **THEN** 原有 `shop.photo` 字段不被清空
- **AND** `saveData()` 请求体包含该商铺的 `photo`

#### Scenario: 新增商铺默认没有照片
- **WHEN** 用户点击“添加商铺”
- **THEN** 新商铺对象包含 `photo: ""`
- **AND** 页面不会显示已有照片状态

#### Scenario: 保存失败不显示成功提示
- **WHEN** 用户点击“保存修改”
- **AND** `saveData()` 返回 `{ success: false, source: "server", error: "数据校验失败" }`
- **THEN** 页面显示包含“保存失败”或“数据校验失败”的中文提示
- **AND** 页面不显示“数据已保存到服务器”成功提示

### Requirement: 商铺卡片预览项支持照片悬停
data-viz 模块 SHALL 让站点卡片中的商铺预览项在有照片时可触发照片预览。

#### Scenario: 预览项携带照片预览上下文
- **WHEN** 站点卡片渲染前三个商铺预览项
- **AND** 某商铺 `photo` 非空
- **THEN** 对应预览项带有可触发照片预览的 DOM 标记
- **AND** 悬停时显示该商铺照片

## ADDED Requirements

### Requirement: 商业信息管理页照片完整流程必须可端到端验证
商业信息管理页 SHALL 支持用户在真实页面中完成导入照片、保存、刷新后保留、悬停预览、删除照片、再次刷新后清空的完整流程。

#### Scenario: 导入保存刷新后照片保留
- **WHEN** 用户在 `data-viz.html` 展开站点详情
- **AND** 在某个商铺行导入小于等于 2MB 的 JPEG、PNG 或 WebP 图片
- **AND** 点击“保存修改”
- **AND** 页面刷新或重新进入 `data-viz.html`
- **THEN** 该商铺仍显示已有照片状态
- **AND** 悬停该商铺照片列时显示包含商铺名称的照片预览浮层

#### Scenario: 删除保存刷新后照片清空
- **WHEN** 用户删除已有现场照片并确认
- **AND** 点击“保存修改”
- **AND** 页面刷新或重新进入 `data-viz.html`
- **THEN** 该商铺不再显示已有照片状态
- **AND** 悬停该商铺照片列时不显示图片浮层

## Testing Notes

- 单元测试：`tests/viz.test.js` 覆盖 `saveData()` 返回失败时的 toast 文案和不显示成功提示。
- 集成测试：`tests/integration/viz-data.test.js` 覆盖商业信息管理页保存失败时不误报成功，并继续保留 `shop.photo` 字段。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 使用 Puppeteer 和小型测试图片文件覆盖导入、保存、刷新、悬停预览、删除、再次刷新。
- 需要 mock：单元/集成层 mock `saveData()`、`FileReader`、`confirm`；E2E 层不 mock页面业务逻辑。
