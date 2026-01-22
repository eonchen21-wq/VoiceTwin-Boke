-- ================================================
-- 声音分析应用 - Supabase 数据库初始化脚本
-- ================================================

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建匹配歌手表
CREATE TABLE IF NOT EXISTS matched_singers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  voice_characteristics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建声音分析记录表
CREATE TABLE IF NOT EXISTS voice_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  clarity TEXT NOT NULL,
  stability TEXT NOT NULL,
  radar_data JSONB NOT NULL,
  matched_singer_id TEXT REFERENCES matched_singers(id),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建歌曲表
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  cover_url TEXT,
  tag TEXT CHECK (tag IN ('comfort', 'challenge')),
  tag_label TEXT,
  singer_id TEXT REFERENCES matched_singers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- ================================================
-- 创建索引以优化查询性能
-- ================================================

CREATE INDEX IF NOT EXISTS idx_voice_analyses_user_id ON voice_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_analyses_created_at ON voice_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_song_id ON user_favorites(song_id);
CREATE INDEX IF NOT EXISTS idx_songs_singer_id ON songs(singer_id);

-- ================================================
-- 插入默认歌手数据
-- ================================================

INSERT INTO matched_singers (id, name, description, avatar_url, voice_characteristics) VALUES
('default-singer-adele', '阿黛尔', '女中音 • 灵魂乐 • 流行', 
 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmHL-GSoaAVR2nfJdU3RF-yq_vzzGNqzdiMnQCWMZiRI-MeK70WSrgfb2O8KbrJgxOAgdCJ6_-Anh7UHo_0pOPVq77dOMLwJlg8pl3inEdd6gDhEAUlw_F1IfTlkD88gxn_uJf6ld3h7dq2f3jkVAxg46l2hann6dAhAzDlCATAkkXo2P-lkot_SOS1y4fOF6Vs9G9AQcQe6teCtWcPEdlD-TRJvT3A9xYIE8Sb_4qoEMadS9L-Tp69dahOLYjeT3b0VQXDk0tCNdd',
 '{"vocal_range": "contralto", "genre": ["soul", "pop", "blues"]}'::JSONB)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 插入示例歌曲数据（阿黛尔的歌曲）
-- ================================================

INSERT INTO songs (title, artist, album, cover_url, tag, tag_label, singer_id) VALUES
('Rolling in the Deep', '阿黛尔', '21', 
 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb_hzIoULixmV0-2zQZr4KO9pyXNAHKyIm19F8twJlOImaLiQdEHg8cqd3ngCeyDcTg560r8VsDs6u934ukkh9BwoMof7Aj-jk6JZ7qAkkuolfhtiXWUartn_vnZAlMPAV2DQFECMEbLWhyai1C7R-cf_4LR_N3dE3iUgvs5J_TnbKzW8QHhFUkzQscOox4QMiT0YesFKBLn1TAB4_7wSxjWcdE7toeKT8twa9k2WCg-p-HZYSOTrTpsP3b7GccqNoWfgIirosltPW',
 'comfort', '完美契合', 'default-singer-adele'),
 
('Easy On Me', '阿黛尔', '30',
 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoYs6gl-e-COScdrbRKTQaknU4VvfN4rRoyJ7PqfEhy1x55vLB9K6TwqURFCYAsvn2_F_a21X2IEvJrQJBZmzancAg1_6TEnvVi_Sg8q0CKFIYQ9PcKwGxN4faYzjs58U1T26oA8yFhiVsqN0cOxZcD2RDvc5alEHyapdeV96ypGOYxegDvalIXRNfWrDFDf4kOHFX0_HMkmTZMNC2K6Wl93QVqWrpdaBVZNc6wIv9Bagi4Fud9Z-2K4LijVzAm8eFoKnmdMlejWJW',
 'comfort', '非常适合', 'default-singer-adele'),
 
