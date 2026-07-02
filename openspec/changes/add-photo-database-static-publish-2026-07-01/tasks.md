## 0. 开工门禁与基线确认

- [x] 0.1 执行 `git status --short --branch`，确认位于 `codex/add-photo-database-static-publish-2026-07-01` 且工作区状态可解释
- [x] 0.2 重新同步最新 `main` 或记录无法同步的具体原因，确认本 change 基于目标最新代码
- [x] 0.3 确认当前照片上传/预览 UI change 是否已合并；若未合并，记录本 change 接管 `viz.js` 照片 UI 接线
- [x] 0.4 运行 `npm run setup` 或确认 OpenSpec CLI 与 `package.json` 锁定版本一致
- [x] 0.5 完整读取本 change 的 proposal、design、全部 specs、tasks、`docs/agent/collaboration.md` 和 `openspec/testing-strategy.md`
- [x] 0.6 输出开工回执，声明允许范围、禁止范围、依赖和必须执行测试

## 1. 商铺稳定身份与数据库模型测试（Red）

- [x] 1.1 在 `tests/shop-photo-storage.test.js` 编写 `shopUid` 迁移/生成/唯一性测试（Red）
- [x] 1.2 在 `tests/integration/auth-data-flow.test.js` 编写普通 `/api/data` 保存不丢失 `ShopPhoto` 的集成测试（Red）
- [x] 1.3 在 `tests/shop-photo-storage.test.js` 编写 `ShopPhoto` 一铺一图、字段完整和 hash 元数据测试（Red）
- [x] 1.4 运行 `npx vitest run tests/shop-photo-storage.test.js tests/integration/auth-data-flow.test.js`，确认新增测试失败

## 1.T 商铺稳定身份与数据库模型实现

- [x] 1.T.1 更新 `prisma/schema.prisma`，新增 `Shop.shopUid`、`ShopPhoto` 和发布状态所需模型/字段
- [x] 1.T.2 新增 Prisma migration，回填已有商铺 `shopUid` 并建立唯一约束
- [x] 1.T.3 更新 `prisma/seed.js`，写入默认数据时生成或保留 `shopUid`
- [x] 1.T.4 更新 `/api/data` 保存逻辑，按 `shopUid` 更新/创建商铺并保留照片关系
- [x] 1.T.5 运行 1.4 定向测试，确认数据库模型相关测试通过（Green）
- [x] 1.T.6 在测试保护下整理商铺 upsert 和照片关系保留代码（Refactor）

## 2. 照片 API 与安全校验测试（Red）

- [x] 2.1 在 `tests/shop-photo-storage.test.js` 编写 JPEG/PNG/WebP magic bytes、MIME、大小和 sha256 测试（Red）
- [x] 2.2 在 `tests/integration/auth-data-flow.test.js` 编写 `PUT /api/shops/:shopUid/photo` 上传成功测试（Red）
- [x] 2.3 编写未认证上传、伪装 MIME、超大文件、GIF/SVG/HTML 被拒绝测试（Red）
- [x] 2.4 编写 `GET /api/shop-photos/:shopUid` 返回二进制、Content-Type、ETag 和 404 测试（Red）
- [x] 2.5 编写 `DELETE /api/shops/:shopUid/photo` 删除成功和未认证拒绝测试（Red）
- [x] 2.6 编写 `/api/data` 拒绝 Data URL 写入 `shops[].photo` 的测试（Red）
- [x] 2.7 运行照片 API 定向测试，确认新增测试失败

## 2.T 照片 API 与安全校验实现

- [x] 2.T.1 在 `server.js` 新增照片文件校验工具：大小、MIME、magic bytes、sha256、扩展名映射
- [x] 2.T.2 新增 `PUT /api/shops/:shopUid/photo`，要求认证、限流和 `multipart/form-data` 字段 `photo`
- [x] 2.T.3 新增 `GET /api/shop-photos/:shopUid`，返回二进制、`Content-Type`、`Cache-Control` 和 `ETag`
- [x] 2.T.4 新增 `DELETE /api/shops/:shopUid/photo`，要求认证和限流
- [x] 2.T.5 更新 `/api/data` schema，拒绝 Data URL 图片内容并允许服务端生成的轻量照片 URL
- [x] 2.T.6 运行 2.7 定向测试，确认照片 API 测试通过（Green）
- [x] 2.T.7 在测试保护下整理照片 API 错误响应中文文案（Refactor）

