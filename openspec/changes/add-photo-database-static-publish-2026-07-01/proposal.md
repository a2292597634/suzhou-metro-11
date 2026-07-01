## Why

当前照片能力仍以商铺字段内嵌图片或静态路径为核心，无法同时满足“服务器数据库保存最新图片”和“GitHub Pages 静态站无需数据库也显示最新已发布图片”的目标。需要把照片从普通 `/api/data` 大 JSON 中拆出，建立数据库权威源、动态图片访问和静态快照发布三条清晰链路。

## What Changes

- 新增数据库照片存储能力：为商铺建立稳定身份 `shopUid`，新增一铺一图的 `ShopPhoto` 数据模型，保存图片内容、MIME、大小、哈希和发布状态。
- 新增照片专用 API：通过独立端点上传、替换、删除和读取商铺现场主图；普通商铺资料保存不再携带图片 Data URL。
- 修改 `/api/data` 数据契约：返回稳定 `shopUid` 和轻量 `photo` URL，不返回图片二进制或 Data URL；保存时按稳定身份保留照片关系。
- 新增静态快照发布能力：从数据库导出 `data/default-data.json`、`data/static-manifest.json` 和 `assets/shop-photos/*`，供 GitHub Pages 读取。
- 新增静态站快照版本处理：静态部署环境加载新快照时，不得被旧 `localStorage` 无提示覆盖。
- 新增发布任务状态：数据库保存成功后可标记静态发布待处理、成功或失败，发布失败不回滚数据库。
- 修改商业信息管理页和经营总览展示：照片导入、替换、删除使用新照片 API；动态站显示数据库图片，静态站显示快照图片。
- **BREAKING**：商铺照片首版 Data URL 存储策略被废弃；`Shop.photo` 不再作为图片内容权威字段，只保留兼容读取或迁移用途。

## Capabilities

### New Capabilities

- `shop-photo-storage`: 定义商铺稳定身份、数据库照片模型、照片上传/读取/删除 API 和图片校验规则。
- `static-photo-snapshot-publish`: 定义从数据库导出静态站快照、图片资产、manifest 和发布状态的能力。

### Modified Capabilities

- `data-sync-and-validation`: `/api/data` SHALL 返回 `shopUid` 和轻量照片 URL，并 SHALL 在保存商铺资料时保留照片关系，不再通过 `shops[].photo` 接收图片 Data URL。
- `data-viz-module`: 商业信息管理页 SHALL 使用照片专用 API 管理现场主图，并显示静态发布状态反馈。
- `commercial-overview-dashboard`: 首页经营总览 SHALL 支持动态图片 URL 和静态快照图片路径，并避免缺图或旧本地缓存导致破图。
- `module-data`: 数据加载优先级 SHALL 增加静态快照版本判断，防止 GitHub Pages 上旧 `localStorage` 覆盖新提交的 `default-data.json`。

## Impact

