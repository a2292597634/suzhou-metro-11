## MODIFIED Requirements

### Requirement: 站点商业趋势悬浮卡片展示点位信息和照片
经营总览页面的站点商业趋势悬浮卡片 SHALL 在下半部分展示当前站点每个商业点位的信息和照片缩略图，信息在左，照片在右。

#### Scenario: 悬浮趋势节点显示点位明细
- **WHEN** 用户鼠标悬停到站点商业趋势图中的某个站点节点
- **AND** 该站点包含 `shops`
- **THEN** 悬浮卡片下半部分显示该站点每个点位的名称或铺号
- **AND** 同一行左侧显示状态、商户或面积等点位信息
- **AND** 同一行右侧显示照片缩略图或无照片占位

#### Scenario: 有照片的点位显示缩略图
- **WHEN** 某点位 `photo` 非空
- **THEN** 趋势悬浮卡片中该点位右侧显示 `<img>` 缩略图
- **AND** 图片 `alt` 文本包含点位名称或铺号

#### Scenario: 无照片的点位不渲染破图
- **WHEN** 某点位 `photo` 为空字符串
- **THEN** 趋势悬浮卡片中该点位右侧显示紧凑占位
- **AND** 不渲染空 `src` 图片

#### Scenario: 点位数量较多时卡片尺寸稳定
- **WHEN** 某站点有超过 4 个点位
- **THEN** 趋势悬浮卡片宽度不超过既定紧凑宽度
- **AND** 点位明细区域在卡片内部滚动
- **AND** 趋势图 SVG 尺寸不因点位数量变化

## Testing Notes

- 集成测试：`tests/integration/home-dashboard.test.js` 覆盖 `renderStationTrend()` 生成点位明细、照片缩略图、无照片占位和内部滚动样式。
- E2E 测试：可在 `tests/e2e/home-flow.test.js` 或后续专门场景中覆盖趋势卡片悬停展示照片；本 change 至少需要集成测试锁定 DOM 结构和样式约束。
