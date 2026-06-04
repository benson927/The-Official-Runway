# THE SILENT ARCHIVE (COP.VISION)

```text
========================================================================
[ IDENTITY ] 一個專門用於高階時裝策展的私人數位金庫與 Oracle AI 視覺解析引擎。
"The future isn't analog, Andrea. It's archived."
========================================================================
```

本系統專為**純桌面端 (Desktop-only) 高階生產力工作站**設計。為了在寬螢幕下追求極致的畫冊排版、流暢的物理動效與無干擾的專業工作環境，系統廢除了一切響應式妥協與移動端適配，僅在寬螢幕桌上型裝置中呈現完整的先鋒視覺。

---

## 🎥 系統演示錄影 (System Demo Video)

本專案包含了一段由開發者 **Benson** 親自錄製的操作演示影片。如果您是在 GitHub 網頁上閱讀此專案，可以直接在下方播放：

https://github.com/benson927/The-Official-Runway/raw/main/Runway_record_show-1.mp4

*(註：若您是在本地端閱讀 Markdown，可以直接點擊連結播放此 [Runway_record_show-1.mp4](file:///Users/bensonhong/Desktop/Antigravity專案/Runway(行動平台期末個人)/Runway_record_show-1.mp4) 本地影片檔案)*

---

## 🏛 核心系統架構 (Architecture)

系統採用高階**非對稱式雙核架獲**，將實時秀場爬蟲、本地極速快取、雲端多端同步與 AI 識讀融為一體：

* **前端工作站 (Frontend)**: React 19 + Vite 框架，搭配 Tailwind CSS（採用極簡無圓角設計，強調 Brutalist 粗獷主義的剛硬線條）。
* **物理與動畫引擎 (Animation)**: 導入 GSAP 3 核心動畫引擎與 `@gsap/react` 規範，負責暗房顯影、高奢進退場、時間軸平滑定位及流體網格物理推擠。
* **後端微服務 (Backend)**: Python 3 與 Flask 輕量化微服務，整合實時 Vogue Runway 爬蟲系統、防錯網址解析與走走錄影安全映射。
* **雙核心資料庫 (Database)**:
  * **本地快取層**：SQLite 雙表資料庫結構（負責緩存時裝 Looks 與季度 Metadata，保證 0.1 秒極速冷啟動）。
  * **雲端同步層**：Supabase PostgreSQL 關係型資料庫，採用原生 `TEXT[]` 陣列進行跨裝置無縫雙向即時同步。
* **AI 視覺大腦 (Oracle Vision)**: 多模態視覺模型（Gemini 1.5 Flash / GPT-4o-mini），提供時裝圖像的面料材質、剪裁廓形、色彩美學與歷史歸檔標籤的自動化深度解析。

---

## ⚡ V8.7 最新優化與核心版本 (Core Updates)

在本版本中，我們針對**時裝策展流程**與**全站視覺美學**進行了重磅升級：

### 1. 🖤 消光暗黑模式 (Noir Mode / Dark Mode)
* 頂部導覽列提供一鍵主題切換按鈕 `[ NOIR_ ]` / `[ LIGHT_ ]`。
* 於 `body` 與各大容器添加全局 `transition-colors duration-500`。點擊時，全站背景於淺灰與消光深黑 `#0A0A0A` 之間平滑過渡，文字與邊框細部完美適配，消除瞬間閃爍。
* 使用 `localStorage` 對偏好設定進行持久化記憶，在重新整理或再次進入時自動復原。

### 📄 2. 提案編輯畫冊導出 (Editorial Export)
* 私人金庫頂部配置極簡 `[ EXPORT BOOK ]` 文字按鈕。
* 點擊時動態寫入包含 Google Fonts (Playfair Display & Inter) 的 Brutalist 雙欄排版 HTML 頁面，並自動喚起瀏覽器原生列印視窗，支援一鍵導出為高解析度時裝提案 PDF。

### 🔀 3. 自由情緒板拖拽排序 (Drag-to-Layout)
* 情緒板卡片支援 HTML5 原生 Drag-and-Drop 拖放重排。
* 導入自適應排序演算法，即使在特定 `#TAG` 篩選視角下拖拽，其他卡片位置也會自適應保留。排序結果即時備份至 `localStorage` 以防資料庫異步變更風險，並實作載入排序自癒機制。

### 4. ⛩ 門禁雙開拉幕與 Toast 彈性 (The Shutter Portal & Toast)
* **拉幕動畫**：解鎖時中央密碼框淡出，左右閘門以 `power4.inOut` 平滑拉開。
* **Brutalist Toast**：移除圓角採用銳利直角 (`rounded-none`)，並以 `back.out(1.5)` 帶有彈性的 GSAP 曲線滑入。

### 5. 🌀 物理推擠效能防禦 (Layout Thrashing Prevention)
* 預先計算並快取圖片中心點，彻底消除 `pointermove` 中高頻呼叫 `getBoundingClientRect()` 導致的 Layout Reflow 性能瓶頸，幀率穩鎖 **60/120fps**。

---

## 📋 系統運行協議 (Protocols)

* **Folderless Vault (無資料夾金庫)**: 放棄傳統資料夾分級，回歸以 `#TAG` 標籤過濾為核心的平面檢索邏輯，搭配標籤自癒守護（自動回退至 `ALL`）。
* **Full-Bleed Canvas (滿版畫布)**: 全局導覽樞紐（The Global Toggle）一鍵切換 `[ RUNWAY ]` / `[ THE VAULT ]`，並在切換時執行 `300ms` 的畫廊級燈光交疊 cross-fade 動效（CLS = 0）。
* **The Darkroom Reveal (暗房顯影)**: 卡片出場時，經歷 `cubic-bezier(0.16, 1, 0.3, 1)` 曲線的漸進顯影與光學對焦效果。
* **The Margelia Spec (邊緣特刊)**: 僅在特定品牌（如 Prada）頁面激活，於 Runway 底部呈現橫向極淡字句與紅色緩慢呼吸圓點（Devil's Pulse），取代喧鬧的傳統背景。

---

## ⚙️ 環境配置與部署 (Initialization)

在開始部署之前，請複製專案根目錄的 `.env.example` 並將其命名為 `.env`，設定以下參數：

```env
# 門禁解鎖密碼 (預設為 BENSON，解鎖後可在網頁頂部隨時自行修改)
VITE_VAULT_PASSCODE=BENSON

# 雲端同步
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# AI 視覺解析
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# 後端服務，可省略使用預設值
FLASK_HOST=127.0.0.1
FLASK_PORT=5001
FLASK_DEBUG=false
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> [!TIP]
> **關於金庫門禁密碼自定義修改**：
> * **預設密碼**：`.env` 中的 `VITE_VAULT_PASSCODE` 為金庫的初始預設解鎖密碼。
> * **線上即時修改**：成功解鎖進入金庫工作站後，您可以隨時點擊頂部導覽列右側的 `[ SET KEY ]` 按鈕，直接輸入您期望的新密碼並按下 Enter。
> * **安全持久化與優先級**：您自定義的新密碼將會被安全地儲存在您本地瀏覽器的 `localStorage` 中。系統在未來進行安全驗證解鎖時，會**優先比對**您自訂的密碼；若無自訂密碼，才會降級比對 `.env` 設定檔中的密碼。這使您免於頻繁修改與暴露設定檔。

---

## 🚀 專案啟動序列

### 1. 啟動後端服務
後端服務啟動時將載入 The Silent CLI 規範，自動輸出當前的 SQLite 快取狀態與 API 端點：
```bash
python3 backend/app.py
```
* 後端預設運行端點：`http://127.0.0.1:5001`

### 2. 啟動前端工作站
進入前端目錄並啟動 Vite 開發伺服器：
```bash
cd frontend && npm run dev
```
* 前端工作站訪問網址：`http://localhost:5173/`

---
* 走查報告與詳細修改細節：[walkthrough.md](./walkthrough.md)

---

## ⚖️ 著作權與合理使用聲明 (Copyright & Fair Use Disclaimer)

本系統為私人時裝策展工作站，在展示與獲取時裝秀場圖片時，遵循以下著作權協議：

* **系統開發權利**：本 `THE SILENT ARCHIVE` 時裝金庫系統、實時 Vogue Runway 秀場爬蟲微服務與前端 3D 物理推擠渲染代碼，皆由 **Benson** 獨立設計與開發，保留所有軟體著作權。
* **非商業個人研究**：本系統僅供個人學術研究、時裝廓形分析、內部提案草案（Moodboard）之目的使用，不含任何商業營利行為。符合著作權法中關於「合理使用 (Fair Use)」的規範。
* **版權歸屬**：所有秀場圖片與時裝 Looks 之著作權與版權均歸屬於 **GoRunway**、**Vogue Runway**、原攝影師以及各大時裝屋（Fashion Houses）所有。
* **導出標記**：當點擊 `[ EXPORT BOOK ]` 導出提案畫冊時，系統會自動在頁面註腳標記為 `THE SILENT ARCHIVE WORKSTATION DEVELOPED BY BENSON // FOR PERSONAL/INTERNAL EDITORIAL PRESENTATION ONLY`，以維護原作者版權、系統開發者著作權與學術引用規範。
