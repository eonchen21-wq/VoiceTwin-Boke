"""
测试Supabase JWT token验证
直接从浏览器获取真实token进行测试
"""
import jwt
import os
import base64
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("Supabase JWT 验证诊断工具")
print("=" * 60)

# 1. 获取配置
jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
supabase_url = os.getenv("SUPABASE_URL")

print(f"\n✓ Supabase URL: {supabase_url}")
print(f"✓ JWT Secret 已加载 (长度: {len(jwt_secret) if jwt_secret else 0})")

# 2. 提示用户输入token
print("\n" + "=" * 60)
print("请执行以下步骤获取真实 token:")
print("1. 打开浏览器访问 http://localhost:3000")
print("2. 登录账号: 2678479061@qq.com")
print("3. 按 F12 打开开发者工具")
print("4. 在 Console 中输入: localStorage.getItem('auth_token')")
print("5. 复制输出的 token (不包括引号)")
print("=" * 60)

token = input("\n请粘贴 token: ").strip()

if not token:
    print("\n❌ 未提供 token")
    exit(1)

# 3. 查看 token header
print("\n" + "=" * 60)
print("Token 分析:")
print("=" * 60)

try:
    header = jwt.get_unverified_header(token)
    print(f"\n📋 Header:")
    print(f"   算법 (alg): {header.get('alg')}")
    print(f"   类型 (typ): {header.get('typ') }")
except Exception as e:
    print(f"\n❌ 无法解析 token header: {e}")
    exit(1)

# 4. 查看 payload (不验证)
try:
    payload = jwt.decode(token, options={"verify_signature": False})
    print(f"\n📄 Payload:")
    print(f"   用户ID (sub): {payload.get('sub')}")
    print(f"   Audience (aud): {payload.get('aud')}")
    print(f"   Issuer (iss): {payload.get('iss')}")
    print(f"   角色 (role): {payload.get('role')}")
    print(f"   Email: {payload.get('email')}")
except Exception as e:
    print(f"\n❌ 无法解析 payload: {e}")

# 5. 尝试用原始 secret 验证
print("\n" + "=" * 60)
print("验证测试:")
print("=" * 60)

print(f"\n🔐 测试 1: 使用原始 JWT Secret (不解码)")
try:
    payload = jwt.decode(
        token,
        jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False}
    )
    print(f"✅ 验证成功! 用户ID: {payload.get('sub')}")
    print("✅ 结论: JWT Secret 格式正确，直接使用即可")
except jwt.InvalidSignatureError:
    print(f"❌ 签名验证失败")
    
    # 6. 尝试 base64 解码
    print(f"\n🔐 测试 2: 尝试 base64 解码 JWT Secret")
    try:
        decoded_secret = base64.b64decode(jwt_secret)
        print(f"   解码后长度: {len(decoded_secret)} bytes")
        
        payload = jwt.decode(
            token,
            decoded_secret,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        print(f"✅ 验证成功! 用户ID: {payload.get('sub')}")
        print("✅ 结论: JWT Secret 需要 base64 解码")
    except Exception as e2:
        print(f"❌ 仍然失败: {e2}")
        
except Exception as e:
    print(f"❌ 失败: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
