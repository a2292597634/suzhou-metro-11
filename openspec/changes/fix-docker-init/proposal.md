## Why

当前 `Dockerfile` 只执行 `prisma migrate deploy`，没有运行 `prisma db seed`。首次部署时数据库为空，`data.js` 中 `result.data.stations || getDefaultStations()` 的逻辑将空数组 `[]` 视为有效数据，不会 fallback 到默认数据，导致页面显示空白。同时 `prisma/seed.js` 使用 `create()` 而非幂等操作，重复运行会报主键冲突错误。

## What Changes

- **BREAKING** `js/modules/data.js`: `loadData()` 中服务器返回空 stations 数组时，fallback 到默认数据
- `Dockerfile`: CMD 中 `migrate deploy` 后追加 `prisma db seed`
- `prisma/seed.js`: 将 `create()` 改为 `upsert()`，支持幂等执行
- `package.json`: 添加 `prisma.seed` 配置项

## Capabilities

### New Capabilities
- `docker-init`: Docker 部署时自动初始化数据

### Modified Capabilities
- `module-data`: `loadData()` 的空数据 fallback 行为变更

## Impact

| 文件/目录 | 变更内容 |
|----------|---------|
| `Dockerfile` | CMD 追加 `prisma db seed` |
| `prisma/seed.js` | `create()` → `upsert()`，支持重复执行 |
| `package.json` | 新增 `prisma.seed` 字段 |
| `js/modules/data.js` | 空数组触发 fallback 到默认数据 |
| `tests/data.test.js` | 新增空数组 fallback 测试 |

## 测试策略

依据 `openspec/testing-strategy.md` 变更类型映射表：

| 变更类型 | 映射结果 |
|---------|---------|
| 修改模块（`data.js` 加载逻辑） | 单元 ✅ 必做 |
| 修改配置（Dockerfile、package.json） | — 配置生效验证 |
| 脚本修改（seed.js） | 单元 ✅ 必做 |

- **单元测试**：`tests/data.test.js` — 验证空数组触发 fallback
- **手动验证**：Docker build + run，确认首次启动有数据

## 成功标准

- [ ] Docker 首次部署后数据库包含默认站点数据
- [ ] `prisma db seed` 重复执行不报错（幂等）
- [ ] `loadData()` 遇到空 stations 数组时 fallback 到默认数据
- [ ] `npm test` 零失败
