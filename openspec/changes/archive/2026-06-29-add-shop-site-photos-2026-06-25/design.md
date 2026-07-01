## Context

当前项目使用原生 HTML/CSS/JavaScript 前端、Express 5 后端、Prisma ORM 和 PostgreSQL。商铺数据通过 `state.stations[].shops[]` 在前端页面间共享，通过 `/api/data` 保存到服务器；服务端当前以关系表 `Shop` 持久化商铺字段。

用户确认本 change 采用“服务器持久保存 + 每商铺一张主照片”。因此照片字段必须进入后端校验、Prisma 模型和数据库迁移，而不是只保存在 `localStorage`。为控制范围，首版只保存一张主图，不做多图、文件管理后台或 Excel 照片导入导出。

## Directory Layout

```text
prisma/
  schema.prisma
  migrations/
    <timestamp>_add_shop_site_photo/
      migration.sql
server.js
js/
  modules/
    data.js
    viz.js
    home.js
css/
  data-viz.css
  home-dashboard.css
tests/
  shop-schema.test.js
  data.test.js
  viz.test.js
  integration/
    auth-data-flow.test.js
    home-dashboard.test.js
    viz-data.test.js
  e2e/
    data-viz-flow.test.js
```

## Goals / Non-Goals

**Goals:**

- 每个商铺支持一张现场主图，并在服务器数据库中持久保存。
- 商业信息管理页提供导入、替换、删除和悬停预览照片的管理能力。
- 经营总览趋势卡片复用同一份商铺照片数据，展示点位信息和照片缩略图。
- 保持现有数据保存入口 `/api/data` 和页面状态流转，不引入新前端框架。
- 用测试覆盖数据 schema、前端交互、API 持久化和页面展示。

**Non-Goals:**

- 不做多图相册、图片排序、图片标题或独立图片库。
- 不新增独立 `/api/upload` 上传接口；首版通过商铺数据字段保存图片内容或 URL。
- 不改变 Excel 导入导出列结构，不把照片写入 Excel。
- 不改变登录、权限、Cookie、Bearer Token 或限流规则。
- 不重构经营总览趋势图整体布局。

## Decisions

### 1. 商铺照片字段命名为 `photo`

在前后端商铺对象中新增 `photo` 字段，类型为字符串，默认空字符串。字段保存一张现场主图的图片 Data URL。

原因：用户需求是每个商铺一张现场照片，单字段比数组更准确，也避免后续执行者误扩展成多图管理。

替代方案：使用 `photos: []` 数组。该方案更适合相册，但会扩大 UI、校验和数据库设计范围。

### 2. 首版使用 `/api/data` 保存照片字段，不新增上传服务

照片导入在前端通过 `FileReader.readAsDataURL()` 得到 Data URL，写入 `shop.photo`，再随现有 `saveData()` 保存。服务端校验限制字段长度和格式，避免超大请求。

原因：项目已有 `express.json({ limit: '10mb' })` 和完整 `/api/data` 保存链路。复用现有链路可让照片和商铺记录保持事务一致，减少新接口和文件存储清理问题。

替代方案：新增文件上传接口和静态文件目录。该方案更适合大量高清照片，但需要额外的文件生命周期、安全校验、静态访问和备份策略，不适合本次垂直切片。

### 3. 限制图片类型和大小

前端仅接受 `image/jpeg`、`image/png`、`image/webp`，单张原文件不超过 2 * 1024 * 1024 字节；服务端 `photo` 字符串最大长度为 3_000_000 个字符，且必须匹配 `data:image/(jpeg|png|webp);base64,` 前缀或为空字符串。超限时前端提示用户，服务端校验兜底拒绝。

原因：Data URL 会膨胀体积，必须避免单次 `/api/data` 请求超过 10MB 或导致数据库记录过大。

替代方案：不限制图片大小。该方案容易让保存失败且错误体验差。

### 4. 商业信息管理页照片操作放在商铺表格内

商铺详情表格新增“现场照片”列，展示有/无照片状态、导入/替换按钮和删除按钮。导入后先更新内存状态并重渲染当前卡片，点击“保存修改”后持久化到服务器。

原因：照片是商铺字段，放在商铺行内最符合编辑心智；复用现有展开卡片和保存按钮可避免新增独立保存状态。

替代方案：做一个单独照片管理面板。该方案适合批量照片维护，但会增加页面复杂度。

### 5. 悬停预览不改变数据

商业信息管理页商铺行和卡片预览项在有 `shop.photo` 时显示浮层预览，浮层只读，不触发保存、不改变展开状态。

原因：用户明确要求鼠标放到对应商铺上预览照片，预览应是轻量反馈，不应影响编辑流程。

### 6. 经营总览趋势卡片使用紧凑两栏布局

