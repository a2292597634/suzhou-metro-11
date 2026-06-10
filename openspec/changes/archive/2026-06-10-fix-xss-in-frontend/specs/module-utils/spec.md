## ADDED Requirements

### Requirement: escapeHtml 函数 MUST 处理所有输入类型
`escapeHtml()` 函数 MUST 接受任意输入类型，对非字符串输入先调用 `String()` 转换，然后转义 HTML 特殊字符。空字符串、null、undefined MUST 返回空字符串。

#### Scenario: 输入为 null
- **WHEN** 传入 `null`
- **THEN** 返回空字符串

#### Scenario: 输入为 undefined
- **WHEN** 传入 `undefined`
- **THEN** 返回空字符串

#### Scenario: 输入为数字
- **WHEN** 传入 `123`
- **THEN** 返回 `'123'`

#### Scenario: 正常字符串含特殊字符
- **WHEN** 传入 `'A & B < C > D "E" F'`
- **THEN** 返回 `'A &amp; B &lt; C &gt; D &quot;E&quot; F'`

## Testing Notes

- **单元测试** (`tests/utils.test.js`)：`escapeHtml()` 的边界输入和特殊字符转义
