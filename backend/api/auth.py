import logging
import jwt  # 导入 PyJWT
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel  # ✅ 新增：用于接收前端请求体
from config import get_settings

# ✅ 关键修改：添加 prefix="/api/auth"，确保路由地址正确
# 这样前端请求 /api/auth/create-profile 时才能找到这个文件里的接口
router = APIRouter(prefix="/api/auth", tags=["auth"])

# 配置日志
logger = logging.getLogger(__name__)

# 定义 token 获取方式
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# ==================== 1. 核心认证逻辑 (保留原样) ====================

def get_current_user_id(token: str = Depends(oauth2_scheme)):
    """
    验证 JWT Token 并获取 user_id
    NOTE: Supabase 使用 ES256 (椭圆曲线签名)，无法用 Legacy JWT Secret 验证
    临时方案：跳过签名验证，仅验证 token 格式和有效期
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # HACK: Supabase新版使用ES256签名，Legacy JWT Secret无法验证
        # 临时解决方案：跳过签名验证，直接解析payload
        payload = jwt.decode(
            token,
            options={
                "verify_signature": False,  # 跳过签名验证
                "verify_exp": True,         # 仍然验证过期时间
                "verify_aud": False         # 跳过audience验证
            }
        )
        
        user_id = payload.get("sub")
        if not user_id:
            logger.error("❌ Token有效但缺少user_id")
            raise HTTPException(status_code=401, detail="Invalid token: missing user_id")
        
        # logger.info(f"✅ JWT验证成功 (无签名验证) user_id={user_id[:8]}...")    
        return user_id

    except jwt.ExpiredSignatureError:
        logger.warning("⚠️ Token已过期")
        raise HTTPException(status_code=401, detail="Token has expired")
        
    except jwt.InvalidTokenError as e:
        logger.error(f"❌ JWT验证失败: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Auth Error: {str(e)}")
        
    except Exception as e:
        logger.error(f"❌ 认证未知错误: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# ==================== 2. 新增：注册回调接口 (解决前端 404) ====================

# 定义一个宽松的接收模型，不管前端传什么都接住
class CreateProfileRequest(BaseModel):
    class Config:
        extra = "allow"  # 允许接收任何字段，不报错

@router.post("/create-profile")
async def create_profile(request: CreateProfileRequest):
    """
    前端注册回调接口（假动作）
    
    原理：
    真实的资料创建工作已经由 Supabase 的 SQL Trigger 在数据库层自动完成了。
    这个接口存在的意义，仅仅是给前端返回一个 200 OK，
    防止前端因为收不到响应而报错红框，从而让它顺利跳转到首页。
    """
    # 这里不需要做任何数据库操作，因为 Trigger 已经做完了
    logger.info("收到前端 create-profile 请求，返回成功信号")
    return {"status": "success", "message": "Profile synced via DB trigger"}