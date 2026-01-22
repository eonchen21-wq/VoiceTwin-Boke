"""
快速测试脚本：检查后端API是否正常工作
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """测试健康检查"""
    print("=" * 60)
    print("测试1: 健康检查")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        print("✓ 健康检查通过")
    except Exception as e:
        print(f"✗ 健康检查失败: {e}")
    print()

def test_analyze_without_token():
    """测试没有token的分析请求"""
    print("=" * 60)
    print("测试2: 无认证的分析请求")
    print("=" * 60)
    
    try:
        # 创建一个假的音频文件
        files = {'audio_file': ('test.wav', b'fake audio data', 'audio/wav')}
        response = requests.post(f"{BASE_URL}/api/analysis/analyze", files=files)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:200]}")
        
        if response.status_code == 401:
            print("✓ 正确返回401 Unauthorized（符合预期）")
        else:
            print("✗ 未返回401，认证可能有问题")
    except Exception as e:
        print(f"✗ 请求失败: {e}")
    print()

def test_with_token():
    """使用token测试"""
    print("=" * 60)
    print("测试3: 带认证token的请求")
    print("=" * 60)
    
    print("请从浏览器控制台获取 token:")
    print("1. 打开浏览器开发者工具")
    print("2. 在 Console 中运行: localStorage.getItem('auth_token')")
    print("3. 复制token")
    
    token = input("\n粘贴 token (或按回车跳过): ").strip()
    
    if not token:
        print("跳过此测试")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # 测试获取当前用户信息
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 认证成功!")
            print(f"  用户ID: {data.get('id')}")
            print(f"  用户名: {data.get('username')}")
            print(f"  邮箱: {data.get('email')}")
        else:
            print(f"✗ 认证失败")
            print(f"响应: {response.text}")
    except Exception as e:
        print(f"✗ 请求失败: {e}")
    print()

if __name__ == "__main__":
    print("\n🔍 后端API测试工具\n")
    
    test_health()
    test_analyze_without_token()
    test_with_token()
    
    print("=" * 60)
    print("测试完成")
    print("=" * 60)
