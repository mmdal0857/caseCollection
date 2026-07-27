# caseCollection

OUT 프로젝트(`f:/Project/out`)의 LLM 위키를 기반으로 하는 웹 카드 콜렉션 게임. wayfinder 지도로 진행 — 정본은 `.scratch/case-collection/MAP.md` (현재 상태·프론티어는 지도의 Decisions so far와 open 티켓이 권위). 리서치 산출물은 `docs/research/`.

**주의: `MAP.md`는 색인이지 정본이 아니다.** 한 줄 요약은 채택안만 남기고 기각·유예된 대안을 지운다 — 결정 상태를 판정하려면 반드시 티켓 원문을 대조할 것.

## 기술 스택 (ticket 05 확정)

**Svelte 5 + Vite + TypeScript** (SvelteKit 미사용 — 단일 페이지 정적 빌드). 배포는 **GitHub Pages(정본) + Higgsfield 게임 마켓플레이스(병행)**.

> **배포 채널 (2026-07-25 개정)**: **itch.io·Patreon은 미사용**이 사용자 결정이다 — ticket 05 원 Resolution의 "itch.io butler"는 무효이며 05의 `## Comments`에 개정 기록이 있다. 앞 세션이 남긴 "변경 계류 중" 경고는 이 결정으로 해소됐다.
>
> - **GitHub Pages가 정본 호스팅.** Higgsfield는 정본이 될 수 없다 — 약관 §3.4(30일 미활동 시 cold storage)·§16.2(무통보 해지권)·§16.4(콘텐츠 삭제 무책임)가 막는다. **병행은 선호가 아니라 약관이 만든 제약.**
> - Higgsfield 마켓플레이스 등재는 [ticket 08](.scratch/case-collection/issues/08-mvp-scope.md) §⑥으로 **2026-07-27 정식 Resolution 확정**(closed) — GitHub Pages+Higgsfield 병행 유지, itch.io·Patreon 미사용 재확인, 유료 채널은 여전히 Steam 후보([18](.scratch/case-collection/issues/18-case-generator-shape.md) 이후 사안). **게시는 비가역**이다(약관 §4.3 영구·취소불가 실시권, CLI에 게임 삭제 커맨드 없음).
> - **유료 채널은 미확정.** Steam이 후보이나 [18](.scratch/case-collection/issues/18-case-generator-shape.md) 이후 사안(리드타임 6주+). Higgsfield 웹사이트+Stripe 직판은 검증 완료 후 후순위 대기 → [ticket 10001](.scratch/case-collection/issues/10001-higgsfield-stripe-storefront.md).
> - 근거·실측: [docs/research/2026-07-25-higgsfield-games-marketplace.md](docs/research/2026-07-25-higgsfield-games-marketplace.md). `higgsfield game deploy/publish` 사용법은 전역 CLAUDE.md 참조.

- **Svelte 5 `$state` 프록시는 `structuredClone`으로 복제 불가** (`DataCloneError`). 순수 리듀서에 상태를 넘길 땐 반드시 `$state.snapshot(state)`로 평범한 객체를 만들어 전달할 것. 이걸 놓치면 모든 dispatch가 조용히 예외로 죽어 화면이 멈춘다 (프로토 v1에서 실제 발생).
- 파생값은 `$derived`, 복합 계산은 `$derived.by`. `$props()` 값을 지역 상수로 캡처하면 `state_referenced_locally` 경고 — 의도한 초기값 캡처가 아니면 `$derived`로.

## 프로토타입 자산

코어 루프 프로토타입(v1~v10.1, ticket 11·17·19)은 **main의 `prototype/core-loop/`**에 있다 — 2026-07-23 `b2596bf`로 병합됐고 동명 브랜치는 삭제됐다. **예전 문서의 `git checkout prototype/core-loop`는 무효.** 실행: `cd prototype/core-loop && npm install && npm run dev`.

> **예외 — 격리 프로토는 다시 생겼다 (2026-07-27, 사용자 소관 미결).** [ticket 18](.scratch/case-collection/issues/18-case-generator-shape.md)의 case 생성기 로직과 [ticket 26](.scratch/case-collection/issues/26-openwiki-candidate-discovery-pilot.md)의 OpenWiki 파일럿은 각각 `.worktrees/case-generator-shape`·`.worktrees/openwiki-candidate-pilot` 워크트리에만 있고 main엔 없다 — 위 문단의 "프로토는 main"이 전면 무효는 아니지만 **이 둘은 예외**다. 18의 검증(smoke·tsc·build 통과)은 이 격리 브랜치에서 얻은 결과라 main에서 재현되지 않는다. 격리 유지/main 병합/이 문단 자체의 개정 중 무엇을 할지는 아직 미정 — 다음 세션이 이 상태를 "정리가 덜 됐다"로 오판하지 않도록 남겨둔다.

