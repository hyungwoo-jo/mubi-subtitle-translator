# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Traduce los subtítulos existentes por adelantado y los muestra en su momento original. Extensión independiente probada con MUBI en Chrome para Windows; no es un producto oficial de MUBI. Edge admite la misma carpeta, pero la reproducción real sigue pendiente de verificación.

## Instalación

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Descarga el ZIP de la versión y extráelo en una carpeta permanente. Abre `chrome://extensions` (Edge: `edge://extensions`), activa el modo de desarrollador y selecciona **Cargar descomprimida → extension/**.

2. Pulsa **Continue with ChatGPT** en la ventana emergente y en la pestaña de conexión. Completa el inicio de sesión oficial, autoriza el uso del plan y elige y confirma un modelo.

3. En Ajustes elige el idioma de la aplicación y el idioma de destino. Activa los subtítulos originales de MUBI, acepta su procesamiento e inicia la extensión en el sitio. Recarga la página del vídeo.

4. Mantén abierta la pestaña de conexión mientras miras. No necesitas Python, Codex CLI ni un asistente local. Los tokens solo están en la memoria de esa pestaña. Cierra la sesión para revocar el acceso.

## Traducción y privacidad

Cuando está disponible se carga el archivo completo de subtítulos y se traduce por lotes hasta cinco minutos por delante. El inicio y los saltos fuera de la ventana preparada pueden tardar. La detección de texto visible puede ser más lenta.

La interfaz predeterminada es inglesa y ofrece 16 idiomas en Ajustes. El idioma de destino se configura aparte. La extensión es gratuita; se aplican los límites de tu plan de ChatGPT. Los subtítulos, el contexto y las preferencias se envían directamente a OpenAI.

Instalar desde GitHub no requiere una cuenta de desarrollador de la tienda. Aún no se ha enviado a la tienda. Ollama y Codex CLI son modos opcionales que requieren instalación adicional.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
