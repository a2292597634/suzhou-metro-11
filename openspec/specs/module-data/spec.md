# module-data Specification

## Purpose
The data module centralizes station state, global statistics, default data loading, import and export workflows, persistence, fallback behavior, and data source notifications.
## Requirements
### Requirement: 数据模块管理所有站点和统计状态
数据模块 SHALL 作为所有应用状态的唯一数据源，包括站点数据、全局统计和商业价值分级信息。

#### Scenario: 使用默认数据初始化
- **WHEN** 应用启动且没有已保存的数据时
- **THEN** 模块加载默认站点数据（28个站点，73个商铺）和默认全局统计

#### Scenario: 从 localStorage 加载
- **WHEN** localStorage 中已保存数据存在配置的键下
- **THEN** 模块从 localStorage 加载站点、全局统计和分级信息

#### Scenario: 从后端 API 加载
- **WHEN** 后端 API 在 GET /api/data 返回有效数据时
- **THEN** 模块从 API 加载数据，失败时回退到 localStorage

#### Scenario: 自动计算全局统计
- **WHEN** 站点商铺数据发生变化时
- **THEN** 模块重新计算总商铺数、已出租数、空置数（多经点位不计入）

### Requirement: 数据模块支持 Excel 导入导出
数据模块 SHALL 优先通过服务端 API 实现 Excel 导入导出，API 不可达时 SHALL 自动降级到前端 SheetJS。

导出 SHALL 使用 fetch blob 下载（5s 超时），失败时降级 SheetJS 生成。模板 SHALL 同理。导入 SHALL 使用 FormData fetch API（10s 超时）。降级导入 SHALL 保存到 localStorage 并返回 `{ source: 'local' }`，调用方 MUST 跳过 `loadData()`。

#### Scenario: 导出 Excel（API 可达）
- **WHEN** `exportExcel()` 且 API 可达
- **THEN** blob 下载服务端生成的文件

#### Scenario: 导出 Excel（API 不可达时降级）
- **WHEN** `exportExcel()` 且 API 不可达
- **THEN** SheetJS 前端生成 xlsx 并触发下载

#### Scenario: 降级导入保存 localStorage
- **WHEN** fetch POST `/api/import-excel` 网络异常
- **THEN** SheetJS 解析 xlsx → 更新 state → 写入 localStorage → 返回 `{ source: 'local' }`

#### Scenario: 导入 Excel
- **WHEN** 用户选择 Excel 文件后
- **THEN** 通过 FormData 将文件 POST 到 `/api/import-excel`，服务端返回导入报告后展示 toast

#### Scenario: 下载模板
- **WHEN** 调用 `downloadTemplate()` 时
- **THEN** 向 `GET /api/template-excel` 发起请求，触发浏览器下载空白模板

### Requirement: 数据模块使用统一默认数据源
数据模块 SHALL 从 `data/default-data.json` 加载默认数据，替代硬编码的 `getDefaultStations()` 和 `getDefaultGlobalStats()` 函数。默认数据 SHALL 包含花桥站数据。

#### Scenario: 从 JSON 加载默认数据
- **WHEN** API 和 localStorage 均不可用时
- **THEN** 模块 fetch `/data/default-data.json` 获取默认站点和统计信息

### Requirement: 默认车站等级使用统一数据源
数据模块 SHALL 保证默认站点数据中的每个 `station.grade` 与 `data/default-data.json` 中同一 `station.id` 的 `grade` 一致。若存在内联兜底数据，内联兜底数据 MUST NOT 包含与 JSON 默认数据不同的等级值。

#### Scenario: 内联兜底等级与 JSON 一致
- **WHEN** 测试读取 `data/default-data.json` 并调用 `getDefaultStations()`
- **THEN** 两份数据中相同 `station.id` 的 `grade` 字段完全一致

#### Scenario: 默认加载返回最新等级
- **WHEN** API 与 localStorage 均不可用且 `/data/default-data.json` 可访问
- **THEN** `loadData()` 将 `state.stations` 设置为 JSON 文件中的站点数据
- **AND** `state.stations` 中每个站点的 `grade` 与 JSON 文件一致

### Requirement: 数据模块持久化变更
数据模块 SHALL 将数据保存到后端 API 和 localStorage。

#### Scenario: 保存到后端
- **WHEN** 调用 saveData() 且后端可用时
- **THEN** 数据通过 POST 发送到 /api/data，同时备份到 localStorage

#### Scenario: 保存回退到 localStorage
- **WHEN** 调用 saveData() 但后端不可用时
- **THEN** 数据保存到 localStorage 并通知用户

#### Scenario: 数据来源事件通知
- **WHEN** loadData() 或 saveData() 完成时
- **THEN** dispatch `datasource:change` 自定义事件，detail.source 为 `'server'` / `'local'` / `'default'`
- **AND** 返回 `{ source }` 对象供调用方使用

### Requirement: 数据模块支持恢复默认值
数据模块 SHALL 提供将所有数据恢复为出厂默认值的功能。

#### Scenario: 重置数据
- **WHEN** 调用 resetData() 且用户确认后
- **THEN** 所有站点、统计和分级信息恢复为默认值，并清空 localStorage

