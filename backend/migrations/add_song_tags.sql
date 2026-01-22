-- ========================================
-- 歌曲标签字段迁移脚本
-- 功能：添加 tag 和 tag_label 字段到 songs 表
-- ========================================

-- 1. 添加 tag 字段（枚举类型：comfort 或 challenge）
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS tag TEXT CHECK (tag IN ('comfort', 'challenge'));

-- 2. 添加 tag_label 字段（中文标签）
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS tag_label TEXT;

-- 3. 为现有歌曲设置默认值
-- 根据歌曲难度和特点分配标签

-- 舒适区歌曲（适合大多数人演唱）
UPDATE songs 
SET 
    tag = 'comfort',
    tag_label = '舒适区'
WHERE title IN (
    'Easy On Me',          -- 阿黛尔 - 中等难度
    'Last Dance',          -- 伍佰 - 抒情稳定
    'Rolling in the Deep', -- 阿黛尔 - 适中但有力
    '简单爱'               -- 周杰伦 - 轻松愉快
);

-- 挑战区歌曲（需要较强技巧）
UPDATE songs 
SET 
    tag = 'challenge',
    tag_label = '挑战区'
WHERE title IN (
    'Skyfall',   -- 阿黛尔 - 高音挑战
    '光年之外',  -- G.E.M. - 音域宽广
    '孤勇者'     -- 陈奕迅 - 技巧要求高
);

-- 4. 为任何没有标签的歌曲设置默认值（comfort）
UPDATE songs 
SET 
    tag = 'comfort',
    tag_label = '舒适区'
WHERE tag IS NULL;

-- 5. 设置字段为非空（确保以后新增歌曲必须有标签）
ALTER TABLE songs 
ALTER COLUMN tag SET NOT NULL;

ALTER TABLE songs 
ALTER COLUMN tag_label SET NOT NULL;

-- 6. 验证数据
-- 取消下面的注释以查看更新后的结果
-- SELECT id, title, artist, tag, tag_label FROM songs ORDER BY tag, title;

-- ========================================
-- 执行完成
-- ========================================