趋势卡片保留现有头部、统计和脚部信息，下半部分新增 `.trend-detail-shops` 区域。每个点位行左侧显示铺号/名称、状态、商户和面积，右侧显示照片缩略图；没有照片时显示紧凑占位，不渲染破图。区域设置最大高度和内部滚动，尽量不扩大卡片宽度。

原因：用户要求卡片大小尽量不要调整，且“信息在左、照片在右”。内部滚动比撑大卡片更符合现有趋势图悬浮卡片定位。

## Data Model

```js
{
  no: 1,
  shortNo: "S11-1",
  name: "A商铺",
  type: "商铺",
  area: 18.69,
  tenant: "",
  contact: "",
  openDate: "",
  status: "未出租",
  power: "",
  water: "/",
  remark: "",
  photo: "data:image/jpeg;base64,..."
}
```

数据库字段：

```prisma
model Shop {
  photo String? @default("")
}
```

## Risks / Trade-offs

- [Risk] Data URL 持久化会增加数据库体积和 `/api/data` 响应体积。Mitigation: 限制单图 2MB，首版每商铺一张图，趋势卡片只渲染缩略图尺寸。
- [Risk] 现有 `express.json` 10MB 限制可能在多个商铺同时有照片时触发。Mitigation: 明确首版适合少量现场主图；若后续需要大量照片，另开文件上传服务 change。
- [Risk] 服务端 schema 若漏加 `photo` 会导致保存失败或字段丢失。Mitigation: 增加 schema、API 持久化和读取测试。
- [Risk] 悬浮卡片内容增多可能遮挡趋势图。Mitigation: 控制宽度、最大高度和内部滚动，不改变趋势图 SVG 尺寸。
- [Risk] E2E 中真实图片文件准备复杂。Mitigation: 使用测试内生成的小型 Data URL 或 fixture 文件。

## Migration Plan

1. 新增 Prisma 迁移，为 `Shop` 添加 `photo` 文本字段，默认空字符串。
2. 更新 `server.js` 的读取、校验和保存逻辑，确保 `photo` 字段完整往返。
3. 更新 `data.js` 和新增商铺默认对象，确保 `photo` 默认空字符串并保留已有照片字段。
4. 更新商业信息管理页照片列、导入/替换/删除和悬停预览。
5. 更新经营总览趋势卡片，将商铺明细和照片缩略图加入下半部分。
6. 补齐单元、集成、E2E 测试。
7. 运行 `npm test`、`npm run test:e2e`、`node scripts/check-test-coverage.js`。

Rollback：回退本 change 的前端、后端和测试代码，并回滚新增数据库迁移；如已部署迁移，需要按数据库变更流程删除或忽略 `Shop.photo` 字段。

## 测试架构设计

- `tests/shop-schema.test.js`: 覆盖 `photo` 字段接受空字符串、合法图片 Data URL、拒绝过长字符串和非图片 Data URL。
- `tests/data.test.js`: 覆盖 `saveData()` 请求体保留 `shop.photo`，`loadData()` 从 API/localStorage 读取时保留照片字段。
- `tests/viz.test.js`: 覆盖照片按钮渲染、导入 FileReader 成功、超限/非图片拒绝、删除照片和悬停预览 HTML。
- `tests/integration/viz-data.test.js`: 覆盖商业信息管理页照片导入后保存到 `state` 并调用 `saveData()`，删除后同步清空。
- `tests/integration/home-dashboard.test.js`: 覆盖 `renderStationTrend()` 悬浮详情下半部分包含点位信息和照片缩略图，缺图时显示占位且不渲染破图。
- `tests/integration/auth-data-flow.test.js`: 覆盖 `/api/data` POST 保存照片字段后 GET 返回同一字段。
- `tests/server-security.test.js`: 覆盖 `/api/data` 拒绝非法照片字段和超长照片字段。
- `tests/e2e/data-viz-flow.test.js`: 覆盖真实页面中选择图片、保存、悬停预览和删除照片的关键流程。
- 需要 mock：`FileReader`、`fetch`、`localStorage`、`confirm`、必要的浏览器布局 API。
- 不需要 mock：照片字段校验、`saveData()` 请求体构造、趋势卡片渲染函数本身。

## Open Questions

- 单张现场照片的 2MB 原文件上限是否满足实际巡检照片质量？本 change 默认先采用 2MB，后续如需高清图另建上传服务 change。
- 是否需要在趋势卡片中展示所有点位，还是只展示前若干个点位？本 change 默认展示所有点位并使用内部滚动。
- 多经点位是否也属于“商业点位信息”并展示照片？本 change 默认趋势卡片展示 `station.shops` 中全部点位，统计数字仍沿用现有商铺/多经点位口径。
