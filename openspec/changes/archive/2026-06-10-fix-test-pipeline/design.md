## Context

当前 `npm test` = `vitest run` 会执行所有 `tests/**/*.test.js`（含 E2E），但 E2E 需要 localhost:3000 服务运行。CI 用 `--exclude` 跳过 E2E。`verify-responsive.js` 页面加载失败只打日志不设退出码。

## Goals / Non-Goals

**Goals:**
1. `npm test` 默认排除 E2E，开发时零配置可用
2. CI 中启动服务→全量测试（含 E2E）→停止服务
3. `verify-responsive.js` 失败时 exit(1)

**Non-Goals:**
- 不修改 E2E 测试逻辑本身（只加 Token header）

## Decisions

### Decision 1: test 脚本拆分为 test + test:e2e

**选择**: `"test": "vitest run --exclude='tests/e2e/**'"`, `"test:e2e": "vitest run --include='tests/e2e/**'"`

### Decision 2: CI 使用 `&` 后台启动服务

**选择**: CI 步骤中 `node server.js &` 启动服务，等待就绪后跑测试，最后 `kill`

### Decision 3: E2E Token 使用环境变量 `TEST_AUTH_TOKEN`

**选择**: CI 环境设置 `AUTH_TOKEN=ci-test-token`，E2E 页面请求携带此 Token

## 测试架构

本 change 为纯配置/脚本修改，豁免业务测试。验证方式：CI push 后确认 E2E 栏位绿色。
