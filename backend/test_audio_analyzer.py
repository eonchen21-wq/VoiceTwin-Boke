"""
测试音频分析功能是否正常工作
"""
import tempfile
import os
from service.audio_analyzer import AudioAnalyzer

# 创建一个简单的临时WAV文件用于测试
def create_test_audio():
    """创建一个简单的测试音频文件"""
    import numpy as np
    from scipy.io import wavfile
    
    # 生成1秒的440Hz正弦波（A音）
    sample_rate = 22050
    duration = 1  # 秒
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * 440 * t)
    
    # 转换为16位整数
    audio_data = (audio_data * 32767).astype(np.int16)
    
    # 保存为临时文件
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    wavfile.write(temp_file.name, sample_rate, audio_data)
    temp_file.close()
    
    return temp_file.name

try:
    print("创建测试音频文件...")
    test_audio_path = create_test_audio()
    print(f"测试音频文件已创建: {test_audio_path}")
    
    print("\n开始分析音频...")
    features = AudioAnalyzer.analyze_audio_file(test_audio_path)
    print("✓ 音频特征提取成功")
    print(f"  - 时长: {features.duration:.2f}s")
    print(f"  - 采样率: {features.sample_rate}Hz")
    print(f"  - 频谱质心均值: {features.spectral_centroid_mean:.2f}")
    
    print("\n生成分析结果...")
    result = AudioAnalyzer.generate_analysis_result(features)
    print("✓ 分析结果生成成功")
    print(f"  - 综合得分: {result['score']}")
    print(f"  - 清晰度: {result['clarity']}")
    print(f"  - 稳定性: {result['stability']}")
    print(f"  - 匹配歌手ID: {result['matched_singer_id']}")
    
    print("\n✅ 所有测试通过！音频分析功能正常工作。")
    
except Exception as e:
    print(f"\n❌ 测试失败: {str(e)}")
    import traceback
    traceback.print_exc()
    
finally:
    # 清理临时文件
    if 'test_audio_path' in locals() and os.path.exists(test_audio_path):
        os.unlink(test_audio_path)
        print(f"\n清理临时文件: {test_audio_path}")
