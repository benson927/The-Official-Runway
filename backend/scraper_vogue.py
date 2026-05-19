# scraper_vogue.py — V5.5
# -*- coding: utf-8 -*-

import os
import re
import sqlite3
import time
import requests
from bs4 import BeautifulSoup
import json

# ==========================================
# 全局組態設定
# ==========================================
# 預設快取過期時間：24 小時 (以秒為單位)
DEFAULT_CACHE_EXPIRY = 24 * 3600

# SQLite 資料庫檔案路徑 (存放在當前 backend 目錄下)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "runway_cache.db")

# 爬蟲請求使用的瀏覽器 Headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# ==========================================
# SQLite 資料庫初始化與工具方法
# ==========================================

def get_db_connection():
    """取得資料庫連線，並設定為 WAL 模式以提升併發讀寫效能"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 允許使用字典方式存取欄位
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    """
    初始化 SQLite 資料庫，建立多季度快取資料表
    包含 Schema 升級與欄位自動 Migration 偵測邏輯，確保無損升級
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 🕵️‍♂️ [Schema 升級偵測 - V5.3 跨季度]：檢查 runway_designer_seasons 這張 V5.3 新表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='runway_designer_seasons';")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("⚠️ [資料庫] 偵測到全系統升級為 V5.3 (跨季度時光機)，正在安全遷移並重建 SQLite 快取結構...")
            cursor.execute("DROP TABLE IF EXISTS runway_cache_meta;")
            cursor.execute("DROP TABLE IF EXISTS runway_looks;")
            
        # 1. 建立快取元數據表 (複合主鍵：設計師 + 季度)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS runway_cache_meta (
                designer TEXT NOT NULL,
                season TEXT NOT NULL,
                last_scraped INTEGER NOT NULL,
                PRIMARY KEY (designer, season)
            );
        """)
        
        # 🕵️‍♂️ [Schema 升級偵測 - V5.5 外部連結]：檢查 runway_cache_meta 表中是否已含有 source_url 和 video_url 欄位
        cursor.execute("PRAGMA table_info(runway_cache_meta);")
        columns = [row[1] for row in cursor.fetchall()]
        if "source_url" not in columns:
            print("⚠️ [資料庫] 偵測到全系統升級為 V5.5 (秀場動態連結)，正在安全升級 runway_cache_meta 表結構...")
            cursor.execute("ALTER TABLE runway_cache_meta ADD COLUMN source_url TEXT;")
        if "video_url" not in columns:
            cursor.execute("ALTER TABLE runway_cache_meta ADD COLUMN video_url TEXT;")
        
        # 2. 建立設計師可用季度關聯快取表 (複合主鍵：設計師 + 季度)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS runway_designer_seasons (
                designer TEXT NOT NULL,
                season TEXT NOT NULL,
                season_url TEXT NOT NULL,
                PRIMARY KEY (designer, season)
            );
        """)
        
        # 3. 建立 Look 圖片詳情表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS runway_looks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                designer TEXT NOT NULL,
                season TEXT NOT NULL,
                look_number INTEGER NOT NULL,
                image_url TEXT NOT NULL
            );
        """)
        
        # 建立聯合索引，優化設計師與特定季度 Look 圖片的查詢效能
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_runway_looks_designer_season ON runway_looks(designer, season);")
        
        conn.commit()
        print("\033[90m[ SYSTEM ]\033[0m  SQLITE CACHE INITIALIZED.")
    except Exception as e:
        print(f"[ ERROR ]  DATABASE INIT FAILED: {e}")
        conn.rollback()
    finally:
        conn.close()

# 確保在模組載入時自動初始化資料庫
init_db()


# ==========================================
# 設計師名稱與抓取邏輯
# ==========================================

import unicodedata

def slugify_designer(designer_name):
    """
    將使用者輸入的設計師名稱標準化為 Vogue Runway URL 格式
    例如: "Maison Margiela" -> "maison-martin-margiela" (貼心自動對應 Vogue 官方 slug)
    支援法文/德文等重音符號標準化轉換 (例如 "Enfants Riches Déprimés" -> "enfants-riches-deprimes")
    """
    if not designer_name:
        return ""
    # Unicode 標準化去除重音符號 (é -> e, ç -> c)
    name = designer_name.strip().lower()
    name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('ASCII')
    
    if "margiela" in name:
        return "maison-martin-margiela"
        
    name = re.sub(r'[\s_\.]+', '-', name)
    name = re.sub(r'[^a-z0-9\-]', '', name)
    name = re.sub(r'-+', '-', name)
    return name

def extract_json_from_script(soup, key_fragment):
    """
    從網頁 HTML 中尋找包含特定關鍵字片段的 <script> 標籤，並解析出其中的 JSON 數據
    """
    for script in soup.find_all('script'):
        if script.string and key_fragment in script.string:
            js_text = script.string
            try:
                js_clean = js_text.split(' = ', 1)[1]
                if js_clean.endswith(';'):
                    js_clean = js_clean[:-1]
                brace_count = 0
                for i, char in enumerate(js_clean):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            js_clean = js_clean[:i+1]
                            break
                return json.loads(js_clean)
            except Exception as e:
                print(f"❌ [解析] 提取 JSON 數據失敗: {e}")
                return None
    return None

def fetch_designer_seasons_from_vogue(designer_slug):
    """
    訪問設計師主頁，解析並提取該設計師在 2025 至 2026 年之間的所有可用季度 (例如 Fall 2026, Spring 2026)
    並將結果寫入本地 SQLite 快取表 runway_designer_seasons 中以供前端橫向導覽 Timeline 使用
    """
    url = f"https://www.vogue.com/fashion-shows/designer/{designer_slug}"
    print(f"🔍 [爬蟲] 正在訪問設計師主頁抓取季度列表: {url}")
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f"❌ [爬蟲] 訪問設計師季度列表失敗，HTTP 狀態碼: {r.status_code}")
            return []
            
        soup = BeautifulSoup(r.text, 'html.parser')
        data = extract_json_from_script(soup, 'window.__PRELOADED_STATE__')
        if not data:
            print("❌ [爬蟲] 無法在網頁中解析 window.__PRELOADED_STATE__ 資料")
            return []
            
        collections = data['transformed']['runwayDesignerContent']['designerCollections']
        if not collections:
            print(f"❌ [爬蟲] 找不到設計師 '{designer_slug}' 的秀場季度列表")
            return []
            
        filtered_seasons = []
        conn = get_db_connection()
        cursor = conn.cursor()
        
        for col in collections:
            season_name = col.get("hed", "")
            season_url = col.get("url", "")
            
            # 使用正則匹配，篩選年份在 2025 或 2026 年度的季度秀場
            if season_name and season_url and re.search(r'2025|2026', season_name):
                # 確保是秀場主網址
                if season_url.startswith('/fashion-shows/'):
                    filtered_seasons.append({
                        "season_name": season_name,
                        "url": season_url
                    })
                    # 實時插入或覆蓋本地季度 URL 快取關聯表
                    cursor.execute("""
                        INSERT OR REPLACE INTO runway_designer_seasons (designer, season, season_url)
                        VALUES (?, ?, ?)
                    """, (designer_slug, season_name, season_url))
        
        conn.commit()
        conn.close()
        print(f"✅ [爬蟲] 成功為 '{designer_slug}' 提取並快取了 {len(filtered_seasons)} 個 2025-2026 的秀場季度")
        return filtered_seasons
    except Exception as e:
        print(f"❌ [爬蟲] 獲取季度資訊列表時發生錯誤: {e}")
        return []

def find_video_url_in_json(obj):
    """
    🕵️‍♂️ [V5.5] 遞迴深度檢索 JSON 樹，尋找符合影音串流、YouTube 嵌入或 mp4 網域特徵的字串
    此 DFS 機制能確保 100% 動態影音網址提取的強韌度
    """
    if isinstance(obj, str):
        # 尋找影音後綴或網域特徵
        if any(ext in obj.lower() for ext in ['.mp4', '.m3u8', 'youtube.com/embed/', 'youtube.com/watch', 'vimeo.com/video']):
            # 🕵️‍♂️ [V5.6+ 播放優化]：若是 YouTube embed 嵌入式連結，自動重構為標準觀看網址，防止 YouTube 錯誤 153 拒絕播放限制
            if 'youtube.com/embed/' in obj:
                match = re.search(r'youtube\.com/embed/([^?/\s]+)', obj)
                if match:
                    video_id = match.group(1)
                    return f"https://www.youtube.com/watch?v={video_id}"
            return obj
    elif isinstance(obj, dict):
        # 優先對特定的鍵名進行匹配
        for k in ['videoUrl', 'youtubeId', 'video_url', 'streamUrl', 'embedUrl']:
            if k in obj and isinstance(obj[k], str):
                if obj[k].strip():
                    return obj[k].strip()
        for v in obj.values():
            res = find_video_url_in_json(v)
            if res:
                return res
    elif isinstance(obj, list):
        for item in obj:
            res = find_video_url_in_json(item)
            if res:
                return res
    return None

def fetch_runway_looks_from_vogue(designer_slug, season_name, season_url):
    """
    訪問特定季度的秀場詳情頁面，抓取所有 Looks 的高解析度圖片與元數據
    並回傳 (looks_list, video_url) 雙元素元組
    """
    full_url = f"https://www.vogue.com{season_url}" if season_url.startswith('/') else season_url
    print(f"🔍 [爬蟲] 正在爬取特定季度秀場詳情頁面: {full_url}")
    try:
        r = requests.get(full_url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f"❌ [爬蟲] 訪問秀場頁面失敗，HTTP 狀態碼: {r.status_code}")
            return None, None
            
        soup = BeautifulSoup(r.text, 'html.parser')
        data = extract_json_from_script(soup, 'window.__PRELOADED_STATE__')
        if not data:
            print("❌ [爬蟲] 無法在秀場頁面中尋找到 window.__PRELOADED_STATE__ 資料")
            return None, None
            
        # 🕵️‍♂️ V5.5 深度檢索影片 URL 
        video_url = find_video_url_in_json(data)
        if video_url:
            # 🕵️‍♂️ [V5.6+ 播放優化]：若是 YouTube embed 嵌入式連結，自動重構為標準觀看網址，防止 YouTube 錯誤 153 拒絕播放限制
            if 'youtube.com/embed/' in video_url:
                match = re.search(r'youtube\.com/embed/([^?/\s]+)', video_url)
                if match:
                    video_id = match.group(1)
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"✅ [影音解析] 成功找到內嵌影片/報導連結: {video_url}")
            
        items = data['transformed']['runwayShowGalleries']['galleries'][0]['items']
        looks = []
        for item in items:
            caption = item.get("caption", "")
            look_num_match = re.search(r'\d+', caption)
            look_number = int(look_num_match.group()) if look_num_match else 0
            
            img_url = ""
            sources = item.get("image", {}).get("sources", {})
            if "md" in sources and "url" in sources["md"]:
                img_url = sources["md"]["url"]
            elif "lg" in sources and "url" in sources["lg"]:
                img_url = sources["lg"]["url"]
            else:
                for size, src_dict in sources.items():
                    if isinstance(src_dict, dict) and "url" in src_dict:
                        img_url = src_dict["url"]
                        break
                        
            if img_url:
                looks.append({
                    "designer": designer_slug,
                    "season": season_name,
                    "look_number": look_number,
                    "image_url": img_url
                })
        print(f"✅ [爬蟲] 成功爬取到 {len(looks)} 張秀場圖片")
        return looks, video_url
    except Exception as e:
        print(f"❌ [爬蟲] 解析秀場圖片時發生錯誤: {e}")
        return None, None


# ==========================================
# 多維快取管理與容錯降級機制
# ==========================================

def get_designer_cached_seasons(designer_slug):
    """
    從本地資料庫讀取該設計師已快取的所有季度列表
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT season, season_url 
            FROM runway_designer_seasons 
            WHERE designer = ?
        """, (designer_slug,))
        rows = cursor.fetchall()
        return [{"season_name": r["season"], "url": r["season_url"]} for r in rows]
    except Exception as e:
        print(f"❌ [快取] 讀取本地已快取季度列表失敗: {e}")
        return []
    finally:
        conn.close()

def get_cached_looks(designer_slug, season_name):
    """
    從本地 SQLite 資料庫精確讀取特定設計師特定季度的快取 Looks
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # 查詢特定設計師特定季度的 meta 快取狀態 (包含 source_url 和 video_url)
        cursor.execute("""
            SELECT season, last_scraped, source_url, video_url 
            FROM runway_cache_meta 
            WHERE designer = ? AND season = ?
        """, (designer_slug, season_name))
        meta = cursor.fetchone()
        if not meta:
            return None, None
            
        # 查詢所有 looks 圖片
        cursor.execute("""
            SELECT season, look_number, image_url 
            FROM runway_looks 
            WHERE designer = ? AND season = ? 
            ORDER BY look_number ASC
        """, (designer_slug, season_name))
        rows = cursor.fetchall()
        
        looks = []
        for r in rows:
            looks.append({
                "designer": designer_slug,
                "season": r["season"],
                "look_number": r["look_number"],
                "image_url": r["image_url"]
            })
        return looks, dict(meta)
    except Exception as e:
        print(f"❌ [快取] 讀取本地季度快取失敗: {e}")
        return None, None
    finally:
        conn.close()

