## Context

苏州地铁11号线商业作战图目前通过浏览器端 SheetJS (`js/xlsx.full.min.js`) 实现单 Sheet 商铺信息导出和导入。运营方提供了一份含 60 条商铺记录的最新 Excel 表格（`副本11号线地铁商铺开业情况2026.6.4.xlsx`），包含三个关键变化：1) 新的站点三级分类体系（一类/二类/三类，对应 A/B/C 级）；2) 两个新字段（电量、上下水）需要纳入数据库；3) 多条商铺状态和商户信息变更。

当前数据存在三处重复：`prisma/seed.js`（服务端种子）、`js/modules/data.js`（前端默认值）、PostgreSQL 数据库。导入导出仅限浏览器操作，无模板，无校验反馈。

## Goals / Non-Goals

**Goals:**
- 建立服务端 Excel 生成和解析能力，支持 API + CLI 双通道导入导出
- 提供多 Sheet Excel 模板（含下拉验证和格式说明），降低运营人员使用门槛
- 统一默认数据源为 `data/default-data.json`
- 将运营方 Excel 中的电量、上下水数据导入数据库，更新站点等级
- 花桥站数据完整保留并在模板和导出中包含
- 导入时有详细的行级校验和错误报告，导入后自动重算 GlobalStats

**Non-Goals:**
- 不实现在线协作编辑
- 不替换现有的 JSON API（`GET/POST /api/data`）
- 不移除前端 SheetJS 库（保留 `xlsx.full.min.js` 以备其他用途）
- 不在模板中包含联系方式、开业时间（DB 保留字段但不在 Excel 中暴露）

## Directory Layout

```
openspec/changes/add-excel-import-export/
├── proposal.md                     # 提案
├── design.md                       # 本文件
├── specs/
│   └── excel-import-export/
│       └── spec.md                 # Excel 导入导出功能规范
├── tasks.md                        # 实施任务

项目变更文件:
data/
├── default-data.json               # [NEW] 统一默认数据源（含花桥站数据）
tools/
├── excel-export.js                  # [NEW] Excel 模板生成和全量导出引擎（支持 CLI）
├── excel-import.js                  # [NEW] Excel 解析校验导入引擎（支持 CLI）
├── init-from-excel.js               # [NEW] 一次性从运营方 Excel 初始化数据
uploads/                             # [NEW] multer 临时文件目录（.gitignore）
server.js                           # [MOD] 新增 3 个 Excel API 端点 + /data 静态路由 + multer 配置
prisma/
├── schema.prisma                   # [MOD] Shop 表新增 power, water 字段
├── seed.js                         # [MOD] 读取 data/default-data.json
├── migrations/                     # [GEN] 新迁移文件
js/modules/
├── data.js                         # [MOD] 重构导入导出为 API 调用，fetchDefaultData()
├── main.js                         # [MOD] 更新导入导出回调，新增模板下载
battle-map.html                     # [MOD] 新增"下载模板"按钮
package.json                        # [MOD] 新增 exceljs, multer 依赖 + excel-export/import scripts
```

## Decisions

### 1. 服务端 ExcelJS vs 复用浏览器端 SheetJS

**选择：引入 `exceljs` 用于服务端，前端 SheetJS 改为 API 调用**

- ExcelJS 支持单元格样式（颜色、字体、边框）、数据验证（下拉列表）、列宽/行高设置、多 Sheet 复杂模板
- SheetJS 社区版（`xlsx.full.min.js`）在 Node.js 端功能受限（不支持 `writeFile`），且无样式能力
- 前端不再直接操作 Excel 生成/解析，改为通过 API 上传/下载

### 2. 文件上传方案

**选择：引入 `multer` 处理 multipart/form-data 文件上传**

- Express 5 内置了 `express.urlencoded()` 但不含文件上传解析
- multer 轻量（零依赖）、成熟稳定、API 简洁
- 配置：磁盘存储到 `uploads/`，文件大小限制 10MB，仅接受 `.xlsx` 类型
- 导入完成后删除临时文件；`uploads/` 加入 `.gitignore`

### 3. Excel 模板 Sheet 设计

**选择：4 Sheet 结构（所有 Sheet 均包含花桥站数据）**

**Sheet 1「商铺信息」**（10 列）：

| 列 | 列名 | 宽度 | 约束 | 默认值 |
|---|------|------|------|-------|
| A | 车站 | 16 | 下拉（28 站名，含花桥站） | — |
| B | 简洁编号 | 12 | 文本，必填 | — |
| C | 铺号 | 28 | 文本，必填 | — |
| D | 类型 | 10 | 下拉（商铺/多经点位） | 商铺 |
| E | 面积(㎡) | 10 | 数字，>0 | — |
| F | 电量 | 8 | 下拉（20KW/30KW） | — |
| G | 上下水 | 8 | 下拉（有//） | / |
| H | 状态 | 10 | 下拉（营业中/未出租/装修中） | 未出租 |
| I | 商户 | 20 | 文本 | — |
| J | 备注 | 24 | 文本 | — |

冻结首行，表头加粗加背景色。

**Sheet 2「站点信息」**（3 列）：

| 列 | 列名 | 宽度 | 约束 |
|---|------|------|------|
| A | 站点ID | 20 | 🔒 只读 |
| B | 站点名称 | 18 | 🔒 只读 |
| C | 等级 | 6 | 下拉（S/A/B/C）可编辑 |

