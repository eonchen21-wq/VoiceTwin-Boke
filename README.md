# 声音分析应用 - 完整部署指南

这是一个基于 **React + FastAPI + Supabase** 的声音分析应用，使用 **librosa** 进行深度音频特征提取和分析。

## 📋 项目结构

```
Boke/
├── backend/                 # 后端 FastAPI 应用
│   ├── api/                # API 路由层
│   ├── service/            # 业务逻辑层
│   ├── repository/         # 数据访问层
│   ├── schema/             # Pydantic 模型
│   ├── config.py           # 配置管理
│   ├── database.py         # 数据库连接
│   ├── main.py             # 应用入口
│   └── requirements.txt    # Python 依赖
├── services/               # 前端服务层
│   ├── auth-service.ts     # 认证服务
│   ├── analysis-service.ts # 分析服务
│   ├── song-service.ts     # 歌曲服务
│   └── user-service.ts     # 用户服务
├── components/             # React 组件
├── utils/                  # 工具类
├── api-client.ts           # Axios 客户端
├── .env.local              # 前端环境变量
└── package.json            # 前端依赖

```

## 🚀 快速开始

### 1. 数据库初始化

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入 SQL Editor
3. 复制并执行 `backend/init_database.sql` 中的内容

### 2. 后端部署

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

后端将在 `http://localhost:8000` 启动。

**API 文档**：http://localhost:8000/docs 

### 3. 前端部署

```bash
# 返回项目根目录
cd ..

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:5173` 启动。

## 🔧 配置说明

### 后端配置 (`backend/.env`)

已配置，无需修改：
```
SUPABASE_URL=https://wcetamrikreimmndnemy.supabase.co
SUPABASE_KEY=sb_publishable_YDkSMwjrxG4gtplZQRpEdA_dD9AE0iG
API_HOST=0.0.0.0
API_PORT=8000
```

### 前端配置 (`.env.local`)

已配置，无需修改：
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://wcetamrikreimmndnemy.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YDkSMwjrxG4gtplZQRpEdA_dD9AE0iG
```

## 📱 功能特性

### ✅ 已实现功能

1. **用户认证**（Supabase Auth）
   - 用户注册和登录
   - Session 管理

2. **声音录制与分析**
   - 浏览器端音频录制（MediaRecorder API）
   - 音频上传到后端
   - librosa 深度特征提取：
     - 频谱分析（spectral_centroid, spectral_bandwidth, spectral_rolloff）
     - MFCC 音色特征
     - RMS 能量分析
     - 音高检测
     - 过零率分析
   - 智能分析结果生成（清晰度、稳定性、综合得分）
   - 雷达图可视化

3. **歌手匹配**
   - 基于音频特征匹配歌手
   - 智能歌曲推荐（comfort/challenge区分）

4. **收藏功能**
   - 添加/删除收藏
   - 查看收藏列表

5. **用户统计**
   - 分析次数
   - 收藏数量
   - 用户等级

## 🎯 核心技术亮点

### 后端
- **FastAPI** - 高性能异步框架
- **Supabase** - PostgreSQL 数据库 + Auth
- **librosa** - 专业音频分析库
- **分层架构** - Repository / Service / API 清晰分离

### 前端
- **React 19** - 最新版本
- **TypeScript** - 类型安全
- **Axios** - HTTP 客户端
- **Supabase Auth** - 安全认证
- **MediaRecorder API** - 浏览器录音

## 🛠️ 开发注意事项

### 后端技术细节

1. **音频分析流程**：
   - 前端录制 → 上传 Blob → 后端临时文件 → librosa 分析 → 上传到 Supabase Storage → 保存分析结果

2. **分层职责**：
   - **API层**：请求解析、响应包装
   - **Service层**：业务逻辑、音频分析
   - **Repository层**：数据库操作

3. **Supabase Storage**：
   - Bucket 名称：`voice-analyses`
   - 需在 Supabase Dashboard 中手动创建此 bucket

### 前端技术细节

1. **认证流程**：
   - 使用 Supabase Auth SDK 注册/登录
   - 获取 user.id 作为 token 传给后端
   - 后端通过 Bearer token验证用户身份

2. **服务层封装**：
   - 所有 API 调用通过 service 层
   - 自动处理数据格式转换（backend ↔ frontend）

## 📊 数据库表结构

- `users` - 用户信息
- `matched_singers` - 匹配歌手
- `voice_analyses` - 声音分析记录
- `songs` - 歌曲信息
- `user_favorites` - 用户收藏

详见：`backend/init_database.sql`

## 🔍 API 端点

### 认证
- `POST /api/auth/create-profile` - 创建用户资料
- `GET /api/auth/me` - 获取当前用户

### 分析
- `POST /api/analysis/analyze` - 上传音频并分析
- `GET /api/analysis/{id}` - 获取分析结果

### 歌曲
- `GET /api/songs/recommended/{analysis_id}` - 推荐歌曲
- `POST /api/songs/favorites/toggle` - 切换收藏
- `GET /api/songs/favorites` - 获取收藏列表

### 用户
- `GET /api/users/{id}` - 获取用户信息
- `GET /api/users/{id}/stats` - 获取用户统计

## ⚠️ 已知问题

1. **TypeScript Lint 错误**：需要运行 `npm install` 安装依赖后解决
2. **Supabase Storage Bucket**：需要手动在 Dashboard 中创建 `voice-analyses` bucket
3. **CORS**：确保后端 CORS 配置包含前端 URL

## 📝 TODO（可选扩展）

- [ ] 添加更多歌手和歌曲
- [ ] 实现更复杂的歌手匹配算法
- [ ] 添加音频预处理（降噪）
- [ ] 支持更多音频格式
- [ ] 添加单元测试
- [ ] 部署到生产环境

## 📧 联系方式

如有问题，请查看代码注释或 API 文档。
