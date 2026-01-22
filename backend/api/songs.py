from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from database import get_db
from service.song_service import SongService
from schema.song import SongResponse, FavoriteToggleRequest, FavoriteToggleResponse
from api.auth import get_current_user_id
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/songs", tags=["歌曲"])


@router.get("", response_model=list[SongResponse])
async def get_all_songs(limit: int = 100, db: Client = Depends(get_db)):
    """
    获取所有歌曲
    """
    song_service = SongService(db)
    
    try:
        songs = song_service.get_all_songs(limit)
        return songs
    except Exception as e:
        logger.error(f"获取歌曲列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/recommended/{analysis_id}", response_model=list[SongResponse])
async def get_recommended_songs(analysis_id: str, db: Client = Depends(get_db)):
    """
    基于分析结果推荐歌曲
    """
    from service.analysis_service import AnalysisService
    
    analysis_service = AnalysisService(db)
    song_service = SongService(db)
    
    # 获取分析结果
    analysis = analysis_service.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在"
        )
    
    # 基于匹配歌手推荐歌曲
    try:
        songs = song_service.get_recommended_songs(
            singer_id=analysis.matched_singer.id,
            analysis_score=analysis.score
        )
        return songs
    except Exception as e:
        logger.error(f"获取推荐歌曲失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/favorites/toggle", response_model=FavoriteToggleResponse)
async def toggle_favorite(
    request: FavoriteToggleRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db)
):
    """
    切换收藏状态（添加或删除收藏）
    """
    song_service = SongService(db)
    
    try:
        result = song_service.toggle_favorite(user_id, request.song_id)
        return result
    except Exception as e:
        logger.error(f"切换收藏失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/favorites", response_model=list[SongResponse])
async def get_user_favorites(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db)
):
    """
    获取用户的收藏列表
    """
    song_service = SongService(db)
    
    try:
        favorites = song_service.get_user_favorites(user_id)
        return favorites
    except Exception as e:
        logger.error(f"获取收藏列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
