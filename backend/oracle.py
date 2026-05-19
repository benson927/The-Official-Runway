# -*- coding: utf-8 -*-
# oracle.py — V7.0 (The Oracle Vision)

import os
import time
import random
import base64
import json
import requests
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

def get_mock_tags():
    """
    智能降級 Mock 模式：
    模擬 1.5 秒延遲以保證前端載入狀態（閃爍光標）充分展現。
    隨後回傳由時裝顧問預設的極簡專業時裝標籤。
    """
    time.sleep(1.5)
    fashion_tags = [
        "HEAVYWEIGHT_WOOL",
        "ASYMMETRIC_CUT",
        "DECONSTRUCTED_HEM",
        "OVERSIZED_SILHOUETTE",
        "RAW_EDGE_FINISH",
        "BOXY_FIT",
        "DRAPED_VISCOSE",
        "DOUBLE_BREASTED",
        "MINIMALIST_TAILORING",
        "CONTRAST_STITCHING",
        "TEXTURED_KNIT",
        "UTILITY_POCKETS"
    ]
    # 隨機挑選 3 到 5 個標籤
    num_tags = random.randint(3, 5)
    return random.sample(fashion_tags, num_tags)

def analyze_fashion_image(image_url):
    """
    核心 API 路由整合：
    優先檢測 GEMINI_API_KEY 使用 Gemini 1.5 Flash。
    次之檢測 OPENAI_API_KEY 使用 GPT-4o-mini。
    若無配置金鑰，優雅降級啟用 Mock 模擬解析。
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not gemini_key and not openai_key:
        print("\033[90m[ ORACLE ]\033[0m NO API KEY DETECTED. GRACEFULLY DOWNGRADING TO MOCK MODE.")
        return get_mock_tags()
        
    try:
        if gemini_key:
            return analyze_image_gemini(image_url, gemini_key)
        else:
            return analyze_image_openai(image_url, openai_key)
    except Exception as e:
        print(f"❌ [ORACLE] API 呼叫失敗 ({str(e)}). 自動降級為 Mock 模式保障運行。")
        return get_mock_tags()

def analyze_image_gemini(image_url, api_key):
    """
    使用 Google Gemini 1.5 Flash 進行 REST 視覺解析。
    """
    # 1. 抓取圖片二進位數據
    resp = requests.get(image_url, timeout=12)
    resp.raise_for_status()
    image_bytes = resp.content
    content_type = resp.headers.get("Content-Type", "image/jpeg")
    
    # 2. Base64 編碼
    b64_data = base64.b64encode(image_bytes).decode("utf-8")
    
    # 3. 呼叫 Gemini 1.5 Flash 服務
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    prompt = (
        "You are a high-end fashion archivist. Analyze the clothing in the image. "
        "Return exactly 3 to 5 highly professional technical tags describing the fabric, cut, or silhouette. "
        "Format strictly as a JSON list of strings, uppercase with underscores. "
        "Example: [\"DECONSTRUCTED_HEM\", \"HEAVYWEIGHT_WOOL\", \"ASYMMETRIC_CUT\"]. "
        "Do not output any other text."
    )
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": content_type,
                            "data": b64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=20)
    response.raise_for_status()
    result = response.json()
    
    # 4. 解析回傳 JSON
    try:
        text_content = result["candidates"][0]["content"]["parts"][0]["text"]
        tags = json.loads(text_content.strip())
        if isinstance(tags, list):
            return [str(t).strip().upper().replace(" ", "_") for t in tags]
    except Exception as parse_err:
        print(f"❌ [ORACLE] Gemini JSON 解析出錯: {parse_err}. 原始內容: {result}")
        
    raise ValueError("Failed to parse correct tags from Gemini response")

def analyze_image_openai(image_url, api_key):
    """
    使用 OpenAI GPT-4o-mini 進行 REST 視覺解析。
    """
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    prompt = (
        "You are a high-end fashion archivist. Analyze the clothing in the image. "
        "Return exactly 3 to 5 highly professional technical tags describing the fabric, cut, or silhouette. "
        "Format strictly as a JSON list of strings, uppercase with underscores. "
        "Example: [\"DECONSTRUCTED_HEM\", \"HEAVYWEIGHT_WOOL\", \"ASYMMETRIC_CUT\"]. "
        "Do not output any other text."
    )
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }
        ],
        "response_format": {"type": "json_object"}
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=20)
    response.raise_for_status()
    result = response.json()
    
    # 解析回傳 JSON
    try:
        text_content = result["choices"][0]["message"]["content"]
        data = json.loads(text_content.strip())
        tags = []
        if isinstance(data, list):
            tags = data
        elif isinstance(data, dict):
            tags = data.get("tags", list(data.values())[0])
            
        if isinstance(tags, list):
            return [str(t).strip().upper().replace(" ", "_") for t in tags]
    except Exception as parse_err:
        print(f"❌ [ORACLE] OpenAI JSON 解析出錯: {parse_err}. 原始內容: {result}")
        
    raise ValueError("Failed to parse correct tags from OpenAI response")
