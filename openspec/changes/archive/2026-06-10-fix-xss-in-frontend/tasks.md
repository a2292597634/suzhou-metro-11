## 1. 增强 escapeHtml 工具函数

- [x] 1.1 修改 `escapeHtml()` 处理 null/undefined 输入（返回空字符串）
- [x] 1.2 修改 `escapeHtml()` 对非字符串输入先调用 `String()` 转换
- [x] 1.3 确认 `escapeHtml()` 正确处理 `&`、`<`、`>`、`"`、`'` 特殊字符

## 1.T escapeHtml 测试

- [x] 1.T.1 编写 null 输入测试（Red）
- [x] 1.T.2 编写 undefined 输入测试（Red）
- [x] 1.T.3 编写数字输入测试（Red）
- [x] 1.T.4 编写含特殊字符字符串测试（Red）
- [x] 1.T.5 运行测试确认失败（Red 验证）
- [x] 1.T.6 实现使测试通过（Green）
- [x] 1.T.7 重构代码（Refactor）

## 2. 修复 home.js XSS

- [x] 2.1 在 `renderStationTable` 的 `shopsHtml` 中对 `shop.name`、`shop.tenant`、`shop.shortNo` 使用 `escapeHtml()`
- [x] 2.2 在 `updateTooltipContent` 的 `shopHtml` 中对 `shop.name`、`shop.tenant` 使用 `escapeHtml()`

## 2.T home.js XSS 测试

- [x] 2.T.1 编写含 XSS payload 的 shop 数据渲染测试（Red）
- [x] 2.T.2 验证渲染输出中不包含未转义的 `<`（Red）
- [x] 2.T.3 运行测试确认失败（Red 验证）
- [x] 2.T.4 实现使测试通过（Green）
- [x] 2.T.5 重构代码（Refactor）

## 3. 修复 viz.js XSS

- [x] 3.1 在 `renderCard` 中对 `station.name`、`shop.name`、`shop.tenant` 使用 `escapeHtml()`
- [x] 3.2 在 `renderDetail` 中对 `station.name`、`shop.name`、`shop.tenant` 使用 `escapeHtml()`
- [x] 3.3 在 `renderDetail` 的 `<input value="...">` 属性中使用 `escapeHtml()`

## 3.T viz.js XSS 测试

- [x] 3.T.1 编写含 XSS payload 的 station/shop 数据渲染测试（Red）
- [x] 3.T.2 验证渲染输出中不包含未转义的 `<`（Red）
- [x] 3.T.3 运行测试确认失败（Red 验证）
- [x] 3.T.4 实现使测试通过（Green）
- [x] 3.T.5 重构代码（Refactor）

## 4. 修复 interaction.js XSS

- [x] 4.1 在 `renderShopTable` 中对 `shop.name`、`shop.type`、`shop.tenant`、`shop.contact`、`shop.openDate`、`shop.remark` 使用 `escapeHtml()`

## 4.T interaction.js XSS 测试

- [x] 4.T.1 编写含 XSS payload 的商铺数据渲染测试（Red）
- [x] 4.T.2 验证渲染输出中不包含未转义的 `<`（Red）
- [x] 4.T.3 运行测试确认失败（Red 验证）
- [x] 4.T.4 实现使测试通过（Green）
- [x] 4.T.5 重构代码（Refactor）

## 5. 修复 render.js XSS

- [x] 5.1 在 `renderGradePanel` 中对 `info.name`、`info.desc` 使用 `escapeHtml()`，并用 DOM API 安全设置 `data-raw`

## 5.T render.js XSS 测试

- [x] 5.T.1 编写含 XSS payload 的分级信息渲染测试（Red）
- [x] 5.T.2 验证渲染输出中不包含未转义的 `<`（Red）
- [x] 5.T.3 运行测试确认失败（Red 验证）
- [x] 5.T.4 实现使测试通过（Green）
- [x] 5.T.5 重构代码（Refactor）

## 6. 端到端验证

- [x] 6.1 运行 `npm test` 确认所有测试通过（211 passed）
- [x] 6.2 运行 `node scripts/check-test-coverage.js` 确认模块覆盖和数量底线达标
- [x] 6.3 手动验证：构造含 XSS payload 的数据 → 渲染输出纯文本，脚本不执行
- [x] 6.4 确认页面布局和样式无变化

---

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
- [x] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言（如「应该从无文件名路径解析首页」）

### 阶段三：验证阶段

- [x] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [x] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`，输出「所有模块均已覆盖」
- [x] **无测试作弊**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [x] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [x] **测试文件已提交**：所有测试文件已纳入 git 版本控制
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
