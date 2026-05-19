import React, { useState, useEffect, useRef } from 'react';

// 🏛 V5.9 蒙太奇閃影高清時裝大圖圖源 (來自 Kiko Kostadinov 經典季度)
const UNIQUE_MONTAGE_IMAGES = [
  "https://assets.vogue.com/photos/69aeef4673189b9dc4fd7e98/master/w_1024,c_limit/00001-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef476a5ccf690089fd4b/master/w_1024,c_limit/00002-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef4718fd9b971da1ddc8/master/w_1024,c_limit/00003-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef49980af232ee2199a2/master/w_1024,c_limit/00004-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef4a9710aebeb3563630/master/w_1024,c_limit/00005-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef4b7984a2f576403547/master/w_1024,c_limit/00006-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef4cc6f15e4da6f6dacb/master/w_1024,c_limit/00007-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef4d0796f0a571e9e397/master/w_1024,c_limit/00008-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef4e25ce679068f2c11e/master/w_1024,c_limit/00009-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "https://assets.vogue.com/photos/69aeef4f442e789e876fce9e/master/w_1024,c_limit/00010-kiko-kostadinov-fall-2026-ready-to-wear-credit-gorunway.jpg"
];

// 為了實現持續 3.0 秒且維持 120ms 高速閃影，我們將這 10 張獨特圖片以打亂的順序重組為 25 幀的蒙太奇時間軸
const MONTAGE_IMAGES = [
  UNIQUE_MONTAGE_IMAGES[0], UNIQUE_MONTAGE_IMAGES[2], UNIQUE_MONTAGE_IMAGES[4], UNIQUE_MONTAGE_IMAGES[6], UNIQUE_MONTAGE_IMAGES[8],
  UNIQUE_MONTAGE_IMAGES[1], UNIQUE_MONTAGE_IMAGES[3], UNIQUE_MONTAGE_IMAGES[5], UNIQUE_MONTAGE_IMAGES[7], UNIQUE_MONTAGE_IMAGES[9],
  UNIQUE_MONTAGE_IMAGES[0], UNIQUE_MONTAGE_IMAGES[4], UNIQUE_MONTAGE_IMAGES[1], UNIQUE_MONTAGE_IMAGES[7], UNIQUE_MONTAGE_IMAGES[3],
  UNIQUE_MONTAGE_IMAGES[8], UNIQUE_MONTAGE_IMAGES[2], UNIQUE_MONTAGE_IMAGES[6], UNIQUE_MONTAGE_IMAGES[5], UNIQUE_MONTAGE_IMAGES[9],
  UNIQUE_MONTAGE_IMAGES[1], UNIQUE_MONTAGE_IMAGES[4], UNIQUE_MONTAGE_IMAGES[7], UNIQUE_MONTAGE_IMAGES[0], UNIQUE_MONTAGE_IMAGES[8]
];

/**
 * AccessGate — 蒙太奇金庫門禁系統 (V5.9.2)
 * 
 * 核心特色：
 * 1. 應用的第一進入點。前 3.0 秒以 120ms 的高速蒙太奇頻率，極速切換 25 幀經典高清黑白對比時裝 Looks。
 * 2. 3.0秒後蒙太奇中斷，平滑 transition 至 `#F5F5F5` 大留白密碼門禁介面。
 * 3. 實作極簡無邊界密碼框，下方提示 `VAULT // LOCKED`。
 * 4. 解鎖後，文字亮起 `ACCESS GRANTED`，組件以 1.0s 的膨脹淡出動效平滑隱去，揭露底下金庫主屏。
 * 5. 使用 sessionStorage 維持解鎖狀態，重新整理免打密碼。
 */
