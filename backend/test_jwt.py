"""
调试JWT验证问题
"""
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

# 测试token (从用户浏览器获取)
test_token = input("请粘贴一个真实的JWT token (从浏览器localStorage或控制台获取): ").strip()

if not test_token:
    print("未提供token")
    exit(1)

# 获取配置
jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
print(f"\n✓ JWT Secret 已加载 (长度: {len(jwt_secret) if jwt_secret else 0})")

# 1. 查看token header (不验证)
try:
    header = jwt.get_unverified_header(test_token)
    print(f"\n📋 Token Header:")
    print(f"   算法 (alg): {header.get('alg')}")
    print(f"   类型 (typ): {header.get('typ')}")
except Exception as e:
    print(f"\n❌ 无法解析token header: {e}")
    exit(1)

# 2. 查看payload (不验证)
try:
    payload = jwt.decode(test_token, options={"verify_signature": False})
    print(f"\n📄 Token Payload:")
    print(f"   用户ID (sub): {payload.get('sub')}")
    print(f"   Audience (aud): {payload.get('aud')}")
    print(f"   Issuer (iss): {payload.get('iss')}")
    print(f"   角色 (role): {payload.get('role')}")
except Exception as e:
    print(f"\n❌ 无法解析payload: {e}")
    exit(1)

# 3. 尝试验证 (使用代码中的配置)
print(f"\n🔐 尝试验证 (algorithms=[\"HS256\"], verify_aud=False)...")
try:
    payload = jwt.decode(
        test_token,
        jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False}
    )
    print(f"✅ 验证成功!")
    print(f"   用户ID: {payload.get('sub')}")
except jwt.ExpiredSignatureError:
    print(f"⚠️  Token已过期 (这是预期的，如果token older than 1 hour)")
except jwt.InvalidSignatureError:
    print(f"❌ 签名验证失败 - JWT Secret 可能不正确")
except Exception as e:
    print(f"❌ 验证失败: {type(e).__name__}: {e}")

# 4. 尝试不验证签名
print(f"\n🔓 尝试验证 (不验证签名)...")
try:
    payload = jwt.decode(
        test_token,
        jwt_secret,
        algorithms=["HS256"],
        options={"verify_signature": False, "verify_aud": False}
    )
    print(f"✅ 解码成功 (未验证签名)!")
except Exception as e:
    print(f"❌ 失败: {e}")
