## Context

车站价值等级目前存在三个层面的来源：`state.stations[].grade`、`state.gradeInfo` 的分级定义，以及 `data.js` 中的内联默认站点数据。近期已更新 `data/default-data.json` 中每个车站的等级，但页面中仍有部分视图使用旧内联数据、静态描述或各自独立的等级判断，导致主作战图、首页和数据可视化页面可能显示不一致。

本项目是原生 ES Modules 前端，无构建步骤；跨页面共享状态通过 `state.js`，数据加载入口在 `data.js`。因此本设计优先复用现有模块边界，不引入框架、不新增依赖。

## Directory Layout

```text
js/
  modules/
    utils.js        # 新增共享等级规范化/分组工具
    data.js         # 默认数据兜底与 JSON 等级保持一致
    render.js       # 主作战图分级面板从 state.stations 派生站点名单
    home.js         # 首页等级统计、筛选、徽标使用共享等级工具
    viz.js          # 数据可视化筛选、卡片徽标、编辑后联动使用共享等级工具
    nav.js          # data-viz 页面导航命名为商业信息管理
data/
  default-data.json # 当前默认车站等级的权威静态数据
data-viz.html       # 商业信息管理页，新增站点价值等级管理模块挂载点
css/
  data-viz.css      # 商业信息管理页和价值等级管理模块样式
tests/
  data.test.js
  nav.test.js
  render.test.js
  viz.test.js
  integration/
    home-dashboard.test.js
    viz-data.test.js
```

## Goals / Non-Goals

**Goals:**

- 让所有价值等级 UI 从当前 `state.stations[].grade` 派生。
- 统一等级规范化规则，支持小写输入或空值时有明确兜底。
- 让商业价值分级面板动态显示每个等级下的当前车站名单。
- 确保内联默认数据和 `data/default-data.json` 的 `grade` 字段一致。
- 将导航中 data-viz 页面的名称统一为「商业信息管理」。
- 在商业信息管理页站点卡片网格下方新增站点价值等级管理模块，支持全线等级总览和批量编辑。
- 建立全站等级显示一致性约束：任何等级展示都从当前 `state.stations[].grade` 派生。
- 用测试覆盖等级联动，防止之后更新等级时再次漏改。

**Non-Goals:**

- 不修改后端 API schema 或数据库 schema。
- 不改变 S/A/B/C 四个等级的业务含义和颜色配置。
- 不引入新的图表库、状态管理库或构建工具。
- 不重做页面布局、视觉风格或非等级相关统计口径。
- 不新增除 S/A/B/C 之外的等级体系。

## Decisions

### 1. 使用共享工具统一等级判断

在 `utils.js` 中提供 `VALID_GRADES`、`normalizeGrade()`、`getGradeClass()`、`groupStationsByGrade()` 等纯函数。`render.js`、`home.js`、`viz.js` 均引用这些函数。

原因：当前模块各自写等级判断，容易出现 S/A 筛选、CSS class、图表统计不一致。共享纯函数可以通过单元测试锁住规则。

替代方案：在每个模块局部修正判断。这个方案改动更少，但后续新增页面仍容易复制出新分叉。

### 2. `state.stations[].grade` 是展示事实源，`state.gradeInfo` 只保留等级定义

`state.gradeInfo` 继续用于等级名称、描述和颜色定义；各等级下有哪些站点必须由 `state.stations` 实时分组得到。

原因：用户更新的是“每个车站的价值等级”，这属于站点事实数据；分级说明不应反向维护站点名单。

替代方案：把站点名单写入 `gradeInfo.desc`。这会造成双写，且编辑某个站点等级后必须同步改两处。

### 3. 默认数据一致性优先使用 JSON 权威数据

实现时优先减少或消除 `getDefaultStations()` 中与 `data/default-data.json` 重复的等级维护。如果仍保留内联兜底，测试必须比对每个 station id 的 `grade` 字段。

原因：现有问题的一部分来自 JSON 数据已更新而内联 fallback 仍是旧等级。默认数据必须有一个可验证的权威来源。

替代方案：继续手工同步内联数组。这个方案实现简单，但未来每次更新默认等级都需要记得改两份。

### 4. 编辑后的联动以重渲染现有页面为边界

当 data-viz 详情中修改车站等级并保存后，卡片徽标、筛选结果和图表回调应在当前 `renderGrid()` 流程中更新；切换页面后通过 `loadData()` 读取已保存数据。

原因：项目已有 `saveData()` 和页面级重渲染链路，复用它能保持改动聚焦。

替代方案：新增全局事件总线实时通知所有页面。当前页面是多 HTML 页面模型，不需要引入更复杂的实时同步机制。

### 5. 导航命名反映页面管理用途

将 `data-viz.html` 对应的导航 label 统一改为「商业信息管理」，页面 key、URL 和激活态逻辑保持不变。

