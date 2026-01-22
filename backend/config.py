from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    应用配置类
    使用 pydantic-settings 从环境变量加载配置
    """
    # Supabase 配置
    supabase_url: str
    supabase_key: str
    supabase_jwt_secret: str
    
    # API 配置
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # 文件上传配置
    max_audio_size_mb: int = 10
    allowed_audio_formats: list[str] = [".wav", ".mp3", ".ogg", ".m4a", ".webm"]
    
    # Supabase Storage 配置
    audio_bucket_name: str = "voice-analyses"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    获取配置单例
    使用 lru_cache 确保配置只加载一次
    """
    return Settings()
