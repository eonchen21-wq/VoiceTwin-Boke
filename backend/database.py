from supabase import create_client, Client, ClientOptions
from config import get_settings
import logging

logger = logging.getLogger(__name__)


class Database:
    """
    数据库连接管理类 (网络增强版)
    封装 Supabase 客户端的创建和管理
    NOTE: 已强制增加 60秒 超时配置，防止网络波动导致的连接失败
    """
    _client: Client | None = None
    
    @classmethod
    def get_client(cls) -> Client:
        """
        获取 Supabase 客户端单例
        
        Returns:
            Supabase 客户端实例
        """
        if cls._client is None:
            settings = get_settings()
            
            # --- 🚀 关键修改开始 ---
            # 增加超时配置，专门应对 "Timeout" 和 "Handshake" 错误
            options = ClientOptions(postgrest_client_timeout=60, storage_client_timeout=60)
            
            cls._client = create_client(
                supabase_url=settings.supabase_url,
                supabase_key=settings.supabase_key,
                options=options
            )
            # --- 🚀 关键修改结束 ---
            
            logger.info("Supabase 客户端初始化成功 (已启用 60s 超时保护)")
        return cls._client
    
    @classmethod
    def close(cls):
        """
        关闭数据库连接
        NOTE: Supabase Python 客户端不需要显式关闭，此方法用于重置单例
        """
        cls._client = None
        logger.info("Supabase 客户端已重置")


def get_db() -> Client:
    """
    依赖注入函数，用于 FastAPI 路由
    
    Returns:
        Supabase 客户端实例
    """
    return Database.get_client()