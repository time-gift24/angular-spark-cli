# Docker Sandbox 使用指南

## 快速开始

### 1. 构建并启动开发环境

```bash
# 构建镜像
docker build -f Dockerfile.sandbox -t angular-spark-cli:sandbox .

# 启动开发服务器
docker-compose -f docker-compose.sandbox.yml up angular-spark-dev

# 或者使用 docker run
docker run -it --rm \
  -p 4200:4200 \
  -v $(pwd):/workspace \
  -e CLAUDE_YOLO_MODE=true \
  angular-spark-cli:sandbox
```

### 2. 进入容器使用 Claude Code

```bash
# 使用 docker-compose
docker-compose -f docker-compose.sandbox.yml run --rm claude-shell

# 或使用 docker run
docker run -it --rm \
  -v $(pwd):/workspace \
  -e CLAUDE_YOLO_MODE=true \
  angular-spark-cli:sandbox /bin/bash
```

进入容器后，可以直接使用 `claude` 命令：

```bash
# 在容器内
claude "帮我创建一个新的 button 组件"
```

## YOLO 模式配置

YOLO (You Only Live Once) 模式会让 Claude Code 自动确认大部分操作，减少交互式提示。

### 环境变量

在 `docker-compose.sandbox.yml` 中已配置：

```yaml
environment:
  - CLAUDE_YOLO_MODE=true
  - CLAUDE_AUTO_CONFIRM=true
  - CLAUDE_SKIP_CONFIRMATIONS=true
```

### Claude Code 配置文件

你也可以在项目根目录创建 `.clauderc` 或 `claude.json`：

```json
{
  "autoConfirm": true,
  "yoloMode": true,
  "maxAutoApproveActions": 100
}
```

## 常用命令

### 开发相关

```bash
# 启动开发服务器
npm start

# 运行测试
npm test

# 构建生产版本
npm run build

# 使用 Angular CLI
ng generate component button
ng generate service auth
```

### Docker 相关

```bash
# 查看运行中的容器
docker ps

# 进入运行中的容器
docker exec -it angular-spark-sandbox /bin/bash

# 停止容器
docker-compose -f docker-compose.sandbox.yml down

# 重新构建镜像
docker build -f Dockerfile.sandbox --no-cache -t angular-spark-cli:sandbox .
```

## 故障排除

### 文件监听不工作

在 Docker 中，Angular 的热重载可能需要额外配置：

```bash
# 设置环境变量
export CHOKIDAR_USEPOLLING=true
```

或已在 docker-compose.yml 中配置。

### node_modules 权限问题

使用命名卷避免权限冲突（已在 docker-compose.yml 中配置）。

### Claude Code 未找到

检查 Claude Code 是否正确安装：

```bash
which claude
claude --version
```

如果通过 npm 安装不工作，尝试手动安装：

```bash
# 在容器内
curl -fsSL https://cdn.jsdelivr.net/npm/@anthropic-ai/claude-code@latest/install.sh | bash
```

## 环境规格

- **Base Image**: Ubuntu 24.04
- **Node.js**: 24.x
- **npm**: 11.x
- **Angular**: 21.0.0
- **TypeScript**: 5.9.2
- **Tailwind CSS**: 4.x

## 注意事项

1. **首次构建时间**: 首次构建可能需要 5-10 分钟
2. **磁盘空间**: 完整镜像约 1-2 GB
3. **性能**: Docker 中的文件 I/O 比原生慢，建议使用 SSD
4. **网络**: 确保容器可以访问外网（安装依赖需要）

## 进阶配置

### 使用 Dockerfile 构建生产镜像

创建 `Dockerfile.prod` 用于生产部署：

```dockerfile
FROM ubuntu:24.04 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 多阶段构建

优化镜像大小，分离开发和生产依赖。

---

如有问题，请参考：
- [Angular 官方文档](https://angular.dev)
- [Docker 官方文档](https://docs.docker.com)
- [Claude Code 文档](https://claude.ai/code)
