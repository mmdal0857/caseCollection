# Higgsfield 웹사이트 + Stripe 직판 스토어

Status: deferred
Labels: wayfinder:prototype
Assignee:
Blocked-by:
Trigger: 게임 본체가 아닌 **부속물**(사건 파일·해설·아트북 등)을 직판할 상품이 실제로 생기고, 이미 유입이 있어 결제만 붙이면 되는 시점. 게임 본체 판매는 이 티켓이 아니다 — 그건 Steam 경로다.

## Question

`higgsfield website` 제품 위에 Stripe 결제를 붙여 직판 채널을 세울 수 있는가. 세울 수 있다면 실제로 세울 값이 있는가.

## 왜 대기인가

**기술 검증은 끝났다**(아래 실측). 대기 사유는 기술이 아니라 **경제**다.

- 이 경로는 결제·세무·환불을 전부 직접 지는 대신 **관객은 0에서 시작**한다. Steam은 $100(AGR $1,000 달성 시 회수)에 우리 장르의 구매 관객을 준다 — [01](01-mechanic-survey.md)·[09](09-acquisition-reference-research.md)가 준거로 삼은 Golden Idol·Obra Dinn이 팔린 곳이 정확히 거기다.
- 사용자 결정(2026-07-25): **itch.io·Patreon 미사용.** 이 결정으로 [05](05-web-stack.md)의 배포 체인 확정(itch.io butler)이 무효화되고, 원래 Patreon 탐문자 티어에 묶여 있던 Case File PDF가 판로를 잃었다. 이 스토어를 탐색한 계기가 그 빈자리다.
- 사용자 판단(2026-07-25): 판매 계획은 있으나 **큰 수익 목적은 아니다.**

결론: **소규모 판매 목적에는 Steam이 앞선다.** 이 스토어가 값을 갖는 시나리오는 하나뿐이고 그것이 위 `Trigger:`다.

## 실측 결과 (2026-07-25, 라이브 결제 1건으로 전 구간 입증)

전체 경위는 [docs/research/2026-07-25-higgsfield-games-marketplace.md](../../../docs/research/2026-07-25-higgsfield-games-marketplace.md)와 함께 읽을 것. 그 문서는 게임 마켓플레이스가 주제이고, 이 티켓은 웹사이트+결제가 주제다.

**결제 파이프라인 전 구간 통과**: 세션 생성(200) → D1 pending 기록 → 웹훅 수신·서명 검증 → paid 승격 + 구매자 이메일 수집 → 열람 토큰 발급 → 토큰 게이팅 파일 열람. 위조 UUID·비-UUID 토큰은 거부되며 **본문 누출 0건**. 재조회 멱등성 확인(토큰 재발급 없음). KRW 4,900이 4900으로 청구되어 **zero-decimal 처리 검증**.

## 문서에 없던 플랫폼 제약 6개 (재개 시 이걸 다시 발견하지 말 것)

1. **Managed Payments가 신규 계정에 기본 활성**이고, 즉석 `price_data` 항목에 product `tax_code`를 요구한다. 없으면 완전히 유효한 세션도 400으로 거부되는데 **에러 메시지가 "Invalid request (check your POST parameters)"로만 나와 원인 추적이 어렵다.** 이번 작업의 유일한 실질 장애물이었다. 우회 두 가지 모두 통과 확인: `managed_payments[enabled]=false` 또는 `product_data[tax_code]` 지정.
2. **Worker CSP `form-action 'self'`** → Stripe로 폼 제출 불가. fetch로 세션 URL을 받아 `window.location`으로 이동해야 한다.
3. **Worker CSP `font-src`가 `fonts.gstatic.com`으로 고정** → Fontshare 계열(Cabinet Grotesk, Satoshi)은 **조용히** 차단된다. 폰트 선택이 이 제약에 구속된다.
4. **Workers에 node `crypto`가 없다** → 웹훅 서명 검증은 WebCrypto HMAC-SHA256으로 직접 구현해야 한다(+replay 창, 상수시간 비교).
5. **`routeTree.gen.ts`를 커밋해야 CI 타입체크를 통과한다**(CI가 `tsc`와 `vite`를 병렬로 돌려 tsc가 커밋된 트리를 본다). 라우트 추가 시 로컬 재생성 필수. 그리고 `bun run build`는 스크립트가 `&`를 써서 **Windows 로컬 실행이 안 된다**(CI는 Linux라 무관 — `tsc`/`vite`를 따로 돌리면 된다).
6. **`app.manifest.json`의 `"db": true` 하나로 D1 프로비저닝 + 마이그레이션이 자동 실행된다.** 기대 이상으로 매끄러운 부분.

추가 운영 제약:
- **`higgsfield website`에 삭제 커맨드가 없다**(`categories/contest/create/db/deploy/list/publish/rename/repo-access/secrets/status`). 만들면 남고 주소 변경만 가능하다.
- **`higgsfield website secrets list`는 값을 평문 출력한다.** 이름만 나올 것으로 가정하면 안 된다 — 라이브 키로 실행 금지.
- `deploy`는 즉시 공개 라이브이며 프리뷰 단계가 없다. 커뮤니티 피드 등재(`publish`)는 별개이고 이 스토어는 **미등재** 상태다.

## 미결정 (재개 시 먼저 답할 것)

**`tax_code`를 지정해 Managed Payments를 켤 것인가, 끈 채로 세금을 직접 처리할 것인가.** 검증 빌드는 후자로 두었고 코드에 그 결정을 요구하는 주석을 남겼다. **이건 세무 판단이며 구현 판단이 아니다.** 실판매 전 필수.

## 자산 위치

- 코드: **`f:\Project\casefile-archive`** — 이 레포가 아니라 Higgsfield가 프로비저닝한 별도 git 레포(플랫폼 원격). caseCollection 레포에는 들어 있지 않다.
- 라이브: `https://casefile-archive.higgsfield.app` (미등재)
- 재사용 가능한 디자인 자산: 같은 레포의 `app/design-brief.md`(팔레트·타입·스파인·조합 선택 확정)와 `refs/`의 섹션별 레퍼런스 보드 6장. **전체 스토어를 지을 일이 생기면 Phase 0·1이 이미 끝난 상태에서 시작한다.**
- 축소 범위(사용자 결정): 에셋 키트·모션 패스·생성 커버 미제작, 섹션 6개 계획 중 2개만 구현. 스토어를 정식화하려면 이 나머지가 남은 작업이다.

## Comments

- 2026-07-25 티켓 생성. 결제 검증까지만 하고 후순위로 내리는 것은 사용자 지시. 검증 도중 축소 결정도 사용자 판단("결제가 핵심이 아닌데 개발 코스트가 큰 건 아님?") — 스킬의 정본 플로우가 "완성 제품을 지어라"였고 그것이 질문("Stripe가 되는가")보다 컸다.
