import { useState } from 'react';

/**
 * DefrostCard — 時裝秀場直角無界卡片組件 (V7.4 - The Immersive Gallery)
 * 
 * 核心特色：
 * 1. 畫廊級銳利直角 (rounded-none)：完全移除圓角，展現純粹的直角切割與前衛的當代藝術氣息。
 * 2. 無邊界出血版面 (Bleed Effect)：徹底移除圖片外圍的「白色卡片背景與 Padding」。
 *    時裝圖片直接貼在系統底層畫布上。
 * 3. 純粹懸浮資訊：下方 Look 資訊與季節文字，直接以無容器包裝的純文字形式呈現在圖片正下方，維持極致乾淨。
 * 4. 懸停平滑放大：滑鼠懸停時圖片 `scale-[1.02] duration-300 ease-out` 輕微放大，細節豐盈。
 */
const DefrostCard = ({ look, onClick, onCurate, onRemove, isActive, onZoom, isCurated }) => {
  const { image_url, look_number, season, designer } = look;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      onClick={onClick}
      className={`defrost-card-container group cursor-pointer select-none transition-all duration-300 bg-transparent transform ${
        isActive ? 'scale-[1.01]' : ''
      }`}
    >
      {/* 🟢 圖片直角容器 (rounded-none) - 點擊圖片觸發沉浸式放大鏡 */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onZoom(look);
        }}
        className={`relative aspect-[2/3] overflow-hidden rounded-none bg-neutral-200 dark:bg-neutral-800 cursor-zoom-in ${
          !imageLoaded ? 'animate-pulse' : ''
        }`}
      >
        <img 
          src={image_url} 
          alt={`${designer} - ${season} - Look ${look_number}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`defrost-card-img defrost-gpu w-full h-full object-cover rounded-none transition-opacity duration-700 ease-out ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            willChange: 'transform'
          }}
        />

        {/* 輕量級邊緣有機漸層覆蓋層，增強光影深度 */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-60"></div>
        
        {/* 微型標籤 - 左上角 Look 序號 (直角俐落設計) */}
        <div className="absolute top-6 left-6 px-3 py-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-none border border-neutral-900/10 dark:border-neutral-100/10 shadow-sm">
          <span className="font-serif text-xs font-black text-neutral-900 dark:text-[#F5F5F5] tracking-wider">
            N° {String(look_number).padStart(2, '0')}
          </span>
        </div>

        {/* 🎨 私人策展按鈕 - 支援雲端即時雙態狀態聯動 (V6.5) */}
        {isCurated ? (
          <button
            onClick={(e) => {
              e.stopPropagation(); // 阻止冒泡，防止點擊時選中卡片
              if (onRemove) onRemove(look);
            }}
            className="absolute bottom-6 right-6 px-4 py-2 bg-white dark:bg-[#121212] text-neutral-955 dark:text-[#F5F5F5] font-sans text-xs font-black tracking-[0.25em] uppercase rounded-full border border-neutral-200 dark:border-neutral-800 shadow-xl backdrop-blur-sm opacity-100 transition-all duration-300 hover:bg-neutral-950 dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-105 active:scale-95 z-10"
          >
            ✓ CURATED
          </button>
        ) : (
          onCurate && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡，防止點擊收藏時同時選中卡片
                onCurate(look);
              }}
              className="absolute bottom-6 right-6 px-4 py-2 bg-neutral-950/90 dark:bg-[#F5F5F5]/90 text-white dark:text-neutral-955 font-sans text-xs font-black tracking-[0.25em] uppercase rounded-full border border-neutral-800 dark:border-neutral-200 shadow-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform translate-y-2 group-hover:translate-y-0 hover:bg-black dark:hover:bg-white hover:scale-105 active:scale-95 z-10"
            >
              + CURATE
            </button>
          )
        )}
      </div>

      {/* ⚪ 卡片底部時裝資訊區 (無容器包裝、直接浮水印出血排版) */}
      <div className="pt-4 pb-2 px-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-serif text-sm font-black uppercase text-neutral-900 dark:text-[#F5F5F5] tracking-[0.2em]">
            LOOK {look_number}
          </span>
          {isActive && (
            <span className="font-sans text-[10px] font-black text-neutral-900 dark:text-[#F5F5F5] tracking-widest uppercase border border-neutral-900 dark:border-[#F5F5F5] px-2 py-0.5 rounded-none">
              ACTIVE
            </span>
          )}
        </div>
        <div className="w-6 h-[1px] bg-neutral-900 dark:bg-[#F5F5F5] transition-all duration-300 group-hover:w-12"></div>
        <p className="font-sans text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase truncate">
          {season}
        </p>
      </div>
    </div>
  );
};

export default DefrostCard;
