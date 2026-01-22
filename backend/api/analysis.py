from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from supabase import Client
from database import get_db
from service.analysis_service import AnalysisService
from schema.analysis import VoiceAnalysisResponse
from api.auth import get_current_user_id
from config import get_settings
import logging
import tempfile
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["声音分析"])


@router.post("/analyze", response_model=VoiceAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_voice(
    audio_file: UploadFile = File(..., description="音频文件"),
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db)
):
    """
    上传音频文件并进行声音分析
    """
    settings = get_settings()
    analysis_service = AnalysisService(db)
    
    # 1. 验证文件格式
    file_ext = os.path.splitext(audio_file.filename)[1].lower()
    if file_ext not in settings.allowed_audio_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的音频格式，仅支持: {', '.join(settings.allowed_audio_formats)}"
        )
    
    # 2. 验证文件大小
    audio_file.file.seek(0, 2)  # 移动到文件末尾
    file_size = audio_file.file.tell()  # 获取文件大小
    audio_file.file.seek(0)  # 重置到文件开头
    
    max_size_bytes = settings.max_audio_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件过大，最大支持 {settings.max_audio_size_mb}MB"
        )
    
    # 3. 保存临时文件
    temp_file = None
    try:
        # 创建临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            # 写入上传的音频数据
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        logger.info(f"临时文件已保存: {temp_file_path}")
        
        # 4. 执行分析
        result = await analysis_service.analyze_voice(
            user_id=user_id,
            audio_file_path=temp_file_path,
            audio_filename=audio_file.filename
        )
        
        return result
        
    except Exception as e:
        logger.error(f"音频分析失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"音频分析失败: {str(e)}"
        )
    
    finally:
        # 5. 清理临时文件
        if temp_file and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"临时文件已删除: {temp_file_path}")
            except Exception as e:
                logger.warning(f"删除临时文件失败: {str(e)}")


@router.get("/{analysis_id}", response_model=VoiceAnalysisResponse)
async def get_analysis(analysis_id: str, db: Client = Depends(get_db)):
    """
    获取分析结果
    """
    analysis_service = AnalysisService(db)
    
    result = analysis_service.get_analysis_by_id(analysis_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在"
        )
    
    return result


@router.get("/user/{user_id}/history", response_model=list[VoiceAnalysisResponse])
async def get_user_analysis_history(
    user_id: str,
    limit: int = 10,
    db: Client = Depends(get_db)
):
    """
    获取用户的分析历史
    """
    analysis_service = AnalysisService(db)
    
    try:
        history = analysis_service.get_user_analysis_history(user_id, limit)
        return history
    except Exception as e:
        logger.error(f"获取分析历史失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
