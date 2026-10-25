# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Traduce in anticipo i sottotitoli esistenti e li mostra al momento originale. Estensione indipendente verificata su MUBI con Chrome per Windows; non è un prodotto ufficiale MUBI. Edge può caricare la stessa cartella, ma la riproduzione reale resta da verificare.

## Installazione

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Scarica lo ZIP della versione ed estrailo in una cartella permanente. Apri `chrome://extensions` (Edge: `edge://extensions`), attiva la modalità sviluppatore e scegli **Carica estensione non pacchettizzata → extension/**.

2. Premi **Continue with ChatGPT** nel popup e nella scheda di connessione. Completa l’accesso ufficiale, autorizza l’uso del piano e scegli e conferma un modello.

3. Nelle impostazioni scegli la lingua dell’app e quella di destinazione. Attiva i sottotitoli originali di MUBI, accetta il trattamento e avvia sul sito. Ricarica la pagina del video.

4. Tieni aperta la scheda di connessione durante la visione. Non servono Python, Codex CLI o assistenti locali. I token restano soltanto nella memoria della scheda. Esci per revocare l’accesso.

## Traduzione e privacy

Se disponibile viene caricato l’intero file dei sottotitoli, mentre la traduzione viene preparata a blocchi fino a cinque minuti in anticipo. L’avvio e i salti fuori dall’intervallo preparato possono richiedere attesa. Il rilevamento del testo visibile può essere più lento.

L’interfaccia predefinita è inglese e offre 16 lingue nelle impostazioni. La lingua di destinazione si imposta separatamente. L’estensione è gratuita; valgono i limiti del piano ChatGPT. Sottotitoli, contesto e preferenze vengono inviati direttamente a OpenAI.

L’installazione da GitHub non richiede un account sviluppatore dello store. L’estensione non è ancora stata inviata allo store. Ollama e Codex CLI sono modalità facoltative con installazione aggiuntiva.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
