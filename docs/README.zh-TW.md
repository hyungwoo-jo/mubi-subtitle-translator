# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

預先翻譯現有字幕，並依原對白時間顯示。獨立開源擴充功能，已在 Windows Chrome 的 MUBI 驗證，非 MUBI 官方產品。Edge 可載入相同資料夾，但實際播放尚未驗證。

## 安裝

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. 下載發行版 ZIP 並解壓縮至固定資料夾。開啟 `chrome://extensions`（Edge：`edge://extensions`），啟用開發人員模式，選擇「載入未封裝項目」，再選取 `extension/`。

2. 在彈出視窗及連線分頁按 **Continue with ChatGPT**。完成官方登入並授權使用方案，選擇模型後確認。

3. 在設定中選擇介面語言與翻譯目標語言。開啟 MUBI 原文字幕，同意字幕處理後在此網站啟動，再重新整理影片頁面。

4. 觀看時保持連線分頁開啟。不需安裝 Python、Codex CLI 或本機助手。權杖僅保存在該分頁記憶體中。如需撤銷存取，請登出。

## 翻譯與隱私

可用時讀取完整字幕檔，分批預先翻譯播放位置之後最多5分鐘的內容。剛開始或跳至尚未準備的位置時可能需要等待。只偵測畫面字幕時會更慢。

預設介面為英語，可在設定中選擇16種語言。翻譯目標語言另行設定。擴充功能免費，但仍受 ChatGPT 方案與額度限制。字幕、上下文及翻譯偏好會直接傳送至 OpenAI。

從 GitHub 安裝不需要商店開發人員帳戶，目前尚未提交商店。Ollama 與 Codex CLI 是需要額外安裝的選用模式。

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
