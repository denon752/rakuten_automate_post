import axios from "axios";

export async function getRakutenRankingDataByGenre(
  genreId: string,
  page: number
) {
  const applicationId = process.env.RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID; // アフィリエイトIDも取得

  const RAKUTEN_RANKING_URL = `https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601`;

  const response = await axios.get(RAKUTEN_RANKING_URL, {
    params: {
      applicationId: applicationId,
      affiliateId: affiliateId, // これを入れることで affiliateUrl が返ってきます
      genreId: genreId,
      page: page
    },
  });

  // 【重要】item.Item の中身を外に出して、扱いやすい配列に変換する
  return response.data.Items.map((item: any) => item.Item);
}

export const getRakutenRankingDataByKeyword = async (
  keyword: string,
  page: number
) => {
  const applicationId = process.env.RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  const RAKUTEN_SEARCH_URL = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601`;

  const response = await axios.get(RAKUTEN_SEARCH_URL, {
    params: {
      applicationId: applicationId,
      affiliateId: affiliateId,
      keyword: keyword,
      page: page,
      format: "json",
      availability: 1,
      orFlag: 0
    },
  });

  // 【重要】item.Item の中身を外に出して、扱いやすい配列に変換する
  return response.data.Items.map((item: any) => item.Item);
};