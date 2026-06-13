## Context

当前 `index.html` 由 `js/modules/home.js` 动态渲染综合概览、线路圆点速览、站点总览和排名统计；`js/modules/nav.js` 为三个页面注入共享顶部导航。现有 `calcHomeStats()` 已能从 `state.stations` 计算站点数、商铺数、已租、装修、空置、面积、出租率和价值等级，站点表也已支持展开商铺明细。

已确认的设计稿位于 `design/prototype-v1.html`，视觉资产位于 `assets/design/`。正式实现必须遵循 `DESIGN.md` 的 Dub 风格设计系统，并使用真实数据替代设计稿中的静态示例。

约束：

- 使用原生 HTML、CSS 和 ES Modules，不引入前端框架或图表依赖。
- 不修改数据库模型、API、数据加载优先级和持久化格式。
- 不展示数据模型不存在的“数据状态”“最近更新”等字段。
- 不落地原型中当前无对应页面的“通知公告”“点位台账”入口。
- 保留三个既有页面地址：`index.html`、`data-viz.html`、`battle-map.html`。
- 遵守服务端现有 `Content-Security-Policy: default-src 'self'`，正式页面不依赖外部字体和样式。
- 变更必须按 TDD 执行并通过单元、集成、E2E 与完整回归测试。

## Goals / Non-Goals

**Goals:**

- 将首页重构为单页综合商业经营看板，视觉上匹配已确认设计稿。
- 复用 `calcHomeStats()` 与 `state.stations`，确保 KPI、趋势图和经营概览的数据一致。
- 为全部站点提供三折线趋势、悬停详情、边缘横移、搜索筛选和商铺明细展开。
- 将确认的第二版 Logo 与品牌文案落到共享顶部导航。
- 将首页专用样式与共享设计系统分离，降低对其他页面的回归风险。

**Non-Goals:**

- 不重构 `data-viz.html` 和 `battle-map.html` 的主体布局。
- 不新增首页数据编辑、待办处理、通知公告或权限功能。
- 不新增后端接口、数据库字段或统计快照。
- 不在本 change 中将 PNG Logo 自动矢量化为 SVG。
- 不删除 `calcHomeStats()` 当前提供的排名结果字段，除非测试证明完全无调用且重构需要移除。

## Directory Layout

```text
index.html
css/
├── platform.css
└── home-dashboard.css
js/modules/
├── home.js
├── nav.js
└── state.js
assets/design/
├── commercial-overview-bg-v1.jpg
├── commercial-overview-bg-v1.png
├── logo-concept-02-v1-160.png
└── logo-concept-02-v1.png
js/pages/
├── data-viz-page.js
└── home-page.js
tests/
├── home.test.js
├── nav.test.js
├── integration/
│   └── home-dashboard.test.js
└── e2e/
    └── home-flow.test.js
design/
└── prototype-v1.html
tools/
└── design-preview-server.js
```

## Decisions

### 1. 保留 `home.js` 作为首页唯一渲染模块

首页 KPI、趋势图和经营概览都依赖同一份 `calcHomeStats()` 结果，因此继续由 `home.js` 统一编排。新增纯函数负责趋势点位、Y 轴刻度、筛选条件和安全 HTML 生成，导出需要单元测试的函数。

**替代方案：** 新建多个首页模块。该方案会增加模块边界和事件协调成本，目前首页规模不需要拆分。

### 2. 使用原生 SVG 绘制三折线

趋势图使用 `<svg>` 的 `<path>`、`<line>` 和 `<circle>`，由站点统计生成直线折线路径。默认隐藏圆点，悬停站点时移动垂直参考线和三个数据圆点。

**替代方案：** 引入 ECharts 或 Chart.js。项目当前零图表运行时依赖，原生 SVG 已足够满足需求，引入库会增加依赖和样式控制成本。

### 3. 横向趋势画布采用边缘触发的插值滚动

画布仅在指针进入左右各 20% 区域时更新目标偏移；中央 60% 不移动。动画采用 `requestAnimationFrame` 和缓动插值，离开图表后停止滚动但保留最后一个悬停详情。

