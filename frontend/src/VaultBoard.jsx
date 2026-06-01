import React, { useState, useEffect } from 'react';
import VaultCard from './VaultCard';

/**
 * VaultBoard — 私人時裝策展情緒板組件 (V5.2 - 極簡標籤與過濾系統)
 * 
 * 核心特色：
 * 1. 【動態標籤提取】：動態從所有已收藏的時裝 Looks 之中，收集已使用的不重複 Hashtags，排序生成篩選標籤。
 * 2. 【極簡過濾列】：頂部配置純文字 Tag Filter Bar。標籤格式遵循 Inter、全大寫、字距極寬。
 *    當選中時呈現黑色並附帶精細底線，未選中為優雅淡灰，Hover 高亮。點擊已選標籤可即時重置為 ALL 展示。
 * 3. 【瞬間過濾】：點擊標籤時，情緒板瞬間過濾 Looks 數據，並以錯落瀑布流渲染。
 * 4. 【元件解耦】：將收藏卡片渲染解耦至 `<VaultCard />` 組件，健全代碼架構。
 */
const VaultBoard = ({ 
  archivedLooks = [], 
  onRemoveLook, 
  onUpdateTags, 
  onUpdateNote, 
  onCurateExamples, // ✦ V8.4 一鍵載入策展範例
  onReorderLooks,   // ✦ V8.6 拖拽重排回呼
  analyzingIds = new Set(),
  activeView = 'runway'
}) => {
  const [activeFilterTag, setActiveFilterTag] = useState('ALL');
  const [draggedIndex, setDraggedIndex] = useState(null);

  // ✦ V8.6 畫冊列印導出 HTML 生成與觸發
  const handleExportEditorialBook = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("請允許彈出視窗以匯出時裝畫冊。");
      return;
    }

    const looksHtml = filteredLooks.map(look => {
      const displayTags = (look.tags || []).filter(t => !t.startsWith('✦')).map(t => `#${t}`).join(' ');
      const noteHtml = look.note ? `<p class="note">${look.note}</p>` : '';
      return `
        <div class="look-card">
          <div class="image-wrapper">
            <img src="${look.image_url}" alt="時裝 Look" />
          </div>
          <div class="meta">
            <div class="row">
              <span class="designer">${look.designer.replace(/-/g, ' ').toUpperCase()}</span>
              <span class="look-num">LOOK ${look.look_number}</span>
            </div>
            <div class="season">${look.season.toUpperCase()}</div>
            ${displayTags ? `<div class="tags">${displayTags}</div>` : ''}
            ${noteHtml}
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>THE SILENT ARCHIVE // EDITORIAL BOOK</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            background-color: #ffffff;
            color: #000000;
            margin: 0;
            padding: 40px;
            -webkit-print-color-adjust: exact;
          }
          header {
            border-bottom: 2px solid #000000;
            padding-bottom: 15px;
            margin-bottom: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 0.05em;
            margin: 0;
            text-transform: uppercase;
          }
          header .subtitle {
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.3em;
            color: #666;
            text-transform: uppercase;
            padding-bottom: 4px;
          }
          .gallery {
            display: grid;
            grid-template-cols: repeat(2, 1fr);
            gap: 40px;
          }
          .look-card {
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
            gap: 15px;
            border-bottom: 1px dashed #e0e0e0;
            padding-bottom: 20px;
          }
          .image-wrapper {
            width: 100%;
            aspect-ratio: 2/3;
            background-color: #f5f5f5;
            overflow: hidden;
          }
          .image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .meta {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .designer {
            font-family: 'Playfair Display', serif;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.05em;
          }
          .look-num {
            font-size: 11px;
            font-weight: 900;
            color: #444;
            letter-spacing: 0.05em;
          }
          .season {
            font-size: 9px;
            font-weight: 900;
            color: #999;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }
          .tags {
            font-size: 9px;
            font-weight: 900;
            color: #888;
            letter-spacing: 0.1em;
            margin-top: 2px;
          }
          .note {
            font-size: 11px;
            font-family: 'Inter', sans-serif;
            font-style: italic;
            color: #555;
            margin: 6px 0 0 0;
            line-height: 1.4;
          }
          footer {
            margin-top: 60px;
            border-top: 1px solid #000000;
            padding-top: 15px;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          footer .disclaimer {
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.2em;
            color: #888;
            text-transform: uppercase;
          }
          @media print {
            body {
              padding: 20px;
            }
            .look-card {
              border-bottom: none;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>The Silent Archive</h1>
          <div class="subtitle">Curated Lookbook // ${filteredLooks.length} Specimen</div>
        </header>
        <div class="gallery">
          ${looksHtml}
        </div>
        <footer>
          <div class="disclaimer">THE SILENT ARCHIVE WORKSTATION DEVELOPED BY BENSON // FOR PERSONAL / INTERNAL EDITORIAL PRESENTATION ONLY // IMAGES COPYRIGHT BY GORUNWAY & VOGUE RUNWAY</div>
        </footer>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ✦ V8.6 HTML5 拖拽事件處理
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, overIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === overIndex) return;

    const newFiltered = [...filteredLooks];
    const draggedLook = newFiltered[draggedIndex];
    
    // 1. 在過濾列表中重新定位
    newFiltered.splice(draggedIndex, 1);
    newFiltered.splice(overIndex, 0, draggedLook);

    // 2. 將變更同步回原始 master 列表，非過濾項目位置保持不變
    const newFullList = [];
    let filteredPtr = 0;
    
    archivedLooks.forEach(item => {
      const isMatched = activeFilterTag === 'ALL' || (item.tags && item.tags.includes(activeFilterTag));
      if (isMatched) {
        newFullList.push(newFiltered[filteredPtr]);
        filteredPtr++;
      } else {
        newFullList.push(item);
      }
    });

    onReorderLooks && onReorderLooks(newFullList);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // 1. 動態提取所有已收藏 Look 中的不重複標籤列表，進行字母排序 (過濾掉以 ✦ 開頭的 AI 標籤)
  const allUsedTags = Array.from(
    new Set(
      archivedLooks
        .flatMap(look => look.tags || [])
        .filter(tag => !tag.startsWith('✦'))
    )
  ).sort();

  // 1.5. 安全守護：如果當前選中的過濾標籤在所有已使用的標籤列表中消失了，則自動回退重置為 'ALL'
  useEffect(() => {
    if (activeFilterTag !== 'ALL' && !allUsedTags.includes(activeFilterTag)) {
      setActiveFilterTag('ALL');
    }
  }, [allUsedTags, activeFilterTag]);

  // 2. 點擊頂部標籤過濾器 (切換或重置)
  const handleTagClick = (tag) => {
    if (activeFilterTag === tag) {
      setActiveFilterTag('ALL'); // 再次點擊已選中的，重置回 ALL
    } else {
      setActiveFilterTag(tag);
    }
  };

  // 3. 根據選中標籤，對情緒板進行數據瞬間篩選過濾
  const filteredLooks = activeFilterTag === 'ALL'
    ? archivedLooks
    : archivedLooks.filter(look => look.tags && look.tags.includes(activeFilterTag));

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#121212] transition-colors duration-500">
      {archivedLooks.length === 0 ? (
        // ⚪ Empty State: 寧靜大留白策展引導
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-neutral-50/30 dark:bg-neutral-900/10 select-none">
          <div className="text-center flex flex-col items-center gap-6 max-w-sm">
            <span className="text-neutral-300 dark:text-neutral-700 text-3xl font-serif">✦</span>
            <span className="font-serif text-[11px] tracking-[0.4em] font-black uppercase text-neutral-400 dark:text-neutral-500 animate-pulse">
              THE CURATOR'S VAULT
            </span>
            <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800"></div>
            <p className="font-sans text-[9px] font-bold text-neutral-400 dark:text-neutral-500 tracking-[0.25em] uppercase leading-relaxed max-w-xs mx-auto">
              NO ARCHIVED LOOKS. BROWSE THE RUNWAY TO CURATE YOUR PERSONAL MOODBOARD.
            </p>
            <button
              onClick={onCurateExamples}
              className="mt-4 px-6 py-2.5 bg-neutral-950 dark:bg-[#F5F5F5] text-white dark:text-neutral-955 font-sans text-[10px] font-black tracking-[0.25em] uppercase rounded-none border border-neutral-950 dark:border-[#F5F5F5] hover:bg-transparent dark:hover:bg-transparent hover:text-neutral-950 dark:hover:text-[#F5F5F5] active:scale-95 transition-all duration-300 cursor-pointer select-none"
            >
              [ CURATE EXAMPLES ]
            </button>
          </div>
        </div>
      ) : (
        // 🎨 Active Gallery: 錯落有致的藝術畫廊情緒板
        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
          <div className="max-w-7xl mx-auto px-6">
            

            {/* 🏷️ V5.2 頂部全局過濾器 (Tag Filter Bar) 與 V8.6 畫冊導出按鈕 */}
            <div className="flex items-center justify-between pb-4 mb-8 border-b border-neutral-200/20 dark:border-neutral-800/40 select-none">
              <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
                {/* ALL 預設全局按鈕 */}
                <button
                  onClick={() => setActiveFilterTag('ALL')}
                  className={`font-sans text-[9px] font-black tracking-[0.25em] uppercase transition-all duration-300 pb-1 cursor-pointer ${
                    activeFilterTag === 'ALL'
                      ? 'text-neutral-900 dark:text-[#F5F5F5] border-b-2 border-neutral-900 dark:border-[#F5F5F5] font-bold'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-[#F5F5F5]'
                  }`}
                >
                  ALL
                </button>

                {/* 動態標籤過濾按鈕 */}
                {allUsedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`font-sans text-[9px] font-black tracking-[0.25em] uppercase transition-all duration-300 pb-1 cursor-pointer flex items-center gap-0.5 ${
                      activeFilterTag === tag
                        ? 'text-neutral-900 dark:text-[#F5F5F5] border-b-2 border-neutral-900 dark:border-[#F5F5F5] font-bold'
                        : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-[#F5F5F5]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportEditorialBook}
                className="font-sans text-[9px] font-black tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500 hover:text-neutral-950 dark:hover:text-[#F5F5F5] transition-all duration-300 pb-1 cursor-pointer shrink-0 border-none bg-transparent"
                title="EXPORT EDITORIAL LOOKBOOK"
              >
                [ EXPORT BOOK ]
              </button>
            </div>

            {/* 滿版 3-4 欄網格 - 從左到右 1-4 依序排列 (動態 keyed 以在載入/切換時觸發暗房顯影動畫) */}
            <div 
              key={`vault-${activeView}-${activeFilterTag}-${filteredLooks.length}`}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-16 gap-y-20"
            >
              {filteredLooks.map((look, index) => {
                const uniqueKey = `${look.designer}-${look.season}-${look.look_number}`;
                return (
                  <div 
                    key={look.id || uniqueKey} 
                    className={`animate-darkroom-reveal transition-all duration-300 ${
                      draggedIndex === index ? 'opacity-30 scale-95' : ''
                    }`}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      animationFillMode: 'both'
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <VaultCard 
                      look={look}
                      onRemove={onRemoveLook}
                      onUpdateTags={onUpdateTags}
                      onUpdateNote={onUpdateNote}
                      onTagClick={handleTagClick}
                      isAnalyzing={analyzingIds && analyzingIds.has(look.id)}
                    />
                  </div>
                );
              })}
            </div>

            {/* 篩選結果為空時的冷淡引導 */}
            {filteredLooks.length === 0 && (
              <div className="py-24 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] bg-neutral-50/50 dark:bg-[#121212] select-none">
                <span className="font-serif text-xl font-black text-neutral-800 dark:text-neutral-200 tracking-[0.2em] mb-4 block">
                  EMPTY FILTER
                </span>
                <p className="font-sans text-[9px] font-bold text-neutral-400 dark:text-neutral-500 tracking-[0.2em] uppercase leading-relaxed max-w-xs mx-auto">
                  No curated looks matching tag #{activeFilterTag}. Click another tag to reveal other inspiration archives.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default VaultBoard;
