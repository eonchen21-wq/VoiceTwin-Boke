"""
测试 JWT token 验证
用于调试 Supabase JWT token 验证问题
"""
import jwt
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_jwt_decode():
    """测试 JWT token 解码"""
    
    # 从环境变量获取 JWT secret
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    
    print("=" * 60)
    print("JWT Secret 配置:")
    print(f"长度: {len(jwt_secret) if jwt_secret else 0}")
    print(f"Secret (前20字符): {jwt_secret[:20] if jwt_secret else 'None'}...")
    print("=" * 60)
    
    # 请用户提供一个真实的 token
    print("\n请从浏览器控制台复制一个真实的 JWT token:")
    print("(在登录后，从 localStorage.getItem('auth_token') 获取)")
    token = input("\n粘贴 token: ").strip()
    
    if not token:
        print("未提供 token，退出")
        return
    
    # 1. 先查看 token 的 header（不验证签名）
    try:
        header = jwt.get_unverified_header(token)
        print("\n" + "=" * 60)
        print("Token Header (未验证):")
        print(f"  Algorithm: {header.get('alg')}")
        print(f"  Type: {header.get('typ')}")
        print("=" * 60)
    except Exception as e:
        print(f"\n解码 header 失败: {e}")
        return
    
    # 2. 查看 payload（不验证签名）
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        print("\nToken Payload (未验证):")
        print(f"  Issuer (iss): {payload.get('iss')}")
        print(f"  Subject (sub): {payload.get('sub')}")
        print(f"  Audience (aud): {payload.get('aud')}")
        print(f"  Role: {payload.get('role')}")
        print(f"  Issued At (iat): {payload.get('iat')}")
        print(f"  Expiry (exp): {payload.get('exp')}")
        print("=" * 60)
    except Exception as e:
        print(f"\n解码 payload 失败: {e}")
    
    # 3. 尝试用 JWT secret 验证（HS256）
    print("\n尝试验证 JWT token (HS256)...")
    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": True
            }
        )
        print("✓ JWT token 验证成功!")
        print(f"  User ID: {payload.get('sub')}")
    except jwt.ExpiredSignatureError:
        print("✗ JWT token 已过期")
    except jwt.InvalidAudienceError:
        print("✗ Audience 不匹配")
        print(f"  Token audience: {payload.get('aud')}")
        print(f"  Expected: authenticated")
    except jwt.InvalidSignatureError:
        print("✗ 签名验证失败 - JWT Secret 可能不正确")
    except jwt.DecodeError as e:
        print(f"✗ 解码失败: {e}")
    except Exception as e:
        print(f"✗ 验证失败: {e}")
    
    # 4. 尝试其他常见算法
    print("\n尝试其他算法...")
    for alg in ["HS384", "HS512"]:
        try:
            jwt.decode(
                token,
                jwt_secret,
                algorithms=[alg],
                options={"verify_signature": True, "verify_exp": False}
            )
            print(f"  {alg}: ✓ 成功")
        except Exception:
            print(f"  {alg}: ✗ 失败")

if __name__ == "__main__":
    test_jwt_decode()
