## 上下文

当前 `data-viz.html` 是整个三页架构中唯一不接入 `js/modules/` ES Module 体系的页面。其内联 `<script type="module">` 标签中包含约 600 行 JS 代码，独立实现了数据加载、保存、统计计算、卡片渲染、商铺 CRUD 等逻辑——这些功能在 `data.js` 和 `interaction.js` 中已有几乎相同的实现。此外，该页面维护私有 `allStations` 数组，与通过 `state.stations` 共享数据的首页和作战图页面形成数据孤岛。

本设计需要解决两个核心问题：**架构裂缝**（提取模块、消除重复、共享数据）和**功能缺口**（添加真正的数据图表）。

## 目标 / 非目标

**目标：**
- 将 `data-viz.html` 内联 JS 提取为 `js/modules/viz.js`，复用 `data.js` 的 `loadData()` 和 `saveData()`
- 切换数据源为共享 `state.stations`，实现跨页面数据一致
- 新建 `js/modules/charts.js` 纯 SVG 图表引擎，支持柱状图、环形图、状态分布图
- 图表在筛选/排序后自动更新，hover 显示 tooltip
- 编写 `tests/viz.test.js` 和 `tests/charts.test.js`，每个至少 3 个用例

**非目标：**
- 不修改 `battle-map.html` 和 `index.html`（保持其他页面不变）
- 不修改 `data.js`、`state.js` 的现有 API（viz.js 作为新消费者，不改变现有接口）
- 不引入第三方图表库（Chart.js、D3 等）
- 不改变 data-viz 页面的现有功能行为（筛选、排序、编辑、保存逻辑保持不变，仅换实现位置）

## 目录树

```
项目根目录/
├── data-viz.html                  # [修改] 删除内联 JS，引入 viz.js + charts.js，新增图表 HTML 区域
├── js/modules/
│   ├── viz.js                     # [新建] 数据可视化逻辑模块
│   ├── charts.js                  # [新建] SVG 图表引擎
│   ├── data.js                    # [不变] viz.js 调用其 loadData() / saveData()
│   └── state.js                   # [不变] viz.js 读写 state.stations
├── tests/
│   ├── viz.test.js                # [新建] viz 模块单元测试
│   ├── charts.test.js             # [新建] charts 模块单元测试
│   ├── integration/
│   │   ├── viz-data.test.js       # [新建] viz + data 集成测试
│   │   └── viz-charts.test.js     # [新建] viz + charts 集成测试
│   └── e2e/
│       └── data-viz-flow.test.js  # [新建] data-viz 页面 E2E 测试
└── openspec/
    └── changes/refactor-data-viz-charts/
        └── specs/
            ├── data-viz-module/
            │   └── spec.md        # [新建]
            └── data-viz-charts/
                └── spec.md        # [新建]
```

## 决策

### 决策 1：viz.js 模块 API 设计

**选择：** viz.js 导出渲染函数，由 data-viz.html 的初始化脚本调用。数据读/写通过 `data.js` 和 `state.js` 完成。

```js
// viz.js 导出
export { initViz, renderCards, filterStations, sortStations, calcStationStats }
// 依赖
import { state } from './state.js'
import { loadData, saveData } from './data.js'
```

**考虑过的替代方案：**
- ❌ 让 viz.js 维护自己的数据副本 → 抛弃，与"共享数据源"目标矛盾
- ❌ 把 viz 逻辑直接合并进 home.js → 抛弃，职责不清，首页和可视化页是不同页面

**对应的 spec Requirement：** `data-viz-module` — "viz.js MUST 通过 `data.js` 的 `loadData()` 和 `saveData()` 进行数据读写"

### 决策 2：图表引擎 API 设计

**选择：** 纯函数式 API，接收数据数组 + 配置对象，返回 SVG 字符串。

```js
// charts.js 导出
export { renderBarChart, renderDonutChart, renderStatusChart }
// 每个函数签名：(data, options) → SVG string
```

- `renderBarChart(stations, { width, height, colorScale })` — 柱状图
- `renderDonutChart(gradeCount, { size, colors })` — 环形图
- `renderStatusChart(stations, { width, height })` — 堆叠状态分布图

**考虑过的替代方案：**
- ❌ 让 charts.js 直接操作 DOM → 抛弃，难以测试
- ❌ 使用 Chart.js CDN → 抛弃，与项目"零框架"理念冲突，且引入外部依赖不可控

**对应的 spec Requirement：** `data-viz-charts` — "图表 MUST 通过纯 SVG 元素渲染，SHALL 零外部依赖"

### 决策 3：Tooltip 实现

**选择：** 使用绝对定位的 `<div>` 跟随鼠标，通过 CSS 控制显隐。不在 SVG 内部实现 tooltip（SVG `<title>` 元素行为不可控）。

```
mousemove → 更新 tooltip 位置和内容
mouseleave → 隐藏 tooltip
```

**对应的 spec Requirement：** `data-viz-charts` — "柱状图 hover 时 MUST 显示 tooltip，包含站点名称和出租率数值"

### 决策 4：图表响应式策略

**选择：** 
- 桌面端（>768px）：三列并排图表
- 移动端（≤768px）：图表堆叠为单列，柱状图改为横向条形图

SVG 的 `viewBox` 属性天然支持缩放，只需调整容器宽度即可。

**对应的 spec Requirement：** `data-viz-charts` — "图表 MUST 在 ≤768px 视口下切换为单列布局"

### 决策 5：图表颜色映射

**选择：** 使用项目 CSS Token 定义图表颜色，与 DESIGN.md 保持一致：

| 图表元素 | CSS Token | 色值 |
|---------|-----------|------|
| 已出租 | `--color-fresh-green` | `#16a34a` |
| 空置 | `#ef4444` | `#ef4444` |
| 装修中 | `--color-warm-orange` | `#ea580c` |
| S 级 | `#d4380d` | `#d4380d` |
| A 级 | `#fa8c16` | `#fa8c16` |
| B 级 | `#facc14` | `#facc14` |
| C 级 | `#52c41a` | `#52c41a` |
| 柱状图填充 | `--color-accent-blue` | `#3b82f6` |
| 网格线 | `--color-border-light` | `#e5e5e5` |

## 数据流

```
┌───────────┐     loadData()      ┌──────────┐
│  data.js  │ ──────────────────→ │ state.js │
│           │ ←────────────────── │          │
│ saveData()│    写入数据          │ stations │
└───────────┘                     └────┬─────┘
                                       │
                    ┌───────────────────┤
                    │                   │
                    ▼                   ▼
              ┌──────────┐       ┌──────────┐
              │  viz.js  │       │charts.js │
              │ 筛选/排序 │──────→│ SVG 渲染 │
              │ 卡片渲染 │ 数据  │ 图表更新 │
              └──────────┘       └──────────┘
                    │                   │
                    ▼                   ▼
              ┌──────────────────────────┐
              │     data-viz.html DOM    │
              │  ┌────────┐ ┌──────────┐ │
              │  │ 图表区  │ │ 卡片网格 │ │
              │  └────────┘ └──────────┘ │
              └──────────────────────────┘
```

筛选/排序仅在 viz.js 内存中进行，不修改 `state.stations`（只读操作）。编辑保存时才通过 `data.saveData()` 写回。

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|---------|
| 切换数据源为 `state.stations` 后，data-viz 编辑保存会影响作战图页面，用户可能未预期 | 保存后 toast 提示"数据已同步到所有页面"，明确告知用户 |
| 纯 SVG 柱状图在站点数量多（28 站）时可能拥挤 | 桌面端使用足够宽度（max-width: 1200px），移动端显示 Top 10 站点 |
| `state.stations` 的数据结构与 data-viz 原有 `allStations` 略有差异（如缺少某些计算字段） | viz.js 负责在渲染前补全计算字段，不污染 state 中的原始数据 |
| 删除内联 JS 后可能出现未发现的边界行为 | 在重构前先为现有行为编写特征测试（characterization test） |

## 迁移计划

1. **无需数据迁移** — `data.js` 的 `loadData()` 和 `saveData()` 的 API 和数据格式不变
2. **部署步骤**：
   - 新建 `viz.js` 和 `charts.js`，不影响现有页面
   - 修改 `data-viz.html`，删除内联 `<script>`，改为 `<script type="module" src="js/modules/viz.js">`
   - 验证三个页面均正常工作
3. **回滚策略**：`git revert` 即可恢复，`data-viz.html` 原有的内联 JS 逻辑完整保留在 git 历史中

## 未决问题

1. **图表动画触发时机**：页面首次加载时图表是否需要入场动画（柱状图从 0 生长到目标值），还是直接显示最终状态？建议先做直接显示，动画作为可选增强在 Phase 2 末尾加入。
2. **柱状图站点标签拥挤**：28 个站点的名称在柱状图 X 轴可能重叠。是否接受旋转 45° 显示，还是限定显示前 15 个站点？建议先在桌面端全部显示（旋转标签），移动端显示 Top 10。
3. **环形图与现有卡片"出租率大数字"是否冗余**：环形图和卡片概览中的百分比数字传达的信息相近。建议环形图用于"分级占比"（S/A/B/C 各多少站），与出租率柱状图互补。

## 测试架构设计

### 测试分层策略

```
        ▲
       ╱ ╲    E2E: data-viz-flow.test.js
      ╱   ╲   — 页面加载 → 筛选 → 展开编辑 → 保存 → 图表更新
     ╱─────╲
    ╱         ╲
   ╱  集成测试  ╲  viz-data.test.js — viz + data 数据流
  ╱             ╲ viz-charts.test.js — viz + charts 联动
 ╱───────────────╲
╱     单元测试     ╲  viz.test.js — 筛选/排序/统计函数
╱                 ╲ charts.test.js — SVG 生成/数据映射
────────────────────
```

### 测试文件位置

```
tests/
├── viz.test.js                    # viz 模块单元测试（≥3 用例）
├── charts.test.js                 # charts 模块单元测试（≥3 用例）
├── integration/
│   ├── viz-data.test.js           # viz + data 集成测试
│   └── viz-charts.test.js         # viz + charts 联动测试
└── e2e/
    └── data-viz-flow.test.js      # data-viz 页面 E2E 测试（Puppeteer）
```

### 需要 mock 的外部依赖

| 模块 | 需要 mock | 说明 |
|------|----------|------|
| viz.test.js | `data.js` 的 `loadData` / `saveData` | 单元测试隔离数据层 |
| viz.test.js | DOM (jsdom) | 卡片渲染函数需要 DOM 环境 |
| charts.test.js | 无外部依赖 | charts.js 是纯函数，直接测试 |
| viz-data.test.js | `fetch` (API 调用) | 模拟服务器响应 |
| viz-data.test.js | `localStorage` | 模拟本地存储回退 |
| data-viz-flow.test.js | 无 mock | E2E 测试使用真实页面和服务器 |
