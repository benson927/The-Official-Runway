import React, { useState, useEffect } from 'react';

/**
 * ImmersiveZoom — 沉浸式布料細節放大鏡模態窗元件 (V5.8)
 * 
 * 核心特色：
 * 1. 背景採用純白毛玻璃 (bg-white/95 backdrop-blur-md)，讓用戶專注於布料紋理。
 * 2. 實作高奢官網級「Pan-on-hover 2.2x 縮放」：
 *    - 點擊圖片平滑切換 2.2 倍放大。
 *    - 放大時，圖片會隨滑鼠在容器上的坐標 X, Y 平滑 pan 平移，展現微距細節。
 * 3. 右側預留黃金比例大留白面板，展示時裝 Specification 元數據，並配置 [+ ARCHIVE] 策展按鈕。
 * 4. 監聽鍵盤 ESC 鍵一鍵關閉。
 */
const ImmersiveZoom = ({ look, onClose, onCurate, isAlreadyCurated, videoUrl }) => {
  const { image_url, designer, season, look_number } = look;
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isPlayOpen, setIsPlayOpen] = useState(false);

  // 解析 YouTube 直連網址為無縫自動播放與靜音循環的 Embed 嵌入路徑 (V6.6)
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playlist=${videoId}&loop=1&controls=1&modestbranding=1&rel=0`;
    }
    return '';
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  // 監聽鍵盤 ESC 鍵以關閉模態窗
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 當滑鼠在大圖上移動時，計算相對百分比位置，用於 pan-on-hover 縮放的原點
  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md p-6 select-none animate-fade-in">
      
      {/* 🔴 左上角極簡關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-8 left-8 font-sans text-xs font-black text-neutral-400 hover:text-neutral-950 tracking-[0.3em] uppercase transition-colors duration-300 cursor-pointer select-none"
      >
        [ CLOSE × ]
      </button>

      {/* 雙欄主佈局容器 (圖片 + 右側大留白面板) */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl h-full max-h-[85vh] gap-12">
        
        {/* 🔍 左側：沉浸式圖片顯示與 Pan-on-hover 縮放容器 */}
        <div 
          onClick={() => setIsZoomed(!isZoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZoomed(false)}
          className="flex-1 w-full h-full flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-neutral-50/50 border border-neutral-100 relative cursor-pointer"
        >
          <img
            src={image_url}
            alt={`${designer} - Look ${look_number}`}
            className="w-full h-full object-contain defrost-gpu select-none"
            style={{
              transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
              transformOrigin: isZoomed ? `${mousePos.x}% ${mousePos.y}%` : 'center center',
              cursor: isZoomed ? 'zoom-out' : 'zoom-in',
              transition: isZoomed ? 'transform 120ms cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />

          {/* 浮動提示：引導使用者點擊大圖放大 */}
          {!isZoomed && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-neutral-100 shadow-sm pointer-events-none transition-opacity duration-300">
              <span className="font-sans text-xs font-black text-neutral-500 tracking-[0.25em] uppercase">
                CLICK TO ZOOM FABRIC DETAIL
              </span>
            </div>
          )}

          {/* 🎬 秀場動態錄像子母視窗 (The Cinema Overlay - PIP Player) */}
          {videoUrl && isPlayOpen && embedUrl && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="absolute bottom-6 right-6 w-80 aspect-video rounded-3xl overflow-hidden border border-neutral-200 shadow-2xl bg-black z-20 transition-all duration-500 transform scale-100 hover:scale-[1.02]"
            >
              <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title="Runway Movement"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full object-cover"
              ></iframe>
            </div>
          )}
        </div>

        {/* ⚪ 右側：極簡高奢大留白面板 */}
        <div className="w-full md:w-80 flex flex-col justify-between py-10 pl-0 md:pl-12 border-t md:border-t-0 md:border-l border-neutral-100 h-full max-h-[75vh] select-none">
          
          {/* 品牌、季度與 Look Specimen 編號 */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-xs font-black text-neutral-400 tracking-[0.3em] uppercase">
                DESIGNER SPECIMEN
              </span>
              <h2 className="font-serif text-3xl font-black text-neutral-900 tracking-wider capitalize leading-tight">
                {designer.replace(/-/g, ' ')}
              </h2>
            </div>

            <div className="w-12 h-[1px] bg-neutral-900 my-1"></div>

            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs font-black text-neutral-400 tracking-[0.2em] uppercase">
                COLLECTION SEASON
              </span>
              <p className="font-sans text-sm font-bold text-neutral-800 tracking-[0.1em] uppercase">
                {season}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs font-black text-neutral-400 tracking-[0.2em] uppercase">
                ARCHIVE NUMBER
              </span>
              <p className="font-serif text-sm italic text-neutral-500">
                Lookbook Specimen No. {String(look_number).padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* 🎬 秀場動態錄像切換鈕 (V6.6) */}
          {videoUrl && embedUrl && (
            <div className="flex flex-col gap-1 my-3">
              <span className="font-sans text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase">
                RUNWAY MOVEMENT
              </span>
              <button
                onClick={() => setIsPlayOpen(!isPlayOpen)}
                className={`w-full py-3.5 mt-1 text-center font-sans text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 rounded-full border ${
                  isPlayOpen 
                    ? 'bg-neutral-950 text-white border-neutral-950 hover:bg-neutral-800' 
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-950 hover:text-white hover:border-neutral-950'
                } active:scale-95 cursor-pointer flex items-center justify-center gap-2`}
              >
                <span>{isPlayOpen ? '[ CLOSE CINEMA ]' : '▶ [ OPEN CINEMA ]'}</span>
              </button>
            </div>
          )}

          {/* [+ ARCHIVE] 策展按鈕與已收藏狀態 */}
          <div className="flex flex-col gap-3">
            <p className="font-sans text-xs font-bold text-neutral-400 tracking-[0.2em] uppercase leading-relaxed text-center md:text-left">
              {isAlreadyCurated 
                ? 'THIS PIECE HAS BEEN LOCKERED IN THE CURATOR\'S PRIVATE VAULT.'
                : 'CLICK BELOW TO SECURE AND CURATE THIS LOOK INTO YOUR PERSONAL MOODBOARD.'
              }
            </p>
            <button
              onClick={() => onCurate(look)}
              disabled={isAlreadyCurated}
              className={`w-full py-4 text-center font-sans text-xs font-black tracking-[0.3em] uppercase transition-all duration-300 rounded-full border ${
                isAlreadyCurated
                  ? 'bg-neutral-50 text-neutral-400 border-neutral-100 cursor-default'
                  : 'bg-neutral-950 text-white border-neutral-950 hover:bg-white hover:text-neutral-950 hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              {isAlreadyCurated ? '[ CURATED ]' : '[+ ARCHIVE]'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ImmersiveZoom;
