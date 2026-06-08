# module-data Specification

## 用途
站点数据与全局统计的集中管理模块规范。
## Requirements
### Requirement: 数据模块管理所有站点和统计状态
数据模块是所有应用状态的唯一数据源，包括站点数据、全局统计和商业价值分级信息。

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
数据模块须提供导出站点商铺数据到 Excel 和从 Excel 导入的功能。

#### Scenario: 导出 Excel
- **WHEN** 调用 exportExcel() 时
- **THEN** 生成 .xlsx 文件，列包含：序号、车站、商铺简洁序号、铺号、商铺属性、面积、商户、联系方式、开业时间、状态、备注

#### Scenario: 从 Excel 导入
- **WHEN** 导入一个 Excel 文件时
- **THEN** 按站点名称匹配商铺数据并合并到现有站点中

### Requirement: 数据模块持久化变更
数据模块须将数据保存到后端 API 和 localStorage。

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
数据模块须提供将所有数据恢复为出厂默认值的功能。

#### Scenario: 重置数据
- **WHEN** 调用 resetData() 且用户确认后
- **THEN** 所有站点、统计和分级信息恢复为默认值，并清空 localStorage