## 3. 静态快照导出测试（Red）

- [x] 3.1 在 `tests/static-snapshot.test.js` 编写导出 `data/default-data.json` 和 `data/static-manifest.json` 的测试（Red）
- [x] 3.2 编写静态图片文件名 `<shopUid>-<sha256-12>.<jpg|png|webp>` 测试（Red）
- [x] 3.3 编写 `default-data.json` 中所有非空照片路径均对应存在文件的测试（Red）
- [x] 3.4 编写 manifest 包含 `snapshotId`、`generatedAt`、`dataHash`、`photoCount` 和 photos 清单测试（Red）
- [x] 3.5 运行 `npx vitest run tests/static-snapshot.test.js`，确认新增测试失败

## 3.T 静态快照导出实现

- [x] 3.T.1 新增 `tools/export-static-snapshot.js`，从 Prisma 读取站点、商铺、分级和照片
- [x] 3.T.2 导出 `assets/shop-photos/<shopUid>-<sha256-12>.<ext>`，保留 JPEG/PNG/WebP 原格式
- [x] 3.T.3 导出包含 `snapshotId`、`shopUid`、`photo`、`photoHash` 的 `data/default-data.json`
- [x] 3.T.4 导出 `data/static-manifest.json`，包含快照和图片清单元数据
- [x] 3.T.5 清理未被当前快照引用的旧 `assets/shop-photos/*` 文件，且不得删除目录外文件
- [x] 3.T.6 运行 3.5 定向测试，确认静态导出测试通过（Green）
- [x] 3.T.7 在测试保护下整理导出脚本为可复用函数并保留 CLI 入口（Refactor）

## 4. 静态发布脚本与发布状态测试（Red）

- [x] 4.1 在 `tests/static-snapshot.test.js` 编写 `publish-static-snapshot.js --dry-run` 不 commit、不 push 测试（Red）
- [x] 4.2 编写缺少 `STATIC_PUBLISH_BRANCH` 等配置时拒绝发布测试（Red）
- [x] 4.3 编写拒绝默认推送到 `main` 或 `codex/*` 分支的测试（Red）
- [x] 4.4 在集成测试中编写发布失败不回滚数据库照片、状态为 `failed` 的测试（Red）
- [x] 4.5 编写 `POST /api/static-publish/request` 创建 `pending` 状态测试（Red）
- [x] 4.6 运行发布相关定向测试，确认新增测试失败

## 4.T 静态发布脚本与发布状态实现

- [x] 4.T.1 新增 `tools/publish-static-snapshot.js`，要求显式发布环境变量并调用导出脚本
- [x] 4.T.2 实现 `--dry-run`，只验证文件和展示将发布的变更，不 commit、不 push
- [x] 4.T.3 实现发布分支安全检查，默认拒绝 `main` 和 `codex/*`
- [x] 4.T.4 在 `server.js` 新增发布状态查询 `GET /api/static-publish/status`
- [x] 4.T.5 在 `server.js` 新增受认证保护的 `POST /api/static-publish/request`
- [x] 4.T.6 记录 `idle`、`pending`、`running`、`success`、`failed` 状态和失败原因
- [x] 4.T.7 运行 4.6 定向测试，确认发布脚本和状态测试通过（Green）
- [x] 4.T.8 在测试保护下整理发布状态存储和错误信息（Refactor）

## 5. data.js 静态 manifest 与 localStorage 测试（Red）

- [x] 5.1 在 `tests/data.test.js` 编写 API 不可达且 manifest 不存在时沿用 localStorage 的测试（Red）
- [x] 5.2 编写 manifest `snapshotId` 与 localStorage 相同时使用 localStorage 的测试（Red）
- [x] 5.3 编写 manifest `snapshotId` 更新时加载 `default-data.json` 并备份旧 localStorage 的测试（Red）
- [x] 5.4 编写 `loadData()` 返回 `{ source: "static-snapshot", snapshotUpdated: true }` 的测试（Red）
- [x] 5.5 编写 `saveToLocal()` 保存当前 `snapshotId` 的测试（Red）
- [x] 5.6 运行 `npx vitest run tests/data.test.js`，确认新增测试失败

