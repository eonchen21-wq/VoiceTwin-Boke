"""
测试JWT本地验证功能
生成一个有效的JWT token并测试后端的验证逻辑
"""
import jwt
import datetime
from config import get_settings

def generate_test_token(user_id: str = "0d079035-1009-43f3-bd9b-0fd8783f0d0a") -> str:
    """
    生成一个测试用的JWT token
    """
    settings = get_settings()
    
    # 创建payload
    now = datetime.datetime.utcnow()
    payload = {
        "sub": user_id,  # 用户ID
        "aud": "authenticated",  # Supabase使用的audience
        "exp": now + datetime.timedelta(hours=1),  # 1小时后过期
        "iat": now,  # 签发时间
        "iss": settings.supabase_url + "/auth/v1",  # 签发者
        "role": "authenticated"
    }
    
    # 使用JWT Secret签名
    token = jwt.encode(
        payload,
        settings.supabase_jwt_secret,
        algorithm="HS256"
    )
    
    return token

if __name__ == "__main__":
    # 生成测试token
    test_user_id = "0d079035-1009-43f3-bd9b-0fd8783f0d0a"
    token = generate_test_token(test_user_id)
    
    print("=" * 80)
    print("生成的测试 JWT Token:")
    print("=" * 80)
    print(token)
    print()
    print("=" * 80)
    print("使用此token测试后端API:")
    print("=" * 80)
    print(f"curl -X GET http://localhost:8000/api/auth/me \\")
    print(f'  -H "Authorization: Bearer {token}"')
    print()
    print("或者测试收藏列表:")
    print(f"curl -X GET http://localhost:8000/api/songs/favorites \\")
    print(f'  -H "Authorization: Bearer {token}"')
    print()
