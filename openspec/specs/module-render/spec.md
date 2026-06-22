# module-render Specification

## Purpose
The render module owns SVG line drawing, station card output, statistics panels, commercial grade panels, legends, connector lines, and safe DOM rendering for the battle map view.
## Requirements
### Requirement: 渲染模块绘制 SVG 地铁线路
渲染模块 SHALL 生成地铁线路、站点和连接线的 SVG 内容。

#### Scenario: 渲染主线
- **WHEN** 调用 renderSVG() 并传入站点数据时
- **THEN** 绘制 SVG 路径显示地铁线路：水平 → 垂直向下 → 斜线 → 水平

#### Scenario: 渲染站点节点
- **WHEN** 渲染站点时
- **THEN** 每个站点显示为圆点：换乘站为双圆环，普通站为带红色边框的单圆

#### Scenario: 渲染连接线
- **WHEN** 站点卡片定位完成后
- **THEN** SVG 线条连接每个站点节点与其对应的卡片

### Requirement: 渲染模块生成站点卡片
渲染模块 SHALL 创建包含商铺信息的站点卡片 DOM 元素。

#### Scenario: 卡片显示商铺列表
- **WHEN** 站点有商铺时
- **THEN** 卡片显示每个商铺的状态圆点、名称和承租方

#### Scenario: 卡片显示出租率色条
- **WHEN** 渲染站点卡片时
- **THEN** 顶部颜色条反映出租率：绿色 ≥60%、橙色 <60%、红色 =0%

#### Scenario: 卡片避让重叠
- **WHEN** 两张卡片会重叠时
- **THEN** 通过重叠避让算法调整它们的位置

### Requirement: 渲染模块生成统计面板
渲染模块 SHALL 用当前全局数据更新统计面板。

#### Scenario: 更新统计显示
- **WHEN** 全局统计发生变化时
- **THEN** 统计面板反映商铺总数、已出租数、出租率和空置数

### Requirement: 渲染模块生成分级面板
渲染模块 SHALL 显示商业价值分级面板。

#### Scenario: 显示分级定义
- **WHEN** 渲染分级面板时
- **THEN** 显示 S/A/B/C 四个等级及其名称、描述和颜色

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

