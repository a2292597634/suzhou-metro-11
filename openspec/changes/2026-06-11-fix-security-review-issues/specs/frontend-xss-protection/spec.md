## MODIFIED Requirements

### Requirement: SVG 渲染中站点名称和换乘线路 MUST 转义
`js/modules/render.js` 的 `renderSVG()` 函数在构建 SVG innerHTML 时，MUST 对所有用户可控的文本内容使用 `escapeHtml()` 转义：
- 站点名称（`s.name.replace('站', '')`）
- 换乘线路名称（`s.transferLine`）

#### Scenario: 站点名称包含 HTML 标签时在 SVG 中转义
- **WHEN** `station.name` 值为 `'<img src=x onerror=alert(1)>站'`
- **AND** `renderSVG()` 渲染该站点
- **THEN** SVG `<text>` 元素内容为 `&lt;img src=x onerror=alert(1)&gt;`
- **AND** 不执行脚本

#### Scenario: 换乘线路名称包含特殊字符时转义
- **WHEN** `station.transferLine` 值为 `'<script>alert(1)</script>'`
- **AND** `renderSVG()` 渲染该站点的换乘标签
- **THEN** SVG `<text>` 元素内容为 `&lt;script&gt;alert(1)&lt;/script&gt;`

### Requirement: 分级面板渲染 MUST 对 key 做白名单校验
`js/modules/render.js` 的 `renderGradePanel()` 在构建 `grade-${key.toLowerCase()}` 类名时，MUST 先校验 `key` 在白名单 `['S', 'A', 'B', 'C']` 中。不在白名单中的 key MUST 回退到 `'C'`。同时 `key` 值在 innerHTML 中也 MUST 使用 `escapeHtml()` 转义。

#### Scenario: 合法等级 key 正常渲染
- **WHEN** `state.gradeInfo` 的 key 为 `'S'`
- **THEN** CSS 类名为 `grade-item grade-s`
- **AND** badge 文本为 `S`

#### Scenario: 非法等级 key 回退到 C
- **WHEN** `state.gradeInfo` 包含 key `'<script>'`（注入攻击）
- **THEN** CSS 类名为 `grade-item grade-c`
- **AND** badge 文本经过转义，不包含可执行的 `<script>` 标签

### Requirement: viz.js 卡片 HTML 属性 MUST 使用 escapeHtml
`js/modules/viz.js` 的 `renderCard()` 在构建卡片 HTML 时，`data-id`、`data-grade` 等属性值 MUST 使用 `escapeHtml()` 转义。

#### Scenario: 站点 ID 包含引号时属性安全
- **WHEN** `station.id` 值为 `'a" onclick="alert(1)"'`
- **AND** `renderCard()` 渲染该站点
- **THEN** `data-id` 属性值中的 `"` 被转义为 `&quot;`
- **AND** 不构成有效的属性注入

## Testing Notes

- **单元测试** (`tests/render.test.js`)：验证 `renderSVG()` 对含特殊字符的名称/换乘线的转义输出，验证 `renderGradePanel()` 对非法 key 的回退
- **单元测试** (`tests/viz.test.js`)：验证 `renderCard()` 的属性值转义
