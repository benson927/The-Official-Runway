import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

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

  const [montageImages, setMontageImages] = useState(MONTAGE_IMAGES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMontageActive, setIsMontageActive] = useState(true);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [lockState, setLockState] = useState('LOCKED'); // LOCKED | GRANTED | DENIED
  const inputRef = useRef(null);
  const gateRef = useRef(null);

  useGSAP(() => {
    if (lockState === 'GRANTED') {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsUnlocked(true);
        }
      });
      tl.to('.gate-center-ui', {
        opacity: 0,
        scale: 0.92,
        duration: 0.4,
        ease: "power2.out"
      });
      tl.to('.gate-left', {
        xPercent: -100,
        duration: 1.2,
        ease: "power4.inOut"
      }, "-=0.2");
      tl.to('.gate-right', {
        xPercent: 100,
        duration: 1.2,
        ease: "power4.inOut"
      }, "-=1.2");
    }
  }, { dependencies: [lockState] });

  // 1. 圖片打亂與預加載 (Preload)，避免極速蒙太奇閃白屏，極致優化效能與隨機藝術性
  useEffect(() => {
    if (isUnlocked) return;
    
    // Fisher-Yates Shuffle 演算法
    const shuffleArray = (array) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const shuffled1 = shuffleArray(UNIQUE_MONTAGE_IMAGES);
    const shuffled2 = shuffleArray(UNIQUE_MONTAGE_IMAGES);
    const shuffled3 = shuffleArray(UNIQUE_MONTAGE_IMAGES).slice(0, 5);
    const shuffledMontage = [...shuffled1, ...shuffled2, ...shuffled3];
    
    setMontageImages(shuffledMontage);

    UNIQUE_MONTAGE_IMAGES.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [isUnlocked]);

  // 2. 蒙太奇閃影 120ms 高速電影級循環
  useEffect(() => {
    if (isUnlocked || !isMontageActive) return;

    const montageTimer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % montageImages.length);
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

    // 優先取得本地自訂密碼，次之讀取環境變數，最後為預設 "BENSON"
    const localPasscode = localStorage.getItem('vault_custom_passcode');
    const targetPasscode = localPasscode || import.meta.env.VITE_VAULT_PASSCODE || "BENSON";

    // 密碼正確：觸發 GRANTED 解鎖
    if (value.toUpperCase() === targetPasscode.toUpperCase()) {
      setLockState('GRANTED');
      try {
        sessionStorage.setItem('vault_unlocked', 'true');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 4. 處理按下 Enter 時密碼錯誤的比對反饋
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const localPasscode = localStorage.getItem('vault_custom_passcode');
      const targetPasscode = localPasscode || import.meta.env.VITE_VAULT_PASSCODE || "BENSON";
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
      ref={gateRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none bg-transparent overflow-hidden"
    >
      <div 
        className="gate-left absolute left-0 top-0 w-1/2 h-full bg-[#F5F5F5] dark:bg-[#0A0A0A] border-r border-neutral-200/20 dark:border-neutral-800/40 z-0 transition-colors duration-500"
        style={{ willChange: 'transform' }}
      />
      <div 
        className="gate-right absolute right-0 top-0 w-1/2 h-full bg-[#F5F5F5] dark:bg-[#0A0A0A] z-0 transition-colors duration-500"
        style={{ willChange: 'transform' }}
      />
      
      {isMontageActive && (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-75 scale-110 opacity-30"
            style={{
              backgroundImage: `url(${montageImages[activeIndex]})`,
              filter: 'grayscale(100%) blur(40px) brightness(0.5)'
            }}
          />

          <div className="absolute left-[6vw] md:left-[8vw] top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none z-10 select-none">
            <span 
              className="text-[10vh] font-serif font-black tracking-[0.4em] text-white/[0.02] uppercase select-none" 
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            >
              SILENT
            </span>
            <div className="h-16 w-[1px] bg-white/10 my-4" />
            <span 
              className="text-[7.5px] font-serif tracking-[0.25em] text-white/20 uppercase whitespace-nowrap" 
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            >
              KIKO KOSTADINOV // RTW F26
            </span>
          </div>

          <div 
            className="relative h-[80vh] aspect-[2/3] bg-cover bg-center border border-white/10 shadow-2xl transition-all duration-75 rounded-sm z-20"
            style={{
              backgroundImage: `url(${montageImages[activeIndex]})`,
              filter: 'grayscale(100%) contrast(150%) brightness(0.9)'
            }}
          />

          <div className="absolute right-[6vw] md:right-[8vw] top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none z-10 select-none">
            <span 
              className="text-[10vh] font-serif font-black tracking-[0.4em] text-white/[0.02] uppercase select-none" 
              style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
            >
              ARCHIVE
            </span>
            <div className="h-16 w-[1px] bg-white/10 my-4" />
            <span 
              className="text-[7.5px] font-serif tracking-[0.25em] text-white/20 uppercase whitespace-nowrap" 
              style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
            >
              "WE ARCHIVE THE ARCHITECTURE OF DESIRE."
            </span>
          </div>
        </div>
      )}

      {!isMontageActive && (
        <div className="gate-center-ui flex flex-col items-center text-center gap-6 animate-fade-in select-none z-10 relative">
          <span className="text-neutral-300 dark:text-neutral-700 text-3xl font-serif mb-2 select-none">✦</span>
          
          <div className="relative w-72 flex flex-col items-center border-b border-dashed border-neutral-300 dark:border-neutral-800 focus-within:border-neutral-900 dark:focus-within:border-[#F5F5F5] transition-colors duration-500 pb-2">
            <input
              ref={inputRef}
              type="password"
              value={passcodeInput}
              onChange={handlePasscodeChange}
              onKeyDown={handleKeyDown}
              disabled={lockState === 'GRANTED' || lockState === 'DENIED'}
              placeholder="••••"
              className="w-full text-center font-sans font-black text-2xl tracking-[0.4em] uppercase border-none outline-none bg-transparent text-neutral-800 dark:text-[#F5F5F5] placeholder-neutral-200 dark:placeholder-neutral-800 transition-all duration-300"
              style={{
                letterSpacing: passcodeInput ? '0.45em' : '0.2em'
              }}
            />
          </div>

          <div className="h-6 flex items-center justify-center">
            {lockState === 'LOCKED' && (
              <span className="font-sans text-xs font-black text-neutral-400 dark:text-neutral-500 tracking-[0.3em] uppercase animate-pulse">
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
