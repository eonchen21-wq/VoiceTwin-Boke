-- ================================================
-- 添加声学特征向量字段到 songs 表
-- 用于基于 MFCC 的音乐匹配算法
-- ================================================

-- 1. 为 songs 表添加 feature_vector 字段
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS feature_vector JSONB;

-- 2. 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_songs_feature_vector 
ON songs USING GIN (feature_vector);

-- 3. 添加字段注释
COMMENT ON COLUMN songs.feature_vector IS 'MFCC声学特征向量(13维浮点数数组)，用于余弦相似度匹配';

-- ================================================
-- 验证变更
-- ================================================

-- 查看 songs 表结构
-- \d songs

-- 查看示例数据（迁移后特征向量应为 NULL，需要运行离线脚本填充）
-- SELECT id, title, artist, feature_vector FROM songs LIMIT 5;
