# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

Dịch trước phụ đề có sẵn và hiển thị đúng thời điểm lời thoại gốc. Tiện ích độc lập đã kiểm tra với MUBI trên Chrome Windows, không phải sản phẩm chính thức của MUBI. Edge có thể tải cùng thư mục, nhưng chưa xác minh việc phát thực tế.

## Cài đặt

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. Tải ZIP bản phát hành và giải nén vào thư mục cố định. Mở `chrome://extensions` (Edge: `edge://extensions`), bật chế độ nhà phát triển rồi chọn **Tải tiện ích đã giải nén → extension/**.

2. Nhấn **Continue with ChatGPT** trong cửa sổ tiện ích và thẻ kết nối. Hoàn tất đăng nhập chính thức, cho phép dùng gói, rồi chọn và xác nhận mô hình.

3. Trong Cài đặt, chọn ngôn ngữ ứng dụng và ngôn ngữ đích. Bật phụ đề gốc MUBI, đồng ý xử lý rồi bắt đầu trên trang này. Tải lại trang video.

4. Giữ thẻ kết nối mở khi xem. Không cần Python, Codex CLI hay trình trợ giúp cục bộ. Token chỉ được giữ trong bộ nhớ của thẻ. Đăng xuất để thu hồi quyền truy cập.

## Dịch và quyền riêng tư

Nếu có, tiện ích đọc toàn bộ tệp phụ đề và dịch theo lô trước tối đa năm phút. Khi bắt đầu hoặc tua ra ngoài khoảng đã chuẩn bị có thể phải chờ. Nhận diện chữ đang hiển thị có thể chậm hơn.

Giao diện mặc định là tiếng Anh với 16 ngôn ngữ trong Cài đặt. Ngôn ngữ đích được đặt riêng. Tiện ích miễn phí nhưng vẫn áp dụng giới hạn gói ChatGPT. Phụ đề, ngữ cảnh và tùy chọn được gửi trực tiếp tới OpenAI.

Cài từ GitHub không cần tài khoản nhà phát triển cửa hàng. Tiện ích chưa được gửi lên cửa hàng. Ollama và Codex CLI là các chế độ tùy chọn cần cài đặt thêm.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
