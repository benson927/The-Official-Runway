import requests
from bs4 import BeautifulSoup
import json

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def test_margiela():
    # 測試 maison-martin-margiela
    url = "https://www.vogue.com/fashion-shows/designer/maison-martin-margiela"
    print(f"Fetching {url}...")
    r = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(r.text, 'html.parser')
    js_data = None
    for script in soup.find_all('script'):
        if script.string and 'window.__PRELOADED_STATE__' in script.string:
            try:
                js_clean = script.string.split(' = ', 1)[1]
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
            except Exception as e:
                pass
            break
            
    if js_data and 'transformed' in js_data:
        content = js_data['transformed'].get('runwayDesignerContent', {})
        print("Keys in runwayDesignerContent:", list(content.keys()) if content else "None")
        if content:
            collections = content.get('designerCollections', [])
            print("designerCollections size:", len(collections))
            if collections:
                print("Latest Collection:")
                print(json.dumps(collections[0], indent=2, ensure_ascii=False))

if __name__ == '__main__':
    test_margiela()
