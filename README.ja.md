# PlayFlow

[English](./README.md) | **日本語**

Webブラウザの操作を自動化し、その過程を動画として録画するCLIツールです。Playwright、TypeScript、yarnを使用して構築されています。

## 特徴

- 🎥 ブラウザ操作の全過程を動画として録画
- 📝 JSONファイルでワークフローを定義
- 🎯 14種類の豊富なアクションタイプ（手動操作待ち含む）
- ⏱️ 詳細なタイムコードログを自動生成
- 📸 任意のタイミングでスクリーンショット撮影
- 🔧 柔軟な設定オプション
- ✅ ワークフローの検証機能
- 📍 動画チャプターマーカーで簡単ナビゲーション（QuickTime対応）
- 📄 アクション説明をWebVTT字幕として生成

## 必要な環境

- Node.js 16.0.0以上
- yarn
- FFmpeg（動画録画に必要）

## インストール

```bash
# リポジトリをクローン
git clone [repository-url]
cd PlayFlow

# 依存関係をインストール
yarn install

# 初期セットアップを実行
yarn setup
```

## 使い方

### 基本的なコマンド

```bash
# ワークフローを実行して録画
yarn record <workflow-name>

# 録画なしで実行（ログイン・セットアップ用）
yarn execute <workflow-name>

# 利用可能なワークフロー一覧を表示
yarn list

# ワークフローの検証
yarn validate <workflow-name>

# 初期セットアップ
yarn setup
```

### ワークフローの作成

1. `workflows/` ディレクトリに新しいフォルダを作成
2. `actions.json` ファイルでアクションを定義
3. オプションで `config.json` を作成してカスタム設定を適用

#### actions.json の例

```json
[
  {
    "type": "goto",
    "url": "https://example.com",
    "description": "サイトにアクセス"
  },
  {
    "type": "click",
    "selector": "button#submit",
    "description": "送信ボタンをクリック"
  },
  {
    "type": "screenshot",
    "description": "スクリーンショットを撮影"
  }
]
```

## アクションタイプ

| アクション | 説明 | 必須パラメータ |
|-----------|------|----------------|
| `goto` | URLに移動 | `url` |
| `click` | 要素をクリック | `selector` |
| `fill` | フォームに入力 | `selector`, `value` |
| `type` | テキストをタイプ | `selector`, `text` |
| `press` | キーを押す | `key` |
| `hover` | 要素にホバー | `selector` |
| `screenshot` | スクリーンショット撮影 | - |
| `waitForSelector` | 要素の出現を待機 | `selector` |
| `waitForTimeout` | 指定時間待機 | `timeout` |
| `waitForManualAction` | 手動操作を待機 | - |
| `selectOption` | セレクトボックスで選択 | `selector`, `value` |
| `check` | チェックボックスをチェック | `selector` |
| `uncheck` | チェックボックスのチェックを外す | `selector` |
| `evaluate` | JavaScriptを実行 | `script` |
| `showMessage` | UIメッセージを表示 | `message` |

### アクションオプション

すべてのアクションで以下のオプションパラメータを使用できます：

| オプション | 型 | 説明 |
|-----------|-----|------|
| `description` | string | ログや動画マーカーに表示される説明文 |
| `skipVtt` | boolean | WebVTT字幕生成でこのアクションをスキップ |
| `skipChapter` | boolean | 動画チャプターマーカーでこのアクションをスキップ |

#### オプション付きの例

```json
[
  {
    "type": "waitForTimeout",
    "timeout": 3000,
    "description": "アニメーション待機",
    "skipVtt": true,
    "skipChapter": true
  }
]
```

## 設定

### グローバル設定

`recording-config.default.json` を `recording-config.json` にコピーしてカスタマイズできます。
`recording-config.json` が存在しない場合は、`recording-config.default.json` の設定が使用されます。

```json
{
  "browser": {
    "headless": false,
    "slowMo": 0,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "defaultTimeout": 30000,      // 全アクションのデフォルトタイムアウト（ミリ秒）
    "navigationTimeout": 30000    // gotoなどナビゲーションアクションのタイムアウト（ミリ秒）
  },
  "video": {
    "size": {
      "width": 1920,
      "height": 1080
    },
    "fps": 30,
    "skipAllVtt": false,      // WebVTT字幕生成をスキップ
    "skipAllChapters": false  // チャプターマーカー生成をスキップ
  }
}
```

### ワークフロー固有の設定

ワークフローディレクトリに `config.json` を作成してグローバル設定を上書きできます：

```json
{
  "browser": {
    "headless": true
  },
  "video": {
    "fps": 60,
    "skipAllVtt": true  // このワークフローではWebVTT字幕をすべてスキップ
  }
}
```

## 出力

すべての出力ファイルは `[workflow-name]_[timestamp]/` ディレクトリに整理されます：

