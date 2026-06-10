## 1. 修改 data.js 空数据 fallback

- [ ] 1.1 修改 `loadData()`：服务器返回空 stations 数组时 fallback 到默认数据
- [ ] 1.2 验证 `globalStats` 和 `gradeInfo` 的空数据也触发 fallback

## 1.T data.js 空数据测试

- [ ] 1.T.1 编写 fetch 返回空 stations 数组的测试（Red）
- [ ] 1.T.2 验证 fallback 到默认数据（Red）
- [ ] 1.T.3 运行测试确认失败（Red 验证）
- [ ] 1.T.4 实现使测试通过（Green）
- [ ] 1.T.5 重构代码（Refactor）

## 2. 修改 seed.js 为幂等

- [ ] 2.1 将 `prisma.station.create()` 改为 `prisma.station.upsert()`
- [ ] 2.2 将 `prisma.globalStats.create()` 改为 `prisma.globalStats.upsert()`
- [ ] 2.3 将 `prisma.gradeInfo.create()` 改为 `prisma.gradeInfo.upsert()`
- [ ] 2.4 验证 seed.js 重复运行不报错

## 3. 修改 Dockerfile

- [ ] 3.1 CMD 中 `migrate deploy` 后追加 `prisma db seed`
- [ ] 3.2 验证 Dockerfile 语法正确

## 4. 配置 package.json

- [ ] 4.1 添加 `"prisma": { "seed": "node prisma/seed.js" }` 配置
- [ ] 4.2 验证 `npx prisma db seed` 可正常执行

## 5. 端到端验证

- [ ] 5.1 运行 `npm test` 确认所有测试通过
- [ ] 5.2 本地运行 `node prisma/seed.js` 两次，确认幂等
- [ ] 5.3 手动验证：mock 空 API 响应，确认前端 fallback 到默认数据

---

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [ ] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [ ] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [ ] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

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
