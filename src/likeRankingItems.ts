
import puppeteer from "puppeteer";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const likeRankingItems = async () => {
    console.log("-----------------------------------------------");
    console.log("いいね自動化処理開始:" + new Date().toLocaleString());

    // 環境変数の取得
    const userId = process.env.RAKUTEN_USER_EMAIL || process.env.USER_ID || "";
    const password = process.env.RAKUTEN_USER_PASSWORD || process.env.USER_PASSWORD || "";

    // ログイン情報を保持するディレクトリ
    const userDataDir = path.join(process.cwd(), "user_data");

    const browser = await puppeteer.launch({
        headless: true, // ユーザー要望によりHeadless化
        userDataDir: userDataDir,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");

    try {
        const targetUrl = "https://room.rakuten.co.jp/discover/collectItemRank";
        console.log(`アクセス中: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // --- ログイン処理 (scrapeWebsite.tsと同様) ---
        const idSelector = 'input[aria-label*="ユーザID"], #login_id, #loginInner_u';
        try {
            // 3秒待ってログイン画面かチェック
            await page.waitForSelector(idSelector, { visible: true, timeout: 3000 });
            console.log("🔑 ログインが必要です。");

            await page.type(idSelector, userId, { delay: 50 });
            const nextButtons = ['button[type="submit"]', 'input[type="submit"]', '.loginButton', '#login_next_btn'];
            let clickedNext = false;
            for (const selector of nextButtons) {
                const btn = await page.$(selector);
                if (btn) {
                    await Promise.all([
                        page.click(selector),
                        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
                    ]);
                    clickedNext = true;
                    break;
                }
            }
            if (!clickedNext) await page.keyboard.press('Enter');

            const passSelector = 'input[type="password"], #loginInner_p';
            await page.waitForSelector(passSelector, { visible: true, timeout: 5000 });
            await page.type(passSelector, password, { delay: 50 });

            await Promise.all([
                page.keyboard.press('Enter'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
            ]);
            console.log("✅ ログイン完了");
        } catch (e) {
            console.log("✨ ログイン済み、またはセッション有効");
        }

        // --- ランキングページでのいいね処理 ---
        console.log("ランキング読み込み待機中...");
        // 商品リストが読み込まれるのを待つ（セレクタは仮定）
        // 楽天ROOMのアイテムは一般的にdivやliで並んでいる。
        // 具体的なセレクタが不明なので、少しスクロールして要素が出現するのを待つ
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(resolve => setTimeout(resolve, 2000));

        // いいねボタンの特定
        // classに "like" が含まれるボタンや、SVGアイコンを探す
        // 楽天ROOMのいいねボタンは一般的に heart icon 
        // セレクタ探索のロジック
        const likeButtons = await page.$$('.icon-like, [aria-label="いいね"], svg[data-icon="heart"]');
        // Note: 正確なセレクタはサイト構造に依存するため、汎用的に探索してクリック可能か試すアプローチをとる
        // 実際にはHTMLを解析しないとわからないが、まずは button タグを全探索して "いいね" っぽいものを探すのが定石

        console.log("いいねボタンを探索します...");

        // ページ内の全ボタンを取得して判定する戦略
        const buttons = await page.$$('.icon-like, button, div[role="button"]');
        let likeCount = 0;
        // const maxLikes = 10; // 制限なしに変更

        for (const btn of buttons) {
            // if (likeCount >= maxLikes) break; // 制限なし

            // ボタンの属性や内部HTMLをチェック
            const isLikeButton = await btn.evaluate(el => {
                const html = el.innerHTML.toLowerCase();
                const label = el.getAttribute('aria-label') || '';
                // "いいね"を含む、またはハートアイコンっぽいクラス
                return label.includes('いいね') || html.includes('heart') || el.className.includes('like') || el.className.includes('icon-like');
            });

            if (isLikeButton) {
                // すでにいいね済みかチェック（アクティブなクラスがついているかなど）
                const isAlreadyLiked = await btn.evaluate(el => {
                    return el.classList.contains('active') || el.classList.contains('liked') || el.getAttribute('aria-pressed') === 'true';
                });

                if (!isAlreadyLiked) {
                    try {
                        await btn.click();
                        console.log(`❤️ いいねしました！ (Count: ${likeCount + 1})`);
                        likeCount++;
                        // 2分間隔（+誤差）
                        const waitTime = 120000 + Math.random() * 5000;
                        console.log(`⏳ 次のいいねまで ${Math.round(waitTime / 1000)}秒 待機します...`);
                        await new Promise(r => setTimeout(r, waitTime));
                    } catch (err) {
                        console.error("ボタンクリック失敗:", err);
                    }
                }
            }
        }

        if (likeCount === 0) {
            console.log("⚠️ いいねボタンが見つからないか、全ていいね済みでした。");
            // デバッグ用にHTMLの一部を保存するなどの処理が必要かもしれない
        }

    } catch (error) {
        console.error("❌ エラー発生:", error);
    } finally {
        // await browser.close(); 
        // 検証時は閉じてほしくないかもしれないが、自動化なら閉じるべき
        console.log("ブラウザを閉じます...");
        await browser.close();
    }
};

likeRankingItems();
