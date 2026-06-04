## 背景

当前项目为单页面应用，仅 `index.html` 一个入口，视觉风格为毛玻璃 + 彩色地铁线。随着平台扩展为多页面（首页 Dashboard、商业数据可视化、作战图），现有架构面临三个核心问题：

1. **架构瓶颈**：单页面无法承载多角色视图，所有功能挤在一个 21:9 画布中，信息密度失控
2. **视觉债务**：CSS 变量与硬编码混用、阴影层级混乱、无系统化的设计 Token，维护成本高
3. **移动端缺失**：现有响应式仅为缩放降级，未针对移动端重新设计交互模式

本次变更作为平台重设计的**基础设施层**，需要在不破坏现有作战图功能的前提下，建立新的设计系统和多页面架构。

## 目标 / 非目标

**目标：**
- 建立 monochrome architectural blueprint 设计系统（基于 DESIGN.md），覆盖颜色、字体、间距、阴影、圆角、动画
- 实现共享导航组件（桌面端顶部导航 + 移动端底部 Tab）
- 建立多页面路由机制（index.html / battle-map.html / data-viz.html）
- 实现响应式布局系统（桌面 / 平板 / 移动端）
- 全局噪点纹理和 elevation 阴影系统在所有页面生效

**非目标：**
- 不修改作战图核心逻辑（SVG 渲染、商铺编辑、数据模型）—— 仅更换外壳样式
- 不引入前端框架（React/Vue）或构建工具（Webpack/Vite）
- 不实现数据可视化图表（属于后续变更）
- 不修改后端 API 或数据库 schema
- 不实现用户认证/权限系统

## 设计决策

### 决策 1：独立 HTML 文件 vs Hash 路由 SPA

**选择：独立 HTML 文件（`index.html` / `battle-map.html` / `data-viz.html`）**

**理由：**
- 无构建工具环境下，独立文件最简单可靠，浏览器原生处理导航
- 每页只加载所需 JS（首页不需要作战图的 viewport.js，减少首屏加载）
- 有利于 SEO 和分享特定页面链接
- 打印优化更简单（作战图已有复杂打印样式，隔离后更清晰）

**替代方案：** Hash 路由 SPA（`/#/home`, `/#/battle`）
- 拒绝原因：需要自定义路由逻辑，增加代码复杂度；所有 JS 打包加载，首屏慢

### 决策 2：`platform.css` + `style.css` 双样式表

**选择：新建 `css/platform.css` 作为全局样式，保留 `css/style.css` 为作战图专用**

**理由：**
- `style.css` 已有 29KB 作战图专用样式（SVG、打印、21:9 画布），全部重写风险高
- `platform.css` 专注平台级组件（导航、卡片、按钮、表格），与作战图样式解耦
- 后续若作战图也需换肤，可逐步将 `style.css` 迁移至 `platform.css`

**迁移路径：**
```
Phase 1（本变更）: platform.css 负责导航 + 布局框架，style.css 负责作战图内部
Phase 2（后续）: 逐步用 platform.css Token 替换 style.css 中的硬编码值
Phase 3（最终）: style.css 完全融入 platform.css
```

### 决策 3：导航注入方式（JS 动态插入 vs 每页手写）

**选择：JS 动态插入（`nav.js` 在每个页面 `DOMContentLoaded` 时注入导航）**

**理由：**
- 导航修改只需改一处，避免三份 HTML 中重复代码
- 支持动态高亮当前页面（通过 `data-page` 属性匹配）
- 移动端/桌面端切换逻辑集中在 `nav.js`

**替代方案：** 每页手写导航 HTML
- 拒绝原因：维护成本高，修改导航需要改三处

### 决策 4：URL 状态同步策略

**选择：`history.pushState` + `URLSearchParams`，不用 hash**

**理由：**
- `?page=battle` 比 `/#/battle` 更语义化，服务端也能识别（如需 SSR 扩展）
- 刷新页面后保持当前页面状态
- 支持额外参数（如 `?page=data&grade=S`）

### 决策 5：Geist 字体加载策略

**选择：CDN 加载 + 系统字体回退**

