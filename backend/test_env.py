"""
快速测试JWT配置是否正确加载
"""
import os
import base64
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

print("=" * 60)
print("环境变量检查:")
print("=" * 60)

# 检查所有Supabase相关配置
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

print(f"SUPABASE_URL: {supabase_url}")
print(f"SUPABASE_KEY: {supabase_key[:20]}... (长度: {len(supabase_key) if supabase_key else 0})")
print(f"SUPABASE_JWT_SECRET: {jwt_secret[:20] if jwt_secret else 'None'}... (长度: {len(jwt_secret) if jwt_secret else 0})")

print("\n" + "=" * 60)
print("JWT Secret 格式检查:")
print("=" * 60)

if jwt_secret:
    # 检查是否是base64编码
    try:
        # 尝试base64解码
        decoded = base64.b64decode(jwt_secret)
        print(f"✓ JWT Secret 看起来是 base64 编码")
        print(f"  解码后长度: {len(decoded)} bytes")
        print(f"  原始长度: {len(jwt_secret)} chars")
    except Exception as e:
        print(f"✗ JWT Secret 不是标准 base64 编码 (这可能是正常的)")
        print(f"  将直接使用原始字符串")
else:
    print("❌ 未找到 SUPABASE_JWT_SECRET!")

print("\n✓ 配置加载完成")
