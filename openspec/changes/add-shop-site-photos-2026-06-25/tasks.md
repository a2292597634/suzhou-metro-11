## 1. 数据库与后端持久化

- [ ] 1.1 在 `prisma/schema.prisma` 的 `Shop` 模型新增 `photo String? @default("")`
- [ ] 1.2 新增 Prisma migration，将 `Shop.photo` 写入 PostgreSQL schema
- [ ] 1.3 更新 `server.js` 的 `GET /api/data` 格式化逻辑，返回 `shop.photo || ""`
- [ ] 1.4 更新 `server.js` 的 `shopSchema`，仅允许空字符串或带 `data:image/(jpeg|png|webp);base64,` 前缀的图片 Data URL，并将最大长度限制为 3_000_000 个字符
- [ ] 1.5 更新 `server.js` 的 `POST /api/data` 写入逻辑，保存 `photo`
- [ ] 1.6 更新 `prisma/seed.js`，确保默认数据未提供照片时兼容空字符串

## 1.T 数据库与后端持久化测试

- [ ] 1.T.1 在 `tests/shop-schema.test.js` 编写 `photo` 默认空字符串、合法 Data URL 和非法值校验测试（Red）
- [ ] 1.T.2 在 `tests/integration/auth-data-flow.test.js` 编写 `/api/data` 保存并返回 `photo` 的成功往返测试（Red）
- [ ] 1.T.3 在 `tests/server-security.test.js` 编写 `/api/data` 拒绝非法照片字段和超长照片字段的测试（Red）
- [ ] 1.T.4 运行 `npx vitest run tests/shop-schema.test.js tests/integration/auth-data-flow.test.js tests/server-security.test.js` 确认新增测试失败（Red 验证）
- [ ] 1.T.5 实现 1.1-1.6 使后端照片持久化测试通过（Green）
- [ ] 1.T.6 在测试保护下整理后端 schema 和格式化逻辑（Refactor）

## 2. 前端数据模型与保存链路

- [ ] 2.1 更新 `js/modules/data.js` 默认商铺和新增商铺相关数据，确保 `photo` 默认空字符串
- [ ] 2.2 确保 `loadData()` 从 API 和 localStorage 加载时保留 `shop.photo`
- [ ] 2.3 确保 `saveData()` 发送 `state.stations` 时保留 `shop.photo`
- [ ] 2.4 确保照片字段不进入 Excel 导入导出，不改变现有 Excel 表头

## 2.T 前端数据模型与保存链路测试

- [ ] 2.T.1 在 `tests/data.test.js` 编写 API/localStorage 加载保留 `shop.photo` 的测试（Red）
- [ ] 2.T.2 在 `tests/data.test.js` 编写 `saveData()` 请求体包含 `shop.photo` 的测试（Red）
- [ ] 2.T.3 在 `tests/data.test.js` 编写 Excel 导出表头不新增照片列的回归测试（Red）
- [ ] 2.T.4 运行 `npx vitest run tests/data.test.js` 确认新增测试失败（Red 验证）
- [ ] 2.T.5 实现 2.1-2.4 使数据链路测试通过（Green）
- [ ] 2.T.6 在测试保护下清理照片默认值和兼容逻辑（Refactor）

## 3. 商业信息管理页照片管理

- [ ] 3.1 更新 `js/modules/viz.js` 的商铺编辑表格，新增“现场照片”列和导入/替换/删除按钮
- [ ] 3.2 新增照片文件选择处理逻辑，仅接受 JPEG、PNG、WebP 且原文件不超过 2MB
- [ ] 3.3 使用 `FileReader.readAsDataURL()` 将合法图片写入对应 `shop.photo`
- [ ] 3.4 删除照片时将对应 `shop.photo` 设置为空字符串，并要求用户确认
- [ ] 3.5 确保点击“保存修改”时照片字段和其他商铺字段一起保存
- [ ] 3.6 更新 `css/data-viz.css`，补充照片列、照片状态、操作按钮和错误提示样式

