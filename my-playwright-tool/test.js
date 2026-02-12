const { chromium } = require('playwright');

(async () => {
  // 1. ブラウザを起動（GUIを表示するため headless: false）
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized'] // ブラウザを最大化して起動
  });

  // 2. ブラウザコンテキストを作成
  const context = await browser.newContext({
    viewport: null, // 最大化したサイズに合わせる
    locale: 'ja-JP',
  });

  // 3. 【重要】Playwrightのレコーダー（codegen）を有効化
  // mode: 'recording' を指定することで、操作内容が Inspector に記録されます
  await context._enableRecorder({
    language: 'javascript', // 生成する言語
    outputFile: 'rakuten-room-test.js' // 操作を保存するファイル名
  });

  // 4. 楽天ROOMの指定されたURLを開く
  const page = await context.newPage();
  console.log('楽天ROOMのページを開いています...');
  await page.goto('https://room.rakuten.co.jp/discover/recommendItems');

  console.log('--------------------------------------------------');
  console.log('💡 使い方:');
  console.log('1. ブラウザ上で要素をクリックしたり入力したりしてください。');
  console.log('2. 別ウィンドウの「Playwright Inspector」にコードが生成されます。');
  console.log('3. ブラウザを閉じるとスクリプトが終了します。');
  console.log('--------------------------------------------------');

  // 5. ブラウザが閉じられるまで待機
  await page.waitForEvent('close', { timeout: 0 });
  
  await browser.close();
  console.log('保存完了: rakuten-room-test.js を確認してください。');
})();