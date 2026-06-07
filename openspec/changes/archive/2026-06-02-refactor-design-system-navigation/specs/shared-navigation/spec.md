# shared-navigation Specification

## 用途
提供跨所有页面共享的导航组件，支持桌面端顶部导航栏和移动端底部 Tab 栏，确保用户在任何设备上都能快速切换页面。

## ADDED Requirements

### Requirement: 桌面端显示固定顶部导航栏
nav.js SHALL 在页面 `DOMContentLoaded` 时向 `document.body` 注入一个固定在顶部的导航栏，包含平台 Logo、名称和页面链接（首页 / 商业数据 / 作战图），当前页面链接高亮显示。

#### Scenario: 导航栏注入成功
- **WHEN** 在桌面端浏览器（宽度 > 768px）中打开任意页面
- **THEN** 页面顶部显示高度为 56px 的固定导航栏，包含"苏州地铁11号线商业信息综合平台"标题和三个导航链接

#### Scenario: 当前页面高亮
- **WHEN** 用户位于"商业数据"页面
- **THEN** "商业数据"导航链接呈现激活状态（深色文字 + 浅灰背景），其他链接为灰色文字

#### Scenario: 导航切换页面
- **WHEN** 用户点击导航栏中的"作战图"链接
- **THEN** 浏览器导航至 `battle-map.html` 页面

### Requirement: 移动端自动切换为底部 Tab 栏
nav.js SHALL 在视口宽度 ≤ 768px 时隐藏顶部导航栏，改为在页面底部显示固定 Tab 栏，包含三个 Tab（首页 / 数据 / 作战图），当前 Tab 高亮显示。

#### Scenario: 移动端底部 Tab 显示
- **WHEN** 在移动端浏览器（宽度 ≤ 768px）中打开任意页面
- **THEN** 页面底部显示高度为 64px 的固定 Tab 栏（含安全区适配），包含三个图标+文字 Tab

#### Scenario: 底部 Tab 切换页面
- **WHEN** 用户点击底部 Tab 栏的"作战图"Tab
- **THEN** 浏览器导航至 `battle-map.html` 页面

#### Scenario: 桌面端底部 Tab 隐藏
- **WHEN** 在桌面端浏览器（宽度 > 768px）中打开页面
- **THEN** 底部 Tab 栏不可见（`display: none`）

### Requirement: 导航组件支持动态高亮
nav.js SHALL 根据当前页面 URL 自动判断当前所在页面，并高亮对应导航项，无需每页手动传入参数。

#### Scenario: 自动识别当前页面
- **WHEN** 用户直接访问 `data-viz.html`（不经过首页点击）
- **THEN** 导航栏中的"商业数据"项自动高亮，无需页面手动传入激活状态

### Requirement: 导航栏视觉风格符合设计系统
导航栏的样式 SHALL 使用 platform.css 中定义的 Token，包括：白色背景 + 底部 1px 边框（`--color-subtle-ash`）、紧凑高度、Geist 字体、圆角 pill 按钮。

#### Scenario: 导航样式一致性
- **WHEN** 开发者检查导航栏的 computed styles
- **THEN** `font-family` 包含 Geist，`background` 为 `#ffffff`，`border-bottom` 为 `1px solid #e5e5e5`

## Testing Notes

- **测试层级**：单元测试（DOM 操作）+ 集成测试（nav + router 联动）
- **测试文件**：`tests/nav.test.js`（已有，需补充底部导航测试）
- **关键测试用例**：
  - DOM 注入：顶部导航栏注入到 `document.body.firstElementChild`
  - 页面识别：`detectActivePage()` 正确识别 `index.html`/`data-viz.html`/`battle-map.html`
  - 激活态：当前页链接带有 `.active` 类，背景/文字色正确
  - 桌面/移动端切换：视口 ≤768px 时底部 Tab 显示，顶部导航隐藏
  - 底部导航点击：触发页面跳转并同步更新激活态
- **Mock 需求**：
  - `window.location`：模拟不同页面路径
  - DOM：jsdom 提供完整的 DOM API
- **验证方式**：Vitest + jsdom + @testing-library/dom
