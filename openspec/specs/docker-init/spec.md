## Requirements

### Requirement: Docker 容器首次启动时必须自动填充默认数据
Docker 容器启动时，在数据库迁移完成后 MUST 执行数据 seed，将默认站点、全局统计和分级信息导入数据库。若数据库中已存在数据，seed MUST 不报错、不覆盖现有数据。

#### Scenario: Docker 首次启动
- **WHEN** 全新容器启动，数据库为空
- **THEN** 迁移完成后自动执行 seed
- **AND** 数据库包含 28 个默认站点

#### Scenario: Docker 重启
- **WHEN** 容器重启，数据库已有数据
- **THEN** seed 执行不报错
- **AND** 现有数据不被删除或覆盖

### Requirement: seed 脚本 MUST 幂等
`prisma/seed.js` MUST 在执行导入前检查 `prisma.station.count()`。若 `count > 0` 且未传 `--force` 参数，MUST 打印提示并跳过所有写入。`--force` 参数 MUST 在覆盖前清空所有现有数据。

#### Scenario: 首次运行 seed
- **WHEN** 数据库为空时运行 seed
- **THEN** 成功导入所有默认数据

#### Scenario: 重复运行 seed
- **WHEN** 数据库已有数据时再次运行 seed
- **THEN** 命令成功退出，数据保持不变

#### Scenario: --force 覆盖已有数据
- **WHEN** 运行 `node prisma/seed.js --force`
- **THEN** 先清空所有表，再重新导入默认数据

### Requirement: Docker Compose MUST 包含认证和会话环境变量
`docker-compose.yml` 的 `app` 服务 MUST 在 `environment` 中配置 `AUTH_TOKEN`、`ALLOWED_ORIGINS` 和 `SESSION_SECRET`。`AUTH_TOKEN` 和 `SESSION_SECRET` MUST 使用 `:?` 语法强制用户配置，防止使用默认值启动。

#### Scenario: 未设置 AUTH_TOKEN 时 docker compose up 报错
- **WHEN** 宿主环境未设置 `AUTH_TOKEN`
- **AND** 运行 `docker compose up`
- **THEN** Docker 返回错误提示需设置 AUTH_TOKEN

### Requirement: 前端 MUST 在服务器返回空数据时 fallback 到默认数据
`js/modules/data.js` 的 `loadData()` 在服务器返回 `stations: []` 时，MUST 使用 `getDefaultStations()` 作为 fallback。

#### Scenario: 服务器返回空 stations 数组
- **WHEN** API 返回 `{ data: { stations: [], globalStats: null, gradeInfo: {} } }`
- **THEN** `state.stations` 被设置为默认站点数据

## Testing Notes

- **单元测试** (`tests/data.test.js`)：mock fetch 返回空 stations 数组，验证 fallback
- **手动验证**：Docker build & run、seed 幂等、环境变量强制
