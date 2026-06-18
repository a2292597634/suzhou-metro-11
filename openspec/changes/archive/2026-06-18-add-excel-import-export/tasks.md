# Tasks: add-excel-import-export

## 1. 环境准备

- [x] 1.1 安装依赖：`npm install exceljs multer`
- [x] 1.2 创建 `uploads/` 目录，添加到 `.gitignore`
- [x] 1.3 在 `server.js` 中配置 multer 中间件（`uploads/` 磁盘存储，限制 10MB，仅 `.xlsx`）

## 2. 数据库 Schema 变更

- [x] 2.1 修改 `prisma/schema.prisma`：Shop 表新增 `power String? @default("")` 和 `water String? @default("/")`
- [x] 2.2 生成 Prisma 迁移：`npx prisma migrate dev --name add_power_water_to_shop`

## 2.T 数据库 Schema 测试

- [x] 2.T.1 编写 `tests/shop-schema.test.js`：验证 power 字段只有 20KW/30KW 合法（Red）
- [x] 2.T.2 编写 `tests/shop-schema.test.js`：验证 water 字段只有 有/"/" 合法（Red）
- [x] 2.T.3 运行测试确认失败（Red 验证）
- [x] 2.T.4 实现 Zod 校验（server.js shopSchema 新增 power/water）（Green）
- [x] 2.T.5 运行测试确认通过
- [x] 2.T.6 重构优化校验逻辑（Refactor）

## 3. 统一默认数据源

- [x] 3.1 从 `prisma/seed.js` 提取默认数据，创建 `data/default-data.json`（含花桥站完整数据、全局统计、分级标准）
- [x] 3.2 修改 `prisma/seed.js`：改为 `require('../data/default-data.json')` 读取
- [x] 3.3 新增 `server.js` 静态路由：`app.use('/data', express.static(...))`
- [x] 3.4 修改 `js/modules/data.js`：`getDefaultStations()` 改为 `async fetchDefaultData()`，fetch `/data/default-data.json`

## 3.T 统一数据源测试

- [ ] 3.T.1 编写 `tests/module-data.test.js` 新增用例：`fetchDefaultData()` 返回默认数据（Red）
- [ ] 3.T.2 编写 `tests/module-data.test.js` 新增用例：默认数据含花桥站（Red）
- [ ] 3.T.3 运行测试确认失败
- [ ] 3.T.4 实现 `fetchDefaultData()`（Green）
- [ ] 3.T.5 修改 `loadData()` 集成 fetch 降级链路
- [ ] 3.T.6 运行测试确认通过

## 4. 服务端 Excel 导出引擎

- [x] 4.1 创建 `tools/excel-export.js`：实现 `generateTemplate()`（4 Sheet，含下拉验证、样式、冻结行）
- [x] 4.2 实现 `generateExport(stations, globalStats, gradeInfo)`（3 Sheet 全量数据，含花桥站和多经点位）
- [x] 4.3 实现 CLI 模式：`require.main === module` 时调用 Prisma 查询并导出到 `output/`
- [x] 4.4 添加 `package.json` scripts：`excel-export`

## 4.T Excel 导出测试

- [ ] 4.T.1 编写 `tests/excel-export.spec.js`：验证模板生成 4 个 Sheet（Red）
- [ ] 4.T.2 编写测试：验证商铺信息 Sheet 下拉验证包含正确枚举值
- [ ] 4.T.3 编写测试：验证车站下拉列表含花桥站
- [ ] 4.T.4 编写测试：验证导出数据包含多经点位
- [ ] 4.T.5 运行测试确认失败
- [ ] 4.T.6 实现使测试通过（Green）
- [ ] 4.T.7 运行测试确认通过，重构（Refactor）

## 5. 服务端 Excel 导入引擎

