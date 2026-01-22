from supabase import Client
from typing import Any
import logging

logger = logging.getLogger(__name__)


class AnalysisRepository:
    """
    声音分析数据访问层
    负责所有与声音分析记录相关的数据库操作
    """
    
    def __init__(self, db: Client):
        self.db = db
    
    def create(self, analysis_data: dict[str, Any]) -> dict[str, Any]:
        """
        创建声音分析记录
        
        Args:
            analysis_data: 分析数据字典
            
        Returns:
            创建的分析记录
        """
        response = self.db.table('voice_analyses').insert(analysis_data).execute()
        logger.info(f"创建分析记录成功 user_id={analysis_data.get('user_id')}")
        return response.data[0]
    
    def get_by_id(self, analysis_id: str) -> dict[str, Any] | None:
        """
        根据ID获取分析记录
        
        Args:
            analysis_id: 分析记录ID
            
        Returns:
            分析记录数据，如果不存在返回None
        """
        try:
            # 联表查询，获取匹配歌手信息
            response = (
                self.db.table('voice_analyses')
                .select('*, matched_singers(*)')
                .eq('id', analysis_id)
                .single()
                .execute()
            )
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"获取分析记录失败 analysis_id={analysis_id}: {str(e)}")
            return None
    
    def get_user_analyses(self, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
        """
        获取用户的分析历史
        
        Args:
            user_id: 用户ID
            limit: 返回记录数量限制
            
        Returns:
            分析记录列表
        """
        try:
            response = (
                self.db.table('voice_analyses')
                .select('*, matched_singers(*)')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .limit(limit)
                .execute()
            )
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"获取用户分析历史失败 user_id={user_id}: {str(e)}")
            return []


class SingerRepository:
    """
    歌手数据访问层
    负责所有与匹配歌手相关的数据库操作
    """
    
    def __init__(self, db: Client):
        self.db = db
    
    def get_by_id(self, singer_id: str) -> dict[str, Any] | None:
        """
        根据ID获取歌手信息
        
        Args:
            singer_id: 歌手ID
            
        Returns:
            歌手数据，如果不存在返回None
        """
        try:
            response = self.db.table('matched_singers').select('*').eq('id', singer_id).single().execute()
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"获取歌手信息失败 singer_id={singer_id}: {str(e)}")
            return None
    
    def get_all(self) -> list[dict[str, Any]]:
        """
        获取所有歌手
        
        Returns:
            歌手列表
        """
        try:
            response = self.db.table('matched_singers').select('*').execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"获取所有歌手失败: {str(e)}")
            return []
    
    def create(self, singer_data: dict[str, Any]) -> dict[str, Any]:
        """
        创建歌手记录
        
        Args:
            singer_data: 歌手数据字典
            
        Returns:
            创建的歌手数据
        """
        response = self.db.table('matched_singers').insert(singer_data).execute()
        logger.info(f"创建歌手成功 name={singer_data.get('name')}")
        return response.data[0]
