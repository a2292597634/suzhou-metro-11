## Context

当前项目的数据主链路是 `GET /api/data` / `POST /api/data`，前端通过 `state.stations` 共享数据，并在 API 不可用时回退到 `localStorage` 和 `data/default-data.json`。现有服务器保存实现会按请求进行完整同步，删除并重建商铺记录；同时前端状态没有稳定的数据库 `Shop.id`。这意味着照片若直接绑定现有 `Shop.id`，普通资料保存就可能导致照片关系断开。

用户目标包含两种运行环境：有后端和 PostgreSQL 的动态站，以及只托管静态文件的 GitHub Pages。动态站需要数据库实时显示最新图片；静态站不能访问数据库，只能显示已导出的最新静态快照。因此本 change 把照片能力设计成“数据库权威源 + 动态图片 URL + 静态快照发布”。

本 change 创建时本地 `main` 落后远端 1 个提交，且 `git pull --ff-only` 因网络或凭据卡住。执行前必须先确认基线已同步，并确认现有照片上传/预览 UI change 是否已合并。

## Directory Layout

```text
server.js
prisma/
  schema.prisma
  migrations/
    <timestamp>_add_shop_photo_storage/
      migration.sql
  seed.js
tools/
  export-static-snapshot.js
  publish-static-snapshot.js
data/
  default-data.json
  static-manifest.json
assets/
  shop-photos/
    <shopUid>-<sha256-12>.<jpg|png|webp>
js/
  modules/
    data.js
    viz.js
    home.js
tests/
  shop-photo-storage.test.js
  static-snapshot.test.js
  data.test.js
  integration/
    auth-data-flow.test.js
    viz-data.test.js
    home-dashboard.test.js
  e2e/
    data-viz-flow.test.js
openspec/
  changes/
    add-photo-database-static-publish-2026-07-01/
      proposal.md
      design.md
      specs/
        shop-photo-storage/spec.md
        static-photo-snapshot-publish/spec.md
        data-sync-and-validation/spec.md
        data-viz-module/spec.md
        commercial-overview-dashboard/spec.md
        module-data/spec.md
      tasks.md
```

## Goals / Non-Goals

**Goals:**

- 为每个商铺建立稳定 `shopUid`，让照片不受普通资料保存时商铺重建影响。
- 使用 `ShopPhoto` 存储一铺一张现场主图的二进制内容和元数据。
- 使用照片专用 API 管理上传、替换、删除和读取，避免 `/api/data` 承载图片内容。
- 动态站通过数据库图片 URL 显示最新照片。
- GitHub Pages 通过导出的 `default-data.json`、`static-manifest.json` 和 `assets/shop-photos/*` 显示最新已发布照片。
- 静态发布失败不回滚数据库保存，并能显示失败状态和重试入口。
- 静态站加载时处理 `localStorage` 与新快照版本冲突。

**Non-Goals:**

- 不做多图相册、图片排序、图片标题、图片裁剪 UI 或批量图片管理后台。
- 不引入新的图片处理依赖；首版不强制服务端转 WebP，静态导出保留原始 JPEG/PNG/WebP 格式。
- 不把 GitHub token 写入仓库、前端或数据库明文字段。
- 不允许 Web 端请求直接执行未配置目标分支的 git push。
- 不改变 Excel 导入导出表头，不把图片内容写入 Excel。

## Decisions

### 1. 使用 `shopUid` 作为商铺稳定身份

`Shop` 新增 `shopUid String @unique @default(uuid())`。前端、`default-data.json` 和静态快照都携带 `shopUid`。`POST /api/data` 保存商铺时优先按 `shopUid` 查找并更新，缺失时生成新 `shopUid`。

原因：现有 `Shop.id` 没有暴露给前端，且保存时会删除并重建商铺；`shortNo` 又存在“待定”和人工调整风险。`shopUid` 是专门用于跨保存、跨快照和跨静态站引用的稳定业务身份。

替代方案：使用 `shortNo` 或数据库 `Shop.id`。前者不唯一且会变；后者当前不是前端契约，且受重建影响。

### 2. 图片内容进入 `ShopPhoto`，`Shop.photo` 只做兼容迁移

新增 `ShopPhoto`，按 `shopUid` 一对一关联，字段包括 `id`、`shopUid`、`mimeType`、`byteSize`、`sha256`、`content Bytes`、`publishedStaticPath`、`publishedSha256`、`publishedAt`、`createdAt`、`updatedAt`。

