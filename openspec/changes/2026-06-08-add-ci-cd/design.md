## 上下文

项目使用 Vitest + jsdom + Puppeteer，GitHub 公开仓库，无额外费用。

## 工作流设计

```yaml
触发条件: push 到 main / PR 到 main
运行环境: ubuntu-latest
步骤:
  1. checkout 代码
  2. 安装 Node.js 24
  3. npm ci
  4. npx vitest run --exclude='tests/e2e/**'（排除 E2E，CI 无 display server）
```

E2E 测试需要 Puppeteer 启动浏览器，CI 环境中需要额外配置（xvfb），首次先跳过，后续可加。

## 风险

| 风险 | 缓解 |
|------|------|
| CI 环境无 PostgreSQL | npm test 排除 E2E 即可，单元/集成测试不依赖数据库 |
| 首次触发可能失败 | 观察 Actions 日志，根据错误调整 |
