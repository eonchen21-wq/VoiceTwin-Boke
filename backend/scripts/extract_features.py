"""
离线音频特征提取脚本 (网络增强版)
遍历本地音乐文件夹，提取 MFCC 声学特征并更新到数据库
采用反向模糊匹配：先拉取所有数据库歌曲，然后检查文件名是否包含数据库中的 title
"""
import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Tuple
from dotenv import load_dotenv
# 1. 引入 ClientOptions 用于设置超时
from supabase import create_client, Client, ClientOptions
import librosa
import numpy as np

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()

# Supabase 配置
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# 目标文件夹路径
TARGET_FOLDERS = [
    r'F:\音乐',
    r'F:\补货'
]


class FeatureExtractor:
    """音频特征提取器"""
    
    def __init__(self):
        """初始化 Supabase 客户端"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("请在 .env 文件中设置 SUPABASE_URL 和 SUPABASE_KEY")
        
        # 2. 【关键修改】设置 60 秒的超长超时时间，防止网络波动报错
        options = ClientOptions(postgrest_client_timeout=60)
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=options)
        
        self.stats = {
            'total_files': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0
        }
        # NOTE: 使用字典缓存数据库歌曲，key=id, value=完整歌曲记录
        self.db_songs: List[Dict] = []
    
    @staticmethod
    def extract_mfcc_features(audio_path: str) -> List[float]:
        """提取 MFCC 声学特征向量"""
        try:
            # 加载音频文件（统一重采样到 22050Hz，单声道，只读前2分钟提速）
            y, sr = librosa.load(audio_path, sr=22050, mono=True, duration=120)
            
            # 提取 MFCC 特征（13个系数）
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            # 对时间轴求平均值，将二维矩阵降维为一维向量
            mfcc_mean = np.mean(mfccs, axis=1)
            
            return mfcc_mean.tolist()
            
        except Exception as e:
            logger.error(f"特征提取失败: {str(e)}")
            # 这里不抛出异常，而是返回 None，避免单首歌坏掉导致整个脚本停止
            return None
    
    def load_database_songs(self):
        """从数据库加载所有歌曲信息到内存"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"⬇️  正在从数据库拉取所有歌曲信息... (尝试 {attempt + 1}/{max_retries})")
                # 查询时包含 feature_vector，用于断点续传
                response = self.client.table('songs').select('id, title, artist, feature_vector').execute()
                self.db_songs = response.data
                
                # 统计已有特征的歌曲数量
                has_features = sum(1 for song in self.db_songs if song.get('feature_vector') is not None and len(song.get('feature_vector', [])) > 0)
                logger.info(f"✅ 数据库中共有 {len(self.db_songs)} 首歌，其中 {has_features} 首已有特征。开始本地扫描匹配...\n")
                return
            except Exception as e:
                logger.warning(f"⚠️  拉取失败: {str(e)}")
                if attempt < max_retries - 1:
                    import time
                    wait_time = (attempt + 1) * 2  # 递增等待时间：2秒，4秒，6秒
                    logger.info(f"等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"❌ 从数据库拉取歌曲失败，已重试 {max_retries} 次")
                    raise
    
    def scan_folders(self, folder_paths: List[str]) -> List[str]:
        """扫描多个文件夹中的所有 MP3 文件"""
        mp3_files = []
        for folder_path in folder_paths:
            folder = Path(folder_path)
            if not folder.exists():
                logger.warning(f"文件夹不存在，跳过: {folder_path}")
                continue
            
            logger.info(f"📁 扫描文件夹: {folder_path}")
            # 递归查找所有 .mp3 文件
            for file_path in folder.rglob('*.mp3'):
                mp3_files.append(str(file_path))
        
        return mp3_files
    
    def find_song_in_database(self, filename: str) -> Dict | None:
        """根据文件名在数据库歌曲列表中查找对应的歌曲记录"""
        for song in self.db_songs:
            # 确保 title 存在且不是空字符串
            if song['title'] and song['title'].strip() and song['title'] in filename:
                return song
        return None
    
    def update_song_features(self, song_id: str, features: List[float]) -> bool:
        """更新歌曲的特征向量到数据库"""
        try:
            self.client.table('songs').update({
                'feature_vector': features
            }).eq('id', song_id).execute()
            return True
        except Exception as e:
            logger.error(f"数据库更新失败: {str(e)}")
            return False
    
    def process_audio_file(self, file_path: str) -> Tuple[bool, str]:
        """处理单个音频文件"""
        try:
            filename = Path(file_path).stem
            
            # 1. 匹配
            matched_song = self.find_song_in_database(filename)
            
            if not matched_song:
                # logger.warning(f"⚠️  未找到匹配: {filename}") # 太多了可以注释掉
                self.stats['skipped'] += 1
                return False, "数据库中未找到匹配记录"
            
            # 🔄 断点续传：检查是否已有特征向量
            if matched_song.get('feature_vector') is not None and len(matched_song.get('feature_vector', [])) > 0:
                # 已经有特征了，跳过
                self.stats['skipped'] += 1
                return False, "已有特征"
            
            logger.info(f"🎯 匹配成功: [{matched_song['title']}] <== {filename}")
            
            # 2. 提取特征
            features = self.extract_mfcc_features(file_path)
            
            if features:
                # 3. 更新数据库
                success = self.update_song_features(matched_song['id'], features)
                if success:
                    logger.info(f"   ✅ 特征已上传")
                    self.stats['success'] += 1
                    return True, "成功"
                else:
                    logger.error(f"   ❌ 数据库更新失败")
                    self.stats['failed'] += 1
                    return False, "数据库更新失败"
            else:
                logger.error(f"   ❌ 特征提取失败")
                self.stats['failed'] += 1
                return False, "特征提取失败"
            
        except Exception as e:
            logger.error(f"❌ 处理失败: {Path(file_path).stem} - {str(e)}")
            self.stats['failed'] += 1
            return False, str(e)
    
    def batch_process(self):
        """批量处理所有音频文件"""
        print("🎵 音频特征提取工具（网络增强 + 反向匹配版）")
        print("=" * 80)
        
        try:
            self.load_database_songs()
        except:
            return # 如果一开始就连不上网，直接退出
        
        if not self.db_songs:
            logger.warning("⚠️  数据库中没有任何歌曲记录")
            return
        
        # 🔍 诊断信息：显示数据库中的歌曲
        print(f"\n📊 数据库中的歌曲列表（前20首）:")
        for i, song in enumerate(self.db_songs[:20], 1):
            print(f"   {i}. {song['title']}")
        if len(self.db_songs) > 20:
            print(f"   ... 还有 {len(self.db_songs) - 20} 首")
        print()
        
        logger.info("开始扫描文件...\n")
        mp3_files = self.scan_folders(TARGET_FOLDERS)
        
        if not mp3_files:
            logger.warning("⚠️  未找到任何 MP3 文件")
            return
        
        self.stats['total_files'] = len(mp3_files)
        logger.info(f"✓ 找到 {len(mp3_files)} 个 MP3 文件\n")
        
        # 🔍 收集未匹配的文件名示例
        unmatched_samples = []
        
        for i, file_path in enumerate(mp3_files, 1):
            # 简单的进度显示，不刷屏
            if i % 10 == 0:
                print(f"[{i}/{len(mp3_files)}] 正在处理...")
            
            success, msg = self.process_audio_file(file_path)
            
            # 收集未匹配的文件名示例（最多10个）
            if not success and msg == "数据库中未找到匹配记录" and len(unmatched_samples) < 10:
                unmatched_samples.append(Path(file_path).stem)
        
        self._print_summary(unmatched_samples)
    
    def _print_summary(self, unmatched_samples: List[str] = None):
        """打印处理统计"""
        print("\n" + "=" * 80)
        print("📊 处理完成统计:")
        print(f"   总文件数: {self.stats['total_files']}")
        print(f"   ✅ 成功上传: {self.stats['success']}")
        print(f"   ❌ 失败: {self.stats['failed']}")
        print(f"   ⚠️  跳过（无记录）: {self.stats['skipped']}")
        print("=" * 80)
        
        # 🔍 显示未匹配文件名示例
        if unmatched_samples and len(unmatched_samples) > 0:
            print(f"\n🔍 未匹配文件名示例（共 {self.stats['skipped']} 个，以下是前 {len(unmatched_samples)} 个）:")
            for i, filename in enumerate(unmatched_samples, 1):
                print(f"   {i}. {filename}")
            print("\n💡 提示：请检查这些文件名是否包含数据库中的歌曲名。")

def main():
    """主函数"""
    extractor = FeatureExtractor()
    extractor.batch_process()

if __name__ == "__main__":
    main()