# 数据库迁移脚本

## 如何执行迁移

### 方法 1: Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 打开 `add_song_tags.sql` 文件，复制全部内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行

### 方法 2: 使用 Supabase CLI

```bash
# 如果已安装 Supabase CLI
supabase db push

# 或者直接执行 SQL 文件
psql -h <your-db-host> -U postgres -d postgres -f add_song_tags.sql
```

## 迁移文件列表

- `add_song_tags.sql` - 添加歌曲标签字段（tag, tag_label）

## 注意事项

- 执行前请先备份数据库
- 确认 SQL 脚本内容符合您的需求
- 执行后验证数据是否正确更新
