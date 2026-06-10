FROM node:24-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./
RUN npm ci

# 复制 Prisma schema
COPY prisma ./prisma

# 生成 Prisma Client
RUN npx prisma generate

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 3000

# 启动：先执行迁移，再启动服务器
CMD npx prisma migrate deploy && npx prisma db seed && node server.js
