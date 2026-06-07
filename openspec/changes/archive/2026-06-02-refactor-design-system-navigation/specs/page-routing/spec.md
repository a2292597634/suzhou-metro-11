# page-routing Specification

## 用途
管理多页面之间的导航和状态同步，确保用户在不同页面间切换时保持流畅体验，且 URL 能正确反映当前页面位置。

## ADDED Requirements

### Requirement: 三个独立 HTML 页面构成平台
平台 SHALL 由三个独立 HTML 文件组成：`index.html`（首页）、`battle-map.html`（作战图）、`data-viz.html`（数据可视化），每个文件通过导航栏相互链接。

#### Scenario: 页面文件存在
- **WHEN** 检查项目根目录文件列表
- **THEN** 存在 `index.html`、`battle-map.html`、`data-viz.html` 三个文件

#### Scenario: 页面间导航正常
- **WHEN** 用户从 `index.html` 点击导航链接前往 `battle-map.html`
- **THEN** 浏览器成功加载 `battle-map.html` 并显示作战图内容

### Requirement: URL 参数同步当前页面状态
router.js SHALL 在页面切换时通过 `history.pushState` 将当前页面信息同步到 URL 查询参数（如 `?page=battle`），支持刷新后保持当前页面。

#### Scenario: URL 参数正确设置
- **WHEN** 用户从首页导航至作战图页面
- **THEN** 浏览器地址栏显示 `battle-map.html?page=battle`

#### Scenario: 刷新保持页面
- **WHEN** 用户在 `battle-map.html?page=battle` 页面按下 F5 刷新
- **THEN** 页面重新加载后仍显示作战图内容（不跳转回首页）

### Requirement: 页面切换带有方向性过渡动画
所有页面 SHALL 在切换时带有方向性 CSS 动画：首页→数据页面向右滑入，数据→作战图向上浮入，作战图→首页向下滑入，动画时长 400-500ms，使用 `--ease-out` 曲线。

#### Scenario: 首页到数据页面动画
- **WHEN** 用户从首页点击"商业数据"导航
- **THEN** 新页面内容从右侧滑入（`translateX(30px)` → `0`），同时透明度从 0 → 1

#### Scenario: 动画性能
- **WHEN** 在低端设备上切换页面
- **THEN** 动画流畅无卡顿（仅使用 `transform` 和 `opacity` 属性）

### Requirement: 作战图页面保留原有功能
battle-map.html SHALL 完整保留原有 `index.html` 中的作战图功能（SVG 渲染、站点卡片、商铺编辑、缩放平移、打印导出），仅更换外壳样式。

#### Scenario: 作战图功能完整
- **WHEN** 用户打开 `battle-map.html`
- **THEN** 可以看到完整的地铁线路、站点卡片、统计面板，且可以双击卡片编辑商铺信息

#### Scenario: 作战图数据持久化
- **WHEN** 用户在作战图页面编辑商铺信息后保存
- **THEN** 数据通过 `/api/data` POST 请求保存到服务器，刷新后数据不丢失

## Testing Notes

- **测试层级**：单元测试（纯逻辑）
- **测试文件**：`tests/router.test.js`（已有，需补充完整）
- **关键测试用例**：
  - 页面解析：`resolvePageFromPath()` 正确解析三种页面文件名
  - 方向计算：`getTransitionDirection()` 覆盖所有 6 种页面组合
  - URL 同步：`syncUrlParams()` 调用 `history.pushState` 并保留其他参数
  - 生命周期钩子：`beforeEach`/`afterEach` 注册、调用顺序、返回值阻止导航
  - 刷新保持：`initRouter()` 从 URL 查询参数恢复当前页面
- **Mock 需求**：
  - `window.history`：`pushState`/`replaceState` 为 jsdom 安全区域外，必须 mock
  - `window.location`：模拟不同 pathname 和 search
- **验证方式**：Vitest + jsdom，通过 `vi.stubGlobal` mock 浏览器 API
- **已知限制**：MPA 中 `history.pushState` 设置的参数在整页跳转后丢失，E2E 测试需验证实际行为
