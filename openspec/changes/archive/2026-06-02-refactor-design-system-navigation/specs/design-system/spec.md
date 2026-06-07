# design-system Specification

## 用途
定义平台全局视觉设计系统，包含颜色、字体、间距、阴影、圆角、动画等 CSS Token，确保所有页面视觉一致性。

## ADDED Requirements

### Requirement: CSS 自定义属性定义完整的设计 Token
platform.css SHALL 定义覆盖颜色、字体、间距、阴影、圆角、动画曲线的 CSS 自定义属性（CSS Variables），所有组件样式必须通过变量引用，禁止硬编码色值。

#### Scenario: Token 完整性验证
- **WHEN** 开发者检查 `css/platform.css` 文件
- **THEN** 文件中存在以下 Token 类别：颜色（至少 12 个灰阶变量 + 语义红绿）、字体（4 级字号 + 字重 + 字距）、间距（至少 8 个间距值）、阴影（5 级 elevation）、圆角（至少 4 个半径值）、动画（至少 2 条 easing 曲线）

#### Scenario: 禁止硬编码色值
- **WHEN** 使用 `grep -E '#[0-9a-f]{3,6}' css/platform.css` 搜索硬编码颜色
- **THEN** 除 SVG data URL 和特殊注释外，结果为空（所有颜色通过 `var(--color-*)` 引用）

### Requirement: 全局噪点纹理营造建筑蓝图质感
platform.css SHALL 在 `body::before` 伪元素上叠加基于 SVG feTurbulence 的噪点纹理，透明度控制在 1.5%-2.5% 之间，且不阻挡任何交互。

#### Scenario: 噪点纹理可见性验证
- **WHEN** 在白色背景下放大页面至 200%
- **THEN** 可以观察到细微的颗粒纹理，但文字和组件保持清晰可读

#### Scenario: 噪点不阻挡交互
- **WHEN** 用户点击页面上的任何按钮或链接
- **THEN** 点击事件正常触发，不受 `body::before` 伪元素影响

### Requirement: 五级 elevation 阴影系统
platform.css SHALL 定义五级阴影变量（`--shadow-subtle`、`--shadow-sm`、`--shadow-md`、`--shadow-lg`、`--shadow-subtle-2`），分别对应静态、悬停、激活、浮动、覆盖五种层级状态，所有卡片和浮层组件必须使用对应层级。

#### Scenario: Elevation 层级正确应用
- **WHEN** 开发者检查 `.surface`、`.surface-elevated`、`.modal` 等组件的 `box-shadow`
- **THEN** 这些组件分别引用 `--shadow-subtle`、`--shadow-sm`、`--shadow-lg` 等对应层级的阴影变量

#### Scenario: 悬停状态阴影升级
- **WHEN** 鼠标悬停在 `.kpi-card` 或 `.surface` 元素上
- **THEN** 元素的 `box-shadow` 从 `--shadow-subtle` 平滑过渡到 `--shadow-sm`，过渡时间为 200ms

### Requirement: 字体系统使用 Geist 字体族
platform.css SHALL 将 Geist 字体（通过 CDN `https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-sans/style.css` 加载）设为主要字体，并提供系统字体回退栈。

#### Scenario: Geist 字体加载成功
- **WHEN** 在支持网络连接的浏览器中打开页面
- **THEN** 页面文字使用 Geist 字体渲染，字重 400/500/600 均正常显示

#### Scenario: 字体回退生效
- **WHEN** 在网络断开或 CDN 不可用时刷新页面
- **THEN** 文字使用系统字体回退栈渲染，布局不发生明显错位

### Requirement: 动画曲线一致性
platform.css SHALL 定义至少两条标准动画曲线：`--ease-out`（`cubic-bezier(0.16, 1, 0.3, 1)`，用于入场和页面切换）和 `--ease-spring`（`cubic-bezier(0.34, 1.56, 0.64, 1)`，用于弹性效果），所有组件过渡动画必须使用这些变量。

#### Scenario: 动画曲线统一性验证
- **WHEN** 开发者搜索 `cubic-bezier` 在 `css/platform.css` 中的使用
- **THEN** 所有非注释出现的 `cubic-bezier` 值均为上述两条标准曲线之一

## Testing Notes

- **测试层级**：单元测试（CSS Token 验证）
- **测试文件**：`tests/platform-css.test.js`（新增）
- **关键测试用例**：
  - Token 完整性：颜色、字体、间距、阴影、圆角、动画曲线变量均存在
  - 无硬编码色值：除 SVG data URL 外，所有颜色通过 `var(--color-*)` 引用
  - 噪点纹理存在：`body::before` 伪元素存在且 opacity 在 1.5%-2.5%
  - 字体加载：Geist 字体族定义正确，系统回退栈完整
  - 阴影层级：`--shadow-subtle/sm/md/lg` 均定义且值递增
- **Mock 需求**：无（纯 CSS 验证，通过字符串解析即可）
- **验证方式**：Vitest 读取 platform.css 文件内容，正则匹配验证
