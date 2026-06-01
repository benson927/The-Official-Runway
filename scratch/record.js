import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const videoDir = join(__dirname, 'videos');

async function run() {
  console.log('🚀 啟動自動化演示錄影...');
  
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();
  
  try {
    // 1. 導航至本地網址
    console.log('📌 導航至 http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/');
    
    // 2. 靜候 3.5 秒展示首頁的 25 幀高速黑白時裝 Looks 蒙太奇閃影
    console.log('⏳ 播放高速蒙太奇閃影中...');
    await page.waitForTimeout(3800);
    
    // 3. 輸入錯誤密碼，展示直角 Brutalist 錯誤反饋
    console.log('🔑 輸入錯誤密碼測試...');
    const inputSelector = 'input[type="password"]';
    await page.fill(inputSelector, 'WRONGKEY');
    await page.press(inputSelector, 'Enter');
    await page.waitForTimeout(2000); // 展示 ACCESS DENIED
    
    // 4. 輸入正確密碼解鎖，進入主畫面
    console.log('🔑 輸入正確密碼 BENSON 解鎖...');
    await page.fill(inputSelector, 'BENSON');
    await page.waitForTimeout(1800); // 等待解鎖與左右閘門拉開動畫完成
    
    // 5. 展示 Runway 秀場與切換快捷推薦品牌 (Acne Studios)
    console.log('👗 切換至 ACNE STUDIOS 秀場...');
    // 尋找快捷推薦列中包含 ACNE 的按鈕
    await page.click('button:has-text("ACNE")');
    await page.waitForTimeout(2500); // 展示暗房顯影動畫 (Darkroom Reveal)
    
    // 6. 模擬滑鼠在圖片上滑動，觸發物理推擠特效 (The Fluid Grid)
    console.log('🌀 模擬滑鼠軌跡觸發物理推擠特效...');
    for (let i = 0; i <= 5; i++) {
      const x = 200 + i * 150;
      const y = 300 + (i % 2 === 0 ? 50 : -50);
      await page.mouse.move(x, y);
      await page.waitForTimeout(100);
    }
    await page.mouse.move(10, 10); // 移開滑鼠
    await page.waitForTimeout(1000);
    
    // 7. 使用搜尋欄檢索 PRADA
    console.log('🔍 檢索 PRADA 秀場...');
    const searchSelector = 'input[placeholder="SEARCH DESIGNER ARCHIVE"]';
    await page.click(searchSelector);
    await page.fill(searchSelector, 'PRADA');
    await page.press(searchSelector, 'Enter');
    await page.waitForTimeout(3000); // 等待 PRADA Looks 的加載與顯影
    
    // 8. 捲動至底部展示 Prada Margelia Spec 呼吸紅點
    console.log('📜 捲動至頁面底部展示 Margelia Spec 與 Devil\'s Pulse...');
    await page.evaluate(() => {
      const scrollable = document.querySelector('.custom-scrollbar');
      if (scrollable) {
        scrollable.scrollTo({ top: scrollable.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(3000); // 停留展示呼吸紅點
    
    // 捲動回頂端
    console.log('📜 捲動回頁面頂端...');
    await page.evaluate(() => {
      const scrollable = document.querySelector('.custom-scrollbar');
      if (scrollable) {
        scrollable.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(1500);

    // 9. 點擊第一張卡片，進入 Immersive Zoom 沉浸式大圖
    console.log('👁 點擊第一張卡片進入沉浸式大圖...');
    const firstCardImage = await page.locator('.defrost-card-img').first();
    await firstCardImage.click();
    await page.waitForTimeout(2500); // 停留展示放大鏡細節與 Spec
    
    // 關閉大圖
    console.log('👁 關閉沉浸式大圖...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 10. 將卡片加入金庫策展板 (Curate)
    console.log('🔒 策展卡片加入金庫...');
    // 滑鼠移到第一張卡片上，讓 [+ CURATE] 按鈕顯現並點擊它
    const firstCard = await page.locator('.runway-card-gsap').first();
    await firstCard.hover();
    await page.waitForTimeout(500);
    const curateButton = await firstCard.locator('button:has-text("CURATE")');
    if (await curateButton.isVisible()) {
      await curateButton.click();
      console.log('   -> 第一張卡片已點擊 CURATE');
    }
    await page.waitForTimeout(1500); // 等待 Toast 提示

    // 11. 切換至 [ THE VAULT ] 看板
    console.log('🏛 切換至 [ THE VAULT ] 看板...');
    await page.click('button:has-text("[ THE VAULT ]")');
    await page.waitForTimeout(2500); // 展示情緒板與標籤篩選列
    
    // 12. 演示一鍵切換 Noir 消光暗黑模式
    console.log('🖤 切換至 [ NOIR_ ] 暗黑模式...');
    await page.click('button:has-text("[ NOIR_ ]")');
    await page.waitForTimeout(2500); // 停留展示消光黑極致美學
    
    console.log('🤍 切換至 [ LIGHT_ ] 明亮模式...');
    await page.click('button:has-text("[ LIGHT_ ]")');
    await page.waitForTimeout(2000);
    
    console.log('🖤 再次切換至 [ NOIR_ ] 暗黑模式...');
    await page.click('button:has-text("[ NOIR_ ]")');
    await page.waitForTimeout(2000);
    
    // 13. 點擊 [ EXPORT BOOK ] 演示排冊導出
    console.log('📄 點擊 [ EXPORT BOOK ] 演示列印排冊...');
    // 監聽彈出的視窗
    const popupPromise = page.waitForEvent('popup');
    await page.click('button:has-text("[ EXPORT BOOK ]")');
    
    const popup = await popupPromise;
    await popup.waitForLoadState();
    console.log('   -> 畫冊導出頁面已開啟，等待列印渲染...');
    await popup.waitForTimeout(3000); // 讓觀眾在影片中看清楚排版與 Footer Benson 開發標示
    await popup.close();
    
    await page.waitForTimeout(1500);
    console.log('🎉 演示流程錄製完成！');
    
  } catch (error) {
    console.error('❌ 錄影過程出錯:', error);
  } finally {
    await context.close();
    await browser.close();
    console.log('💾 影片檔案已成功儲存。');
  }
}

run();
