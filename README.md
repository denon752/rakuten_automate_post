# rakuten-room-auto-post

楽天 ROOM に自動投稿する Node.js アプリケーションです。楽天 API を利用して商品情報を取得し、ChatGPT API で生成した商品の紹介文とともに、スクレイピングを用いて楽天 ROOM に自動投稿します。

## 特徴

- 楽天 API から商品情報を取得
- Gemini API を使用して商品紹介文を自動生成
- Puppeteer を用いたスクレイピングによる楽天 ROOM への自動投稿
- cron を使用した定期実行機能

## 前提条件

- Node.js がインストールされていること
- 楽天 API キーと ChatGPT API キーが必要です

## セットアップ

リポジトリをクローンした後、以下のコマンドを実行して依存関係をインストールします。

```bash
git clone https://github.com/tetsuyaohira/rakuten-room-auto-post.git
cd rakuten-room-auto-post
npm install
```

## 環境変数の設定

`.env` ファイルを作成し、以下の値を設定してください。

```plaintext
RAKUTEN_API_KEY=あなたの楽天APIキー
CHATGPT_API_KEY=あなたのChatGPT APIキー
RAKUTEN_USER_EMAIL=楽天ログインメールアドレス
RAKUTEN_USER_PASSWORD=楽天ログインパスワード
```

## コマンド一覧

| コマンド | 説明 |
|---|---|
| `npm start` | 自動投稿（デフォルト） |
| `npm start genre <ID>` | ジャンル指定で投稿 |
| `npm start keyword <キーワード>` | キーワード指定で投稿 |
| `npm run like` | ランキングページ自動いいね |
| `npm run follow <ROOM_ID>` | フォロワー自動フォロー |
npm run follow room_b267661ebb
---

### 自動投稿

```bash
npm start                      # デフォルト実行
npm start genre 100283         # ジャンルID指定
npm start keyword クリスマス     # キーワード指定
```

### ランキングページ 自動いいね

ランキングページのアイテムに対して自動で「いいね」を行います。

```bash
npm run like
```

- **対象**: `https://room.rakuten.co.jp/discover/collectItemRank`
- **間隔**: 2分（+ランダム誤差）
- **制限**: なし（ページ内のボタンがある限り実行）

### フォロワー 自動フォロー

指定したルームのフォロワー一覧から、未フォローユーザーを自動でフォローします。

```bash
npm run follow <ROOM_ID>
```

**例:**
```bash
npm run follow niceman
```

- **対象**: `https://room.rakuten.co.jp/<ROOM_ID>/items` → フォロワー一覧
- **間隔**: 1〜2分（ランダム）
- **動作**: 「フォローする」ボタンをクリック。「フォロー中」はスキップ。
