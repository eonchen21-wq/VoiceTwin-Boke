"""
歌手声学特征模型数据库

定义不同歌手的声学特征参照标准,用于匹配用户声音
"""

import logging

logger = logging.getLogger(__name__)

# 歌手声学特征数据库
SINGER_PROFILES = {
    "邓紫棋": {
        "pitch_mean": 280,  # Hz (女高音)
        "pitch_std": 50,
        "brightness": 3800,  # Hz (明亮)
        "energy": 0.16,
        "description": "高音清亮,穿透力强,情感表达丰富",
        "style": "流行/抒情",
        "voice_characteristics": {
            "音域": "宽广",
            "音色": "明亮清澈",
            "特点": "高音稳定,爆发力强"
        }
    },
    "张杰": {
        "pitch_mean": 260,  # Hz (男高音)
        "pitch_std": 55,
        "brightness": 3600,  # Hz (明亮)
        "energy": 0.18,
        "description": "高音技巧出众,声音穿透力强",
        "style": "流行/摇滚",
        "voice_characteristics": {
            "音域": "极宽",
            "音色": "明亮有力",
            "特点": "高音技巧,爆发力"
        }
    },
    "王菲": {
        "pitch_mean": 240,  # Hz (女中高音)
        "pitch_std": 35,
        "brightness": 3200,  # Hz (清澈)
        "energy": 0.12,
        "description": "空灵清澈,独特辨识度",
        "style": "流行/另类",
        "voice_characteristics": {
            "音域": "中等",
            "音色": "空灵清澈",
            "特点": "独特气质,辨识度高"
        }
    },
    "林俊杰": {
        "pitch_mean": 220,  # Hz (男中高音)
        "pitch_std": 45,
        "brightness": 3400,  # Hz (清澈)
        "energy": 0.14,
        "description": "R&B风格,声音细腻有层次",
        "style": "R&B/流行",
        "voice_characteristics": {
            "音域": "宽广",
            "音色": "细腻清澈",
            "特点": "转音技巧,情感细腻"
        }
    },
    "陈奕迅": {
        "pitch_mean": 200,  # Hz (男中音)
        "pitch_std": 40,
        "brightness": 2800,  # Hz (温暖)
        "energy": 0.13,
        "description": "情感丰富,声音温暖有磁性",
        "style": "流行/抒情",
        "voice_characteristics": {
            "音域": "中等",
            "音色": "温暖磁性",
            "特点": "情感表达,细节处理"
        }
    },
    "李荣浩": {
        "pitch_mean": 180,  # Hz (男中低音)
        "pitch_std": 30,
        "brightness": 2600,  # Hz (温暖)
        "energy": 0.11,
        "description": "低音磁性,声音慵懒舒适",
        "style": "流行/民谣",
        "voice_characteristics": {
            "音域": "中等",
            "音色": "磁性慵懒",
            "特点": "低音稳定,辨识度高"
        }
    },
    "周杰伦": {
        "pitch_mean": 210,  # Hz (男中音)
        "pitch_std": 48,
        "brightness": 3000,  # Hz (中性)
        "energy": 0.15,
        "description": "独特咬字,节奏感强",
        "style": "流行/说唱",
        "voice_characteristics": {
            "音域": "宽广",
            "音色": "独特个性",
            "特点": "节奏感强,风格多变"
        }
    },
    "伍佰": {
        "pitch_mean": 170,  # Hz (男低音)
        "pitch_std": 35,
        "brightness": 2400,  # Hz (厚重)
        "energy": 0.17,
        "description": "摇滚沙哑,声音粗犷有力",
        "style": "摇滚/蓝调",
        "voice_characteristics": {
            "音域": "中等",
            "音色": "沙哑厚重",
            "特点": "摇滚气质,爆发力强"
        }
    },
    "薛之谦": {
        "pitch_mean": 195,  # Hz (男中音)
        "pitch_std": 42,
        "brightness": 2900,  # Hz (温暖)
        "energy": 0.13,
        "description": "情感细腻,声音温柔",
        "style": "流行/抒情",
        "voice_characteristics": {
            "音域": "中等",
            "音色": "温柔细腻",
            "特点": "情感丰富,共鸣好"
        }
    },
    "孙燕姿": {
        "pitch_mean": 250,  # Hz (女中高音)
        "pitch_std": 38,
        "brightness": 3300,  # Hz (清新)
        "energy": 0.14,
        "description": "清新自然,声音辨识度高",
        "style": "流行/摇滚",
        "voice_characteristics": {
            "音域": "宽广",
            "音色": "清新明亮",
            "特点": "自然真实,辨识度高"
        }
    }
}

# ✅ 歌手名称到数据库ID的映射 (严格对齐数据库singers表)
# NOTE: 这些ID必须与Supabase singers表中的ID完全一致
SINGER_NAME_TO_ID = {
    "邓紫棋": 1,
    "张杰": 2,
    "王菲": 3,
    "林俊杰": 4,
    "陈奕迅": 5,
    "李荣浩": 6,
    "周杰伦": 7,
    "伍佰": 8,
    "薛之谦": 9,
    "孙燕姿": 10
}

# ✅ ID到歌手名称的反向映射
SINGER_ID_TO_NAME = {v: k for k, v in SINGER_NAME_TO_ID.items()}


def get_singer_id(singer_name: str) -> int:
    """
    根据歌手名称获取数据库ID
    
    Args:
        singer_name: 歌手名称
        
    Returns:
        int: 数据库ID (1-10),如果不存在返回5(陈奕迅作为默认)
    """
    singer_id = SINGER_NAME_TO_ID.get(singer_name, 5)  # 默认返回5(陈奕迅)
    
    # 安全检查: 确保ID在1-10范围内
    if singer_id < 1 or singer_id > 10:
        logger.warning(f"⚠️ 歌手ID异常: {singer_id}, 强制修正为5")
        singer_id = 5
    
    return singer_id


def get_singer_name(singer_id: int) -> str:
    """
    根据数据库ID获取歌手名称
    
    Args:
        singer_id: 数据库ID
        
    Returns:
        str: 歌手名称,如果不存在返回"陈奕迅"
    """
    return SINGER_ID_TO_NAME.get(singer_id, "陈奕迅")


def get_all_singer_profiles():
    """
    获取所有歌手声学特征
    
    Returns:
        dict: 歌手声学特征字典
    """
    return SINGER_PROFILES


def get_singer_profile(singer_name: str):
    """
    获取指定歌手的声学特征
    
    Args:
        singer_name: 歌手名称
        
    Returns:
        dict: 歌手声学特征,如果不存在返回None
    """
    return SINGER_PROFILES.get(singer_name)


def normalize_singer_features(profile: dict) -> dict:
    """
    归一化歌手特征到0-1范围
    
    Args:
        profile: 歌手声学特征字典
        
    Returns:
        dict: 归一化后的特征向量
    """
    return {
        'pitch': profile['pitch_mean'] / 500.0,  # 人声范围约80-500Hz
        'brightness': profile['brightness'] / 5000.0,  # 频谱质心范围约1000-5000Hz
        'energy': profile['energy']  # RMS已经在0-1范围内
    }
