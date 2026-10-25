# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Übersetzt vorhandene Untertitel im Voraus und zeigt sie zur ursprünglichen Dialogzeit an. Unabhängige Erweiterung, mit MUBI unter Windows Chrome getestet; kein offizielles MUBI-Produkt. Edge kann denselben Ordner laden, die Wiedergabe ist dort noch nicht geprüft.

## Installation

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Lade die ZIP-Datei der Veröffentlichung herunter und entpacke sie in einen dauerhaften Ordner. Öffne `chrome://extensions` (Edge: `edge://extensions`), aktiviere den Entwicklermodus und wähle **Entpackte Erweiterung laden → extension/**.

2. Klicke im Popup und im Verbindungstab auf **Continue with ChatGPT**. Melde dich offiziell an, erlaube die Nutzung deines Tarifs und wähle und bestätige ein Modell.

3. Wähle in den Einstellungen die App-Sprache und die Zielsprache. Aktiviere die Originaluntertitel bei MUBI, stimme der Verarbeitung zu und starte auf dieser Website. Lade die Videoseite neu.

4. Lass den Verbindungstab beim Anschauen geöffnet. Python, Codex CLI und ein lokaler Helfer sind nicht erforderlich. Tokens bleiben ausschließlich im Arbeitsspeicher dieses Tabs. Melde dich ab, um den Zugriff zu widerrufen.

## Übersetzung und Datenschutz

Wenn verfügbar, wird die komplette Untertiteldatei geladen. Die Übersetzung erfolgt stapelweise bis zu fünf Minuten im Voraus. Beim Start und bei Sprüngen außerhalb des vorbereiteten Bereichs kann es dauern. Das Erkennen sichtbaren Textes kann langsamer sein.

Die Oberfläche ist standardmäßig Englisch und bietet 16 Sprachen in den Einstellungen. Die Zielsprache wird separat eingestellt. Die Erweiterung ist kostenlos; ChatGPT-Tarif- und Nutzungslimits gelten weiterhin. Untertitel, Kontext und Vorgaben werden direkt an OpenAI gesendet.

Für die Installation von GitHub ist kein Store-Entwicklerkonto nötig. Die Erweiterung wurde noch nicht im Store eingereicht. Ollama und Codex CLI sind optionale Modi mit zusätzlichem Installationsbedarf.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
