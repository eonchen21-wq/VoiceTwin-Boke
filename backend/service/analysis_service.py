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
        分析用户声音（高性能异步版本）
        
        优化点:
        1. CPU 密集型任务使用 run_in_threadpool 防止阻塞
        2. 推荐歌曲限制为5首
        3. 自动生成封面图片
        """
        start_time = time.time()
        logger.info(f"开始分析用户声音 user_id={user_id}")
        
        # ==================== 1. 计算核心数据 (高性能异步处理) ====================
        
        # 1.1 提取特征向量 (CPU密集型任务，放入线程池防止阻塞)
        # ✅ 优化点：使用 run_in_threadpool
        user_feature_vector = await run_in_threadpool(
            AudioAnalyzer.extract_mfcc_feature_vector, 
            audio_file_path
        )
        
        # 1.2 获取歌曲库
        try:
            # NOTE: 如果数据库查询很慢，也可以包进 run_in_threadpool
            songs = self.song_repo.get_all_with_features()
            if not songs:
                return await self._create_fallback_response(user_id, audio_file_path)
        except Exception as e:
            logger.error(f"数据库查询失败: {str(e)}")
            return await self._create_fallback_response(user_id, audio_file_path)
            
        # 1.3 匹配最佳歌曲
        best_match = None
        highest_similarity = -1
        
        for song in songs:
            if not song.get('feature_vector'): continue
            try:
                # NOTE: 计算余弦相似度是数学运算，量大时可放入线程池
                similarity = AudioAnalyzer.calculate_cosine_similarity(
                    user_feature_vector, song['feature_vector']
                )
                if similarity > highest_similarity:
                    highest_similarity = similarity
                    best_match = song
            except: continue
            
        if not best_match:
            best_match = songs[0] if songs else None
            if not best_match: 
                return await self._create_fallback_response(user_id, audio_file_path)
            highest_similarity = 0.5
            
        # 1.4 生成图表数据 (CPU密集型，放入线程池)
        # ✅ 优化点：使用 run_in_threadpool
        features = await run_in_threadpool(
            AudioAnalyzer.analyze_audio_file, 
            audio_file_path
        )
        analysis_result = AudioAnalyzer.generate_analysis_result(features)
        
        # ==================== 2. 准备结果数据 ====================
        artist_name = best_match.get('artist', '未知歌手')
        song_title = best_match.get('title', '未知歌曲')
        
        # 获取头像
        main_avatar = await self._generate_singer_avatar(artist_name)
        
        matched_singer_response = MatchedSingerResponse(
            id="temp-singer-id",
            name=artist_name,
            description=f"声音特质与 {artist_name} 相似",
            avatar_url=main_avatar,
            voice_characteristics={}
        )
        
        similarity_score = int(highest_similarity * 100)
        
        # ==================== 3. 智能推荐逻辑 (限制5首 & 自动配图) ====================
        
        # 3.1 筛选舒适区
        comfort_songs_raw = self._get_similar_songs(best_match, songs, limit=15)
        used_ids = {best_match['id']}
        filtered_comfort = []
        for s in comfort_songs_raw:
            if s['id'] not in used_ids:
                filtered_comfort.append(s)
                used_ids.add(s['id'])
        
        # ✅ 限制舒适区数量：5首
        final_comfort_list = filtered_comfort[:5]
        logger.info(f"✅ 舒适区推荐: {len(final_comfort_list)}首")
        
        # 3.2 筛选挑战区
        challenge_candidates = [s for s in songs if s['id'] not in used_ids]
        challenge_songs_raw = self._get_challenge_songs(best_match, challenge_candidates, limit=15)
        
        # ✅ 限制挑战区数量：5首
        final_challenge_list = challenge_songs_raw[:5]
        logger.info(f"✅ 挑战区推荐: {len(final_challenge_list)}首")
        
        # 3.3 构建列表并自动配图（动态标签生成）
        recommended_comfort = []
        for song in final_comfort_list:
            cover = song.get('cover_url')
            if not cover:
                # 如果没有封面，自动生成
                cover = await AIImageService.generate_song_cover(song.get('title'))
            
            # 计算该歌曲与用户声音的相似度
            song_similarity = 0
            if song.get('feature_vector'):
                try:
                    song_similarity = AudioAnalyzer.calculate_cosine_similarity(
                        user_feature_vector, song['feature_vector']
                    )
                except:
                    song_similarity = 0.75  # 默认值
            else:
                song_similarity = 0.75  # 无特征向量时使用默认值
            
            # 根据相似度生成动态标签
            if song_similarity >= 0.90:
                tag_label = "完美契合"
            elif song_similarity >= 0.80:
                tag_label = "非常契合"
            else:
                tag_label = "比较合适"
            
            similarity_score = int(song_similarity * 100)
            
            recommended_comfort.append(RecommendedSongResponse(
                id=song['id'],
                title=song.get('title', '未知'),
                artist=song.get('artist', ''),
                cover_url=cover, 
                similarity_score=similarity_score,
                difficulty_level="comfortable",
                tag_label=tag_label
            ))

        recommended_challenge = []
        for song in final_challenge_list:
            cover = song.get('cover_url')
            if not cover:
                # 如果没有封面，自动生成
                cover = await AIImageService.generate_song_cover(song.get('title'))
            
            # 计算该歌曲与用户声音的相似度
            song_similarity = 0
            if song.get('feature_vector'):
                try:
                    song_similarity = AudioAnalyzer.calculate_cosine_similarity(
                        user_feature_vector, song['feature_vector']
                    )
                except:
                    song_similarity = 0.55  # 默认值
            else:
                song_similarity = 0.55  # 无特征向量时使用默认值
            
            # 根据相似度生成动态标签（挑战区歌曲相似度较低）
            if song_similarity >= 0.70:
                tag_label = "有点挑战"
            elif song_similarity >= 0.50:
                tag_label = "极具挑战"
            else:
                tag_label = "高难挑战"
            
            similarity_score = int(song_similarity * 100)
                
            recommended_challenge.append(RecommendedSongResponse(
                id=song['id'],
                title=song.get('title', '未知'),
                artist=song.get('artist', ''),
                cover_url=cover,
                similarity_score=similarity_score,
                difficulty_level="challenge",
                tag_label=tag_label
            ))
        
        # ==================== 4. 返回结果 ====================
        final_response = VoiceAnalysisResponse(
            id=str(uuid.uuid4()),
            user_id=user_id,
            score=similarity_score,
            clarity=analysis_result['clarity'],
            stability=analysis_result['stability'],
            radar_data=analysis_result['radar_data'],
            matched_singer=matched_singer_response,
            audio_url=None,
            created_at=datetime.now(),
            recommended_songs_comfort=recommended_comfort,
            recommended_songs_challenge=recommended_challenge,
            matched_song_title=song_title,
            matched_song_id=best_match.get('id')
        )
        
        # 异步保存 (使用 daemon=True 确保不阻碍主进程退出)
        threading.Thread(
            target=self._save_task_in_background, 
            args=(user_id, similarity_score, analysis_result), 
            daemon=True
        ).start()
        
        elapsed_time = time.time() - start_time
        logger.info(f"✅ 分析完成，耗时: {elapsed_time:.2f}秒")
        return final_response

    # --- 内部辅助方法 ---

    def _save_task_in_background(self, user_id, similarity_score, analysis_result):
        """
        后台保存任务（在独立线程中运行）
        
        FIXME: 建议后续重构为 FastAPI BackgroundTasks
        """
        try:
            analysis_data = {
                'user_id': user_id,
                'score': similarity_score,
                'clarity': analysis_result['clarity'],
                'stability': analysis_result['stability'],
                'radar_data': analysis_result['radar_data'],
                'matched_singer_id': 'default-singer',
                'audio_url': None
            }
            self.analysis_repo.create(analysis_data)
            logger.info("✅ [后台任务] 数据保存成功")
        except Exception as e:
            logger.warning(f"⚠️ [后台任务] 保存失败: {e}")

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
