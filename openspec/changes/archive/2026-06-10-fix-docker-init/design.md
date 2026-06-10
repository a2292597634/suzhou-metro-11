## Context

项目已配置 Docker，但 `Dockerfile` 的 CMD 只运行数据库迁移，没有填充初始数据。`prisma/seed.js` 使用 `prisma.station.create()` 导入硬编码的默认数据，但这不是幂等操作——重复运行会因主键冲突而失败。

前端 `data.js` 的 `loadData()` 使用逻辑或 `||` 做 fallback：`state.stations = result.data.stations || getDefaultStations()`。空数组 `[]` 在 JavaScript 中是 truthy，所以空数据库返回的 `stations: []` 不会触发 fallback，导致页面空白。

## Goals / Non-Goals

**Goals:**
1. Docker 容器首次启动时自动填充默认数据
2. seed 脚本支持幂等执行（重复运行不报错）
3. 前端在服务器返回空数据时正确 fallback 到默认数据

**Non-Goals:**
- 不修改默认数据内容
- 不修改数据库 schema
- 不添加新的 seed 数据源

## Decisions

### Decision 1: 使用 `prisma db seed` 而非 Dockerfile 中直接 `node prisma/seed.js`

**选择**: Dockerfile CMD 中 `npx prisma db seed`。

**理由**:
- 与 Prisma 生态集成，`package.json` 中配置 `prisma.seed` 即可
- `prisma db seed` 会自动处理环境变量和 Prisma Client 生成
- 符合 Prisma 官方推荐做法

**替代方案**: Dockerfile 中直接 `RUN node prisma/seed.js` — 但这不是部署时运行，而是构建时运行，不适合有状态的数据填充。

### Decision 2: seed.js 使用 `upsert` 而非 `deleteAll + create`

**选择**: 对每个站点和全局统计使用 `prisma.station.upsert()` 和 `prisma.globalStats.upsert()`。

**理由**:
- `upsert` 是原子操作，无需事务包裹
- 保留已有数据（如果数据库中已有用户修改的数据，不会被覆盖）
- 代码简洁，无需先查询再判断

**替代方案**: `deleteAll` 后重新 `create` — 会丢失已有数据，不安全。

### Decision 3: data.js 使用 `Array.isArray() && length === 0` 检测空数据

**选择**: `if (!result.data.stations || (Array.isArray(result.data.stations) && result.data.stations.length === 0))`。

**理由**:
- 显式检测空数组，比 `||` 更准确
- 覆盖 `undefined`、`null`、空数组三种情况

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| seed 在每次容器启动时都运行（非首次） | upsert 是幂等的，重复运行无副作用 |
| 已有生产数据被 seed 覆盖 | upsert 只更新匹配的记录，不删除未匹配的记录 |
| 空数组检测误伤有效数据 | 只检测 `length === 0`，非空数组不受影响 |

## Open Questions

1. **GradeInfo 的 seed 是否也需要幂等化？** 当前 seed.js 也创建了 GradeInfo，但 `data.js` 在 `loadData()` 中已经处理了 gradeInfo 的缺失情况。建议一并改为 upsert 以保持统一。
2. **Docker 部署后数据迁移策略**：如果未来默认数据变更，如何安全地更新已部署环境的数据？当前方案不涉及此问题。

## 测试架构设计

### 测试分层策略

| 层级 | 覆盖范围 | 工具 | 文件位置 |
|------|---------|------|---------|
| 单元测试 | `loadData()` 空数组 fallback 逻辑 | Vitest + jsdom + mock fetch | `tests/data.test.js` |
| 集成测试 | seed.js 幂等执行 | Node.js 直接运行 | 手动验证 |

### 需要 Mock 的外部依赖

- **fetch**: `loadData()` 测试需要 mock `global.fetch` 返回空数组
- **Prisma Client**: seed.js 测试需要真实的 Prisma Client（或 mock）
