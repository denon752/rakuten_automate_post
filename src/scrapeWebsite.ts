import puppeteer from "puppeteer";
import os from "os";
import path from "path";
import { generateProductDescription } from "./generateProductDescription";

const scrapeWebsite = async (
  url: string,
  catchcopy: string,
  itemName: string,
  itemCaption: string // 4つ目の引数も受け取れるように調整
) => {
  console.log("-----------------------------------------------");
  console.log("処理開始:" + new Date().toLocaleString());

  // 環境変数の取得（念のためフォールバック設定）
  const userId = process.env.RAKUTEN_USER_EMAIL || process.env.USER_ID || "";
  const password = process.env.RAKUTEN_USER_PASSWORD || process.env.USER_PASSWORD || "";

  // --- ログイン情報を保存するディレクトリ ---
  // プロジェクト直下の user_data フォルダに保存するように設定（管理しやすいため）
  const userDataDir = path.join(process.cwd(), "user_data");

  const browser = await puppeteer.launch({ 
    headless: true, // 動作確認のため
    userDataDir: userDataDir, // 💡 これがポイント：ログイン情報を保持
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // 自動操作判定を回避
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  // ユーザーエージェントを固定
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");

  try {
    console.log("ターゲットURLへアクセス中...");
    await page.goto(url, { waitUntil: 'networkidle2' });

    // --- 1. ログイン状態のチェックと処理 ---
    const idSelector = 'input[aria-label*="ユーザID"], #login_id, #loginInner_u';
    
    try {
      // 3秒間だけID入力欄を探す（存在しなければログイン済みとみなす）
      await page.waitForSelector(idSelector, { visible: true, timeout: 3000 });
      
      console.log("🔑 ログインが必要です。入力を開始します...");
      await page.type(idSelector, userId, { delay: 50 });

      // 「次へ」または「ログイン」ボタン
      const nextButtons = ['button[type="submit"]', 'input[type="submit"]', '.loginButton', '#login_next_btn'];
      let clickedNext = false;
      for (const selector of nextButtons) {
        const btn = await page.$(selector);
        if (btn) {
          await Promise.all([
            page.click(selector),
            page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
          ]);
          clickedNext = true;
          break;
        }
      }
      if (!clickedNext) await page.keyboard.press('Enter');

      // パスワード入力（ページ遷移後に存在を確認）
      const passSelector = 'input[type="password"], #loginInner_p';
      await page.waitForSelector(passSelector, { visible: true, timeout: 5000 });
      await page.type(passSelector, password, { delay: 50 });
      
      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
      ]);
      console.log("✅ ログイン処理が完了しました。");

    } catch (e) {
      console.log("✨ すでにログイン済みか、保存されたセッションを使用します。");
    }

    // --- 2. 既に「コレ！」済みかチェック ---
    try {
      const alreadyCollected = await page.$(".modal-dialog-container");
      if (alreadyCollected) {
        console.log("👉 この商品はすでにコレ！済みです。");
        await browser.close();
        return false;
      }
    } catch (e) {}

    // --- 3. AI紹介文生成（404エラー対策のガードレール） ---
    console.log("AI紹介文を準備中...");
    let descriptionText = "";
    try {
      const productDescription = await generateProductDescription(catchcopy, itemName, itemCaption);
      descriptionText = productDescription?.slice(0, 500) || "";
    } catch (apiError) {
      // Gemini APIが404などのエラーを出した場合の固定文
      console.error("❌ AI生成に失敗しました（404等）。固定文に切り替えます。");
      descriptionText = `${itemName}\n\nおすすめのアイテムを見つけました！✨\n${catchcopy}\n\n#楽天ROOM #お買い物`;
    }

    // --- 4. 投稿処理 ---
    const commentBox = "#collect-content";
    await page.waitForSelector(commentBox, { visible: true, timeout: 10000 });
    
    // 既存テキストのクリア
    await page.click(commentBox);
    await page.focus(commentBox);
    await page.evaluate((selector) => {
      const el = document.querySelector(selector) as HTMLTextAreaElement;
      if (el) el.value = '';
    }, commentBox);
    
    // 入力
    await page.type(commentBox, descriptionText, { delay: 10 });

    // 完了ボタンをクリック
    await page.waitForSelector("button", { visible: true });
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent?.includes('完了') || b.textContent?.includes('投稿'));
      if (target) {
        (target as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log("🚀 投稿完了ボタンをクリックしました！");
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

  } catch (error) {
    console.error("❌ 実行中にエラーが発生しました:", error);
  } finally {
    await browser.close();
  }

  return true;
};

export default scrapeWebsite;