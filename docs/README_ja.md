# Slack to MAXQDA Adapter

Slackの会話をMAXQDA互換形式にエクスポートするためのデスクトップアプリケーション。

## 特徴

- SlackチャンネルのメッセージをDOCXまたはMarkdown形式でエクスポートし、MAXQDAで分析可能
- ElectronとReactで構築された使いやすいGUI
- 多言語対応（AI翻訳：英語、日本語、韓国語、フィンランド語、中国語、繁体中国語、スペイン語、ポルトガル語、オランダ語、ウクライナ語）
- Slackアプリのマニフェスト生成機能で簡単セットアップ
- クロスプラットフォーム対応（Windows、macOS、Linux）

## インストール

[Releases](https://github.com/nae-lab/Slack-To-MAXQDA-Adaptor/releases)ページから最新のリリースをダウンロードしてください。

## 開発

### 必要条件

- Node.js 20以上
- npmまたはpnpm

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/nae-lab/Slack-To-MAXQDA-Adaptor.git
cd Slack-To-MAXQDA-Adaptor

# 依存関係をインストール
npm install

# 開発モードで実行
npm run electron:dev
```

### ビルド

```bash
# 現在のプラットフォーム用にビルド
npm run dist

# 特定のプラットフォーム用にビルド
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## 使用方法

1. アプリケーション内の「Slackアプリの作成方法を見る」をクリック
2. 提供されたマニフェストをコピーし、新しいSlackアプリを作成
3. アプリをワークスペースにインストールし、Bot User OAuth Tokenをコピー
4. アプリケーションにトークンを入力
5. エクスポートするチャンネルIDと日付範囲を指定
6. 出力形式と保存場所を選択
7. エクスポートをクリック

## ライセンス

MIT
