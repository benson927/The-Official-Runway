# 🏛 THE SILENT ARCHIVE // 啟動手冊 (V5.7)

歡迎使用 **COP.VISION V5.7 "The Silent Archive"** 高級時裝雙屏私人金庫。
本手冊為您提供了日常一鍵啟動指令、系統極簡架構亮點、以及資料庫維護的實用指南。

---

## 📌 快速一鍵啟動 (每次開啟必備)

請開啟兩個終端機 (Terminal) 視窗，分別一鍵複製並執行以下黃金指令：

### 🧬 1. 後端伺服器 (Backend Server)
```bash
cd "/Users/bensonhong/Desktop/Antigravity專案/secondtool" && python3 backend/app.py
```
*   **運行端點**：`http://127.0.0.1:5001`
*   **啟動速度**：**< 0.1 秒秒啟 🚀** (已移除所有定時輪詢與冷啟動負載)。

### 🖥 2. 前端開發伺服器 (Frontend Server)
```bash
cd "/Users/bensonhong/Desktop/Antigravity專案/secondtool/frontend" && npm run dev
```
*   **訪問網址**：`http://localhost:5173/`
*   **重載機制**：支援 Vite HMR 熱更新，代碼修改即時響應。

---

## 💎 系統 V5.7 極簡冷淡美學架構

為了追求極致的留白空氣感，系統已徹底掃除二手拍賣價格監控技術債，聚焦於以下兩大時裝靈感板塊：

1.  **左半屏 (Runway Timeline)**：
    *   **時光機引擎**：流暢切換 2025-2026 各大季度 Looks，具備本地 SQLite WAL 雙表高速快取。
    *   **極簡官方社群橋接**：季度標題右側動態並排 `[ @品牌帳號 ↗ ]` 與時光機來源，無 Logo 純文字設計維持完美水平對齊。
    *   **YouTube 153 防錯**：解析影片網址時，自動將 embed 轉換為標準 `watch?v=` 連結，徹底避免官方拒絕播放錯誤。
2.  **右半屏 (The Vault Curator Board)**：
    *   **離線持久化情緒板**：對左側大圖一鍵 `+ CURATE` 永久收藏，關閉網頁亦不遺失.
    *   **動態標籤分類篩選**：為時裝 Look 標記自訂標籤，頂部自動生成極簡篩選鈕。
    *   **自由卡片釋放**：Hover 時浮現 `- REMOVE` 優雅將 Look 從金庫中釋放。

---

## ⚙️ 系統日常維護與優化指令

### 🧹 1. 清除特定品牌快取 (強迫重新爬取)
如果您希望強制後端重新去 Vogue 爬取特定品牌的最新季度與影音資訊，請在終端機執行以下 SQLite 清除命令（以 Prada 為例）：
```bash
sqlite3 "/Users/bensonhong/Desktop/Antigravity專案/secondtool/backend/runway_cache.db" \
"delete from runway_cache_meta where designer='prada'; delete from runway_looks where designer='prada';"
```

### ☁️ 2. 釋放 Supabase 雲端資料庫空間
大掃除後，系統已完全不依賴 Supabase。您可以打開 Supabase 平台，在 SQL Editor 中執行我們為您寫好的 [supabase_drop_tables.sql](./backend/supabase_drop_tables.sql) 腳本，徹底 Drop 舊版二手拍賣資料表：
```sql
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS watchlist_items CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
```

---

*詳細升級紀錄與動態演示請參考走查報告：[walkthrough.md](./walkthrough.md)*
