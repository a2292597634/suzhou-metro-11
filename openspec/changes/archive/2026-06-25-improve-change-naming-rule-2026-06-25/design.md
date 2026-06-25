## Context

项目原规则要求 change 名称格式为 `YYYY-MM-DD-<动词>-<目标>`。这个格式与历史 archive 目录一致，但当前 OpenSpec CLI 对 active change 名称要求以字母开头，导致日期在前的 active change 无法通过 `openspec new` 或 `openspec status --change`。

本 change 只调整未来 active change 的命名规范，不重写历史 archive 目录，也不修改 OpenSpec 包生成的技能文件。生成文件中的 archive 说明如果仍使用日期在前，应由团队固定版本 OpenSpec 或后续专门 change 处理。

## Directory Layout

```text
openspec/
  config.yaml
  changes/
    improve-change-naming-rule-2026-06-25/
      proposal.md
      design.md
      tasks.md
      specs/
        openspec-change-lifecycle/
          spec.md
```

## Goals / Non-Goals

**Goals:**

- 让项目 active change 命名规则与 OpenSpec CLI 的字母开头限制一致。
- 统一新 active change 使用 `<动词>-<目标>-YYYY-MM-DD`。
- 保留日期信息，便于排序和追踪。
- 明确历史 archive 目录和 OpenSpec 生成技能文件不在本 change 手工重写。
- 为依赖新命名格式的商铺照片 change 提供先决条件。

**Non-Goals:**

- 不批量重命名 `openspec/changes/archive/` 下的历史归档目录。
- 不手工修改 `.agents/skills/` 或 `.claude/skills/` 中由 OpenSpec 生成的内容。
- 不升级 `@fission-ai/openspec` 版本。
- 不修改 Git 交付、PR、archive 权限规则。
- 不改变动词白名单：仍限定 `add/refactor/fix/improve/remove`。

## Decisions

### 1. 日期统一放在 active change 名称最后

格式为 `<动词>-<目标>-YYYY-MM-DD`，例如 `add-shop-site-photos-2026-06-25`。

原因：该格式以动词开头，满足 CLI 校验，同时保留日期作为追踪信息。

替代方案：去掉日期。该方案能通过 CLI，但会降低跨分支追踪和历史排序能力。

### 2. 历史 archive 目录不批量改名

历史 archive 目录是审计路径，已经出现在旧 PR、commit、报告或团队上下文中。本 change 只改变未来 active change 规则。

原因：批量改名会产生大量无业务价值的路径 churn，并可能破坏历史引用。

### 3. 生成技能文件不手工分叉

`.agents/skills/` 和 `.claude/skills/` 属于 OpenSpec 生成内容，根规则要求不得手工分叉。因此本 change 不直接编辑这些文件。执行时只检查它们是否仍含旧 archive 文案，并在交付报告中说明。

原因：手工改生成物会造成下次 `npm run setup` 或 OpenSpec 生成时被覆盖，形成双重权威。

## Risks / Trade-offs

- [Risk] `.agents/.claude` 生成内容仍提示 archive 使用日期在前。Mitigation: 不手工改生成物，在交付报告中记录为工具生成限制；如必须统一，后续通过固定 OpenSpec 版本或生成源处理。
- [Risk] 当前未合并的日期在后 change 依赖本 change。Mitigation: 在依赖 change proposal 中声明 `improve-change-naming-rule-2026-06-25` 必须先合并。
- [Risk] 历史 archive 目录仍是日期在前，看起来与新 active change 规则不一致。Mitigation: 明确 archive 历史路径不迁移，新规则只约束 active change。

## Migration Plan

1. 更新 `openspec/config.yaml` 的 proposal 命名规则为 `<动词>-<目标>-YYYY-MM-DD`。
2. 验证 `npx.cmd openspec status --change "improve-change-naming-rule-2026-06-25"` 正常返回。
3. 验证 `npx.cmd openspec list --json` 能列出日期在后的 active change。
4. 检查 `.agents/.claude` 生成内容中的旧 archive 文案，记录但不手工修改。
5. 命名规范 change 合并后，商铺照片 change 从最新 `main` 继续 apply。

Rollback：将 `openspec/config.yaml` 的命名规则恢复为旧格式；删除或归档本 change artifacts。若已有日期在后的 active change，则需要先确认是否改回旧格式或保留为例外。

## 测试架构设计

- 本 change 为纯配置/规范文档变更，不新增或修改运行时代码，因此不新增单元、集成或 E2E 测试文件。
- 验证命令：`npx.cmd openspec status --change "improve-change-naming-rule-2026-06-25"`。
- 验证命令：`npx.cmd openspec list --json`。
- 文本检查：`rg "YYYY-MM-DD-<动词>|<动词>-<目标>-YYYY-MM-DD" openspec/config.yaml`。
- 生成内容检查：`rg "YYYY-MM-DD-<change-name>" .agents .claude`，只记录结果，不手工修改生成文件。

## Open Questions

- OpenSpec 固定版本是否支持配置 archive 目标目录的命名格式？本 change 默认不能配置，先不手工改生成物。
- 后续是否需要单独 change 更新 OpenSpec 生成源或升级 OpenSpec 版本，让 archive 技能文案也改为日期在后？本 change 默认只记录风险。