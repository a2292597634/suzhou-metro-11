## Why

`npm test` 默认运行 `vitest run` 会包含 E2E 测试，但 E2E 假设端口 3000 已有运行中的服务。CI 中用 `--exclude='tests/e2e/**'` 跳过 E2E，导致 CI 永远不验证真实页面流程。同时 `scripts/verify-responsive.js` 在页面全部加载失败时仍以退出码 0 结束，产生假通过。

## What Changes

- `package.json`: `npm test` 默认排除 E2E，新增 `test:e2e` 脚本
- `.github/workflows/test.yml`: CI 先启动服务，再跑全量测试（含 E2E）
- `scripts/verify-responsive.js`: 页面加载失败累计到错误计数，任一失败时 exit(1)
- E2E 测试：添加认证 Token header 以适配 Change 1

## Capabilities

### New Capabilities
- `test-pipeline`: CI/E2E 测试流程完整闭环

### Modified Capabilities
_(纯配置和脚本修复，无 spec-level 行为变更)_

## Impact

| 文件 | 变更内容 |
|------|---------|
| `package.json` | 默认 test 排除 E2E，新增 test:e2e |
| `.github/workflows/test.yml` | 启动服务→全量测试（含 E2E）→停止服务 |
| `scripts/verify-responsive.js` | 失败计数 + exit(1) |
| `tests/e2e/*.js` | 携带认证 Token header |

## 测试策略

| 变更类型 | 映射结果 |
|---------|---------|
| 纯配置修改（package.json、CI yaml） | — 配置生效验证 |
| 脚本修改（verify-responsive.js） | — 手动运行验证 |

本 change 不涉及业务逻辑变更，测试豁免。验证方式：CI 运行成功后确认 E2E 测试执行。

## 成功标准

- [ ] `npm test` 默认不跑 E2E
- [ ] CI 中 E2E 测试在真实服务上通过
- [ ] `verify-responsive.js` 页面全部失败时 exit(1)
- [ ] E2E 测试携带认证 Token
