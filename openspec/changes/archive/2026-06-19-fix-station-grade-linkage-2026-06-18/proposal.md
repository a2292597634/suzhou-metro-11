## Why

车站价值等级已经在站点数据中更新，但页面中多个展示位置仍然依赖旧的硬编码、独立描述或未规范化的等级判断，导致同一车站在不同视图里显示的等级不一致。

这次变更需要把 `state.stations[].grade` 确认为所有价值等级展示、筛选、统计和默认兜底的单一数据源，保证后续只改车站数据即可驱动所有页面同步更新。

商业信息管理页后续会承担车站商业点位维护和站点价值等级维护职责，因此需要在站点卡片下方新增一个专门的站点价值等级管理模块，支持全线 S/A/B/C 等级总览和批量调整。

## What Changes

- 统一 S/A/B/C 价值等级的规范化、校验和 CSS class 派生逻辑，避免不同模块各自判断。
- 主作战图商业价值分级面板从 `state.stations` 动态生成各等级车站名单，而不是只展示静态 `gradeInfo.desc`。
- 首页经营概览的等级统计、S/A 筛选、趋势悬浮详情和站点表格徽标全部使用规范化后的车站等级。
- 数据可视化页面的等级筛选、卡片徽标、详情选择框和图表联动全部使用同一等级规则。
- 导航栏中 `data-viz.html` 对应的页面名称从「商业分析」改为「商业信息管理」，匹配后续点位编辑和站点等级维护用途。
- 商业信息管理页在站点卡片网格下方新增「站点价值等级管理」模块，展示等级分布、全站等级编辑表、待保存更改、保存/撤销和定位到卡片操作。
- 全网站任何展示车站商业等级的位置，都必须从当前 `state.stations[].grade` 派生，并在等级变更保存后同步更新。
- 默认数据兜底必须使用 `data/default-data.json` 中的最新车站等级，避免内联旧等级在 JSON 加载失败或测试环境中回流。
- 不修改后端 API 形状，不新增运行时依赖。

## Capabilities

### New Capabilities

- `shared-navigation`: 共享导航中的业务页面命名和激活态文案。
- `station-grade-linkage`: 全站车站商业等级显示和编辑联动的不变式。

### Modified Capabilities

- `module-data`: 默认站点数据 SHALL 保持与 `data/default-data.json` 的最新车站等级一致，内联兜底不得回退到旧等级。
- `module-render`: 商业价值分级面板 SHALL 从当前站点等级动态派生各等级车站名单。
- `commercial-overview-dashboard`: 首页等级统计、筛选和等级标注 SHALL 使用当前站点等级并进行统一规范化。
- `data-viz-module`: 数据可视化页面的等级筛选、徽标和编辑后重渲染 SHALL 与当前站点等级联动。

## Impact

- `js/modules/utils.js`: 增加共享等级工具函数。
- `js/modules/data.js`: 同步默认站点等级兜底，或改为复用 JSON 默认数据路径。
- `js/modules/render.js`: 调整分级面板渲染，使站点名单由当前 `state.stations` 派生。
- `js/modules/home.js`: 调整等级统计、筛选和展示 class 生成。
- `js/modules/viz.js`: 调整等级筛选、徽标、编辑保存后的重渲染和图表回调。
- `js/modules/nav.js`: 将 data-viz 页面导航文案改为「商业信息管理」。
- `data-viz.html`: 在站点卡片网格下方增加站点价值等级管理模块挂载点，并更新页面标题/说明。
- `css/data-viz.css`: 增加站点价值等级管理模块样式。
- `tests/render.test.js`: 覆盖分级面板随站点等级变化联动。
- `tests/integration/home-dashboard.test.js`: 覆盖首页等级统计和 S/A 筛选使用当前等级。
- `tests/viz.test.js`: 覆盖数据可视化等级筛选和卡片徽标使用当前等级。
- `tests/integration/viz-data.test.js`: 覆盖站点价值等级管理模块保存后驱动卡片、筛选和图表联动。
- `tests/data.test.js`: 覆盖默认站点等级与 JSON 数据一致。
- `tests/nav.test.js`: 覆盖桌面和移动导航中文案更新。

## 测试策略

依据 `openspec/testing-strategy.md` 的变更类型映射，本 change 涉及前端数据派生、跨模块展示一致性和默认数据回退，需覆盖单元测试与集成测试；如实现触及真实页面初始化流程，还需补充 E2E 或复用现有 E2E。

- 单元测试：`tests/render.test.js`、`tests/viz.test.js`、`tests/data.test.js` 覆盖纯渲染/筛选/默认数据一致性。
- 集成测试：`tests/integration/home-dashboard.test.js` 覆盖 `state.stations` 到首页统计、筛选、表格展示的联动。
- E2E 测试：优先复用 `tests/e2e/home-flow.test.js` 和 `tests/e2e/data-viz-flow.test.js`；若现有断言不足，再新增页面流断言。
- Mock：单元和集成测试 mock `fetch`/`localStorage`；不 mock `state`、等级工具和渲染函数本身。

## Success Criteria

- 修改任一车站的 `grade` 后，主作战图分级面板、首页经营概览、数据可视化卡片和筛选都显示同一等级。
- 在商业信息管理页的「站点价值等级管理」模块批量调整等级并保存后，所有当前页面等级展示、筛选和图表立即同步。
- S/A 重点站筛选只由当前 `state.stations[].grade` 决定，不受旧硬编码或旧描述影响。
- 默认数据 JSON 与代码兜底数据在每个站点的 `grade` 字段上保持一致。
- 顶部导航和移动底部导航中 `data-viz.html` 的入口显示为「商业信息管理」。
- 所有新增或调整的等级联动测试通过。
- 现有相关前端测试无回归。
