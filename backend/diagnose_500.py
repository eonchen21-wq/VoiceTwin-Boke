"""
快速诊断500错误的测试脚本
"""
import sys
sys.path.insert(0, 'G:/声音分析/Boke/backend')

from service.audio_analyzer import AudioAnalyzer
from repository.song_repo import SongRepository

from database import get_db
import traceback

print("=" * 60)
print("声音分析500错误诊断脚本")
print("=" * 60)

# 测试1: 创建临时测试音频文件
print("\n[测试1] 创建测试音频文件...")
import numpy as np
import soundfile as sf
import tempfile
import os

# 生成3秒的440Hz正弦波(A4音高)
sample_rate = 22050
duration = 3 
t = np.linspace(0, duration, int(sample_rate * duration))
audio = np.sin(2 * np.pi * 440 * t) * 0.3

temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
temp_file_path = temp_file.name
temp_file.close()

sf.write(temp_file_path, audio, sample_rate)
print(f"✓ 测试音频已创建: {temp_file_path}")

# 测试2: 提取MFCC特征
print("\n[测试2] 提取MFCC特征...")
try:
    feature_vector = AudioAnalyzer.extract_mfcc_feature_vector(temp_file_path)
    print(f"✓ MFCC特征提取成功，维度: {len(feature_vector)}")
    print(f"  特征向量前5个值: {feature_vector[:5]}")
except Exception as e:
    print(f"✗ MFCC特征提取失败:")
    traceback.print_exc()

# 测试3: 完整音频分析
print("\n[测试3] 完整音频特征分析...")
try:
    features = AudioAnalyzer.analyze_audio_file(temp_file_path)
    print(f"✓ 音频分析成功")
    print(f"  时长: {features.duration}s")
    print(f"  采样率: {features.sample_rate}Hz")
except Exception as e:
    print(f"✗ 音频分析失败:")
    traceback.print_exc()

# 测试4: 数据库查询歌曲库
print("\n[测试4] 查询歌曲库...")
try:
    db = next(get_db())
    song_repo = SongRepository(db)
    songs = song_repo.get_all_with_features()
    print(f"✓ 歌曲数据查询成功，共{len(songs)}首歌")
    
    # 检查特征向量
    has_features = sum(1 for song in songs if song.get('feature_vector'))
    print(f"  其中{has_features}首有特征向量")
    
    if songs:
        print(f"  示例歌曲: {songs[0].get('title', 'N/A')}")
except Exception as e:
    print(f"✗ 数据库查询失败:")
    traceback.print_exc()

# 测试5: 匹配相似度计算
print("\n[测试5] 匹配相似度计算...")
try:
    if songs and feature_vector:
        test_song = next((s for s in songs if s.get('feature_vector')), None)
        if test_song:
            similarity = AudioAnalyzer.calculate_cosine_similarity(
                feature_vector, test_song['feature_vector']
            )
            print(f"✓ 相似度计算成功: {similarity:.4f}")
            print(f"  匹配歌曲: {test_song.get('title', 'N/A')}")
        else:
            print("⚠ 没有歌曲包含特征向量")
except Exception as e:
    print(f"✗ 相似度计算失败:")
    traceback.print_exc()

# 清理
os.unlink(temp_file_path)
print("\n✓ 测试完成，临时文件已删除")
print("=" * 60)
