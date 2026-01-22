# 后端开发指南

## 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

## 数据库初始化

1. 登录 Supabase Dashboard：https://supabase.com/dashboard
2. 选择你的项目
3. 进入 SQL Editor
4. 复制 `init_database.sql` 的内容并执行

## 配置环境变量

后端的 `.env` 文件已经配置好，包含:
- Supabase URL 和 Key
- API 配置参数

## 启动后端服务

```bash
cd backend
python main.py
```

或使用 uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API 文档

启动后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要功能

1. **用户认证**（配合 Supabase Auth）
   - POST `/api/auth/create-profile` - 创建用户资料
   - GET `/api/auth/me` - 获取当前用户

2. **用户管理**
   - GET `/api/users/{user_id}` - 获取用户信息
   - PUT `/api/users/{user_id}` - 更新用户信息
   - GET `/api/users/{user_id}/stats` - 获取用户统计

3. **声音分析**
   - POST `/api/analysis/analyze` - 上传音频并分析
   - GET `/api/analysis/{analysis_id}` - 获取分析结果

4. **歌曲与收藏**
   - GET `/api/songs/recommended/{analysis_id}` - 获取推荐歌曲
   - POST `/api/songs/favorites/toggle` - 切换收藏
   - GET `/api/songs/favorites` - 获取收藏列表

## 音频分析技术

使用 librosa 库进行深度音频分析：
- 频谱特征提取（spectral_centroid, spectral_bandwidth）
- MFCC（Mel频率倒谱系数）音色分析
- 音高检测
- RMS 能量分析
- 过零率分析