`Shop.photo` 若已存在，首版只作为迁移输入或兼容输出来源；新写入不得再通过 `Shop.photo` 存储 Data URL。

原因：Data URL 会放大 `/api/data` 请求体、`localStorage` 和静态 JSON，也让 Git diff 极难审查。独立照片表让普通资料和图片生命周期解耦。

替代方案：继续用 `Shop.photo` 文本字段保存 Data URL。该方案实现快，但无法满足静态站图片文件发布和大规模维护需求。

### 3. 照片 API 独立于 `/api/data`

新增：

- `PUT /api/shops/:shopUid/photo`
- `DELETE /api/shops/:shopUid/photo`
- `GET /api/shop-photos/:shopUid`
- `GET /api/static-publish/status`
- `POST /api/static-publish/request`

上传使用 `multipart/form-data`，字段名为 `photo`，最大 2MB，仅允许 JPEG、PNG、WebP。服务端校验 MIME 和 magic bytes；计算 `sha256`；重复内容允许幂等成功。

原因：图片是大对象，不适合跟随全量 JSON 保存。独立 API 也能单独做认证、限流、错误提示和 E2E。

替代方案：继续随 `/api/data` 保存。该方案会让一次普通编辑携带所有图片，带来体积、冲突和失败体验问题。

### 4. `/api/data` 返回轻量照片引用

`GET /api/data` 对每个商铺返回：

```json
{
  "shopUid": "shop_abc123",
  "photo": "/api/shop-photos/shop_abc123?v=8f4e2c9a1b23",
  "photoHash": "8f4e2c9a1b23..."
}
```

无照片时 `photo` 和 `photoHash` 均为空字符串。`POST /api/data` 接受 `shopUid`，但拒绝非空 Data URL 图片内容写入 `shops[].photo`。

原因：前端渲染仍可使用 `shop.photo` 作为 `<img src>`，但它变成 URL 而不是内容。

替代方案：新增 `photoUrl` 字段并删除 `photo`。该方案更清晰，但会扩大前端改动；本 change 保留 `photo` 作为展示 URL 以降低迁移成本。

### 5. 静态快照导出是派生产物

`tools/export-static-snapshot.js` 从数据库读取当前数据，生成：

- `data/default-data.json`
- `data/static-manifest.json`
- `assets/shop-photos/<shopUid>-<sha256-12>.<ext>`

manifest 包含：

```json
{
  "snapshotId": "2026-07-01T03:30:00.000Z-8f4e2c9a1b23",
  "generatedAt": "2026-07-01T03:30:00.000Z",
  "dataHash": "8f4e2c9a1b23...",
  "photoCount": 12
}
```

原因：GitHub Pages 只能读取仓库中已提交的静态文件，不能实时访问数据库。快照必须是可重复生成、可校验、可提交的派生产物。

替代方案：在静态站从外部对象存储加载图片。该方案需要新增外部服务和访问控制，不符合当前“git 静态网站”的约束。

### 6. 发布到 GitHub 使用显式脚本和可观测状态

`tools/publish-static-snapshot.js` 调用导出脚本后，将变更提交到配置的静态发布分支，例如 `static-site` 或 `gh-pages`。脚本必须要求显式环境变量：

- `STATIC_PUBLISH_BRANCH`
- `STATIC_PUBLISH_REMOTE`
- `STATIC_PUBLISH_AUTHOR_NAME`
- `STATIC_PUBLISH_AUTHOR_EMAIL`

Web 保存只标记发布待处理；如果提供 `POST /api/static-publish/request`，它只创建发布请求或运行受控脚本，不得在缺少上述配置时 push。

原因：自动推送会涉及凭据、分支和审计。显式脚本让执行 Agent 和 CI 能验证 dry-run，也避免普通请求误触发 git 操作。

替代方案：图片上传成功后立即在请求内 git commit/push。该方案延迟高、失败面大，且会把数据库事务和 GitHub 网络状态绑在一起。

### 7. 静态站必须比较 manifest 与 localStorage

`js/modules/data.js` 在 API 不可用时先读取 `data/static-manifest.json`，再判断 `localStorage` 的 `snapshotId`。若远端静态快照更新，默认加载新 `default-data.json` 并保留旧本地数据备份；若用户已有未发布本地修改，页面必须给出中文提示。

原因：当前静态站加载顺序是 `localStorage` 优先于默认 JSON。没有版本机制时，旧浏览器缓存会静默覆盖新提交图片。

替代方案：完全禁用 localStorage。该方案会破坏静态站离线编辑和现有 Excel 降级导入体验。

