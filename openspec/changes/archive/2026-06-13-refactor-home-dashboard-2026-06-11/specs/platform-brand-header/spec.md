## ADDED Requirements

### Requirement: 共享顶部品牌标识
系统 SHALL 在 `index.html`、`data-viz.html` 和 `battle-map.html` 的共享顶部导航中显示压缩版 `assets/design/logo-concept-02-v1-160.png`，并在 Logo 右侧显示平台名称“11号线商业信息综合平台”和副标题“苏州轨道交通 · 商业资产与点位管理”。

#### Scenario: 首页品牌展示
- **WHEN** 用户访问 `index.html`
- **THEN** 顶部导航显示第二版 Logo、平台名称和副标题

#### Scenario: 其他页面品牌一致
- **WHEN** 用户访问 `data-viz.html` 或 `battle-map.html`
- **THEN** 顶部导航显示与首页相同的 Logo、平台名称和副标题

### Requirement: 共享导航路由保持
系统 SHALL 保持三个现有路由地址不变，并将导航文案映射为“经营总览”“商业分析”“线路资产”。

#### Scenario: 导航地址
- **WHEN** 顶部导航完成渲染
- **THEN** 三个导航链接的 `href` 依次为 `index.html`、`data-viz.html`、`battle-map.html`

#### Scenario: 当前页面激活态
- **WHEN** 用户位于三个页面中的任一页面
- **THEN** 对应导航链接具有 `active` 类且其他页面链接不具有该类

### Requirement: 数据来源指示器保留
系统 SHALL 在顶部导航右侧保留刷新按钮和 `#datasource-indicator`，并继续响应 `datasource:change` 事件。

#### Scenario: 数据来源更新
- **WHEN** 页面派发 `datasource:change` 且 `detail.source` 为 `server`
- **THEN** `#datasource-indicator` 显示服务器数据状态

### Requirement: 品牌头部响应式呈现
系统 SHALL 在桌面端显示内含英文标识的 Logo、平台名称和副标题；在不大于 768px 的视口隐藏桌面顶部导航并继续使用现有底部导航。

#### Scenario: 桌面视口
- **WHEN** 浏览器视口宽度为 1440px
- **THEN** 顶部品牌区完整显示且中间导航保持可见

#### Scenario: 手机视口
- **WHEN** 浏览器视口宽度为 390px
- **THEN** 顶部导航按现有响应式规则隐藏，底部导航显示并可跳转三个既有页面

### Requirement: 品牌资源稳定加载
系统 SHALL 为 Logo 图片声明稳定的宽高并使用同源资源；共享导航 MUST NOT 依赖当前 CSP 不允许的外部字体或样式。

#### Scenario: Logo 加载
- **WHEN** 任一现有页面首次加载共享导航
- **THEN** Logo 在图片完成解码前后不引起导航布局跳动

#### Scenario: 严格 CSP 下显示导航
- **WHEN** 页面响应包含 `Content-Security-Policy: default-src 'self'`
- **THEN** 品牌、导航和数据来源指示器正常显示且无外部字体请求失败

## Testing Notes

- 单元测试：`tests/nav.test.js`
  - Logo 图片路径、品牌文案、导航文案与 href
  - 激活态和 `datasource:change` 更新
- 集成测试：`tests/integration/home-dashboard.test.js`
  - 导航初始化与首页看板同时存在时的 DOM 协作
- E2E 测试：`tests/e2e/home-flow.test.js`
  - 桌面顶部品牌显示、手机底部导航显示、三个页面路由可访问
- Mock：单元测试可 mock `window.location`，不得 mock `createTopNav()` 产生的品牌 DOM。
