# 项目 Agent 开发纪律

## 1. 核心规则

- 本文件是本仓库所有 AI Agent（包括 Codex、Claude Code）的统一纪律入口；开始工作前必须完整读取。
- 其他 Agent 入口只能引用本文件，不得复制维护另一套同类规则。
- 当前用户的明确指令优先；若用户指令、本文件、OpenSpec、测试或代码现状冲突，必须指出冲突并停止，等待确认。
- 规则不明确时不得自行选择“合理方案”继续实施。

## 2. 角色与开发单元

- 主脑 Agent 负责创建任务分支和 OpenSpec change，完成 proposal、design、specs、tasks，拆分任务并审查最终 PR。
- 执行 Agent 只负责明确分配给自己的 change，完成实现、测试、archive、commit、push 和 PR。
- 一个 change 对应一个任务分支、一个直接负责人和一个 PR；同一个 `tasks.md` 不得由多个执行 Agent 同时修改。
- 执行 Agent 不得改变 Requirement、Scenario、成功标准或业务范围；发现规格缺口必须交回主脑。
- 当前角色、change、负责人或依赖关系不明确时，禁止修改文件。

## 3. 强制开工门禁

除主脑进行需求探索和 change 规划外，修改任何文件前必须：

1. 执行 `git status --short --branch`，确认不在 `main` 且工作区状态可解释。
2. 确认当前分支、唯一 change 和直接负责人一致。
3. 依赖未初始化或 OpenSpec 版本不符时先执行 `npm run setup`；随后验证 CLI 与 `package.json` 锁定版本一致，并检查 change 状态。
4. 完整读取当前 change 的 proposal、design、全部 specs 和 tasks。
5. 完整读取 `docs/agent/collaboration.md`，按其中格式输出开工回执。

任一检查失败、回执缺项或风险未解决时，不得编码。

## 4. 按阶段读取规则

- 创建、修改、应用或归档 change 时，读取 `openspec/config.yaml` 和当前 change 的全部 artifacts。
- 开始实现、编写测试或判断完成状态前，读取 `openspec/testing-strategy.md`。
- 接收任务、交接任务、改变负责人或报告完工时，读取 `docs/agent/collaboration.md`。
- 首次执行 commit、push、创建 PR、合并、rebase 或处理 Git 冲突前，完整读取 `docs/agent/git-delivery.md`。
- 如果用户直接要求 commit、push 或 PR，必须先读取 `docs/agent/git-delivery.md`，不得跳过。
- `.agents/skills/` 和 `.claude/skills/` 中由 OpenSpec 生成的内容不得手工分叉；更新必须使用团队固定版本的 OpenSpec。

## 5. 不可越过的边界

- 允许范围以 proposal 的 Impact、design、specs 和 tasks 共同覆盖的内容为准；不一致时停止并报告。
- 禁止顺手修复无关问题、修改未覆盖模块、批量格式化无关文件或进行未授权重构。
- 禁止未经 change 明确批准而新增、删除或升级依赖，或改变数据库、API、认证、安全、构建及部署配置。
- 发现范围外缺陷只报告并建议另建 change，不得夹带修复。
- 禁止直接在 `main` 开发、commit 或 push。
- 禁止强制 push、`git reset --hard`、覆盖他人提交或未经确认改写历史。
- commit 前必须展示变更文件、验证结果和拟用 message，并等待用户明确确认。

## 6. 完成标准

- 实现必须遵循 `openspec/testing-strategy.md` 的 TDD、测试分层和覆盖要求。
- `tasks.md` 只能根据已经存在的代码、测试和验证证据勾选，不得预先标记完成。
- 测试失败、被跳过、覆盖检查失败或 artifacts 与实现不一致时，不得 archive 或声称完成。
- 只有任务全部完成、要求的测试全部通过且 artifacts 一致时，执行 Agent 才能 archive。
- 完工时必须按 `docs/agent/collaboration.md` 输出报告；Git 交付必须按 `docs/agent/git-delivery.md` 执行。

## 7. 维护

- 只有主脑在用户授权下才能修改本文件，且必须使用独立任务分支、展示差异并接受审查。
- 未经批准不得新增会覆盖根规则的嵌套 `AGENTS.md`。
- 每条规则只保留一个权威位置；重复问题应转化为简洁规则或自动化门禁。
