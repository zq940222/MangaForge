# MangaForge 部署指南

本文档提供 MangaForge 系统的完整部署说明，包括开发环境、测试环境和生产环境。

## 目录

- [系统要求](#系统要求)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [GPU 服务配置](#gpu-服务配置)
- [服务配置详解](#服务配置详解)
- [监控与维护](#监控与维护)
- [故障排除](#故障排除)

---

## 系统要求

### 硬件要求

| 环境 | CPU | 内存 | 存储 | GPU |
|------|-----|------|------|-----|
| 开发 | 4核 | 16GB | 50GB SSD | 可选 |
| 测试 | 8核 | 32GB | 100GB SSD | 推荐 8GB+ VRAM |
| 生产 | 16核+ | 64GB+ | 500GB+ SSD | 必须 24GB+ VRAM |

### 软件要求

- **操作系统**: Ubuntu 22.04+ / CentOS 8+ / Windows 10+ (WSL2)
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Python**: 3.11+
- **Node.js**: 18+ (前端)
- **NVIDIA Driver**: 535+ (GPU)
- **NVIDIA Container Toolkit**: 1.14+ (GPU)

---

## 开发环境部署

### 1. 环境准备

```bash
# 克隆仓库
git clone https://github.com/yourusername/MangaForge.git
cd MangaForge

# 创建 Python 虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 .\venv\Scripts\activate  # Windows

# 安装 Python 依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

**.env 文件示例:**
```env
# 应用配置
ENV=development
DEBUG=true
APP_NAME=MangaForge
API_PREFIX=/api/v1

# 数据库
DATABASE_URL=postgresql://mangaforge:mangaforge_dev@localhost:5432/mangaforge_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=mangaforge
MINIO_SECURE=false

# Celery
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672/
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# AI 服务 API Keys (可选，可在 Web 界面配置)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
KLING_API_KEY=

# 本地服务
COMFYUI_URL=http://localhost:8188
SADTALKER_URL=http://localhost:7860
FISH_SPEECH_URL=http://localhost:8080
```

### 3. 启动基础设施

```bash
# 启动核心服务
docker compose -f docker/dev/docker-compose.yml up -d postgres redis minio rabbitmq

# 验证服务状态
docker compose -f docker/dev/docker-compose.yml ps

# 查看日志
docker compose -f docker/dev/docker-compose.yml logs -f
```

### 4. 初始化数据库

数据库会通过 `scripts/init-db.sql` 自动初始化。如需手动执行:

```bash
docker exec -i mangaforge-postgres-dev psql -U mangaforge -d mangaforge_dev < scripts/init-db.sql
```

### 5. 启动后端服务

**终端 1 - API 服务:**
```bash
source venv/bin/activate
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

**终端 2 - Celery Worker:**
```bash
source venv/bin/activate
celery -A src.workers.celery_app worker -l info -Q generation,callbacks
```

**终端 3 - Celery Beat (可选，定时任务):**
```bash
source venv/bin/activate
celery -A src.workers.celery_app beat -l info
```

### 6. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 7. 验证部署

```bash
# 健康检查
curl http://localhost:8000/health

# API 文档
open http://localhost:8000/docs

# 前端
open http://localhost:5173
```

---

## 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose-plugin

# 安装 NVIDIA Container Toolkit (如有 GPU)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### 2. 创建生产配置

```bash
# 创建生产环境 docker-compose 配置
cp docker/dev/docker-compose.yml docker/prod/docker-compose.yml
```

编辑 `docker/prod/docker-compose.yml`:

```yaml
# 关键修改:
# 1. 移除 volume mounts (使用构建的镜像)
# 2. 设置 ENV=production
# 3. 添加资源限制
# 4. 配置日志轮转
# 5. 设置重启策略

services:
  api:
    image: mangaforge/api:latest
    restart: always
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
```

### 3. 生产环境变量

```bash
# 创建生产环境变量文件
vim .env.prod
```

```env
# 生产配置
ENV=production
DEBUG=false
SECRET_KEY=your-super-secret-key-change-this

# 数据库 (使用强密码)
DATABASE_URL=postgresql://mangaforge:strong_password_here@postgres:5432/mangaforge

# 其他配置...
```

### 4. 构建和部署

```bash
# 构建镜像
docker compose -f docker/prod/docker-compose.yml build

# 启动服务
docker compose -f docker/prod/docker-compose.yml --env-file .env.prod up -d

# 查看状态
docker compose -f docker/prod/docker-compose.yml ps
```

### 5. Nginx 反向代理

安装和配置 Nginx:

```bash
sudo apt install nginx
```

`/etc/nginx/sites-available/mangaforge`:
```nginx
upstream api {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:5173;
}

server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /api/v1/ws {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # 文件上传大小限制
    client_max_body_size 100M;
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/mangaforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL 证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

---

## GPU 服务配置

### ComfyUI (图像生成)

```bash
# 启动 ComfyUI
docker compose -f docker/dev/docker-compose.yml up -d comfyui

# 下载必要模型
# 访问 http://localhost:8188 管理模型

# 推荐模型:
# - SDXL Base
# - IP-Adapter
# - ControlNet
```

### SadTalker (口型同步)

```bash
# 启动 SadTalker (需要 GPU profile)
docker compose -f docker/dev/docker-compose.yml --profile gpu up -d sadtalker
```

### Fish-Speech (语音克隆)

```bash
# 启动 Fish-Speech (需要 GPU profile)
docker compose -f docker/dev/docker-compose.yml --profile gpu up -d fish-speech
```

---

## 服务配置详解

### PostgreSQL

```bash
# 连接数据库
docker exec -it mangaforge-postgres-dev psql -U mangaforge -d mangaforge_dev

# 备份
docker exec mangaforge-postgres-dev pg_dump -U mangaforge mangaforge_dev > backup.sql

# 恢复
cat backup.sql | docker exec -i mangaforge-postgres-dev psql -U mangaforge -d mangaforge_dev
```

### Redis

```bash
# 连接 Redis
docker exec -it mangaforge-redis-dev redis-cli

# 查看键
keys *

# 清空缓存
flushall
```

### MinIO

```bash
# 访问管理界面
open http://localhost:9001

# 默认凭据:
# 用户: minioadmin
# 密码: minioadmin

# 创建 bucket (自动在首次启动时创建)
```

### RabbitMQ

```bash
# 访问管理界面
open http://localhost:15672

# 默认凭据:
# 用户: guest
# 密码: guest

# 查看队列状态
```

---

## 监控与维护

### 日志查看

```bash
# 所有服务日志
docker compose -f docker/dev/docker-compose.yml logs -f

# 特定服务日志
docker compose -f docker/dev/docker-compose.yml logs -f api worker

# 最近 100 行
docker compose -f docker/dev/docker-compose.yml logs --tail=100 api
```

### 健康检查

```bash
# API 健康检查
curl http://localhost:8000/health

# 数据库连接检查
docker exec mangaforge-postgres-dev pg_isready -U mangaforge

# Redis 检查
docker exec mangaforge-redis-dev redis-cli ping
```

### 数据备份

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backup/mangaforge

# PostgreSQL
docker exec mangaforge-postgres-dev pg_dump -U mangaforge mangaforge_dev > $BACKUP_DIR/db_$DATE.sql

# MinIO
docker run --rm -v minio_data:/data -v $BACKUP_DIR:/backup alpine tar -czf /backup/minio_$DATE.tar.gz /data

# 清理 7 天前的备份
find $BACKUP_DIR -mtime +7 -delete
```

### 资源监控

```bash
# 容器资源使用
docker stats

# 磁盘使用
docker system df

# 清理未使用资源
docker system prune -a
```

---

## 故障排除

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker compose logs postgres

# 检查连接
docker exec mangaforge-postgres-dev pg_isready -U mangaforge

# 常见原因:
# - 服务未启动
# - 密码错误
# - 网络问题
```

#### 2. Celery Worker 无法连接

```bash
# 检查 RabbitMQ 状态
docker compose logs rabbitmq

# 检查连接
docker exec mangaforge-rabbitmq-dev rabbitmq-diagnostics check_running

# 重启 Worker
docker compose restart worker
```

#### 3. MinIO 访问问题

```bash
# 检查 MinIO 状态
docker compose logs minio

# 验证 bucket 存在
docker exec mangaforge-minio-dev mc ls local/mangaforge
```

#### 4. WebSocket 连接失败

```bash
# 检查 Redis Pub/Sub
docker exec mangaforge-redis-dev redis-cli

> SUBSCRIBE task:*:progress
```

#### 5. GPU 服务不可用

```bash
# 检查 NVIDIA 驱动
nvidia-smi

# 检查 Docker GPU 支持
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# 检查 ComfyUI
docker compose logs comfyui
```

### 性能优化

1. **数据库连接池**: 调整 `pool_size` 和 `max_overflow`
2. **Redis 缓存**: 启用结果缓存减少重复计算
3. **Celery 并发**: 根据 CPU 核心数调整 `--concurrency`
4. **MinIO 分片上传**: 大文件使用分片上传

### 安全建议

1. **修改默认密码**: PostgreSQL, RabbitMQ, MinIO
2. **限制网络访问**: 使用防火墙规则
3. **启用 HTTPS**: 使用 Let's Encrypt
4. **API 认证**: 生产环境必须启用认证
5. **日志脱敏**: 不要记录敏感信息

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 2.0.0 | 2026-01-13 | 初始版本，完整系统实现 |
