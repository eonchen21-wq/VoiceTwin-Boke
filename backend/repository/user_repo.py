from supabase import Client
from typing import Any
import logging

logger = logging.getLogger(__name__)


class UserRepository:
    """
    用户数据访问层
    负责所有与用户表相关的数据库操作
    """
    
    def __init__(self, db: Client):
        self.db = db
    
    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        """
        根据用户ID获取用户信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            用户数据字典，如果不存在返回None
        """
        try:
            response = self.db.table('users').select('*').eq('id', user_id).single().execute()
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"获取用户失败 user_id={user_id}: {str(e)}")
            return None
    
    def get_by_email(self, email: str) -> dict[str, Any] | None:
        """
        根据邮箱获取用户信息
        
        Args:
            email: 用户邮箱
            
        Returns:
            用户数据字典，如果不存在返回None
        """
        try:
            response = self.db.table('users').select('*').eq('email', email).maybe_single().execute()
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"根据邮箱获取用户失败 email={email}: {str(e)}")
            return None
    
    def create(self, user_data: dict[str, Any]) -> dict[str, Any]:
        """
        创建新用户
        
        Args:
            user_data: 用户数据字典
            
        Returns:
            创建的用户数据
            
        Raises:
            Exception: 当创建失败时抛出异常
        """
        max_retries = 3
        retry_count = 0
        last_error = None
        
        # NOTE: 添加重试机制以应对网络波动
        while retry_count < max_retries:
            try:
                logger.info(f"尝试创建用户 (第 {retry_count + 1}/{max_retries} 次) email={user_data.get('email')}")
                response = self.db.table('users').insert(user_data).execute()
                
                if not response.data or len(response.data) == 0:
                    raise ValueError("Supabase 返回空数据")
                
                logger.info(f"创建用户成功 email={user_data.get('email')}")
                return response.data[0]
                
            except Exception as e:
                retry_count += 1
                last_error = e
                logger.warning(
                    f"创建用户失败 (第 {retry_count}/{max_retries} 次): {str(e)}",
                    exc_info=True if retry_count == max_retries else False
                )
                
                # 如果还有重试机会，等待后重试
                if retry_count < max_retries:
                    import time
                    time.sleep(1 * retry_count)  # 递增延迟：1秒、2秒
                    continue
                
                # 所有重试都失败了
                logger.error(
                    f"创建用户最终失败，已重试 {max_retries} 次 email={user_data.get('email')}: {str(last_error)}",
                    exc_info=True
                )
                raise Exception(f"创建用户失败: {str(last_error)}") from last_error
    
    def update(self, user_id: str, user_data: dict[str, Any]) -> dict[str, Any]:
        """
        更新用户信息
        
        Args:
            user_id: 用户ID
            user_data: 要更新的用户数据
            
        Returns:
            更新后的用户数据
        """
        response = self.db.table('users').update(user_data).eq('id', user_id).execute()
        logger.info(f"更新用户成功 user_id={user_id}")
        return response.data[0]
    
    def get_analysis_count(self, user_id: str) -> int:
        """
        获取用户分析次数
        
        Args:
            user_id: 用户ID
            
        Returns:
            分析次数
        """
        try:
            response = self.db.table('voice_analyses').select('id', count='exact').eq('user_id', user_id).execute()
            return response.count if response.count else 0
        except Exception as e:
            logger.error(f"获取分析次数失败 user_id={user_id}: {str(e)}")
            return 0
    
    def get_favorites_count(self, user_id: str) -> int:
        """
        获取用户收藏数量
        
        Args:
            user_id: 用户ID
            
        Returns:
            收藏数量
        """
        try:
            response = self.db.table('user_favorites').select('id', count='exact').eq('user_id', user_id).execute()
            return response.count if response.count else 0
        except Exception as e:
            logger.error(f"获取收藏数量失败 user_id={user_id}: {str(e)}")
            return 0
