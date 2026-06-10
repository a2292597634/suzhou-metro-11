## ADDED Requirements

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
`prisma/seed.js` MUST 使用 `upsert()` 操作，支持重复执行。无论数据库是否已有数据，重复运行 seed MUST 成功且结果一致。

#### Scenario: 首次运行 seed
- **WHEN** 数据库为空时运行 seed
- **THEN** 成功导入所有默认数据

#### Scenario: 重复运行 seed
- **WHEN** 数据库已有数据时再次运行 seed
- **THEN** 命令成功退出，数据保持不变

### Requirement: 前端 MUST 在服务器返回空数据时 fallback 到默认数据
`js/modules/data.js` 的 `loadData()` 在服务器返回 `stations: []` 时，MUST 使用 `getDefaultStations()` 作为 fallback，确保页面不会显示空白。

#### Scenario: 服务器返回空 stations 数组
- **WHEN** API 返回 `{ data: { stations: [], globalStats: null, gradeInfo: {} } }`
- **THEN** `state.stations` 被设置为默认站点数据
- **AND** `state.globalStats` 被设置为默认全局统计

#### Scenario: 服务器返回非空数据
- **WHEN** API 返回包含有效站点的数据
- **THEN** 使用服务器返回的数据，不触发 fallback

## Testing Notes

- **单元测试** (`tests/data.test.js`)：mock fetch 返回空 stations 数组，验证 fallback 到默认数据
- **手动验证**：Docker build & run，检查页面是否正常显示默认数据
