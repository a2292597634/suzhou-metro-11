# excel-import-export Specification

## ADDED Requirements

### Requirement: 服务端生成 Excel 模板
系统 SHALL 通过 `GET /api/template-excel` 提供空白 Excel 模板下载。模板 SHALL 包含 4 个 Sheet：商铺信息、站点信息、分级标准、填写说明。

商铺信息 Sheet SHALL 包含 10 列（车站、简洁编号、铺号、类型、面积㎡、电量、上下水、状态、商户、备注），状态列 SHALL 含下拉验证（营业中、未出租、装修中），类型列 SHALL 含下拉验证（商铺、多经点位），上下水列 SHALL 含下拉验证（有、/），电量列 SHALL 含下拉验证（20KW、30KW），车站列 SHALL 含下拉验证列出全部 28 个站名（含花桥站）。

站点信息 Sheet SHALL 包含 3 列（站点ID、站点名称、等级），站点ID 和站点名称列 SHALL 锁定不可编辑，等级列 SHALL 含下拉验证（S、A、B、C）。

分级标准 Sheet SHALL 包含 4 列（等级ID、等级名称、说明、颜色），含 S/A/B/C 四级数据。

#### Scenario: 下载模板成功
- **WHEN** 客户端发送 GET 请求到 `/api/template-excel`
- **THEN** 返回 Content-Type 为 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` 的 xlsx 文件
- **AND** 文件包含 4 个 Sheet
- **AND** 商铺信息 Sheet 的表头行含加粗样式和背景色

#### Scenario: 模板车站列表含花桥站
- **WHEN** 下载模板并查看商铺信息 Sheet 的车站下拉列表
- **THEN** 列表中包含「花桥站」选项

### Requirement: 服务端导出全量 Excel 数据
系统 SHALL 通过 `GET /api/export-excel` 导出数据库中全部数据为 xlsx 文件，文件 SHALL 包含 3 个 Sheet（商铺信息、站点信息、分级标准）。

商铺信息 Sheet SHALL 包含所有站点的所有商铺（含花桥站和多经点位），每行一个商铺，按站点顺序排列。

导出文件 SHALL 包含格式化表头（加粗、背景色）和合适的列宽。

#### Scenario: 导出含花桥站数据
- **WHEN** 客户端发送 GET 请求到 `/api/export-excel`
- **THEN** 返回的 xlsx 商铺信息 Sheet 中包含花桥站的 7 个商铺

#### Scenario: 导出含多经点位
- **WHEN** 客户端发送 GET 请求到 `/api/export-excel`
- **THEN** 返回的 xlsx 中包含类型为「多经点位」的商铺行

### Requirement: 服务端导入 Excel 并写入数据库
系统 SHALL 通过 `POST /api/import-excel` 接收 xlsx 文件上传，解析商铺信息 Sheet，按「车站名 + 简洁编号」匹配已有商铺，匹配成功则更新，未匹配则新增。导入 SHALL 在 Prisma 事务中执行，失败时全部回滚。

导入 SHALL 需要认证（Bearer Token 或签名 Cookie）和限流（复用现有限流中间件）。

#### Scenario: 导入成功更新已有商铺
- **WHEN** 上传包含 S11-18（江浦站）的 Excel，商户列改为「新商户」
- **THEN** 数据库中 S11-18 的 tenant 更新为「新商户」，power 和 water 同步更新

#### Scenario: 导入新增商铺
- **WHEN** 上传包含数据库中不存在的简洁编号 S11-42（夏驾河公园站）的 Excel
- **THEN** 数据库在夏驾河公园站下新增一条商铺记录

#### Scenario: 导入不删除已有商铺
- **WHEN** 上传的 Excel 不包含多经点位 S11-18-1
- **THEN** 数据库中 S11-18-1 保持不变

#### Scenario: 导入返回行级报告
- **WHEN** 上传包含错误行的 Excel（如某行状态填写了非法值）
- **THEN** 返回 JSON 包含 `summary: { created, updated, skipped, errors }` 和 `errors: [{ row, field, value, message }]` 数组

#### Scenario: 导入需要认证
- **WHEN** 未携带有效 Cookie 或 Bearer Token 发送 POST 到 `/api/import-excel`
- **THEN** 返回 HTTP 401

#### Scenario: 导入文件格式不支持
- **WHEN** 上传非 xlsx 文件（如 CSV）
- **THEN** 返回 HTTP 400，错误信息包含「文件格式不支持」

### Requirement: 状态值自动映射
导入时系统 SHALL 将运营方 Excel 中的非标准状态值自动映射为标准枚举值：「已租」和「已开业」MUST 映射为「营业中」；空值和「未租」MUST 映射为「未出租」；「装修」MUST 映射为「装修中」。无法识别的值 MUST 报告为校验错误。

#### Scenario: 已租映射为营业中
- **WHEN** Excel 中状态列值为「已租」
- **THEN** 导入后数据库 status 字段值为「营业中」

#### Scenario: 空值映射为未出租
- **WHEN** Excel 中状态列值为空
- **THEN** 导入后数据库 status 字段值为「未出租」

### Requirement: 导入后自动重算 GlobalStats
导入事务成功提交后系统 SHALL 自动重新计算 GlobalStats：totalShops 为商铺总数、rentedShops 为 status='营业中' 的商铺数、vacantShops 为 totalShops - rentedShops、rentRate 保留一位小数百分比。GlobalStats SHALL 通过 upsert 写入（id=1）。

#### Scenario: 导入后 GlobalStats 更新
- **WHEN** 导入新增 1 个营业中商铺
- **THEN** GlobalStats.totalShops 增加 1，rentedShops 增加 1，rentRate 重新计算

### Requirement: CLI 命令行导入导出
`tools/excel-export.js` SHALL 支持通过 `node tools/excel-export.js` 直接运行，无需启动服务器，导出全量数据到 `output/` 目录。

`tools/excel-import.js` SHALL 支持通过 `node tools/excel-import.js <文件路径>` 直接运行，从命令行导入 Excel 文件到数据库。

#### Scenario: CLI 导出
- **WHEN** 在项目根目录执行 `node tools/excel-export.js`
- **THEN** 在 `output/` 目录生成 xlsx 文件

#### Scenario: CLI 导入
- **WHEN** 执行 `node tools/excel-import.js data.xlsx`
- **THEN** 解析 data.xlsx 并写入数据库，控制台输出导入报告

### Requirement: 统一默认数据源
项目 SHALL 使用 `data/default-data.json` 作为唯一默认数据源。`prisma/seed.js` SHALL 从此文件读取数据初始化数据库。前端 `data.js` SHALL 通过 `fetch('/data/default-data.json')` 加载默认数据作为降级方案。JSON 文件 SHALL 包含花桥站的完整数据。

#### Scenario: seed 从 JSON 读取
- **WHEN** 执行 `npm run seed`
- **THEN** `prisma/seed.js` 从 `data/default-data.json` 加载数据并写入数据库

#### Scenario: 前端从 JSON 降级加载
- **WHEN** API 和 localStorage 均不可用时
- **THEN** 前端 fetch `/data/default-data.json` 获取默认数据初始化

## Testing Notes

- **单元测试** (`tests/excel-export.spec.js`)：模板生成、导出数据转换、花桥站包含、CLI 模式
- **单元测试** (`tests/excel-import.spec.js`)：Excel 解析、字段校验、状态映射、匹配逻辑、GlobalStats 重算
- **集成测试** (`tests/integration/excel-api.spec.js`)：3 个 API 端点的 HTTP 请求/响应、认证、文件上传
- **E2E 测试** (`tests/e2e/excel-import-flow.spec.js`)：完整导入导出闭环
- Mock Prisma 客户端用于单元测试
