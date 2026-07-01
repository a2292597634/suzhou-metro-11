## MODIFIED Requirements

### Requirement: 数据模块管理所有站点和统计状态
数据模块 SHALL 作为所有应用状态的唯一数据源，包括站点数据、全局统计、商业价值分级信息和静态快照版本信息。

#### Scenario: 使用默认数据初始化
- **WHEN** 应用启动且没有已保存的数据时
- **THEN** 模块加载默认站点数据（28个站点，73个商铺）和默认全局统计
- **AND** 若 `data/default-data.json` 包含 `snapshotId`，模块记录当前快照版本

#### Scenario: 从 localStorage 加载
- **WHEN** localStorage 中已保存数据存在配置的键下
- **AND** 静态 manifest 不存在或 `snapshotId` 与 localStorage 一致
- **THEN** 模块从 localStorage 加载站点、全局统计和分级信息

#### Scenario: 从后端 API 加载
- **WHEN** 后端 API 在 GET /api/data 返回有效数据时
- **THEN** 模块从 API 加载数据，失败时回退到静态 manifest/localStorage/default-data 逻辑

#### Scenario: 自动计算全局统计
- **WHEN** 站点商铺数据发生变化时
- **THEN** 模块重新计算总商铺数、已出租数、空置数（多经点位不计入）

### Requirement: 数据模块使用统一默认数据源
数据模块 SHALL 从 `data/default-data.json` 加载默认数据，替代硬编码的 `getDefaultStations()` 和 `getDefaultGlobalStats()` 函数。默认数据 SHALL 包含花桥站数据。默认数据 MAY 包含顶层 `snapshotId`，且商铺 MAY 包含 `shopUid`、`photo` 和 `photoHash`。

#### Scenario: 从 JSON 加载默认数据
- **WHEN** API 和 localStorage 均不可用时
- **THEN** 模块 fetch `/data/default-data.json` 获取默认站点和统计信息

#### Scenario: 默认数据保留照片字段
- **WHEN** `/data/default-data.json` 中商铺包含 `shopUid`、`photo` 和 `photoHash`
- **THEN** `loadData()` 加载后 `state.stations` 中对应商铺保留这些字段

## ADDED Requirements

### Requirement: 静态 manifest 版本判断
当后端 API 不可达时，数据模块 SHALL 尝试读取 `/data/static-manifest.json`。若 manifest 存在且其 `snapshotId` 与 localStorage 中保存的 `snapshotId` 不同，模块 SHALL 优先加载 `/data/default-data.json` 的新快照，并将旧 localStorage 数据备份到同源 localStorage 键 `suzhou_m11_battle_map_data_v4_backup_<oldSnapshotId>`。

#### Scenario: 新静态快照覆盖旧本地快照
- **WHEN** API 不可达
- **AND** localStorage 中保存 `snapshotId = "old"`
- **AND** `/data/static-manifest.json` 返回 `snapshotId = "new"`
- **THEN** `loadData()` 加载 `/data/default-data.json`
- **AND** 旧 localStorage 数据被备份
- **AND** `datasource:change` 事件的 `detail.source` 为 `"static-snapshot"`

#### Scenario: manifest 相同使用 localStorage
- **WHEN** API 不可达
- **AND** localStorage 中保存 `snapshotId = "same"`
- **AND** `/data/static-manifest.json` 返回 `snapshotId = "same"`
- **THEN** `loadData()` 从 localStorage 加载数据

### Requirement: 静态快照本地覆盖提示
当数据模块因新 `snapshotId` 加载静态快照而未使用旧 localStorage 时，`loadData()` SHALL 返回 `{ source: "static-snapshot", snapshotUpdated: true, previousSnapshotId, snapshotId }`，供页面显示中文提示。

#### Scenario: 返回快照更新信息
- **WHEN** 新静态快照替代旧 localStorage 数据
- **THEN** `loadData()` 返回 `snapshotUpdated: true`
- **AND** 返回旧快照和新快照 ID

### Requirement: 保存 localStorage 带快照版本
`saveToLocal()` SHALL 在保存数据时写入当前 `snapshotId`。当数据来源为服务器 API 时，`snapshotId` MAY 为空字符串；当数据来源为静态快照时，`snapshotId` SHALL 等于当前 manifest 的 `snapshotId`。

#### Scenario: 静态快照保存版本
- **WHEN** 当前数据来自 `snapshotId = "new"`
- **AND** 用户触发降级保存到 localStorage
- **THEN** localStorage 中保存的数据包含 `snapshotId = "new"`

## Testing Notes

- 单元测试：`tests/data.test.js` 覆盖 manifest 不存在、manifest 相同、manifest 更新、备份旧 localStorage 和返回 `snapshotUpdated`。
- 集成测试：`tests/integration/viz-data.test.js` 覆盖页面收到 `static-snapshot` 来源后仍渲染照片路径。
- E2E 测试：静态模式下预置旧 localStorage，再更新 manifest，验证页面显示新快照照片。
