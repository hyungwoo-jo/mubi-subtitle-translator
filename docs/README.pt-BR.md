# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Traduz legendas existentes com antecedência e as exibe no tempo original. Extensão independente testada no MUBI com Chrome para Windows; não é um produto oficial do MUBI. O Edge pode carregar a mesma pasta, mas a reprodução real ainda não foi verificada.

## Instalação

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Baixe o ZIP da versão e extraia em uma pasta permanente. Abra `chrome://extensions` (Edge: `edge://extensions`), ative o modo de desenvolvedor e selecione **Carregar sem compactação → extension/**.

2. Clique em **Continue with ChatGPT** no popup e na aba de conexão. Faça o login oficial, autorize o uso do plano e selecione e confirme um modelo.

3. Nas configurações, escolha o idioma do aplicativo e o idioma de destino. Ative as legendas originais do MUBI, aceite o processamento e inicie neste site. Recarregue a página do vídeo.

4. Mantenha a aba de conexão aberta durante a reprodução. Não é necessário instalar Python, Codex CLI ou assistente local. Os tokens ficam apenas na memória dessa aba. Saia da conta para revogar o acesso.

## Tradução e privacidade

Quando disponível, o arquivo completo de legendas é carregado e a tradução é preparada em lotes até cinco minutos à frente. O início e os saltos para fora da janela preparada podem demorar. A detecção de texto visível pode ser mais lenta.

A interface usa inglês por padrão e oferece 16 idiomas nas configurações. O idioma de destino é configurado separadamente. A extensão é gratuita; os limites do plano ChatGPT continuam valendo. Legendas, contexto e preferências são enviados diretamente à OpenAI.

A instalação pelo GitHub não exige conta de desenvolvedor da loja. A extensão ainda não foi enviada à loja. Ollama e Codex CLI são modos opcionais que exigem instalação adicional.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
