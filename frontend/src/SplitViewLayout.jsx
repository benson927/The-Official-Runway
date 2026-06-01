import React, { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);
import DefrostCard from './DefrostCard';
import VaultBoard from './VaultBoard';

// 🕵️‍♂️ V5.7 官方品牌社群映射表 (Instagram Handles)
const BRAND_INSTAGRAM_HANDLES = {
  "maison-margiela": "maisonmargiela",
  "maison-martin-margiela": "maisonmargiela",
  "kiko-kostadinov": "kikokostadinov",
  "prada": "prada",
  "enfants-riches-deprimes": "enfantsrichesdeprimes",
  "acne-studios": "acnestudios",
  "miu-miu": "miumiu"
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

  // 極極動態快捷推薦屬性
  shortcuts = [],
  onAddShortcut,
  onDeleteShortcut,
  onReorderShortcuts,

  // Curator's Vault 屬性
  archivedLooks,
  onCurateLook,
  onRemoveLook,
  onUpdateTags,
  onUpdateNote,
  analyzingIds = new Set(),
  showToast
}) => {
  const [designerInput, setDesignerInput] = useState('');
  
  // V7.2 全局切換器視角與極速過渡狀態
  const [activeView, setActiveView] = useState('runway');
  
  // ✦ 季度時間軸容器 Ref
  const timelineRef = useRef(null);

  // ✦ 自訂密碼修改器狀態
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [newPasscodeInput, setNewPasscodeInput] = useState('');

  // 取得品牌對應的 Instagram 帳號 (若無映射則以格式化後的品牌名稱作為 Fallback 自癒)
  const getInstagramHandle = (designer) => {
    if (!designer) return '';
    if (BRAND_INSTAGRAM_HANDLES[designer]) {
      return BRAND_INSTAGRAM_HANDLES[designer];
    }
    return designer.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // V5.4 本地動畫控制狀態：儲存正在進行「寬度收縮與淡出」動畫的品牌 value
  const [deletingShortcuts, setDeletingShortcuts] = useState([]);

  // 品牌快捷列水平拖曳重排狀態
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newShortcuts = [...shortcuts];
    const [draggedItem] = newShortcuts.splice(draggedIndex, 1);
    newShortcuts.splice(index, 0, draggedItem);
    
    if (onReorderShortcuts) {
      onReorderShortcuts(newShortcuts);
    }
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // V7.6 物理引擎：暗房顯影動畫 Scope 參照
  const containerRef = useRef();
  // V7.8 Margelia Spec (邊緣特刊) 參照
  const margeliaRef = useRef();
  const pulseRef = useRef();

  // ✦ 季度時間軸選中項平滑滾動置中 (ScrollTo Alignment)
  useGSAP(() => {
    if (!timelineRef.current || !currentSeason) return;
    const activeEl = timelineRef.current.querySelector('.timeline-season-btn-active');
    if (!activeEl) return;

    const container = timelineRef.current;
    const containerWidth = container.clientWidth;
    const itemOffset = activeEl.offsetLeft;
    const itemWidth = activeEl.clientWidth;
    const targetScrollLeft = itemOffset - (containerWidth / 2) + (itemWidth / 2);

    gsap.to(container, {
      scrollLeft: targetScrollLeft,
      duration: 0.6,
      ease: "power3.out",
      overwrite: "auto"
    });
  }, { dependencies: [currentSeason, seasons], scope: timelineRef });

  // V7.6.2 & V7.7 基於官方 .gsap-rules.md 與 .cursorrules 對齊之 React 最佳實踐
  // - 使用 scope: containerRef 隔離選擇器，確保無全局 DOM 污染
  // - 透過 useGSAP 的 dependencies 機制，在 view 或數據變更時安全重新執行
  // - 啟用 overwrite: 'auto' 避免快速切換造成的 tween 重疊衝突與記憶體洩漏
  // - 導入 The Fluid Grid 物理推擠特效，對 images 的 scale 進行物理微距放大，並使用 requestAnimationFrame 與狀態 Map 快取進行效能防禦。
  useGSAP((context, contextSafe) => {
    // 🟢 1. 骨牌進場顯影動畫 (The Darkroom Reveal)
    if (activeView === 'runway' && runwayLooks.length > 0) {
      const cards = gsap.utils.toArray('.runway-card-gsap');
      if (cards.length > 0) {
        gsap.fromTo(cards, 
          { 
            opacity: 0, 
            filter: 'blur(12px)', 
            y: 30 
          },
          { 
            opacity: 1, 
            filter: 'blur(0px)', 
            y: 0, 
            duration: 0.8, 
            ease: "power3.out", 
            stagger: 0.04,
            overwrite: 'auto'
          }
        );
      }
    }

    // 🔴 3. Margelia Spec (穿著Prada的惡魔特刊) 呼吸顯影與惡魔脈搏
    const isPrada = currentDesigner?.toLowerCase() === 'prada';
    if (activeView === 'runway' && isPrada) {
      if (margeliaRef.current) {
        gsap.fromTo(margeliaRef.current, 
          {
            opacity: 0,
            x: -20,
            filter: "blur(5px)"
          },
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: 1.2,
            ease: "power2.out",
            delay: 0.5,
            overwrite: 'auto'
          }
        );
      }
      if (pulseRef.current) {
        gsap.fromTo(pulseRef.current,
          { opacity: 0.1 },
          {
            opacity: 0.3,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            overwrite: 'auto'
          }
        );
      }
    }

    // 🔵 2. The Fluid Grid 物理推擠特效 (滑鼠追蹤與漣漪放大)
    if (activeView !== 'runway' || runwayLooks.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    // 取得所有圖片的 DOM 節點
    const images = gsap.utils.toArray('.defrost-card-img', container);
    if (images.length === 0) return;

    // 用 Map 記錄每個圖片目前的物理 scale，避免重複調用 gsap.to 導致卡頓 (Performance Throttling)
    const currentScales = new Map();
    images.forEach(img => currentScales.set(img, 1));

    // ✦ 預先計算並快取圖片中心點（相對於 document），徹底消除 pointermove 中的 getBoundingClientRect() (Avoid Layout Thrashing)
    const imageCoords = new Map();
    const updateCoordsCache = () => {
      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        imageCoords.set(img, {
          cx: rect.left + rect.width / 2 + window.scrollX,
          cy: rect.top + rect.height / 2 + window.scrollY
        });
      });
    };

    // 初始化快取
    updateCoordsCache();

    // 監聽視窗 Resize 重新整理快取
    const handleResize = () => {
      updateCoordsCache();
    };
    window.addEventListener('resize', handleResize);

    let ticking = false;

    // 物理距離運算與節流函數
    const handlePointerMove = contextSafe((e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 使用相對於 document 的座標系統進行精準運算
          const mx = e.clientX + window.scrollX;
          const my = e.clientY + window.scrollY;
          const maxDist = 380; // 滑鼠感應物理半徑 (px)

          images.forEach(img => {
            const coords = imageCoords.get(img);
            if (!coords) return;

            const dist = Math.hypot(coords.cx - mx, coords.cy - my);

            let targetScale = 1;
            if (dist < maxDist) {
              const factor = 1 - dist / maxDist; // 0 ~ 1
              // 使用二次方平滑曲線，讓邊緣效果回彈更流暢
              const smoothFactor = Math.pow(factor, 2);
              targetScale = 1 + smoothFactor * 0.05; // 滑鼠正上方時最大 scale: 1.05
            }

            // 效能防禦：若變化幅度極小，或維持在 maxDist 外 (scale 仍為 1)，不呼叫 gsap.to
            const prevScale = currentScales.get(img) || 1;
            if (Math.abs(targetScale - prevScale) > 0.002) {
              gsap.to(img, {
                scale: targetScale,
                duration: 0.8,
                ease: "power3.out", // 極致絲滑的阻尼感恢復彈性
                overwrite: "auto"
              });
              currentScales.set(img, targetScale);
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    });

    // 當滑鼠離開 Runway 畫布時，全部還原
    const handlePointerLeave = contextSafe(() => {
      images.forEach(img => {
        const prevScale = currentScales.get(img) || 1;
        if (prevScale !== 1) {
          gsap.to(img, {
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            overwrite: "auto"
          });
          currentScales.set(img, 1);
        }
      });
    });

    // 綁定事件監聽
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    // 清理函數 (Cleanup)：解除監聽並安全還原所有 Tween 狀態
    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      images.forEach(img => {
        gsap.killTweensOf(img);
        gsap.set(img, { scale: 1 });
      });
      if (margeliaRef.current) {
        gsap.killTweensOf(margeliaRef.current);
      }
      if (pulseRef.current) {
        gsap.killTweensOf(pulseRef.current);
      }
    };
  }, { 
    dependencies: [activeView, runwayLooks, currentDesigner, currentSeason], 
    scope: containerRef,
    revertOnUpdate: true 
  });

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

        {/* Right Curated Statistics & Custom Passcode */}
        <div className="flex items-center gap-6 select-none">
          {isChangingPasscode ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newPasscodeInput}
                onChange={(e) => setNewPasscodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const clean = newPasscodeInput.trim();
                    if (clean) {
                      localStorage.setItem('vault_custom_passcode', clean);
                      setIsChangingPasscode(false);
                      setNewPasscodeInput('');
                      if (showToast) {
                        showToast("NEW VAULT PASSCODE SECURED", "success");
                      }
                    } else {
                      setIsChangingPasscode(false);
                    }
                  } else if (e.key === 'Escape') {
                    setIsChangingPasscode(false);
                  }
                }}
                onBlur={() => setIsChangingPasscode(false)}
                placeholder="NEW PASSCODE"
                className="bg-transparent border-b border-neutral-900/20 text-[10px] font-sans font-black tracking-widest text-neutral-950 placeholder-neutral-300 focus:outline-none w-28 uppercase text-right"
                autoFocus
              />
              <span className="font-mono text-[10px] text-neutral-900 ml-0.5 animate-blink">_</span>
            </div>
          ) : (
            <button
              onClick={() => setIsChangingPasscode(true)}
              className="font-sans text-[10px] font-black tracking-widest text-neutral-400 hover:text-neutral-950 transition-colors uppercase border-none bg-transparent cursor-pointer"
            >
              [ SET KEY ]
            </button>
          )}

          <span className="font-sans text-[10px] font-black tracking-widest text-neutral-400 uppercase select-none">
            {archivedLooks.length} ITEMS CURATED
          </span>
        </div>
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
        `}</style>

        {/* 🟢 Runway 滿版畫布層 (絕對定位，獨立滾動，CLS = 0) */}
        <div
          ref={containerRef}
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
                      {index > 0 && <span className="text-neutral-200 select-none">.</span>}
                      <div 
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-0.5 group transition-all duration-300 ${
                          index === draggedIndex 
                            ? 'opacity-30 cursor-grabbing' 
                            : 'cursor-grab'
                        }`}
                      >
                        <button
                          onClick={() => onFetchRunway(d.value)}
                          disabled={runwayLoading}
                          className={`transition-colors font-sans font-black tracking-widest uppercase border-none bg-transparent cursor-pointer ${
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
              <div 
                ref={timelineRef}
                className="flex items-center gap-5 overflow-x-auto scrollbar-none py-1 relative w-full select-none mb-3"
              >
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
                      className={`flex items-center cursor-pointer shrink-0 transition-all timeline-season-btn ${
                        isActive ? 'timeline-season-btn-active' : ''
                      }`}
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
                      {currentDesigner && (
                        <a
                          href={`https://www.instagram.com/${getInstagramHandle(currentDesigner)}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-neutral-950 transition-colors duration-300 select-none whitespace-nowrap"
                        >
                          [ @{getInstagramHandle(currentDesigner).toUpperCase()} ↗ ]
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
                        className="runway-card-gsap opacity-0"
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

                {/* 前端 V7.8 Margelia Spec (穿著Prada的惡魔特刊) - 水平頁尾註腳 */}
                {activeView === 'runway' && currentDesigner?.toLowerCase() === 'prada' && (
                  <div 
                    ref={margeliaRef}
                    className="mt-24 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-neutral-200 pt-6 pb-4 select-none text-neutral-400 font-serif opacity-0"
                  >
                    <span className="font-black tracking-[0.25em] text-neutral-900 text-[8px] uppercase">
                      MARGELIA / [ DWP II ]
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="tracking-[0.18em] text-[7.5px] text-neutral-400 uppercase leading-relaxed text-left md:text-right max-w-xl">
                        "The future isn't analog, Andrea. It's archived. This vault is the architecture of desire."
                      </span>
                      <span 
                        ref={pulseRef}
                        className="w-[3px] h-[3px] bg-red-600 rounded-full opacity-10 animate-pulse-slow"
                      ></span>
                    </div>
                  </div>
                )}

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
