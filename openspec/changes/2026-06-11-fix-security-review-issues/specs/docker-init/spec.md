## MODIFIED Requirements

### Requirement: Docker Compose MUST 包含认证和会话环境变量
`docker-compose.yml` 的 `app` 服务 MUST 在 `environment` 中配置 `AUTH_TOKEN`、`ALLOWED_ORIGINS` 和 `SESSION_SECRET`。每个变量 MUST 有默认 fallback 值（通过 `${VAR:-default}` 语法）。

#### Scenario: 环境变量有合理默认值
- **WHEN** 用户未设置宿主环境变量直接 `docker compose up`
- **THEN** 容器内 `AUTH_TOKEN`、`ALLOWED_ORIGINS`、`SESSION_SECRET` 均不是空字符串
- **AND** 服务正常启动

#### Scenario: 用户可覆盖环境变量
- **WHEN** 用户设置 `AUTH_TOKEN=my-custom-token docker compose up`
- **THEN** 容器内 `AUTH_TOKEN` 为 `my-custom-token`

### Requirement: Seed MUST 在数据库已有数据时跳过
`prisma/seed.js` MUST 在执行导入前检查 `prisma.station.count()`。若 `count > 0` 且未传 `--force` 参数，MUST 打印提示并跳过所有写入操作。`--force` 参数 MUST 在覆盖前清空所有现有数据。

#### Scenario: 数据库有数据时跳过
- **WHEN** 数据库已有 28 个站点，运行 `node prisma/seed.js`
- **THEN** 输出 "数据库已有 28 个站点，跳过种子导入"
- **AND** 数据库站点数保持 28，数据未被覆盖

#### Scenario: --force 覆盖已有数据
- **WHEN** 数据库已有数据，运行 `node prisma/seed.js --force`
- **THEN** 先清空 shops、stations、globalStats、gradeInfo 表
- **AND** 重新导入默认数据

#### Scenario: 数据库为空正常导入
- **WHEN** 数据库为空，运行 `node prisma/seed.js`
- **THEN** 正常导入所有默认数据

## Testing Notes

- **手动验证**：`docker compose up` 后检查环境变量生效
- **手动验证**：启动两次容器，第二次不应覆盖首次的数据
