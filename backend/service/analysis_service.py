from supabase import Client
from repository.analysis_repo import AnalysisRepository, SingerRepository
from repository.song_repo import SongRepository
from service.audio_analyzer import AudioAnalyzer
from service.ai_image_service import AIImageService
from schema.analysis import VoiceAnalysisResponse, MatchedSingerResponse, RecommendedSongResponse
from config import get_settings
# ✅ 引入 FastAPI 的并发工具，防止服务器卡死
from fastapi.concurrency import run_in_threadpool
import logging
import os
import uuid
import time
import threading
import numpy as np
from datetime import datetime

logger = logging.getLogger(__name__)


class AnalysisService:
    """
    声音分析业务逻辑层 (高性能优化版)
    
    设计说明:
    - 使用 run_in_threadpool 处理 CPU 密集型任务（音频分析、特征提取）
    - 防止阻塞 FastAPI 的异步事件循环
    - 提升服务器并发处理能力
    """
    
    def __init__(self, db: Client):
        self.db = db
        self.analysis_repo = AnalysisRepository(db)
        self.singer_repo = SingerRepository(db)
        self.song_repo = SongRepository(db)
        self.settings = get_settings()
    
    async def analyze_voice(self, user_id: str, audio_file_path: str, audio_filename: str) -> VoiceAnalysisResponse:
        """
        分析用户声音 (基于真实声学特征)
        
        流程:
        1. 提取用户音频的声学特征 (音高、亮度、响度)
        2. 与歌手声学模型进行匹配
        3. 生成真实的雷达图数据
        4. 推荐相似歌曲
        
        优化点:
        - CPU 密集型任务使用 run_in_threadpool 防止阻塞
        - 只分析前30秒音频,确保快速响应
        """
        start_time = time.time()
        logger.info(f"开始分析用户声音 user_id={user_id}")
        
        # ==================== 1. 提取用户音频特征 ====================
        
        from service.audio_feature_extractor import extract_audio_features, normalize_user_features
        from service.singer_acoustic_profiles import get_all_singer_profiles, normalize_singer_features, get_singer_id
        
        # 使用线程池执行CPU密集型特征提取
        logger.info("提取音频特征...")
        user_features = await run_in_threadpool(
            extract_audio_features, 
            audio_file_path
        )
        
        # 归一化用户特征
        user_normalized = normalize_user_features(user_features)
        
        # ==================== 2. 匹配最佳歌手 ====================
        
        logger.info("匹配歌手声学模型...")
        singer_profiles = get_all_singer_profiles()
        
        min_distance = float('inf')
        best_singer_name = None
        best_singer_profile = None
        
        # 计算欧氏距离,找到最匹配的歌手
        for singer_name, profile in singer_profiles.items():
            singer_normalized = normalize_singer_features(profile)
            
            # 计算欧氏距离
            distance = np.sqrt(
                (user_normalized['pitch'] - singer_normalized['pitch'])**2 +
                (user_normalized['brightness'] - singer_normalized['brightness'])**2 +
                (user_normalized['energy'] - singer_normalized['energy'])**2
            )
            
            if distance < min_distance:
                min_distance = distance
                best_singer_name = singer_name
                best_singer_profile = profile
        
        # 如果没有匹配到,使用默认
        if not best_singer_name:
            best_singer_name = "陈奕迅"
            best_singer_profile = singer_profiles[best_singer_name]
            min_distance = 0.3
        
        logger.info(f"匹配结果: {best_singer_name}, 距离={min_distance:.3f}")
        
        # ==================== 3. 计算匹配度分数 ====================
        
        # 距离越小,匹配度越高
        # 距离范围约0-1.5,映射到60-98分
        similarity_score = int((1 - min(min_distance, 1)) * 38 + 60)
        similarity_score = max(60, min(98, similarity_score))
        
        # ==================== 4. 生成真实雷达图 ====================
        
        radar_data = [
            {
                "subject": "音准",
                "A": int(user_features['pitch_stability']),
                "B": 75,
                "fullMark": 150
            },
            {
                "subject": "音域",
                "A": int(user_features['pitch_range_score']),
                "B": 70,
                "fullMark": 150
            },
            {
                "subject": "明亮度",
                "A": int(user_features['brightness_score']),
                "B": 65,
                "fullMark": 150
            },
            {
                "subject": "力度",
                "A": int(user_features['energy_score']),
                "B": 70,
                "fullMark": 150
            },
            {
                "subject": "稳定性",
                "A": int(user_features['stability_score']),
                "B": 68,
                "fullMark": 150
            }
        ]
        
        # ==================== 5. 生成清晰度和稳定性评级 ====================
        
        # 清晰度基于明亮度
        if user_features['brightness_score'] >= 70:
            clarity = "优秀"
        elif user_features['brightness_score'] >= 50:
            clarity = "良好"
        else:
            clarity = "一般"
        
        # 稳定性百分比
        stability = f"{int(user_features['stability_score'])}%"
        
        # ==================== 6. 生成歌手信息 ====================
        
        # 生成头像
        avatar_url = await self._generate_singer_avatar(best_singer_name)
        
        matched_singer_response = MatchedSingerResponse(
            id=f"singer-{best_singer_name}",
            name=best_singer_name,
            description=best_singer_profile['description'],
            avatar_url=avatar_url,
            voice_characteristics=best_singer_profile.get('voice_characteristics', {})
        )
        
        # ==================== 7. 推荐歌曲 ====================
        
        # 尝试从数据库获取歌曲推荐
        try:
            songs = self.song_repo.get_all_with_features()
            if songs:
                # 筛选该歌手的歌曲作为舒适区
                comfort_songs = [s for s in songs if s.get('artist') == best_singer_name][:5]
                # 筛选其他歌手的歌曲作为挑战区
                challenge_songs = [s for s in songs if s.get('artist') != best_singer_name][:5]
                
                recommended_comfort = await self._build_recommended_songs(comfort_songs, user_features, "comfortable")
                recommended_challenge = await self._build_recommended_songs(challenge_songs, user_features, "challenge")
            else:
                recommended_comfort = []
                recommended_challenge = []
        except Exception as e:
            logger.warning(f"获取推荐歌曲失败: {str(e)}")
            recommended_comfort = []
            recommended_challenge = []
        
        # ==================== 8. 返回结果 ====================
        
        final_response = VoiceAnalysisResponse(
            id=str(uuid.uuid4()),
            user_id=user_id,
            score=similarity_score,
            clarity=clarity,
            stability=stability,
            radar_data=radar_data,
            matched_singer=matched_singer_response,
            audio_url=None,
            created_at=datetime.now(),
            recommended_songs_comfort=recommended_comfort,
            recommended_songs_challenge=recommended_challenge,
            matched_song_title=None,
            matched_song_id=None
        )
        
        # 异步保存到数据库
        threading.Thread(
            target=self._save_task_in_background, 
            args=(user_id, best_singer_name, similarity_score, {
                'clarity': clarity,
                'stability': stability,
                'radar_data': radar_data
            }), 
            daemon=True
        ).start()
        
        elapsed_time = time.time() - start_time
        logger.info(f"✅ 分析完成,耗时: {elapsed_time:.2f}秒, 匹配歌手: {best_singer_name}, 得分: {similarity_score}")
        return final_response


    # --- 内部辅助方法 ---

    def _save_task_in_background(self, user_id, singer_name, similarity_score, analysis_result):
        """
        后台保存任务(在独立线程中运行)
        
        Args:
            user_id: 用户ID
            singer_name: 匹配的歌手名称
            similarity_score: 匹配分数
            analysis_result: 分析结果数据
        """
        try:
            from service.singer_acoustic_profiles import get_singer_id
            
            # ✅ 获取歌手数据库ID (1-10)
            matched_singer_id = get_singer_id(singer_name)
            
            # ✅ 安全检查: 确保ID在有效范围内
            if matched_singer_id < 1 or matched_singer_id > 10:
                logger.error(f"❌ 歌手ID异常: {matched_singer_id}, 强制修正为5")
                matched_singer_id = 5
            
            logger.info(f"💾 准备保存分析结果: user_id={user_id}, singer_name={singer_name}, singer_id={matched_singer_id}")
            
            analysis_data = {
                'user_id': user_id,
                'score': similarity_score,
                'clarity': analysis_result['clarity'],
                'stability': analysis_result['stability'],
                'radar_data': analysis_result['radar_data'],
                'matched_singer_id': matched_singer_id,  # ✅ 使用正确的数据库ID
                'audio_url': None
            }
            
            self.analysis_repo.create(analysis_data)
            logger.info(f"✅ [后台任务] 数据保存成功, singer_id={matched_singer_id}")
        except Exception as e:
            logger.error(f"❌ [后台任务] 保存失败: {e}")
            logger.exception(e)  # 打印完整堆栈

    async def _create_fallback_response(self, user_id, audio_file_path):
        """
        降级方案（数据库不可用时）
        
        优化: 降级时也使用 run_in_threadpool 优化性能
        """
        # ✅ 优化点：降级时也需要优化计算性能
        features = await run_in_threadpool(
            AudioAnalyzer.analyze_audio_file, 
            audio_file_path
        )
        res = AudioAnalyzer.generate_analysis_result(features)
        
        default_singer = MatchedSingerResponse(
            id="fallback-singer",
            name="默认音色库",
            description="数据库不可用",
            avatar_url=await self._generate_singer_avatar("音色"),
            voice_characteristics={}
        )
        
        return VoiceAnalysisResponse(
            id=str(uuid.uuid4()),
            user_id=user_id,
            score=75,
            clarity=res['clarity'],
            stability=res['stability'],
            radar_data=res['radar_data'],
            matched_singer=default_singer,
            audio_url=None,
            created_at=datetime.now(),
            recommended_songs_comfort=[],
            recommended_songs_challenge=[],
            matched_song_title=None,
            matched_song_id=None
        )
    
    async def _generate_singer_avatar(self, artist_name):
        """生成歌手头像"""
        try:
            return await AIImageService.generate_singer_avatar(artist_name)
        except:
            return "/static/default_avatar.svg"
    
    async def _build_recommended_songs(self, songs, user_features, difficulty_level):
        """
        构建推荐歌曲列表
        
        Args:
            songs: 歌曲列表
            user_features: 用户音频特征
            difficulty_level: 难度级别 ("comfortable" 或 "challenge")
            
        Returns:
            list: RecommendedSongResponse列表
        """
        recommended = []
        
        for song in songs:
            cover = song.get('cover_url')
            if not cover:
                # 如果没有封面,使用默认或生成
                try:
                    cover = await AIImageService.generate_song_cover(song.get('title'))
                except:
                    cover = "/static/default_cover.svg"
            
            # 基于用户特征生成相似度分数
            if difficulty_level == "comfortable":
                # 舒适区歌曲相似度较高
                base_score = 80
                variation = int(user_features.get('pitch_stability', 70) / 5)
            else:
                # 挑战区歌曲相似度较低
                base_score = 55
                variation = int(user_features.get('energy_score', 50) / 5)
            
            similarity_score = min(98, max(50, base_score + variation))
            
            # 生成动态标签
            if difficulty_level == "comfortable":
                if similarity_score >= 90:
                    tag_label = "完美契合"
                elif similarity_score >= 80:
                    tag_label = "非常契合"
                else:
                    tag_label = "比较合适"
            else:
                if similarity_score >= 70:
                    tag_label = "有点挑战"
                elif similarity_score >= 55:
                    tag_label = "极具挑战"
                else:
                    tag_label = "高难挑战"
            
            recommended.append(RecommendedSongResponse(
                id=song['id'],
                title=song.get('title', '未知'),
                artist=song.get('artist', ''),
                cover_url=cover,
                similarity_score=similarity_score,
                difficulty_level=difficulty_level,
                tag_label=tag_label
            ))
        
        return recommended
    
    def _get_similar_songs(self, matched_song, all_songs, limit=5):
        """
        获取相似歌曲（舒适区）
        
        优化: 简化逻辑，提高性能，过滤脏数据
        """
        similar = []
        matched_artist = matched_song.get('artist')
        matched_id = matched_song.get('id')
        
        for song in all_songs:
            # 1. 排除匹配歌曲本身
            if song.get('id') == matched_id:
                continue

            # ✅ 新增：过滤掉"本地导入"的脏数据
            artist = song.get('artist', '')
            title = song.get('title', '')
            if '本地导入' in artist or '本地导入' in title:
                continue
            
            # 2. 同一歌手的其他歌曲（优先级最高）
            if song.get('artist') == matched_artist:
                similar.append({'song': song, 'priority': 1})
            # 3. 相同标签（优先级次之）
            elif song.get('tag') == matched_song.get('tag'):
                similar.append({'song': song, 'priority': 2})
        
        similar.sort(key=lambda x: x['priority'])
        return [x['song'] for x in similar]
    
    def _get_challenge_songs(self, matched_song, all_songs, limit=5):
        """
        获取挑战歌曲（挑战区）
        
        优化: 简化逻辑，提高性能，过滤脏数据
        """
        challenges = []
        matched_tag = matched_song.get('tag', 0)
        
        for song in all_songs:
            # ✅ 新增：过滤掉"本地导入"的脏数据
            if '本地导入' in song.get('artist', '') or '本地导入' in song.get('title', ''):
                continue
            
            song_tag = song.get('tag', 0)
            if song_tag > matched_tag:
                challenges.append({
                    'song': song,
                    'gap': song_tag - matched_tag
                })
        
        # 如果没有难度更高的歌曲，选择不同歌手的歌曲
        if not challenges:
            matched_artist = matched_song.get('artist')
            for song in all_songs:
                # ✅ 这里也要过滤
                if '本地导入' in song.get('artist', '') or '本地导入' in song.get('title', ''):
                    continue
                    
                if song.get('artist') != matched_artist:
                    challenges.append({'song': song, 'gap': 0})
        
        challenges.sort(key=lambda x: x['gap'])
        return [x['song'] for x in challenges]

    # --- 历史查询方法 ---
    
    def get_analysis_by_id(self, analysis_id: str) -> VoiceAnalysisResponse | None:
        """根据ID获取分析记录"""
        analysis_data = self.analysis_repo.get_by_id(analysis_id)
        if not analysis_data:
            return None
        singer_data = analysis_data.pop('matched_singers', None)
        return VoiceAnalysisResponse(
            **analysis_data,
            matched_singer=MatchedSingerResponse(**singer_data) if singer_data else None
        )
    
    def get_user_analysis_history(self, user_id: str, limit: int = 10) -> list[VoiceAnalysisResponse]:
        """获取用户的分析历史记录"""
        analyses = self.analysis_repo.get_user_analyses(user_id, limit)
        results = []
        for analysis in analyses:
            singer_data = analysis.pop('matched_singers', None)
            results.append(VoiceAnalysisResponse(
                **analysis,
                matched_singer=MatchedSingerResponse(**singer_data) if singer_data else None
            ))
        return results
    
    def _build_netease_search_url(self, song: dict) -> str:
        """构建网易云音乐搜索URL"""
        import urllib.parse
        keyword = f"{song.get('artist','')} {song.get('title','')}"
        return f"https://music.163.com/#/search/m/?s={urllib.parse.quote(keyword)}"
    
    async def _upload_audio_to_storage(self, file_path: str, user_id: str, filename: str) -> str:
        """上传音频到存储桶（暂未实现）"""
        return None
    
    def _get_content_type(self, file_ext: str) -> str:
        """获取文件MIME类型"""
        return 'audio/mpeg'
    
    def _create_default_singer(self) -> dict:
        """创建默认歌手信息"""
        return {}
