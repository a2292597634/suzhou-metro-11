## Why

商业信息管理页目前只能维护商铺文字信息，缺少现场照片这一类强现场感资料。商业招商、空置点位跟进和经营巡检都需要快速看到商铺真实状态；如果照片只保存在本机浏览器中，团队成员换设备或多人协作时会丢失上下文。

本 change 将为每个商铺增加一张服务器持久保存的现场主图，并让商业信息管理页和经营总览页共用同一份照片数据。用户可以在商业信息管理页导入、替换、删除照片；在商铺行或经营总览趋势卡片中悬停时能直接预览照片和点位信息。

## What Changes

- 为 `Shop` 数据模型增加一张现场主图字段，并通过 Prisma 迁移持久化到 PostgreSQL。
- 更新 `/api/data` 的读取、保存和 Zod 校验，使商铺照片 Data URL 随商铺数据保存和返回。
- 商业信息管理页的商铺表格新增照片列，支持单张照片导入/替换/删除，并在悬停商铺行或预览项时显示照片预览。
- 经营总览页站点商业趋势悬浮卡片下半部分新增商业点位明细，左侧显示点位信息，右侧显示照片缩略图，卡片尺寸尽量保持现状并使用内部滚动承载更多点位。
- 不改变现有 Excel 导入导出格式，不新增多图相册，不新增独立文件上传服务，不改变认证机制。

## Capabilities

### New Capabilities

- `shop-site-photos`: 商铺现场主图的服务器持久化、导入、替换、删除和预览。

### Modified Capabilities

- `data-sync-and-validation`: `/api/data` SHALL 接收、校验、保存并返回商铺现场主图字段。
- `data-viz-module`: 商业信息管理页 SHALL 在商铺编辑和悬停预览中展示现场主图能力。
- `commercial-overview-dashboard`: 经营总览站点商业趋势卡片 SHALL 展示每个商业点位信息和对应照片缩略图。

## Dependencies

- `improve-change-naming-rule-2026-06-25` 必须先合并到 `main`，因为本 change 使用日期在后的命名格式 `add-shop-site-photos-2026-06-25`。
- 执行 Agent 在 apply 本 change 前必须确认当前基线的 `openspec/config.yaml` 已采用 `<动词>-<目标>-YYYY-MM-DD` 命名规则；若仍是旧规则，必须停止并交回主脑。

## Impact

- `prisma/schema.prisma`: 为 `Shop` 增加现场主图字段。
- `prisma/migrations/<timestamp>_add_shop_site_photo/migration.sql`: 增加数据库迁移。
- `server.js`: 更新商铺读取格式、保存写入字段和 Zod 校验 schema。
- `prisma/seed.js`: 保持种子导入兼容新增字段默认值。
- `js/modules/data.js`: 确保默认数据、新增商铺、保存到本地/服务器时保留现场主图字段。
- `js/modules/viz.js`: 增加商铺照片导入、替换、删除、悬停预览和保存链路。
- `js/modules/home.js`: 扩展 `calcHomeStats()`/趋势详情渲染，让站点趋势卡片展示商铺明细和照片。
- `css/data-viz.css`: 增加照片列、照片操作按钮、商铺悬停预览浮层样式。
- `css/home-dashboard.css`: 增加趋势详情下半部分点位明细和照片缩略图样式。
- `tests/shop-schema.test.js`: 覆盖商铺照片字段校验。
- `tests/data.test.js`: 覆盖照片字段在默认数据、本地保存和 API 保存数据中保留。
- `tests/viz.test.js`: 覆盖照片导入、替换、删除、悬停预览渲染。
- `tests/integration/viz-data.test.js`: 覆盖商业信息管理页照片操作保存后数据联动。
- `tests/integration/home-dashboard.test.js`: 覆盖趋势卡片下半部分点位信息和照片缩略图。
- `tests/integration/auth-data-flow.test.js`: 覆盖 `/api/data` 保存并返回照片字段的成功往返。
- `tests/server-security.test.js`: 覆盖 `/api/data` 拒绝非法照片字段。
- `tests/e2e/data-viz-flow.test.js`: 覆盖真实页面导入/删除照片和悬停预览核心流程。

## 测试策略

依据 `openspec/testing-strategy.md` 的变更类型映射，本 change 涉及商铺数据结构、增删改类用户操作、前后端数据保存、跨页面展示联动，因此必须覆盖单元、集成和 E2E 三层测试。

- 单元测试：`tests/shop-schema.test.js`、`tests/data.test.js`、`tests/viz.test.js` 覆盖字段校验、数据保留、照片操作 DOM 逻辑和预览渲染。
- 集成测试：`tests/integration/viz-data.test.js` 覆盖商业信息管理页照片操作到 `state`/`saveData()`；`tests/integration/home-dashboard.test.js` 覆盖趋势卡片消费照片数据；`tests/integration/auth-data-flow.test.js` 覆盖 API 保存与读取成功往返；`tests/server-security.test.js` 覆盖非法照片字段拒绝。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 覆盖用户在商业信息管理页导入照片、悬停预览、删除照片的完整流程。
- 回归验证：完成后运行 `npm test`、`npm run test:e2e` 和 `node scripts/check-test-coverage.js`；若 E2E 需要预览服务，按 `openspec/testing-strategy.md` 启动本地同源服务。

## Success Criteria

- 每个商铺最多保存一张现场主图，照片随服务器数据保存，刷新页面或换设备读取同一服务器数据后仍可见。
- 商业信息管理页每个商铺均可导入/替换/删除现场照片，保存后再次进入页面照片状态保持一致。
- 鼠标悬停到商业信息管理页对应商铺行或商铺预览项时，有照片的商铺显示现场照片预览；无照片的商铺不显示空白图片浮层。
- 经营总览页站点商业趋势悬浮卡片下半部分显示该站点每个商业点位的信息，点位信息在左，照片在右。
- 趋势卡片尺寸尽量保持现有宽度和定位，不因点位数量或照片缺失明显撑大；点位过多时在卡片内部滚动。
- `/api/data` 的读取、保存和校验允许照片字段，且不会破坏现有商铺字段。
- 所有新增和相关回归测试通过，覆盖率检查通过。
