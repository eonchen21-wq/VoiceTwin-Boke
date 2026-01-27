import os
import logging
import urllib.parse
import random

logger = logging.getLogger(__name__)


class AIImageService:
    """
    智能图片服务（稳定极速版）
    全部使用 UI-Avatars 服务，确保在国内网络环境下也能 100% 加载图片。
    """
    
    # 动态获取当前文件所在的目录
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
    BASE_DIR = os.path.dirname(CURRENT_DIR)
    AVATAR_DIR = os.path.join(BASE_DIR, "static", "avatars")
    
    BASE_URL = "https://voicetwin-boke.onrender.com"

    # 支持的本地图片扩展名
    EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".PNG", ".JPEG"]

    @staticmethod
    async def generate_singer_avatar(artist_name: str) -> str:
        """
        [策略 A] 获取歌手头像：优先本地真实照片 -> 在线文字头像兜底
        """
        # 1. 尝试查找本地真实照片
        for ext in AIImageService.EXTENSIONS:
            filename = f"{artist_name}{ext}"
            file_path = os.path.join(AIImageService.AVATAR_DIR, filename)
            
            if os.path.exists(file_path):
                return f"{AIImageService.BASE_URL}/static/avatars/{filename}"
        
        # 2. 没找到本地照片，使用圆形文字头像 (Rounded=true)
        encoded_name = urllib.parse.quote(artist_name or "歌手")
        return (
            f"https://ui-avatars.com/api/"
            f"?name={encoded_name}"
            f"&background=random"  # 随机颜色
            f"&color=fff"          # 白色文字
            f"&size=256"
            f"&bold=true"
            f"&rounded=true"      # ✅ 歌手头像是圆的
            f"&length=2" 
        )

    @staticmethod
    async def generate_song_cover(song_title: str) -> str:
        """
        [策略 B] 获取歌曲封面：纯自动生成 (方块风格)
        改为使用 UI-Avatars，解决 DiceBear 加载失败的问题
        """
        title_to_use = song_title if song_title else "Song"
        encoded_title = urllib.parse.quote(title_to_use)
        
        # 生成一个基于歌名的伪随机颜色，让同一首歌每次颜色都一样，但不同歌颜色不一样
        # 简单的哈希算法取色 (非必须，但体验更好)
        # 这里为了简单直接用 background=random，如果你想固定颜色可以用 background=哈希值
        
        api_url = (
            f"https://ui-avatars.com/api/"
            f"?name={encoded_title}"
            f"&background=random"  # 随机背景色
            f"&color=fff"          # 白色文字
            f"&size=512"           # 分辨率高一点
            f"&bold=true"
            f"&length=1"           # 封面只显示 1 个字/字母，更有设计感
            f"&rounded=false"      # ✅ 歌曲封面是方的 (看起来像专辑)
            f"&font-size=0.5"      # 字体大小
        )
        
        return api_url