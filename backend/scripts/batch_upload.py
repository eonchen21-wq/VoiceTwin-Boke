"""
批量上传 MP3 文件到 Supabase Storage
使用 UUID 重命名文件以避免中文和特殊字符导致的上传失败
"""
import os
import sys
import uuid
from pathlib import Path
from typing import Dict, List, Tuple
from dotenv import load_dotenv
from supabase import create_client, Client

# 加载环境变量
load_dotenv()

# Supabase 配置
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
BUCKET_NAME = 'audio-files'

# 目标文件夹路径（请修改为您的实际路径）
TARGET_FOLDER = r'F:\补货'


class AudioUploader:
    """音频文件批量上传器"""
    
    def __init__(self):
        """初始化 Supabase 客户端"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("请在 .env 文件中设置 SUPABASE_URL 和 SUPABASE_KEY")
        
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.bucket_name = BUCKET_NAME
        self.upload_results: List[Dict] = []
    
    def generate_safe_filename(self, original_filename: str) -> str:
        """
        生成安全的文件名（使用 UUID）
        
        Args:
            original_filename: 原始文件名
            
        Returns:
            安全的文件名（UUID + 扩展名）
        """
        # 获取文件扩展名
        ext = Path(original_filename).suffix.lower()
        
        # 生成 UUID 文件名
        safe_name = f"{uuid.uuid4().hex}{ext}"
        
        return safe_name
    
    def upload_file(self, file_path: str, original_name: str) -> Tuple[bool, str, str]:
        """
        上传单个文件到 Supabase Storage
        
        Args:
            file_path: 本地文件路径
            original_name: 原始文件名
            
        Returns:
            (是否成功, 公开 URL, 错误信息)
        """
        try:
            # 生成安全的文件名
            safe_filename = self.generate_safe_filename(original_name)
            
            # 读取文件内容
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # 上传到 Supabase Storage
            response = self.client.storage.from_(self.bucket_name).upload(
                path=safe_filename,
                file=file_content,
                file_options={
                    "content-type": "audio/mpeg",
                    "cache-control": "3600"
                }
            )
            
            # 获取公开 URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(safe_filename)
            
            return True, public_url, ""
            
        except Exception as e:
            return False, "", str(e)
    
    def scan_folder(self, folder_path: str) -> List[str]:
        """
        扫描文件夹中的所有 MP3 文件
        
        Args:
            folder_path: 文件夹路径
            
        Returns:
            MP3 文件路径列表
        """
        mp3_files = []
        folder = Path(folder_path)
        
        if not folder.exists():
            print(f"❌ 错误: 文件夹不存在 - {folder_path}")
            return mp3_files
        
        # 递归查找所有 .mp3 文件
        for file_path in folder.rglob('*.mp3'):
            mp3_files.append(str(file_path))
        
        return mp3_files
    
    def batch_upload(self, folder_path: str) -> None:
        """
        批量上传文件夹中的所有 MP3 文件
        
        Args:
            folder_path: 目标文件夹路径
        """
        print(f"📁 扫描文件夹: {folder_path}")
        print("-" * 80)
        
        # 扫描文件
        mp3_files = self.scan_folder(folder_path)
        
        if not mp3_files:
            print("⚠️  未找到任何 MP3 文件")
            return
        
        print(f"✓ 找到 {len(mp3_files)} 个 MP3 文件\n")
        
        # 上传文件
        success_count = 0
        failed_count = 0
        
        for i, file_path in enumerate(mp3_files, 1):
            original_name = Path(file_path).name
            file_size = Path(file_path).stat().st_size / (1024 * 1024)  # MB
            
            print(f"[{i}/{len(mp3_files)}] 上传中: {original_name} ({file_size:.2f} MB)")
            
            success, public_url, error = self.upload_file(file_path, original_name)
            
            if success:
                success_count += 1
                print(f"    ✅ [成功] 原始: {original_name}")
                print(f"    -> 链接: {public_url}")
                
                # 记录结果
                self.upload_results.append({
                    'original_name': original_name,
                    'public_url': public_url,
                    'status': 'success'
                })
            else:
                failed_count += 1
                print(f"    ❌ [失败] {original_name}")
                print(f"    -> 错误: {error}")
                
                # 记录失败结果
                self.upload_results.append({
                    'original_name': original_name,
                    'error': error,
                    'status': 'failed'
                })
            
            print()
        
        # 打印总结
        print("=" * 80)
        print(f"📊 上传完成统计:")
        print(f"   ✓ 成功: {success_count} 个文件")
        print(f"   ✗ 失败: {failed_count} 个文件")
        print(f"   总计: {len(mp3_files)} 个文件")
        print("=" * 80)
    
    def export_mapping(self, output_file: str = 'upload_mapping.txt') -> None:
        """
        导出文件名映射到文本文件
        
        Args:
            output_file: 输出文件路径
        """
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write("音频文件上传映射表\n")
                f.write("=" * 100 + "\n\n")
                
                for result in self.upload_results:
                    if result['status'] == 'success':
                        f.write(f"原始文件名: {result['original_name']}\n")
                        f.write(f"公开链接:   {result['public_url']}\n")
                        f.write("-" * 100 + "\n\n")
            
            print(f"✓ 映射表已导出到: {output_file}")
            
        except Exception as e:
            print(f"✗ 导出映射表失败: {str(e)}")


def main():
    """主函数"""
    print("🎵 Supabase 音频文件批量上传工具")
    print("=" * 80)
    
    # 检查文件夹路径
    if not os.path.exists(TARGET_FOLDER):
        print(f"\n❌ 错误: 目标文件夹不存在")
        print(f"请修改脚本中的 TARGET_FOLDER 变量为实际路径")
        print(f"当前设置: {TARGET_FOLDER}")
        sys.exit(1)
    
    try:
        # 创建上传器
        uploader = AudioUploader()
        
        # 批量上传
        uploader.batch_upload(TARGET_FOLDER)
        
        # 导出映射表
        uploader.export_mapping()
        
        print("\n✅ 所有操作已完成！")
        
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
