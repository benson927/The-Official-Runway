import React, { useState, useEffect } from 'react';

/**
 * VaultCard — 收藏圖卡組件 (V7.4 - The Immersive Gallery)
 * 
 * 核心特色：
 * 1. 畫廊級銳利直角 (rounded-none)：完全移除圓角，展現純粹的直角切割與前衛的當代藝術氣息。
 * 2. 無邊界出血版面 (Bleed Effect)：徹底移除圖片外圍的「白色卡片背景與 Padding」。
 *    收藏圖片直接貼在系統底層畫布上。
 * 3. 純粹懸浮資訊：下方資訊、標籤與筆記欄位，直接以無容器包裝的純文字形式呈現在圖片下方，維持極致乾淨。
 */
const VaultCard = ({ 
  look, 
  onRemove, 
  onUpdateTags, 
  onUpdateNote, 
  onTagClick,
  isAnalyzing
}) => {
  const { image_url, look_number, season, designer, tags = [] } = look;
  const displayTags = tags.filter(tag => !tag.startsWith('✦'));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [localNote, setLocalNote] = useState(look.note || '');
  const [isFocused, setIsFocused] = useState(false);

  // 監聽 look.note 的外部更新 (例如同步或重置)
  useEffect(() => {
    setLocalNote(look.note || '');
  }, [look.note]);

  // 處理失去焦點時寫入頂層 (優先使用 UUID 更新)
  const handleNoteBlur = () => {
    if (look.id) {
      onUpdateNote(look.id, localNote);
    } else {
      onUpdateNote(designer, season, look_number, localNote);
    }
  };

  // 處理按下 Enter 時保存備註並失去焦點
  const handleNoteKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (look.id) {
        onUpdateNote(look.id, localNote);
      } else {
        onUpdateNote(designer, season, look_number, localNote);
      }
      e.currentTarget.blur();
    }
  };

  // 處理鍵盤 Enter 添加新標籤 (去重 + 全大寫格式化，優先使用 UUID)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rawTag = tagInput.trim().toUpperCase();
      
      if (rawTag) {
        // 去除標籤開頭可能手動打的 '#'
        const cleanTag = rawTag.startsWith('#') ? rawTag.substring(1).trim() : rawTag;
        
        if (cleanTag && !tags.includes(cleanTag)) {
          const updatedTags = [...tags, cleanTag];
          if (look.id) {
            onUpdateTags(look.id, updatedTags);
          } else {
            onUpdateTags(designer, season, look_number, updatedTags);
          }
        }
        setTagInput('');
      }
    }
  };

  // 處理點擊標籤邊角 × 按鈕刪除該標籤
  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    if (look.id) {
      onUpdateTags(look.id, updatedTags);
    } else {
      onUpdateTags(designer, season, look_number, updatedTags);
    }
  };

  return (
    <div className="break-inside-avoid relative group rounded-none overflow-hidden border-none bg-transparent transition-all duration-500 transform hover:scale-[1.01]">
      
      {/* 🟢 圖片展示與取消收藏遮罩區 (直角設計) */}
      <div className={`relative overflow-hidden aspect-auto bg-neutral-200 dark:bg-neutral-800 rounded-none ${
        !imageLoaded ? 'animate-pulse' : ''
      }`}>
        <img 
          src={image_url} 
          alt={`${designer} - Look ${look_number}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-auto object-cover grayscale-[30%] transition-all duration-700 transform scale-100 group-hover:scale-102 group-hover:grayscale-0 defrost-gpu rounded-none ${
            imageLoaded ? 'opacity-90 group-hover:opacity-100' : 'opacity-0'
          }`}
        />

        {/* 絕對定位的取消收藏覆蓋層 */}
        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <button
            onClick={() => onRemove(look)}
            className="px-5 py-2.5 bg-white dark:bg-[#121212] text-neutral-950 dark:text-[#F5F5F5] font-sans text-xs font-black tracking-[0.25em] uppercase rounded-full shadow-2xl hover:bg-neutral-950 dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-105 active:scale-95 transition-all duration-300 transform translate-y-3 group-hover:translate-y-0"
          >
            - REMOVE
          </button>
        </div>
      </div>

      {/* ⚪ 卡片底部署名資訊與極簡標籤管理區 (無容器、出血排版) */}
      <div className="pt-4 pb-2 px-1 flex flex-col gap-3 bg-transparent">
        
        {/* Look 基本時裝屋元數據 */}
        <div className="flex flex-col gap-0.5 border-b border-neutral-900/10 dark:border-neutral-100/10 pb-3">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xs font-black text-neutral-900 dark:text-[#F5F5F5] uppercase tracking-widest truncate max-w-[130px]">
              {designer.replace(/-/g, ' ')}
            </span>
            <span className="font-sans text-xs font-black text-neutral-400 dark:text-neutral-500 tracking-wider">
              LOOK {look_number}
            </span>
          </div>
          <p className="font-sans text-xs font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase truncate">
            {season}
          </p>
        </div>

        {/* 🏷️ 自訂 Hashtags 展示區 / ORACLE ANALYZING 狀態 */}
        {isAnalyzing ? (
          <div className="flex items-center gap-1 py-1">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none flex items-center">
              [ ORACLE ANALYZING<span className="animate-blink">_</span> ]
            </span>
          </div>
        ) : (
          displayTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {displayTags.map(tag => (
                <span 
                  key={tag}
                  onClick={(e) => {
                    if (e.target.tagName !== 'BUTTON') {
                      onTagClick && onTagClick(tag);
                    }
                  }}
                  className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-[#F5F5F5] transition-colors flex items-center group/tag select-none cursor-pointer"
                >
                  #{tag}
                  {/* 標籤上的微型刪除按鈕 — Hover 時浮現 */}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-neutral-300 dark:text-neutral-700 hover:text-red-500 font-sans text-xs font-medium opacity-0 group-hover/tag:opacity-100 transition-opacity pl-0.5 cursor-pointer"
                    title={`REMOVE #${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )
        )}

        {/* ✏️ 無痕 Borderless 標籤輸入框 */}
        {!isAnalyzing && (
          <div className="relative mt-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="+ ADD TAG..."
              className={`w-full bg-transparent py-1 text-xs font-black tracking-widest uppercase focus:outline-none transition-all duration-500 border-b border-transparent placeholder-transparent group-hover:placeholder-neutral-300 dark:group-hover:placeholder-neutral-700 ${
                isFocused 
                  ? 'border-neutral-950 dark:border-[#F5F5F5] placeholder-neutral-300 dark:placeholder-neutral-700 text-neutral-955 dark:text-[#F5F5F5]' 
                  : 'group-hover:border-neutral-200 dark:group-hover:border-neutral-800 text-neutral-400 dark:text-neutral-500'
              } border-dashed`}
            />
          </div>
        )}

        {/* 📝 V5.8 私人微筆記 (Micro-Notes) */}
        <div className="mt-3 pt-3 border-t border-neutral-900/10 dark:border-neutral-100/10 relative group/note">
          <input
            type="text"
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            onBlur={handleNoteBlur}
            onKeyDown={handleNoteKeyDown}
            placeholder="ADD NOTE..."
            className="w-full bg-transparent text-xs font-sans italic text-slate-400 dark:text-slate-500 focus:text-neutral-800 dark:focus:text-[#F5F5F5] placeholder-slate-300 dark:placeholder-slate-700 group-hover:placeholder-slate-400 dark:group-hover:placeholder-slate-600 focus:outline-none border-none py-0.5"
          />
        </div>

      </div>
    </div>
  );
};

export default VaultCard;
