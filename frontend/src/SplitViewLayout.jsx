import React, { useState } from 'react';
import DefrostCard from './DefrostCard';
import VaultBoard from './VaultBoard';

// 🕵️‍♂️ V5.7 官方品牌社群映射表 (Instagram Handles)
const BRAND_INSTAGRAM_HANDLES = {
  "maison-margiela": "maisonmargiela",
  "maison-martin-margiela": "maisonmargiela",
  "kiko-kostadinov": "kikokostadinov",
  "prada": "prada",
  "enfants-riches-deprimes": "enfantsrichesdeprimes",
  "acne-studios": "acnestudios"
};

/**
 * FullBleedLayout — 高級時裝單一滿版視角切換佈局 (V7.2.1 - The Editorial Fade)
 * 
 * 1. 滿版畫布 (Full-Bleed Canvas)：廢除 50/50 雙屏，改為單一滿幅時裝網格。
 * 2. 全局導覽樞紐 (Global Toggle)：頂部 fixed 半透明毛玻璃導覽列，在中央提供 [ RUNWAY ] / [ THE VAULT ] 極簡文字切換器。
 * 3. 優雅淡入淡出 (The Editorial Fade)：視角切換時執行 300ms ease-in-out 的優雅燈光交疊式 cross-fade 動效。
 * 4. 佈局絕對穩定 (CLS = 0)：利用絕對定位 (absolute inset-0) 重疊交替畫布，鎖定視窗，避免任何高度跳動或滾動條位移。
 */
