## 为什么做这个变更

项目现有 182 个测试，但每次 push 后不会自动跑——全靠手动 `npx vitest run`。加入 GitHub Actions CI 后，每次 push 自动在 GitHub 服务器上跑全量测试，及时发现回归。

## 变更内容

- 新增 `.github/workflows/test.yml` — GitHub Actions 工作流，push/PR 时自动执行 `npx vitest run --exclude='tests/e2e/**'`

## 能力项

### 新增能力
- 无

### 修改的能力
- 无

## 影响范围

**新增文件：**
- `.github/workflows/test.yml`

**不修改：**
- 所有业务代码不动

## 测试策略

纯配置变更，豁免测试。验证方式：push 后在 GitHub Actions 页面确认工作流通过。

## 成功标准

- [ ] push 后 GitHub Actions 自动运行测试
- [ ] 工作流包含检出代码、安装 Node.js 24、npm ci、运行测试四步
- [ ] 172 个单元/集成测试在 CI 环境中全绿（E2E 暂不包含）
