## 1. 共享等级工具

- [x] 1.1 在 `js/modules/utils.js` 中新增 `VALID_GRADES`、`normalizeGrade()`、`getGradeClass()`、`groupStationsByGrade()` 等共享等级工具
- [x] 1.2 将工具函数保持为纯函数，不依赖 DOM、`state` 或网络

## 1.T 共享等级工具测试

- [x] 1.T.1 在 `tests/utils.test.js` 中编写等级规范化测试用例（Red）
- [x] 1.T.2 在 `tests/utils.test.js` 中编写按等级分组测试用例（Red）
- [x] 1.T.3 运行 `npx vitest run tests/utils.test.js` 确认新增等级测试失败（Red 验证）
- [x] 1.T.4 实现 1.1-1.2 使等级工具测试通过（Green）
- [x] 1.T.5 在测试保护下重构重复等级判断（Refactor）

## 2. 默认数据等级一致性

- [x] 2.1 调整 `js/modules/data.js` 的默认站点兜底，使 `getDefaultStations()` 与 `data/default-data.json` 中每个 station id 的 `grade` 一致
- [x] 2.2 确保 `loadData()` 在 JSON 默认数据可用时使用 JSON 中的最新等级

## 2.T 默认数据等级一致性测试

- [x] 2.T.1 在 `tests/data.test.js` 中编写 `getDefaultStations()` 与 `data/default-data.json` 等级一致性测试（Red）
- [x] 2.T.2 在 `tests/data.test.js` 中编写 JSON fallback 加载最新等级测试（Red）
- [x] 2.T.3 运行 `npx vitest run tests/data.test.js` 确认新增测试失败（Red 验证）
- [x] 2.T.4 实现 2.1-2.2 使默认数据等级测试通过（Green）
- [x] 2.T.5 在测试保护下清理重复默认等级维护逻辑（Refactor）

## 3. 主作战图分级面板联动

- [x] 3.1 调整 `js/modules/render.js`，让 `renderGradePanel()` 从当前 `state.stations` 动态派生 S/A/B/C 站点名单
- [x] 3.2 保留 `state.gradeInfo` 的等级名称和说明展示，但不再用它决定站点归属
- [x] 3.3 确保分级面板输出对等级名称、说明和站点名称继续执行 HTML 转义

## 3.T 主作战图分级面板测试

- [x] 3.T.1 在 `tests/render.test.js` 中编写站点等级变化后分级面板名单同步变化测试（Red）
- [x] 3.T.2 在 `tests/render.test.js` 中编写非法等级兜底和 HTML 转义测试（Red）
- [x] 3.T.3 运行 `npx vitest run tests/render.test.js` 确认新增测试失败（Red 验证）
- [x] 3.T.4 实现 3.1-3.3 使分级面板测试通过（Green）
- [x] 3.T.5 在测试保护下重构分级面板内部重复逻辑（Refactor）

## 4. 首页经营概览等级联动

- [x] 4.1 调整 `js/modules/home.js` 的 `calcHomeStats()`，使用规范化等级计算 `gradeCount`
- [x] 4.2 调整首页 S/A 重点站筛选，使用规范化后的当前站点等级
- [x] 4.3 调整首页站点表格和趋势详情中的等级徽标 class，使用共享等级工具生成

## 4.T 首页经营概览等级联动测试

- [x] 4.T.1 在 `tests/integration/home-dashboard.test.js` 中编写 `gradeCount` 随当前站点等级变化的测试（Red）
- [x] 4.T.2 在 `tests/integration/home-dashboard.test.js` 中编写 S/A 筛选使用当前等级的测试（Red）
- [x] 4.T.3 在 `tests/integration/home-dashboard.test.js` 中编写小写等级生成正确徽标 class 的测试（Red）
- [x] 4.T.4 运行 `npx vitest run tests/integration/home-dashboard.test.js` 确认新增测试失败（Red 验证）
- [x] 4.T.5 实现 4.1-4.3 使首页等级联动测试通过（Green）
- [x] 4.T.6 在测试保护下移除首页局部等级判断重复代码（Refactor）

## 5. 数据可视化页面等级联动

- [x] 5.1 调整 `js/modules/viz.js` 的等级筛选，使筛选值和站点等级都经过共享规范化规则
- [x] 5.2 调整 data-viz 卡片徽标、`data-grade` 属性和详情选择框，使用当前规范化等级
- [x] 5.3 确保保存站点等级后 `renderGrid()` 和图表回调使用最新等级筛选结果

