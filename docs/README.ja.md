# CueBraid

[English](../README.md) · [한국어](README.ko.md) · 日本語

既存の字幕を先に翻訳し、元の字幕時刻に合わせて表示する独立した拡張機能です。
**実機確認済みの対象はWindows版ChromeのMUBI**です。MUBIの公式製品・提携製品ではありません。
ほかのサイトとEdgeは実験的な対象で、動作を保証しません。

## 初期設定

1. GitHub Releaseの完全版ZIP（`cuebraid-VERSION.zip`）を固定フォルダーに展開します。
2. `chrome://extensions`または`edge://extensions`でデベロッパーモードを有効にし、`extension/`を読み込みます。
3. 同じPCにPython 3.10以降と[Codex CLI](https://learn.chatgpt.com/docs/codex/cli)をインストールします。
4. 展開したフォルダーで`python native/setup.py --browser chrome --login`を実行します。
   ブラウザーの拡張IDを入力し、公式Codex画面でChatGPTアカウントにログインします。
5. CueBraidの設定で翻訳先言語と利用可能なモデルを選択し、ヘルパー接続を確認します。
6. MUBIの元字幕を有効にし、CueBraidで字幕処理への同意を確認してサイトで開始し、ページを再読み込みします。

既定のUIは英語です。Settings → App languageで日本語・韓国語を選択できます。
表示言語と翻訳先言語は別の設定です。拡張機能だけでは翻訳できず、ローカルヘルパーが必要です。

## ほかのモデル

Ollamaとモデルを同じPCに用意し、`python native/install.py EXTENSION_ID --provider ollama`で登録できます。
設定でOllamaとインストール済みの正確なモデル名を指定します。実モデルの品質・速度は未検証です。
Claude・Gemini APIはこのバージョンには実装していません。

## 制限とプライバシー

字幕ファイル全体を取得できる場合でも、翻訳は現在位置から最大5分先までの必要な範囲を準備します。
最初は8件、以降は最大40件ずつ翻訳し、結果を再利用します。開始時や大きなシーク後には待ち時間があります。
時間情報を取得できない場合は表示中の字幕を翻訳するため、モデルの応答時間による遅延があります。

拡張機能は無料です。モデルの料金や利用上限は別途適用され、字幕と文脈は選択したプロバイダーに送信されます。
[プライバシーポリシー](PRIVACY.md)をご確認ください。MUBIの規約は自動取得・コンテンツ変更・一部のAI利用を制限しています。
無料配布であっても問題がないとは保証できません。[MUBI規約](https://mubi.com/en/terms_of_service)をご確認ください。

GitHubからのインストールにストア開発者登録は不要です。Chromeウェブストアにはまだ提出していません。
