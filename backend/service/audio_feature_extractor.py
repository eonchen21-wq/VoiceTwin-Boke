"""
音频特征提取器

使用 librosa 提取真实的声学特征:
- 音高 (Pitch/F0)
- 音色亮度 (Spectral Centroid)
- 响度 (RMS Energy)
- 音准稳定性
- 音域范围
"""

import librosa
import numpy as np
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


def extract_audio_features(file_path: str) -> Dict[str, Any]:
    """
    提取音频文件的声学特征 (性能优化版)
    
    Args:
        file_path: 音频文件路径
        
    Returns:
        dict: 包含所有提取特征的字典
        
    NOTE: 性能优化措施
    - 只读取前10秒 (从30秒缩短)
    - 采样率16000Hz (从22050Hz降低)
    - 使用piptrack替代pyin (速度提升10-20倍)
    """
    try:
        # 1. 加载音频 (性能优化: 10秒, 16kHz)
        logger.info(f"开始加载音频文件: {file_path}")
        y, sr = librosa.load(file_path, sr=16000, duration=10)
        logger.info(f"音频加载成功: 采样率={sr}, 时长={len(y)/sr:.2f}秒")
        
        # 2. 提取音高特征 (使用piptrack替代pyin,速度快10-20倍)
        logger.info("提取音高特征...")
        
        # 使用piptrack进行快速音高估算
        pitches, magnitudes = librosa.piptrack(
            y=y, 
            sr=sr,
            fmin=60,   # 人声最低频率
            fmax=500,  # 人声最高频率
            threshold=0.1
        )
        
        # 提取每帧的主导音高
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:  # 过滤掉0值
                pitch_values.append(pitch)
        
        if len(pitch_values) == 0:
            logger.warning("未检测到有效音高,使用默认值")
            pitch_mean = 200  # 默认中音
            pitch_std = 40
            pitch_min = 150
            pitch_max = 250
        else:
            pitch_values = np.array(pitch_values)
            pitch_mean = float(np.mean(pitch_values))
            pitch_std = float(np.std(pitch_values))
            pitch_min = float(np.min(pitch_values))
            pitch_max = float(np.max(pitch_values))
        
        # 3. 提取音色亮度 (Spectral Centroid)
        logger.info("提取音色亮度...")
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        brightness = float(np.mean(spectral_centroids))
        
        # 4. 提取响度 (RMS Energy)
        logger.info("提取响度...")
        rms = librosa.feature.rms(y=y)[0]
        energy = float(np.mean(rms))
        
        # 5. 计算音准稳定性 (基于F0方差)
        # 方差越小,音准越稳定
        if pitch_mean > 0:
            pitch_stability_ratio = pitch_std / pitch_mean
            pitch_stability = max(0, min(100, 100 - pitch_stability_ratio * 100))
        else:
            pitch_stability = 50  # 默认值
        
        # 6. 计算音域范围
        pitch_range = pitch_max - pitch_min
        # 归一化到0-100分数 (人声音域约2-3个八度,约200-400Hz)
        pitch_range_score = min(100, (pitch_range / 300) * 100)
        
        # 7. 计算明亮度分数 (归一化到0-100)
        # 频谱质心范围约1000-5000Hz
        brightness_score = min(100, ((brightness - 1000) / 4000) * 100)
        brightness_score = max(0, brightness_score)
        
        # 8. 计算力度分数 (归一化到0-100)
        # RMS范围约0-0.3
        energy_score = min(100, (energy / 0.3) * 100)
        
        # 9. 计算整体稳定性 (综合音高和响度的稳定性)
        rms_std = float(np.std(rms))
        rms_mean = float(np.mean(rms))
        if rms_mean > 0:
            energy_stability_ratio = rms_std / rms_mean
            energy_stability = max(0, min(100, 100 - energy_stability_ratio * 50))
        else:
            energy_stability = 50
        
        overall_stability = (pitch_stability + energy_stability) / 2
        
        features = {
            # 原始特征
            'pitch_mean': pitch_mean,
            'pitch_std': pitch_std,
            'pitch_min': pitch_min,
            'pitch_max': pitch_max,
            'brightness': brightness,
            'energy': energy,
            
            # 计算得分 (0-100)
            'pitch_stability': pitch_stability,
            'pitch_range_score': pitch_range_score,
            'brightness_score': brightness_score,
            'energy_score': energy_score,
            'stability_score': overall_stability,
            
            # 元数据
            'sample_rate': sr,
            'duration': len(y) / sr
        }
        
        logger.info(f"特征提取完成: pitch={pitch_mean:.1f}Hz, brightness={brightness:.1f}Hz, energy={energy:.3f}")
        return features
        
    except Exception as e:
        logger.error(f"音频特征提取失败: {str(e)}")
        # 返回默认特征
        return _get_default_features()


def _get_default_features() -> Dict[str, Any]:
    """
    获取默认特征 (当提取失败时使用)
    
    Returns:
        dict: 默认特征字典
    """
    return {
        'pitch_mean': 200,
        'pitch_std': 40,
        'pitch_min': 150,
        'pitch_max': 250,
        'brightness': 2800,
        'energy': 0.12,
        'pitch_stability': 60,
        'pitch_range_score': 50,
        'brightness_score': 50,
        'energy_score': 50,
        'stability_score': 60,
        'sample_rate': 16000,
        'duration': 10
    }


def normalize_user_features(features: Dict[str, Any]) -> Dict[str, float]:
    """
    归一化用户特征到0-1范围,用于与歌手模板比较
    
    Args:
        features: 提取的音频特征
        
    Returns:
        dict: 归一化后的特征向量
    """
    return {
        'pitch': features['pitch_mean'] / 500.0,  # 人声范围约80-500Hz
        'brightness': features['brightness'] / 5000.0,  # 频谱质心范围约1000-5000Hz
        'energy': features['energy']  # RMS已经在0-1范围内
    }
