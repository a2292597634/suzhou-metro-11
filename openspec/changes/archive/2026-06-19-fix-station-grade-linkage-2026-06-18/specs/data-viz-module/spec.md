## ADDED Requirements

### Requirement: 数据可视化等级筛选和徽标使用当前站点等级
data-viz 模块 SHALL 使用当前 `state.stations[].grade` 的规范化结果进行等级筛选、卡片徽标渲染、`data-grade` 属性输出和图表回调数据生成。编辑站点等级并保存后，当前卡片网格和图表 SHALL 反映最新等级。

#### Scenario: 等级筛选使用规范化等级
- **WHEN** 一个站点的当前 `grade` 为小写 `a`
- **AND** 调用 `filterStations(stations, "A")`
- **THEN** 返回结果包含该站点

#### Scenario: 卡片徽标显示当前等级
- **WHEN** 站点当前 `grade` 从 `B` 改为 `S` 后调用 `renderCard()`
- **THEN** 卡片的等级徽标文本为 `S`
- **AND** 卡片的 `data-grade` 属性为 `S`

#### Scenario: 编辑保存后图表回调用最新等级筛选结果
- **WHEN** 用户在 data-viz 详情中把一个站点等级改为 `A` 并保存
- **AND** 当前筛选条件为 `A`
- **THEN** `renderGrid()` 的图表回调收到包含该站点的数组

### Requirement: 商业信息管理页提供站点价值等级管理模块
data-viz 页面 SHALL 在站点卡片网格下方显示「站点价值等级管理」模块。该模块 SHALL 展示 S/A/B/C 等级分布概览、按线路顺序排列的全站等级编辑表、待保存更改数量、保存等级调整、撤销更改和定位到卡片操作。

#### Scenario: 渲染等级分布概览
- **WHEN** 商业信息管理页加载完成并渲染站点价值等级管理模块
- **THEN** 模块显示 S/A/B/C 四个等级的站点数量
- **AND** 每个等级的站点名单来自当前 `state.stations[].grade`

#### Scenario: 暂存批量等级调整
- **WHEN** 用户在等级编辑表中将一个站点从 `B` 调整为 `A`
- **THEN** 该行显示为待保存状态
- **AND** 模块显示待保存更改数量为 `1`
- **AND** `state.stations` 在点击保存前不被修改

#### Scenario: 保存等级调整后刷新当前页面
- **WHEN** 用户点击「保存等级调整」
- **THEN** 系统将暂存等级写入对应的 `state.stations[].grade`
- **AND** 调用 `saveData()`
- **AND** 站点卡片、等级筛选结果、图表回调数据和等级分布概览全部使用保存后的等级重新渲染

#### Scenario: 撤销未保存等级调整
- **WHEN** 用户已经暂存多个等级调整但尚未保存
- **AND** 用户点击「撤销更改」
- **THEN** 等级编辑表恢复为当前 `state.stations[].grade`
- **AND** 待保存更改数量归零

#### Scenario: 定位到站点卡片
- **WHEN** 用户点击某个站点行的「定位卡片」操作
- **THEN** 页面滚动到对应站点卡片
- **AND** 不改变该站点的等级值

## Testing Notes

- 单元测试：`tests/viz.test.js` 覆盖 `filterStations()`、`renderCard()` 与规范化等级。
- 单元测试：`tests/viz.test.js` 覆盖站点价值等级管理模块的分布渲染、暂存、撤销和保存回调。
- 集成测试：可复用 `tests/integration/viz-data.test.js` 验证保存后 `renderGrid()`、等级筛选、图表回调和分布概览同步更新。
- Mock：`saveData()`、DOM、`requestAnimationFrame`。
