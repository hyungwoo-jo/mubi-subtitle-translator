# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Mevcut altyazıları önceden çevirir ve özgün replik zamanında gösterir. Windows Chrome üzerinde MUBI ile doğrulanmış bağımsız bir eklentidir; resmî MUBI ürünü değildir. Edge aynı klasörü yükleyebilir, ancak gerçek oynatma henüz doğrulanmadı.

## Kurulum

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Sürüm ZIP dosyasını indirip kalıcı bir klasöre çıkarın. `chrome://extensions` (Edge: `edge://extensions`) sayfasında geliştirici modunu açıp **Paketlenmemiş öğe yükle → extension/** seçin.

2. Açılır pencerede ve bağlantı sekmesinde **Continue with ChatGPT** düğmesine basın. Resmî girişi ve plan kullanım iznini tamamlayıp bir model seçerek onaylayın.

3. Ayarlardan uygulama dilini ve çeviri dilini seçin. MUBI’nin özgün altyazılarını açın, işlemeye izin verip sitede başlatın. Video sayfasını yenileyin.

4. İzlerken bağlantı sekmesini açık tutun. Python, Codex CLI veya yerel yardımcı gerekmez. Belirteçler yalnızca bu sekmenin belleğinde tutulur. Erişimi iptal etmek için çıkış yapın.

## Çeviri ve gizlilik

Mümkünse altyazı dosyasının tamamı alınır; çeviri en fazla beş dakika ilerisi için gruplar hâlinde hazırlanır. Başlangıçta ve hazırlanan aralığın dışına atlandığında bekleme olabilir. Görünür metni algılama daha yavaş olabilir.

Varsayılan arayüz İngilizcedir; ayarlarda 16 dil bulunur. Hedef dil ayrıca seçilir. Eklenti ücretsizdir, ChatGPT plan sınırları geçerlidir. Altyazılar, bağlam ve tercihler doğrudan OpenAI’ye gönderilir.

GitHub’dan kurulum için mağaza geliştirici hesabı gerekmez. Eklenti henüz mağazaya gönderilmedi. Ollama ve Codex CLI ek kurulum gerektiren isteğe bağlı modlardır.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