const SplitViewLayout = ({
  // Runway 屬性
  runwayLooks,
  runwayLoading,
  onFetchRunway,
  currentDesigner,
  selectedLookId,
  onSelectLook,
  sourceUrl = '',
  videoUrl = '',
  onZoom,

  // 跨季度時光機屬性
  seasons = [],
  currentSeason = '',
  onSelectSeason,
  runwayFading = false,

  // 極簡動態快捷推薦屬性
  shortcuts = [],
  onAddShortcut,
  onDeleteShortcut,

  // Curator's Vault 屬性
  archivedLooks,
  onCurateLook,
  onRemoveLook,
  onUpdateTags,
  onUpdateNote,
  analyzingIds = new Set()
}) => {
  const [designerInput, setDesignerInput] = useState('');
  
  // V7.2 全局切換器視角與極速過渡狀態
  const [activeView, setActiveView] = useState('runway');

  // V5.4 本地動畫控制狀態：儲存正在進行「寬度收縮與淡出」動畫的品牌 value
  const [deletingShortcuts, setDeletingShortcuts] = useState([]);

  // 處理視角切換，300ms 動態交疊淡入淡出 (The Editorial Fade)
  const handleViewSwitch = (newView) => {
    if (newView === activeView) return;
    setActiveView(newView);
  };

  // 處理快捷推薦品牌 Hover 刪除微互動
  const handleShortcutDelete = (e, value) => {
    e.stopPropagation();
    setDeletingShortcuts(prev => [...prev, value]);
    setTimeout(() => {
      onDeleteShortcut(value);
      setDeletingShortcuts(prev => prev.filter(v => v !== value));
    }, 300);
  };

  // 處理設計師開放式查詢送出
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const input = designerInput.trim();
    if (!input) return;
    onFetchRunway(input);
    setDesignerInput('');
  };

  // V7.1.1 品牌同義詞對齊 (防範 Maison Martin Margiela 與 Maison Margiela 由於歷史名稱不匹配而誤判未 PIN)
  const normalizeSlug = (slug) => {
    if (!slug) return '';
    const clean = slug.toLowerCase().trim();
    return (clean === 'maison-martin-margiela' || clean === 'maison-margiela') ? 'maison-margiela' : clean;
  };
  const isCurrentPinned = shortcuts.some(s => normalizeSlug(s.value) === normalizeSlug(currentDesigner));
  const showPinButton = currentDesigner && !isCurrentPinned;

  return (
    <div className={`w-screen h-screen flex flex-col transition-colors duration-300 overflow-hidden selection:bg-[#1A1A1A] selection:text-white ${
      activeView === 'runway' ? 'bg-[#F5F5F5] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A]'
    }`}>
      
      {/* ================================================== */}
      {/* ⛩ V7.2 全局導覽樞紐 (Global Navigation Bar - Fixed) */}
      {/* ================================================== */}
      <header className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md px-12 py-6 border-b border-neutral-200/20 flex items-center justify-between transition-colors duration-300 select-none ${
        activeView === 'runway' ? 'bg-[#F5F5F5]/80' : 'bg-white/80'
      }`}>
        {/* Left Logo */}
        <h1 className="font-serif text-2xl tracking-[0.05em] font-black uppercase text-neutral-900 select-none">
          THE SILENT ARCHIVE
        </h1>

        {/* Center View Switcher */}
        <div className="flex items-center gap-4 text-xs font-black tracking-[0.25em] uppercase">
          <button
            onClick={() => handleViewSwitch('runway')}
            className={`transition-all duration-300 pb-0.5 cursor-pointer border-none bg-transparent ${
              activeView === 'runway'
                ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                : 'text-neutral-300 hover:text-neutral-900'
            }`}
          >
            [ RUNWAY ]
          </button>
          <span className="text-neutral-200">/</span>
          <button
            onClick={() => handleViewSwitch('vault')}
            className={`transition-all duration-300 pb-0.5 cursor-pointer border-none bg-transparent ${
              activeView === 'vault'
                ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                : 'text-neutral-300 hover:text-neutral-900'
            }`}
          >
            [ THE VAULT ]
          </button>
        </div>

        {/* Right Curated Statistics */}
        <span className="font-sans text-[10px] font-black tracking-widest text-neutral-400 uppercase select-none">
          {archivedLooks.length} ITEMS CURATED
        </span>
      </header>

      {/* ================================================== */}
      {/* 🖼 滿版大畫布 (Full-Bleed Canvas Layout Container) */}
      {/* ================================================== */}
      <main className="flex-1 relative overflow-hidden w-full h-full">
        <style>{`
          @keyframes searchBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .search-cursor {
            animation: searchBlink 1s infinite;
          }
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes darkroomReveal {
            0% {
              opacity: 0;
              filter: blur(10px) grayscale(100%);
              transform: translateY(16px);
            }
            100% {
              opacity: 1;
              filter: blur(0) grayscale(0);
              transform: translateY(0);
            }
          }
          .animate-darkroom-reveal {
            animation: darkroomReveal 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {/* 🟢 Runway 滿版畫布層 (絕對定位，獨立滾動，CLS = 0) */}
        <div
          className="absolute inset-0 pt-24 overflow-y-auto custom-scrollbar defrost-gpu"
          style={{
            opacity: activeView === 'runway' ? 1 : 0,
            pointerEvents: activeView === 'runway' ? 'auto' : 'none',
            visibility: activeView === 'runway' ? 'visible' : 'hidden',
            transition: 'opacity 300ms ease-in-out, visibility 300ms ease-in-out'
          }}
        >
          {/* V7.4 巨型品牌浮水印背景 (The Mega-Typography Watermark) */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center z-0">
            <span className="font-serif text-[13vw] font-black uppercase text-neutral-950/[0.03] tracking-[0.05em] whitespace-nowrap">
              {currentDesigner.replace(/-/g, ' ')}
            </span>
          </div>

          <div className="w-full max-w-7xl mx-auto px-12 py-8 flex flex-col gap-6 relative z-10">
            
            {/* 品牌快捷與搜尋列 */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-t border-b border-neutral-200/40 text-xs font-bold tracking-widest text-neutral-400 uppercase select-none mb-3">
              {/* 品牌列表 */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {shortcuts.map((d, index) => {
                  const isActive = currentDesigner === d.value;
                  return (
                    <React.Fragment key={d.value}>
                      {index > 0 && <span className="text-neutral-200">.</span>}
                      <div className="flex items-center gap-0.5 group">
                        <button
                          onClick={() => onFetchRunway(d.value)}
                          disabled={runwayLoading}
                          className={`transition-colors font-sans font-black tracking-widest uppercase cursor-pointer border-none bg-transparent ${
                            isActive ? 'text-neutral-950 font-black' : 'text-neutral-400 hover:text-neutral-950'
                          }`}
                        >
                          {d.label.replace('STUDIOS', '').replace('KOSTADINOV', '').replace('MARGIELA', '')}
                        </button>
                        <span 
                          onClick={(e) => handleShortcutDelete(e, d.value)}
                          className="text-[8px] text-neutral-300 hover:text-neutral-950 cursor-pointer hidden group-hover:inline ml-0.5"
                        >
                          ×
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* PIN 按鈕 */}
                {showPinButton && (
                  <>
                    <span className="text-neutral-200">.</span>
                    <button
                      onClick={() => onAddShortcut(currentDesigner)}
                      disabled={runwayLoading || shortcuts.length >= 8}
                      className="text-neutral-400 hover:text-neutral-950 transition-colors font-sans font-black tracking-widest cursor-pointer disabled:opacity-40 border-none bg-transparent"
                      title="PIN TO SHORTCUTS"
                    >
                      [+ PIN]
                    </button>
                  </>
                )}
              </div>

              {/* 微縮無底線搜尋與創建按鈕 */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={designerInput}
                    onChange={(e) => setDesignerInput(e.target.value)}
                    placeholder="SEARCH DESIGNER ARCHIVE" 
                    className="bg-transparent text-neutral-950 font-mono text-[11px] font-bold tracking-[0.15em] placeholder-neutral-400 focus:outline-none w-40 uppercase text-right"
                    disabled={runwayLoading}
                  />
                  <span className="search-cursor font-mono text-[11px] font-bold text-neutral-900 ml-0.5">_</span>
                </div>
                
                <button 
                  type="submit"
                  disabled={runwayLoading}
                  className="font-sans text-[11px] font-black tracking-widest text-neutral-400 hover:text-neutral-950 transition-colors uppercase ml-2 cursor-pointer select-none border-none bg-transparent"
                >
                  [ CREATE ]
                </button>
              </form>
            </div>

            {/* Timeline Slider */}
            {seasons.length > 0 && (
              <div className="flex items-center gap-5 overflow-x-auto scrollbar-none py-1 relative w-full select-none mb-3">
                {seasons.map((s) => {
                  const isActive = currentSeason.toLowerCase() === s.season_name.toLowerCase();
                  
                  let shortName = s.season_name.replace('Ready-to-Wear', 'RTW').replace('Menswear', 'MENS');
                  const yearMatch = shortName.match(/\d{4}/);
                  if (yearMatch) {
                    const fullYear = yearMatch[0];
                    const shortYear = fullYear.substring(2);
                    shortName = shortName.replace(fullYear, shortYear);
                  }
                  shortName = shortName.replace('Fall', 'F').replace('Spring', 'S').replace(/\s+/g, ' ');

                  return (
                    <div 
                      key={s.season_name}
                      onClick={() => !runwayLoading && onSelectSeason(s.season_name)}
                      className="flex items-center cursor-pointer shrink-0 transition-all"
                    >
                      <span className={`font-mono text-[11px] tracking-widest uppercase transition-all ${
                        isActive 
                          ? 'text-neutral-950 font-black border-b border-neutral-950 pb-0.5' 
                          : 'text-neutral-400 hover:text-neutral-600'
                      }`}>
                        {shortName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 秀場圖片大畫布 */}
            {runwayLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4 text-center select-none">
                <div className="w-6 h-6 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-serif text-[11px] font-black tracking-[0.3em] uppercase text-neutral-400 animate-pulse">
                  EXTRACTING FASHION ARCHIVE...
                </span>
              </div>
            ) : runwayLooks.length > 0 ? (
              <div className="w-full">
                
                {/* V7.1.2 時裝雜誌跨頁結構化資訊區 */}
                <div className="mb-10 pb-4 border-b border-neutral-200/60 font-sans flex flex-col gap-2">
                  <h2 className="font-serif text-3xl font-black tracking-wider text-neutral-900 uppercase leading-tight select-none">
                    {currentDesigner.replace(/-/g, ' ')}
                  </h2>
                  
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                    <div className="select-none">
                      {currentSeason.replace('Ready-to-Wear', 'RTW')} // {runwayLooks.length} LOOKS MATCHED
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {BRAND_INSTAGRAM_HANDLES[currentDesigner] && (
                        <a
                          href={`https://www.instagram.com/${BRAND_INSTAGRAM_HANDLES[currentDesigner]}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-neutral-950 transition-colors duration-300 select-none whitespace-nowrap"
                        >
                          [ @{BRAND_INSTAGRAM_HANDLES[currentDesigner].toUpperCase()} ↗ ]
                        </a>
                      )}

                      {videoUrl ? (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-neutral-950 transition-colors duration-300 select-none whitespace-nowrap"
                        >
                          [ WATCH SHOW ↗ ]
                        </a>
                      ) : sourceUrl ? (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-neutral-950 transition-colors duration-300 select-none whitespace-nowrap"
                        >
                          [ VOGUE SOURCE ↗ ]
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 滿版 3-4 欄網格 - 從左到右 1-4 依序排列 (動態 keyed 以在載入/切換時觸發暗房顯影動畫) */}
                <div 
                  key={`${currentDesigner}-${currentSeason}-${activeView}`} 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-16 gap-y-20"
                >
                  {runwayLooks.map((look, index) => {
                    const isCurated = archivedLooks.some(
                      item => 
                        item.designer.toLowerCase() === currentDesigner.toLowerCase() &&
                        item.season.toLowerCase() === (look.season || currentSeason || "").toLowerCase() &&
                        item.look_number === look.look_number
                    );
                    return (
                      <div 
                        key={look.look_number} 
                        className="animate-darkroom-reveal"
                        style={{
                          animationDelay: `${index * 30}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <DefrostCard 
                          look={look} 
                          onClick={() => onSelectLook(look.look_number)}
                          onCurate={onCurateLook}
                          onRemove={onRemoveLook}
                          isActive={selectedLookId === look.look_number}
                          onZoom={onZoom}
                          isCurated={isCurated}
                        />
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 text-center border-2 border-dashed border-neutral-200 rounded-[3rem] bg-neutral-50/50 max-w-md mx-auto px-8 select-none">
                <span className="font-serif text-3xl font-black text-neutral-800 tracking-[0.2em] mb-4">
                  SILENT
                </span>
                <div className="w-10 h-[1px] bg-neutral-900 mb-6"></div>
                <p className="font-sans text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase leading-relaxed">
                  Awaiting archive parameters. Select a fashion house above to initiate curation lookup.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ⚪ Vault 滿版畫布層 (絕對定位，獨立滾動，CLS = 0) */}
        <div
          className="absolute inset-0 pt-24 overflow-y-auto custom-scrollbar defrost-gpu"
          style={{
            opacity: activeView === 'vault' ? 1 : 0,
            pointerEvents: activeView === 'vault' ? 'auto' : 'none',
            visibility: activeView === 'vault' ? 'visible' : 'hidden',
            transition: 'opacity 300ms ease-in-out, visibility 300ms ease-in-out'
          }}
        >
          <div className="w-full">
            <VaultBoard 
              archivedLooks={archivedLooks} 
              onRemoveLook={onRemoveLook} 
              onUpdateTags={onUpdateTags}
              onUpdateNote={onUpdateNote}
              analyzingIds={analyzingIds}
              activeView={activeView}
            />
          </div>
        </div>
      </main>

    </div>
  );
};

export default SplitViewLayout;
