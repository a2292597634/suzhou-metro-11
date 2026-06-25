## 1. 更新项目命名规则

- [x] 1.1 更新 `openspec/config.yaml`，将 proposal 阶段 change 命名规则改为 `<动词>-<目标>-YYYY-MM-DD`
- [x] 1.2 保留动词白名单 `add/refactor/fix/improve/remove`
- [x] 1.3 明确日期统一放在最后，目标继续使用 kebab-case

## 1.T 配置验证

- [x] 1.T.1 执行 `rg "<动词>-<目标>-YYYY-MM-DD" openspec/config.yaml`，确认新规则存在
- [x] 1.T.2 执行 `rg "YYYY-MM-DD-<动词>" openspec/config.yaml`，确认旧 active change 命名规则不存在
- [x] 1.T.3 执行 `npx.cmd openspec status --change "improve-change-naming-rule-2026-06-25"`，确认 CLI 可查询日期在后的 change
- [x] 1.T.4 执行 `npx.cmd openspec list --json`，确认 CLI 可列出日期在后的 active change

## 2. 生成内容和历史目录边界检查

- [x] 2.1 检查 `openspec/changes/archive/`，确认不批量重命名历史 archive 目录
- [x] 2.2 执行 `rg "YYYY-MM-DD-<change-name>" .agents .claude`，记录 OpenSpec 生成内容中是否仍有日期在前的 archive 文案
- [x] 2.3 如 `.agents/skills/` 或 `.claude/skills/` 仍含旧 archive 文案，只在交付报告记录，不手工修改生成文件
- [x] 2.4 在 proposal、design 和 spec 中记录：如团队后续要求 archive 文案也统一，另开 change 处理 OpenSpec 固定版本或生成源，不夹带在本 change

## 2.T 边界验证

- [x] 2.T.1 执行 `git status --short`，确认本 change 未修改 `.agents/skills/` 或 `.claude/skills/` 生成文件
- [x] 2.T.2 执行 `git status --short`, 确认本 change 未批量移动 `openspec/changes/archive/` 历史目录

## 3. 回归验证

- [x] 3.1 执行 `npx.cmd openspec status --change "improve-change-naming-rule-2026-06-25"`
- [x] 3.2 执行 `npx.cmd openspec list --json`
- [x] 3.3 重读 proposal、design、specs、tasks，确认本 change 只覆盖命名规范，不包含商铺照片功能

## 3.T 回归验证测试

- [x] 3.T.1 本 change 为纯配置/规范文档变更，按 `openspec/testing-strategy.md` 豁免单元、集成和 E2E 测试
- [x] 3.T.2 验证命令全部通过后，记录命令输出摘要

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [x] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [x] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [x] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

### 阶段二：Apply（实施阶段）

- [x] **TDD 顺序已遵守**：本变更为纯配置/规范文档变更，无运行时代码；按豁免规则不适用 Red → Green → Refactor，已用配置验证替代
- [x] **单元测试已编写**：本变更不新增/修改 `js/modules/*.js`，按纯配置变更豁免单元测试
- [x] **集成测试已编写**（如涉及多模块联动）：本变更不涉及模块联动，按纯配置变更豁免集成测试
- [x] **E2E 测试已编写**（如涉及页面/核心流程）：本变更不涉及页面或核心用户流程，按纯配置变更豁免 E2E 测试
- [x] **测试命名规范**：本变更未新增测试文件；验证命令在 1.T、2.T、3.T 中列明
- [x] **测试描述清晰**：本变更未新增 `it()`；验证命令和预期结果已在任务中中文描述

### 阶段三：验证阶段

- [x] **全部测试通过**：本变更按纯配置规则豁免 `npm test`；已执行 OpenSpec status/list 和 config 文本验证
- [x] **覆盖率检查通过**：本变更不修改运行时代码，按纯配置规则豁免覆盖率检查
- [x] **无测试作弊**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [x] **手动验证完成**：本变更无浏览器场景；已手动核对 OpenSpec CLI 和文本检查结果

### 阶段四：归档阶段

- [x] **测试文件已提交**：本变更未新增测试文件，验证记录保留在 tasks.md
- [x] **CI 脚本已更新**（如有）：本变更不需要更新 CI 脚本
- [x] **文档已更新**：本变更不改变测试策略或基础设施，无需更新 `openspec/testing-strategy.md`

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