- `prisma/schema.prisma`: 新增 `Shop.shopUid`、`ShopPhoto`、可选 `StaticPublishJob` 或发布状态字段。
- `prisma/migrations/*`: 新增数据库迁移，回填现有商铺稳定身份和照片表结构。
- `prisma/seed.js`: 写入默认数据时生成或保留 `shopUid`，兼容无照片默认数据。
- `server.js`: 新增照片 API、静态发布 API/状态查询，调整 `/api/data` 读写契约和校验。
- `tools/export-static-snapshot.js`: 新增从数据库导出静态快照和图片资产的脚本。
- `tools/publish-static-snapshot.js` 或同等脚本：新增将快照提交到静态发布分支的脚本；执行前必须显式配置目标分支和凭据。
- `data/default-data.json`: 作为静态站快照输出，包含 `snapshotId`、`shopUid` 和静态图片路径。
- `data/static-manifest.json`: 新增静态快照 manifest，记录版本、生成时间、数据哈希和图片清单。
- `assets/shop-photos/`: 新增由快照导出的版本化图片文件，文件名包含 `shopUid` 和图片哈希。
- `js/modules/data.js`: 调整加载顺序和 localStorage 版本处理，保留 API 优先但为静态站增加 manifest 判断。
- `js/modules/viz.js`: 照片导入、替换、删除改为调用照片 API，并显示保存/发布状态。
- `js/modules/home.js`: 支持新照片 URL/路径并保持缺图占位安全。
- `tests/shop-photo-storage.test.js`: 覆盖图片校验、哈希、模型和 API 边界。
- `tests/static-snapshot.test.js`: 覆盖静态快照导出、manifest、图片文件命名和数据引用。
- `tests/data.test.js`: 覆盖静态 manifest 与 localStorage 版本冲突处理。
- `tests/integration/auth-data-flow.test.js`: 覆盖 `/api/data` 与照片关系保留。
- `tests/integration/viz-data.test.js`: 覆盖前端照片 API 调用和状态反馈。
- `tests/integration/home-dashboard.test.js`: 覆盖首页动态/静态照片路径渲染。
- `tests/e2e/data-viz-flow.test.js`: 覆盖真实页面上传、保存、刷新、删除和静态快照预览关键流程。
- `.github/workflows/test.yml`: 如新增快照脚本或分支发布 dry-run，需要纳入 CI 验证。

## 测试策略

依据 `openspec/testing-strategy.md` 的变更类型映射，本 change 涉及数据库迁移、API 契约、跨模块数据流、用户核心增删改流程和静态导出脚本，必须覆盖单元、集成和 E2E 三层测试。

- 单元测试：覆盖照片 MIME/magic bytes 校验、哈希命名、静态快照数据转换、manifest 版本比较、缺图占位逻辑。
- 集成测试：覆盖 `/api/data` 与 `ShopPhoto` 关系保留、照片 API 认证/限流/删除、静态快照导出文件和前端模块协作。
- E2E 测试：覆盖商业信息管理页选择图片、上传、刷新仍显示、删除、发布静态快照后静态路径可用。
- 回归验证：完成后运行定向测试、`npm test`、`npm run test:e2e`、`node scripts/check-test-coverage.js` 和 OpenSpec strict 校验。

## Success Criteria

- 每个商铺拥有稳定 `shopUid`，普通 `/api/data` 保存不会导致已上传照片丢失或照片关系断开。
- 已认证用户可以通过照片专用 API 上传、替换、删除 JPEG/PNG/WebP 主图；服务端校验真实文件类型、大小、哈希并拒绝非法输入。
- 动态服务环境中，`GET /api/data` 返回的商铺 `photo` 是轻量 URL，页面刷新后仍从数据库显示最新照片。
- GitHub Pages 静态部署环境中，页面只依赖 `data/default-data.json`、`data/static-manifest.json` 和 `assets/shop-photos/*` 即可显示最新已发布图片。
- 静态快照文件名包含内容哈希，`default-data.json` 中不引用不存在的图片文件。
- 数据库保存成功但静态发布失败时，数据库数据保持成功状态，发布状态显示失败原因并支持重试。
- 静态站检测到新 `snapshotId` 时，不被旧 `localStorage` 静默覆盖；用户能看到新快照或明确的本地覆盖提示。
- 照片 Data URL 不再通过 `/api/data` 持久化，相关请求体不会因图片内容急剧膨胀。
- 所有新增/修改 requirements 均有对应测试任务，定向测试、完整回归、E2E、覆盖检查和 OpenSpec 校验全部通过。

## 前置条件与风险

- 本地 `main` 在创建本 change 时落后 `origin/main` 1 个提交，`git pull --ff-only` 曾因网络/凭据卡住。执行前必须重新确认目标基线已同步到最新远端 `main`。
- 当前照片上传/预览能力如尚未合并到目标基线，本 change 必须串行依赖相关照片 UI change，或在本 change 范围内接管商业信息管理页照片 UI 接线；不得假设未合并代码已经存在。
