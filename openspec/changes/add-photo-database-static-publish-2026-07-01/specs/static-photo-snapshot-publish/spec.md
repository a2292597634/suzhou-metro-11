## ADDED Requirements

### Requirement: 静态快照导出
系统 SHALL 提供 `tools/export-static-snapshot.js`，从 PostgreSQL 读取当前站点、商铺、分级信息和 `ShopPhoto`，导出 GitHub Pages 可直接读取的静态文件。

#### Scenario: 导出静态快照
- **WHEN** 执行 `node tools/export-static-snapshot.js`
- **THEN** 脚本生成 `data/default-data.json`
- **AND** 脚本生成 `data/static-manifest.json`
- **AND** 脚本生成 `assets/shop-photos/<shopUid>-<sha256-12>.<ext>` 图片文件

### Requirement: 静态图片文件命名
静态图片文件名 SHALL 使用 `<shopUid>-<sha256-12>.<ext>` 格式，其中 `<ext>` SHALL 根据 MIME 映射为 `jpg`、`png` 或 `webp`。系统 MUST NOT 生成不含内容哈希的静态照片文件名。

#### Scenario: 文件名包含哈希
- **WHEN** 某照片 `shopUid` 为 `shop_abc` 且 `sha256` 以 `8f4e2c9a1b23` 开头
- **THEN** 导出的静态文件路径为 `/assets/shop-photos/shop_abc-8f4e2c9a1b23.<ext>`

### Requirement: 静态 default-data 引用已存在图片
导出的 `data/default-data.json` SHALL 包含 `snapshotId`，并 SHALL 为有照片的商铺写入静态图片路径。任一非空 `shops[].photo` 路径 MUST 对应仓库中存在的 `assets/shop-photos/*` 文件。

#### Scenario: 默认数据引用存在文件
- **WHEN** `tools/export-static-snapshot.js` 完成导出
- **THEN** `data/default-data.json` 中每个非空 `shops[].photo` 都以 `/assets/shop-photos/` 开头
- **AND** 每个路径对应的本地文件存在

#### Scenario: 无照片商铺为空路径
- **WHEN** 某商铺没有 `ShopPhoto`
- **THEN** 导出的 `shops[].photo` 为空字符串
- **AND** 不生成 `src=""` 以外的无效图片路径

### Requirement: 静态 manifest
`data/static-manifest.json` SHALL 包含 `snapshotId`、`generatedAt`、`dataHash`、`photoCount` 和 `photos` 清单。`photos` 清单 SHALL 包含每张图片的 `shopUid`、`sha256`、`path`、`mimeType` 和 `byteSize`。

#### Scenario: manifest 包含快照元数据
- **WHEN** 静态快照导出完成
- **THEN** `data/static-manifest.json` 的 `snapshotId` 为非空字符串
- **AND** `photoCount` 等于 `photos.length`
- **AND** `generatedAt` 为 ISO 时间字符串

### Requirement: 静态发布脚本
系统 SHALL 提供 `tools/publish-static-snapshot.js`，在运行导出后将 `data/default-data.json`、`data/static-manifest.json` 和 `assets/shop-photos/*` 提交到显式配置的静态发布分支。

该脚本 MUST 要求 `STATIC_PUBLISH_BRANCH`、`STATIC_PUBLISH_REMOTE`、`STATIC_PUBLISH_AUTHOR_NAME` 和 `STATIC_PUBLISH_AUTHOR_EMAIL`。脚本 MUST 拒绝在未配置这些变量时执行 push。脚本 MUST 支持 `--dry-run`，dry-run 不得创建 commit 或 push。

#### Scenario: 缺少发布配置时拒绝
- **WHEN** 未设置 `STATIC_PUBLISH_BRANCH`
- **AND** 执行 `node tools/publish-static-snapshot.js`
- **THEN** 脚本退出非 0
- **AND** 输出中文错误说明缺少发布配置

#### Scenario: dry-run 不推送
- **WHEN** 执行 `node tools/publish-static-snapshot.js --dry-run`
- **THEN** 脚本验证将要发布的文件
- **AND** 不执行 `git commit`
- **AND** 不执行 `git push`

### Requirement: 发布状态可观测
系统 SHALL 记录静态发布状态，状态值 SHALL 为 `idle`、`pending`、`running`、`success` 或 `failed`。数据库保存成功但静态发布失败时，系统 MUST 保留数据库保存结果，并记录失败原因。

#### Scenario: 发布失败不回滚数据库
- **WHEN** 照片上传成功并写入数据库
- **AND** 静态发布脚本执行失败
- **THEN** `GET /api/data` 仍返回最新数据库照片 URL
- **AND** `GET /api/static-publish/status` 返回 `status: "failed"` 和错误信息

#### Scenario: 请求发布进入 pending
- **WHEN** 已认证用户请求 `POST /api/static-publish/request`
- **THEN** 系统创建或更新发布状态为 `pending`
- **AND** 响应包含当前发布状态

## Testing Notes

- 单元测试：`tests/static-snapshot.test.js` 覆盖路径命名、manifest、缺失图片引用和 dry-run。
- 集成测试：使用临时目录和测试数据库验证导出文件完整性，不真实 push 远端。
- E2E 测试：覆盖上传照片后触发或模拟静态快照导出，页面可用静态路径渲染。
