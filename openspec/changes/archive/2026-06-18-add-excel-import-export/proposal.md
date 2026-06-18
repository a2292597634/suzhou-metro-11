## Why

商业信息（商铺出租状态、商户、等级分类等）经常变更，但运营人员不一定都能在网页页面上进行增删改查操作。当前系统仅支持前端浏览器端导出/导入单个商铺 Sheet，缺少服务端 API、多表模板和数据校验。需要将数据表梳理统一，并通过 Excel 表格实现完整的数据导入导出，让非技术用户也能通过 Web 或命令行完成数据同步。

## What Changes

- **数据库 Schema 变更**：Shop 表新增 `power`（电量）和 `water`（上下水）两个字段；Prisma 迁移生成
- **站点等级更新**：按运营方提供的最新 Excel 分类（一类→A、二类→B、三类→C）更新 17 个车站的商业等级，花桥站保留 S 级
- **新增服务端 Excel 引擎**：引入 `exceljs` 依赖，创建 `tools/excel-export.js`（模板生成 + 全量导出，支持 CLI 调用）和 `tools/excel-import.js`（解析 + 校验 + 写入，支持 CLI 调用）
- **新增 API 端点**：`GET /api/template-excel`（下载空白模板）、`GET /api/export-excel`（导出全量数据，含花桥站）、`POST /api/import-excel`（上传 Excel 导入，需认证+限流，导入后自动重算 GlobalStats）
- **Excel 多 Sheet 模板**：商铺信息（10列，含下拉验证，车站列表含花桥站）+ 站点信息（仅等级可编辑）+ 分级标准 + 填写说明
- **前端改造**：导出改为下载服务端文件，导入改为 FormData 上传（展示导入报告），新增模板下载按钮
- **统一数据源**：将 `prisma/seed.js` 和 `js/modules/data.js` 中的默认数据提取到 `data/default-data.json`
- **一次性数据初始化**：运行脚本从运营方 Excel 导入电量/上下水数据、商户/状态更新、新增 S11-42、更新 17 站等级
- **npm scripts**：新增 `excel-export`、`excel-import` 命令支持命令行操作
- **文件上传**：引入 `multer` 处理 multipart/form-data，`uploads/` 目录存放临时文件

## Capabilities

### New Capabilities
- `excel-import-export`: 服务端 Excel 导入导出功能，包含多 Sheet 模板生成（含下拉验证和样式）、全量数据导出（含花桥站）、Excel 文件解析校验和数据库写入、导入后 GlobalStats 自动重算、CLI 和 API 双通道

### Modified Capabilities
- `module-data`: 前端导入导出逻辑从 SheetJS 浏览器端改为调用服务端 API（下载/上传），新增模板下载功能，默认数据改为 fetch JSON
- `data-sync-and-validation`: Shop Schema 新增 power、water 字段的 Zod 校验

## 测试策略

依据 `openspec/testing-strategy.md` 变更类型映射表：

| 变更类型 | 映射结果 |
|---------|---------|
| 新增 API 端点（3 个 Excel 端点） | 集成测试 ✅ 必做 |
| 新增服务端模块（excel-export.js, excel-import.js） | 单元测试 ✅ 必做 |
| 修改前端模块（data.js 导入导出逻辑） | 单元测试 ✅ 必做 |
| 数据库 Schema 变更（Shop 表新字段） | 单元测试 ✅ 必做 |
| 涉及核心业务流程（导入→校验→写入→导出） | E2E ✅ 必做 |

- **单元测试**：`tests/excel-export.spec.js`、`tests/excel-import.spec.js`、`tests/module-data.spec.js`（更新）
- **集成测试**：`tests/integration/excel-api.spec.js`
- **E2E 测试**：`tests/e2e/excel-import-flow.spec.js`

## 成功标准

- [ ] `GET /api/template-excel` 返回含 4 个 Sheet 的 xlsx 文件，商铺信息 Sheet 含下拉验证，车站列表含花桥站
- [ ] `GET /api/export-excel` 返回含全部数据（含花桥站）的 xlsx 文件，数据与数据库一致
- [ ] `POST /api/import-excel` 上传 Excel 后正确写入数据库，返回行级导入报告，导入后 GlobalStats 自动重算
- [ ] 导入时校验各字段（必填、枚举值、数据类型），错误行跳过并报告原因
- [ ] 运营方 Excel 一次性导入完成：电量/上下水数据写入、S11-42 入库、17 站等级更新
- [ ] Prisma 迁移文件正确生成，`npm run seed` 从 `data/default-data.json` 初始化
- [ ] `npm run excel-export` 命令行导出正常工作
- [ ] 前端"下载模板""导出Excel""导入Excel"按钮功能正常，导入展示行级报告
- [ ] `npm test` 零失败
- [ ] `node scripts/check-test-coverage.js` 通过

## Impact

| 文件/目录 | 变更内容 |
|----------|---------|
| `prisma/schema.prisma` | Shop 表新增 `power`、`water` 字段 |
| `prisma/migrations/` | **生成** 新迁移文件 |
| `prisma/seed.js` | 改为读取 `data/default-data.json` |
| `data/default-data.json` | **新建**，统一默认数据源（含花桥站） |
| `server.js` | 新增 3 个 Excel API 端点 + `/data` 静态路由 + multer 文件上传配置 |
| `tools/excel-export.js` | **新建**，Excel 模板生成和全量导出引擎（支持 CLI） |
| `tools/excel-import.js` | **新建**，Excel 解析校验导入引擎（支持 CLI） |
| `tools/init-from-excel.js` | **新建**，一次性从运营方 Excel 初始化数据 |
| `js/modules/data.js` | 重构导入导出为 API 调用，新增 `downloadTemplate()`，fetch 默认数据 |
| `js/modules/main.js` | 更新导入导出回调（含导入报告展示），新增模板下载入口 |
| `battle-map.html` | 新增"下载模板"按钮 |
| `package.json` | 新增 `exceljs`、`multer` 依赖，新增 `excel-export`、`excel-import` scripts |
| `uploads/` | **新建**，multer 临时文件目录（`.gitignore`） |
| `tests/` | 新增单元/集成/E2E 测试 |
