## ADDED Requirements

### Requirement: 商业信息管理页商铺编辑表格支持现场照片
data-viz 模块 SHALL 在站点详情的商铺编辑表格中显示每个商铺的现场照片管理控件，并在保存站点详情时保留 `shop.photo` 字段。

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

### Requirement: 商铺卡片预览项支持照片悬停
data-viz 模块 SHALL 让站点卡片中的商铺预览项在有照片时可触发照片预览。

#### Scenario: 预览项携带照片预览上下文
- **WHEN** 站点卡片渲染前三个商铺预览项
- **AND** 某商铺 `photo` 非空
- **THEN** 对应预览项带有可触发照片预览的 DOM 标记
- **AND** 悬停时显示该商铺照片

## Testing Notes

- 单元测试：`tests/viz.test.js` 覆盖商铺编辑表格照片列、按钮文案、新增商铺默认 `photo`。
- 集成测试：`tests/integration/viz-data.test.js` 覆盖保存站点详情时照片字段不丢失。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 覆盖用户在真实商业信息管理页进行照片操作。
