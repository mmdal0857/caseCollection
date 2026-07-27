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

## Comments

- 2026-07-25 **배포 체인 파급 — 위 Resolution의 "itch.io butler 재사용" 부분은 무효.** 사용자 결정: **itch.io·Patreon 미사용.** 프레임워크·렌더링·디바이스 타깃 결정은 그대로 유효하고, 무효화된 것은 배포 체인 한 항목뿐이다(프레임워크 근거에 적힌 "itch.io 임베드 경로 단순"도 이제 근거로서 작동하지 않지만, 단일 페이지 정적 빌드 결정 자체는 다른 근거로 충분히 선다).
  - **살아남는 것**: GitHub Pages(무료 정적 호스팅 + Actions 자동화). 이것이 **정본 호스팅**이다.
  - **추가되는 것**: Higgsfield 게임 마켓플레이스 — [08 MVP 스코프](08-mvp-scope.md) §⑥의 결의. 그리고 정본이 될 수 없다: 약관 §3.4(30일 미활동 시 cold storage)·§16.2(회사의 무통보 해지권)·§16.4(콘텐츠 삭제에 대한 무책임 조항)가 그것을 막는다. 즉 **병행은 선호가 아니라 약관이 만든 제약**이다. (2026-07-27: 08 closed — §⑥ Resolution으로 정식 확정됨.)
  - **유료 채널**: 미확정. [Steam](https://partner.steamgames.com/steamdirect)이 현재 후보($100/제품, AGR $1,000 달성 시 회수, 심사 1~5일 + 결제 후 30일 대기 + 출시 2주 전 coming soon → **최소 6주 리드타임**). 콘텐츠 분량 문제로 [18](18-case-generator-shape.md) 이후 사안. Higgsfield 웹사이트+Stripe 직판은 검증까지 끝내고 후순위 대기로 내렸다([10001](10001-higgsfield-stripe-storefront.md)).
  - **웹 빌드에 걸리는 실제 제약 하나**: 데스크톱 래핑(Tauri/Electron) 가능성을 열어두려면 `dist/`가 `file://`에서도 떠야 한다 → **절대 경로·CORS·fetch 의존을 만들지 않는 것.** [16](16-external-data-pack-loading.md)의 외부 데이터 팩 로딩을 `fetch()` 기반으로 설계하면 여기서 걸린다. 비용 0이므로 지금부터 지킬 것.
  - 근거·실측: [docs/research/2026-07-25-higgsfield-games-marketplace.md](../../../docs/research/2026-07-25-higgsfield-games-marketplace.md)
