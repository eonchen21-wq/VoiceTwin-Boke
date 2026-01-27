from pydantic import BaseModel, Field
from typing import Any
from datetime import datetime


class RadarDataPoint(BaseModel):
    """
    雷达图数据点模型
    """
    subject: str
    A: int = Field(..., ge=0, le=150)
    B: int = Field(..., ge=0, le=150)
    fullMark: int = 150


class MatchedSingerBase(BaseModel):
    """
    匹配歌手基础模型
    """
    name: str
    description: str
    avatar_url: str


class MatchedSingerResponse(MatchedSingerBase):
    """
    匹配歌手响应模型
    """
    id: str
    
    class Config:
        from_attributes = True


class VoiceAnalysisCreate(BaseModel):
    """
    声音分析创建请求模型
    NOTE: 音频文件通过 multipart/form-data 上传，此模型主要用于验证
    """
    pass  # 音频文件在路由层处理


class RecommendedSongResponse(BaseModel):
    """
    推荐歌曲响应模型
    用于舒适区和挑战区推荐
    """
    id: str
    title: str
    artist: str
    cover_url: str | None = None
    similarity_score: int = Field(..., ge=0, le=100, description="与用户声音的相似度")
    difficulty_level: str = Field(..., description="难度级别: comfortable 或 challenge")
    tag_label: str = Field(default="推荐", description="匹配度标签：完美契合、非常契合、比较合适、极具挑战等")


class VoiceAnalysisResponse(BaseModel):
    """
    声音分析响应模型
    """
    id: str
    user_id: str
    score: int = Field(..., ge=0, le=100, description="综合得分")
    clarity: str = Field(..., description="清晰度评级")
    stability: str = Field(..., description="稳定性百分比")
    radar_data: list[RadarDataPoint]
    matched_singer: MatchedSingerResponse
    audio_url: str | None = None
    created_at: datetime
    recommended_songs_comfort: list[RecommendedSongResponse] | None = None
    recommended_songs_challenge: list[RecommendedSongResponse] | None = None
    matched_song_title: str | None = None  # 新增：匹配的歌曲名
    matched_song_id: str | None = None     # 新增：匹配的歌曲ID
    
    class Config:
        from_attributes = True


class AudioFeatures(BaseModel):
    """
    音频特征数据模型
    用于内部音频分析结果传递
    """
    # 基础特征
    duration: float
    sample_rate: int
    
    # 频谱特征
    spectral_centroid_mean: float
    spectral_bandwidth_mean: float
    spectral_rolloff_mean: float
    
    # 音色特征 (MFCC)
    mfcc_means: list[float]
    mfcc_stds: list[float]
    
    # 能量和音量特征
    rms_mean: float
    rms_std: float
    zero_crossing_rate_mean: float
    
    # 音高特征（可选）
    pitch_mean: float | None = None
    pitch_std: float | None = None


class AnalysisResult(BaseModel):
    """
    分析结果模型
    内部使用，用于从音频特征生成用户友好的分析结果
    """
    score: int
    clarity: str
    stability: str
    radar_data: list[dict[str, Any]]
    matched_singer_id: str
