# CueBraid

[English](../README.md) · 한국어 · [日本語](README.ja.md)

기존 자막을 미리 번역해 원래 대사 시간에 맞춰 표시하는 독립 확장입니다.
**실제 검증 대상은 Windows Chrome의 MUBI**입니다. MUBI 공식 제품·제휴 제품은 아닙니다.
다른 사이트와 Edge는 실험적 대상으로, 작동을 보장하지 않습니다.

## 처음 설치

1. GitHub Release의 전체 배포 ZIP(`cuebraid-VERSION.zip`)을 고정 폴더에 풉니다.
2. `chrome://extensions` 또는 `edge://extensions`에서 개발자 모드를 켜고 `extension/`을 로드합니다.
3. 같은 PC에 Python 3.10 이상과 [Codex CLI](https://learn.chatgpt.com/docs/codex/cli)를 설치합니다.
4. 압축을 푼 폴더에서 `python native/setup.py --browser chrome --login`을 실행합니다.
   확장 관리 화면에 표시된 ID를 붙여넣고 공식 Codex 화면에서 ChatGPT 계정으로 로그인합니다.
5. CueBraid 설정에서 목표 언어와 계정에서 사용할 수 있는 모델을 선택하고 도우미 연결을 확인합니다.
6. MUBI 원문 자막을 켜고 확장 팝업에서 자막 처리에 동의한 뒤 사이트 사용을 시작합니다. 페이지를 새로고침합니다.

기본 앱 언어는 영어입니다. Settings → App language에서 한국어·일본어를 선택할 수 있습니다.
앱 표시 언어와 번역 결과 언어는 별개입니다. 확장만 설치하면 번역이 되지는 않으며 로컬 도우미가 필요합니다.

## GPT 외의 모델

Ollama를 이 PC에 설치하고 모델을 준비한 뒤,
`python native/install.py EXTENSION_ID --provider ollama`로 도우미를 등록할 수 있습니다.
설정에서 Ollama와 설치한 정확한 모델 이름을 지정합니다. 실제 모델의 품질·속도는 아직 검증하지 않았습니다.
Claude·Gemini API는 이번 버전에 구현하지 않았습니다.

## 사용량과 제한

자막 전체 파일을 받을 수 있으면 먼저 확보하며, 번역은 현재 위치에서 최대 5분 범위만 준비합니다.
초기 8문장, 이후 최대 40문장씩 번역하고 문장별 캐시를 재사용합니다. 처음과 크게 탐색한 뒤에는 기다릴 수 있습니다.
시간표를 못 얻으면 화면 자막을 읽는 방식으로 전환되며 모델 응답만큼 늦어집니다.

확장은 무료입니다. 모델 제공자 비용·구독 한도는 별도이며 자막과 문맥이 선택한 제공자에게 전달됩니다.
[개인정보 처리 안내](PRIVACY.md)를 확인하세요. MUBI 약관은 자동 수집·콘텐츠 변경·일부 AI 이용을 제한하므로
무료 배포라고 문제가 없다고 보장할 수는 없습니다. [MUBI 약관](https://mubi.com/en/terms_of_service)을 확인하세요.

GitHub 설치에는 스토어 개발자 등록이 필요 없습니다. Chrome 웹 스토어에는 아직 제출하지 않았습니다.
