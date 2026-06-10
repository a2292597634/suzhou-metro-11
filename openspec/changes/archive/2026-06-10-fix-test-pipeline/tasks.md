## 1. 修改 package.json 测试脚本

- [ ] 1.1 `test` 脚本默认排除 `tests/e2e/**`
- [ ] 1.2 新增 `test:e2e` 脚本只跑 E2E

## 2. 修复 CI 流程

- [ ] 2.1 CI 启动 server.js 后台进程
- [ ] 2.2 等待服务就绪后运行全量测试（含 E2E）
- [ ] 2.3 测试后清理后台进程

## 3. 修复响应式验证脚本

- [ ] 3.1 页面加载失败计数
- [ ] 3.2 任一失败时 process.exit(1)

## 4. E2E 适配认证

- [ ] 4.1 E2E 测试中 page 设置 `Authorization` header
- [ ] 4.2 CI 环境变量配置 `AUTH_TOKEN=ci-test-token`

## 5. 端到端验证

- [ ] 5.1 运行 `npm test` 确认排除 E2E
- [ ] 5.2 启动服务→运行 `npm run test:e2e` 确认 E2E 通过

---

**本 change 为纯配置/脚本修改，豁免业务逻辑测试。**

> 验证方式：CI push 后确认 E2E 栏位绿色 + `npm test` 零失败。
