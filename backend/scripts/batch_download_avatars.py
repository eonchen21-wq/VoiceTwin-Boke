# backend/scripts/batch_download_avatars.py
import os
import time
import requests
from duckduckgo_search import DDGS

# 1. 定义要保存的路径
SAVE_DIR = "../static/avatars"
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

# 2. 模拟从数据库获取歌手列表
# 实际项目中，你应该从 database 读取：
# from service.song_service import SongService
# singers = SongService().get_all_artist_names()
# 这里为了演示，我们假设这是你的歌手列表：
singers = ["伍佰", "邓紫棋", "陈奕迅", "周杰伦", "Taylor Swift", "Adele", "林俊杰"]

def download_image(url, save_path):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"下载失败: {e}")
    return False

def search_and_download():
    print(f"开始为 {len(singers)} 位歌手下载头像...")
    
    with DDGS() as ddgs:
        for singer in singers:
            filename = f"{singer}.jpg"
            save_path = os.path.join(SAVE_DIR, filename)
            
            # 如果文件已存在，跳过
            if os.path.exists(save_path):
                print(f"✅ [跳过] {singer} 已存在")
                continue
                
            print(f"🔍 正在搜索: {singer} ...")
            try:
                # 搜索“歌手名 + 歌手头像”
                keywords = f"{singer} singer face profile"
                results = list(ddgs.images(keywords, max_results=1))
                
                if results:
                    image_url = results[0]['image']
                    print(f"   ⬇️ 找到图片，正在下载...")
                    if download_image(image_url, save_path):
                        print(f"   ✅ 成功保存: {filename}")
                    else:
                        print(f"   ❌ 下载出错")
                else:
                    print(f"   ⚠️ 未找到相关图片")
                    
            except Exception as e:
                print(f"   ❌ 搜索出错: {e}")
            
            # 休息一下，防止被封 IP
            time.sleep(5.0)

if __name__ == "__main__":
    search_and_download()