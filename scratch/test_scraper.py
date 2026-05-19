import requests
from bs4 import BeautifulSoup
import json
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def extract_json_from_script(soup, key_fragment):
    for script in soup.find_all('script'):
        if script.string and key_fragment in script.string:
            js = script.string
            try:
                js_clean = js.split(' = ', 1)[1]
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
                print(f"Error parsing JSON: {e}")
                return None
    return None

def get_latest_season(designer):
    url = f"https://www.vogue.com/fashion-shows/designer/{designer}"
    print(f"🔍 Fetching designer home: {url}")
    r = requests.get(url, headers=HEADERS)
    if r.status_code != 200:
        print(f"❌ Failed to fetch designer: {r.status_code}")
        return None
        
    soup = BeautifulSoup(r.text, 'html.parser')
    data = extract_json_from_script(soup, 'window.__PRELOADED_STATE__')
    if not data:
        print("❌ Could not find window.__PRELOADED_STATE__ on designer page")
        return None
        
    try:
        collections = data['transformed']['runwayDesignerContent']['designerCollections']
        if not collections:
            print("❌ No collections found for designer")
            return None
        latest = collections[0]
        return {
            "season_name": latest.get("hed"),
            "url": latest.get("url")
        }
    except Exception as e:
        print(f"❌ Error parsing collections: {e}")
        return None

def get_runway_looks(designer, season_name, season_url):
    full_url = f"https://www.vogue.com{season_url}" if season_url.startswith('/') else season_url
    print(f"🔍 Fetching show page: {full_url}")
    r = requests.get(full_url, headers=HEADERS)
    if r.status_code != 200:
        print(f"❌ Failed to fetch show page: {r.status_code}")
        return None
        
    soup = BeautifulSoup(r.text, 'html.parser')
    data = extract_json_from_script(soup, 'window.__PRELOADED_STATE__')
    if not data:
        print("❌ Could not find window.__PRELOADED_STATE__ on show page")
        return None
        
    try:
        items = data['transformed']['runwayShowGalleries']['galleries'][0]['items']
        looks = []
        for item in items:
            caption = item.get("caption", "")
            # 從 "Look 1" 提取數字
            look_num_match = re.search(r'\d+', caption)
            look_number = int(look_num_match.group()) if look_num_match else 0
            
            # 獲取高畫質 url
            # 我們嘗試獲取 md 或是 lg，如果沒有，就用 sources 下的第一個有 url 的
            img_url = ""
            sources = item.get("image", {}).get("sources", {})
            if "md" in sources and "url" in sources["md"]:
                img_url = sources["md"]["url"]
            elif "lg" in sources and "url" in sources["lg"]:
                img_url = sources["lg"]["url"]
            else:
                # 遍歷 sources 尋找隨機 url
                for sz, src in sources.items():
                    if isinstance(src, dict) and "url" in src:
                        img_url = src["url"]
                        break
                        
            if img_url:
                looks.append({
                    "designer": designer,
                    "season": season_name,
                    "look_number": look_number,
                    "image_url": img_url
                })
        return looks
    except Exception as e:
        print(f"❌ Error parsing runway looks: {e}")
        return None

def main():
    designer = "kiko-kostadinov"
    latest = get_latest_season(designer)
    if latest:
        print(f"🎉 Latest season found: {latest['season_name']} (URL: {latest['url']})")
        looks = get_runway_looks(designer, latest['season_name'], latest['url'])
        if looks:
            print(f"✅ Successfully scraped {len(looks)} looks!")
            print("First 3 looks sample:")
            for l in looks[:3]:
                print(l)
        else:
            print("❌ Failed to scrape looks")
    else:
        print("❌ Failed to find latest season")

if __name__ == '__main__':
    main()
