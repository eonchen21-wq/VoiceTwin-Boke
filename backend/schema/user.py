from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """
    用户基础模型
    """
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)


class UserCreate(UserBase):
    """
    用户注册请求模型
    """
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """
    用户登录请求模型
    """
    email: EmailStr
    password: str


class CreateProfileRequest(BaseModel):
    """
    创建用户资料请求模型
    在 Supabase Auth 注册成功后调用
    """
    auth_id: str = Field(..., description="Supabase Auth 用户ID")
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)



class UserUpdate(BaseModel):
    """
    用户更新请求模型
    """
    username: str | None = Field(None, min_length=2, max_length=50)
    avatar_url: str | None = None


class UserResponse(BaseModel):
    """
    用户响应模型
    """
    id: str
    email: str
    username: str
    avatar_url: str | None = None
    level: int = 1
    created_at: str
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """
    用户统计信息响应模型
    """
    user_id: str
    analysis_count: int = 0
    saved_songs_count: int = 0
    level: int = 1
