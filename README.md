# THE SILENT ARCHIVE

[ IDENTITY ]
---
一個專門用於高階時裝策展的私人金庫與 Oracle AI 視覺引擎。
"The future isn't analog, it's archived."

本系統專為純桌面端（Desktop-only）高階生產力工作站設計。為了追求大螢幕下的極致排版、物理流暢度與無干擾的專業工作環境，本系統廢除一切響應式妥協與移動端適配，僅在寬螢幕桌上型裝置中呈現完整視覺。


[ ARCHITECTURE ]
---
系統採用高階非對稱式架構，將實時爬蟲、本地快取與雲端同步相結合：

- **Frontend**: React + Vite 框架，搭配 Tailwind CSS（採用極簡無圓角設計，強調 Brutalist 的剛硬線條）。
- **Physics & Animation**: 導入 GSAP 3 核心動畫引擎與 `@gsap/react` 規範，負責 Runway 滿版網格的暗房顯影與流體網格物理推擠特效。
- **Backend & Crawler**: Python 3 與 Flask 輕量化微服務，整合實時 Vogue Runway 爬蟲系統、防錯網址解析與 YouTube 153 防拒絕播放安全映射。
- **Database (Dual-Core)**:
  - 本地快取層：SQLite 雙表資料庫結構（負責緩存時裝 Looks 與季度 Metadata，保證 0.1 秒極速冷啟動）。
  - 雲端同步層：Supabase PostgreSQL 關係型資料庫，採用原生 TEXT[] 陣列進行跨裝置無縫雙向即時同步。
- **AI Brain**: 多模態視覺模型（The Oracle Vision API），提供時裝圖像的面料材質、剪裁廓形、色彩美學與歷史歸檔標籤的自動化深度解析。


[ PROTOCOLS ]
---
系統運行的核心互動與架構協議如下：

- **Folderless Vault**: 放棄傳統資料夾與層級目錄結構，採用純粹的 `#TAG` 標籤過濾機制，搭配標籤自癒與自動化元數據排序。
- **Full-Bleed Canvas**: 廢除傳統的雙屏切割，採用全局狀態切換的滿版畫布系統（The Runway 季度展台 / The Vault 情緒情緒板）。
- **The Darkroom Reveal**: 摒棄生硬的常規載入，採用 GSAP 實作的骨牌式光學對焦與模糊淡入顯影動畫。
- **The Margelia Spec**: 隱晦的邊緣特刊語錄系統。僅在特定品牌頁面激活，於 Runway 最底部呈現橫向極淡字句與紅色緩慢呼吸圓點（Devil's Pulse），取代喧鬧的傳統背景。


[ INITIALIZATION ]
---
在開始部署之前，請複製專案根目錄的 `.env.example` 並將其命名為 `.env`，設定以下參數：
```env
# 門禁解鎖密碼
VITE_VAULT_PASSCODE=BENSON

# 雲端同步
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_KEY

# AI 視覺解析
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

依照以下序列啟動系統：

### 1. 啟動後端服務
後端服務啟動時將載入 The Silent CLI 規範，自動輸出當前的 SQLite 快取狀態與 API 端點：
```bash
python3 backend/app.py
```
- 後端預設運行端點：`http://127.0.0.1:5001`

### 2. 啟動前端工作站
進入前端目錄並啟動 Vite 開發伺服器：
```bash
cd frontend && npm run dev
```
- 前端工作站訪問網址：`http://localhost:5173/`

---
走查報告與詳細修改細節：[walkthrough.md](./walkthrough.md)
