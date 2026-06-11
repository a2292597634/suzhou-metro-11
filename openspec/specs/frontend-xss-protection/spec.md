## Requirements

### Requirement: 所有 innerHTML 注入的用户数据 MUST 转义
系统 MUST 确保所有通过 `innerHTML` 插入到 DOM 中的用户可控数据（站点名称、商铺名称、租户名、备注等）在插入前经过 HTML 实体转义。文本内容上下文使用 `escapeHtml()`（转义 `<` `>` `&`），属性值上下文使用 `escapeAttr()`（额外转义 `"` `'`）。

#### Scenario: 商铺名包含脚本标签
- **WHEN** `shop.name` 值为 `'<img src=x onerror=alert(1)>'`
- **AND** 渲染函数将其插入到 innerHTML 文本内容
- **THEN** 输出中包含 `&lt;img src=x onerror=alert(1)&gt;`
- **AND** 浏览器不执行脚本

#### Scenario: 属性上下文阻止引号注入
- **WHEN** `shop.name` 值为 `'hello" onfocus="alert(1)"'`
- **AND** 渲染函数将其放入 `value="..."` 属性
- **THEN** 属性值中的 `"` 被转义为 `&quot;`
- **AND** 不构成有效的属性注入

#### Scenario: 站点名包含 HTML 标签
- **WHEN** `station.name` 值为 `'<b>恶意站点</b>'`
- **AND** 渲染函数将其显示在卡片标题中
- **THEN** 输出中包含 `&lt;b&gt;恶意站点&lt;/b&gt;`
- **AND** 页面上以纯文本显示

### Requirement: escapeHtml 函数 MUST 健壮处理边界输入
`escapeHtml()` 函数 MUST 接受任意输入类型（字符串、null、undefined、数字），对非字符串输入先调用 `String()` 转换。

#### Scenario: 输入为 null → 返回空字符串
#### Scenario: 输入为数字 → 返回数字字符串
#### Scenario: 正常字符串含特殊字符 → 全部转义

### Requirement: escapeAttr 函数 MUST 额外转义引号
`escapeAttr()` 函数 MUST 转义 `&` `"` `'` `<` `>`。MUST 先转义 `&` 再转其他字符，防止二次转义。

#### Scenario: 输入含双引号 → `&quot;`
#### Scenario: 输入含单引号 → `&#39;`
#### Scenario: 输入含多种特殊字符 → 全部转义

### Requirement: SVG 渲染中站点名称和换乘线路 MUST 转义
`js/modules/render.js` 的 `renderSVG()` 函数在构建 SVG innerHTML 时，MUST 对所有用户可控的文本内容使用 `escapeHtml()` 转义：站点名称、换乘线路名称。

#### Scenario: 站点名称含 HTML 标签时在 SVG 中转义

### Requirement: 分级面板渲染 MUST 对 key 做白名单校验
`renderGradePanel` 中 grade key MUST 先校验在白名单 `['S', 'A', 'B', 'C']` 中，不在白名单中 MUST 回退到 `'C'`。`data-grade="..."` 属性值 MUST 使用 `escapeAttr()` 转义。

#### Scenario: 非法等级 key 回退到 C 且属性值转义

### Requirement: viz.js 卡片 HTML 属性 MUST 使用 escapeAttr
`renderCard()` 中 `data-id`、`data-grade` 属性值 MUST 使用 `escapeAttr()` 转义。

### Requirement: 禁止使用内联事件处理器
前端代码 MUST NOT 在 HTML 中使用 `onclick`、`onchange`、`onfocus` 等内联事件处理器。所有事件 MUST 通过 `addEventListener` 绑定。

#### Scenario: HTML 源码中不包含 onclick
- **WHEN** 搜索 `battle-map.html`、`interaction.js` 模板字符串
- **THEN** 不存在 `onclick=` 模式

## Testing Notes

- **单元测试** (`tests/utils.test.js`)：`escapeHtml()` 和 `escapeAttr()` 边界输入
- **单元测试** (`tests/render.test.js`)：SVG 渲染中转义输出、grade key 白名单
- **单元测试** (`tests/viz.test.js`)：卡片属性值转义
