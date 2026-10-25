# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Menerjemahkan subtitel yang sudah tersedia lebih awal dan menampilkannya sesuai waktu dialog asli. Ekstensi independen yang diuji di MUBI pada Chrome Windows; bukan produk resmi MUBI. Edge dapat memuat folder yang sama, tetapi pemutaran nyata belum diverifikasi.

## Pemasangan

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Unduh ZIP rilis dan ekstrak ke folder tetap. Buka `chrome://extensions` (Edge: `edge://extensions`), aktifkan mode developer, lalu pilih **Load unpacked → extension/**.

2. Tekan **Continue with ChatGPT** di popup dan tab koneksi. Selesaikan login resmi, izinkan penggunaan paket, lalu pilih dan konfirmasi model.

3. Di Pengaturan, pilih bahasa aplikasi dan bahasa terjemahan. Aktifkan subtitel asli MUBI, setujui pemrosesan, lalu mulai di situs ini. Muat ulang halaman video.

4. Biarkan tab koneksi terbuka saat menonton. Tidak perlu Python, Codex CLI, atau helper lokal. Token hanya disimpan di memori tab tersebut. Keluar untuk mencabut akses.

## Terjemahan dan privasi

Jika tersedia, seluruh berkas subtitel dimuat; terjemahan disiapkan berkelompok hingga lima menit ke depan. Awal pemutaran dan perpindahan ke luar rentang siap dapat memerlukan waktu. Deteksi teks yang terlihat bisa lebih lambat.

Antarmuka bawaan berbahasa Inggris dengan 16 pilihan bahasa di Pengaturan. Bahasa terjemahan diatur terpisah. Ekstensi ini gratis; batas paket ChatGPT tetap berlaku. Subtitel, konteks, dan preferensi dikirim langsung ke OpenAI.

Pemasangan dari GitHub tidak memerlukan akun developer toko. Ekstensi belum diajukan ke toko. Ollama dan Codex CLI adalah mode opsional yang memerlukan pemasangan tambahan.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