边缘自动移动只在支持精确指针的桌面环境启用。触屏设备使用容器原生横向滚动并通过点击站点显示详情；站点节点同时支持键盘聚焦。重复初始化时先取消旧 `requestAnimationFrame` 和事件监听，避免测试或热重载产生多重动画。

**替代方案：** 指针位置直接映射全画布偏移。该方式已在设计迭代中被验证难以控制。

### 4. 经营概览仅呈现真实业务字段

表格字段固定为：站点、价值等级、商铺、多经点位、总面积、已租面积、已租/装修/空置、出租率和展开操作。所有值从 `stationStats` 计算，不生成更新时间或状态标签。

**替代方案：** 为增强视觉丰富度添加派生“关注状态”。用户已明确要求不展示原系统不存在的数据列，因此不采用。

统计文案固定口径：商业点位为非多经点位商铺；“已出租”折线和数量只表示 `营业中`；`装修中` 单独展示；出租率继续按 `营业中 + 装修中` 计入已租。这样三条趋势线满足 `商业点位 = 已出租 + 装修中 + 空置`，而不是误导性地让三条线相加。

### 5. 保留站点展开明细，筛选仅影响站点行组

每个站点由主行和相邻详情行组成。搜索或筛选隐藏时必须同时隐藏两行；切换筛选前收起不可见详情，避免残留空白。点击主行或展开按钮显示原有商铺编号、名称、面积、租户和状态。

搜索词先执行 `trim()`，再与等级筛选组合；无结果时展示空结果行。展开按钮使用原生 `button`、`aria-expanded` 和关联详情标识，支持 Enter/Space。所有来自数据源的文本通过 `escapeHtml()` 或 `textContent` 输出。

### 6. 首页样式独立，共享导航样式集中

`css/home-dashboard.css` 只由 `index.html` 引入；顶部导航和品牌区继续位于 `css/platform.css`。首页样式使用 `dashboard-*`、`trend-*`、`overview-*` 前缀，避免覆盖其他页面现有类名。

### 7. Logo 使用项目内静态资产

`nav.js` 注入压缩版 `assets/design/logo-concept-02-v1-160.png`，并提供空 `alt`，因为旁边已有完整平台名称。CSP 继续使用 `'self'`，无需新增外部图片源。

图片元素声明固有宽高，避免布局偏移。正式首页使用 `logo-concept-02-v1-160.png` 和 `commercial-overview-bg-v1.jpg`，总传输体积约 114 KB；原始 PNG 保留为设计归档。

### 8. 移除正式页面的外部字体依赖

当前三个 HTML 页面引用 jsDelivr Geist，`platform.css` 还导入 Fontshare 和 Google Fonts，但服务端 CSP 只有 `default-src 'self'`，这些请求在正式服务下会被阻止。本 change 移除三个页面的外部字体链接和 `platform.css` 的远程 `@import`，使用 `DESIGN.md` 已定义的系统字体 fallback。该调整不修改服务端 CSP。

### 9. 首页不提供无对应功能的行动入口

原型中的“查看通知公告”和“进入点位台账”没有现有路由，正式首页不渲染这两个控件。若保留头图行动按钮，只使用“查看商业分析”与“查看线路资产”，分别指向现有 `data-viz.html` 与 `battle-map.html`。

### 10. 正式页面使用外部页面入口模块

`index.html` 与 `data-viz.html` 不保留内联模块脚本，分别加载 `js/pages/home-page.js` 与 `js/pages/data-viz-page.js`。页面入口只负责组合现有模块初始化，确保 `Content-Security-Policy: default-src 'self'` 下无需放宽 `script-src`。

`data-viz.html` 原有页面专属样式同步迁移到 `css/data-viz.css`。正式页面不保留内联 `<style>`，避免严格 CSP 阻止商业分析页的卡片网格和图表容器样式。

### 11. E2E 使用同源预览服务器

`tools/design-preview-server.js` 监听 `0.0.0.0`，为正式页面返回 `Content-Security-Policy: default-src 'self'`，并提供只读 `/api/data` 演示响应；`design/` 原型目录不附加该 CSP，以便保留设计稿自身的预览能力。E2E 在该服务已启动的端口上使用 Puppeteer 验证正式页面。

