# Subtitle Translator for MUBI

[English](../README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md)

기존 자막을 미리 번역해 대사 시간에 맞춰 표시합니다. Windows Chrome의 MUBI에서 확인한 독립 확장으로, MUBI 공식 제품은 아닙니다. Edge는 같은 폴더를 로드할 수 있지만 실제 재생 검증은 아직입니다.

## 설치

[ZIP / Releases](https://github.com/hyungwoo-jo/mubi-subtitle-translator/releases)

1. 배포 ZIP을 고정 폴더에 풉니다. `chrome://extensions`(Edge: `edge://extensions`)에서 개발자 모드를 켜고 **압축해제된 확장 프로그램 로드 → extension/**을 선택합니다.

2. 팝업과 연결 탭에서 **Continue with ChatGPT**를 누릅니다. 공식 로그인과 구독 사용 허용을 마친 뒤 모델을 선택하고 확인합니다.

3. 설정에서 앱 언어와 번역 목표 언어를 정합니다. MUBI 원문 자막을 켜고 자막 처리에 동의한 뒤 **이 사이트에서 시작**을 누릅니다. 영상 페이지를 새로고침합니다.

4. 시청 중 연결 탭을 열어 두세요. Python·Codex CLI·별도 도우미 설치는 필요 없습니다. 로그인 토큰은 탭 메모리에만 보관됩니다. 접근 권한을 해제하려면 로그아웃하세요.

## 번역과 개인정보

자막 파일 전체를 얻을 수 있으면 확보하고, 번역은 재생 위치에서 최대 5분 앞까지 배치로 준비합니다. 최초 재생과 준비 범위 밖 탐색에는 지연이 생길 수 있습니다. 시간표가 없는 화면 자막 감지 방식은 더 느릴 수 있습니다.

UI는 기본 영어이며 설정에서 16개 언어를 선택할 수 있습니다. 번역 목표 언어는 별도로 설정합니다. 확장은 무료지만 ChatGPT 구독·사용 한도는 적용됩니다. 자막·주변 대사·번역 지침은 OpenAI로 직접 전송됩니다.

GitHub 설치에는 스토어 개발자 등록이 필요 없습니다. 웹 스토어에는 아직 제출하지 않았습니다. 대체 제공자로 Ollama와 Codex CLI 도우미를 선택할 수 있으며 이 모드에는 별도 설치가 필요합니다.

[Privacy / 개인정보 / 隐私](PRIVACY.md) · [MUBI Terms](https://mubi.com/en/terms_of_service) · [MIT](../LICENSE)
