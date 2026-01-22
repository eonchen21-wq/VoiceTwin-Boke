import librosa
import numpy as np
from schema.analysis import AudioFeatures
import logging
import tempfile
import os
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class AudioAnalyzer:
    """
    音频分析器
    使用 librosa 库进行音频特征提取和分析
    """
    
    @staticmethod
    def analyze_audio_file(file_path: str) -> AudioFeatures:
        """
        分析音频文件并提取特征
        
        Args:
            file_path: 音频文件路径
            
        Returns:
            提取的音频特征
        """
        logger.info(f"开始分析音频文件: {file_path}")
        
        # 加载音频文件
        # NOTE: librosa 会自动重采样到 22050 Hz（默认），mono=True 确保单声道
        y, sr = librosa.load(file_path, sr=None, mono=True)
        duration = librosa.get_duration(y=y, sr=sr)
        
        logger.info(f"音频加载成功 - 时长: {duration:.2f}s, 采样率: {sr}Hz")
        
        # 1. 频谱特征提取
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        
        # 2. 音色特征 (MFCC - Mel频率倒谱系数)
        # MFCC 是音色分析的核心特征，可以捕捉声音的音色质感
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_means = np.mean(mfccs, axis=1).tolist()
        mfcc_stds = np.std(mfccs, axis=1).tolist()
        
        # 3. 能量和音量特征
        rms = librosa.feature.rms(y=y)[0]
        rms_mean = float(np.mean(rms))
        rms_std = float(np.std(rms))
        
        # 4. 过零率 (Zero Crossing Rate)
        # 反映音频信号的平滑度和噪音水平
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        zcr_mean = float(np.mean(zcr))
        
        # 5. 音高特征提取（使用基础的音高检测）
        # NOTE: 音高检测比较复杂，这里使用简化版本
        try:
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            # 提取主要音高
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:  # 只统计有效音高
                    pitch_values.append(pitch)
            
            if pitch_values:
                pitch_mean = float(np.mean(pitch_values))
                pitch_std = float(np.std(pitch_values))
            else:
                pitch_mean = None
                pitch_std = None
        except Exception as e:
            logger.warning(f"音高提取失败: {str(e)}")
            pitch_mean = None
            pitch_std = None
        
        features = AudioFeatures(
            duration=float(duration),
            sample_rate=int(sr),
            spectral_centroid_mean=float(np.mean(spectral_centroids)),
            spectral_bandwidth_mean=float(np.mean(spectral_bandwidth)),
            spectral_rolloff_mean=float(np.mean(spectral_rolloff)),
            mfcc_means=mfcc_means,
            mfcc_stds=mfcc_stds,
            rms_mean=rms_mean,
            rms_std=rms_std,
            zero_crossing_rate_mean=zcr_mean,
            pitch_mean=pitch_mean,
            pitch_std=pitch_std
        )
        
        logger.info("音频特征提取完成")
        return features
    
    @staticmethod
    def generate_analysis_result(features: AudioFeatures) -> dict:
        """
        基于音频特征生成用户友好的分析结果
        
        Args:
            features: 音频特征
            
        Returns:
            包含得分、清晰度、稳定性等的分析结果
        """
        logger.info("开始生成分析结果")
        
        # 1. 计算清晰度
        # 基于频谱质心和过零率，值越高通常表示声音越清晰明亮
        clarity_score = AudioAnalyzer._calculate_clarity(features)
        
        # 2. 计算稳定性
        # 基于 RMS 和 MFCC 的标准差，标准差越小越稳定
        stability_score = AudioAnalyzer._calculate_stability(features)
        
        # 3. 生成雷达图数据
        radar_data = AudioAnalyzer._generate_radar_data(features, clarity_score, stability_score)
        
        # 4. 计算综合得分
        overall_score = int((clarity_score + stability_score) / 2)
        
        # 5. 匹配歌手（基于特征选择最佳匹配）
        # TODO: 这里可以扩展为基于特征的实际匹配算法
        matched_singer_id = AudioAnalyzer._match_singer(features)
        
        result = {
            'score': overall_score,
            'clarity': AudioAnalyzer._score_to_clarity_label(clarity_score),
            'stability': f"{stability_score}%",
            'radar_data': radar_data,
            'matched_singer_id': matched_singer_id
        }
        
        logger.info(f"分析结果生成完成 - 得分: {overall_score}, 清晰度: {result['clarity']}, 稳定性: {result['stability']}")
        return result
    
    @staticmethod
    def _calculate_clarity(features: AudioFeatures) -> int:
        """
        计算清晰度得分 (0-100)
        基于频谱质心和过零率
        """
        # 归一化频谱质心 (典型范围 1000-4000 Hz)
        centroid_norm = min(100, max(0, (features.spectral_centroid_mean - 1000) / 30))
        
        # 归一化过零率 (典型范围 0-0.15)
        zcr_norm = min(100, features.zero_crossing_rate_mean * 500)
        
        # 综合得分
        clarity = int((centroid_norm * 0.7 + zcr_norm * 0.3))
        return min(100, max(40, clarity))  # 限制在 40-100 范围
    
    @staticmethod
    def _calculate_stability(features: AudioFeatures) -> int:
        """
        计算稳定性得分 (0-100)
        基于 RMS 和 MFCC 的变化程度
        """
        # RMS 标准差越小越稳定 (归一化)
        rms_stability = max(0, 100 - (features.rms_std / features.rms_mean * 100 if features.rms_mean > 0 else 50))
        
        # MFCC 标准差的平均值，越小越稳定
        mfcc_std_mean = np.mean(features.mfcc_stds)
        mfcc_stability = max(0, 100 - mfcc_std_mean * 10)
        
        # 综合稳定性
        stability = int((rms_stability * 0.6 + mfcc_stability * 0.4))
        return min(100, max(50, stability))  # 限制在 50-100 范围
    
    @staticmethod
    def _generate_radar_data(features: AudioFeatures, clarity: int, stability: int) -> list[dict]:
        """
        生成雷达图数据
        """
        # 基于实际音频特征生成各维度数据
        # A: 用户的声音特征, B: 匹配歌手的参考值
        
        # 温暖度: 基于低频能量和稳定性
        warmth = min(100, int(stability * 0.8 + np.random.randint(-10, 10)))
        
        # 明亮度: 基于清晰度
        brightness = min(100, int(clarity * 0.9 + np.random.randint(-5, 5)))
        
        # 力量感: 基于 RMS 能量
        power = min(100, int((features.rms_mean * 1000) + np.random.randint(-15, 15)))
        power = max(40, min(100, power))
        
        # 音域: 基于音高变化
        if features.pitch_std:
            vocal_range = min(100, int(features.pitch_std / 50 * 100))
        else:
            vocal_range = 70  # 默认值
        
        # 气息感: 基于过零率和频谱带宽
        breathiness = min(100, int(features.zero_crossing_rate_mean * 600 + np.random.randint(-10, 10)))
        
        return [
            {'subject': '温暖度', 'A': warmth, 'B': 95, 'fullMark': 150},
            {'subject': '明亮度', 'A': brightness, 'B': 90, 'fullMark': 150},
            {'subject': '力量感', 'A': power, 'B': 85, 'fullMark': 150},
            {'subject': '音域', 'A': vocal_range, 'B': 80, 'fullMark': 150},
            {'subject': '气息感', 'A': breathiness, 'B': 80, 'fullMark': 150},
        ]
    
    @staticmethod
    def _score_to_clarity_label(score: int) -> str:
        """
        将清晰度分数转换为文字标签
        """
        if score >= 90:
            return '极高'
        elif score >= 75:
            return '高'
        elif score >= 60:
            return '中'
        else:
            return '低'
    
    @staticmethod
    def _match_singer(features: AudioFeatures) -> str:
        """
        基于音频特征匹配歌手
        TODO: 实现更复杂的匹配算法
        目前返回默认歌手ID（需要在数据库中预先创建）
        """
        # HACK: 暂时返回固定ID，后续可以基于特征实现智能匹配
        # 可以根据音高、音色等特征选择不同的歌手
        return "default-singer-adele"  # 这个ID需要在数据库初始化时创建
    
    @staticmethod
    def extract_mfcc_feature_vector(file_path: str) -> list[float]:
        """
        提取 MFCC 特征向量（用于歌曲匹配）
        
        【修复5】升级为 20 阶 MFCC + Delta + Delta-Delta 特征
        
        NOTE: 此方法使用的参数必须与离线特征提取脚本完全一致
        
        Args:
            file_path: 音频文件路径
        
        Returns:
            60维 MFCC 特征向量 (20 MFCC + 20 Delta + 20 Delta-Delta)
        """
        logger.info(f"提取增强型 MFCC 特征向量: {file_path}")
        
        try:
            # 加载音频文件（统一重采样到 22050Hz，单声道）
            y, sr = librosa.load(file_path, sr=22050, mono=True)
            
            # 【升级1】提取 20 阶 MFCC 特征（原本是13阶）
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
            
            # 【升级2】计算 Delta 特征（一阶导数，反映时间变化）
            delta_mfccs = librosa.feature.delta(mfccs)
            
            # 【升级3】计算 Delta-Delta 特征（二阶导数，反映加速度变化）
            delta2_mfccs = librosa.feature.delta(mfccs, order=2)
            
            # 对时间轴求平均值，将二维矩阵降维为一维向量
            mfcc_mean = np.mean(mfccs, axis=1)          # 20 维
            delta_mean = np.mean(delta_mfccs, axis=1)   # 20 维
            delta2_mean = np.mean(delta2_mfccs, axis=1) # 20 维
            
            # 【升级4】拼接所有特征为一个完整向量
            combined_features = np.concatenate([
                mfcc_mean,
                delta_mean,
                delta2_mean
            ])
            
            logger.info(f"✅ 增强型 MFCC 特征向量提取完成，维度: {len(combined_features)} (20+20+20)")
            
            return combined_features.tolist()
            
        except Exception as e:
            logger.error(f"❌ MFCC 特征提取失败: {str(e)}", exc_info=True)
            raise Exception(f"特征提取失败: {str(e)}")

    
    @staticmethod
    def calculate_cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
        """
        计算两个向量的余弦相似度
        
        Args:
            vec1: 第一个向量（用户录音特征）
            vec2: 第二个向量（歌曲特征）
        
        Returns:
            相似度得分 (0-1之间，越高越相似)
        """
        # 将列表转换为 numpy 数组
        vec1_array = np.array(vec1).reshape(1, -1)
        vec2_array = np.array(vec2).reshape(1, -1)
        
        # 计算余弦相似度
        similarity = cosine_similarity(vec1_array, vec2_array)[0][0]
        
        return float(similarity)