## 3.T 商业信息管理页照片管理测试

- [ ] 3.T.1 在 `tests/viz.test.js` 编写商铺表格照片列和按钮渲染测试（Red）
- [ ] 3.T.2 在 `tests/viz.test.js` 编写合法图片导入后写入 `shop.photo` 测试（Red）
- [ ] 3.T.3 在 `tests/viz.test.js` 编写非法类型和超大图片不修改 `shop.photo` 测试（Red）
- [ ] 3.T.4 在 `tests/viz.test.js` 编写删除照片清空 `shop.photo` 测试（Red）
- [ ] 3.T.5 在 `tests/integration/viz-data.test.js` 编写保存站点详情保留照片字段测试（Red）
- [ ] 3.T.6 运行 `npx vitest run tests/viz.test.js tests/integration/viz-data.test.js` 确认新增测试失败（Red 验证）
- [ ] 3.T.7 实现 3.1-3.6 使照片管理测试通过（Green）
- [ ] 3.T.8 在测试保护下整理照片操作和表格渲染边界（Refactor）

## 4. 商业信息管理页悬停预览

- [ ] 4.1 更新站点卡片商铺预览项，使有照片的商铺可触发照片预览
- [ ] 4.2 更新商铺编辑表格行，使有照片的商铺悬停时显示预览浮层
- [ ] 4.3 确保无照片商铺不显示空白图片浮层、不渲染空 `src`
- [ ] 4.4 更新 `css/data-viz.css`，新增照片预览浮层样式并避免遮挡表格操作

## 4.T 商业信息管理页悬停预览测试

- [ ] 4.T.1 在 `tests/viz.test.js` 编写有照片商铺悬停显示预览的测试（Red）
- [ ] 4.T.2 在 `tests/viz.test.js` 编写无照片商铺不显示图片浮层的测试（Red）
- [ ] 4.T.3 在 `tests/viz.test.js` 编写预览浮层包含商铺名称或铺号的测试（Red）
- [ ] 4.T.4 运行 `npx vitest run tests/viz.test.js` 确认新增预览测试失败（Red 验证）
- [ ] 4.T.5 实现 4.1-4.4 使悬停预览测试通过（Green）
- [ ] 4.T.6 在测试保护下整理浮层定位和清理逻辑（Refactor）

## 5. 经营总览趋势卡片点位照片展示

- [ ] 5.1 更新 `js/modules/home.js` 的 `createTrendDetail()`，在卡片下半部分渲染当前站点 `shops` 明细
- [ ] 5.2 点位明细左侧显示铺号/名称、状态、商户和面积等信息
- [ ] 5.3 点位明细右侧显示照片缩略图；无照片时显示紧凑占位且不渲染空图片
- [ ] 5.4 保持趋势图 SVG 尺寸不变，趋势详情卡片宽度尽量稳定
- [ ] 5.5 更新 `css/home-dashboard.css`，为点位明细区域设置两栏布局、最大高度和内部滚动

## 5.T 经营总览趋势卡片点位照片展示测试

- [ ] 5.T.1 在 `tests/integration/home-dashboard.test.js` 编写趋势详情显示点位明细的测试（Red）
- [ ] 5.T.2 在 `tests/integration/home-dashboard.test.js` 编写有照片点位显示缩略图和 alt 文本的测试（Red）
- [ ] 5.T.3 在 `tests/integration/home-dashboard.test.js` 编写无照片点位不渲染空图片的测试（Red）
- [ ] 5.T.4 在 `tests/integration/home-dashboard.test.js` 编写点位较多时使用内部滚动且 SVG 尺寸不变的测试（Red）
- [ ] 5.T.5 运行 `npx vitest run tests/integration/home-dashboard.test.js` 确认新增测试失败（Red 验证）
- [ ] 5.T.6 实现 5.1-5.5 使趋势卡片测试通过（Green）
- [ ] 5.T.7 在测试保护下整理趋势详情 HTML 和样式（Refactor）

