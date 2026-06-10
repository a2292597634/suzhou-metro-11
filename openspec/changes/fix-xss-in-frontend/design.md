## Context

当前项目使用原生 JavaScript + innerHTML 构建 UI，4 个核心渲染模块（home.js、viz.js、interaction.js、render.js）中，用户可控数据（商铺名称、租户名、站点名等）直接拼接进 HTML 字符串，未做任何转义。`utils.js` 中虽已定义 `escapeHtml()` 函数，但仅被 `render.js` 的站点卡片渲染使用。其他模块各自独立构建 HTML 字符串，形成了多个 XSS 注入点。

## Goals / Non-Goals

**Goals:**
1. 所有 innerHTML 注入点的用户数据必须经过 `escapeHtml()` 转义
2. `<input value="...">` 等属性值中的用户数据也必须转义（防止属性注入）
3. `escapeHtml()` 函数本身增强健壮性（空值、非字符串、Unicode）
4. 每个修复点都有对应的单元测试覆盖

**Non-Goals:**
- 不替换 innerHTML 为 textContent/DOM API（保持现有渲染模式，最小变更）
- 不引入外部 XSS 防护库（现有 escapeHtml 足够）
- 不修改页面布局或样式
- 不修改数据存储或 API 接口

## Decisions

### Decision 1: 继续使用 `escapeHtml()` 而非替换为 textContent

**选择**: 在现有 innerHTML 模板字符串中插入 `escapeHtml()` 调用。

**理由**:
- 改动范围最小，4 个文件共约 20 处注入点
- innerHTML 模式下保持原有的事件绑定逻辑不变
- `escapeHtml()` 已在 utils.js 中定义并被 render.js 验证有效

**替代方案**: 全面替换为 createElement + textContent — 改动量巨大，引入回归风险。

### Decision 2: `<input value="...">` 使用 `escapeHtml()` 而非 `encodeURIComponent`

**选择**: 使用 `escapeHtml()` 转义属性值。

**理由**:
- `escapeHtml()` 会转义 `"` 和 `'`，可防止属性闭合注入
- `encodeURIComponent` 会把中文变成 `%` 编码，影响用户体验
- HTML 规范中，属性值内的转义与文本节点一致

**替代方案**: 使用 DOM API `input.setAttribute('value', rawValue)` — 需要重构模板生成逻辑，改动过大。

### Decision 3: 增强 `escapeHtml()` 而非创建新函数

**选择**: 增强现有 `escapeHtml()` 以处理边界情况。

**理由**:
- 单一函数便于维护和测试
- 已有 render.js 的调用点无需修改
- 边界处理：非字符串 → `String()`、空字符串 → 返回空字符串

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 遗漏某个 innerHTML 注入点 | 逐个文件审计所有 innerHTML = 和模板字符串拼接点 |
| 转义过度导致显示异常（如 `&` 变成 `&amp;`） | `escapeHtml` 使用 textContent 方式，这是标准 HTML 行为，浏览器会正确解析 |
| 修复后影响现有测试 | 运行全部测试确认无回归 |

## Open Questions

1. **tooltip 中 shop.name 的长度截断**: tooltip 中 `shop.name` 已有 `max-width` 和 `overflow: hidden` 限制，转义后是否会影响？
2. **SVG text 标签中的站点名**: render.js 中 SVG `<text>` 标签直接使用 `s.name.replace('站', '')`，SVG 的 textContent 是否需要不同的转义策略？

## 测试架构设计

### 测试分层策略

| 层级 | 覆盖范围 | 工具 | 文件位置 |
|------|---------|------|---------|
| 单元测试 | `escapeHtml()` 函数、各模块渲染函数的输出字符串 | Vitest + jsdom | `tests/utils.test.js` / `tests/*.test.js` |

### 测试方法

由于 XSS 修复是"验证渲染输出不包含未转义 HTML"，测试策略：
1. 调用渲染函数（或导出辅助函数）
2. 检查输出字符串中不包含原始 `<`、`>` 字符（已转义为 `&lt;`、`&gt;`）
3. 检查 XSS payload 在输出中表现为纯文本而非可执行脚本

### 需要 Mock 的外部依赖

- **document**: jsdom 提供
- **state.stations / state.gradeInfo**: 直接注入含 XSS payload 的测试数据

```
测试数据示例：
{ name: '<img src=x onerror=alert(1)>', tenant: '<script>alert(1)</script>' }

期望输出：
包含 `&lt;img src=x onerror=alert(1)&gt;` 而非 `<img src=x onerror=alert(1)>`
```