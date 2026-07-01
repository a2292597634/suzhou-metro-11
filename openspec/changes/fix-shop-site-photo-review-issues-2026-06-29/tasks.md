## 1. 后端照片校验测试（Red）

- [ ] 1.1 在 `tests/shop-schema.test.js` 更新 `photo` schema 测试，使其与真实 `server.js` 规则一致
- [ ] 1.2 在 `tests/shop-schema.test.js` 增加合法 500 字符以上 Data URL 被接受、`/assets/shop-photos/demo.png` 被拒绝、超过 3_000_000 字符被拒绝的测试
- [ ] 1.3 在 `tests/integration/auth-data-flow.test.js` 增加 `/api/data` 保存并读取 500 字符以上合法 Data URL 的成功往返测试
- [ ] 1.4 在 `tests/server-security.test.js` 增加 `/api/data` 拒绝 `/assets/shop-photos/demo.png` 路径型照片字段的测试
- [ ] 1.5 运行 `npx vitest run tests/shop-schema.test.js tests/integration/auth-data-flow.test.js tests/server-security.test.js`，确认新增测试在当前实现下失败（Red 验证）

## 1.T 后端照片校验测试要求

- [ ] 1.T.1 Red 阶段测试必须真实覆盖 `server.js` 当前 500 字符上限问题
- [ ] 1.T.2 Red 阶段测试必须真实覆盖路径型照片值当前被接受的问题
- [ ] 1.T.3 测试不得只复制错误 schema 使断言虚假通过

## 2. 后端照片保存边界修复

- [ ] 2.1 更新 `server.js` 的 `shopSchema.photo`，只允许空字符串或 `data:image/(jpeg|png|webp);base64,` Data URL
- [ ] 2.2 将 `shopSchema.photo` 最大长度设置为 3_000_000 个字符
- [ ] 2.3 从 `server.js` 删除照片专用 `uploadPhoto` multer 配置
- [ ] 2.4 从 `server.js` 删除 `POST /api/upload-photo` 路由
- [ ] 2.5 从 `server.js` 删除 `/assets/shop-photos/*` 路径型照片白名单和相关错误文案
- [ ] 2.6 运行 `npx vitest run tests/shop-schema.test.js tests/integration/auth-data-flow.test.js tests/server-security.test.js`，确认后端照片校验测试通过（Green）
- [ ] 2.7 在测试保护下整理 `server.js` 中照片校验相关代码（Refactor）

## 2.T 后端照片保存边界测试

- [ ] 2.T.1 确认合法短 Data URL、合法 500 字符以上 Data URL、未传 `photo` 三类输入均通过
- [ ] 2.T.2 确认路径型照片值、非图片 Data URL、超过 3_000_000 字符值均返回 400
- [ ] 2.T.3 确认代码搜索 `rg "upload-photo|uploadPhoto|shop-photos" server.js` 不再命中照片上传端点或路径白名单

## 3. 默认数据照片路径清理

- [ ] 3.1 清理 `data/default-data.json` 中所有 `/assets/shop-photos/*` 照片路径
- [ ] 3.2 对清理后的商铺保留 `photo: ""` 或移除 `photo` 字段，但不得保留缺失资源路径
- [ ] 3.3 确认 `prisma/seed.js` 读取默认数据时仍将缺失照片兼容为空字符串

## 3.T 默认数据测试

- [ ] 3.T.1 在 `tests/data.test.js` 或合适的测试文件中增加默认数据不包含 `/assets/shop-photos/` 引用的测试（Red）
- [ ] 3.T.2 运行新增默认数据测试，确认当前实现失败（Red 验证）
- [ ] 3.T.3 完成 3.1-3.3 后运行新增默认数据测试并确认通过（Green）
- [ ] 3.T.4 确认页面从默认数据加载时无照片商铺不渲染破图（Refactor/回归）

## 4. 商业信息管理页保存失败反馈

- [ ] 4.1 更新 `js/modules/viz.js` 的 `saveCard()`，仅在 `saveData()` 返回 `success: true` 时显示成功提示
- [ ] 4.2 当 `saveData()` 返回 `success: false` 时显示包含失败原因的中文 toast
- [ ] 4.3 对 `needLogin`、`conflict` 和普通服务端校验错误使用可理解的中文提示
- [ ] 4.4 确保失败保存不会误导用户认为照片或商铺数据已经持久化

## 4.T 商业信息管理页保存反馈测试

- [ ] 4.T.1 在 `tests/viz.test.js` 或 `tests/integration/viz-data.test.js` 编写 `saveData()` 返回失败时不显示成功提示的测试（Red）
- [ ] 4.T.2 编写 `saveData()` 返回成功时仍显示成功提示的回归测试（Red）
- [ ] 4.T.3 运行 `npx vitest run tests/viz.test.js tests/integration/viz-data.test.js`，确认新增失败反馈测试经历 Red → Green
- [ ] 4.T.4 在测试保护下整理 toast 文案和结果分支（Refactor）