数据库认证与安全测试继续直接导入生产 `server.js`。测试专用 `DATABASE_URL` 增加 `connect_timeout=1`，仅用于数据库离线时快速进入既有 500 错误路径，不修改生产连接参数或接口语义。

## Risks / Trade-offs

- **[风险] 28 个站点的 SVG 与 DOM 在窄屏上信息密集** → 使用内部横向画布、首尾留白和边缘滚动；手机端保留可横向浏览，不压缩到不可读。
- **[风险] 经营概览的固定高度内部滚动可能隐藏后续行** → 使用固定表头、可见滚动条和“全部 28 站”计数提示；搜索筛选即时减少行数。
- **[风险] `home.js` 继续承担较多渲染职责** → 将统计、路径、过滤等逻辑抽成小型纯函数，并用单元测试约束；暂不引入跨模块复杂度。
- **[风险] PNG Logo 在高 DPI 或深色主题下受限** → 当前只用于白色顶部导航且源文件为 512×512；未来可单独 change 进行 SVG 重绘。
- **[风险] 共享导航高度增加会影响其他页面首屏** → 在 `data-viz.html` 和 `battle-map.html` 做 E2E/手动回归，确认页面内容未被遮挡。
- **[风险] 外部字体移除后字宽变化影响布局** → 以 Windows 中文环境的 `"Microsoft YaHei"`、`"Segoe UI"` 和系统无衬线字体为实际基准，重新检查导航、站名和表头截断。
- **[风险] 触屏设备没有 hover 与边缘自动移动** → 使用原生横向滚动和点击/聚焦详情作为等价交互。
- **[风险] 重复初始化叠加事件监听或 RAF** → 保存清理函数，在重新渲染趋势前取消旧动画和监听。
- **[权衡] 移除首页排名面板减少了直接排名入口** → 排名分析仍可由商业分析页承载，本 change 优先保证综合看板聚焦站点经营信息。

## Migration Plan

1. 先编写并运行失败的单元、集成和 E2E 测试。
2. 添加首页专用 CSS 与静态设计资产。
3. 更新共享导航结构和样式，验证三个页面链接。
4. 重构首页 DOM 骨架和 `home.js` 渲染函数。
5. 接入趋势图悬停、边缘滚动、经营表搜索筛选与展开交互。
6. 运行完整测试和浏览器视觉验证。
7. 若需回滚，恢复 `index.html`、`home.js`、`nav.js`、`platform.css`，并移除 `home-dashboard.css` 与两张设计资产；数据层和数据库无需迁移。

## 测试架构设计

```text
tests/
├── home.test.js                       # 统计、路径、筛选与空数据单元测试
├── nav.test.js                        # 品牌 DOM、文案、链接单元测试
├── integration/home-dashboard.test.js # state → stats → 首页 DOM 集成测试
└── e2e/home-flow.test.js              # 浏览器核心用户流程
```

- `tests/home.test.js`：测试 `calcHomeStats()`、折线路径计算、动态刻度、站名换行、筛选条件和全部站点映射。
- `tests/nav.test.js`：测试 Logo 图片路径、平台名称、三个链接地址、激活态和数据来源指示器。
- `tests/integration/home-dashboard.test.js`：mock `fetch` 失败以触发默认数据或直接注入 `state`，验证 KPI、28 站趋势和经营表使用同一统计结果。
- `tests/e2e/home-flow.test.js`：使用 Puppeteer 连接 `tools/design-preview-server.js` 提供的正式页面预览，验证页面加载、趋势悬停、边缘移动、筛选搜索、展开详情、严格 CSP 和响应式无页面级横向溢出。
- 外部依赖 mock：单元/集成测试 mock `fetch` 与 `requestAnimationFrame`；不 mock `calcHomeStats()` 等核心业务逻辑。E2E 使用同源 Node HTTP 预览服务和真实浏览器，不 mock 首页渲染与交互。

## Open Questions

1. 顶部导航的现有三个页面本 change 按“经营总览 / 商业分析 / 线路资产”映射既有路由，不创建“点位台账”页面；后续若新增台账页需单独 change 调整信息架构。
2. 第二版 Logo 当前是 PNG，是否在本 change 完成后另开 change 进行人工 SVG 重绘和 favicon 适配？本 change 仅保证白色导航中的清晰度。
