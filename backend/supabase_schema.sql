-- ==================================================
-- 系統 V6.1 戰略升級：Supabase 雲端資料表結構設計 (SQL DDL)
-- 
-- 🚨 快速排障提示 (42501 RLS Policy Blocker)：
-- 如果您在策展入庫時遇到 42501 或 401 權限報錯，請在 SQL Editor 中直接執行以下指令
-- 來停用 Row-Level Security 限制（允許前端直接以 Anon Key 進行無障礙讀寫）：
-- 
-- ALTER TABLE public.archived_looks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.collections DISABLE ROW LEVEL SECURITY;
-- ==================================================

-- 1. 建立專案相簿表 (Collections)
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 建立私人收藏表 (Archived Looks)
CREATE TABLE IF NOT EXISTS archived_looks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    designer TEXT NOT NULL,
    season TEXT NOT NULL,
    look_number INT NOT NULL,
    image_url TEXT NOT NULL,
    source_url TEXT,
    instagram_handle TEXT,
    note TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}', -- 使用 PostgreSQL 內建的字串陣列儲存標籤
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL, -- 關聯專案
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 避免多分頁或 Realtime 競態造成同一品牌 / 季度 / Look 序號重複入庫
CREATE UNIQUE INDEX IF NOT EXISTS archived_looks_unique_look
ON archived_looks (LOWER(designer), LOWER(season), look_number);

-- 3. （選填）開啟 RLS 安全存取機制
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_looks ENABLE ROW LEVEL SECURITY;

-- 4. 允許所有人（不分匿名與登入用戶）對這些資料表進行 SELECT, INSERT, UPDATE, DELETE 的公開存取規則
CREATE POLICY "Allow public select" ON collections FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON collections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON collections FOR DELETE USING (true);

CREATE POLICY "Allow public select" ON archived_looks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON archived_looks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON archived_looks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON archived_looks FOR DELETE USING (true);
