-- ==================================================
-- 系統 V5.6 技術債清除計畫：The Great Purge (Supabase Tables)
-- 
-- 本腳本用以安全地 Drop 舊版 (V4) 二手拍賣資料表以釋放雲端空間。
-- 可以在 Supabase Dashboard 的 SQL Editor 中貼上並直接執行。
-- ==================================================

-- 1. 刪除商品主資料表
DROP TABLE IF EXISTS products CASCADE;

-- 2. 刪除關注商品清單表
DROP TABLE IF EXISTS watchlist_items CASCADE;

-- 3. 刪除監控品牌清單表
DROP TABLE IF EXISTS brands CASCADE;

-- 清理完成說明
-- ⚠️ 執行本腳本後，雲端所有舊版二手商品快取、追蹤網址以及品牌清單將被徹底清除，釋放 100% 雲端冗餘空間。
