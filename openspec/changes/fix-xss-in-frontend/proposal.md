## Why

前端代码中多处使用 `innerHTML` 直接插入用户可控的数据（商铺名称、租户名、站点名等），且未做 HTML 转义。攻击者可通过 `POST /api/data` 接口写入恶意脚本（如 `<img src=x onerror=alert(1)>`），所有访问页面的用户都会触发。Change 1 已修复 API 认证，但数据库中已有的恶意数据或未来通过其他途径注入的数据仍可能通过前端渲染触发 XSS。必须彻底消除所有持久化 XSS 漏洞。

## What Changes

- 统一使用 `utils.js` 中的 `escapeHtml()` 转义所有动态插入到 innerHTML 中的用户数据
- `js/modules/home.js`: `renderStationTable` 和 `updateTooltipContent` 中 `shop.name`/`shop.tenant`/`shop.shortNo` 转义
- `js/modules/viz.js`: `renderCard` 和 `renderDetail` 中 `station.name`/`shop.name`/`shop.tenant` 转义，`<input value="...">` 中的属性值转义
- `js/modules/interaction.js`: `renderShopTable` 中所有用户输入字段转义
- `js/modules/render.js`: `renderGradePanel` 中 `info.name`/`info.desc` 转义
- 为上述每个文件新增/补充 XSS 防护单元测试

## Capabilities

### New Capabilities
- `frontend-xss-protection`: 前端渲染安全化 — 所有 innerHTML 注入点必须使用转义，防止恶意脚本执行

### Modified Capabilities
- `module-utils`: `escapeHtml()` 函数的行为扩展覆盖更多场景（如空值、非字符串输入）

## Impact

| 文件 | 变更内容 |
|------|---------|
| `js/modules/home.js` | `renderStationTable` 和 `updateTooltipContent` 中用户数据转义 |
| `js/modules/viz.js` | `renderCard` 和 `renderDetail` 中用户数据转义 |
| `js/modules/interaction.js` | `renderShopTable` 中用户数据转义 |
| `js/modules/render.js` | `renderGradePanel` 中用户数据转义 |
| `js/modules/utils.js` | 可能增强 `escapeHtml()` 的健壮性 |
| `tests/` | 新增/补充 XSS 防护测试 |

## 测试策略

依据 `openspec/testing-strategy.md` 变更类型映射表：

| 变更类型 | 映射结果 |
|---------|---------|
| Bug 修复（修复渲染逻辑错误） | 单元 ✅ 必做 |
| 多个模块联动修改（4 个文件） | 集成 视影响范围 |
| 不改变页面结构或交互流程 | E2E — 不需要 |

- **单元测试**：
  - `tests/utils.test.js` — 补充 `escapeHtml()` 边界用例
  - `tests/home.test.js` — 补充 XSS payload 不被执行的测试
  - `tests/viz.test.js` — 补充 XSS payload 不被执行的测试
  - `tests/interaction.test.js` — 补充 XSS payload 不被执行的测试
  - `tests/render.test.js` — 补充 XSS payload 不被执行的测试

## 成功标准

- [ ] 所有 innerHTML 注入点使用 `escapeHtml()` 或等效方式转义
- [ ] 恶意脚本 payload（如 `<img src=x onerror=alert(1)>`）在页面上显示为纯文本，不执行
- [ ] `escapeHtml()` 正确处理空值、非字符串、特殊字符
- [ ] 所有相关单元测试通过（Red → Green → Refactor）
- [ ] `npm test` 零失败