```css
font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**理由：**
- Geist 是设计系统的核心，但国内 CDN 可能不稳定
- 系统字体回退确保任何情况下都能渲染
- 如需离线使用，后续可将字体文件本地化

### 决策 6：elevation 阴影用 CSS 变量还是工具类

**选择：CSS 变量（`--shadow-subtle`、`--shadow-sm`、`--shadow-md`、`--shadow-lg`、`--shadow-subtle-2`）**

**理由：**
- 变量可直接在组件样式中引用，无需额外 HTML class
- 与 DESIGN.md Token 体系一致
- 未来支持 dark mode 时，只需修改变量值即可全局切换

## 风险与权衡

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| `index.html` 改为首页后，现有用户书签失效 | 中 | 在 `index.html` 添加临时重定向逻辑（若检测到无 page 参数且 localStorage 有作战图数据，提示用户新入口） |
| `platform.css` 与 `style.css` 样式冲突 | 高 | `platform.css` 使用 `platform-` 前缀的 class（如 `.platform-card`），`style.css` 保留原有类名，两者不重叠 |
| 移动端底部导航遮挡内容 | 中 | 所有 `.page-section` 添加 `padding-bottom: calc(64px + env(safe-area-inset-bottom))` |
| 页面切换动画导致性能问题 | 低 | 动画仅使用 `transform` 和 `opacity`（GPU 加速），低端设备通过 `prefers-reduced-motion` 禁用 |
| 导航 JS 注入失败导致页面无导航 | 高 | HTML 中保留 fallback 导航注释块，JS 注入失败时显示提示 |

## 迁移计划

**部署步骤：**
1. 创建 `css/platform.css`、 `js/modules/nav.js`、 `js/modules/router.js`
2. 创建 `battle-map.html`（复制当前 `index.html` 内容）
3. 创建 `data-viz.html`（占位骨架）
4. 重写 `index.html` 为首页骨架
5. 修改 `js/modules/main.js` 添加路由初始化
6. 本地验证三页导航正常
7. 测试移动端底部导航
8. 提交变更

**回滚策略：**
- 若出现问题，保留原 `index.html` 的 git 历史，可随时 `git checkout` 回退
- `battle-map.html` 是新增文件，不影响原有功能

## Open Questions

1. **作战图页面是否需要保留原有 `index.html` URL？** 现有用户可能已收藏 `index.html` 作为作战图入口。改为首页后，是否需要添加 302 重定向或友好提示？

2. ~~移动端底部导航的图标风格：使用 SVG 线条图标还是 emoji？~~ **【已解决】** 确定使用手写 SVG 线条图标（内联于 nav.js 的 BOTTOM_NAV_CONFIG 中），符合 DESIGN.md 精密工具感，不引入外部图标库。

## 目录树

```
E:\suzhou-metro-11\
├── index.html                    # 首页 Dashboard（重写）
├── battle-map.html               # 作战图页面（从 index.html 迁移）
├── data-viz.html                 # 数据可视化页面（新建占位）
├── css/
│   ├── platform.css              # 全局设计系统（新建）
│   └── style.css                 # 作战图专用样式（保留）
├── js/
│   ├── modules/
│   │   ├── main.js               # 应用入口（修改：添加路由初始化）
│   │   ├── nav.js                # 共享导航组件（新建）
│   │   ├── router.js             # 页面路由管理（新建）
│   │   ├── state.js              # 共享状态（不变）
│   │   ├── data.js               # 数据管理（不变）
│   │   ├── render.js             # 渲染引擎（不变）
│   │   ├── interaction.js        # 用户交互（不变）
│   │   ├── viewport.js           # 视口控制（不变）
│   │   └── utils.js              # 工具函数（不变）
│   └── xlsx.full.min.js          # SheetJS（不变）
├── server.js                     # 后端（不变）
├── prisma/                       # 数据库（不变）
├── assets/                       # 静态资源（不变）
└── openspec/                     # 规范文档（不变）
```

## 测试架构设计

### 测试分层策略

```
单元测试（Vitest + jsdom）
├── tests/nav.test.js           — 导航组件 DOM 操作、页面识别
├── tests/router.test.js        — 路由解析、方向计算、URL 同步
├── tests/platform-css.test.js  — CSS Token 可解析性、无硬编码色值
└── tests/responsive.test.js    — 断点计算、触摸目标尺寸

集成测试（Vitest + jsdom）
└── tests/integration/page-switch.test.js
    — nav.js + router.js 联动：点击导航 → 路由触发 → 激活态更新

E2E 测试（Puppeteer）
└── tests/e2e/mobile-nav.test.js
    — 真实浏览器：≤768px 底部 Tab 渲染、点击跳转、安全区适配
```

### 需要 Mock 的外部依赖

| 依赖 | Mock 方式 | 用途 |
|------|----------|------|
| `window.location` | `vi.stubGlobal('location', {...})` | 测试页面路径解析 |
| `window.history` | `vi.stubGlobal('history', {pushState: vi.fn()})` | 测试 URL 同步（jsdom 不支持 history API） |
| `window.matchMedia` | `vi.stubGlobal('matchMedia', vi.fn())` | 测试 prefers-reduced-motion |
| DOM | jsdom 原生环境 | 测试导航栏注入、激活态切换 |
| CSS 变量 | `getComputedStyle` 在 jsdom 中有限支持 | Token 验证以字符串解析为主 |

### 测试执行顺序

1. **基础设施**：Vitest + jsdom 配置就绪
2. **Red 阶段**：先写失败测试，覆盖所有新增/修改模块
3. **Green 阶段**：写最小实现使测试通过
4. **Refactor 阶段**：在测试保护下重构代码
5. **集成验证**：运行集成测试和 E2E 测试
6. **覆盖率检查**：运行 `node scripts/check-test-coverage.js`
