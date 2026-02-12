import axios from "axios";

export const generateProductDescription = async (
  catchcopy: string,
  itemName: string,
  itemCaption: string = ""
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;

  // 修正ポイント：モデル名の指定を "models/gemini-1.5-flash" に固定
  const modelName = "models/gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `
楽天ROOMの投稿文を作ってください。
【商品名】: ${itemName}
【特徴】: ${catchcopy}
ハッシュタグを2つ付けて、親しみやすい短文で。250文字以内で、回答だけだして余計な挨拶や返答は不要`;

  try {
    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    // 成功した場合のテキスト抽出
    return response.data.candidates[0].content.parts[0].text.trim();

  } catch (error: any) {
    // 404が出る場合、URLを v1 に変えてリトライする最終手段
    if (error.response?.status === 404) {
      console.log("🔄 v1beta で 404 のため、v1 エンドポイントを試行します...");
      const v1Url = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${apiKey}`;
      try {
        const v1Response = await axios.post(v1Url, {
          contents: [{ parts: [{ text: prompt }] }]
        });
        return v1Response.data.candidates[0].content.parts[0].text.trim();
      } catch (v1Error) {
        console.error("❌ v1 でも失敗しました。");
      }
    }

    throw error;
  }
};