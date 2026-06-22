## ADDED Requirements

### Requirement: 分级面板站点名单由当前站点等级派生
渲染模块 SHALL 在商业价值分级面板中根据当前 `state.stations[].grade` 动态生成 S/A/B/C 各等级下的站点名单。分级面板 MUST NOT 依赖手写站点名单或旧的 `gradeInfo.desc` 来决定某个车站属于哪个等级。

#### Scenario: 站点等级变化后分级面板同步变化
- **WHEN** `state.stations` 中某个站点的 `grade` 从 `B` 改为 `A` 后调用 `renderGradePanel()`
- **THEN** 分级面板的 A 级站点名单包含该站点
- **AND** B 级站点名单不再包含该站点

#### Scenario: 空等级使用规范化兜底
- **WHEN** `state.stations` 中某个站点的 `grade` 为空值或非法值后调用 `renderGradePanel()`
- **THEN** 该站点按照共享等级规范化规则显示在兜底等级中

#### Scenario: 分级定义仍可显示
- **WHEN** `state.gradeInfo` 包含 S/A/B/C 的名称、描述和颜色
- **THEN** 分级面板继续显示等级名称和定义
- **AND** 站点名单来自 `state.stations`

## Testing Notes

- 单元测试：`tests/render.test.js` 覆盖 `renderGradePanel()` 对 `state.stations` 的动态分组。
- 安全测试：继续覆盖等级名称、描述和站点名称的 HTML 转义。
- Mock：只需设置 DOM 和 `state`，不需要 mock 网络。
