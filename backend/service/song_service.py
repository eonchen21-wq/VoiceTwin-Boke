from supabase import Client
from repository.song_repo import SongRepository, FavoriteRepository
from schema.song import SongResponse, FavoriteToggleResponse
import logging
import random

logger = logging.getLogger(__name__)


class SongService:
    """
    歌曲业务逻辑层
    处理歌曲查询、推荐和收藏功能
    """
    
    def __init__(self, db: Client):
        self.song_repo = SongRepository(db)
        self.favorite_repo = FavoriteRepository(db)
    
    def get_all_songs(self, limit: int = 100) -> list[SongResponse]:
        """获取所有歌曲"""
        songs = self.song_repo.get_all(limit)
        return [SongResponse(**song) for song in songs]
    
    def get_recommended_songs(self, singer_id: str, analysis_score: int = None) -> list[SongResponse]:
        """基于匹配歌手推荐歌曲"""
        singer_songs = self.song_repo.get_by_singer(singer_id)
        
        if singer_songs:
            songs = [SongResponse(**song) for song in singer_songs]
        else:
            all_songs = self.song_repo.get_all(20)
            songs = [SongResponse(**song) for song in all_songs]
        
        if analysis_score and analysis_score >= 85:
            comfort_songs = [s for s in songs if getattr(s, 'tag', '') == 'comfort']
            challenge_songs = [s for s in songs if getattr(s, 'tag', '') == 'challenge']
            
            recommended = random.sample(comfort_songs, min(2, len(comfort_songs)))
            recommended += random.sample(challenge_songs, min(1, len(challenge_songs)))
        else:
            comfort_songs = [s for s in songs if getattr(s, 'tag', '') == 'comfort']
            recommended = random.sample(comfort_songs, min(3, len(comfort_songs)))
        
        logger.info(f"推荐了 {len(recommended)} 首歌曲给歌手 {singer_id}")
        return recommended if recommended else songs[:3]
    
    def toggle_favorite(self, user_id: str, song_id: str) -> FavoriteToggleResponse:
        """
        ✅ 优化版：切换收藏状态
        利用 Repo 层的 toggle_favorite 方法简化逻辑
        """
        try:
            # 1. 检查歌曲是否存在
            song = self.song_repo.get_by_id(song_id)
            if not song:
                raise ValueError(f"歌曲不存在: {song_id}")
            
            # 2. 调用 Repo 层的一键切换方法
            # is_favorited = True (变红/收藏成功), False (变灰/取消收藏)
            is_favorited = self.favorite_repo.toggle_favorite(user_id, song_id)
            
            status_msg = "收藏成功" if is_favorited else "已取消收藏"
            logger.info(f"✅ {status_msg} user_id={user_id}, song_id={song_id}")
            
            return FavoriteToggleResponse(
                is_favorited=is_favorited,
                message=status_msg
            )
            
        except ValueError as ve:
            logger.error(f"❌ 收藏失败: {str(ve)}")
            raise ve
        except Exception as e:
            logger.error(f"❌ 收藏操作异常: {str(e)}", exc_info=True)
            raise Exception(f"收藏操作失败: {str(e)}")
    
    def get_user_favorites(self, user_id: str) -> list[SongResponse]:
        """获取用户的收藏列表"""
        try:
            favorites = self.favorite_repo.get_user_favorites(user_id)
            songs = []
            for favorite in favorites:
                song_data = favorite.get('songs')
                if song_data:
                    songs.append(SongResponse(**song_data))
            
            return songs
        except Exception as e:
            logger.error(f"❌ 获取用户收藏失败: {str(e)}", exc_info=True)
            return []
    
    def check_is_favorited(self, user_id: str, song_id: str) -> bool:
        """检查歌曲是否已被用户收藏"""
        try:
            return self.favorite_repo.check_favorite(user_id, song_id)
        except Exception as e:
            logger.error(f"❌ 检查收藏状态失败: {str(e)}")
            return False