from supabase import Client
from typing import Any
import logging

logger = logging.getLogger(__name__)


class SongRepository:
    """
    歌曲数据访问层
    负责所有与歌曲相关的数据库操作
    """
    
    def __init__(self, db: Client):
        self.db = db
    
    def get_by_id(self, song_id: str) -> dict[str, Any] | None:
        """根据ID获取歌曲信息"""
        try:
            # ✅ 优化：使用 maybe_single()，如果找不到返回 None 而不是报错
            response = self.db.table('songs').select('*').eq('id', song_id).maybe_single().execute()
            return response.data
        except Exception as e:
            logger.error(f"获取歌曲失败 song_id={song_id}: {str(e)}")
            return None
    
    def get_all(self, limit: int = 100) -> list[dict[str, Any]]:
        """获取所有歌曲"""
        try:
            response = self.db.table('songs').select('*').limit(limit).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"获取所有歌曲失败: {str(e)}")
            return []
    
    def get_by_singer(self, singer_id: str) -> list[dict[str, Any]]:
        """根据歌手ID获取歌曲列表"""
        try:
            response = self.db.table('songs').select('*').eq('singer_id', singer_id).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"根据歌手获取歌曲失败 singer_id={singer_id}: {str(e)}")
            return []
    
    def create(self, song_data: dict[str, Any]) -> dict[str, Any]:
        """创建歌曲记录"""
        try:
            response = self.db.table('songs').insert(song_data).execute()
            logger.info(f"创建歌曲成功 title={song_data.get('title')}")
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"创建歌曲失败: {e}")
            return {}
    
    def get_all_with_features(self) -> list[dict[str, Any]]:
        """
        获取所有包含特征向量的歌曲
        用于声学特征匹配
        """
        try:
            response = (
                self.db.table('songs')
                .select('id, title, artist, album, cover_url, tag, tag_label, feature_vector')
                .not_.is_('feature_vector', 'null')  # 仅返回有特征向量的歌曲
                .execute()
            )
            # logger.info(f"获取特征向量歌曲成功，共 {len(response.data) if response.data else 0} 首")
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"获取特征向量歌曲失败: {str(e)}")
            return []


class FavoriteRepository:
    """
    收藏数据访问层
    负责所有与用户收藏相关的数据库操作
    """
    
    def __init__(self, db: Client):
        self.db = db
    
    def get_user_favorites(self, user_id: str) -> list[dict[str, Any]]:
        """获取用户的所有收藏"""
        try:
            response = (
                self.db.table('user_favorites')
                .select('*, songs(*)')  # 关联查询歌曲详情
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .execute()
            )
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"获取用户收藏失败 user_id={user_id}: {str(e)}")
            return []
    
    def check_favorite(self, user_id: str, song_id: str) -> bool:
        """
        ✅ 核心修复：检查用户是否收藏了某首歌
        使用列表查询而非 .single()，彻底解决 406 Not Acceptable 错误
        """
        try:
            response = (
                self.db.table('user_favorites')
                .select('id')  # 只查id即可，减少传输量
                .eq('user_id', user_id)
                .eq('song_id', song_id)
                .execute()
            )
            # 只要列表不为空，就说明收藏了
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            logger.error(f"检查收藏状态失败 user_id={user_id}, song_id={song_id}: {str(e)}")
            return False
    
    def add_favorite(self, user_id: str, song_id: str) -> dict[str, Any]:
        """添加收藏"""
        try:
            favorite_data = {
                'user_id': user_id,
                'song_id': song_id
            }
            response = self.db.table('user_favorites').insert(favorite_data).execute()
            logger.info(f"添加收藏成功 user_id={user_id}, song_id={song_id}")
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"添加收藏失败: {e}")
            return {}
    
    def remove_favorite(self, user_id: str, song_id: str) -> bool:
        """删除收藏"""
        try:
            self.db.table('user_favorites').delete().eq('user_id', user_id).eq('song_id', song_id).execute()
            logger.info(f"删除收藏成功 user_id={user_id}, song_id={song_id}")
            return True
        except Exception as e:
            logger.error(f"删除收藏失败 user_id={user_id}, song_id={song_id}: {str(e)}")
            return False

    def toggle_favorite(self, user_id: str, song_id: str) -> bool:
        """
        ✅ 新增：智能切换收藏状态
        Returns: True=变为已收藏(红色), False=变为未收藏(灰色)
        """
        # 1. 快速检查
        is_fav = self.check_favorite(user_id, song_id)
        
        # 2. 根据状态取反
        if is_fav:
            self.remove_favorite(user_id, song_id)
            return False
        else:
            self.add_favorite(user_id, song_id)
            return True