## 5.T data.js 静态 manifest 与 localStorage 实现

- [x] 5.T.1 更新 `js/modules/data.js`，API 不可达时先读取 `/data/static-manifest.json`
- [x] 5.T.2 实现 manifest 与 localStorage `snapshotId` 比较逻辑
- [x] 5.T.3 实现旧 localStorage 备份到 `suzhou_m11_battle_map_data_v4_backup_<oldSnapshotId>`
- [x] 5.T.4 实现 `static-snapshot` 数据来源事件和 `loadData()` 返回值
- [x] 5.T.5 更新 `saveToLocal()`，保存当前 `snapshotId`
- [x] 5.T.6 运行 5.6 定向测试，确认 data.js 测试通过（Green）
- [x] 5.T.7 在测试保护下整理数据来源通知和错误回退路径（Refactor）

## 6. data-viz 照片管理与发布状态测试（Red）

- [x] 6.1 在 `tests/viz.test.js` 编写照片按钮渲染动态 URL、静态路径和无照片占位测试（Red）
- [x] 6.2 在 `tests/integration/viz-data.test.js` 编写上传照片调用 `PUT /api/shops/:shopUid/photo` 的测试（Red）
- [x] 6.3 编写删除照片调用 `DELETE /api/shops/:shopUid/photo` 的测试（Red）
- [x] 6.4 编写上传失败、401、400 不误报成功的测试（Red）
- [x] 6.5 编写静态发布状态展示和重试调用 `POST /api/static-publish/request` 的测试（Red）
- [x] 6.6 运行 `npx vitest run tests/viz.test.js tests/integration/viz-data.test.js`，确认新增测试失败

## 6.T data-viz 照片管理与发布状态实现

- [x] 6.T.1 更新 `js/modules/viz.js`，确保新商铺有 `shopUid` 或在保存后回填
- [x] 6.T.2 将照片导入/替换改为 `FormData` 调用照片 API，成功后更新 `photo` 和 `photoHash`
- [x] 6.T.3 将删除照片改为调用照片 API，成功后清空 `photo` 和 `photoHash`
- [x] 6.T.4 显示上传、删除、认证、校验和网络错误的中文 toast
- [x] 6.T.5 增加静态发布状态查询、失败提示和重试操作
- [x] 6.T.6 保持照片悬停预览兼容 `/api/shop-photos/*` 与 `/assets/shop-photos/*`
- [x] 6.T.7 运行 6.6 定向测试，确认 data-viz 测试通过（Green）
- [x] 6.T.8 在测试保护下整理照片操作函数和 UI 状态（Refactor）

## 7. 首页经营总览照片展示测试（Red）

- [x] 7.1 在 `tests/integration/home-dashboard.test.js` 编写动态 `/api/shop-photos/*` 图片路径渲染测试（Red）
- [x] 7.2 编写静态 `/assets/shop-photos/*` 图片路径渲染测试（Red）
- [x] 7.3 编写无照片时不渲染 `src=""`、不破图的测试（Red）
- [x] 7.4 编写静态快照更新后首页使用新照片路径的测试（Red）
- [x] 7.5 运行 `npx vitest run tests/integration/home-dashboard.test.js`，确认新增测试失败

## 7.T 首页经营总览照片展示实现

- [x] 7.T.1 更新 `js/modules/home.js`，支持动态和静态照片路径
- [x] 7.T.2 确保首页缺图时显示紧凑占位且不渲染空图片
- [x] 7.T.3 确保首页使用 `loadData()` 的静态快照更新结果重新渲染
- [x] 7.T.4 运行 7.5 定向测试，确认首页照片展示测试通过（Green）
- [x] 7.T.5 在测试保护下整理图片 alt 文案和占位样式（Refactor）

