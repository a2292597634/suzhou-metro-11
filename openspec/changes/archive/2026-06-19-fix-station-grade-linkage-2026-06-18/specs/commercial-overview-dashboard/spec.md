## ADDED Requirements

### Requirement: 首页等级统计和筛选使用当前站点等级
首页经营概览 SHALL 使用当前 `state.stations[].grade` 的规范化结果计算等级统计、生成等级徽标 class，并执行 S/A 级重点站筛选。首页 MUST NOT 使用旧硬编码等级或非站点数据来源决定筛选结果。

#### Scenario: 等级统计随站点数据变化
- **WHEN** `state.stations` 中包含 1 个 S 级、2 个 A 级、1 个 B 级、1 个 C 级站点
- **THEN** `calcHomeStats()` 返回的 `gradeCount` 为 `{ S: 1, A: 2, B: 1, C: 1 }`

#### Scenario: S/A 筛选使用当前等级
- **WHEN** 站点表格中一个站点的当前 `grade` 为 `A`
- **AND** 用户点击 `data-station-filter="priority"` 的筛选按钮
- **THEN** 该站点保持可见

#### Scenario: 等级徽标 class 使用规范化等级
- **WHEN** 站点当前 `grade` 为小写 `a`
- **THEN** 首页站点表格和趋势详情使用 A 级徽标 class

## Testing Notes

- 单元/集成测试：`tests/integration/home-dashboard.test.js` 覆盖 `calcHomeStats()`、`renderStationTable()`、S/A 筛选和徽标 class。
- Mock：DOM、`state`、必要时 mock `matchMedia`；不 mock等级规范化工具。