('Skyfall', '阿黛尔', 'Skyfall',
 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR3nbYBVOKnBpYu1eEXzkPq4moF_9Mht2aXP0smMNAPPHlXayZ2oWeiKrvWkbegx4CLRMCN5J6s9YoQLvSCNDeFw2Luz6Gu5r8ULdpxt38gpsxm8C9ip-IMB57z8R6KonlKM7iOIJN-WhTGa0uOVDFhCvzx5r7WOwszWrGeZHj5JqJGGAtWjXxtVwItfO9WArR5GldCxbPpd-8UPm319a_NUuc_q5OKG5yLklI6uqfxte3msNANmdG68EyACVhEJcDKmsmBW3eBXSO',
 'challenge', '极具挑战', 'default-singer-adele');

-- ================================================
-- 插入更多中文歌曲数据
-- ================================================

INSERT INTO songs (title, artist, album, cover_url, tag, tag_label) VALUES
('光年之外', 'G.E.M. 邓紫棋', '',
 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIbDklDKdvivlOXGNaNvjdlKnXGc7kRnvo2ZHqoANrOAasKEfHKBmlD8FQTt5C1YmLDJowmM7TzRO5o1QLSljnOFazAMLYJ_J6edbJFKSZci5EF3UlVWo_nBzSHEVWFfiig8EAnuiB2in4u4xtM9rHq8NH7SSPeWvGJcSW9_CHJkjLHISCQIGDH98KbPpMdkT1s3_1WDgXNFe92eQyQCkKC0RViLHjjUwsyNPWzUaXbPCLuDkv4VVvniG7hJAEUkibD8cNo8eD7P7b',
 'challenge', '挑战区'),
 
('简单爱', '周杰伦', '',
 'https://lh3.googleusercontent.com/aida-public/AB6AXuBisgdXwFNGnADME26zZ2gYAujL0QpSBs4i84lWLK4hruZbIs6fKmcxqlQbqak-9oQ1Ujj6DBVu_EdQB_iPWNxjvSvID9qV2gbA746sFc5kSFtFI_2LfwW2HZVdjwd5NeBFUIwIpghOanLczsWdtr-5yYjGJLzxeiJ68PhLBABqduFa2zJrAOhZnaEqTyyrrI2UZ0Wc8FRXkyc8u7e-cH7iuONPUOR6NQAREDh0FQFeGuC8VOAYFS_tjWCIECq99yPR1e_knCYN9sGZ',
 'comfort', '舒适区'),
 
('Last Dance', '伍佰', '',
 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOdMNNa8yBBp1hJ3y-1omVCRXGb5ZtkC0eCXTyYip9cycOq6viIfXt3tQ4wi6XdaDeM3WSVIhdpamTOa-dbaRhKkPBO7-tBFRabuQGcI-gAkllTChNjpbYiOY6g9NMu_cdEYs1D0EPRLrBKqHUuaHMTufuIkBaJuHxU7B_qDBVRQsibUeW9ncTKuVPJ_QoZNHrh8qdrps_2VoXwCVVYw5gzTkthDP4C3HXvIcfucmWC8imCuOqPVhRiYXj9azUijFYlInNexVT04fN',
 'comfort', '舒适区'),
 
('孤勇者', '陈奕迅', '',
 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiVO8sYNwRXWWEGxaWecy16a5noaHFbCeetuaL_fDUADN5KrGDG-1w7rkz5qYcadmEWNXgwBVvh20PIY0iQ-LZr-ji-kre4lezzXvcq0M5NESeMDvJuHzf8PEu0HxokfrsysTs2HWZi048irrYiXTN-uy3omecmpMxeQEaodsLxHMwo6-gX8w1ci-VjLh_fqX24egNvfPzxULggu9e4dDLdmdJPpoOGhfTwf8Ie2NMrqUPfVkzdwGnoMDLZWSi9ilx3v8T3dPcRvJE',
 'challenge', '挑战区');

-- ================================================
-- 创建更新时间触发器
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
