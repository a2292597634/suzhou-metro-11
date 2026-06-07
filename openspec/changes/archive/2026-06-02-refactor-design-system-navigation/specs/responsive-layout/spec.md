# responsive-layout Specification

## 用途
确保平台在桌面端、平板端和移动端均能正常显示和交互，信息密度和布局随设备宽度自适应调整。

## ADDED Requirements

### Requirement: 响应式断点覆盖三类设备
platform.css SHALL 定义至少三个响应式断点：桌面端（> 900px）、平板端（768px - 900px）、移动端（≤ 768px），每个断点下的布局、字体大小、间距均有差异化调整。

#### Scenario: 桌面端布局
- **WHEN** 在 1200px 宽度的浏览器中打开首页
- **THEN** KPI 卡片以 4 列网格排列，顶部导航栏完整显示，内容区域最大宽度 1280px 并居中

#### Scenario: 平板端布局
- **WHEN** 在 820px 宽度的浏览器中打开首页
- **THEN** KPI 卡片以 2 列网格排列，顶部导航栏显示但标题缩短，内容区域占满视口

#### Scenario: 移动端布局
- **WHEN** 在 375px 宽度的浏览器中打开首页
- **THEN** KPI 卡片以单列排列，顶部导航栏隐藏，底部显示 Tab 栏，内容区域左右边距 16px

### Requirement: 移动端内容不被底部 Tab 遮挡
所有 `.page-section` 或主内容容器 SHALL 在移动端添加足够的底部内边距（`padding-bottom: calc(64px + env(safe-area-inset-bottom))`），确保内容不会被固定的底部 Tab 栏遮挡。

#### Scenario: 内容可见性
- **WHEN** 在 iPhone 14（390px 宽）上滚动到页面底部
- **THEN** 页面最底部的内容完全可见，与底部 Tab 栏之间有至少 16px 间距

### Requirement: 触摸目标最小尺寸符合规范
所有可交互元素（按钮、链接、Tab 项）在移动端 SHALL 保持最小 44px × 44px 的触摸目标尺寸，即使视觉上元素较小。

#### Scenario: 触摸目标尺寸验证
- **WHEN** 开发者检查移动端底部 Tab 栏中每个 Tab 项的 computed size
- **THEN** 每个 Tab 项的点击区域至少为 44px × 44px，即使图标和文字本身更小

### Requirement: prefers-reduced-motion 支持
所有动画和过渡效果 SHALL 尊重用户的 `prefers-reduced-motion` 媒体查询设置，当用户开启减少动画时，所有动画瞬间完成或不播放。

#### Scenario: 减少动画模式
- **WHEN** 用户在系统设置中开启"减少动态效果"并刷新页面
- **THEN** 页面切换动画、数字计数动画、图表生长动画均不播放，元素直接显示最终状态

#### Scenario: 正常动画模式
- **WHEN** 用户未开启减少动态效果
- **THEN** 所有动画正常播放

## Testing Notes

- **测试层级**：单元测试（CSS 媒体查询验证）+ E2E 测试（真实设备模拟）
- **测试文件**：`tests/responsive.test.js`（新增）+ `tests/e2e/mobile-nav.test.js`（新增）
- **关键测试用例**：
  - 断点响应：`@media` 查询在 1200px/820px/375px 下布局正确
  - 底部内边距：`.page-section` 或主容器在移动端有 `calc(64px + env(safe-area-inset-bottom))` padding
  - 触摸目标：底部 Tab 项 computed size ≥44px×44px
  - Reduced-motion：`prefers-reduced-motion: reduce` 时所有 `transition`/`animation` 时间设为 0 或移除
- **Mock 需求**：
  - `window.matchMedia`：模拟不同视口宽度和 prefers-reduced-motion 设置
- **验证方式**：
  - 单元测试：Vitest + jsdom，mock matchMedia 验证 CSS 类切换
  - E2E 测试：Puppeteer 模拟 iPhone 14 视口，验证布局和内容可见性
