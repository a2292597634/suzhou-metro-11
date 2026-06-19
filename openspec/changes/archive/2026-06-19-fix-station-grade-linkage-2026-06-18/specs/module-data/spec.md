## ADDED Requirements

### Requirement: 默认车站等级使用统一数据源
数据模块 SHALL 保证默认站点数据中的每个 `station.grade` 与 `data/default-data.json` 中同一 `station.id` 的 `grade` 一致。若存在内联兜底数据，内联兜底数据 MUST NOT 包含与 JSON 默认数据不同的等级值。

#### Scenario: 内联兜底等级与 JSON 一致
- **WHEN** 测试读取 `data/default-data.json` 并调用 `getDefaultStations()`
- **THEN** 两份数据中相同 `station.id` 的 `grade` 字段完全一致

#### Scenario: 默认加载返回最新等级
- **WHEN** API 与 localStorage 均不可用且 `/data/default-data.json` 可访问
- **THEN** `loadData()` 将 `state.stations` 设置为 JSON 文件中的站点数据
- **AND** `state.stations` 中每个站点的 `grade` 与 JSON 文件一致

## Testing Notes

- 单元测试：`tests/data.test.js` 覆盖 `getDefaultStations()` 与 JSON 默认数据的等级一致性。
- 集成测试：复用现有 `loadData()` fallback 测试，mock `fetch` 返回 `/data/default-data.json`。
- Mock：`fetch`、`localStorage`。
