## 1. 修复 localStorage 错误处理

- [ ] 1.1 修改 `saveToLocal()`：catch 后重新 throw 异常
- [ ] 1.2 修改 `saveData()`：localStorage 回退失败时返回 `{ success: false, error: message }`

## 1.T localStorage 测试

- [ ] 1.T.1 编写 `saveToLocal()` localStorage 满了时抛异常测试（Red）
- [ ] 1.T.2 编写 `saveData()` 服务器+localStorage 双失败时返回 error（Red）
- [ ] 1.T.3 运行测试确认失败（Red 验证）
- [ ] 1.T.4 实现使测试通过（Green）
- [ ] 1.T.5 重构代码（Refactor）

## 2. Schema + Zod 校验

- [ ] 2.1 定义 Zod schema（station、shop、globalStats、gradeInfo）
- [ ] 2.2 在 `POST /api/data` 中校验请求体
- [ ] 2.3 校验失败返回 400 和具体错误信息

## 2.T Zod 校验测试

- [ ] 2.T.1 编写缺失必填字段返回 400 测试（Red）
- [ ] 2.T.2 编写坐标超出范围返回 400 测试（Red）
- [ ] 2.T.3 编写非法等级值返回 400 测试（Red）
- [ ] 2.T.4 运行测试确认失败（Red）
- [ ] 2.T.5 实现使测试通过（Green）
- [ ] 2.T.6 重构代码（Refactor）

## 3. 完整同步

- [ ] 3.1 修改 `POST /api/data`：事务内删除不在请求中的 station 和 gradeInfo

## 3.T 完整同步测试

- [ ] 3.T.1 编写删除不在请求中的站点测试（Red）
- [ ] 3.T.2 编写删除不在请求中的分级信息测试（Red）
- [ ] 3.T.3 运行测试确认失败（Red）
- [ ] 3.T.4 实现使测试通过（Green）
- [ ] 3.T.5 重构代码（Refactor）

## 4. 乐观锁

- [ ] 4.1 `prisma/schema.prisma`: Station 表新增 `version` Int @default(1)
- [ ] 4.2 前端 `saveData()` 携带各站当前 version
- [ ] 4.3 `POST /api/data` 校验 version，不匹配返回 409

## 4.T 乐观锁测试

- [ ] 4.T.1 编写版本匹配正常保存测试（Red）
- [ ] 4.T.2 编写版本冲突返回 409 测试（Red）
- [ ] 4.T.3 运行测试确认失败（Red）
- [ ] 4.T.4 实现使测试通过（Green）
- [ ] 4.T.5 重构代码（Refactor）

## 5. 端到端验证

- [ ] 5.1 运行 Prisma 迁移生成 version 字段
- [ ] 5.2 运行 `npm test` 确认所有测试通过
- [ ] 5.3 手动验证：curl 保存脚本验证完整同步

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
- [ ] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言

### 阶段三：验证阶段

- [ ] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [ ] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`
- [ ] **无测试作弊**：没有为了通过而修改测试期望值、跳过关键断言
- [ ] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [ ] **测试文件已提交**：所有测试文件已纳入 git 版本控制
- [ ] **CI 脚本已更新**：package.json 的 test 脚本能正确运行新增测试
- [ ] **文档已更新**：已同步更新 `openspec/testing-strategy.md`

---

## 豁免规则

| 豁免场景 | 可豁免的测试 | 必须做的 | 标注位置 |
|---------|------------|---------|---------|
| 纯 CSS 样式调整 | 全部 | 手动视觉验证 | tasks.md 顶部 |
| 纯文案/标点修改 | 全部 | 手动阅读确认 | tasks.md 顶部 |
| 配置文件修改 | 全部 | 配置生效验证 | tasks.md 顶部 |
| 已有模块微小重构 | E2E | 单元测试全通过 | tasks.md 对应任务旁 |

> **注意**：豁免不等于跳过验证。即使豁免测试，也必须通过其他方式确认变更正确。