def save_looks_to_cache(designer_slug, season_name, looks, source_url=None, video_url=None):
    """
    將特定季度的 Looks 寫入本地 SQLite 快取，並更新快取元數據表
    """
    if not looks:
        return
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 1. 僅刪除該設計師該季度的舊 looks 數據快取
        cursor.execute("""
            DELETE FROM runway_looks 
            WHERE designer = ? AND season = ?
        """, (designer_slug, season_name))
        
        # 2. 批次寫入新 looks 圖片
        insert_data = [
            (designer_slug, l["season"], l["look_number"], l["image_url"])
            for l in looks
        ]
        cursor.executemany("""
            INSERT INTO runway_looks (designer, season, look_number, image_url)
            VALUES (?, ?, ?, ?)
        """, insert_data)
        
        # 3. 插入或更新特定季度的快取元數據 (複合主鍵自動覆蓋，包含外部與影音網址)
        now_ts = int(time.time())
        cursor.execute("""
            INSERT OR REPLACE INTO runway_cache_meta (designer, season, last_scraped, source_url, video_url)
            VALUES (?, ?, ?, ?, ?)
        """, (designer_slug, season_name, now_ts, source_url, video_url))
        
        conn.commit()
        print(f"💾 [快取] 成功為 '{designer_slug}' 季度 '{season_name}' 寫入 {len(looks)} 筆 Looks 快取 (影音: {video_url})。")
    except Exception as e:
        print(f"❌ [快取] 寫入本地 SQLite 季度快取失敗: {e}")
        conn.rollback()
    finally:
        conn.close()

