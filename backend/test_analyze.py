"""
简化版诊断 - 模拟完整分析流程
"""
import sys
import os
import tempfile
sys.path.insert(0, 'G:/声音分析/Boke/backend')

# 创建简单的测试音频
import numpy as np
import soundfile as sf

sample_rate = 22050
duration = 3
t = np.linspace(0, duration, int(sample_rate * duration))
audio = np.sin(2 * np.pi * 440 * t) * 0.3

temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
temp_file_path = temp_file.name
temp_file.close()
sf.write(temp_file_path, audio, sample_rate)

print(f"测试音频: {temp_file_path}")

# 直接调用分析服务
from database import get_db
from service.analysis_service import AnalysisService
import traceback
import asyncio

async def test():
    try:
        db = get_db() 
        service = AnalysisService(db)
        
        print("开始调用analyze_voice...")
        result = await service.analyze_voice(
            user_id="test-user-123",
            audio_file_path=temp_file_path,
            audio_filename="test.wav"
        )
        
        print(f"\n✅ 分析成功!")
        print(f"得分: {result.score}")
        print(f"清晰度: {result.clarity}")
        print(f"稳定性: {result.stability}")
        
    except Exception as e:
        print(f"\n❌ 分析失败:")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {str(e)}")
        traceback.print_exc()
    finally:
        os.unlink(temp_file_path)

asyncio.run(test())