검증된 **순수 모듈**은 스펙 입력이자 **빌드 파이프라인의 콘텐츠 검증기**로 승격 예정 — `engine.ts`(솔버빌리티), `facets.ts`(얼굴 합법성·해석 공간), `dramaturgy.ts`(코믹 반응 생성), `scenario.ts`(서사 응집), `persona.ts`, `josa.ts`, `datapack.ts`(데이터 팩 로더).

**기계 검증기 실행**:

```
cd prototype/core-loop
npm run smoke
npm run smoke:datapack
```

데이터 팩 추출 파이프라인(티켓 14 뼈대 — 3·4단계 STUB): `py scripts/extract_game_data_pack.py`

## 카드 아트 (ticket 13 확정, ticket 08로 볼륨 최종화)

**명사는 생성하고 형용사는 계산한다** — 카드 아트 = 사물 1장(생성) × 태그 처리 5종(CSS). 측면마다 굽지 않는다: 측면이 태그 조합 7종으로 접히므로 구우면 훨씬 많아지고, 계산하면 카드 수 + 처리 5종이고 **측면이 확정될 때 전이로 움직인다**. **MVP 볼륨은 [ticket 08](.scratch/case-collection/issues/08-mvp-scope.md) §④가 24장(단서 20+패턴 4)·case 4개로 확정 마감했고 확장 경로가 없다** — 위키 clue_type 49종은 생성기([ticket 18](.scratch/case-collection/issues/18-case-generator-shape.md), MVP 밖)가 있어야 열리는 이후 지평이지 현재 목표가 아니다.

**2026-07-27 기준 단서 20장 전량 생성·검수·Drive 동기화 완료**(패턴 4·힌트 2는 `cardart-manifest.jsonl`에 `category:"adjunct", enabled:false`로 보류 — 시각 규칙 별도 결정 전까지 배치 생성에서 자동 제외).

```
node scripts/cardart-batch.mjs [--dry-run] [--force] [id...]   # manifest 기반 재개 가능 배치 생성 (정본 진입점)
bash scripts/cardart-generate.sh <card_id> "<desc>" [single|group]  # 단건 생성 — batch가 내부에서 호출
bash scripts/protoart-prompts.sh                                # 스타일 4안 시안 재현
scripts\sync-cardart.cmd push|pull "G:\내 드라이브\caseCollection\cardart\clues"  # Drive 정본과 동기화
```

카드 사물 묘사는 `scripts/cardart-manifest.jsonl`이 정본(`node scripts/check-cardart-manifest.mjs`로 정합성 검증). 모델은 2026-07-27 48장 벤치마크 후 `gpt_image_2` low, 3:4, 1k(0.5크레딧/장, 이전 `nano_banana_pro` 2크레딧에서 교체 — 가독성·스타일 충실도 동시 우위, 근거는 `docs/art/README.md`)로 확정. 생성 바이너리는 미커밋(`.gitignore`) — 완성본은 Google Drive(`G:\내 드라이브\caseCollection\cardart\clues`)가 정본이고 `sync-cardart.cmd`로 명시적 push/pull한다(Drive 커넥터 OAuth 불가로 자동 동기화 없음). 생성 규칙 3가지(용도 아닌 사물을 그린다 / 바탕을 근-흑색으로 못박는다 / 조명 중립)는 `scripts/cardart-generate.sh` 주석에 근거와 함께 있다.

> **예외 하나 — `docs/art/style-key.png`는 커밋한다.** 이건 산출물이 아니라 **입력**이고 생성이 확률적이라 레시피로 재현되지 않는다. 키가 없으면 카드마다 다른 스타일로 구워진다. 2026-07-26에 실제로 키가 부재했고 `cardart-generate.sh`가 **경고 없이 레퍼런스 없이 생성**하도록 돼 있었다(지금은 키 부재 시 exit 2). 배경도 같은 키를 문다. 근거·재생성 절차·Drive 동기화 세부: [docs/art/README.md](docs/art/README.md).

**프로토 하네스는 THROWAWAY** — `src/lib/protoart.svelte.ts`, `src/lib/ui/ArtSwitcher.svelte`는 시안 비교용이므로 UI 재작성 시 삭제한다. 반면 `CardChip.svelte`의 아트 슬롯 + 슈트 폴백과 `app.css`의 프레임·태그 처리 CSS는 **승격된 실물**이다.

## Agent skills

### Issue tracker

Local markdown tracker under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default role strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

### Codex collaboration

Codex handles code (refactor/review/diagnosis on `prototype/core-loop/`) — not design decisions (except the narrow "Claude 한도" exception, 2026-07-27: Codex may progress a design ticket when Claude is session/token-limited, but the result is provisional until Claude's mandatory 4-point review fills `Reviewed-by:`), not image generation (that's Higgsfield CLI, above — Codex may build generation *tooling* like the manifest/batch scripts but doesn't call the model itself). Standing `action_safety` block + behavior-preservation gate (smoke tests). Token expiry handoff and Claude's independent review/integration flow also live in `docs/agents/codex-collab.md`.
