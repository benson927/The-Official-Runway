import os
import sys
import requests
from dotenv import load_dotenv
from datetime import datetime

# 載入環境變數
load_dotenv()

def print_status(component, status, message=""):
    color = "\033[92m[PASS]\033[0m" if status else "\033[91m[FAIL]\033[0m"
    print(f"{color} {component:<25} : {message}")

def audit_system():
    print(f"\n🚀 COP.VISION 系統全功能排查 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    # 1. 檢查環境變數
    env_vars = ["SUPABASE_URL", "SUPABASE_KEY", "DISCORD_WEBHOOK_URL"]
    all_env_ok = True
    for var in env_vars:
        if not os.getenv(var):
            print_status(f"Env: {var}", False, "Missing in .env")
            all_env_ok = False
        else:
            print_status(f"Env: {var}", True, "Defined")
    
    if not all_env_ok:
        print("\n❌ 環境變數缺失，請檢查 .env 檔案！")
        return

    # 2. 檢查 Supabase 連線
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        supabase = create_client(url, key)
        res = supabase.table("brands").select("count", count="exact").limit(1).execute()
        print_status("Supabase Connection", True, f"Found {res.count} brands in database")
    except Exception as e:
        print_status("Supabase Connection", False, str(e))

    # 3. 檢查 Fruitsfamily GraphQL API
    try:
        url = "https://web-server.production.fruitsfamily.com/graphql"
        headers = {"Content-Type": "application/json"}
        query = "query seeProducts { seeProducts(limit: 1) { id title status } }"
        res = requests.post(url, json={"query": query}, timeout=10)
        if res.ok:
            data = res.json().get("data", {}).get("seeProducts", [])
            if data:
                print_status("Fruitsfamily API", True, f"Online (Test Item: {data[0]['title']})")
                print_status("Sold Detection Logic", True, f"Status Field: {data[0]['status']}")
            else:
                print_status("Fruitsfamily API", True, "Online but empty response")
        else:
            print_status("Fruitsfamily API", False, f"HTTP {res.status_code}")
    except Exception as e:
        print_status("Fruitsfamily API", False, str(e))

    # 4. 檢查匯率 API
    try:
        res = requests.get("https://open.er-api.com/v6/latest/KRW", timeout=10)
        if res.ok:
            print_status("Exchange Rate API", True, "Online")
        else:
            print_status("Exchange Rate API", False, f"HTTP {res.status_code}")
    except Exception as e:
        print_status("Exchange Rate API", False, str(e))

    # 5. 檢查 Discord Webhook (僅發送測試，不驗證)
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if webhook_url:
        print_status("Discord Webhook", True, "URL Configured")
    
    print("="*60)
    print("✅ 排查完成！請根據上述結果修復問題。")
    print("啟動主程式請執行: python3 app.py\n")

if __name__ == "__main__":
    audit_system()
