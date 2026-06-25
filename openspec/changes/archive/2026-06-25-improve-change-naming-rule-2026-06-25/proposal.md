## Why

当前项目级规则曾要求 OpenSpec change 使用 `YYYY-MM-DD-<动词>-<目标>` 命名，但当前团队锁定的 OpenSpec CLI 对 change 名称执行“必须以字母开头”的校验。日期在前会导致 `openspec new` 和 `openspec status --change` 等子命令失败，主脑在创建 `add-shop-site-photos` 需求时已经触发该冲突。

为了让项目规则和工具行为一致，所有新的 active change 应统一采用日期在最后的格式：`<动词>-<目标>-YYYY-MM-DD`。这既保留日期信息，又满足 CLI 的字母开头约束。

## What Changes

- 更新 `openspec/config.yaml` 的 proposal 阶段命名规则，从 `YYYY-MM-DD-<动词>-<目标>` 改为 `<动词>-<目标>-YYYY-MM-DD`。
- 明确后续任务分支仍使用 `codex/<change-name>`、`frontend/<change-name>`、`backend/<change-name>`，其中 `<change-name>` 使用日期在后的新格式。
- 明确历史 archive 目录不批量改名，避免破坏既有审计路径。
- 明确 `.agents/skills/`、`.claude/skills/` 等 OpenSpec 生成内容不得手工分叉；若固定版本 OpenSpec 生成的 archive 指令仍使用日期在前，只记录为工具生成内容限制，不在本 change 手写覆盖。

## Capabilities

### Modified Capabilities

- `openspec-change-lifecycle`: 项目 SHALL 使用日期在后的 active change 命名格式，并让命名规则与 OpenSpec CLI 校验保持一致。

## Impact

- `openspec/config.yaml`: 更新 proposal 阶段 change 命名规则。
- `openspec/changes/improve-change-naming-rule-2026-06-25/proposal.md`: 记录变更目的、范围、成功标准。
- `openspec/changes/improve-change-naming-rule-2026-06-25/design.md`: 记录命名规则设计、迁移边界和风险。
- `openspec/changes/improve-change-naming-rule-2026-06-25/specs/openspec-change-lifecycle/spec.md`: 记录命名规则 requirement。
- `openspec/changes/improve-change-naming-rule-2026-06-25/tasks.md`: 记录配置修改和验证任务。

## 测试策略

依据 `openspec/testing-strategy.md` 的变更类型映射，本 change 属于纯配置/规范文档变更，不涉及运行时代码、页面逻辑、API、数据库或用户流程，因此豁免单元、集成和 E2E 测试。

必须执行的验证是：

- `npx.cmd openspec status --change "improve-change-naming-rule-2026-06-25"` 能正常返回 artifact 状态。
- `npx.cmd openspec list --json` 能列出 `improve-change-naming-rule-2026-06-25`。
- `rg "YYYY-MM-DD-<动词>|change 命名" openspec/config.yaml` 显示 config 中只保留日期在后的新规则。
- `rg "YYYY-MM-DD-<change-name>" .agents .claude` 的命中只作为生成内容风险记录，不手工修改生成文件。

## Success Criteria

- `openspec/config.yaml` 中 proposal 阶段规则明确为 `<动词>-<目标>-YYYY-MM-DD`。
- 新建或查询 `improve-change-naming-rule-2026-06-25` 时，OpenSpec CLI 不再因为日期开头校验失败。
- 商铺照片 change 可使用 `add-shop-site-photos-2026-06-25` 这类日期在后的命名，并在命名规范 change 合并后满足项目规则。
- 历史 archive 目录不被批量重命名。
- `.agents/skills/`、`.claude/skills/` 中的 OpenSpec 生成内容没有被手工分叉；如仍包含日期在前的 archive 文案，已在设计和完工报告中作为工具限制说明。