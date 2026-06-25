## Purpose

规范 OpenSpec change 生命周期中的 active change 命名规则，使新 change 使用日期后置格式并避免以数字开头的名称被 CLI 拒绝。

## Requirements

### Requirement: Active change 命名使用日期在后格式

项目 SHALL 将新的 active OpenSpec change 命名为 `<动词>-<目标>-YYYY-MM-DD`，其中动词限定为 `add`、`refactor`、`fix`、`improve`、`remove`，目标使用 kebab-case，日期为四位年份、两位月份、两位日期。

#### Scenario: 日期在后的 change 可被 OpenSpec CLI 查询
- **WHEN** 存在名为 `improve-change-naming-rule-2026-06-25` 的 active change
- **AND** 执行 `npx.cmd openspec status --change "improve-change-naming-rule-2026-06-25"`
- **THEN** OpenSpec CLI 返回该 change 的 artifact 状态
- **AND** 不出现 `Change name must start with a letter` 错误

#### Scenario: config.yaml 声明日期在后规则
- **WHEN** 读取 `openspec/config.yaml`
- **THEN** proposal 阶段规则声明 `change 命名：格式 <动词>-<目标>-YYYY-MM-DD`
- **AND** 同一条规则保留动词白名单 `add/refactor/fix/improve/remove`

#### Scenario: 历史 archive 目录不迁移
- **WHEN** 本 change apply 完成
- **THEN** `openspec/changes/archive/` 下既有历史目录名称不被批量重命名
- **AND** 历史 PR 或报告中的 archive 路径仍可追踪

#### Scenario: 生成内容不手工分叉
- **WHEN** `.agents/skills/` 或 `.claude/skills/` 中的 OpenSpec 生成内容仍包含 `YYYY-MM-DD-<change-name>` archive 文案
- **THEN** 执行 Agent SHALL 在交付报告中记录该生成内容限制
- **AND** 不得手工修改这些生成文件来伪造规则统一

## Testing Notes

- 配置验证：执行 `npx.cmd openspec status --change "improve-change-naming-rule-2026-06-25"`。
- 列表验证：执行 `npx.cmd openspec list --json` 并确认返回该 change。
- 文本验证：执行 `rg "<动词>-<目标>-YYYY-MM-DD" openspec/config.yaml`。
- 生成内容检查：执行 `rg "YYYY-MM-DD-<change-name>" .agents .claude`，记录结果但不手工修改生成内容。
