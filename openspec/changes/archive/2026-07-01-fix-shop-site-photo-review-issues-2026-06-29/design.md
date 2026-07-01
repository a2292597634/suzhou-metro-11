## Context

当前照片 change 已把 `photo` 字段接入 Prisma、`/api/data`、商业信息管理页和经营总览页。review 发现实现混入了两个不一致方案：前端导入走 `FileReader.readAsDataURL()`，但服务端又新增 `/api/upload-photo` 和 `/assets/shop-photos/*` 路径白名单；同时真实 `server.js` 将 `photo` 限制为 500 字符，无法承载规格要求的 Data URL。

本修复 change 依赖 `add-shop-site-photos-2026-06-25`，目标是在合并前恢复原设计边界：每商铺一张现场主图，首版只通过 `/api/data` 保存 Data URL，不新增独立上传服务，不提交未声明静态照片资源。

## Directory Layout

```text
server.js
data/
  default-data.json
js/
  modules/
    viz.js
tests/
  shop-schema.test.js
  viz.test.js
  integration/
    auth-data-flow.test.js
    server-security.test.js
    viz-data.test.js
  e2e/
    data-viz-flow.test.js
```

## Goals / Non-Goals

**Goals:**

- 让 `server.js` 的 `photo` 校验与 spec 一致：空字符串或合法图片 Data URL，最大 3_000_000 字符。
- 移除照片独立上传端点和路径型照片白名单。
- 清理默认数据中的未提交图片路径，防止默认页面破图。
- 修正商业信息管理页保存失败反馈。
- 补齐真实 E2E 和 500 字符以上合法 Data URL 的后端往返测试。

**Non-Goals:**

- 不引入 `/api/upload-photo`、文件存储目录、静态照片资源管理或图片清理策略。
- 不改变 Prisma 数据模型；`Shop.photo` 字段继续保留。
- 不新增照片压缩、裁剪、多图相册、图片标题或 Excel 照片导入导出。
- 不重构 data-viz 页面整体布局或经营总览趋势图结构。

## Decisions

### 1. 恢复 Data URL 单字段方案

`photo` 字段继续保存图片 Data URL。服务端 schema 只接受空字符串或 `data:image/(jpeg|png|webp);base64,` 前缀，最大长度为 3_000_000 字符。

原因：这是原照片 change 的明确设计，且前端导入已经使用 `FileReader.readAsDataURL()`。500 字符上限会拒绝几乎所有真实图片；路径型值会引入文件生命周期问题。

### 2. 删除未授权上传 API

移除 `uploadPhoto` multer 配置和 `POST /api/upload-photo` 路由。前端不调用该路由，保留它只会扩大攻击面并与 Non-Goals 冲突。

### 3. 默认数据不携带缺失照片路径

将 `data/default-data.json` 中所有 `/assets/shop-photos/*.png` 照片值恢复为空字符串或移除 `photo` 字段，让页面按无照片状态渲染。

### 4. 保存反馈必须基于 `saveData().success`

`saveCard()` 调用 `saveData()` 后必须先判断 `result.success`。失败时显示 `result.error`、`needLogin` 或 `conflict` 对应中文错误提示；成功时才显示保存成功。

## Risks / Trade-offs

- [Risk] 3_000_000 字符 Data URL 仍可能让 `/api/data` 请求体接近 10MB。Mitigation: 保留前端 2MB 原文件限制，并用集成测试覆盖合法中等长度 Data URL。
- [Risk] 清理默认照片路径后，经营总览默认数据不会展示现场缩略图。Mitigation: 符合“无照片不破图”的安全回退；真实照片由用户导入并保存。
- [Risk] 删除上传 API 可能影响未记录的手工调用者。Mitigation: 该端点不在 artifacts、README 和前端调用链中，属于未授权范围。
- [Risk] E2E 需要可写测试数据库和认证状态。Mitigation: 使用 `.env.test`、`tests/globalSetup.js` 和小型测试图片 fixture。

## Migration Plan

1. 先写失败测试，证明当前实现拒绝 500 字符以上合法 Data URL、接受路径型值、保存失败误报成功、E2E 未覆盖照片完整流程。
2. 更新 `server.js`，删除上传端点和路径白名单，将 `photo` schema 改为 3_000_000 字符 Data URL 规则。
3. 清理 `data/default-data.json` 的 `/assets/shop-photos/*` 引用。
4. 更新 `js/modules/viz.js` 的保存结果处理。
5. 补齐 E2E 照片流程，并运行定向测试、`npm test`、`npm run test:e2e`、覆盖检查。

Rollback：回退本修复 change 的 `server.js`、`data/default-data.json`、`js/modules/viz.js` 和测试修改；不需要数据库迁移回滚。

## 测试架构设计

- `tests/shop-schema.test.js`: 覆盖空字符串、合法短 Data URL、合法 500 字符以上 Data URL、3_000_000 超限、路径型值拒绝。
- `tests/integration/auth-data-flow.test.js`: 使用测试数据库覆盖 500 字符以上合法 Data URL 成功往返。
- `tests/server-security.test.js`: 覆盖 `/assets/shop-photos/*.png` 路径型照片值返回 400。
- `tests/viz.test.js` 或 `tests/integration/viz-data.test.js`: mock `saveData()` 返回失败，验证 UI 显示失败提示且不显示成功文案。
- `tests/e2e/data-viz-flow.test.js`: 使用 Puppeteer 和小型测试图片覆盖导入、保存、刷新、悬停预览、删除、再次刷新。
- 需要 mock：单元/集成测试中的 `fetch`、`FileReader`、`confirm`、`localStorage`、必要 DOM 布局 API。
- 不需要 mock：E2E 中的页面渲染、文件选择、`/api/data` 保存、PostgreSQL 测试库。

## Open Questions

- E2E 测试是否使用真实登录 Cookie 还是 Bearer Token 辅助接口？本 change 默认沿用现有登录流程或测试环境认证方式，不新增测试专用后门。
- 清理 `data/default-data.json` 时是删除 `photo` 字段还是保留 `photo: ""`？本 change 默认优先保留空字符串，减少默认数据形状差异。
- 是否需要后续单独 change 设计静态照片库或上传服务？本 change 默认不处理，若业务确实需要路径型照片，必须另开上传服务 change。
