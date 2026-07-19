# 웹 스택과 디바이스 타깃

Status: closed
Labels: wayfinder:grilling
Assignee: MMDAL (fable session, 2026-07-19)
Blocked-by: 03

## Question

DOM 프레임워크(Svelte/React 등) vs 캔버스 엔진(Phaser/PixiJS) — 코어 루프의 인터랙션·연출 요구 수준을 기준으로 결정. 디바이스 타깃(데스크톱 브라우저 우선 vs 모바일 1급)과 정적 배포 체인(itch.io butler 재사용 여부)도 여기서 함께 확정.

## Resolution

2026-07-19, 그릴링 세션(MMDAL × Fable).

- **디바이스 타깃**: 데스크톱 브라우저 우선, 터치 호환 설계. 레이아웃·QA는 데스크톱 기준이되 인터랙션은 클릭/탭 기반(정밀 드래그·호버 의존 최소화)으로 설계해 모바일 확장 문을 열어둠.
- **프레이밍 교정** (세션 중): 이 게임은 텍스트 중심이 아님 — 핵심 가치는 **퍼즐 명료성 + 카드 수집·시너지**. 렌더링 판단 축은 텍스트 레이아웃이 아니라 시너지 연출(juice)의 천장.
- **렌더링**: DOM 기반 + 절제된 juice. 시너지 발동·카드 연출은 Svelte 내장 transition/FLIP/motion으로 구현. juice 한계는 [코어 루프 프로토타입](11-core-loop-prototype.md)에서 검증 — 부족하면 PixiJS 카드 레이어를 덧붙이는 이스케이프 해치(전면 캔버스 전환 아님).
- **프레임워크**: **Svelte 5 + Vite + TypeScript**. SvelteKit 미사용 — 단일 페이지 게임이라 순수 Vite 정적 빌드(itch.io 임베드 경로 단순). runes($state/$derived/$effect)로 게임 상태(컬렉션·배경 상태·태그 조합식) 관리 내장 — 외부 상태 라이브러리 불필요. localStorage 저장은 $effect 기반 소형 유틸. 드래그 생태계 약점은 클릭/탭 기반 설계 결정으로 상쇄. AI 코드젠(Codex 위임)의 Svelte 4 패턴 혼입 리스크는 context7 문서 주입으로 완화.
- **배포 체인**: **itch.io butler 재사용 + GitHub Pages 병행**. Vite `dist/`를 HTML5 채널로 butler push — OUT 월간 릴리즈 런북(`f:/Project/out/docs/ops/monthly-release-runbook.md`) 패턴 재사용. GitHub Pages는 무료 정적 호스팅 슬롯, GitHub Actions로 양 채널 자동화. Railway(SAJU fortuneteller에서 사용)는 검토 후 배제 — HTTP 서버용이었고 정적 사이트엔 과투자, 서버는 out of scope.

리서치 근거: Svelte 5 runes 리뷰([Scalable Path](https://www.scalablepath.com/javascript/svelte-5-review), [PkgPulse](https://www.pkgpulse.com/blog/svelte-5-runes-complete-guide-2026)), Svelte vs React 게임/생태계 비교([Strapi](https://strapi.io/blog/svelte-vs-react-comparison), [tech-insider](https://tech-insider.org/svelte-vs-react-2026/)).
