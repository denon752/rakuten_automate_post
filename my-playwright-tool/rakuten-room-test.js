const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  await page.getByText('アカウント登録/ログイン').click();
  await page.goto('https://login.account.rakuten.com/sso/authorize?client_id=rakuten_room_web&redirect_uri=https://room.rakuten.co.jp/common/callback&scope=openid&response_type=code&state=jBIlg781t0pTqvqA34v/wzpPL25OZGFoaWRPTldacVBZWERDOGIwa2R4T1h2RUoyQmZ3NDlUaXJJd0ZYUXQ0MGlkb2JCMDNCY0NrOXRJUjNmeXFFRzhmL3g2M2lrYWdZSGF5TWJZVWNUNmFGTWRyclNVUDRGN2dDUkRseTU3OXRuTjRKdHFkaHl6dVg5Q09TSS42ZTYyMmIzN2IzMzk2ZjBiOWEyMDhkODM5MGUwNzAwYmJhNzNiNTIyNDZhM2NlMDJhNzBkNTg3OTQ2NjU1NTFl#/sign_in');
  await page.getByRole('textbox', { name: 'ユーザIDまたはメールアドレス' }).click();
  await page.getByRole('textbox', { name: 'ユーザIDまたはメールアドレス' }).press('Eisu');
  await page.getByRole('textbox', { name: 'ユーザIDまたはメールアドレス' }).fill('denon752@gmail.com');
  await page.getByRole('button', { name: '次へ' }).click();
  await page.getByRole('textbox', { name: 'パスワード' }).click();
  await page.getByRole('textbox', { name: 'パスワード' }).fill('mayumi9292');
  await page.getByRole('textbox', { name: 'パスワード' }).press('Enter');
  await page.goto('https://room.rakuten.co.jp/discover/recommendItems?l-id=discover_recommendation_item_login_signup');
  await page.getByRole('link', { name: 'my ROOM' }).click();
  await page.goto('https://room.rakuten.co.jp/room_1c25ebf6cd/items');
  await page.getByRole('button', { name: 'フォロワー' }).click();
  await page.getByRole('link', { name: 'NiceMan' }).click();
  await page.goto('https://room.rakuten.co.jp/niceman/items');
  await page.getByRole('button', { name: 'フォロワー 37K' }).click();
  await page.getByRole('link', { name: 'セレクト倉庫' }).click();
  await page.goto('https://room.rakuten.co.jp/select_house/items');
  await page.locator('.profile-image--2yuua').click();
  await page.goto('https://room.rakuten.co.jp/select_house/items');
  await page.getByRole('button', { name: 'フォロワー' }).click();
  await page.goto('https://room.rakuten.co.jp/niceman/items');
  await page.getByRole('button', { name: 'フォロワー 37K' }).click();
  await page.locator('#userList').click();
  await page.locator('div').filter({ hasText: /^フォロワー17$/ }).nth(1).click();
  await page.locator('div').filter({ hasText: /^セレクト倉庫フォロワー17フォロー中$/ }).nth(1).click();
  await page.locator('div').filter({ hasText: /^ROOM Lab｜売れ筋×リアル検証フォロワー4フォローする$/ }).nth(1).click();
  await page.getByRole('button', { name: 'フォローする' }).first().click();
  await page.locator('div').filter({ hasText: /^ひでちゃん★2児パパの子育てROOM★フォロワー859フォローする$/ }).first().click();
  await page.goto('https://room.rakuten.co.jp/room_dcf65504c3/1700360376502287');
  await page.locator('div').filter({ hasText: /^楽天市場$/ }).click();
  await page.goto('https://room.rakuten.co.jp/niceman/items');
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();