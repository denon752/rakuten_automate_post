
import puppeteer from "puppeteer";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const debugFollow = async () => {
    const userDataDir = path.join(process.cwd(), "user_data");

    const browser = await puppeteer.launch({
        headless: true,
        userDataDir: userDataDir,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1280,800']
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");

    try {
        // Step 1: ユーザーページへ
        console.log("=== Step 1: ユーザーページへ ===");
        await page.goto("https://room.rakuten.co.jp/niceman/items", { waitUntil: 'networkidle2' });
        console.log("URL:", page.url());

        // Step 2: フォロワーリンクを探す
        console.log("\n=== Step 2: フォロワー関連の要素を探す ===");
        const followerElements = await page.evaluate(() => {
            const results: string[] = [];
            const all = document.querySelectorAll('*');
            for (const el of all) {
                // 直接テキストノードに "フォロワー" が含まれるか
                for (const child of el.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent?.includes("フォロワー")) {
                        results.push(`TAG=${el.tagName} CLASS="${el.className}" TEXT="${child.textContent.trim()}" HREF="${(el as HTMLAnchorElement).href || ''}"`);
                    }
                }
            }
            return results;
        });
        console.log("フォロワー関連要素:");
        followerElements.forEach(e => console.log(`  ${e}`));

        // Step 3: フォロワーリンクをクリック
        console.log("\n=== Step 3: フォロワーリンクをクリック ===");
        const clicked = await page.evaluate(() => {
            const all = document.querySelectorAll('*');
            for (const el of all) {
                for (const child of el.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent?.includes("フォロワー")) {
                        if (el instanceof HTMLElement) {
                            el.click();
                            return `Clicked: TAG=${el.tagName} TEXT="${child.textContent.trim()}"`;
                        }
                    }
                }
            }
            return "Not found";
        });
        console.log(clicked);

        // 待機
        await new Promise(r => setTimeout(r, 5000));
        console.log("URL after click:", page.url());

        // Step 4: ページ全体のボタンを調査
        console.log("\n=== Step 4: 全ボタン調査 ===");
        const allButtons = await page.evaluate(() => {
            const results: string[] = [];
            const buttons = document.querySelectorAll('button');
            buttons.forEach((btn, i) => {
                const text = btn.textContent?.trim() || "";
                if (text.length < 50) { // 長すぎるテキストは除外
                    results.push(`[${i}] TEXT="${text}" CLASS="${btn.className}" VISIBLE=${btn.offsetWidth > 0}`);
                }
            });
            return results;
        });
        console.log(`ボタン数: ${allButtons.length}`);
        allButtons.forEach(b => console.log(`  ${b}`));

        // Step 5: "フォロー" を含むボタンの詳細
        console.log("\n=== Step 5: フォロー関連ボタン詳細 ===");
        const followButtons = await page.evaluate(() => {
            const results: string[] = [];
            const buttons = document.querySelectorAll('button');
            buttons.forEach((btn, i) => {
                const text = btn.textContent?.trim() || "";
                if (text.includes("フォロー")) {
                    const parent = btn.parentElement;
                    const grandParent = parent?.parentElement;
                    const greatGrandParent = grandParent?.parentElement;
                    results.push(
                        `[${i}] TEXT="${text}" ` +
                        `BTN_CLASS="${btn.className}" ` +
                        `PARENT: TAG=${parent?.tagName} CLASS="${parent?.className}" ` +
                        `GPARENT: TAG=${grandParent?.tagName} CLASS="${grandParent?.className}" ` +
                        `GGPARENT: TAG=${greatGrandParent?.tagName} CLASS="${greatGrandParent?.className}"`
                    );
                }
            });
            return results;
        });
        console.log(`フォロー関連ボタン数: ${followButtons.length}`);
        followButtons.forEach(b => console.log(`  ${b}`));

        // Step 6: ユーザーカード構造を調査
        console.log("\n=== Step 6: ユーザーカード構造 ===");
        const userCards = await page.evaluate(() => {
            // フォローするボタンの親要素からユーザーカード構造を推測
            const results: string[] = [];
            const buttons = document.querySelectorAll('button');
            let count = 0;
            for (const btn of buttons) {
                const text = btn.textContent?.trim() || "";
                if ((text === "フォローする" || text === "フォロー") && count < 5) {
                    // 親を5階層まで遡る
                    let el: Element | null = btn;
                    const chain: string[] = [];
                    for (let depth = 0; depth < 6 && el; depth++) {
                        const childTexts = Array.from(el.childNodes)
                            .filter(n => n.nodeType === Node.TEXT_NODE)
                            .map(n => n.textContent?.trim())
                            .filter(t => t);
                        chain.push(`D${depth}: TAG=${el.tagName} CLASS="${el.className}" directText=[${childTexts.join(",")}]`);
                        el = el.parentElement;
                    }
                    results.push(`--- Button "${text}" ---\n${chain.join("\n")}`);
                    count++;
                }
            }
            return results;
        });
        userCards.forEach(c => console.log(c));

        // Step 7: HTMLスニペット
        console.log("\n=== Step 7: フォローボタン周辺HTML (最初の1つ) ===");
        const htmlSnippet = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent?.trim() || "";
                if (text === "フォローする" || text === "フォロー") {
                    // 3階層上の親のouterHTML（長すぎたら切る）
                    const container = btn.parentElement?.parentElement?.parentElement;
                    if (container) {
                        const html = container.outerHTML;
                        return html.substring(0, 2000);
                    }
                }
            }
            return "No follow button found";
        });
        console.log(htmlSnippet);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await browser.close();
    }
};

debugFollow();
