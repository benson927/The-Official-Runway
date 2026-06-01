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
  analyzingIds = new Set(),
  activeView = 'runway'
}) => {
  const [activeFilterTag, setActiveFilterTag] = useState('ALL');

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
    <div className="w-full h-full flex flex-col bg-white">
      {archivedLooks.length === 0 ? (
        // ⚪ Empty State: 寧靜大留白策展引導
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-neutral-50/30 select-none">
          <div className="text-center flex flex-col items-center gap-6 max-w-sm">
            <span className="text-neutral-300 text-3xl font-serif">✦</span>
            <span className="font-serif text-[11px] tracking-[0.4em] font-black uppercase text-neutral-400 animate-pulse">
              THE CURATOR'S VAULT
            </span>
            <div className="w-8 h-[1px] bg-neutral-200"></div>
            <p className="font-sans text-[9px] font-bold text-neutral-400 tracking-[0.25em] uppercase leading-relaxed">
              NO ARCHIVED LOOKS. BROWSE THE RUNWAY TO CURATE YOUR PERSONAL MOODBOARD.
            </p>
          </div>
        </div>
      ) : (
        // 🎨 Active Gallery: 錯落有致的藝術畫廊情緒板
        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
          <div className="max-w-7xl mx-auto px-6">
            

            {/* 🏷️ V5.2 頂部全局過濾器 (Tag Filter Bar) - 橫向滾動 */}
            {allUsedTags.length > 0 && (
              <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-8 custom-scrollbar border-b border-neutral-50 select-none">
                {/* ALL 預設全局按鈕 */}
                <button
                  onClick={() => setActiveFilterTag('ALL')}
                  className={`font-sans text-[9px] font-black tracking-[0.25em] uppercase transition-all duration-300 pb-1 cursor-pointer ${
                    activeFilterTag === 'ALL'
                      ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                      : 'text-neutral-400 hover:text-neutral-900'
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
                        ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                        : 'text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

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
                    className="animate-darkroom-reveal transition-all duration-300"
                    style={{
                      animationDelay: `${index * 30}ms`,
                      animationFillMode: 'both'
                    }}
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
              <div className="py-24 text-center border border-dashed border-neutral-200 rounded-[2.5rem] bg-neutral-50/50 select-none">
                <span className="font-serif text-xl font-black text-neutral-800 tracking-[0.2em] mb-4 block">
                  EMPTY FILTER
                </span>
                <p className="font-sans text-[9px] font-bold text-neutral-400 tracking-[0.2em] uppercase leading-relaxed max-w-xs mx-auto">
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