## Risks / Trade-offs

- [Risk] 数据库中存储图片二进制会增大备份体积。Mitigation: 限制单图 2MB、一铺一图，并记录 byteSize 和 photoCount 便于评估后续对象存储 change。
- [Risk] `shopUid` 回填可能因旧默认数据无稳定 ID 导致初次导出路径变化。Mitigation: 迁移后立即导出一次静态快照，并将 `shopUid` 写入 `default-data.json`。
- [Risk] 发布脚本误推到业务开发分支。Mitigation: 强制要求 `STATIC_PUBLISH_BRANCH`，并拒绝 `main`、`codex/*` 作为默认静态发布分支，除非用户显式确认。
- [Risk] localStorage 版本策略可能覆盖用户未发布本地修改。Mitigation: 只在 `snapshotId` 变化时提示并备份旧 localStorage，不直接删除。
- [Risk] 现有照片 UI change 未合并时任务范围变大。Mitigation: 执行前检查目标基线；若 UI 不存在，本 change 明确接管 `viz.js` 照片 UI 接线。
- [Risk] GitHub Pages 部署有延迟。Mitigation: UI 文案使用“静态站发布中/已发布/发布失败”，不承诺实时生效。

## Migration Plan

1. 同步最新 `main`，确认当前照片上传/预览 change 是否已合并；未合并时更新本 change 的执行范围或依赖。
2. 新增 Prisma 迁移：为 `Shop` 增加 `shopUid` 并回填，为 `ShopPhoto` 和发布状态建表。
3. 更新 seed 和 `/api/data`：返回并保存 `shopUid`，照片内容不再进入 JSON 数据保存链路。
4. 新增照片 API 和图片校验工具，完成上传、读取、替换、删除。
5. 更新商业信息管理页照片操作和首页照片渲染。
6. 新增静态快照导出脚本，生成 manifest、default-data 和图片资产。
7. 新增静态发布脚本和状态查询，支持 dry-run 与失败重试。
8. 更新 `data.js` 静态 manifest / localStorage 版本处理。
9. 完成单元、集成、E2E、覆盖检查和 OpenSpec 校验。

Rollback：回退本 change 的代码和迁移；如已迁移数据库，保留 `shopUid` 字段无害，`ShopPhoto` 可在备份后删除。静态发布分支的快照提交可用普通 revert 回退，不得强制 push。

## 测试架构设计

- 单元测试：
  - `tests/shop-photo-storage.test.js`: 图片类型、magic bytes、大小、哈希、URL 构造。
  - `tests/static-snapshot.test.js`: 快照转换、manifest、文件命名、缺失图片引用检查。
  - `tests/data.test.js`: manifest 与 localStorage 版本处理、API 不可用回退。
- 集成测试：
  - `tests/integration/auth-data-flow.test.js`: `/api/data` 保存后 `shopUid` 稳定且照片关系不丢。
  - `tests/integration/viz-data.test.js`: `viz.js` 调用照片 API 并处理上传/删除/发布状态。
  - `tests/integration/home-dashboard.test.js`: 首页渲染动态 URL、静态路径和缺图占位。
- E2E 测试：
  - `tests/e2e/data-viz-flow.test.js`: 上传照片、刷新保留、删除照片、静态快照导出后路径可访问。
- 需要 mock：
  - 单元/集成中的 `fetch`、`FileReader`、`localStorage`、`FormData`、`crypto` 固定时间或 hash、受控 filesystem 临时目录。
- 不需要 mock：
  - E2E 中的浏览器文件选择、真实 `/api/data`、真实照片 API、测试 PostgreSQL。
- CI：
  - `.github/workflows/test.yml` 继续跑 PostgreSQL 服务；新增快照脚本 dry-run 测试，不在 CI 中真实 push。

## Open Questions

- 静态发布分支最终使用 `gh-pages` 还是 `static-site`？本设计默认由 `STATIC_PUBLISH_BRANCH` 显式指定，不在代码中硬编码。
- 静态发布是否由管理员手动运行 CLI，还是由服务端创建 pending job 后由外部 runner 拉取执行？本 change 首版允许 CLI 和受控服务端请求，但禁止无配置直接 push。
- 是否需要迁移历史 Data URL 到 `ShopPhoto`？若执行基线中已存在 Data URL，执行 Agent 必须先做迁移脚本；若尚未合并，则跳过历史迁移。
- GitHub Pages 使用哪个路径作为站点根目录？若不是仓库根目录，快照脚本必须支持 `STATIC_EXPORT_ROOT`。
