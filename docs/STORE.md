# Chrome Web Store submission draft

Status: NOT SUBMITTED. The owner has not registered a Chrome Web Store developer account.
A developer account, one-time registration fee, dashboard declarations and Google review are still required.
GitHub distribution does not require that registration. Do not describe this as an approved store extension.

## Listing

Name: CueBraid — Subtitle Translator

Summary: Translate subtitles ahead and watch in sync. Independent extension tested with MUBI.

Description:

CueBraid translates existing subtitles before they appear, caches the results, and displays them at the original cue times.
Tested with MUBI on Windows Chrome. This is an independent project, not affiliated with or endorsed by MUBI.
Other streaming sites are experimental. English, Korean and Japanese app interfaces are included.

A separate local helper and a translation provider are required. Codex CLI uses your own ChatGPT account;
Ollama connects to a model running on your PC. The extension is free; provider fees and account limits may apply.
Initial preparation and large seeks can take several seconds. It does not transcribe audio or download films.
Use only where service terms and content rights permit automated access and translation.

## Files and declarations

Upload `out/cuebraid-webstore-VERSION.zip` only; the extension manifest must be at the ZIP root.
Native helper files are installed separately from the complete GitHub release ZIP.
Privacy URL: https://github.com/hyungwoo-jo/cuebraid/blob/main/docs/PRIVACY.md
Support URL: https://github.com/hyungwoo-jo/cuebraid/issues

Single purpose: translate existing video subtitles and display them in sync with playback.
Permissions: storage for preferences/cache; scripting and activeTab for enabled pages; nativeMessaging for the local helper.
Optional HTTP(S) site permission is requested only after a user action, for that site. All-site access is not granted on installation.
Website content (subtitles and context) is processed and transferred to the selected provider after confirmation.
Local storage and diagnostics must also be disclosed. Do not claim no user data is handled or that all translation stays on-device.
No remote executable code is loaded by the extension. Model output is displayed as text, never executed.

Before submission: add screenshots of the actual UI, verify clean-PC installation and Edge behavior,
confirm the dashboard's data-use declarations, and review third-party service terms.
MUBI terms 3.5 restrict automated access, modification and some AI uses; store approval is not permission from MUBI.

Sources checked 25 October 2026:

- https://developer.chrome.com/docs/webstore/register/
- https://developer.chrome.com/docs/webstore/program-policies/policies
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- https://mubi.com/en/terms_of_service