- **動画ファイル**: `video.mp4` - チャプターマーカー埋め込み済みの録画
- **タイムコードログ**: `timecode.txt` - 詳細なアクションタイミングログ
- **スクリーンショット**: `screenshots/` - ワークフロー中に撮影した個別のスクリーンショット
- **WebVTT字幕**: `markers.vtt` - 動画字幕としてのアクション説明
- **チャプターメタデータ**: `chapters.txt` - FFMETADATA形式のチャプターマーカー

### タイムコードログの例

```
Workflow: example-workflow
Started at: 2025-01-18T14:30:00.000Z
================================================================================

TIME		DURATION	ACTION			DESCRIPTION
--------------------------------------------------------------------------------

00:00.000		+0ms		goto                	サイトにアクセス
00:01.523		+1523ms		[Completed #1]
00:02.045		+0ms		click               	送信ボタンをクリック
00:02.567		+522ms		[Completed #2]

--------------------------------------------------------------------------------
Total duration: 2s 567ms
Completed at: 2025-01-18T14:30:02.567Z
```

## UIフィードバック機能

### showMessageアクション
ワークフロー実行中にブラウザ内でメッセージを表示できます：

```json
{
  "type": "showMessage",
  "message": "処理を開始します",
  "position": "top-center",
  "style": "info",
  "duration": 3000,
  "description": "開始メッセージを表示"
}
```

#### showMessageのオプション
- `position`: メッセージの表示位置（top-left, top-center, top-right, bottom-left, bottom-center, bottom-right, center）
- `style`: メッセージのスタイル（info, warning, error, success）
- `duration`: 表示時間（ミリ秒）、0で手動クローズ
- `closeButton`: 閉じるボタンの表示（デフォルト: true）
- `waitForClose`: ユーザーが閉じるまで待機（デフォルト: false）

## 開発

```bash
# TypeScriptのビルド
yarn build

# 開発モード（ウォッチモード）
yarn dev

# テストの実行
yarn test

# リント
yarn lint

# 型チェック
yarn typecheck
```

## 手動操作の待機

Googleログイン、2FA、CAPTCHA など手動操作が必要な場面では `waitForManualAction` を使用します：

### オプション1: 特定の要素を待機
```json
{
  "type": "waitForManualAction",
  "message": "Googleログインを完了してください",
  "continueSelector": "#account-menu",
  "timeout": 300000,
  "description": "ユーザーのログイン完了を待機",
  "showOverlay": true,
  "overlayOptions": {
    "title": "手動操作が必要です",
    "instruction": "Googleアカウントでログインしてください",
    "backdrop": true
  }
}
```

### オプション2: 特定のテキストを待機
```json
{
  "type": "waitForManualAction", 
  "message": "2FA認証を完了してください",
  "continueText": "おかえりなさい",
  "timeout": 180000,
  "description": "ログイン成功を待機"
}
```

### オプション3: ファイルでの継続指示
```json
{
  "type": "waitForManualAction",
  "message": "決済処理を完了してください",
  "description": "手動決済完了を待機"
}
```

オプション3の場合、準備ができたらプロジェクトルートに `.continue` ファイルを作成します：
```bash
touch .continue
```

## セッション管理

`execute`コマンドを使用すると、録画なしでワークフローを実行できます。以下の用途に最適です：
- セッション状態を保存するログインワークフロー
- 環境を準備するセットアップワークフロー
- 動画録画が不要なワークフロー

### 例：Googleログインセッション

1. ログインワークフローを作成してセッションを保存：
```bash
yarn execute example-google-login --save-session google-account
```

2. 保存したセッションを他のワークフローで使用：
```bash
yarn record example-use-google-session --session google-account
```

### セッションコマンド

```bash
# 実行後にセッションを保存
yarn execute <workflow> --save-session <session-name>

# 保存したセッションを使用して録画
yarn record <workflow> --session <session-name>

# セッションの読み込みと保存を両方実行
yarn record <workflow> --session old-session --save-session new-session
```

セッションは`sessions/`ディレクトリに保存され、以下を含みます：
- Cookie
- ローカルストレージ
- セッションストレージ
- 認証状態

## 動画ナビゲーション機能

### チャプターマーカー

動画には自動的にチャプターマーカーが埋め込まれ、QuickTime Playerや対応する動画プレイヤーで表示されます。各アクションがクリック可能なチャプターとなり、簡単にナビゲートできます。

特定のアクションでチャプターを無効にする場合：
```json
{
  "type": "waitForTimeout",
  "timeout": 5000,
  "skipChapter": true
}
```

### WebVTT字幕

アクションの説明はWebVTT字幕（`markers.vtt`）として出力されます。多くの動画プレイヤーで外部字幕トラックとして読み込むことができます。

特定のアクションで字幕を無効にする場合：
```json
{
  "type": "click",
  "selector": ".button",
  "skipVtt": true
}
```

## トラブルシューティング

### FFmpegが見つからない

各OSでのインストール方法：

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
- **Windows**: [公式サイト](https://ffmpeg.org/download.html)からダウンロード

### 動画が録画されない

1. FFmpegが正しくインストールされているか確認
2. `output/` ディレクトリの書き込み権限を確認
3. ブラウザのヘッドレスモードを無効にして確認

## ライセンス

MIT