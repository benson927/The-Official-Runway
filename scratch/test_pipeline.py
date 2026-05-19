# -*- coding: utf-8 -*-
import sys
import os
import time
import sqlite3

# 將 backend 目錄加入 python 模組路徑，以便引入 scraper_vogue
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
import scraper_vogue

def run_test():
    print("==================================================")
    print("🚀 [測試開始] 啟動 Vogue Runway 數據管線測試")
    print("==================================================")

    # 目標設計師清單
    designers = ["kiko-kostadinov", "acne-studios", "maison-margiela"]

    # 1. 測試首次爬取與二次快取命中
    for designer in designers:
        print(f"\n--- 測試設計師: {designer} ---")
        
        # 1.1 首次爬取 (冷啟動)
        start_time = time.time()
        print(f"📥 [首次請求] 開始即時爬取 Vogue Runway...")
        looks_1 = scraper_vogue.get_looks_with_cache(designer)
        time_1 = time.time() - start_time
        
        if looks_1:
            print(f"✅ [成功] 首次爬取獲取了 {len(looks_1)} 個 Looks")
            print(f"⏱️ [耗時] {time_1:.2f} 秒 (包含真實網路請求)")
            print(f"🔎 [範例] 前 2 個 Looks: {looks_1[:2]}")
        else:
            print(f"❌ [失敗] 首次爬取未能獲取數據")
            continue

        # 1.2 二次請求 (應命中快取)
        start_time = time.time()
        print(f"📥 [二次請求] 開始讀取快取...")
        looks_2 = scraper_vogue.get_looks_with_cache(designer)
        time_2 = time.time() - start_time
        
        if looks_2 and len(looks_2) == len(looks_1):
            print(f"✅ [成功] 二次請求成功命中快取，Looks 數量一致")
            print(f"⏱️ [耗時] {time_2*1000:.2f} 毫秒 (極速快取讀取)")
            if time_2 * 1000 < 50:
                print("⚡ [效能達標] 快取讀取耗時遠低於 50 毫秒！")
        else:
            print(f"❌ [失敗] 二次請求快取未命中或數量不符")

    # 2. 測試極端狀況下的自動容錯降級機制 (網路中斷/IP封鎖)
    print("\n==================================================")
    print("⚙️ [容錯測試] 開始模擬網路故障下的自動降級機制")
    print("==================================================")

    test_designer = "acne-studios"
    print(f"\n1. 手動修改資料庫，將 '{test_designer}' 的快取時間標記為 10 天前已過期...")
    
    conn = sqlite3.connect(scraper_vogue.DB_PATH)
    cursor = conn.cursor()
    # 設置上次爬取時間戳為 10 天前 (864000 秒前)
    ten_days_ago = int(time.time()) - 10 * 86000
    cursor.execute("""
        UPDATE runway_cache_meta 
        SET last_scraped = ? 
        WHERE designer = ?
    """, (ten_days_ago, test_designer))
    conn.commit()
    conn.close()
    
    # 驗證快取確實過期 (此處讀取時會提示過期)
    print("2. 模擬網路中斷：手動 Mock 掉 requests.get 拋出錯誤...")
    import requests
    original_get = requests.get
    
    def mocked_get(*args, **kwargs):
        raise requests.exceptions.ConnectionError("模擬網路中斷錯誤：連線超時，無法解析 vogue.com")
        
    requests.get = mocked_get

    try:
        print(f"3. 發起 '{test_designer}' 請求 (此時快取已過期且網路中斷)...")
        looks_fallback = scraper_vogue.get_looks_with_cache(test_designer)
        
        if looks_fallback:
            print(f"✅ [成功] 系統成功觸發【自動容錯降級機制】！")
            print(f"🛡️  成功回傳了歷史過期快取的 {len(looks_fallback)} 個 Looks，確保服務未中斷！")
        else:
            print("❌ [失敗] 系統未能成功降級回傳過期快取")
    except Exception as e:
        print(f"❌ [失敗] 系統拋出未捕獲的異常: {e}")
    finally:
        # 恢復 requests.get 供後續測試
        requests.get = original_get

    print("\n==================================================")
    print("🎉 [測試結束] 所有 Vogue Runway 數據管線測試完成！")
    print("==================================================")

if __name__ == '__main__':
    run_test()
