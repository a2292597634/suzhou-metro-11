## ADDED Requirements

### Requirement: 测试 MUST 使用独立数据库
系统 MUST 提供独立的测试数据库 `suzhou_metro_test`，与生产数据库 `suzhou_metro` 物理隔离。测试配置文件 `.env.test` MUST 包含指向测试数据库的 `DATABASE_URL`。`vitest.config.js` MUST 加载 `.env.test` 环境变量。

#### Scenario: vitest 使用测试数据库
- **WHEN** 运行 `npm test`
- **THEN** `DATABASE_URL` 指向 `suzhou_metro_test`（而非 `suzhou_metro`）
- **AND** 生产数据库中的数据不受测试影响

#### Scenario: 开发环境不受测试配置影响
- **WHEN** 在非测试环境下 `node server.js`
- **THEN** 使用 `.env` 中的生产 `DATABASE_URL`

### Requirement: 测试前自动部署迁移到测试数据库
`tests/globalSetup.js` MUST 在测试套件启动前运行 `npx prisma migrate deploy` 到测试数据库。若测试数据库不可达，MUST 输出警告并设置 `TEST_DB_AVAILABLE=0` 环境变量，不阻断测试流程。

#### Scenario: 测试数据库可用时部署迁移
- **WHEN** 测试数据库可达
- **THEN** `prisma migrate deploy` 成功执行
- **AND** `TEST_DB_AVAILABLE` 设为 `1`

#### Scenario: 测试数据库不可用时优雅降级
- **WHEN** 测试数据库不可达
- **THEN** 输出警告信息
- **AND** `TEST_DB_AVAILABLE` 设为 `0`
- **AND** 测试流程继续进行（不需要 DB 的测试正常通过）

### Requirement: 测试前自动清理测试数据
`tests/setupFile.js` MUST 在每个测试文件执行前清理测试数据库（按外键顺序：shops → stations → globalStats → gradeInfo）。仅在 `TEST_DB_AVAILABLE=1` 时执行。

#### Scenario: 测试间数据隔离
- **WHEN** 测试文件 A 向测试库写入数据
- **AND** 测试文件 A 执行完毕
- **WHEN** 测试文件 B 开始执行
- **THEN** 测试数据库中不包含测试文件 A 写入的数据

### Requirement: CI 创建独立测试数据库
`.github/workflows/test.yml` MUST 在测试步骤前通过 `psql` 创建 `suzhou_metro_test` 数据库（如不存在），并在所有后续步骤中使用测试数据库的 `DATABASE_URL`。MUST NOT 触碰 `suzhou_metro` 数据库。

#### Scenario: CI 流程全链路使用测试库
- **WHEN** CI workflow 执行
- **THEN** 数据库迁移步骤使用 `suzhou_metro_test`
- **AND** seed 步骤使用 `suzhou_metro_test`
- **AND** 服务启动和测试步骤均使用 `suzhou_metro_test`

### Requirement: 测试代码 MUST NOT 硬编码数据库连接
所有测试文件 MUST NOT 包含硬编码的 `process.env.DATABASE_URL = ...`。数据库连接 MUST 由 `vitest.config.js` 通过 `.env.test` 统一管理。

#### Scenario: 测试文件无硬编码连接
- **WHEN** 搜索 `tests/` 目录下所有 `.test.js` 文件
- **THEN** 不存在 `process.env.DATABASE_URL = 'postgresql://...'` 模式

## Testing Notes

- 本 capability 本身就是测试基础设施，其正确性通过以下方式验证：
  - 运行 `npm test` 确认测试库被创建和使用
  - 运行 `npm test` 后手动检查生产数据库数据未被修改
  - CI 流程中所有步骤成功通过
