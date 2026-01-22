"""
批量导入歌曲脚本
自动扫描本地 MP3，解析文件名（格式：编号.歌名 - 歌手 - 其他），并将信息录入 Supabase 数据库
"""
import os
import re
import logging
from pathlib import Path
from typing import Tuple, List
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 加载环境配置
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
TARGET_FOLDERS = [r'F:\音乐', r'F:\补货']

# 设置超时防止断连
options = ClientOptions(postgrest_client_timeout=60)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=options)


def parse_filename(filename: str) -> Tuple[str | None, str | None]:
    """
    解析文件名逻辑
    
    Args:
        filename: MP3 文件名
        
    Returns:
        (歌名, 歌手) 元组，解析失败返回 (None, None)
        
    Examples:
        输入: "1701.空空如也 - 胡66 - 90青春无敌.mp3"
        输出: ("空空如也", "胡66")
    """
    # 移除扩展名
    name = Path(filename).stem
    
    # 尝试模式 1: 编号.歌名 - 歌手 - 其他
    # 匹配规则：数字+点+任意字符+空格横杠空格+任意字符...
    match = re.match(r'^\d+\.(.+?) - (.+?) -', name)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # 尝试模式 2: 编号.歌名 - 歌手 (没有后面部分)
    match = re.match(r'^\d+\.(.+?) - (.+?)$', name)
    if match:
        return match.group(1).strip(), match.group(2).strip()
        
    # 尝试模式 3: 纯粹是 "歌名 - 歌手"
    if ' - ' in name:
        parts = name.split(' - ')
        if len(parts) >= 2:
            return parts[0].strip(), parts[1].strip()
    
    # 尝试模式 4: 歌名-歌手#后缀 (例如: "光年之外-G.E.M.邓紫棋#eyW8s")
    match = re.match(r'^(.+?)-(.+?)#', name)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # 尝试模式 5: 纯歌名（没有歌手信息）
    # 如果都不匹配，把整个文件名当作歌名
    return name, None


def scan_and_import() -> None:
    """扫描文件夹并批量导入歌曲到数据库"""
    print("🚀 开始扫描并导入歌曲到数据库...")
    print("=" * 80)
    
    # 1. 先拉取现有的歌名，防止重复导入
    existing_titles = set()
    try:
        logger.info("⬇️  正在拉取数据库中已有歌曲...")
        res = supabase.table('songs').select('title').execute()
        for row in res.data:
            existing_titles.add(row['title'])
        print(f"📋 数据库中已有 {len(existing_titles)} 首歌，将自动跳过重复项。\n")
    except Exception as e:
        logger.error(f"⚠️  无法读取现有歌曲，将尝试直接插入: {e}")

    success_count = 0
    skip_count = 0
    parse_failed_count = 0
    total_files = 0

    for folder in TARGET_FOLDERS:
        if not os.path.exists(folder):
            logger.warning(f"文件夹不存在，跳过: {folder}")
            continue
            
        print(f"📂 正在扫描文件夹: {folder}")
        files: List[Path] = list(Path(folder).rglob('*.mp3'))
        total_files += len(files)
        print(f"   找到 {len(files)} 个 MP3 文件\n")
        
        for i, file_path in enumerate(files, 1):
            title, artist = parse_filename(file_path.name)
            
            if not title:
                logger.warning(f"   ⚠️  无法解析文件名，跳过: {file_path.name}")
                parse_failed_count += 1
                continue
                
            if title in existing_titles:
                # 避免刷屏，只统计不打印
                skip_count += 1
                continue
                
            # 准备插入的数据
            new_song = {
                "title": title,
                "artist": artist if artist else "未知歌手",
                "album": "本地导入",
                "tag": "comfort",  # 默认为舒适区，以后可以在后台修改
                "tag_label": "舒适区"  # 必需字段：标签的中文标签
            }
            
            try:
                supabase.table('songs').insert(new_song).execute()
                print(f"   ✅ [{i}/{len(files)}] 已导入: {title} (歌手: {artist if artist else '未知'})")
                existing_titles.add(title)  # 记入缓存，防止本次运行中重复
                success_count += 1
            except Exception as e:
                logger.error(f"   ❌ 导入失败 {title}: {e}")

    # 打印统计结果
    print("\n" + "=" * 80)
    print("📊 导入完成统计:")
    print(f"   总文件数: {total_files}")
    print(f"   ✅ 新增: {success_count} 首")
    print(f"   ⚠️  跳过（已存在）: {skip_count} 首")
    print(f"   ❌ 解析失败: {parse_failed_count} 首")
    print("=" * 80)
    
    if success_count > 0:
        print(f"\n🎉 成功导入 {success_count} 首新歌！")
        print("💡 提示：现在可以运行 extract_features.py 提取音频特征了。")


def main():
    """主函数"""
    try:
        scan_and_import()
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断操作")
    except Exception as e:
        logger.error(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
