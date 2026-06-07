# 任务清单：重构数据可视化页并添加图表

## 1. 基础设施检查

- [x] 1.1 运行 `npx vitest run` 确认基线：12 文件 110 用例全绿
- [x] 1.2 手动验证 data-viz.html 当前所有功能正常（筛选、排序、展开、编辑、保存）

## 2. viz.js 模块提取（TDD：Red → Green → Refactor）

> 覆盖 spec：`data-viz-module` — 全部 7 个 Requirement
> 依赖：任务 1 完成

### 2.T viz 模块测试（先写失败测试）

- [x] 2.T.1 编写 `tests/viz.test.js` — `calcStationStats()` 测试用例（Red）✅ 7 用例
- [x] 2.T.2 编写 `tests/viz.test.js` — `filterStations()` 测试用例（Red）✅ 4 用例
- [x] 2.T.3 编写 `tests/viz.test.js` — `sortStations()` 测试用例（Red）✅ 5 用例
- [x] 2.T.4 编写 `tests/viz.test.js` — `renderCards()` DOM 渲染测试用例（Red）✅ 7 用例
- [x] 2.T.5 编写 `tests/integration/viz-data.test.js` — viz + data 集成测试（Red）✅ 5 用例
- [x] 2.T.6 运行测试确认全部新增用例失败（Red 验证）✅

### 2.1 viz.js 核心逻辑实现

- [x] 2.1.1 创建 `js/modules/viz.js`，import `state` 和 `data.js`（复用 `loadData`/`saveData`）
- [x] 2.1.2 实现 `initViz()` — 初始化函数：调用 `data.loadData()`，渲染卡片和绑定事件
- [x] 2.1.3 实现 `calcStationStats(station)` — 计算单站统计数据
- [x] 2.1.4 实现 `filterStations(stations, grade)` — 等级筛选（全部/S/A/B/C）
- [x] 2.1.5 实现 `sortStations(stations, sortBy)` — 排序（默认按 x / 出租率升降 / 商铺数降）
- [x] 2.1.6 实现 `getStatusStyle(status)` — 状态到 CSS 类名映射
- [x] 2.1.7 运行 `tests/viz.test.js` 确认全部通过（Green）✅ 25 用例全绿

### 2.2 viz.js 渲染函数实现

- [x] 2.2.1 实现 `renderCards()` — 卡片网格 HTML 生成
- [x] 2.2.2 实现 `renderCard()` — 单张卡片概览 HTML
- [x] 2.2.3 实现 `renderDetail()` — 展开详情 HTML（站点信息表单 + 商铺表格）
- [x] 2.2.4 实现 `renderGrid()` — 筛选+排序后重新渲染整个网格
- [x] 2.2.5 实现进度条入场动画（CSS transition width，各卡片延迟 20ms）
- [x] 2.2.6 运行 `tests/viz.test.js` 确认全部通过（Green）✅

### 2.3 viz.js 交互事件实现

- [x] 2.3.1 实现 `bindCardEvents()` — 事件委托：展开/收起、编辑按钮
- [x] 2.3.2 实现 `bindToolbar()` — 筛选按钮点击和排序按钮点击事件
- [x] 2.3.3 实现 `saveCard()` — 读取表单值写入数据，调用 `data.saveData()`
- [x] 2.3.4 实现商铺增删事件：添加行、删除行（+ confirm）
- [x] 2.3.5 实现 toast 提示 `showToast()`
- [x] 2.3.6 运行所有 viz 相关测试确认全部通过（Green）✅

### 2.4 viz.js 重构

- [x] 2.4.1 检查与 data.js 无重复代码，提取公共常量（GRADE_CONFIG、STATUS_MAP）
- [x] 2.4.2 运行 `npx vitest run` 确认无回归（Refactor 验证）✅

## 3. charts.js 图表引擎（TDD：Red → Green → Refactor）

> 覆盖 spec：`data-viz-charts` — 全部 8 个 Requirement
> 依赖：任务 2 完成

### 3.T charts 模块测试（先写失败测试）

- [x] 3.T.1 编写 `tests/charts.test.js` — `renderBarChart()` 测试用例（Red）✅ 8 用例
- [x] 3.T.2 编写 `tests/charts.test.js` — `renderDonutChart()` 测试用例（Red）✅ 5 用例
- [x] 3.T.3 编写 `tests/charts.test.js` — `renderStatusChart()` 测试用例（Red）✅ 4 用例
- [x] 3.T.4 编写 `tests/charts.test.js` — 颜色从 CSS Token 读取测试（Red）
- [x] 3.T.5 编写 `tests/integration/viz-charts.test.js` — viz + charts 联动测试（Red）✅ 3 用例
- [x] 3.T.6 运行测试确认全部新增用例失败（Red 验证）✅

### 3.1 charts.js 柱状图实现