## 5.T 数据可视化页面等级联动测试

- [x] 5.T.1 在 `tests/viz.test.js` 中编写等级筛选支持小写当前等级的测试（Red）
- [x] 5.T.2 在 `tests/viz.test.js` 中编写卡片徽标和 `data-grade` 使用当前等级的测试（Red）
- [x] 5.T.3 在 `tests/viz.test.js` 或 `tests/integration/viz-data.test.js` 中编写保存后图表回调用最新筛选结果的测试（Red）
- [x] 5.T.4 运行 `npx vitest run tests/viz.test.js tests/integration/viz-data.test.js` 确认新增测试失败（Red 验证）
- [x] 5.T.5 实现 5.1-5.3 使 data-viz 等级联动测试通过（Green）
- [x] 5.T.6 在测试保护下移除 data-viz 局部等级判断重复代码（Refactor）

## 6. 站点价值等级管理模块

- [x] 6.1 更新 `data-viz.html` 页面标题和说明，将页面定位为「商业信息管理」
- [x] 6.2 在 `data-viz.html` 的站点卡片网格下方新增「站点价值等级管理」模块挂载点
- [x] 6.3 在 `js/modules/viz.js` 中新增站点价值等级管理模块渲染逻辑，包含 S/A/B/C 分布概览和全站等级编辑表
- [x] 6.4 在 `js/modules/viz.js` 中新增等级调整暂存、待保存计数、保存等级调整和撤销更改逻辑
- [x] 6.5 在 `js/modules/viz.js` 中新增「定位卡片」操作，滚动到对应站点卡片且不改变等级
- [x] 6.6 在 `css/data-viz.css` 中新增站点价值等级管理模块样式，保持与商业信息管理页的工具型界面一致

## 6.T 站点价值等级管理模块测试

- [x] 6.T.1 在 `tests/viz.test.js` 中编写等级分布概览从当前 `state.stations[].grade` 派生的测试（Red）
- [x] 6.T.2 在 `tests/viz.test.js` 中编写等级调整先暂存、不立即修改 `state.stations` 的测试（Red）
- [x] 6.T.3 在 `tests/viz.test.js` 中编写保存等级调整后更新 `state.stations`、调用 `saveData()` 并触发重渲染的测试（Red）
- [x] 6.T.4 在 `tests/viz.test.js` 中编写撤销未保存等级调整的测试（Red）
- [x] 6.T.5 在 `tests/viz.test.js` 中编写定位到站点卡片不改变等级的测试（Red）
- [x] 6.T.6 运行 `npx vitest run tests/viz.test.js` 确认新增模块测试失败（Red 验证）
- [x] 6.T.7 实现 6.1-6.6 使站点价值等级管理模块测试通过（Green）
- [x] 6.T.8 在测试保护下整理站点价值等级管理模块内部状态和渲染边界（Refactor）

## 7. 全站等级显示一致性

- [x] 7.1 梳理主作战图、首页经营概览、商业信息管理页中所有显示或筛选车站等级的位置
- [x] 7.2 确保所有等级显示、筛选、统计和图表回调均从 `state.stations[].grade` 与共享等级工具派生
- [x] 7.3 确保单站卡片详情修改等级和站点价值等级管理模块批量修改等级互相同步
- [x] 7.4 确保保存等级调整后刷新当前页面所有依赖等级的区域

## 7.T 全站等级显示一致性测试

- [x] 7.T.1 在 `tests/render.test.js` 中确认主作战图分级面板从当前等级派生（Red）
- [x] 7.T.2 在 `tests/integration/home-dashboard.test.js` 中确认首页表格、趋势详情和 S/A 筛选从当前等级派生（Red）
- [x] 7.T.3 在 `tests/integration/viz-data.test.js` 中确认商业信息管理页卡片、筛选、价值等级管理模块和图表回调从当前等级派生（Red）
- [x] 7.T.4 在 `tests/integration/viz-data.test.js` 中确认单站详情和批量等级管理互相同步（Red）
- [x] 7.T.5 运行 `npx vitest run tests/render.test.js tests/integration/home-dashboard.test.js tests/integration/viz-data.test.js` 确认新增一致性测试失败（Red 验证）
- [x] 7.T.6 实现 7.1-7.4 使全站等级一致性测试通过（Green）
- [x] 7.T.7 在测试保护下移除任何剩余等级硬编码或独立副本（Refactor）

