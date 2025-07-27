# Slack to MAXQDA Adapter TODO

## プロジェクト概要
- **目的**: slack-maxqda-adapter (slack-exporter) のGUIアプリケーションを作成
- **リポジトリ**: 
  - `/Users/yuchi/workspace/nae-lab/git/Slack-To-MAXQDA-Adaptor` (GUIアプリ)
  - `/Users/yuchi/workspace/nae-lab/git/slack-exporter` (ライブラリ)

## 実装済み機能
- [x] Electron + React + TypeScript プロジェクトの初期化
- [x] shadcn/ui コンポーネントライブラリの統合
- [x] Slack App マニフェスト表示 - ユーザーが適切な権限を持つSlackアプリを作成できるようサポート
- [x] エクスポートフォーム - 全必要パラメータ（トークン、チャンネルID、日付範囲、形式、出力パス）
- [x] 多言語対応 (i18n) - 日本語と英語の切り替え機能
- [x] GitHub Actions - Windows、macOS、Linux向けの自動ビルド設定
- [x] エラーハンドリング - エクスポート結果の表示

## 技術スタック
- **Electron** - デスクトップアプリケーションフレームワーク
- **React + TypeScript** - UI開発
- **shadcn/ui** - UIコンポーネントライブラリ
- **i18next** - 国際化対応
- **pnpm** - パッケージマネージャー
- **Vite** - ビルドツール

## 現在の課題
### 1. slack-exporterライブラリの統合
- [x] GitHubから直接インストールするとビルドされていない問題の解決
- [x] ローカルパスを使用する方法でCLIとElectronの競合問題の解決
- [x] postinstallスクリプトを追加したが、tsconfig.jsonが含まれていない問題の対応

### 2. 解決策
- [x] 両方のリポジトリを操作できる環境での作業
- [x] slack-exporterにprepareスクリプトを追加してGitHubインストール時にビルドを実行
- [x] GitHubからの直接インストールで統合完了

## ファイル構造
```
Slack-To-MAXQDA-Adaptor/
├── electron/
│   ├── main.ts          # Electron main process (現在モック実装)
│   └── preload.ts       # Preload script
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── ExportForm.tsx
│   │   └── SlackManifestDialog.tsx
│   ├── lib/
│   │   ├── i18n.ts      # i18n configuration
│   │   └── utils.ts
│   ├── locales/
│   │   ├── en.json      # English translations
│   │   └── ja.json      # Japanese translations
│   ├── App.tsx
│   └── main.tsx
├── .github/workflows/
│   └── build.yml        # GitHub Actions
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 次のステップ
1. [x] 一つ上のディレクトリで作業を開始
2. [x] slack-exporterリポジトリにprepareスクリプトを追加
3. [x] 両方のプロジェクトを適切に統合
4. [x] Electronアプリケーションの動作確認
5. [x] 実際のslack-exporter機能の統合（モック実装から実際の実装へ）

## 追加予定機能
- [ ] セキュアなトークン保存（Electron safeStorage API）
- [ ] エクスポート進捗のリアルタイム表示
- [ ] 複数チャンネルの一括エクスポート
- [ ] エクスポート履歴の保存
- [ ] 自動アップデート機能

## メモ
- Electronメインプロセス（electron/main.ts）は実際のslack-exporterライブラリを使用するよう実装完了
- slack-exporterのCLIがElectronコマンドと競合する問題はGitHub経由のインストールで解決
- vite.config.tsでrollupのexternalに依存関係を追加済み
- GitHub ActionsでWindows/macOS/Linux向けビルドを自動化済み

## 完了した作業（2025-07-25）
- slack-exporterのpackage.jsonにprepareスクリプトを追加
- slack-exporterのfilesフィールドにsrcとtsconfig.jsonを追加
- Slack-To-MAXQDA-AdaptorでGitHub経由でslack-exporterをインストール
- Electronメインプロセスで実際のSlackExporter APIを使用するよう実装
- TypeScriptエラーの修正（React importの削除など）
- ビルドと動作確認の完了