from supabase import Client
from repository.user_repo import UserRepository
from schema.user import UserCreate, UserUpdate, UserResponse, UserStats
from typing import Any
import logging

logger = logging.getLogger(__name__)


class UserService:
    """
    用户业务逻辑层
    处理用户相关的业务逻辑
    NOTE: Supabase Auth 负责实际的认证，此服务层主要处理用户信息管理
    """
    
    def __init__(self, db: Client):
        self.user_repo = UserRepository(db)
        self.db = db
    
    def get_user_by_auth_id(self, auth_id: str) -> UserResponse | None:
        """
        通过 Supabase Auth ID 获取用户信息
        
        Args:
            auth_id: Supabase Auth 用户ID
            
        Returns:
            用户响应模型，如果不存在返回 None
        """
        user_data = self.user_repo.get_by_id(auth_id)
        if not user_data:
            return None
        return UserResponse(**user_data)
    
    def create_user_profile(self, auth_id: str, email: str, username: str) -> UserResponse:
        """
        创建用户资料
        当用户通过 Supabase Auth 注册后，创建对应的用户资料
        
        Args:
            auth_id: Supabase Auth 用户ID
            email: 用户邮箱
            username: 用户名
            
        Returns:
            创建的用户响应模型
        """
        user_data = {
            'id': auth_id,  # 使用 Auth ID 作为主键，保持一致性
            'email': email,
            'username': username,
            'level': 1
        }
        
        created_user = self.user_repo.create(user_data)
        logger.info(f"创建用户资料成功 user_id={auth_id}")
        return UserResponse(**created_user)
    
    def update_user(self, user_id: str, user_update: UserUpdate) -> UserResponse:
        """
        更新用户信息
        
        Args:
            user_id: 用户ID
            user_update: 用户更新数据
            
        Returns:
            更新后的用户响应模型
        """
        # 只更新非空字段
        update_data = user_update.model_dump(exclude_unset=True)
        
        if not update_data:
            # 没有需要更新的字段
            user_data = self.user_repo.get_by_id(user_id)
            return UserResponse(**user_data)
        
        updated_user = self.user_repo.update(user_id, update_data)
        logger.info(f"更新用户信息成功 user_id={user_id}")
        return UserResponse(**updated_user)
    
    def update_avatar(self, user_id: str, avatar_url: str) -> UserResponse:
        """
        更新用户头像
        
        Args:
            user_id: 用户ID
            avatar_url: 新的头像URL
            
        Returns:
            更新后的用户响应模型
        """
        updated_user = self.user_repo.update(user_id, {'avatar_url': avatar_url})
        logger.info(f"更新用户头像成功 user_id={user_id}")
        return UserResponse(**updated_user)
    
    def get_user_stats(self, user_id: str) -> UserStats:
        """
        获取用户统计信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            用户统计信息
        """
        # 获取用户基本信息
        user_data = self.user_repo.get_by_id(user_id)
        if not user_data:
            raise ValueError(f"用户不存在 user_id={user_id}")
        
        # 获取统计数据
        analysis_count = self.user_repo.get_analysis_count(user_id)
        saved_songs_count = self.user_repo.get_favorites_count(user_id)
        
        return UserStats(
            user_id=user_id,
            analysis_count=analysis_count,
            saved_songs_count=saved_songs_count,
            level=user_data.get('level', 1)
        )
