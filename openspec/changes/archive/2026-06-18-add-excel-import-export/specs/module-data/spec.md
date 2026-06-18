# module-data Specification (Delta)

## MODIFIED Requirements

### Requirement: 数据模块支持 Excel 导入导出
数据模块 SHALL 通过服务端 API 实现 Excel 导入导出。导出 SHALL 调用 `GET /api/export-excel` 下载服务端生成的文件。导入 SHALL 通过 FormData 上传文件到 `POST /api/import-excel`。新增 `downloadTemplate()` 函数 SHALL 调用 `GET /api/template-excel` 下载空白模板。

前端不再使用 SheetJS 生成或解析 Excel 文件。导入完成后 SHALL 展示服务端返回的行级导入报告（成功/失败汇总和错误详情）。

#### Scenario: 导出 Excel
- **WHEN** 调用 `exportExcel()` 时
- **THEN** 向 `GET /api/export-excel` 发起请求，触发浏览器下载 xlsx 文件

#### Scenario: 导入 Excel
- **WHEN** 用户选择 Excel 文件后
- **THEN** 通过 FormData 将文件 POST 到 `/api/import-excel`，服务端返回导入报告后展示 toast

#### Scenario: 下载模板
- **WHEN** 调用 `downloadTemplate()` 时
- **THEN** 向 `GET /api/template-excel` 发起请求，触发浏览器下载空白模板

#### Scenario: 导入报告展示
- **WHEN** 导入返回 `{ success: true, summary: { created: 1, updated: 50, errors: 2 } }`
- **THEN** 前端 toast 显示「导入完成：新增 1 条，更新 50 条，2 条错误」

### Requirement: 数据模块使用统一默认数据源
数据模块 SHALL 从 `data/default-data.json` 加载默认数据，替代硬编码的 `getDefaultStations()` 和 `getDefaultGlobalStats()` 函数。加载方式 SHALL 为 `fetch('/data/default-data.json')`。

默认数据 SHALL 包含花桥站数据。

#### Scenario: 从 JSON 加载默认数据
- **WHEN** API 和 localStorage 均不可用时
- **THEN** 模块 fetch `/data/default-data.json` 获取默认站点和统计信息

## Testing Notes

- **单元测试** (`tests/module-data.spec.js`)：更新现有测试，覆盖 `exportExcel()` API 调用、`importExcel()` FormData 上传、`downloadTemplate()` 下载、`fetchDefaultData()` 降级加载、导入报告解析
- Mock `fetch` 用于单元测试
