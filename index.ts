import { CronJob } from "cron";
import dotenv from "dotenv";
dotenv.config();

import parseCommandLineArgs from "./src/parseCommandLineArgs";
import {
  getRakutenRankingDataByGenre,
  getRakutenRankingDataByKeyword,
} from "./src/getRakutenRankingData";
import getGenreIdsByTime from "./src/getGenreIdsByTime";
import getNumberToday from "./src/lib/getNumberToday";
import postRakutenRoom from "./src/postRakutenRoom";

async function runJob() {
  console.log("Job execution started at: " + new Date().toLocaleString());
  const today = new Date();
  const currentHour = today.getHours();
  
  // 1. 現在の時刻に基づいたジャンルを取得
  let targetGenres = getGenreIdsByTime(currentHour);
  
  // 2. 指定した時間帯以外（8, 14, 20, 23時以外）は実行しないようにガード
  if (targetGenres.length === 0) {
    console.log(`時刻 ${currentHour}時 は投稿スケジュール外のためスキップします。`);
    return;
  }

  console.log(`⏰ ${currentHour}時のターゲットジャンル: ${targetGenres.join(", ")}`);

  // 3. 各ジャンルごとに処理を実行
  for (const genreId of targetGenres) {
    console.log(`Processing Genre ID: ${genreId}`);
    // main関数の引数に「20投稿制限」を意識したロジックを渡す
    await main(getRakutenRankingDataByGenre, genreId);
  }
  
  console.log("End job sequence:" + new Date().toLocaleString());
}

async function main(
  getRakutenRankingData: (genreOrKeyword: string, numberToday: number) => any,
  genreOrKeyword: string
) {
  try {
    const numberToday = getNumberToday();
    // 楽天ランキングから商品データを取得
    const elements = await getRakutenRankingData(genreOrKeyword, numberToday);
    
    if (elements && elements.length > 0) {
      // 1時間の上限を20件とするため、取得した配列から最大20件に絞り込む
      const targetElements = elements.slice(0, 20);
      console.log(`✅ ${genreOrKeyword} から ${targetElements.length} 件を投稿リストにセットしました。`);
      
      await postRakutenRoom(targetElements);
    } else {
      console.log("商品データが取得できませんでした。");
    }
  } catch (error) {
    console.error("main関数でエラーが発生しました:", error);
  }
}

// --- 実行制御 ---
const args = process.argv.slice(2);
const options = parseCommandLineArgs(args);

if (options.genre) {
  console.log("ジャンル指定実行:", options.genre);
  main(getRakutenRankingDataByGenre, options.genre);
} else if (options.keyword) {
  console.log("キーワード指定実行:", options.keyword);
  main(getRakutenRankingDataByKeyword, options.keyword);
} else {
  // 1. 定期実行スケジュール（8, 14, 20, 23時の0分に実行）
  // 24時間制限(200件)に対し、20件×4回＝80件/日で安全に運用
  const job = new CronJob("0 0 8,14,20,23 * * *", () => {
    runJob();
  }, null, true, "Asia/Tokyo");
  
  console.log("定期実行（8時, 14時, 20時, 23時）を起動しました。");

  // 2. 起動時のチェック
  // 起動した時間がたまたま8, 14, 20, 23時だった場合のみ実行される
  runJob();
}