原因：该页面后续承载商业点位增删改、车站价值等级调整和相关图表查看，「商业分析」会让用户误以为页面只读。「商业信息管理」覆盖编辑和维护语义，更适合导航栏。

替代方案：使用「商业资产管理」或「点位与等级管理」。前者偏资产台账，后者过长；当前导航更需要短、稳、清晰的名称。

### 6. 站点价值等级管理模块采用批量暂存

在商业信息管理页的站点卡片网格下方新增「站点价值等级管理」模块，模块包含 S/A/B/C 分布概览、全站等级编辑表、待保存计数、保存等级调整、撤销更改和定位到站点卡片操作。用户调整等级时先写入模块内的暂存状态，点击保存后再更新 `state.stations[].grade` 并调用 `saveData()`。

原因：等级调整常常是批量校准，一次点击一次保存会造成频繁写入，也让用户难以比较多个站点之间的等级分布。暂存后统一保存更接近管理台账操作。

替代方案：复用每张站点卡片展开详情中的等级下拉框。这个方案已经能单站编辑，但缺少全线分布视角，不能很好支持批量调整。

### 7. 全站等级显示一致性作为验收边界

所有等级展示面，包括主作战图分级面板、首页趋势详情、首页站点表格、商业信息管理页卡片、筛选工具、站点价值等级管理模块和相关图表回调，都必须使用同一套等级规范化工具和当前 `state.stations[].grade`。

原因：这次 change 的核心不是新增一个编辑入口，而是修复数据变化后页面不同步的问题。新增管理模块必须驱动全站现有显示，而不是形成第三份等级数据。

替代方案：只保证商业信息管理页内部联动。这个范围过窄，会留下主作战图和首页仍可能不同步的缺口。

## Risks / Trade-offs

- [Risk] `data/default-data.json` 在浏览器 fetch 失败时仍可能落入内联兜底 → Mitigation: 测试要求内联兜底等级与 JSON 完全一致，或重构为同一数据来源。
- [Risk] 等级字段存在空值、非法值或小写值 → Mitigation: 所有展示和筛选统一调用 `normalizeGrade()`，非法值兜底为 C。
- [Risk] 商业价值分级面板站点名单过长影响布局 → Mitigation: 仅使用当前等级下站名的简洁文本，保持原面板结构，不新增复杂交互。
- [Risk] 现有测试环境依赖缺失导致全量测试无法通过 → Mitigation: change 实施时先记录基线失败，再运行与等级联动相关的定向测试。

## Migration Plan

1. 新增等级工具函数和对应测试。
2. 调整默认数据兜底，保证与 `data/default-data.json` 的 station grade 一致。
3. 调整主作战图分级面板，使用当前站点等级分组渲染站点名单。
4. 调整首页统计/筛选/徽标逻辑，统一使用共享等级工具。
5. 调整数据可视化筛选/徽标/编辑后联动逻辑，统一使用共享等级工具。
6. 调整共享导航文案，将 data-viz 页面显示为「商业信息管理」。
7. 在商业信息管理页新增站点价值等级管理模块，并接入 `state.stations`、`saveData()` 和当前页面重渲染链路。
8. 运行定向测试；若依赖环境允许，再运行 `npm test`。

Rollback：如出现渲染问题，可回退本 change 修改的前端模块和测试文件；数据文件不做迁移，后端 API 不受影响。

## 测试架构设计

- `tests/data.test.js`: 对比 `getDefaultStations()` 与 `data/default-data.json` 中每个 station id 的 `grade`。
- `tests/nav.test.js`: 验证桌面顶部导航和移动底部导航显示「商业信息管理」。
- `tests/render.test.js`: 设置不同等级的 `state.stations`，验证 `renderGradePanel()` 输出的各等级站点名单随数据变化。
- `tests/integration/home-dashboard.test.js`: 通过 `calcHomeStats()` 和 `renderStationTable()` 验证等级统计、S/A 筛选、徽标 class 使用当前等级。
- `tests/viz.test.js`: 验证 `filterStations()`、`renderCard()`、站点价值等级管理模块渲染和保存后回调使用规范化等级。
- `tests/integration/viz-data.test.js`: 验证商业信息管理页批量保存等级后，卡片、筛选、分布概览和图表回调同步更新。
- 需要 mock：`fetch`、`localStorage`、`requestAnimationFrame`。
- 不需要 mock：`state`、等级工具函数、渲染函数本身。

## Open Questions

- 是否允许非法等级值统一显示为 C，还是应该在 UI 中显示“未分级”？本 change 默认采用 C 兜底以兼容现有样式。
- 商业价值分级面板中的 `gradeInfo.desc` 是否仍作为等级说明保留？本 change 默认保留说明，并新增/替换站点名单显示为当前分组结果。
- 站点价值等级管理模块首版是否需要显示等级调整原因？本 change 默认不做原因字段，先聚焦 S/A/B/C 的一致性维护。
