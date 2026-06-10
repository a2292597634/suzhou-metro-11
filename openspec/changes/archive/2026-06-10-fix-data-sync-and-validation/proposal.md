## Why

`POST /api/data` 接口存在三个数据完整性问题：1) 只新增/更新请求中的站点和分级信息，不删除请求中已不存在的旧数据，导致"删除"操作无法同步；2) 服务端无输入校验，错误数据直接进入数据库导致模糊的 500 错误（Zod 已安装但未使用）；3) 并发编辑时，后保存者静默覆盖前者的修改，无冲突检测。此外 `data.js` 的 `saveData()` 在 localStorage 写入失败时仍返回 `{ success: true }`。

## What Changes

- **server.js**: `POST /api/data` 改为完整同步模式（删除不在请求中的站点/分级）
- **server.js**: 使用 Zod schema 校验请求 body 的类型和范围
- **prisma/schema.prisma**: Station 表新增 `version` 字段用于乐观锁
- **server.js**: `POST /api/data` 添加版本号校验，版本不匹配时返回 409 Conflict
- **js/modules/data.js**: `saveData()` 在 localStorage 失败时返回 `{ success: false }`
- **js/modules/data.js**: `saveData()` 返回值增加 `error` 字段，不再静默吞错误

## Capabilities

### New Capabilities
- `data-sync-and-validation`: 数据保存的完整同步、输入校验、并发控制

### Modified Capabilities
- `module-data`: `saveToLocal()` 异常向上抛出，`saveData()` 返回真实结果

## Impact

| 文件/目录 | 变更内容 |
|----------|---------|
| `server.js` | 完整同步（删旧数据）、Zod 校验、版本号乐观锁 |
| `prisma/schema.prisma` | Station 表新增 `version` Int 字段 |
| `js/modules/data.js` | `saveToLocal()` 异常抛出、`saveData()` 返回值含 error |
| `tests/` | 新增 Zoo 校验测试、同步逻辑测试、版本冲突测试 |

## 测试策略

依据 `openspec/testing-strategy.md` 变更类型映射表：

| 变更类型 | 映射结果 |
|---------|---------|
| 修改模块（`data.js` 保存逻辑） | 单元 ✅ 必做 |
| 新增服务端逻辑（Zod、同步、版本锁） | 单元 ✅ 必做 |
| 涉及数据流（API → state → render） | 集成 视联动 |
| 涉及核心操作流程（保存） | E2E ✅ 必做 |

- **单元测试**：`tests/data-sync.test.js`（同步逻辑、Zod schema、乐观锁）
- **E2E 测试**：并发编辑冲突场景

## 成功标准

- [ ] 保存时不在请求中的站点和分级信息被删除
- [ ] 请求中包含非法字段时返回 400 而非 500
- [ ] 并发编辑版本冲突时返回 409 Conflict
- [ ] localStorage 写入失败时 `saveData()` 返回 `{ success: false }`
- [ ] `npm test` 零失败
