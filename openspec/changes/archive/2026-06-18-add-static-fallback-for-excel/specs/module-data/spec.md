# module-data Specification (Delta)

## MODIFIED Requirements

### Requirement: 数据模块支持 Excel 导入导出
数据模块 SHALL 优先通过服务端 API 实现 Excel 导入导出，API 不可达时 SHALL 自动降级到前端 SheetJS。

导出 SHALL 使用 fetch blob 下载（5s 超时），失败时降级 SheetJS 生成。模板 SHALL 使用 fetch blob 下载，失败时降级 SheetJS 生成单 Sheet 空模板。

导入 SHALL 使用 FormData fetch API（10s 超时）。API 返回时 SHALL 标记 `source: 'server'`。网络异常降级时 SHALL 使用 SheetJS 解析 xlsx，更新 state 后 MUST 保存到 localStorage，并返回 `{ success: true, source: 'local' }`。

#### Scenario: API 可达时服务端导出（blob 下载）
- **WHEN** fetch `/api/export-excel` 5s 内返回 200
- **THEN** 创建 blob URL 并触发浏览器下载

#### Scenario: API 不可达时降级前端导出
- **WHEN** fetch `/api/export-excel` 超时或网络异常
- **THEN** 使用 SheetJS 生成 xlsx 并触发下载

#### Scenario: 降级导入保存 localStorage
- **WHEN** fetch POST `/api/import-excel` 网络异常
- **THEN** 使用 SheetJS 解析 xlsx → 更新 state → 调用 saveToLocal() → 返回 `{ success: true, source: 'local' }`

#### Scenario: 降级导入后不触发 loadData 覆盖
- **WHEN** 调用方收到 `result.source === 'local'`
- **THEN** 调用方跳过 `loadData()`，直接 `calcGlobalStats()` + `renderAll()`

## Testing Notes

- **单元测试** (`tests/data.test.js`)：mock fetch 网络异常，验证降级路径和 localStorage 写入
