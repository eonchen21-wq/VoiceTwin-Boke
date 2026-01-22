"""
模拟完整的API请求来测试录音分析接口
这将帮助我们找出500错误的真正原因
"""
import sys
import os

# 添加父目录到路径以便导入模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
import tempfile
import numpy as np
from scipy.io import wavfile

client = TestClient(app)

def create_test_audio():
    """创建测试音频文件"""
    sample_rate = 22050
    duration = 1
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * 440 * t)
    audio_data = (audio_data * 32767).astype(np.int16)
    
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    wavfile.write(temp_file.name, sample_rate, audio_data)
    temp_file.close()
    
    return temp_file.name

print("=" * 60)
print("测试1: 健康检查接口")
print("=" * 60)
response = client.get("/health")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
print()

print("=" * 60)
print("测试2: 无认证的音频分析请求（应该返回401）")
print("=" * 60)
try:
    test_audio_path = create_test_audio()
    with open(test_audio_path, 'rb') as f:
        files = {'audio_file': ('test.wav', f, 'audio/wav')}
        response = client.post("/api/analysis/analyze", files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")  # 只显示前500字符
except Exception as e:
    print(f"错误: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    if os.path.exists(test_audio_path):
        os.unlink(test_audio_path)
print()

print("=" * 60)
print("测试3: 使用模拟token的音频分析请求（应该返回401或500）")
print("=" * 60)
try:
    test_audio_path = create_test_audio()
    with open(test_audio_path, 'rb') as f:
        files = {'audio_file': ('test.wav', f, 'audio/wav')}
        headers = {'Authorization': 'Bearer fake_token_for_testing'}
        response = client.post("/api/analysis/analyze", files=files, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"错误: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    if os.path.exists(test_audio_path):
        os.unlink(test_audio_path)
print()

print("=" * 60)
print("结论:")
print("=" * 60)
print("如果测试2返回401：说明认证中间件工作正常")
print("如果测试3返回401：说明token验证正常拋出401错误")
print("如果测试3返回500：说明token验证过程中抛出了未捕获的异常")
print("=" * 60)
