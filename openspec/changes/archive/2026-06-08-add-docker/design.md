## 上下文

项目使用 Express 5 + Prisma + PostgreSQL，需要通过 Docker 简化部署。

## 架构

```
docker compose up
    ├── postgres 服务（PostgreSQL 16）
    │   └── 端口 5432，数据持久化到本地 volume
    └── app 服务（Node.js 24）
        ├── 依赖 postgres 服务（等待健康检查通过）
        ├── 启动时自动执行 npx prisma migrate deploy
        └── 端口 3000
```

## 关键决策

- PostgreSQL 使用官方镜像 `postgres:16-alpine`（体积小）
- Node.js 使用 `node:24-alpine`
- 数据持久化：PostgreSQL 数据挂载到 Docker volume，容器删了数据还在
- Prisma migrate 在 app 启动时自动执行，确保数据库结构与 schema 同步

## 文件

```
Dockerfile              Node.js 应用构建
docker-compose.yml      服务编排
.dockerignore           构建排除文件
```

## 风险

| 风险 | 缓解 |
|------|------|
| Prisma migrate 首次执行可能失败 | 使用 `migrate deploy`（非 `migrate dev`），适合生产环境 |
| Alpine 镜像缺少系统依赖 | node:24-alpine 已包含必要依赖，Prisma 引擎兼容 |
