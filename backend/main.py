from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  # ✅ 新增：必须导入这个模块
from fastapi.middleware.cors import CORSMiddleware
from api import auth, users, analysis, songs
from config import get_settings
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(
    title="声音分析 API",
    description="基于 librosa 的声音分析和歌手匹配系统",
    version="1.0.0"
)

# 配置 CORS - 开发环境允许所有来源
settings = get_settings()

# NOTE: CORS中间件配置 - 允许前端跨域访问
# 必须在路由注册之前添加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # 允许浏览器访问所有响应头
)

# ✅ 核心修复：挂载静态文件目录
# 这样前端才能访问 http://localhost:8000/static/avatars/xxx.jpg
app.mount("/static", StaticFiles(directory="static"), name="static")


# 注册路由
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(analysis.router)
app.include_router(songs.router)


@app.get("/")
async def root():
    """
    API 根路径
    """
    return {
        "message": "声音分析 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    健康检查接口
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )