# 📈 US Stock Day-Trading Journal (미국 주식 단타 매매 일지)

단타 매매 시 감정적인 뇌동매매를 방지하고, 장 시작 전(Pre-market) 필수 정보를 빠르게 파악하여 기계적인 익절/손절 원칙을 지키기 위해 기획한 개인 맞춤형 트레이딩 대시보드입니다.

## 🛠 Tech Stack
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=TypeScript&logoColor=white" alt="TypeScript"/> <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=React&logoColor=black" alt="React"/> <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=Next.js&logoColor=white" alt="Next.js"/> <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"/> <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>

## ✨ Core Features
- **📱 PWA (Progressive Web App) 지원:** 모바일 브라우저에서 '홈 화면에 추가'하여 네이티브 앱처럼 화면 분할 및 전체 화면으로 활용.
- **⚡ 하이브리드 티커 캐싱:** 최초 검색 시 API를 통해 산업군(Sector) 데이터를 캐싱하여, 이후 매매 일지 작성 시 지연 없는 쾌적한 자동 완성 제공.
- **🎯 목표 및 복리 시뮬레이터:** - **영업일 기반 역산기:** 미국 증시 휴장일 배열을 하드코딩 적용하여, 실제 개장일(Trading Days)을 기준으로 목표 달성에 필요한 일일 수익률을 정확히 계산.
  - **복리 예측기:** 일일 목표 수익률(%)에 따른 1개월, 3개월 뒤 예상 잔액 시각화로 조급함 방지 및 멘탈 관리.
- **🚀 프리마켓 런치패드 (Pre-Market Launchpad):** 매크로 경제 지표 캘린더, 장전 수급, 주요 테마(의료/바이오, 친환경 등) 핵심 뉴스 스크리너로 즉시 연결되는 퀵 링크 UI 탑재.

## 💡 Technical Decisions & Troubleshooting
- **응답 속도 최적화 (Latency 최소화):** 매매 일지 입력 시마다 AI API나 외부 금융 API를 호출할 경우, 초 단위로 타점을 잡아야 하는 단타 환경에서 치명적인 입력 지연이 발생할 것으로 판단했습니다. 이를 방지하기 위해 외부 API는 1회만 조회하고 이후 Supabase DB에 캐싱된 데이터를 불러오는 하이브리드 구조를 채택했습니다.
- **Serverless DB 도입:** Next.js의 서버리스 환경에서 RDBMS 연결 시 발생할 수 있는 커넥션 풀(Connection Pool) 고갈 문제를 예방하고, 개발 생산성을 높이기 위해 PostgreSQL 기반의 BaaS인 Supabase를 도입했습니다.
- **개발 생산성 극대화:** Cursor AI를 적극 활용하여 반복적인 UI 컴포넌트 생성 및 초기 보일러플레이트 세팅 시간을 획기적으로 단축하고, 복리 계산 및 영업일 산출 같은 코어 비즈니스 로직 설계에 역량을 집중했습니다.