- [x] 5.1 创建 `tools/excel-import.js`：实现 Excel 解析（exceljs 读取商铺信息 Sheet）
- [x] 5.2 实现字段校验（必填、枚举值、类型检查），收集所有错误
- [x] 5.3 实现状态值自动映射（已租→营业中、空→未出租、装修→装修中）
- [x] 5.4 实现按「车站名 + 简洁编号」匹配，更新或新增商铺
- [x] 5.5 实现 Prisma 事务包裹导入，失败全部回滚
- [x] 5.6 实现导入后 GlobalStats 自动重算
- [x] 5.7 实现导入报告生成（`{ summary: { created, updated, skipped, errors }, errors: [...] }`）
- [x] 5.8 实现 CLI 模式：`require.main === module` 时读取命令行参数文件路径
- [x] 5.9 添加 `package.json` scripts：`excel-import`

## 5.T Excel 导入测试

- [x] 5.T.1 编写 `tests/excel-import.spec.js`：验证必填字段缺失时返回错误（Red）
- [x] 5.T.2 编写测试：验证状态值「已租」映射为「营业中」
- [x] 5.T.3 编写测试：验证新房源（新简短编号）正确新增
- [x] 5.T.4 编写测试：验证已有房源不在 Excel 中时不删除
- [x] 5.T.5 编写测试：验证导入后 GlobalStats 重算正确
- [x] 5.T.6 编写测试：验证事务失败全部回滚
- [x] 5.T.7 运行测试确认全部失败
- [x] 5.T.8 实现使测试通过（Green）
- [x] 5.T.9 运行测试确认通过，重构（Refactor）

## 6. API 端点

- [x] 6.1 新增 `GET /api/template-excel`：调用 `tools/excel-export.js` 的 `generateTemplate()` 返回 xlsx
- [x] 6.2 新增 `GET /api/export-excel`：查询 DB 后调用 `generateExport()` 返回 xlsx
- [x] 6.3 新增 `POST /api/import-excel`：multer 接收文件 → 调用 `tools/excel-import.js` 导入 → 清理临时文件 → 返回报告
- [x] 6.4 `POST /api/import-excel` 配置认证中间件（`authenticateToken`）和限流中间件（`rateLimiter`）

## 6.T API 端点测试

- [x] 6.T.1 编写 `tests/integration/excel-api.spec.js`：测试 GET /api/template-excel 返回 xlsx Content-Type（Red）
- [x] 6.T.2 编写测试：GET /api/export-excel 返回含数据的 xlsx
- [x] 6.T.3 编写测试：POST /api/import-excel 无认证返回 401
- [x] 6.T.4 编写测试：POST /api/import-excel 上传有效文件返回 200 含导入报告
- [x] 6.T.5 编写测试：POST /api/import-excel 上传非 xlsx 返回 400
- [x] 6.T.6 运行测试确认失败
- [x] 6.T.7 实现 API 端点（Green）
- [x] 6.T.8 运行测试确认通过，重构（Refactor）

## 7. 一次性数据初始化

- [x] 7.1 创建 `tools/init-from-excel.js`：读取运营方 Excel，解析 60 条商铺数据
- [x] 7.2 实现 power/water 数据写入匹配商铺
- [x] 7.3 实现新增 S11-42（夏驾河公园站，面积 29.95㎡）
- [x] 7.4 实现更新 17 个车站等级（一类→A/二类→B/三类→C）
- [x] 7.5 运行脚本完成数据初始化

## 8. 前端改造

- [x] 8.1 修改 `js/modules/data.js`：`exportExcel()` 改为 fetch GET /api/export-excel 触下载
- [x] 8.2 修改 `js/modules/data.js`：`importExcel()` 改为 FormData + fetch POST /api/import-excel，解析导入报告
- [x] 8.3 新增 `js/modules/data.js`：`downloadTemplate()` fetch GET /api/template-excel 触发下载
- [x] 8.4 修改 `js/modules/main.js`：`window.app.exportExcel` 改为异步下载
- [x] 8.5 修改 `js/modules/main.js`：`window.app.importExcel` 改为 FormData 上传 + 展示导入报告 toast
- [x] 8.6 新增 `js/modules/main.js`：`window.app.downloadTemplate`
- [x] 8.7 修改 `battle-map.html`：新增「📋 下载模板」按钮

