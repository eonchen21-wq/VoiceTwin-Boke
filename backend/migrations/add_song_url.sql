-- ========================================
-- 添加歌曲音频 URL 字段迁移脚本
-- 功能：在 songs 表中添加 song_url 字段
-- ========================================

-- 1. 添加 song_url 字段（存储音频文件的 URL）
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS song_url TEXT;

-- 2. 添加注释说明字段用途
COMMENT ON COLUMN songs.song_url IS '歌曲音频文件 URL，可以是 Supabase Storage 链接或外部链接';

-- 3. 为测试歌曲添加示例音频链接
-- 使用公开可访问的测试音频文件

-- Rolling in the Deep - Adele (示例)
UPDATE songs 
SET song_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
WHERE title = 'Rolling in the Deep' AND song_url IS NULL;

-- Easy On Me - Adele (示例)
UPDATE songs 
SET song_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
WHERE title = 'Easy On Me' AND song_url IS NULL;

-- Skyfall - Adele (示例)
UPDATE songs 
SET song_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
WHERE title = 'Skyfall' AND song_url IS NULL;

-- 4. 可选：设置默认值为空（允许没有音频的歌曲）
-- song_url 字段允许为 NULL，因为可能有些歌曲暂时没有音频文件

-- 5. 验证数据
SELECT id, title, artist, tag, 
       CASE 
           WHEN song_url IS NOT NULL THEN '✓ 有音频'
           ELSE '✗ 缺失'
       END as audio_status
FROM songs 
ORDER BY tag, title;

-- ========================================
-- 执行完成
-- ========================================

-- 注意事项：
-- 1. 上面使用的是 SoundHelix 提供的免费测试音频
-- 2. 实际使用时，应该将音频文件上传到 Supabase Storage
-- 3. Supabase Storage 的 URL 格式：
--    https://<project-ref>.supabase.co/storage/v1/object/public/audio-files/<filename>.mp3
