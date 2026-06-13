## Why

现有首页以分层概览、线路速览和排名面板为主，信息结构与已确认的“苏州地铁 11 号线商业信息综合平台”综合看板设计不一致，顶部品牌识别也缺少商业管理平台属性。现在需要把已确认的设计稿落实到正式代码，同时继续使用现有站点、商铺、面积、状态和出租率真实数据。

## What Changes

- 重构 `index.html` 首页结构，形成“经营总览头图、核心 KPI、站点商业趋势、站点经营概览”的单页综合看板。
- 重构 `js/modules/home.js` 的首页渲染层，继续通过 `state.stations` 和 `calcHomeStats()` 计算真实业务数据。
- 将站点商业趋势改为商业点位、已出租、空置三条折线，覆盖全部站点，并提供悬停详情、边缘滚动和持久悬停状态。
- 将站点经营概览改为全部站点可滚动表格，仅展示原系统已有字段：价值等级、商铺、多经点位、总面积、已租面积、已租、装修、空置、出租率。
- 保留站点行展开查看商铺明细的现有能力，并增加站名搜索、`S/A 级`和低出租率筛选。
- 明确统计口径：商业点位排除多经点位，已出租仅指营业中，装修单列但计入出租率。
- 移除原型中当前没有路由支撑的通知公告和点位台账入口，避免出现无效控件。
- 补齐触屏横向浏览、键盘操作、空结果、减少动画和动态文本安全输出。
- 移除正式页面的外部字体依赖并压缩设计图片，使页面符合现有同源 CSP 和局域网加载要求。
- 更新共享顶部导航的 Logo、平台名称和导航文案，复用已确认的第二版 Logo 资产。
- 删除首页旧的独立排名统计区和旧线路圆点速览区；排名数据计算可保留，其他页面和 API 行为不变。
- 不新增“数据状态”“最近更新”等当前数据模型不存在的字段。

## Capabilities

### New Capabilities

- `commercial-overview-dashboard`: 定义首页综合经营看板的数据来源、布局、趋势图、经营概览、筛选和站点明细交互。
- `platform-brand-header`: 定义共享顶部品牌标识、平台名称、导航文案和响应式呈现。

### Modified Capabilities

无。现有 OpenSpec capability 未定义首页综合看板或共享品牌头部的对应需求。

## Impact

- 修改 `index.html`：替换首页 DOM 骨架并加载首页专用样式。
- 修改 `css/platform.css`：调整共享顶部导航品牌区和响应式规则。
- 新增 `css/home-dashboard.css`：承载首页看板、折线趋势和经营概览样式。
- 修改 `js/modules/nav.js`：更新 Logo 结构、平台名称和导航文案，保持现有路由地址不变。
- 修改 `js/modules/home.js`：重构首页渲染、趋势图动画、边缘滚动、筛选搜索和展开明细交互。
- 保留设计源文件 `assets/design/logo-concept-02-v1.png`、`assets/design/commercial-overview-bg-v1.png`，正式页面加载压缩版 `logo-concept-02-v1-160.png` 和 `commercial-overview-bg-v1.jpg`。
- 新增 `js/pages/home-page.js` 和 `js/pages/data-viz-page.js` 页面入口，移除正式页面内联脚本以符合严格同源 CSP。
- 新增 `tools/design-preview-server.js`，为 E2E 和局域网验收提供与正式页面一致的同源 CSP 预览。
- 更新 `tests/home.test.js`、`tests/nav.test.js`、`tests/integration/home-dashboard.test.js`、`tests/e2e/home-flow.test.js`。
- 更新数据库相关安全/集成测试的测试连接串，在 PostgreSQL 离线时使用 1 秒连接超时，避免环境型测试抖动；不改变生产数据库配置。
- 不修改 `server.js`、Prisma schema、数据库迁移、REST API 和数据持久化格式。
- OpenSpec 1.3.1 不允许 change 名称以数字开头，因此目录采用 `refactor-home-dashboard-2026-06-11`，语义等同项目约定的 `2026-06-11-refactor-home-dashboard`。

## 测试策略

依据 `openspec/testing-strategy.md` 的“重构页面”和“涉及 2+ 模块联动”映射，本变更需要三层测试：

- 单元测试：扩展 `tests/home.test.js` 覆盖统计、趋势图数据映射、表格筛选与空数据边界；扩展 `tests/nav.test.js` 覆盖 Logo、品牌文案和路由地址。
- 集成测试：新增 `tests/integration/home-dashboard.test.js`，覆盖数据加载后从 `state` 到 KPI、趋势图和经营概览的完整渲染链路。
- E2E 测试：更新 `tests/e2e/home-flow.test.js`，覆盖首页加载、全部站点显示、折线悬停、边缘滚动、搜索筛选和展开商铺明细。
- 完成后运行 `npx vitest run`、`node scripts/check-test-coverage.js`，并在桌面与手机宽度进行真实浏览器视觉验证。

## 成功标准

- 首页在 1440px 桌面宽度下与确认稿保持一致的布局、配色、字体层级和卡片质感。
- KPI、趋势图和经营概览均从 `state.stations` 计算，不使用设计稿中的硬编码业务数字。
- 趋势图显示全部站点的商业点位、已出租、空置三条折线；默认隐藏圆点，悬停后显示详情，并且仅在画布两侧触发横向移动。
- 经营概览显示全部站点和原系统真实字段，支持搜索、筛选和展开商铺明细。
- 顶部品牌区使用确认的第二版 Logo，三个既有页面链接仍可正常跳转。
- 桌面、平板和手机布局无横向页面溢出；数据表可在自身容器内滚动。
- 单元、集成、E2E 和完整回归测试全部通过。
