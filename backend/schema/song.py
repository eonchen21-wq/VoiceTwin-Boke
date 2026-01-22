from pydantic import BaseModel, Field
from typing import Literal


class SongBase(BaseModel):
    """
    歌曲基础模型
    """
    title: str = Field(..., min_length=1, max_length=200)
    artist: str = Field(..., min_length=1, max_length=100)
    album: str | None = None
    cover_url: str | None = None
    song_url: str | None = None  # NOTE: 歌曲音频文件 URL
    tag: Literal['comfort', 'challenge']
    tag_label: str


class SongCreate(SongBase):
    """
    歌曲创建请求模型
    """
    singer_id: str | None = None


class SongResponse(SongBase):
    """
    歌曲响应模型
    """
    id: str
    singer_id: str | None = None
    created_at: str
    
    class Config:
        from_attributes = True


class FavoriteCreate(BaseModel):
    """
    收藏创建请求模型
    """
    song_id: str = Field(..., description="歌曲ID")


class FavoriteResponse(BaseModel):
    """
    收藏响应模型
    """
    id: str
    user_id: str
    song_id: str
    song: SongResponse
    created_at: str
    
    class Config:
        from_attributes = True


class FavoriteToggleRequest(BaseModel):
    """
    收藏切换请求模型
    """
    song_id: str


class FavoriteToggleResponse(BaseModel):
    """
    收藏切换响应模型
    """
    is_favorited: bool
    message: str