## 8.T 前端测试

- [x] 8.T.1 更新 `tests/module-data.spec.js`：测试 `exportExcel()` 触发 GET /api/export-excel 下载（Red）
- [x] 8.T.2 编写测试：`importExcel()` 调用 POST /api/import-excel 并解析报告
- [x] 8.T.3 编写测试：`downloadTemplate()` 触发 GET /api/template-excel
- [x] 8.T.4 运行测试确认失败
- [x] 8.T.5 实现使测试通过（Green）
- [x] 8.T.6 运行测试确认通过，重构（Refactor）

## 9. E2E 测试

- [ ] 9.1 编写 `tests/e2e/excel-import-flow.spec.js`：下载模板 → 填入测试数据 → 上传导入 → 验证 DB → 导出验证完整闭环（Red）
- [ ] 9.2 运行 E2E 测试确认失败
- [ ] 9.3 修复使 E2E 通过（Green）
- [ ] 9.4 运行完整测试套件确认全部通过

## 10. 最终验证

- [ ] 10.1 运行 `npm test` 确认所有测试通过
- [ ] 10.2 运行 `node scripts/check-test-coverage.js` 确认覆盖率
- [ ] 10.3 运行 `npm run seed` 验证种子脚本从 JSON 读取正常
- [ ] 10.4 启动服务器手动验证：下载模板 → 导出 → 导入完整流程

---

> **依赖关系**: 任务组 2-3 可并行；任务组 4-5-6 依赖 2；任务组 7 依赖 5；任务组 8 依赖 6；任务组 9 依赖全部。

---

## 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

### 阶段一：Propose（规划阶段）

- [ ] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [ ] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [ ] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

### 阶段二：Apply（实施阶段）

- [ ] **TDD 顺序已遵守**：每个功能点执行了 Red → Green → Refactor
- [ ] **单元测试已编写**：每个新增/修改的模块都有对应的 `tests/<模块名>.test.js`
- [ ] **集成测试已编写**（如涉及多模块联动）：有 `tests/integration/<场景>.test.js`
- [ ] **E2E 测试已编写**（如涉及页面/核心流程）：有 `tests/e2e/<场景>.test.js`
- [ ] **测试命名规范**：测试文件命名符合 `tests/<模块名>.test.js` 或 `tests/<层级>/<场景>.test.js`
- [ ] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言（如「应该从无文件名路径解析首页」）

### 阶段三：验证阶段

- [ ] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [ ] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`，输出「所有模块均已覆盖」
- [ ] **无测试作弊**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [ ] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [ ] **测试文件已提交**：所有测试文件已纳入 git 版本控制
- [ ] **CI 脚本已更新**（如有）：package.json 的 test 脚本能正确运行新增测试
- [ ] **文档已更新**：如测试策略或基础设施有变化，已同步更新 `openspec/testing-strategy.md`

---

## 豁免规则

以下情况可以豁免部分或全部测试，但必须在 change 中明确标注并说明理由：

| 豁免场景 | 可豁免的测试 | 必须做的 | 标注位置 |
|---------|------------|---------|---------|
| 纯 CSS 样式调整（颜色、间距、圆角） | 全部 | 手动视觉验证 | tasks.md 顶部 |
| 纯文案/标点修改 | 全部 | 手动阅读确认 | tasks.md 顶部 |
| 配置文件修改（不涉及逻辑） | 全部 | 配置生效验证 | tasks.md 顶部 |
| 已有模块的微小重构（无行为变更） | E2E | 单元测试需全部通过 | tasks.md 对应任务旁 |

> **注意**：豁免不等于跳过验证。即使豁免测试，也必须通过其他方式确认变更正确。
