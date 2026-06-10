## Context

当前 `POST /api/data` 逐一遍历 `data.stations` 执行 `upsert`，但不会删除数据库中已有而请求中不存在的站点。shop 数据采用 `deleteMany + create` 模式（每次全量替换），但 station 和 gradeInfo 层级不走删除逻辑。前后端没有版本号机制，两名用户同时编辑时后保存者覆盖前者。

## Goals / Non-Goals

**Goals:**
1. 保存时完整同步：请求中不存在的 station ID 和 gradeInfo key 从数据库删除
2. Zod 校验：检查 station.id 格式、grade 枚举值、坐标范围、商铺字段类型
3. 乐观锁：Station 表新增 `version` 字段，保存时校验版本号
4. localStorage 错误不再静默吞掉

**Non-Goals:**
- 不引入差分同步（只做全量替换）
- 不在 Shop 级别做版本号（Shop 随 Station 一起替换）

## Decisions

### Decision 1: 完整同步 — 先收集 ID 再批量删除

**选择**: 保存时收集请求中所有 station.id 和 gradeInfo key，事务内 `deleteMany` 不在集合中的记录。

**理由**:
- 一次事务完成，原子性好
- 避免遗留孤儿数据
- Prisma `deleteMany` 支持 `NOT IN` 条件

### Decision 2: Zod Validator — 服务端中间件化

**选择**: 定义 Zod schema 验证 `req.body.data`，不合法数据返回 400。

**理由**:
- Zod 已安装，无需新依赖
- 比手动 if-else 更可维护
- 校验失败返回明确的错误信息（哪个字段、期望什么类型）

### Decision 3: 乐观锁 — Station 表 version 自增

**选择**: Station 表新增 `version` Int 字段（默认 1），保存时比较请求中的 version 和数据库中的 version。

**理由**:
- Postgres 操作级别，无需额外组件
- 前端保存后更新本地 version，下次保存携带
- 冲突时返回 409，前端提示用户刷新

### Decision 4: localStorage 错误 — 向上抛出异常

**选择**: `saveToLocal()` 中 catch 后重新 throw，`saveData()` 返回 `{ success: false, error: message }`。

**理由**:
- 调用方可以据此展示错误提示
- 不改变现有降级逻辑（API 失败 → 回退 localStorage）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 完整同步误删未加载的站点 | 前端始终加载全量数据，不会有遗漏 |
| Zod schema 过严导致合法数据被拒 | 校验规则尽量宽松（字符串长度 1-100，坐标 0-3000） |
| version 字段引入向后兼容问题 | 默认值 1，旧数据迁移后 version 均为 1 |
| 版本冲突后用户体验 | 前端收到 409 时提示"数据已被他人修改，请刷新后再试" |

## Open Questions

1. **是否需要给 GlobalStats 也加版本号？** GlobalStats 是单一记录，不涉及批量操作。建议跳过。
2. **前端 409 处理是否需要专门的 UI 提示？** 当前只返回 JSON error 消息，暂不实现专门的冲突提示 UI。

## 测试架构设计

### 测试分层策略

| 层级 | 覆盖范围 | 工具 | 文件位置 |
|------|---------|------|---------|
| 单元测试 | data.js saveToLocal/saveData | Vitest + jsdom | `tests/data.test.js` |
| 集成测试 | server.js Zod/同步/版本锁 | Vitest + supertest + 测试 DB | `tests/data-sync.test.js` |

### 需要 Mock 的外部依赖

- **Prisma**: 集成测试需要连接测试数据库
- **localStorage**: data.js 测试中 mock
