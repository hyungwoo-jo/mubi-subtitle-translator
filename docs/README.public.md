<p align="center"><img src="extension/icons/logo.svg" width="88" alt="CueBraid logo"></p>

# CueBraid

**Translate ahead. Watch in sync.**

[English](README.md) · [한국어](docs/README.ko.md) · [日本語](docs/README.ja.md)

An independent subtitle translation extension, **tested with MUBI on Windows Chrome**.
CueBraid reads existing subtitle timelines, translates dialogue ahead of playback, and shows each translation at its original cue time.
It is not affiliated with or endorsed by MUBI. Other players may work, but they are experimental rather than advertised as supported.

<img src="docs/assets/popup-en.png" width="340" alt="CueBraid English popup with synthetic demo data">

*Interface preview with synthetic subtitle counts; no film or real dialogue is included.*

## What it does

- Fetches a complete subtitle file when available, or prepares segmented subtitles up to five minutes ahead.
- Translates the needed window in batches: eight cues initially, then up to 40 cues / 24,000 characters.
- Displays translations only during dialogue; keeps controls out of the video until you open them.
- Reuses per-cue translations when seeking or reloading.
- Offers English UI by default, with Korean and Japanese in **Settings → App language**.
- Supports **Codex CLI with your ChatGPT account**, or an experimental **Ollama** adapter on this PC.

This is an early release for technically comfortable users. A separate local helper is required; installing the extension alone is not enough.
Initial translation and seeking outside the prepared window can take several seconds. Voice transcription is not included.

## Install

1. Download the complete `cuebraid-VERSION.zip` release and extract it to a permanent folder.
2. Open `chrome://extensions` or `edge://extensions`, enable **Developer mode**, and choose **Load unpacked → extension/**.
3. Install Python 3.10+ and [Codex CLI](https://learn.chatgpt.com/docs/codex/cli) on this same PC.
4. Open a terminal in the extracted folder and run the guided setup, using the extension ID shown in your browser:

```sh
python3 native/setup.py --browser chrome --login
```

On Windows, use `python` or `py -3` if `python3` is unavailable. For Edge, use `--browser edge`.
The setup checks prerequisites, registers the helper, and launches the **official Codex sign-in flow**. It does not download software or copy login credentials.
If Codex is already signed in, registration can be reused; `--login` is optional.

5. In **Settings**, choose the target language and a model your account can access; check the helper connection.
6. Open MUBI, enable its original subtitles, open CueBraid, accept the subtitle-processing notice and select **Start on this site**.
7. Reload the video page. The popup shows loaded source cues, prepared translations, and the current translated buffer.

You do not need a Chrome Web Store developer account to install from GitHub.
This release has not been submitted to the Chrome Web Store. Chrome/Edge settings, permissions and caches are separate.
After updates, reload the extension and the video page in each browser.

### Ollama instead of Codex

Install Ollama and a suitable model on the browser PC, then register without requiring Codex:

```sh
python3 native/install.py EXTENSION_ID --browser chrome --provider ollama
```

In Settings, select **Ollama**, enter the exact installed model name, and check the helper connection.
The adapter connects only to `127.0.0.1:11434`. A locally running model is needed for on-device inference; Ollama cloud models or your server configuration may forward data.
The adapter protocol and response checks are tested with a simulated backend; real model quality and speed are not yet verified.
Claude, Gemini and other cloud APIs are not implemented in this release. API keys are not collected by the extension.

## Compatibility

| Target | Status |
| --- | --- |
| MUBI / Windows Chrome | Actual timed subtitle capture and pretranslation verified |
| Edge | Code-compatible target; actual playback verification pending |
| Other streaming sites | Experimental; do not assume support |
| Native TextTrack, VTT, SRT, TTML, ASS, JSON3 | Synthetic parser/browser coverage |
| DASH sidecar, TTML SegmentTemplate/SegmentTimeline | Synthetic coverage; MUBI timeline verified |
| DASH SegmentList, MP4 wvtt demuxing | Not implemented |

If a timeline is unavailable, CueBraid falls back to visible subtitle text. That mode translates after a cue appears and can lag by the model response time.

## Privacy, permissions and cost

Subtitles, nearby dialogue and translation preferences go to your selected provider through the local helper.
With Codex selected, this means OpenAI; with Ollama selected, the local Ollama service processes the request.
Translations are cached in browser local storage. Diagnostics remain on the PC and exclude dialogue text.
No CueBraid-operated analytics, advertising or translation relay server is used.

The extension is free and open source. Your model provider's charges, subscription limits and hardware requirements still apply.
Token totals cover measured successful requests, not all account activity. See the [privacy policy](docs/PRIVACY.md).

Site terms and content rights still apply. MUBI's terms restrict automated access, content modification and some AI uses; free distribution does not remove those restrictions.
Review the [MUBI terms](https://mubi.com/en/terms_of_service) before use. CueBraid does not include film footage, real subtitle datasets, MUBI logos or DRM-decryption functionality.

## Develop

```sh
npm run lint
npm test
python3 tests/browser_check.py
npm run build
```

The browser suite requires Python Playwright and Chromium. Unit tests use built-in Node/Python tooling.
The store-upload ZIP contains only the extension; the complete ZIP also includes the local helper. Store publishing requires a registered developer account and review.

[MIT License](LICENSE) · [Store submission notes](docs/STORE.md)
