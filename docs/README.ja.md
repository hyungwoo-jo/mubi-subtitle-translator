# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

既存の字幕を先に翻訳し、元の台詞の時刻に合わせて表示する独立した拡張機能です。Windows ChromeのMUBIで確認しています。MUBI公式製品ではありません。Edgeにも同じフォルダーを読み込めますが、実際の再生は未検証です。

## インストール

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. 配布ZIPを常用するフォルダーに展開します。`chrome://extensions`（Edge: `edge://extensions`）でデベロッパーモードを有効にし、**パッケージ化されていない拡張機能を読み込む → extension/**を選びます。

2. ポップアップと接続タブで **Continue with ChatGPT** を押します。公式ログインとプラン利用の許可を完了し、モデルを選んで確認します。

3. 設定でアプリの言語と翻訳先の言語を選びます。MUBIの元字幕を有効にし、字幕処理に同意して、このサイトで開始します。動画ページを再読み込みします。

4. 視聴中は接続タブを開いたままにしてください。Python、Codex CLI、別のヘルパーは不要です。トークンはタブのメモリだけに保持されます。権限を取り消すにはサインアウトしてください。

## 翻訳とプライバシー

取得できる場合は字幕ファイル全体を読み込み、再生位置から最大5分先までをまとめて翻訳します。開始時や準備範囲外へのシークでは待ち時間が生じます。画面上の字幕検出ではさらに遅れる場合があります。

UIは英語が既定で、設定から16言語を選べます。翻訳先は別に指定します。拡張機能は無料ですが、ChatGPTのプランや利用制限は適用されます。字幕、前後の台詞、翻訳設定はOpenAIに直接送信されます。

GitHubからの導入にストア開発者登録は不要です。ウェブストアには未提出です。OllamaとCodex CLIは追加インストールが必要な代替モードです。

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