## 5. 照片完整流程 E2E

- [ ] 5.1 在 `tests/e2e/data-viz-flow.test.js` 增加小型 JPEG、PNG 或 WebP 测试图片 fixture，或在测试运行时生成临时图片文件
- [ ] 5.2 E2E 登录测试环境或使用现有认证流程，确保保存走真实 `/api/data`
- [ ] 5.3 E2E 覆盖展开站点详情、导入照片、点击“保存修改”、刷新后照片状态保持
- [ ] 5.4 E2E 覆盖悬停照片列显示包含商铺名称的预览浮层
- [ ] 5.5 E2E 覆盖删除照片、保存、刷新后照片状态清空且不显示图片浮层

## 5.T 照片完整流程 E2E 测试

- [ ] 5.T.1 编写 E2E 后先运行 `npm run test:e2e`，确认新增照片流程测试在当前实现下失败（Red）
- [ ] 5.T.2 完成 2-4 组修复后运行 `npm run test:e2e`，确认照片流程测试通过（Green）
- [ ] 5.T.3 E2E 不得 mock 页面业务逻辑、`FileReader` 或 `/api/data`
- [ ] 5.T.4 在测试保护下修正 E2E 暴露的交互问题（Refactor）

## 6. 回归验证与一致性检查

- [ ] 6.1 运行定向测试：`npx vitest run tests/shop-schema.test.js tests/data.test.js tests/viz.test.js tests/integration/auth-data-flow.test.js tests/server-security.test.js tests/integration/viz-data.test.js`
- [ ] 6.2 运行完整非 E2E 回归：`npm test`
- [ ] 6.3 运行 E2E：`npm run test:e2e`
- [ ] 6.4 运行覆盖检查：`node scripts/check-test-coverage.js`
- [ ] 6.5 运行静态检查：`rg "upload-photo|uploadPhoto" server.js` 应无命中；`rg "/assets/shop-photos" data/default-data.json server.js` 应无未授权命中
- [ ] 6.6 重读本 change 的 proposal、design、specs 和 tasks，确认实现未越界且 artifacts 一致

## 6.T 回归验证要求

- [ ] 6.T.1 确认所有新增测试已经历 Red → Green
- [ ] 6.T.2 确认没有跳过关键断言或 mock 核心业务逻辑
- [ ] 6.T.3 若存在非本 change 引起的基线失败，记录命令、失败摘要和与本 change 无关的证据

# 测试检查清单

> 本清单嵌入每个 change 的 tasks.md 末尾，作为测试验收的硬性门槛。所有复选框必须打勾，change 才算完成。

---

## 检查项

### 阶段一：Propose（规划阶段）

- [x] **测试策略已定义**：在 design.md 或 proposal.md 中说明了本 change 需要哪一层测试（单元/集成/E2E）
- [x] **测试任务已拆分**：tasks.md 中每个功能模块任务组都有对应的测试任务（如「2.1 实现 xxx」对应「2.T 测试 xxx」）
- [x] **测试基础设施已确认**：如果本 change 需要新的测试库/配置，已在 tasks 中列出

### 阶段二：Apply（实施阶段）

- [ ] **TDD 顺序已遵守**：每个功能点执行了 Red → Green → Refactor
- [ ] **单元测试已编写**：每个新增/修改的模块都有对应的 `tests/<模块名>.test.js`
- [ ] **集成测试已编写**（如涉及多模块联动）：有 `tests/integration/<场景>.test.js`
- [ ] **E2E 测试已编写**（如涉及页面/核心流程）：有 `tests/e2e/<场景>.test.js`
- [ ] **测试命名规范**：测试文件命名符合 `tests/<模块名>.test.js` 或 `tests/<层级>/<场景>.test.js`
- [ ] **测试描述清晰**：每个 `it()` 描述读起来像一句完整的中文断言（如「应该从无文件名路径解析首页」）

### 阶段三：验证阶段

- [ ] **全部测试通过**：运行 `npm test` 输出 `Tests N passed (N)`，零失败
- [ ] **覆盖率检查通过**：运行 `node scripts/check-test-coverage.js`，输出「所有模块均已覆盖」
- [ ] **无测试作弊**：没有为了通过而修改测试期望值、没有跳过关键断言、没有 mock 掉核心业务逻辑
- [ ] **手动验证完成**：在真实浏览器中验证了核心场景（至少一次）

### 阶段四：归档阶段

- [ ] **测试文件已提交**：所有测试文件已纳入 git 版本控制
- [ ] **CI 脚本已更新**（如有）：package.json 的 test 脚本能正确运行新增测试
- [ ] **文档已更新**：如测试策略或基础设施有变化，已同步更新 `openspec/testing-strategy.md`
