## Why

`add-shop-site-photos-2026-06-25` 已实现商铺现场照片能力，但 review 发现实现与 artifacts 存在关键偏差：真实 Data URL 照片可能被后端 500 字符上限拒绝，保存失败会被 UI 显示为成功，默认数据引用了未提交图片资源，并且新增了原设计明确排除的独立上传接口。

本 change 用独立修复切片消除这些 blocker，确保照片功能在合并前回到原 proposal/design/specs 的边界内。

## What Changes

- 将 `server.js` 的 `shops[].photo` 校验恢复为只允许空字符串或合法 `data:image/(jpeg|png|webp);base64,` Data URL，最大长度 3_000_000。
- 移除未授权范围内的 `/api/upload-photo`、照片专用 multer 配置和 `/assets/shop-photos/*` 路径白名单。
- 清理 `data/default-data.json` 中未提交的 `assets/shop-photos` 照片路径，避免默认数据破图。
- 修正商业信息管理页保存反馈：`saveData()` 返回失败时显示失败原因，不得显示成功提示。
- 补齐单元、集成和 E2E 测试，覆盖照片导入、保存、刷新、悬停预览和删除。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `shop-site-photos`: 明确现场主图首版只通过 `photo` Data URL 字段管理，不允许静态路径或独立上传接口混入。
- `data-sync-and-validation`: `/api/data` 的 `shops[].photo` 校验使用 3_000_000 字符上限，并拒绝 `/assets/shop-photos/*` 等路径型值。
- `data-viz-module`: 商业信息管理页在照片保存失败时显示失败状态，并通过 E2E 覆盖完整照片流程。

## Impact

- `server.js`: 调整 `shopSchema.photo` 校验；删除 `/api/upload-photo` 和照片专用 multer 配置。
- `data/default-data.json`: 删除未提交静态图片路径，将相关 `photo` 值恢复为空字符串或移除字段。
- `js/modules/viz.js`: 修正 `saveCard()` 对 `saveData()` 失败结果的处理与提示。
- `tests/shop-schema.test.js`: 覆盖合法长 Data URL、路径型值拒绝和长度边界。
- `tests/integration/auth-data-flow.test.js`: 覆盖 `/api/data` 保存 500 字符以上合法照片字段。
- `tests/server-security.test.js`: 覆盖 `/api/data` 拒绝 `/assets/shop-photos/*` 路径型照片值。
- `tests/viz.test.js` 或 `tests/integration/viz-data.test.js`: 覆盖保存失败不显示成功提示。
- `tests/e2e/data-viz-flow.test.js`: 覆盖照片导入、保存、悬停预览、删除和刷新后状态。

## 测试策略

依据 `openspec/testing-strategy.md`，本 change 修复数据校验、用户增删改流程和跨前后端保存链路，必须覆盖单元、集成和 E2E 三层测试。

- 单元测试：`tests/shop-schema.test.js` 覆盖照片 schema 边界；`tests/viz.test.js` 覆盖保存失败提示。
- 集成测试：`tests/integration/auth-data-flow.test.js`、`tests/server-security.test.js`、`tests/integration/viz-data.test.js` 覆盖 API 往返、安全拒绝和 UI 保存失败。
- E2E 测试：`tests/e2e/data-viz-flow.test.js` 覆盖真实页面导入照片、保存、悬停预览、删除和刷新后状态一致。
- 回归验证：运行定向测试、`npm test`、`npm run test:e2e` 和 `node scripts/check-test-coverage.js`。

## Success Criteria

- 合法 JPEG/PNG/WebP Data URL 可以通过 `/api/data` 保存，不会因超过 500 字符被拒绝。
- `/api/data` 拒绝 `/assets/shop-photos/*.png` 等路径型照片值。
- 代码中不存在 `/api/upload-photo` 端点和照片专用上传存储配置。
- 默认数据不再引用未提交的 `assets/shop-photos` 图片文件。
- `saveData()` 返回失败时，商业信息管理页不显示成功提示。
- E2E 覆盖照片导入、保存、悬停预览、删除和刷新后状态。
- 定向测试、完整非 E2E 回归、E2E 和覆盖检查全部通过。

## Review 修复追加（2026-07-01）

- `saveCard` 由模块私有函数改为 `export function saveCard`，使测试可直接导入并调用真实实现。
- `tests/integration/viz-data.test.js` 中两项 saveCard 反馈测试改为调用真实 `showToast` 并断言 DOM toast 文案，不再 mock 自身业务逻辑。
- `tests/e2e/data-viz-flow.test.js` 新增照片完整流程 E2E：fixture 验证、Puppeteer fileChooser 真实 FileReader 导入、鼠标悬停预览浮层、删除照片、保存后刷新验证。`PORT=4173 npm run test:e2e` 9/9 passed。
- `tasks.md` 全部项目已勾选（含 E2E 任务组 5.x/5.T.x 和测试检查清单），E2E Red/Green 在实际环境中完成验证。
- Docker PostgreSQL（`docker compose up -d postgres`）已启动，`npm test` 24 files / 368 passed。
