# Slack to MAXQDA Adapter

Slack 대화를 MAXQDA 호환 형식으로 내보내기 위한 데스크톱 애플리케이션.

## 특징

- Slack 채널 메시지를 DOCX 또는 Markdown 형식으로 내보내 MAXQDA 분석 가능
- Electron 및 React로 구축된 사용자 친화적인 GUI
- 다국어 지원 (AI 번역: 영어, 일본어, 한국어, 핀란드어, 중국어, 번체 중국어, 스페인어, 포르투갈어, 네덜란드어, 우크라이나어)
- Slack 앱 매니페스트 생성기로 간편한 설정
- 크로스 플랫폼 지원 (Windows, macOS, Linux)

## 설치

[Releases](https://github.com/nae-lab/Slack-To-MAXQDA-Adaptor/releases) 페이지에서 최신 릴리스를 다운로드하세요.

## 개발

### 사전 요구 사항

- Node.js 20 이상
- npm 또는 pnpm

### 설정

```bash
# 리포지토리 클론
git clone https://github.com/nae-lab/Slack-To-MAXQDA-Adaptor.git
cd Slack-To-MAXQDA-Adaptor

# 종속성 설치
npm install

# 개발 모드 실행
npm run electron:dev
```

### 빌드

```bash
# 현재 플랫폼용 빌드
npm run dist

# 특정 플랫폼용 빌드
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## 사용법

1. 애플리케이션에서 "Slack 앱 생성 방법 보기" 클릭
2. 제공된 매니페스트를 복사하여 새 Slack 앱 생성
3. 앱을 워크스페이스에 설치하고 Bot User OAuth Token 복사
4. 애플리케이션에 토큰 입력
5. 내보낼 채널 ID와 날짜 범위 지정
6. 출력 형식 및 위치 선택
7. 내보내기 클릭

## 라이센스

MIT