## 8. 导航页面命名更新

- [x] 8.1 调整 `js/modules/nav.js`，将 `data-viz.html` 对应的桌面顶部导航文案改为「商业信息管理」
- [x] 8.2 调整 `js/modules/nav.js`，将 `data-viz.html` 对应的移动底部导航文案改为「商业信息管理」
- [x] 8.3 确保 data-viz 页面 URL、页面 key 和激活态逻辑保持不变

## 8.T 导航页面命名测试

- [x] 8.T.1 在 `tests/nav.test.js` 中编写顶部导航显示「商业信息管理」且不显示「商业分析」的测试（Red）
- [x] 8.T.2 在 `tests/nav.test.js` 中编写移动底部导航显示「商业信息管理」且 data-viz 激活态不变的测试（Red）
- [x] 8.T.3 运行 `npx vitest run tests/nav.test.js` 确认新增测试失败（Red 验证）
- [x] 8.T.4 实现 8.1-8.3 使导航命名测试通过（Green）
- [x] 8.T.5 在测试保护下清理导航配置中旧的「商业分析」/「商业数据」文案（Refactor）

## 9. 回归验证

- [x] 9.1 运行等级联动、价值等级管理模块和导航命名相关测试：`npx vitest run tests/utils.test.js tests/data.test.js tests/render.test.js tests/viz.test.js tests/nav.test.js tests/integration/home-dashboard.test.js tests/integration/viz-data.test.js`
- [x] 9.2 运行 `npm test`，记录并修复与本 change 相关的失败
- [x] 9.3 运行 `node scripts/check-test-coverage.js`
- [x] 9.4 手动检查主作战图、首页经营概览、商业信息管理页中同一车站等级显示一致
- [x] 9.5 手动检查商业信息管理页站点价值等级管理模块可批量暂存、保存、撤销并同步刷新卡片和筛选结果
- [x] 9.6 手动检查导航显示「商业信息管理」

## 9.T 回归验证测试

- [x] 9.T.1 确认所有新增测试已经历 Red → Green
- [x] 9.T.2 确认相关测试全部通过且无跳过关键断言
- [x] 9.T.3 若 `npm test` 因既有环境依赖失败，记录失败原因并确保等级联动、价值等级管理模块和导航命名相关测试独立通过

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [x] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [x] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [x] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

### 阶段二：Apply（实施阶段）

- [x] **TDD 顺序已遵守**：每个功能点执行了 Red → Green → Refactor
- [x] **单元测试已编写**：每个新增/修改的模块都有对应的 `tests/<模块名>.test.js`
- [x] **集成测试已编写**（如涉及多模块联动）：有 `tests/integration/<场景>.test.js`
- [x] **E2E 测试已编写**（如涉及页面/核心流程）：有 `tests/e2e/<场景>.test.js`
- [x] **测试命名规范**：测试文件命名符合 `tests/<模块名>.test.js` 或 `tests/<层级>/<场景>.test.js`
- [x] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言

### 阶段三：验证阶段

- [ ] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [ ] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`
- [x] **无测试作假**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [x] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [ ] **测试文件已提交**：所有测试文件已纳入 git 版本控制
- [ ] **CI 脚本已更新**（如有）：`package.json` 的 test 脚本能正确运行新增测试
- [ ] **文档已更新**：如测试策略或基础设施有变化，已同步更新 `openspec/testing-strategy.md`

---

## 豁免规则

以下情况可以豁免部分或全部测试，但必须在 change 中明确标注并说明理由：

| 豁免场景 | 可豁免的测试 | 必须做的 | 标注位置 |
|---------|------------|---------|---------|
| 纯 CSS 样式调整（颜色、间距、圆角） | 全部 | 手动视觉验证 | tasks.md 顶部 |
| 纯文案/标点修改 | 全部 | 手动阅读确认 | tasks.md 顶部 |
| 配置文件修改（不涉及逻辑） | 全部 | 配置生效验证 | tasks.md 顶部 |
| 已有模块的微小重构（无行为变更） | E2E | 单元测试需全部通过 | tasks.md 对应任务时 |

> 注意：豁免不等于跳过验证。即使豁免测试，也必须通过其他方式确认变更正确。
