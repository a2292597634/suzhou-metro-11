## 为什么做这个变更

当前网站是单页面应用（仅 `index.html`），采用毛玻璃 + 彩色地铁线的视觉风格。随着平台功能扩展（首页 Dashboard、商业数据可视化、作战图），现有架构无法支撑多页面需求，且视觉风格过于陈旧，不符合"精密工具感"的品牌定位。

本变更是整个平台重设计的**基础设施层**，为后续所有页面变更提供统一的设计语言、共享组件和路由基础。没有这一层，后续页面将各自为战，无法保持一致性。

## 变更内容

- **BREAKING**: `index.html` 从作战图页面改为首页 Dashboard 入口，作战图内容迁移至新文件 `battle-map.html`
- 建立完整的 CSS 设计系统（Design Token）：颜色、字体、间距、阴影、圆角、动画曲线
- 实现全局噪点纹理和蓝图网格线背景，营造建筑蓝图质感
- 建立五级 elevation 阴影系统，替代原有毛玻璃效果
- 创建共享顶部导航组件（桌面端）+ 底部 Tab 栏（移动端）
- 实现多页面路由切换机制（`index.html` / `battle-map.html` / `data-viz.html`）
- 建立响应式断点系统（桌面 / 平板 / 移动端）
- 新增 `css/platform.css` 作为全局样式入口，保留 `css/style.css` 供作战图专用

## 能力项

### 新增能力
- `design-system`: 全局 CSS Token 设计系统，包含颜色、字体、间距、阴影、圆角、动画变量
- `shared-navigation`: 共享导航组件，支持桌面端顶部导航栏和移动端底部 Tab 栏
- `page-routing`: 多页面路由切换与状态管理，支持 URL 参数同步
- `responsive-layout`: 响应式布局系统，覆盖桌面 / 平板 / 移动端适配

### 修改的能力
- 无（本变更不修改现有 spec 的需求定义，仅建立新基础设施）

## 影响范围

**新增文件：**
- `css/platform.css` — 全局设计系统样式（~600 行）
- `js/modules/nav.js` — 共享导航组件
- `js/modules/router.js` — 页面路由管理
- `battle-map.html` — 作战图页面（从 `index.html` 迁移）
- `data-viz.html` — 数据可视化页面占位

**修改文件：**
- `index.html` — 重构为首页 Dashboard 骨架，引入 platform.css 和导航
- `js/modules/main.js` — 添加路由初始化、页面生命周期钩子
- `package.json` — 如需新增测试框架依赖（Vitest）

**删除 / 弃用：**
- `css/style.css` 中的全局样式将被 `platform.css` 替代，但保留作战图专用样式

## 测试策略

本 change 涉及设计系统、导航组件、路由模块和响应式布局四个维度，按照 openspec/testing-strategy.md 的变更类型映射表，测试策略如下：

| 模块 | 测试层级 | 测试文件 | 说明 |
|------|---------|---------|------|
| platform.css（设计系统 Token） | 单元测试 | `tests/platform-css.test.js` | 验证 Token 完整性、无硬编码色值、字体加载、阴影层级 |
| nav.js（共享导航） | 单元测试 + 集成测试 | `tests/nav.test.js` | 验证 DOM 注入、页面识别、激活态、桌面/移动端切换 |
| router.js（页面路由） | 单元测试 | `tests/router.test.js` | 验证页面解析、方向计算、URL 同步、生命周期钩子 |
| responsive-layout（响应式布局） | 单元测试 + E2E 测试 | `tests/responsive.test.js` | 验证断点响应、底部 padding、触摸目标尺寸、reduced-motion |
| 页面集成 | 集成测试 | `tests/integration/page-switch.test.js` | 验证 nav + router 联动、三页导航正常、URL 同步正确 |
| 移动端底部 Tab | E2E 测试 | `tests/e2e/mobile-nav.test.js` | 验证 ≤768px 时底部 Tab 显示、点击跳转正常 |

TDD 执行顺序：每个功能模块任务组按 Red → Green → Refactor 三步执行。测试未通过不算完成。

## 成功标准

- [ ] 三个页面（首页 / 作战图 / 数据）可以通过导航正常切换
- [ ] 桌面端显示顶部导航栏，移动端（≤768px）自动切换为底部 Tab 栏
- [ ] 所有页面共用同一套 CSS Token，视觉风格一致
- [ ] 页面切换带有方向性过渡动画（非简单淡入淡出）
- [ ] 全局噪点纹理和 elevation 阴影在三个页面均生效
- [ ] 响应式布局在桌面端（>900px）、平板端（768-900px）、移动端（≤768px）均正常显示
- [ ] 路由状态同步到 URL，刷新页面后保持当前所在页面
