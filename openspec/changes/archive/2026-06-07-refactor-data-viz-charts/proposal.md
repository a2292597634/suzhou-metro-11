## 为什么做这个变更

`data-viz.html` 是项目中唯一不接入 `js/modules/` 模块体系的页面，600+ 行 JS 全部内联在 HTML 中，与 `data.js` 的数据加载/保存逻辑完全重复，且使用私有 `allStations` 数组而非共享 `state.stations`，导致数据可视化页的编辑结果与作战图页面不可见彼此。此外页面名叫"商业数据可视化"却没有任何图表——只有卡片网格，名实严重不符。在项目三页架构中，这是最薄弱、技术债务最重的一环，必须在叠加更多功能前先解决架构裂缝。

## 变更内容

- 将 `data-viz.html` 内联 JS 逻辑提取为 `js/modules/viz.js`，接入 ES Module 体系
- 删除与 `data.js` 重复的 `loadData`/`saveAll` 实现，复用 `data.js` 的 `loadData()`/`saveData()`
- 将数据源从私有 `allStations` 切换为共享 `state.stations`，实现跨页面数据同步
- 新建 `js/modules/charts.js` — 纯 SVG 图表引擎（零外部依赖），支持柱状图、环形图、状态分布图
- 在 `data-viz.html` 页面顶部新增图表概览行，包含出租率柱状图、分级占比环形图、经营状态分布图
- 图表使用项目 CSS Token 配色，hover 时显示 tooltip

## 能力项

### 新增能力
- `data-viz-module`: 数据可视化页的 JS 逻辑模块，负责卡片网格渲染、筛选排序、站点编辑，复用 `data.js` 和 `state.js` 共享数据源
- `data-viz-charts`: 纯 SVG 图表引擎，提供柱状图、环形图、堆叠状态图，支持 CSS Token 配色、hover tooltip、响应式适配

### 修改的能力
- 无（本变更不修改现有 spec 的需求定义，仅新建模块）

## 影响范围

**新增文件：**
- `js/modules/viz.js` — 数据可视化逻辑模块（从 `data-viz.html` 内联代码提取，~300 行）
- `js/modules/charts.js` — SVG 图表引擎（~200 行）
- `tests/viz.test.js` — viz 模块单元测试
- `tests/charts.test.js` — charts 模块单元测试

**修改文件：**
- `data-viz.html` — 删除内联 JS（~600 行减少到 ~50 行初始化调用），新增图表区域 HTML 和 CSS，改为引入 `viz.js` 和 `charts.js` 模块

**间接影响（无需修改，行为不变）：**
- `js/modules/data.js` — viz.js 将调用其 `loadData()` / `saveData()`（现有 API 不变）
- `js/modules/state.js` — viz.js 将读写 `state.stations`（现有数据结构不变）

## 测试策略

依据 `openspec/testing-strategy.md` 的变更类型映射表，本 change 涉及**新建模块**（viz.js、charts.js）和**重构页面**（data-viz.html），测试策略如下：

| 模块 | 测试层级 | 测试文件 | 说明 |
|------|---------|---------|------|
| viz.js（新建模块） | 单元测试 | `tests/viz.test.js` | 验证筛选排序逻辑、统计数据计算、卡片渲染函数 |
| charts.js（新建模块） | 单元测试 | `tests/charts.test.js` | 验证 SVG 生成正确性、数据映射、tooltip 内容 |
| viz + data 集成 | 集成测试 | `tests/integration/viz-data.test.js` | 验证 viz 通过 data.js 加载/保存数据、state.stations 同步 |
| viz + charts 联动 | 集成测试 | `tests/integration/viz-charts.test.js` | 验证筛选后图表数据同步更新 |
| data-viz 页面 | E2E 测试 | `tests/e2e/data-viz-flow.test.js` | 验证页面加载→筛选→展开编辑→保存→图表更新完整流程 |

TDD 执行顺序：每个功能模块任务组按 Red → Green → Refactor 三步执行。测试未通过不算完成。

## 成功标准

- [ ] `data-viz.html` 内联 JS 代码从 ~600 行减少到 ~50 行（仅保留初始化调用）
- [ ] `js/modules/viz.js` 复用 `data.js` 的 `loadData()` / `saveData()`，不再有重复实现
- [ ] `data-viz.html` 与 `battle-map.html` 通过 `state.stations` 共享数据，编辑后切换页面数据一致
- [ ] 页面顶部新增图表区域，包含：出租率柱状图（按站点）、分级占比环形图、经营状态分布图
- [ ] 图表使用纯 SVG 实现，零外部依赖
- [ ] 图表 hover 时显示 tooltip（站点名称 + 具体数值）
- [ ] 筛选/排序后图表数据同步更新
- [ ] 图表在移动端（≤768px）响应式适配（柱状图改为横向或减少显示站点数）
- [ ] 新增 `tests/viz.test.js` 和 `tests/charts.test.js`，每个至少 3 个测试用例
- [ ] `npx vitest run` 全部通过，无回归失败
