## ADDED Requirements

### Requirement: 所有 innerHTML 注入的用户数据 MUST 转义
系统 MUST 确保所有通过 `innerHTML` 插入到 DOM 中的用户可控数据（站点名称、商铺名称、租户名、备注等）在插入前经过 HTML 实体转义。转义 MUST 将 `&`、`>`、`<`、`"`、`'` 转换为对应的 HTML 实体，防止恶意脚本执行。

#### Scenario: 商铺名包含脚本标签
- **WHEN** `shop.name` 值为 `'<img src=x onerror=alert(1)>'`
- **AND** 渲染函数将其插入到 innerHTML
- **THEN** 输出中包含 `&lt;img src=x onerror=alert(1)&gt;`
- **AND** 浏览器不执行脚本

#### Scenario: 租户名包含事件处理器
- **WHEN** `shop.tenant` 值为 `'" onclick="alert(1)"'`
- **AND** 渲染函数将其放入 `<input value="...">` 属性
- **THEN** 属性值中的 `"` 被转义为 `&quot;`
- **AND** 不构成有效的 HTML 属性注入

#### Scenario: 站点名包含 HTML 标签
- **WHEN** `station.name` 值为 `'<b>恶意站点</b>'`
- **AND** 渲染函数将其显示在卡片标题中
- **THEN** 输出中包含 `&lt;b&gt;恶意站点&lt;/b&gt;`
- **AND** 页面上以纯文本 `<b>恶意站点</b>` 显示，而非加粗

### Requirement: escapeHtml 函数 MUST 健壮处理边界输入
`escapeHtml()` 函数 MUST 接受任意输入类型（字符串、null、undefined、数字），对非字符串输入先调用 `String()` 转换。空字符串 MUST 返回空字符串。

#### Scenario: 输入为 null
- **WHEN** 传入 `null`
- **THEN** 返回空字符串

#### Scenario: 输入为数字
- **WHEN** 传入 `123`
- **THEN** 返回 `'123'`

#### Scenario: 输入为 undefined
- **WHEN** 传入 `undefined`
- **THEN** 返回空字符串

#### Scenario: 正常字符串含特殊字符
- **WHEN** 传入 `'A & B < C > D "E" F'`
- **THEN** 返回 `'A &amp; B &lt; C &gt; D &quot;E&quot; F'`

### Requirement: 分级信息描述中的用户数据 MUST 转义
`renderGradePanel` 中 `info.name` 和 `info.desc` MUST 在插入 innerHTML 前经过 `escapeHtml()` 转义，防止分级描述被注入恶意脚本。

#### Scenario: 分级描述包含脚本
- **WHEN** `info.desc` 值为 `'<script>alert(1)</script>'`
- **AND** 渲染分级面板
- **THEN** 输出中包含 `&lt;script&gt;alert(1)&lt;/script&gt;`

## Testing Notes

- **单元测试** (`tests/utils.test.js`)：`escapeHtml()` 的边界输入（null、undefined、数字、含特殊字符的字符串）
- **单元测试** (`tests/home.test.js`)：验证含 XSS payload 的商铺数据渲染后输出字符串中不包含未转义的 `<`
- **单元测试** (`tests/viz.test.js`)：验证 `renderCard` 对含恶意脚本的 station.name/shop.name 的转义
- **单元测试** (`tests/interaction.test.js`)：验证 `renderShopTable` 对商铺字段的转义
- **单元测试** (`tests/render.test.js`)：验证 `renderGradePanel` 对分级信息的转义