## 6. E2E 与手动验证

- [ ] 6.1 更新 `tests/e2e/data-viz-flow.test.js`，覆盖导入照片、保存、悬停预览和删除照片流程
- [ ] 6.2 准备小型测试图片 fixture 或在测试中生成合法 Data URL 文件
- [ ] 6.3 手动验证商业信息管理页照片导入、替换、删除、悬停预览
- [ ] 6.4 手动验证经营总览趋势卡片下半部分点位信息在左、照片在右
- [ ] 6.5 手动验证刷新页面后服务器保存的照片仍可见

## 6.T E2E 与手动验证测试

- [ ] 6.T.1 编写 E2E 测试并先运行确认失败（Red）
- [ ] 6.T.2 实现前述功能后运行 `npm run test:e2e` 确认通过（Green）
- [ ] 6.T.3 在测试保护下修正任何 E2E 暴露的交互或布局问题（Refactor）

## 7. 回归验证

- [ ] 7.1 运行定向测试：`npx vitest run tests/shop-schema.test.js tests/data.test.js tests/viz.test.js tests/integration/viz-data.test.js tests/integration/home-dashboard.test.js tests/integration/auth-data-flow.test.js tests/server-security.test.js`
- [ ] 7.2 运行完整非 E2E 回归：`npm test`
- [ ] 7.3 运行 E2E：`npm run test:e2e`
- [ ] 7.4 运行覆盖检查：`node scripts/check-test-coverage.js`
- [ ] 7.5 重读 proposal、design、specs 和 tasks，确认实现未越界且 artifacts 一致

## 7.T 回归验证测试

- [ ] 7.T.1 确认所有新增测试已经历 Red → Green
- [ ] 7.T.2 确认没有跳过关键断言或 mock 核心业务逻辑
- [ ] 7.T.3 如存在非本 change 引起的基线失败，记录命令、失败摘要和与本 change 无关的证据

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [x] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [x] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [x] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

### 阶段二：Apply（实施阶段）

- [ ] **TDD 顺序已遵守**：每个功能点执行了 Red → Green → Refactor
- [ ] **单元测试已编写**：每个新增/修改的模块都有对应的 `tests/<模块名>.test.js`
- [ ] **集成测试已编写**（如涉及多模块联动）：有 `tests/integration/<场景>.test.js`
- [ ] **E2E 测试已编写**（如涉及页面/核心流程）：有 `tests/e2e/<场景>.test.js`
- [ ] **测试命名规范**：测试文件命名符合 `tests/<模块名>.test.js` 或 `tests/<层级>/<场景>.test.js`
- [ ] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言（如「应该从无文件名路径解析首页」）

### 阶段三：验证阶段

- [ ] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [ ] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`，输出「所有模块均已覆盖」
- [ ] **无测试作弊**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [ ] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [ ] **测试文件已提交**：所有测试文件已纳入 git 版本控制
- [ ] **CI 脚本已更新**（如有）：package.json 的 test 脚本能正确运行新增测试
- [ ] **文档已更新**：如测试策略或基础设施有变化，已同步更新 `openspec/testing-strategy.md`

---

## 豁免规则

以下情况可以豁免部分或全部测试，但必须在 change 中明确标注并说明理由：

| 豁免场景 | 可豁免的测试 | 必须做的 | 标注位置 |
|---------|------------|---------|---------|
| 纯 CSS 样式调整（颜色、间距、圆角） | 全部 | 手动视觉验证 | tasks.md 顶部 |
| 纯文案/标点修改 | 全部 | 手动阅读确认 | tasks.md 顶部 |
| 配置文件修改（不涉及逻辑） | 全部 | 配置生效验证 | tasks.md 顶部 |
| 已有模块的微小重构（无行为变更） | E2E | 单元测试需全部通过 | tasks.md 对应任务旁 |

> **注意**：豁免不等于跳过验证。即使豁免测试，也必须通过其他方式确认变更正确。