## 8. E2E 用户流程测试（Red）

- [x] 8.1 在 `tests/e2e/data-viz-flow.test.js` 准备小型 JPEG/PNG/WebP fixture 或运行时生成文件
- [x] 8.2 编写真实页面上传照片、保存、刷新后仍显示照片的 E2E 测试（Red）
- [x] 8.3 编写删除照片、刷新后照片清空且不显示预览的 E2E 测试（Red）
- [x] 8.4 编写静态快照导出后静态路径可访问的 E2E 或同源预览测试（Red）
- [x] 8.5 运行 `npm run test:e2e`，确认新增 E2E 在实现前失败

## 8.T E2E 用户流程实现收口

- [x] 8.T.1 根据 E2E 暴露问题补齐登录、文件选择、刷新和状态等待逻辑
- [x] 8.T.2 确认 E2E 不 mock 页面业务逻辑、照片 API 或 `/api/data`
- [x] 8.T.3 运行 `npm run test:e2e`，确认照片完整流程通过（Green）
- [x] 8.T.4 在测试保护下整理 E2E fixture 和等待条件（Refactor）

## 9. 回归验证与交付检查

- [x] 9.1 运行定向测试：`npx vitest run tests/shop-photo-storage.test.js tests/static-snapshot.test.js tests/data.test.js tests/viz.test.js tests/integration/auth-data-flow.test.js tests/integration/viz-data.test.js tests/integration/home-dashboard.test.js`
- [x] 9.2 运行完整非 E2E 回归：`npm test`
- [x] 9.3 运行 E2E：`npm run test:e2e`
- [x] 9.4 运行覆盖检查：`node scripts/check-test-coverage.js`
- [x] 9.5 运行 OpenSpec 校验：`npm exec -- openspec validate --changes --strict --no-interactive`
- [x] 9.6 运行静态导出 dry-run 和发布 dry-run，确认不会 commit 或 push
- [x] 9.7 重读 proposal、design、全部 specs 和 tasks，确认实现未越界且 artifacts 一致
- [x] 9.8 输出完工报告，列出数据库迁移、API 变化、静态发布配置、测试命令和已知风险

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [x] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [x] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [x] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

### 阶段二：Apply（实施阶段）

- [x] **TDD 顺序已遵守**：每个功能点执行了 Red → Green → Refactor
- [x] **单元测试已编写**：每个新增/修改的模块都有对应的 `tests/<模块名>.test.js`
- [x] **集成测试已编写**（如涉及多模块联动）：有 `tests/integration/<场景>.test.js`
- [x] **E2E 测试已编写**（如涉及页面/核心流程）：有 `tests/e2e/<场景>.test.js`
- [x] **测试命名规范**：测试文件命名符合 `tests/<模块名>.test.js` 或 `tests/<层级>/<场景>.test.js`
- [x] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言（如「应该从无文件名路径解析首页」）

### 阶段三：验证阶段

- [x] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [x] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`，输出「所有模块均已覆盖」
- [x] **无测试作弊**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [x] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [ ] **测试文件已提交**：所有测试文件已纳入 git 版本控制
- [x] **CI 脚本已更新**（如有）：package.json 的 test 脚本能正确运行新增测试
- [x] **文档已更新**：如测试策略或基础设施有变化，已同步更新 `openspec/testing-strategy.md`

---

## 豁免规则

以下情况可以豁免部分或全部测试，但必须在 change 中明确标注并说明理由：

| 豁免场景 | 可豁免的测试 | 必须做的 | 标注位置 |
|---------|------------|---------|---------|
| 纯 CSS 样式调整（颜色、间距、圆角） | 全部 | 手动视觉验证 | tasks.md 顶部 |
| 纯文案/标点修改 | 全部 | 手动阅读确认 | tasks.md 顶部 |
| 配置文件修改（不涉及逻辑） | 全部 | 配置生效验证 | tasks.md 顶部 |
| 已有模块的微小重构（无行为变更） | E2E | 单元测试需全部通过 | tasks.md 对应任务旁 |

> **注意**：豁免不等于跳过验证。即使豁免测试，也必须通过其他方式确认变更正确。
