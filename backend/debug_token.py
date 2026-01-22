import jwt
import json
import sys

def decode_token_header(token):
    """
    解码 JWT token 的 header，查看使用的算法
    """
    try:
        # 不验证签名，只解码 header
        header = jwt.get_unverified_header(token)
        print("Token Header:")
        print(json.dumps(header, indent=2))
        
        # 不验证签名，解码 payload
        payload = jwt.decode(token, options={"verify_signature": False})
        print("\nToken Payload (部分):")
        print(json.dumps({
            "iss": payload.get("iss"),
            "sub": payload.get("sub"),
            "aud": payload.get("aud"),
            "role": payload.get("role"),
            "exp": payload.get("exp"),
            "iat": payload.get("iat")
        }, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("请从浏览器控制台或网络请求中复制完整的 JWT token")
    print("粘贴 token 并按回车:")
    token = input().strip()
    
    if token:
        decode_token_header(token)
    else:
        print("未提供 token")
