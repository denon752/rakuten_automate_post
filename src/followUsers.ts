
import puppeteer from "puppeteer";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const targetRoomId = process.argv[2];

if (!targetRoomId) {
    console.error("エラー: Room ID を指定してください。");
    console.error("例: npm run follow <room_id>");
    process.exit(1);
}

const followUsers = async () => {
    console.log("-----------------------------------------------");
    console.log("フォロー自動化処理開始:" + new Date().toLocaleString());
    console.log(`ターゲット Room ID: ${targetRoomId}`);

    const userId = process.env.RAKUTEN_USER_EMAIL || process.env.USER_ID || "";
    const password = process.env.RAKUTEN_USER_PASSWORD || process.env.USER_PASSWORD || "";
    const userDataDir = path.join(process.cwd(), "user_data");

    const browser = await puppeteer.launch({
        headless: true,
        userDataDir: userDataDir,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");

    try {
        // --- Step 1: ユーザーページにアクセス ---
        const topUrl = `https://room.rakuten.co.jp/${targetRoomId}/items`;
        console.log(`ユーザーページへアクセス中: ${topUrl}`);
        await page.goto(topUrl, { waitUntil: 'networkidle2' });

        // --- Step 2: ログイン処理 ---
        const idSelector = 'input[aria-label*="ユーザID"], #login_id, #loginInner_u';
        try {
            await page.waitForSelector(idSelector, { visible: true, timeout: 3000 });
            console.log("🔑 ログインが必要です。");
            await page.type(idSelector, userId, { delay: 50 });
            const loginBtns = ['button[type="submit"]', 'input[type="submit"]', '.loginButton', '#login_next_btn'];
            for (const selector of loginBtns) {
                const btn = await page.$(selector);
                if (btn) {
                    await Promise.all([
                        page.click(selector),
                        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
                    ]);
                    break;
                }
            }
            const passSelector = 'input[type="password"], #loginInner_p';
            await page.waitForSelector(passSelector, { visible: true, timeout: 5000 });
            await page.type(passSelector, password, { delay: 50 });
            await Promise.all([
                page.keyboard.press('Enter'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
            ]);
            console.log("✅ ログイン完了");
            await page.goto(topUrl, { waitUntil: 'networkidle2' });
        } catch (e) {
            console.log("✨ ログイン済み、またはセッション有効");
        }

        // --- Step 3: フォロワーボタンをPuppeteerのclickで押してモーダルを開く ---
        console.log("フォロワー一覧を開く...");
        await new Promise(r => setTimeout(r, 2000));

        // "フォロワー" ボタンにdata属性を付けてからクリック
        const followerBtnFound = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent?.trim() || "";
                if (text.includes("フォロワー")) {
                    btn.setAttribute('data-auto-follower', 'true');
                    return text;
                }
            }
            return null;
        });

        if (!followerBtnFound) {
            console.error("⚠️ フォロワーボタンが見つかりません。終了します。");
            await browser.close();
            return;
        }

        console.log(`フォロワーボタン: "${followerBtnFound}"`);
        await page.click('button[data-auto-follower="true"]');
        console.log("モーダル読み込み待機...");
        await new Promise(r => setTimeout(r, 5000));

        // --- Step 4: モーダル内のスクロールコンテナを特定 ---
        // モーダル内をスクロールして100件以上読み込む
        console.log("フォロワーリスト読み込み中（スクロール）...");

        // スクロールしてユーザーをロード（目標100件以上）
        let prevCount = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 20;

        while (scrollAttempts < maxScrollAttempts) {
            // 現在のフォロー関連ボタン数をカウント
            const currentCount = await page.evaluate(() => {
                const btns = document.querySelectorAll('button[aria-label="フォローする"], button[aria-label="フォロー中"]');
                return btns.length;
            });

            console.log(`  読み込み済み: ${currentCount}件`);

            if (currentCount >= 100 || (currentCount === prevCount && scrollAttempts > 3)) {
                console.log(`  十分なユーザーが読み込まれました（${currentCount}件）`);
                break;
            }

            prevCount = currentCount;

            // モーダル内の最も深いスクロール可能な要素を探してスクロール
            const scrolled = await page.evaluate(() => {
                // フォローボタンの親要素を辿って、スクロール可能なコンテナを探す
                const followBtns = document.querySelectorAll('button[aria-label="フォローする"], button[aria-label="フォロー中"]');
                if (followBtns.length === 0) return false;

                let el: HTMLElement | null = followBtns[0].parentElement;
                let scrollContainer: HTMLElement | null = null;

                // 親要素を辿ってスクロール可能な要素を見つける
                while (el) {
                    const style = getComputedStyle(el);
                    const isScrollable = (
                        el.scrollHeight > el.clientHeight + 10 &&
                        (style.overflow === 'auto' || style.overflow === 'scroll' ||
                            style.overflowY === 'auto' || style.overflowY === 'scroll')
                    );
                    if (isScrollable) {
                        scrollContainer = el;
                    }
                    el = el.parentElement;
                }

                if (scrollContainer) {
                    scrollContainer.scrollTop += 1000;
                    return true;
                }

                // フォールバック: 全要素からスクロール可能なものを探す
                const allDivs = document.querySelectorAll('div');
                for (const div of allDivs) {
                    const htmlDiv = div as HTMLElement;
                    if (htmlDiv.scrollHeight > htmlDiv.clientHeight + 100) {
                        const style = getComputedStyle(htmlDiv);
                        if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                            style.overflowY === 'auto' || style.overflowY === 'scroll') {
                            htmlDiv.scrollTop += 1000;
                            return true;
                        }
                    }
                }

                // 最終フォールバック: window
                window.scrollBy(0, 1000);
                return false;
            });

            if (!scrolled) {
                // keyboards fallback
                await page.keyboard.press('PageDown');
            }

            await new Promise(r => setTimeout(r, 2000));
            scrollAttempts++;
        }

        // --- Step 5: フォロー処理 ---
        // aria-label="フォローする" のボタンを取得してクリック
        const maxFollows = 100;
        let followCount = 0;

        console.log(`\nフォロー処理開始（最大${maxFollows}件）...`);

        while (followCount < maxFollows) {
            // "フォローする" ボタンを探す（x座標が700以上 = モーダル内のボタン）
            const clickResult = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    const text = btn.textContent?.trim() || "";
                    const ariaLabel = btn.getAttribute('aria-label') || "";
                    // "フォローする" のみクリック（"フォロー中" はスキップ）
                    if ((text === "フォローする" || ariaLabel === "フォローする") && text !== "フォロー中") {
                        const rect = btn.getBoundingClientRect();
                        // x座標 > 600 = モーダル内のボタン（ルームオーナーのボタンを除外）
                        if (rect.width > 0 && rect.height > 0 && rect.x > 600) {
                            btn.click();
                            return { success: true, x: Math.round(rect.x), y: Math.round(rect.y) };
                        }
                    }
                }
                return { success: false, x: 0, y: 0 };
            });

            if (clickResult.success) {
                followCount++;
                console.log(`👤 フォローしました！ (${followCount}/${maxFollows}) pos=(${clickResult.x},${clickResult.y})`);

                // 3〜5秒待機
                const waitTime = 3000 + Math.random() * 2000;
                await new Promise(r => setTimeout(r, waitTime));
            } else {
                // ボタンがない → スクロールして新しいユーザーを読み込む
                console.log("表示中のフォローボタンなし。スクロールして追加読み込み...");

                let foundMore = false;
                // 最大5回スクロールしてリトライ
                for (let retry = 0; retry < 5; retry++) {
                    // フォローボタンの親要素を辿ってスクロール可能なコンテナを探す
                    await page.evaluate(() => {
                        const followBtns = document.querySelectorAll('button[aria-label="フォローする"], button[aria-label="フォロー中"]');
                        if (followBtns.length === 0) {
                            window.scrollBy(0, 1000);
                            return;
                        }

                        let el: HTMLElement | null = followBtns[0].parentElement;
                        let scrollContainer: HTMLElement | null = null;

                        while (el) {
                            const style = getComputedStyle(el);
                            const isScrollable = (
                                el.scrollHeight > el.clientHeight + 10 &&
                                (style.overflow === 'auto' || style.overflow === 'scroll' ||
                                    style.overflowY === 'auto' || style.overflowY === 'scroll')
                            );
                            if (isScrollable) {
                                scrollContainer = el;
                            }
                            el = el.parentElement;
                        }

                        if (scrollContainer) {
                            scrollContainer.scrollTop += 1500;
                        } else {
                            window.scrollBy(0, 1500);
                        }
                    });

                    await new Promise(r => setTimeout(r, 3000));

                    // スクロール後にフォローボタンがあるか確認
                    const hasMore = await page.evaluate(() => {
                        const buttons = document.querySelectorAll('button');
                        for (const btn of buttons) {
                            const text = btn.textContent?.trim() || "";
                            const rect = btn.getBoundingClientRect();
                            if (text === "フォローする" && rect.width > 0 && rect.x > 600) {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (hasMore) {
                        console.log(`  追加ユーザー発見（リトライ${retry + 1}回目）`);
                        foundMore = true;
                        break;
                    }
                    console.log(`  スクロールリトライ ${retry + 1}/5...`);
                }

                if (!foundMore) {
                    console.log("🏁 フォロー可能なユーザーがこれ以上見つかりません。終了します。");
                    break;
                }
            }
        }

        console.log(`\n✅ 完了！ 合計 ${followCount} ユーザーをフォローしました。`);

    } catch (error) {
        console.error("❌ エラー発生:", error);
    } finally {
        console.log("ブラウザを閉じます...");
        await browser.close();
    }
};

followUsers();