**Sheet 3「分级标准」**（4 列）：

| 列 | 列名 | 宽度 | 约束 |
|---|------|------|------|
| A | 等级ID | 6 | 🔒 只读 |
| B | 等级名称 | 28 | 可编辑 |
| C | 说明 | 30 | 可编辑 |
| D | 颜色 | 10 | 可编辑 |

**Sheet 4「填写说明」**：纯文本，包含各 Sheet 填写规则、下拉选项含义、注意事项。

### 4. 导入匹配与处理策略

**匹配键：「车站名 + 商铺简洁编号」**

```
匹配成功 → ✏️ 更新该商铺的所有字段（含 power/water）
Excel 有但 DB 无 → 🆕 新增商铺（自动分配 no 序号）
DB 有但 Excel 无 → 🛡️ 保留不删除（保护多经点位等）
```

**状态值自动映射**（容错）：
| Excel 值 | 映射为 |
|----------|--------|
| "已租"、"已开业" | 营业中 |
| ""（空）、"未租" | 未出租 |
| "装修" | 装修中 |

**导入不创建/删除站点**（站点由迁移管理），不存在的站名报错跳过。

### 5. 数据源统一

**选择：新建 `data/default-data.json` 作为唯一默认数据源**

```json
{
  "stations": [...],       // 含花桥站 7 个商铺
  "globalStats": {...},
  "gradeInfo": {...}       // S/A/B/C 四级，花桥站为 S
}
```

数据流：
- `prisma/seed.js` → `require('../data/default-data.json')` 读取写入 DB
- `js/modules/data.js` → `fetch('/data/default-data.json')` 作为降级层
- 加载优先级：服务器 API → localStorage → fetch JSON → 内联兜底

### 6. CLI 支持

**选择：`tools/excel-export.js` 和 `tools/excel-import.js` 同时支持 CLI 和 API 调用**

```bash
# CLI 导出
npm run excel-export              # 导出到 output/ 目录
node tools/excel-export.js

# CLI 导入
npm run excel-import -- file.xlsx # 从命令行导入
node tools/excel-import.js file.xlsx
```

模块导出函数供 API 调用，`require.main === module` 时走 CLI 模式。

### 7. 一次性数据初始化

**选择：创建 `tools/init-from-excel.js` 脚本**

读取运营方 Excel `副本11号线地铁商铺开业情况2026.6.4.xlsx`，执行：
1. 更新所有匹配商铺的 power/water 字段
2. 新增 S11-42（夏驾河公园站，面积 29.95㎡，商户「牙博士」）
3. 更新 17 个车站等级（按一类→A/二类→B/三类→C）
4. 花桥站数据保持不变

此脚本仅运行一次，运行后 DB 数据即为最新。

### 8. GlobalStats 自动重算

导入完成后自动执行：
```js
const shops = await prisma.shop.findMany();
const totalShops = shops.length;
const rentedShops = shops.filter(s => s.status === '营业中').length;
const vacantShops = totalShops - rentedShops;
const rentRate = totalShops > 0 ? (rentedShops / totalShops * 100).toFixed(1) + '%' : '0%';
await prisma.globalStats.upsert({ ... });
```

## 测试架构设计

依据 `openspec/testing-strategy.md` 三层金字塔：

| 层 | 文件 | 覆盖内容 |
|---|------|---------|
| 单元 | `tests/excel-export.spec.js` | 模板生成函数、导出数据转换、花桥站包含验证 |
| 单元 | `tests/excel-import.spec.js` | 解析函数、校验规则、匹配逻辑、状态映射、GlobalStats 重算 |
| 单元 | `tests/module-data.spec.js` | （更新）导入导出 API 调用、downloadTemplate、fetchDefaultData |
| 集成 | `tests/integration/excel-api.spec.js` | 3 个 API 端点的完整请求/响应、认证校验 |
| E2E | `tests/e2e/excel-import-flow.spec.js` | 上传模板→导入→验证 DB→导出→对比完整流程 |

**Mock 策略**：
- 单元测试：mock Prisma 客户端（不连真实 DB）
- 集成测试：使用测试数据库（`.env.test` 中的 `DATABASE_URL`）
- E2E 测试：启动完整服务器，使用 puppeteer 操作前端

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 运营方 Excel 格式未来可能变化 | 导入解析失败 | Sheet 表头检查 + 列名容错匹配而非位置硬编码 |
| 大文件导入（未来>1000条） | 可能导致请求超时 | multer 文件大小 10MB，事务超时 30s |
| ExcelJS 与 SheetJS 导出格式差异 | 用户可能注意到格式变化 | 导出含格式化的表头和列宽，优于无格式导出 |
| 导入过程事务中途失败 | 数据一致性 | Prisma 事务确保原子性，失败全部回滚 |
| 花桥站数据与运营方 Excel 不同步 | 花桥站数据可能过时 | 花桥站在模板中可编辑，导出时包含，支持手动维护 |

## Open Questions

1. **导入时对状态字段的容错度？** 运营方 Excel 中使用「已租」表示营业中，设计已采用自动映射方案（已租→营业中），未来如新增其他非标准值需要扩展映射表。
2. **模板是否需要包含示例数据行？** 空白模板加示例有助于理解格式，但可能被误导入。建议模板不含数据行，在「填写说明」Sheet 中以截图/文字展示格式示例。
