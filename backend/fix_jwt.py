"""
快速修复 JWT 认证问题
运行此脚本来更新 .env 文件中的 JWT Secret
"""
import os
from pathlib import Path

def fix_jwt_secret():
    """更新 JWT Secret"""
    
    print("=" * 70)
    print("JWT Secret 配置修复工具")
    print("=" * 70)
    
    print("\n请按照以下步骤操作:")
    print("1. 打开 https://app.supabase.com")
    print("2. 选择你的项目 (wcetamrikreimmndnemy)")
    print("3. 点击 Settings → API")
    print("4. 找到 'JWT Secret' (注意：不是 anon key 或 service_role key)")
    print("5. 复制完整的 JWT Secret 值")
    
    print("\n" + "-" * 70)
    jwt_secret = input("\n请粘贴你的 JWT Secret: ").strip()
    
    if not jwt_secret:
        print("\n❌ 未提供 JWT Secret，操作已取消")
        return
    
    # 读取当前 .env 文件
    env_file = Path(__file__).parent / ".env"
    
    if not env_file.exists():
        print(f"\n❌ 找不到 .env 文件: {env_file}")
        return
    
    # 读取并更新配置
    with open(env_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 更新 JWT Secret
    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith('SUPABASE_JWT_SECRET='):
            lines[i] = f'SUPABASE_JWT_SECRET={jwt_secret}\n'
            updated = True
            break
    
    if not updated:
        print("\n⚠️ 未找到 SUPABASE_JWT_SECRET 配置，将添加到文件末尾")
        lines.append(f'SUPABASE_JWT_SECRET={jwt_secret}\n')
    
    # 写回文件
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("\n" + "=" * 70)
    print("✅ JWT Secret 已更新!")
    print("=" * 70)
    
    print("\n下一步操作:")
    print("1. ✅ JWT Secret 已自动更新到 .env 文件")
    print("2. ⏳ 等待 uvicorn 自动重载（应该会看到 'Reloading...' 消息）")
    print("3. 🌐 在浏览器中退出登录")
    print("4. 🔑 重新登录")
    print("5. 🎤 尝试声音分析功能")
    
    print("\n如果问题仍然存在，请运行 'python test_jwt_debug.py' 进行调试")

if __name__ == "__main__":
    try:
        fix_jwt_secret()
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
