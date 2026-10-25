# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

提前翻译现有字幕，并按原对白时间显示。独立开源扩展，已在 Windows Chrome 的 MUBI 上验证，非 MUBI 官方产品。Edge 可加载同一文件夹，但实际播放尚未验证。

## 安装

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. 下载发布版 ZIP 并解压到固定文件夹。打开 `chrome://extensions`（Edge：`edge://extensions`），开启开发者模式，选择“加载已解压的扩展程序”，然后选择 `extension/`。

2. 在弹出窗口和连接标签页中点击 **Continue with ChatGPT**。完成官方登录并授权使用套餐，选择模型后确认。

3. 在设置中选择界面语言和翻译目标语言。开启 MUBI 原文字幕，同意字幕处理后在此网站启动，再刷新视频页面。

4. 观看时保持连接标签页打开。无需安装 Python、Codex CLI 或本地助手。令牌仅保存在该标签页内存中。要撤销访问，请退出登录。

## 翻译与隐私

可用时读取完整字幕文件，分批提前翻译播放位置后最多5分钟的内容。刚开始或跳转到未准备的位置时可能等待。仅检测屏幕字幕时会更慢。

默认界面为英语，可在设置中选择16种语言。翻译目标语言单独设置。扩展免费，但仍受 ChatGPT 套餐和额度限制。字幕、上下文和翻译偏好直接发送到 OpenAI。

从 GitHub 安装不需要商店开发者账户，尚未提交网上应用店。Ollama 和 Codex CLI 是需要额外安装的可选模式。

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