def get_looks_with_cache(designer_name, target_season=None):
    """
    API 統一呼叫接口：獲取設計師的季度列表與 Looks 詳情 (支援特定季度加載與快取)
    無論何種情境，均統一回傳包含 seasons, looks, season, source_url, video_url 的字典結構
    """
    designer_slug = slugify_designer(designer_name)
    if not designer_slug:
        print("⚠️ [快取] 輸入的設計師名稱無效，跳過處理")
        return None

    # --- 情境一：未指定特定季度 (初次載入品牌) ---
    if not target_season:
        # A. 嘗試從本地資料庫讀取已快取的季度列表
        seasons = get_designer_cached_seasons(designer_slug)
        
        # B. 如果本地無快取，則爬取首頁並初始化
        if not seasons:
            seasons = fetch_designer_seasons_from_vogue(designer_slug)
            
        if not seasons:
            print(f"❌ [快取] 無法獲取設計師 '{designer_slug}' 的任何季度列表")
            return None
            
        # 預設以最新一個季度（列表的第一個元素，通常為最新的年度季度）作為目標
        latest_season = seasons[0]["season_name"]
        
        # C. 遞迴呼叫加載該季度的 Looks 詳情與影音元數據
        looks_result = get_looks_with_cache(designer_name, target_season=latest_season)
        
        looks = looks_result.get("looks", []) if looks_result else []
        source_url = looks_result.get("source_url", "") if looks_result else ""
        video_url = looks_result.get("video_url", "") if looks_result else ""
        
        return {
            "seasons": seasons,
            "looks": looks,
            "season": latest_season,
            "source_url": source_url,
            "video_url": video_url
        }

    # --- 情境二：指定特定季度 (Timeline 時光機切換) ---
    # 1. 嘗試獲取本地季度快取
    cached_looks, meta = get_cached_looks(designer_slug, target_season)
    now = int(time.time())
    
    # 2. 判斷快取是否有效
    if cached_looks and meta:
        age = now - meta["last_scraped"]
        if age < DEFAULT_CACHE_EXPIRY:
            print(f"⚡ [快取] 成功命中有效季度快取！設計師: '{designer_slug}' 季度: '{target_season}'")
            return {
                "looks": cached_looks,
                "season": target_season,
                "source_url": meta.get("source_url", ""),
                "video_url": meta.get("video_url", "")
            }
        else:
            print(f"⏳ [快取] 季度快取已過期 (年齡: {age} 秒)，即將發起重新爬取...")
    else:
        print(f"❄️ [快取] 本地無 '{designer_slug}' 季度 '{target_season}' 的快取記錄，即將發起重新爬取...")
 
    # 3. 嘗試讀取該季度的相對 URL
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT season_url 
        FROM runway_designer_seasons 
        WHERE designer = ? AND season = ?
    """, (designer_slug, target_season))
    row = cursor.fetchone()
    conn.close()
    
    season_url = row["season_url"] if row else None
    
    # 若本地關聯表中找不到該季度 URL，先重刷首頁列表獲取 URL
    if not season_url:
        print(f"⚠️ [快取] 本地無季度 '{target_season}' 的 URL 快取，正在重刷首頁列表...")
        seasons = fetch_designer_seasons_from_vogue(designer_slug)
        for s in seasons:
            if s["season_name"].lower() == target_season.lower():
                season_url = s["url"]
                break

    full_url = f"https://www.vogue.com{season_url}" if season_url and season_url.startswith('/') else (season_url or "")

    # 4. 發起即時爬取
    if season_url:
        fresh_looks, video_url = fetch_runway_looks_from_vogue(designer_slug, target_season, season_url)
        if fresh_looks is not None:
            save_looks_to_cache(designer_slug, target_season, fresh_looks, source_url=full_url, video_url=video_url)
            return {
                "looks": fresh_looks,
                "season": target_season,
                "source_url": full_url,
                "video_url": video_url or ""
            }
 
    # 5. 【容錯降級機制】如果爬取失敗，嘗試回傳本地過期快取作為保底
    if cached_looks and meta:
        print(f"⚠️ [容錯降級] 季度爬取失敗，自動觸發降級機制，回傳過期快取！")
        return {
            "looks": cached_looks,
            "season": target_season,
            "source_url": meta.get("source_url", ""),
            "video_url": meta.get("video_url", "")
        }
        
    print(f"❌ [快取] 爬取失敗且無任何季度快取可供降級，設計師: '{designer_slug}' 季度: '{target_season}'")
    return None
