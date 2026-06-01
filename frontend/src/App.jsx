import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import SplitViewLayout from './SplitViewLayout';
import ImmersiveZoom from './ImmersiveZoom';
import AccessGate from './AccessGate';
import { supabase } from './utils/supabaseClient';

gsap.registerPlugin(useGSAP);

// 後端 API 基礎路徑 (Flask 運行於 Port 5001 - 用於左屏抓取)
const BASE_URL = 'http://127.0.0.1:5001/api';

/**
 * App — 私人策展庫頂層狀態橋接器 (V5.1 - The Curator's Vault)
 * 
 * 核心職責：
 * 1. 徹底移除了雷達商品 API、貨幣轉換、以及 watchlist 後端收藏同步。
 * 2. 引入 `archivedLooks` 私人策展狀態，並使用 `localStorage` 實現完全的本地離線持久化儲存。
 * 3. 實作 `handleCurateLook` (查重後加入策展庫) 與 `handleRemoveLook` (從策展庫移除) 方法。
 * 4. 維護左屏 Vogue Runway 數據的異步加載狀態（包含開放式查詢）。
 */
function App() {
  // --- 全局 Toast 通知狀態 ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const toastRef = useRef(null);

  // ✦ Toast 進退場 GSAP 動畫控制
  useGSAP(() => {
    if (toast.show) {
      gsap.fromTo(toastRef.current,
        { y: 40, autoAlpha: 0, scale: 0.95 },
        { 
          y: 0, 
          autoAlpha: 1, 
          scale: 1,
          duration: 0.5, 
          ease: "back.out(1.5)",
          overwrite: "auto"
        }
      );
    } else {
      gsap.to(toastRef.current,
        { 
          y: 20, 
          autoAlpha: 0, 
          scale: 0.95,
          duration: 0.4, 
          ease: "power3.in",
          overwrite: "auto"
        }
      );
    }
  }, { dependencies: [toast.show] });

  // --- ⛩ V5.9 蒙太奇門禁解鎖狀態 ---
  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('vault_unlocked') === 'true';
    } catch (e) {
      return false;
    }
  });

  // --- 沉浸式大圖細部縮放狀態 (V5.8) ---
  const [activeZoomLook, setActiveZoomLook] = useState(null);

  // --- 左半屏 (Runway Side) 狀態 ---
  const [runwayLooks, setRunwayLooks] = useState([]);
  const [runwayLoading, setRunwayLoading] = useState(false);
  const [currentDesigner, setCurrentDesigner] = useState(() => {
    try {
      const saved = localStorage.getItem('silent_archive_shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0].value;
      }
    } catch (e) {
      console.error("無法動態讀取初始預設品牌:", e);
    }
    return 'maison-margiela';
  });
  const [selectedLookId, setSelectedLookId] = useState(null);

  // V5.3 跨季度時光機狀態
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState('');
  const [runwayFading, setRunwayFading] = useState(false);

  // V5.5 秀場外部影音與原始報導連結狀態
  const [sourceUrl, setSourceUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // V5.4 極簡動態快捷推薦列狀態
  const [shortcuts, setShortcuts] = useState(() => {
    try {
      const saved = localStorage.getItem('silent_archive_shortcuts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("無法加載本地快捷列數據:", e);
    }
    return [
      { label: 'KIKO KOSTADINOV', value: 'kiko-kostadinov' },
      { label: 'ACNE STUDIOS', value: 'acne-studios' },
      { label: 'MAISON MARGIELA', value: 'maison-margiela' }
    ];
  });

  // 同步寫入 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('silent_archive_shortcuts', JSON.stringify(shortcuts));
    } catch (e) {
      console.error("無法寫入本地快捷列數據:", e);
    }
  }, [shortcuts]);

  // --- 右半屏 (The Vault) 策展持久化狀態 (V6.1 - Supabase 雲端資料庫) ---
  const [archivedLooks, setArchivedLooks] = useState([]);

  // V7.0 Oracle Vision AI 正在解析中的 Look ID 集合
  const [analyzingIds, setAnalyzingIds] = useState(new Set());

  // ⏳ 從 Supabase 雲端資料庫拉取收藏的 Looks
  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const { data, error } = await supabase
          .from('archived_looks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          // 確保每個 item 的 tags 是陣列且 note 是字串
          const parsed = data.map(item => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : [],
            note: typeof item.note === 'string' ? item.note : ''
          }));
          setArchivedLooks(parsed);
        } else if (error) {
          console.error("Supabase 讀取錯誤:", error);
        }
      } catch (err) {
        console.error("Supabase 載入異常:", err);
      }
    };
    fetchArchived();
  }, []);



  // ==========================================
  // 左半屏 Runway 秀場異步加載
  // ==========================================

  // 1. [RUNWAY API] 獲取 Vogue Runway 秀場 Looks
  const fetchRunwayLooks = async (designerName, targetSeason = null) => {
    if (!designerName.trim()) return;
    
    // ⏳ 觸發 GPU 硬件加速的 300ms 淡出過渡
    setRunwayFading(true);
    setRunwayLoading(true);
    
    const searchSlug = designerName.trim().toLowerCase();
    
    try {
      console.log(`🔍 [V5.3] 向後端請求時光機數據: ${searchSlug}, 季度: ${targetSeason || '預設最新'}`);
      
      let url = `${BASE_URL}/runway-looks?designer=${encodeURIComponent(searchSlug)}`;
      if (targetSeason) {
        url += `&season=${encodeURIComponent(targetSeason)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        // 先給予淡出動畫 150ms 充分展示時間，隨後更新數據，避免畫面瞬切生硬
        setTimeout(() => {
          setRunwayLooks(data.looks || []);
          setCurrentDesigner(data.designer || searchSlug);
          setCurrentSeason(data.season || targetSeason || "未知季度");
          setSourceUrl(data.source_url || '');
          setVideoUrl(data.video_url || '');
          
          // 如果是一次性初次載入品牌 (無特定季度參數)，後端會回傳 seasons 列表
          if (!targetSeason && data.seasons) {
            setSeasons(data.seasons);
          }
          
          setSelectedLookId(null); // 切換季度時重置高亮 Looks
          
          // 數據更新完成後，以 300ms 流暢淡入
          setTimeout(() => {
            setRunwayFading(false);
          }, 50);
        }, 150);
        
        if (isUnlocked) {
          showToast(`ARCHIVE LOADED // ${data.season.toUpperCase()}`, 'success');
        }
      } else {
        showToast(data.error || "無法獲取時裝屋秀圖", 'error');
        setRunwayFading(false);
      }
    } catch (error) {
      console.error("Fetch runway error:", error);
      showToast("時裝金庫連線超時", 'error');
      setRunwayFading(false);
    } finally {
      setRunwayLoading(false);
    }
  };

  // 季度時光機切換回呼
  const handleSelectSeason = (seasonName) => {
    fetchRunwayLooks(currentDesigner, seasonName);
  };

  // V5.4 新增快捷列品牌
  const handleAddShortcut = (designerSlug) => {
    if (!designerSlug) return;
    const value = designerSlug.trim().toLowerCase();
    
    if (shortcuts.length >= 8) {
      showToast("SHORTCUT LIMIT REACHED (MAX 8)", "error");
      return;
    }
    
    const isExist = shortcuts.some(s => s.value === value);
    if (isExist) return;
    
    const label = value.replace(/-/g, ' ').toUpperCase();
    setShortcuts(prev => [...prev, { label, value }]);
    showToast(`ADDED TO SHORTCUTS // ${label}`, "success");
  };

  // V5.4 刪除快捷列品牌
  const handleDeleteShortcut = (value) => {
    setShortcuts(prev => prev.filter(s => s.value !== value));
    showToast("SHORTCUT REMOVED");
  };

  // 品牌快捷列重新排序
  const handleReorderShortcuts = (newShortcuts) => {
    setShortcuts(newShortcuts);
  };

  // ==========================================
  // V7.0 Oracle Vision AI 視覺引擎分析
  // ==========================================
  const triggerOracleAnalysis = async (insertedLook) => {
    if (!insertedLook || !insertedLook.id) return;
    
    // 1. 將該 ID 加到解析中集合
    setAnalyzingIds(prev => {
      const next = new Set(prev);
      next.add(insertedLook.id);
      return next;
    });
    
    try {
      console.log(`🤖 [ORACLE] 啟動 AI 視覺分析: ${insertedLook.id}`);
      
      const response = await fetch('http://127.0.0.1:5001/api/oracle-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: insertedLook.image_url })
      });
      
      if (response.ok) {
        const resData = await response.json();
        const rawTags = resData.tags || [];
        
        // 格式化 AI 標籤：全大寫、去 #、加上 ✦ 前綴
        const aiTags = rawTags.map(tag => {
          const clean = tag.replace(/^#/, '').trim().toUpperCase().replace(/\s+/g, '_');
          return `✦${clean}`;
        });
        
        if (aiTags.length > 0) {
          // 獲取最新狀態，防範使用者在此期間自己手動新增了標籤
          setArchivedLooks(prev => {
            const currentLook = prev.find(item => item.id === insertedLook.id);
            if (!currentLook) return prev;
            
            // 併入 AI 標籤 (去重)
            const existingTags = currentLook.tags || [];
            const mergedTags = Array.from(new Set([...existingTags, ...aiTags]));
            
            // 非同步發送 Supabase 更新
            supabase
              .from('archived_looks')
              .update({ tags: mergedTags })
              .eq('id', insertedLook.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Supabase 更新 AI 標籤失敗:", error);
                } else {
                  console.log("Supabase 雲端 AI 標籤附加同步完成!");
                }
              });
              
            return prev.map(item => item.id === insertedLook.id ? { ...item, tags: mergedTags } : item);
          });
          
          showToast("ORACLE FASHION ANALYSIS COMPLETE", "success");
        }
      } else {
        console.error("Oracle API 回傳異常");
      }
    } catch (err) {
      console.error("Oracle 視覺解析異步執行出錯:", err);
    } finally {
      // 3. 自解析中集合移除該 ID
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(insertedLook.id);
        return next;
      });
    }
  };

  // ==========================================
  // 右半屏 Curator's Vault 策展核心邏輯 (V6.1 - Supabase 雲端同步)
  // ==========================================

  // 2. 點擊 `+ CURATE` 加入私人策展情緒板 (寫入 Supabase)
  const handleCurateLook = async (look) => {
    const { designer, season, look_number, image_url, source_url, instagram_handle } = look;
    
    // 🔍 查重：避免重複收藏同一品牌同一季度同一個 Look 序號
    const isAlreadyCurated = archivedLooks.some(
      item => 
        item.designer.toLowerCase() === designer.toLowerCase() &&
        item.season.toLowerCase() === season.toLowerCase() &&
        item.look_number === look_number
    );

    if (isAlreadyCurated) {
      showToast("LOOK ALREADY CURATED", "info");
      return;
    }

    const newLook = {
      designer,
      season,
      look_number,
      image_url,
      source_url: sourceUrl || source_url || '',
      instagram_handle: instagram_handle || '',
      note: '',
      tags: []
    };

    try {
      const { data, error } = await supabase
        .from('archived_looks')
        .insert([newLook])
        .select();

      if (!error && data && data.length > 0) {
        const inserted = data[0];
        setArchivedLooks(prev => [inserted, ...prev]);
        showToast("LOOK LOCKED TO VAULT", "success");
        
        // 🧬 V7.0 啟動 AI 視覺引擎非同步分析
        triggerOracleAnalysis(inserted);
      } else {
        console.error("Supabase 新增錯誤:", error);
        showToast("同步雲端失敗", "error");
      }
    } catch (err) {
      console.error("Supabase 新增異常:", err);
      showToast("同步雲端出錯", "error");
    }
  };

  // 3. 點擊 `[ - REMOVE ]` 從私人策展庫中移除 Look (從 Supabase 刪除)
  const handleRemoveLook = async (look) => {
    const { id, designer, season, look_number } = look;
    
    try {
      // 支援用 UUID 或是複合欄位進行刪除
      const query = id 
        ? supabase.from('archived_looks').delete().eq('id', id)
        : supabase.from('archived_looks').delete()
            .eq('designer', designer)
            .eq('season', season)
            .eq('look_number', look_number);

      const { error } = await query;
      
      if (!error) {
        setArchivedLooks(prev => 
          prev.filter(
            item => id 
              ? item.id !== id 
              : !(item.designer.toLowerCase() === designer.toLowerCase() &&
                  item.season.toLowerCase() === season.toLowerCase() &&
                  item.look_number === look_number)
          )
        );
        showToast("LOOK RELEASED FROM VAULT");
      } else {
        console.error("Supabase 刪除錯誤:", error);
        showToast("從雲端釋放失敗", "error");
      }
    } catch (err) {
      console.error("Supabase 刪除異常:", err);
      showToast("從雲端釋放出錯", "error");
    }
  };

  // 4. 更新 Look 的自訂標籤 (V6.1 支援以 UUID 或複合屬性非同步更新)
  const handleUpdateLooksTags = async (idOrDesigner, seasonOrTags, lookNumber, maybeTags) => {
    let id = null;
    let newTags = [];
    
    if (Array.isArray(seasonOrTags)) {
      // 呼叫方式：handleUpdateLooksTags(id, newTags)
      id = idOrDesigner;
      newTags = seasonOrTags;
    } else {
      // 呼叫方式：handleUpdateLooksTags(designer, season, lookNumber, newTags)
      const designer = idOrDesigner;
      const season = seasonOrTags;
      const look = archivedLooks.find(
        item => 
          item.designer.toLowerCase() === designer.toLowerCase() &&
          item.season.toLowerCase() === season.toLowerCase() &&
          item.look_number === lookNumber
      );
      if (look) id = look.id;
      newTags = maybeTags || [];
    }

    if (!id) return;

    try {
      const { error } = await supabase
        .from('archived_looks')
        .update({ tags: newTags })
        .eq('id', id);

      if (!error) {
        setArchivedLooks(prev => 
          prev.map(item => item.id === id ? { ...item, tags: newTags } : item)
        );
      } else {
        console.error("Supabase 更新標籤錯誤:", error);
        showToast("標籤同步失敗", "error");
      }
    } catch (err) {
      console.error("Supabase 更新標籤異常:", err);
    }
  };

  // 5. 更新 Look 的自訂備註 (V6.1 支援以 UUID 或複合屬性非同步更新)
  const handleUpdateLooksNote = async (idOrDesigner, seasonOrNote, lookNumber, maybeNote) => {
    let id = null;
    let newNote = '';

    if (typeof seasonOrNote === 'string' && lookNumber === undefined && maybeNote === undefined) {
      // 呼叫方式：handleUpdateLooksNote(id, newNote)
      id = idOrDesigner;
      newNote = seasonOrNote;
    } else {
      // 呼叫方式：handleUpdateLooksNote(designer, season, lookNumber, newNote)
      const designer = idOrDesigner;
      const season = seasonOrNote;
      const look = archivedLooks.find(
        item => 
          item.designer.toLowerCase() === designer.toLowerCase() &&
          item.season.toLowerCase() === season.toLowerCase() &&
          item.look_number === lookNumber
      );
      if (look) id = look.id;
      newNote = maybeNote || '';
    }

    if (!id) return;

    try {
      const { error } = await supabase
        .from('archived_looks')
        .update({ note: newNote })
        .eq('id', id);

      if (!error) {
        setArchivedLooks(prev => 
          prev.map(item => item.id === id ? { ...item, note: newNote } : item)
        );
      } else {
        console.error("Supabase 更新筆記錯誤:", error);
        showToast("筆記同步失敗", "error");
      }
    } catch (err) {
      console.error("Supabase 更新筆記異常:", err);
    }
  };

  // ==========================================
  // 初始化與生命週期
  // ==========================================
  useEffect(() => {
    // 預設動態載入快捷列第一個品牌（左到右順序），確保解鎖後首頁與選單第一位完全對齊
    const initialDesigner = shortcuts.length > 0 ? shortcuts[0].value : 'maison-margiela';
    fetchRunwayLooks(initialDesigner);
  }, []);

  // 全局 Toast 提示調度
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* 雙屏核心佈局，完美融合左側 Runway 秀場與右側 私人策展情緒板 */}
      <SplitViewLayout
        // 左半屏 Runway 屬性
        runwayLooks={runwayLooks}
        runwayLoading={runwayLoading}
        onFetchRunway={fetchRunwayLooks}
        currentDesigner={currentDesigner}
        selectedLookId={selectedLookId}
        onSelectLook={setSelectedLookId}
        sourceUrl={sourceUrl}
        videoUrl={videoUrl}
        onZoom={setActiveZoomLook}

        // 右半屏 Curator's Vault 屬性 (V5.1/5.2)
        archivedLooks={archivedLooks}
        onCurateLook={handleCurateLook}
        onRemoveLook={handleRemoveLook}
        onUpdateTags={handleUpdateLooksTags}
        onUpdateNote={handleUpdateLooksNote}
        analyzingIds={analyzingIds}
        
        // V5.3 跨季度時光機屬性
        seasons={seasons}
        currentSeason={currentSeason}
        onSelectSeason={handleSelectSeason}
        runwayFading={runwayFading}
        
        // V5.4 極極推薦屬性
        shortcuts={shortcuts}
        onAddShortcut={handleAddShortcut}
        onDeleteShortcut={handleDeleteShortcut}
        onReorderShortcuts={handleReorderShortcuts}
      />

      {/* 🔍 V5.8 全螢幕沉浸式細部放大鏡 Portal */}
      {activeZoomLook && (
        <ImmersiveZoom
          look={activeZoomLook}
          onClose={() => setActiveZoomLook(null)}
          onCurate={handleCurateLook}
          isAlreadyCurated={
            archivedLooks.some(
              item => 
                item.designer.toLowerCase() === activeZoomLook.designer.toLowerCase() &&
                item.season.toLowerCase() === activeZoomLook.season.toLowerCase() &&
                item.look_number === activeZoomLook.look_number
            )
          }
          videoUrl={videoUrl}
        />
      )}

      {/* ⛩ V5.9 蒙太奇門禁系統 Portal */}
      <AccessGate isUnlocked={isUnlocked} setIsUnlocked={setIsUnlocked} />

      {/* 全局冷淡美學 Toast 通知 */}
      <div 
        ref={toastRef}
        className={`fixed bottom-10 right-10 px-8 py-4 rounded-none shadow-2xl z-[100] font-sans font-black text-xs tracking-widest uppercase border ${
          toast.type === 'error' 
            ? 'bg-red-500 border-red-600 text-white' 
            : 'bg-neutral-900 border-neutral-800 text-white'
        }`}
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {toast.message}
      </div>
    </div>
  );
}

export default App;
