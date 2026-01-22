from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from database import get_db
from service.user_service import UserService
from schema.user import UserResponse, UserUpdate, UserStats
from api.auth import get_current_user_id
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["用户"])


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Client = Depends(get_db)):
    """
    获取用户信息
    """
    user_service = UserService(db)
    
    user = user_service.get_user_by_auth_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db)
):
    """
    更新用户信息
    只能更新自己的信息
    """
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限修改其他用户信息"
        )
    
    user_service = UserService(db)
    
    try:
        updated_user = user_service.update_user(user_id, user_update)
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"更新用户信息失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{user_id}/avatar", response_model=UserResponse)
async def update_avatar(
    user_id: str,
    avatar_url: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db)
):
    """
    更新用户头像
    """
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限修改其他用户信息"
        )
    
    user_service = UserService(db)
    
    try:
        updated_user = user_service.update_avatar(user_id, avatar_url)
        return updated_user
    except Exception as e:
        logger.error(f"更新头像失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: str, db: Client = Depends(get_db)):
    """
    获取用户统计信息
    """
    user_service = UserService(db)
    
    try:
        stats = user_service.get_user_stats(user_id)
        return stats
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"获取用户统计失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
