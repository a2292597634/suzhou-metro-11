# 任务清单：E2E 端到端测试

> 纯测试 change，豁免额外测试。Puppeteer + 本地 server.js。

## 1. 基线确认

- [x] 1.1 运行 `npx vitest run --exclude='tests/e2e/**'` 确认 172 用例全绿
- [x] 1.2 启动 server.js 确认现有 E2E 用例可运行

## 2. 首页 E2E

- [x] 2.1 创建 `tests/e2e/home-flow.test.js`（3 个用例）
  - 页面加载 → 导航栏可见
  - 导航链接包含三个页面
  - 数据来源指示器可见

## 3. 作战图 E2E

- [x] 3.1 创建 `tests/e2e/battle-map-flow.test.js`（3 个用例）
  - 页面加载 → 导航栏可见
  - 作战图页面标题可见
  - 数据来源指示器可见

## 4. 重写 data-viz E2E

- [x] 4.1 重写 `tests/e2e/data-viz-flow.test.js`（4 个用例）
  - 图表 SVG 容器存在
  - 数据来源指示器可见
  - 筛选 A 级后图表更新
  - 展开卡片后详情区域可见

## 5. 验证

- [x] 5.1 启动 server.js，运行 `npx vitest run tests/e2e/` 确认全部通过（3 文件 10 用例）
- [x] 5.2 运行全量测试，19 文件 182 用例全绿
