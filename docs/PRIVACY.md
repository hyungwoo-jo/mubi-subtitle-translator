# Subtitle Translator for MUBI privacy policy

Updated: 25 October 2026

Subtitle Translator for MUBI is an independent subtitle translation extension. It is not affiliated with MUBI.

On a site you enable, Subtitle Translator for MUBI reads subtitle text, timing and nearby dialogue. After your confirmation,
browser-only ChatGPT mode sends subtitles and translation preferences directly to OpenAI. Optional legacy modes send them to the local helper. The Codex adapter sends them to OpenAI through your own Codex sign-in.
The Ollama adapter sends them to 127.0.0.1:11434. On-device inference requires a local model;
Ollama cloud models and your own configuration may forward data to another service.

Preferences, translated dialogue and numerical usage totals are stored in browser local storage.
Diagnostics are saved on the PC and include hostnames, element structure, counts and response metadata, but not dialogue text.
No Subtitle Translator for MUBI-operated analytics, ads, tracking service or translation relay server is used.
The extension does not request your ChatGPT password, read authentication cookies or copy Codex login tokens.
Codex handles its own authentication. Provider terms, retention rules and account limits apply.

You can disable individual sites, clear the translation cache in Settings, or uninstall the extension to remove its browser storage.
Local helper diagnostic files remain on the PC until you remove them. Temporary Codex event files are removed after processing.

For questions, open an issue at https://github.com/hyungwoo-jo/mubi-subtitle-translator/issues.
Do not include private dialogue, login credentials or signed media URLs in public issues.

## Browser-only ChatGPT mode

The direct ChatGPT mode uses the official OAuth authorization flow. It requests identity and ChatGPT-plan permissions separately and validates the ID token and granted scopes.
Access, refresh and retained identity tokens exist only in the open extension connection tab's memory, never in browser storage or diagnostics.
The browser stores basic account labels, the issued client ID and a nonidentifying host ID to support future sign-ins.
Subtitle requests are sent directly to https://api.openai.com/v1/responses with the user's permission. There is no project relay server.
Closing the connection tab clears local credentials. The explicit Sign out action requests remote revocation; if revocation is not confirmed, the interface says so.

## 한국어

사용자가 허용한 사이트의 자막·시간표·참고 문맥을 읽고, 동의 후 선택한 번역 제공자에게 전달합니다.
Codex는 OpenAI에, Ollama는 이 PC의 로컬 서비스에 연결합니다. Ollama 클라우드 모델은 외부 전송이 있을 수 있습니다.
번역 캐시는 브라우저에, 대사를 제외한 진단은 PC에 저장합니다. 자체 분석·광고·번역 중계 서버는 없습니다.
설정에서 캐시를 비우거나 사이트 사용을 해제할 수 있습니다. PC의 진단 파일은 별도로 정리해야 합니다.

## 日本語

許可したサイトの字幕・時刻・参考文脈を読み取り、同意後に選択した翻訳プロバイダーへ送信します。
CodexはOpenAIに、OllamaはこのPCのローカルサービスに接続します。Ollamaクラウドモデルは外部送信を伴う場合があります。
翻訳キャッシュはブラウザーに、台詞を除く診断はPCに保存します。独自の分析・広告・翻訳中継サーバーはありません。
設定でキャッシュを消去し、サイトを無効にできます。PC上の診断ファイルは別途削除する必要があります。
