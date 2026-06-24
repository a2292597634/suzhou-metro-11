# Git 与 PR 交付规范

## 1. 读取时机

首次执行以下任一操作前必须完整读取本文件：

- commit 或 push。
- 创建、更新或合并 PR。
- rebase、解决 Git 冲突或改写提交历史。
- 将 OpenSpec 规划分支交给执行开发者。

如果用户的请求直接从 commit、push 或 PR 开始，仍然必须先执行本文件的交付检查。

## 2. 分支模型

- `main` 是稳定集成分支，禁止直接开发、commit 和 push。
- 一个 OpenSpec change 对应一个任务分支和一个 PR。
- 推荐分支名：`codex/<change-name>`、`frontend/<change-name>`、`backend/<change-name>`。
- 主脑在任务分支创建规划提交；执行者在同一分支完成实现和归档提交。
- 任务分支可以包含可审查的规划、实现和归档提交；合并到 `main` 时必须 squash 为一个完整 commit。
- 未经主脑重新分配，不得接管其他负责人拥有的远端任务分支。

## 3. Git 写操作前检查

commit、push、rebase 或 PR 前必须检查：

1. 执行 `git status --short --branch`，确认当前分支不是 `main`。
2. 确认分支名称、OpenSpec change 和负责人一致。
3. 检查工作区中不存在其他 change、用户私有文件或来源不明的修改。
4. 获取远端状态，确认本地没有遗漏他人提交。
5. 重新读取 proposal、design、specs、tasks，核对实际改动没有越界。
6. 运行 change 要求的测试、完整回归测试和覆盖检查。
7. 确认 tasks 状态、测试证据和 archive 状态真实一致。

任一检查失败时不得继续 Git 写操作。

## 4. 同步与冲突处理

- 开工和交付前应同步远端，优先保持清晰的线性任务分支历史。
- rebase 前必须保证工作区干净，并确认当前提交已经可恢复。
- 冲突必须逐文件理解双方意图后解决，不得使用“全部采用当前”或“全部采用远端”批量覆盖。
- 涉及 Requirement、公共接口、数据结构或同一 `tasks.md` 的冲突必须交给主脑决定。
- 解决冲突后必须重新运行受影响测试；仅能成功 rebase 不代表功能正确。
- 禁止 `git reset --hard`、强制 push、删除他人分支或未经确认改写共享历史。

## 5. commit 门禁

执行 commit 前必须向用户展示：

```text
当前分支：
对应 change：
拟提交文件：
排除的工作区文件：
测试及结果：
archive 状态：
拟用 commit message：
```

只有用户明确回复“可以”“提交”“commit”等授权后才能执行 commit。对一个 commit 的授权不自动授权后续其他 commit。

提交内容必须满足：

- 不包含无关文件、环境变量、密钥、个人配置、日志或临时产物。
- 不混入其他 change。
- message 使用中文描述实际目的，保留必要的技术标识符。
- 规划提交清楚标明 OpenSpec change；实现或归档提交与对应任务一致。

## 6. push 门禁

- push 只能跟随已经获得确认并成功完成的 commit。
- 只能推送到当前 change 对应的远端任务分支。
- push 前再次确认远端没有未知提交；发现分歧时停止，不得强推。
- push 失败必须报告原始错误和本地提交状态，不得通过改写历史强行解决。
- 禁止向 `main` 直接 push。

## 7. PR 要求

PR 必须指向 `main`，并包含：

- OpenSpec change 名称和路径。
- 业务目标与实际实现范围。
- 主要修改文件或模块。
- 测试命令、结果和覆盖检查。
- tasks 完成状态和 archive 状态。
- 已知风险、未完成项和后续 change。
- 明确声明没有夹带范围外修改。

以下条件未满足时不得合并：

- CI 全部通过。
- 主脑完成规格、范围和实现审查。
- 必要的人工审查完成。
- PR 分支与最新 `main` 的关系已确认。
- change 已达到团队约定的 archive 条件。

合并必须使用 squash，使 `main` 上一个 change 最终对应一个完整 commit。合并后再按团队流程清理任务分支。
