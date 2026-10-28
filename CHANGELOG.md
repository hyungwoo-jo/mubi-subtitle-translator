# Changelog

## 0.2.4

- Simpler interface: a flat logo, neutral colors that follow the system light or dark theme, and one primary button per screen.
- The popup shows three setup steps (consent, ChatGPT connection, start on this site), ticks each one off and folds away once all are done. It shows the connected ChatGPT account.
- Subtitle controls: **Hide** now only closes the panel; the new **Turn off** button stops translation.
- Settings are grouped into translation preferences and provider. ChatGPT mode hides the model field and extension ID, because the model is chosen in the connection tab.
- Sign out is disabled until you are signed in. Disabled buttons are visibly dimmed.
- Privacy policy: describes the automatic MUBI diagnostic snapshot; Korean and Japanese summaries now cover the ChatGPT browser mode.
- GitHub Actions runs lint, unit tests, both Chromium browser suites and the release build on every push and pull request.

## 0.2.3

- Native subtitle tracks are no longer rebuilt every 100 ms when they contain empty or duplicate cues.
- Playback status messages respect the selected interface language. Remaining CueBraid names are removed.

## 0.2.2

- 16 interface languages with matching installation guides, including right-to-left layout for Arabic.

## 0.2.1

- Browser-only ChatGPT sign-in: no Python, Codex CLI or local helper required.
- Prevents duplicate overlays after reinjection and hides translations already shown by the player.
- Renamed to Subtitle Translator for MUBI.

## 0.1.9

- First public preview (as CueBraid), using a local Codex CLI or Ollama helper.
