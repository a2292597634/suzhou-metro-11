## ADDED Requirements

### Requirement: 首页支持商铺照片展示路径
首页经营总览 SHALL 支持商铺 `photo` 为 `/api/shop-photos/<shopUid>?v=<sha256-12>` 或 `/assets/shop-photos/<shopUid>-<sha256-12>.<jpg|png|webp>`。首页 MUST NOT 要求 `photo` 为 Data URL。

#### Scenario: 渲染动态照片 URL
- **WHEN** 首页加载的商铺 `photo` 为 `/api/shop-photos/shop_abc?v=8f4e2c9a1b23`
- **THEN** 站点趋势详情或商铺明细中渲染该图片
- **AND** 图片 `alt` 包含商铺名称或铺号

#### Scenario: 渲染静态照片路径
- **WHEN** 首页加载的商铺 `photo` 为 `/assets/shop-photos/shop_abc-8f4e2c9a1b23.jpg`
- **THEN** 站点趋势详情或商铺明细中渲染该图片
- **AND** 页面不请求数据库 API 也能显示图片

### Requirement: 首页缺图安全占位
首页经营总览 SHALL 在商铺无照片、照片路径为空字符串或照片路径缺失时显示紧凑占位。首页 MUST NOT 渲染 `src=""` 的图片元素，MUST NOT 显示破图图标。

#### Scenario: 无照片不渲染图片标签
- **WHEN** 商铺 `photo` 为空字符串
- **THEN** 首页显示无照片占位
- **AND** 该商铺明细不包含 `src=""` 的 `img`

### Requirement: 首页使用静态快照最新数据
在 GitHub Pages 静态部署环境中，首页 SHALL 使用 `data/default-data.json` 的 `snapshotId` 和商铺照片路径渲染经营总览。若 API 不可达且静态快照更新，首页 SHALL 显示新快照中的照片路径。

#### Scenario: 静态快照照片更新
- **WHEN** `/api/data` 不可达
- **AND** `data/static-manifest.json` 的 `snapshotId` 新于 localStorage 中记录的 `snapshotId`
- **THEN** 首页加载 `data/default-data.json`
- **AND** 使用新快照中的 `shops[].photo` 渲染照片

## Testing Notes

- 单元/集成测试：`tests/integration/home-dashboard.test.js` 覆盖动态 URL、静态路径和缺图占位。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 或首页 E2E 覆盖静态快照照片在页面中可见。
- 需要 mock：`fetch('/data/static-manifest.json')`、`fetch('/data/default-data.json')` 和 `localStorage` 版本数据。
