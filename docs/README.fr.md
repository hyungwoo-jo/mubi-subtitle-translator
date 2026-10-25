# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Traduit les sous-titres existants à l’avance et les affiche au moment prévu. Extension indépendante testée avec MUBI sur Chrome pour Windows, sans affiliation à MUBI. Edge peut charger le même dossier ; la lecture réelle reste à vérifier.

## Installation

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Téléchargez le ZIP de la version et extrayez-le dans un dossier permanent. Ouvrez `chrome://extensions` (Edge : `edge://extensions`), activez le mode développeur et choisissez **Charger l’extension non empaquetée → extension/**.

2. Cliquez sur **Continue with ChatGPT** dans la fenêtre de l’extension puis dans l’onglet de connexion. Effectuez la connexion officielle, autorisez l’utilisation du forfait et choisissez puis confirmez un modèle.

3. Dans les paramètres, choisissez la langue de l’application et la langue cible. Activez les sous-titres originaux de MUBI, acceptez leur traitement et démarrez sur ce site. Actualisez la page vidéo.

4. Gardez l’onglet de connexion ouvert pendant le visionnage. Aucun Python, Codex CLI ou assistant local n’est nécessaire. Les jetons restent uniquement en mémoire dans cet onglet. Déconnectez-vous pour révoquer l’accès.

## Traduction et confidentialité

Le fichier complet de sous-titres est chargé lorsqu’il est disponible, puis traduit par lots jusqu’à cinq minutes à l’avance. Le démarrage et les sauts hors de la zone préparée peuvent demander un délai. La lecture du texte visible peut être plus lente.

L’interface est en anglais par défaut, avec 16 langues disponibles dans les paramètres. La langue cible se règle séparément. L’extension est gratuite ; les limites du forfait ChatGPT s’appliquent. Sous-titres, contexte et préférences sont envoyés directement à OpenAI.

L’installation depuis GitHub ne nécessite aucun compte développeur de boutique. L’extension n’a pas encore été soumise à la boutique. Ollama et Codex CLI sont des modes facultatifs nécessitant une installation supplémentaire.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
