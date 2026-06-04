# app.py — V5.6 (The Silent Archive)
# -*- coding: utf-8 -*-

import os
import sys

# 解決當後端在背景或無終端（stdout關閉）運行時，呼叫 print() 會引發 OSError: [Errno 5] Input/output error 的問題
class SafeWriter:
    def __init__(self, original_stream):
        self.original_stream = original_stream

    def write(self, data):
        try:
            if self.original_stream:
                self.original_stream.write(data)
        except OSError:
            pass

    def flush(self):
        try:
            if self.original_stream:
                self.original_stream.flush()
        except OSError:
            pass

sys.stdout = SafeWriter(sys.stdout)
sys.stderr = SafeWriter(sys.stderr)

import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import scraper_vogue

# 禁用 Flask 預設 Werkzeug 雜訊 (The Silent CLI)
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# 載入環境變數
load_dotenv()

app = Flask(__name__)

def get_bool_env(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}

# 允許跨網域請求，以便前端 React 順暢通訊；部署時可用 CORS_ORIGINS 逗號分隔限制來源。
cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
CORS(app, resources={r"/api/*": {"origins": cors_origins}})

# ==================================================
# 核心 Vogue Runway 策展 API (V5.6)
# ==================================================

@app.route('/api/runway-looks', methods=['GET'])
def get_runway_looks_api():
    """
    獲取特定設計師 Vogue Runway 所有秀圖與資訊 (V5.6 秀場動態連結)
    支援：
    1. 傳入 `&season=`：精確加載並快取特定季度 Looks。
    2. 未傳 `&season=`：初次加載品牌，一次性回傳 2025-2026 季度列表與預設最新一季 Looks。
    (含本地 SQLite 雙表複合快取與自動容錯降級機制，且回傳頂層 source_url 與 video_url 元數據)
    """
    designer = request.args.get('designer', '').strip()
    season = request.args.get('season', '').strip() or None
    
    if not designer:
        return jsonify({"error": "缺少設計師名稱 (designer)"}), 400
        
    try:
        result = scraper_vogue.get_looks_with_cache(designer, target_season=season)
        if result is None:
            return jsonify({"error": f"無法獲取設計師 '{designer}' 的秀場資料，請檢查名稱是否正確或稍後再試"}), 500
            
        # 統一回傳包含 seasons, looks, season, source_url, video_url 的 dict 結構
        return jsonify({
            "designer": scraper_vogue.slugify_designer(designer),
            "season": result.get("season", "未知季度"),
            "seasons": result.get("seasons", []),
            "total_looks": len(result.get("looks", [])),
            "looks": result.get("looks", []),
            "source_url": result.get("source_url", ""),
            "video_url": result.get("video_url", "")
        }), 200
    except Exception as e:
        print(f"❌ [API] 獲取時光機季度秀場出錯: {e}")
        return jsonify({"error": f"伺服器內部錯誤: {str(e)}"}), 500

@app.route('/api/oracle-analyze', methods=['POST'])
def oracle_analyze_api():
    """
    V7.0 Oracle Vision AI 視覺解析端點
    接收 JSON body: {"image_url": "..."}
    回傳 AI 標籤清單: {"tags": ["DECONSTRUCTED_HEM", "HEAVYWEIGHT_WOOL"]}
    """
    data = request.get_json() or {}
    image_url = data.get("image_url", "").strip()
    
    if not image_url:
        return jsonify({"error": "缺少圖片連結 (image_url)"}), 400
        
    import oracle
    
    # 遵循 The Silent CLI 規範印出消光灰色標頭日誌
    print(f"\033[90m[ ORACLE ]\033[0m  ANALYZING IMAGE DETAILED SILHOUETTE...")
    
    try:
        tags = oracle.analyze_fashion_image(image_url)
        print(f"\033[90m[ ORACLE ]\033[0m  ANALYSIS COMPLETE // TAGS: {tags}")
        return jsonify({"tags": tags}), 200
    except Exception as e:
        print(f"❌ [ORACLE] 視覺解析出錯: {e}")
        return jsonify({"error": f"視覺引擎解析失敗: {str(e)}"}), 500

# 404 容錯處理：針對所有已被大掃除廢棄的二手市場 API，一律優雅回傳 404
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "DEPRECATED ENDPOINT: This V4 auction monitor endpoint has been permanently purged in V5.6."}), 404

if __name__ == '__main__':
    host = os.environ.get("FLASK_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_PORT", "5001"))
    debug = get_bool_env("FLASK_DEBUG", False)

    print("\033[90m[ SYSTEM ]\033[0m  LEGACY MODULES PURGED.")
    print("\033[90m[ SYSTEM ]\033[0m  ORACLE VISION ENGINE ONLINE.")
    print(f"\033[90m[ SERVER ]\033[0m  THE SILENT ARCHIVE // {host}:{port} ONLINE.")
    app.run(debug=debug, use_reloader=False, host=host, port=port)
