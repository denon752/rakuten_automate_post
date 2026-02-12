import scrapeWebsite from "./scrapeWebsite";

/**
 * 楽天ROOM投稿のメインループ処理
 */
async function postRakutenRoom(elements: any[]) {
  console.log(`🚀 合計 ${elements.length} 件の投稿処理を開始します。`);

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    // データが空ならスキップ
    if (!element) continue;

    try {
      /**
       * 修正ポイント: element.Item ではなく element から直接取得
       * index.ts 側で items.push(item.Item) としている場合に対応
       */
      const catchcopy = element.catchcopy || "";
      const itemName = element.itemName || element.title || "商品";
      const itemCode = element.itemCode;
      const itemCaption = element.itemCaption || "";

      if (!itemCode) {
        console.log(`⚠️ 商品コードが見つからないため、スキップします。`);
        continue;
      }

      console.log("\n-----------------------------------------------");
      console.log(`[${i + 1}/${elements.length}] 処理中: ${itemName}`);

      // URLの生成
      const url = `https://room.rakuten.co.jp/mix?itemcode=${itemCode}&scid=we_room_upc60`;
      console.log(`Target URL: ${url}`);

      // scrapeWebsite の実行
      // 第4引数に itemCaption を追加しています
      const success = await scrapeWebsite(url, catchcopy, itemName, itemCaption);

      // 成功時、3分待機
      if (success && i < elements.length - 1) {
        console.log("⏱️ 連続投稿制限を避けるため、3分間待機します...");
        await new Promise((resolve) => setTimeout(resolve, 180000));
      }

    } catch (error) {
      console.error("❌ 商品の処理中にエラーが発生しました:", error);
    }
  }

  console.log("\n✅ 全てのリストの処理が終了しました。");
}

export default postRakutenRoom;