const AccessGate = ({ isUnlocked, setIsUnlocked }) => {

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMontageActive, setIsMontageActive] = useState(true);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [lockState, setLockState] = useState('LOCKED'); // LOCKED | GRANTED | DENIED
  const inputRef = useRef(null);

  // 1. 圖片預加載 (Preload)，避免極速蒙太奇閃白屏，極致優化效能
  useEffect(() => {
    if (isUnlocked) return;
    UNIQUE_MONTAGE_IMAGES.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [isUnlocked]);

  // 2. 蒙太奇閃影 120ms 高速電影級循環
  useEffect(() => {
    if (isUnlocked || !isMontageActive) return;

    const montageTimer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % MONTAGE_IMAGES.length);
    }, 120);

    // 3.0 秒後關閉蒙太奇，平滑進入密碼解鎖介面
    const transitionTimer = setTimeout(() => {
      clearInterval(montageTimer);
      setIsMontageActive(false);
      // 自動 Focus 密碼輸入框
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 300);
    }, 3000);

    return () => {
      clearInterval(montageTimer);
      clearTimeout(transitionTimer);
    };
  }, [isUnlocked, isMontageActive]);

  // 3. 處理密碼輸入實時比對
  const handlePasscodeChange = (e) => {
    if (lockState === 'GRANTED') return;
    
    const value = e.target.value;
    setPasscodeInput(value);

    // 取得環境變數密碼，若未定義則預設為 "BENSON"
    const targetPasscode = import.meta.env.VITE_VAULT_PASSCODE || "BENSON";

    // 密碼正確：觸發 GRANTED 解鎖
    if (value.toUpperCase() === targetPasscode.toUpperCase()) {
      setLockState('GRANTED');
      try {
        sessionStorage.setItem('vault_unlocked', 'true');
      } catch (err) {
        console.error(err);
      }
      
      // 給予 400ms 展示 ACCESS GRANTED 後優雅淡出
      setTimeout(() => {
        setIsUnlocked(true);
      }, 400);
    }
  };

  // 4. 處理按下 Enter 時密碼錯誤的比對反饋
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const targetPasscode = import.meta.env.VITE_VAULT_PASSCODE || "BENSON";
      if (passcodeInput.toUpperCase() !== targetPasscode.toUpperCase()) {
        setLockState('DENIED');
        setPasscodeInput('');
        // 1.5 秒後重置回 LOCKED 狀態，允許重新輸入
        setTimeout(() => {
          setLockState('LOCKED');
          if (inputRef.current) inputRef.current.focus();
        }, 1500);
      }
    }
  };

  // 如果已解鎖且淡出動畫完成，完全不佔用 React 虛擬 DOM
  if (isUnlocked) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) select-none ${
        lockState === 'GRANTED'
          ? 'opacity-0 pointer-events-none scale-105'
          : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#F5F5F5',
        willChange: 'transform, opacity'
      }}
    >
      
      {/* 🧬 蒙太奇閃影雙重背景層 (中央 Framed Portrait + 底層高斯模糊) */}
      {isMontageActive && (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black">
          {/* 1. 底層：滿版高斯模糊光影 */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-75 scale-110 opacity-30"
            style={{
              backgroundImage: `url(${MONTAGE_IMAGES[activeIndex]})`,
              filter: 'grayscale(100%) blur(40px) brightness(0.5)'
            }}
          />
          {/* 2. 前景：中央直式黃金比例時裝框 (完整全身 Look) */}
          <div 
            className="relative h-[80vh] aspect-[2/3] bg-cover bg-center border border-white/10 shadow-2xl transition-all duration-75 rounded-sm"
            style={{
              backgroundImage: `url(${MONTAGE_IMAGES[activeIndex]})`,
              filter: 'grayscale(100%) contrast(150%) brightness(0.9)'
            }}
          />
        </div>
      )}

      {/* 🔒 金庫門禁密碼鎖中央 UI (在蒙太奇結束後平滑浮現) */}
      {!isMontageActive && (
        <div className="flex flex-col items-center text-center gap-6 animate-fade-in select-none">
          <span className="text-neutral-300 text-3xl font-serif mb-2 select-none">✦</span>
          
          <div className="relative w-72 flex flex-col items-center border-b border-dashed border-neutral-300 focus-within:border-neutral-900 transition-colors duration-500 pb-2">
            
            {/* 置中的大字距、全大寫無痕密碼輸入框 */}
            <input
              ref={inputRef}
              type="password"
              value={passcodeInput}
              onChange={handlePasscodeChange}
              onKeyDown={handleKeyDown}
              disabled={lockState === 'GRANTED' || lockState === 'DENIED'}
              placeholder="••••"
              className="w-full text-center font-sans font-black text-2xl tracking-[0.4em] uppercase border-none outline-none bg-transparent text-neutral-800 placeholder-neutral-200 transition-all duration-300"
              style={{
                letterSpacing: passcodeInput ? '0.45em' : '0.2em'
              }}
            />
          </div>

          {/* 底部金庫鎖定狀態文案 */}
          <div className="h-6 flex items-center justify-center">
            {lockState === 'LOCKED' && (
              <span className="font-sans text-xs font-black text-neutral-400 tracking-[0.3em] uppercase animate-pulse">
                VAULT // LOCKED
              </span>
            )}
            {lockState === 'GRANTED' && (
              <span className="font-sans text-xs font-black text-green-600 tracking-[0.3em] uppercase">
                ACCESS GRANTED
              </span>
            )}
            {lockState === 'DENIED' && (
              <span className="font-sans text-xs font-black text-red-500 tracking-[0.3em] uppercase animate-bounce">
                ACCESS DENIED
              </span>
            )}
          </div>

          {lockState === 'DENIED' && (
            <p className="font-sans text-[10px] font-bold text-red-400 tracking-[0.2em] uppercase leading-none">
              INCORRECT PASSCODE. PLEASE TRY AGAIN.
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default AccessGate;
