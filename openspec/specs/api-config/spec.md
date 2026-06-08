## ADDED Requirements

### Requirement: API 地址从 HTML 属性安全读取
`state.apiBase` MUST 从 `<html>` 元素的 `data-api-base` 属性读取。读取时 MUST 使用 `typeof document !== 'undefined'` 守卫防止 Node.js 环境报错。若属性不存在或无法读取则默认为空字符串。

#### Scenario: 显式配置 API 地址
- **WHEN** HTML 为 `<html data-api-base="http://192.168.1.100:3000">`
- **THEN** `state.apiBase` 值为 `"http://192.168.1.100:3000"`
- **AND** `loadData()` 使用 `"http://192.168.1.100:3000/api/data"` 作为请求地址

#### Scenario: 未配置时使用相对路径
- **WHEN** `<html>` 无 `data-api-base` 属性
- **THEN** `state.apiBase` 值为 `""`
- **AND** `loadData()` 使用 `"/api/data"` 相对路径

#### Scenario: 空字符串属性等同于未配置
- **WHEN** HTML 为 `<html data-api-base="">`
- **THEN** `state.apiBase` 值为 `""`

#### Scenario: Node.js 环境安全回退
- **WHEN** `typeof document === 'undefined'`（如纯 Node.js 测试环境）
- **THEN** `state.apiBase` 值为 `""`，不抛出 ReferenceError

## Testing Notes

- **单元测试** (`tests/state.test.js`)：在 jsdom 中设置 `document.documentElement.dataset.apiBase`，验证 state 初始化正确
