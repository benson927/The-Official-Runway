# THE SILENT ARCHIVE (COP.VISION)

```text
========================================================================
[ IDENTITY ] 一個專門用於高階時裝策展的私人數位金庫與 Oracle AI 視覺解析引擎。
"The future isn't analog, Andrea. It's archived."
========================================================================
```

本系統專為**純桌面端 (Desktop-only) 高階生產力工作站**設計。為了在寬螢幕下追求極致的畫冊排版、流暢的物理動效與無干擾的專業工作環境，系統廢除了一切響應式妥協與移動端適配，僅在寬螢幕桌上型裝置中呈現完整的先鋒視覺。

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

## ⚡ V8.1 最新優化與自訂密碼 (Core Updates)

在 V8.0 中，我們針對**高奢視覺張力**與**渲染效能防禦**進行了重磅升級：

### 1. ⛩ 金庫雙開大門拉幕解鎖 (The Shutter Portal)
* 門禁解鎖面板背景拆分為左右兩扇消光灰（`#F5F5F5`）閘門。
* 輸入正確密碼時，密碼框淡出，左右大門以 `power4.inOut` 緩動平滑拉開，營造開啟實體時裝金庫的沉浸感與儀式感。

### 2. 🎞 Toast 彈性動效與 Brutalist 去圓角 (The Editorial Toast)
* 去除原本的 `rounded-2xl`，改為俐落的 **Brutalist 銳利直角 (`rounded-none`)**。
* 採用 GSAP 的 `back.out(1.5)` 緩動曲線，使 Toast 提示從螢幕下方滑入時帶有優雅的物理阻尼彈性。

### 3. ⏱ 季度時間軸平滑定位 (Timeline ScrollTo)
* 季度時間軸新增選中狀態偵測，當切換品牌或季度時，GSAP 自動平滑地將所選刻度滾動至時間軸正中央，提供極佳的段落物理回饋。

### 4. 🌀 流體網格物理推擠防禦 (Layout Thrashing Prevention)
* **效能重構**：預先計算並快取時裝卡片相對於 `document` 的中心點座標，完全避免在 `pointermove` 中高頻呼叫 `getBoundingClientRect()`。
* 在滑鼠滑過數十張大圖時，消除 Reflow 性能瓶頸，高畫質大螢幕下幀率穩鎖 **60/120fps**。

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
# 門禁解鎖密碼
VITE_VAULT_PASSCODE=BENSON

# 雲端同步
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# AI 視覺解析
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

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
