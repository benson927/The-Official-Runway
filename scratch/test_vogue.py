import requests
from bs4 import BeautifulSoup
import json
import re

def test():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    # 我們剛剛知道最新季度的 url 是 /fashion-shows/fall-2026-ready-to-wear/kiko-kostadinov
    # 我們來請求這個 URL
    url = "https://www.vogue.com/fashion-shows/fall-2026-ready-to-wear/kiko-kostadinov"
    print(f"Fetching show page {url}...")
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        print(f"Failed to fetch show page: status {r.status_code}")
        return

    soup = BeautifulSoup(r.text, 'html.parser')
    
    js_data = None
    found_key = ""
    # 尋找 __PRELOADED_STATE__ 或是 runwayShowGalleries 或是其他的 script 內容
    for script in soup.find_all('script'):
        if script.string:
            if '__PRELOADED_STATE__' in script.string:
                found_key = "__PRELOADED_STATE__"
                js = script.string
                break
            elif 'runwayShowGalleries' in script.string:
                found_key = "runwayShowGalleries"
                js = script.string
                break
                
    if not found_key:
        print("Could not find any suitable script tag.")
        return
        
    print(f"Found script tag containing: {found_key}")
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
        js_data = json.loads(js_clean)
        print("Successfully parsed JSON.")
    except Exception as e:
        print("Error parsing JSON:", e)
        return

    # 搜尋 "runwayShowGalleries" 或是 "galleries" 或是 "items" 或 "images" 的位置
    def search_key(d, path=""):
        if isinstance(d, dict):
            for k, v in d.items():
                new_path = f"{path} -> {k}" if path else k
                if "runwayShowGalleries" in k or "galleries" in k or "items" in k or "photos" in k.lower():
                    print(f"Found match: {new_path}")
                search_key(v, new_path)
        elif isinstance(d, list):
            for i, item in enumerate(d):
                search_key(item, f"{path}[{i}]")

    search_key(js_data)

    # 看看 transformed 裡面有些什麼
    if 'transformed' in js_data:
        print("Keys in transformed:")
        print(list(js_data['transformed'].keys()))
        
        gallery_keys = [k for k in js_data['transformed'].keys() if 'gallery' in k.lower() or 'show' in k.lower() or 'runway' in k.lower()]
        print("Gallery/Show keys in transformed:", gallery_keys)
        
        for k in gallery_keys:
            val = js_data['transformed'][k]
            if isinstance(val, dict):
                print(f"Subkeys of transformed[{k}]: {list(val.keys())}")
                if 'galleries' in val:
                    print("Found galleries in subkey!")
                    galleries = val['galleries']
                    print(f"Galleries type: {type(galleries)}, length: {len(galleries)}")
                    # 檢查 galleries[0] 的 key 
                    if isinstance(galleries, list) and len(galleries) > 0:
                        first_gallery = galleries[0]
                        print("First gallery keys:", list(first_gallery.keys()) if isinstance(first_gallery, dict) else type(first_gallery))
                        if isinstance(first_gallery, dict) and 'items' in first_gallery:
                            items = first_gallery['items']
                            print(f"Found items! Size: {len(items)}")
                            if items:
                                print("Sample item structure:")
                                print(json.dumps(items[0], indent=2, ensure_ascii=False)[:1500])

if __name__ == '__main__':
    test()
