## 为什么做这个变更

项目现有 172 个单元/集成测试，但 E2E 测试仅覆盖 data-viz 一个页面（且部分用例因环境不稳定）。首页和作战图完全没有端到端覆盖。需要在三个页面各有关键流程 E2E 验证，确保页面可加载、导航正常、数据来源指示器可见。

## 变更内容

- 新增 `tests/e2e/home-flow.test.js` — 首页加载、导航链接、数据来源指示器
- 新增 `tests/e2e/battle-map-flow.test.js` — 作战图加载、页面标题、数据来源指示器
- 重写 `tests/e2e/data-viz-flow.test.js` — 图表可见、筛选联动、卡片展开、数据来源指示器

## 能力项

### 新增能力
- 无（纯测试，无功能变更）

## 影响范围

**新增文件：**
- `tests/e2e/home-flow.test.js`
- `tests/e2e/battle-map-flow.test.js`

**修改文件：**
- `tests/e2e/data-viz-flow.test.js` — 重写为单页加载模式，补充指示器验证

**不修改：**
- 所有业务代码不动

## 测试策略

本 change 本身就是测试，豁免额外测试。Puppeteer + 本地 server.js。

## 成功标准

- [x] 新增 ≥ 8 个 E2E 用例（首页 3 + 作战图 3 + data-viz 4，实际 10 个）
- [x] 所有 E2E 用例在服务器启动后全绿（3 文件 10 用例）
- [x] 单元/集成测试零回归（172 用例全绿）