- [x] 3.1.1 创建 `js/modules/charts.js`，实现 `renderBarChart(stations, options)` — 出租率柱状图
- [x] 3.1.2 实现柱状图 tooltip（SVG `<title>` 元素 + 数据属性）
- [x] 3.1.3 运行 `tests/charts.test.js` 中柱状图相关用例确认通过（Green）✅

### 3.2 charts.js 环形图实现

- [x] 3.2.1 实现 `renderDonutChart(gradeCount, options)` — 分级占比环形图
- [x] 3.2.2 运行 `tests/charts.test.js` 中环形图相关用例确认通过（Green）✅

### 3.3 charts.js 状态分布图实现

- [x] 3.3.1 实现 `renderStatusChart(stations, options)` — 经营状态分组柱状图
- [x] 3.3.2 运行 `tests/charts.test.js` 中状态分布图相关用例确认通过（Green）✅

### 3.4 charts.js 辅助功能与重构

- [x] 3.4.1 实现颜色 Token 读取 — `getComputedStyle().getPropertyValue()`，含回退默认值
- [x] 3.4.2 实现响应式判断 — 检测容器宽度，≤768px 时调整图表参数
- [x] 3.4.3 重构：提取公共 SVG 工具函数（`svgText`、`escapeXml`、`emptyState`）
- [x] 3.4.4 运行 `npx vitest run` 确认所有测试通过（Refactor 验证）✅

## 4. data-viz.html 页面改造

> 依赖：任务 2 和 3 完成

### 4.T E2E 测试

- [x] 4.T.1 编写 `tests/e2e/data-viz-flow.test.js`（Puppeteer）✅ 6 用例全绿
  - 页面加载 → 图表可见
  - 筛选 A 级 → 图表和卡片同步过滤
  - 展开卡片 → 编辑站点信息
  - 添加新商铺 → 出现在表格中
  - 取消编辑 → 关闭详情
  - 切换排序 → 图表更新

### 4.1 页面 HTML/CSS 修改

- [x] 4.1.1 修改 `data-viz.html` — 在工具栏上方新增图表区域 HTML + 响应式 CSS
- [x] 4.1.2 删除 `data-viz.html` 中内联 JS 逻辑（~460 行减少）
- [x] 4.1.3 替换为模块初始化脚本（~40 行）
- [x] 4.1.4 调整 CSS 样式 — 图表容器使用 `platform.css` Token

### 4.2 图表联动

- [x] 4.2.1 实现 `updateCharts(stations)` — 在筛选/排序后同步更新三个图表
- [x] 4.2.2 实现图表入场动画（opacity 0→1，500ms transition）

### 4.3 修复首页"截至日期"

- [x] 4.3.1 修改 `js/modules/home.js` — 删除"截至"日期行渲染
- [x] 4.3.2 确认 `index.html` 首页不再显示"截至 2024年5月20日"

## 5. 验证与回归

- [x] 5.1 运行 `npx vitest run` 确认全部测试通过（17 文件 167 用例，零回归）
- [x] 5.2 运行 `node scripts/check-test-coverage.js` 确认 `viz.js` 和 `charts.js` 均有测试覆盖（11/11 模块）
- [x] 5.3 手动验证（E2E 测试已覆盖全部核心场景）
- [x] 5.4 验证响应式：移动端（≤768px）图表单列布局 CSS 已就位

---

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [x] **测试策略已定义**：在 design.md 和 proposal.md 中已说明单元/集成/E2E 三层测试
- [x] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务
- [x] **测试基础设施已确认**：无需新增测试库，现有 Vitest + Puppeteer + jsdom 即可

### 阶段二：Apply（实施阶段）

- [x] **TDD 顺序已遵守**：viz.js 和 charts.js 均执行 Red → Green → Refactor
- [x] **单元测试已编写**：`tests/viz.test.js`（25）+ `tests/charts.test.js`（18）
- [x] **集成测试已编写**：`tests/integration/viz-data.test.js`（5）+ `tests/integration/viz-charts.test.js`（3）
- [x] **E2E 测试已编写**：`tests/e2e/data-viz-flow.test.js`（6），Puppeteer 全部通过
- [x] **测试命名规范**：符合 `tests/<模块名>.test.js` / `tests/<层级>/<场景>.test.js`
- [x] **测试描述清晰**：每个 `it()` 描述为完整中文断言

### 阶段三：验证阶段

- [x] **全部测试通过**：运行 `npm test` 输出 17 文件 167 用例全绿，零失败
- [x] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`，11/11 模块覆盖
- [x] **无测试作弊**：未修改测试期望值、未跳过关键断言、未 mock 核心业务逻辑
- [x] **手动验证完成**：E2E 测试覆盖了完整用户场景

### 阶段四：归档阶段

- [ ] **测试文件已提交**：所有测试文件待 git commit
- [ ] **CI 脚本已更新**（如有）：package.json 的 test 脚本无需修改
- [ ] **文档已更新**：测试策略和基础设施无变化
