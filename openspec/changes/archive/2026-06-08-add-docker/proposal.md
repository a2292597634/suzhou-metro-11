## 为什么做这个变更

项目依赖 Node.js + PostgreSQL + Prisma，目前只能在本机手动配置运行。加入 Docker 容器化后，任何装了 Docker 的电脑只需 `docker compose up` 即可一键启动整个应用（Node.js 服务 + PostgreSQL 数据库），无需手动安装任何依赖。

## 变更内容

- 新增 `Dockerfile` — Node.js 应用镜像
- 新增 `docker-compose.yml` — 编排 Node.js + PostgreSQL 两个服务
- 新增 `.dockerignore` — 排除 node_modules 等不必要的文件

## 能力项

### 新增能力
- 无

## 影响范围

**新增文件：**
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

**不修改：**
- 所有业务代码不动

## 测试策略

纯配置变更，豁免测试。验证方式：`docker compose up` 后浏览器访问 localhost:3000 确认三页正常。

## 成功标准

- [ ] `docker compose up` 一键启动 Node.js + PostgreSQL
- [ ] 自动执行 Prisma migrate 建表
- [ ] 浏览器访问 localhost:3000 三页正常
