# 외부 데이터 팩 로드 (모딩 소비측)

Status: closed
Labels: wayfinder:grilling
Assignee: Codex
Reviewed-by: Claude (2026-07-29)
Blocked-by: 07

## Question

정적 게임(스펙 ①)이 외부 **데이터 팩**을 어떻게 로드·검증·병합하는가, 그리고 팩의 최소 계약(포맷·버전·id 네임스페이스·충돌 규칙)은 무엇인가.

[OUT 코어 경계](06-core-boundary.md)에서 확정: 추출 코어는 빌드타임 파이프라인이 **공유 가능한 데이터 팩**을 산출하고, 모더가 오프라인으로 파이프라인을 돌려 팩을 만들면 정적 게임이 팩을 **로드**한다(데이터 팩 모딩(a) — 런타임 LLM·서버 0). 팩의 물리 포맷·익스포트 절차는 [모듈 패키징과 소비 인터페이스](07-module-packaging.md)가 정하므로 그에 블록된다.

여기서 정하는 것은 **게임측 소비**:
- 기본 콘텐츠 vs 외부 팩의 **병합·우선순위** 규칙(id 충돌·중복 카드 처리).
- 팩 **무결성/스키마 검증**([카드 스키마와 카드화 대상](04-card-schema.md) 준수 여부, 위키 원천 id 링크 무결성).
- **비호환·손상 팩** 처리(버전 스큐, 누락 아트 폴백).
- 로드 **UX**(어디서 팩을 얹는가, 정적 클라이언트에서 로컬 파일/localStorage 경로).

산출은 스펙 ①(게임)에 편입. MVP 포함 여부는 [MVP 스코프](08-mvp-scope.md)가 판정(모딩은 post-MVP일 수 있음 — 이 티켓은 route 전체를 위한 것).

## Comments

- 2026-07-20 (opus session) [모듈 패키징과 소비 인터페이스](07-module-packaging.md) 확정으로 **로드 대상·계약 정밀화** + blocked-by 07 해소(프론티어 진입):
  - 게임이 로드하는 팩(base/mod 공통)은 **"게임 데이터 팩"** — 카드 재작성(04)·문맥 태그 추출(14)·case 생성까지 **변환 완료**된 것. 문맥 태그 추출이 LLM·빌드타임이라 플레이어 런타임엔 못 돌기 때문(코어의 generic 팩이 아니라 그 하류 산출물).
  - **단일 로드 메커니즘**: base 팩 = 레포에 커밋된 공식 아티팩트(07의 (ii)분리 빌드), mod 팩 = 외부 로드, **동일 포맷**.
  - 따라서 이 티켓의 "팩 최소 계약"은 그 **게임 데이터 팩**의 물리 포맷(버전 envelope·id 네임스페이스·기본↔외부 병합 규칙·스키마 검증)을 확정하는 것.
- 2026-07-23 (fable session) **팩 계약의 프로토판 랜딩** (근거 자산 — 계약 확정은 여전히 이 티켓 소관):
  - `prototype/core-loop/schema/game-data-pack.json`(envelope: format 표식·미래 formatVersion 거부·팩 id 규약) + `src/lib/datapack.ts`(①형태 검증 → ②base→mod 병합: 같은 id 상쇄 + 프로버넌스·상쇄 리포트 → ③병합 후 참조 무결성) + `smoke-datapack.ts` 기계 검증 33건 PASS.
  - 실측 ①: **base 팩 왕복 성립** — 실제 프로토 CONTENT를 팩으로 감싸 JSON 왕복해도 검증·병합 항등·무결성이 전부 통과 → "base와 mod는 동일 포맷"(07)이 실물로 성립.
  - 실측 ②: **id 충돌은 기능이자 함정** — 위키 추출 49건 중 2건(`omitted_witness` 등)이 수제 base id와 동명이라, 접두사 없는 병합이 base 카드를 덮어써 c3·boss가 풀 수 없게 됨 — 무결성 검사가 "정답 카드에 해당 측면 없음"으로 검출. 정식 계약은 **병기(add-alongside) vs 승격(promotion 상쇄)을 명시적 선택**으로 둬야 한다는 근거.
  - 미결(그릴링 유지): 로드 UX(로컬 파일/localStorage 경로), 누락 아트 폴백, 인터루드 구조의 스키마 조임(현재 느슨).
- 2026-07-25 (fable session) **드리프트 실측 + 봉합**: 동시 세션이 [조사 누출 중립화](19-josa-leak-neutralization.md)를 `prototype/core-loop`에 병합(`Slot.josaAfter` 필드 추가)한 뒤, 내 로더가 조용히 뒤처져 있었다 — hand-rolled TS 검증기는 애초에 "미지 필드 거부"를 안 해서 `josaAfter`가 새지 않았을 뿐이고, `schema/game-data-pack.json`은 `additionalProperties: false`를 선언해놓고 `josaAfter`를 몰라 **실제로 JSON Schema 엔진에 태우면 정상 콘텐츠를 거부**했을 상태. 팩 무결성 검증은 이 티켓의 소관이므로 여기서 봉합: `josaAfter` 스키마·검증기 반영 + 티켓 19가 요구한 콘텐츠 린트 2종(조사 누출 피스, 카드명 한글 종결)을 로더 자체에 이식(smoke.ts 섹션 F와 동일 규칙, 정본은 그쪽) — mod 팩이 이 런타임 게이트를 안 거치면 19의 수정이 base 콘텐츠에만 적용되고 모딩 경로는 무방비였다. 기계 검증 9건 추가(smoke-datapack.ts B10·C6-C9·G5) 전량 PASS. 교훈: 계약을 두 곳(JSON Schema 문서 + TS 런타임 검증기)에 이중 구현하면 한쪽만 갱신되고 벌어지는 드리프트가 소리 없이 쌓인다 — 후속 스펙화 시 단일 구현(JSON Schema를 실제로 태우거나, TS를 유일 정본으로 문서화만 남기거나) 고려할 것.

## Resolution

2026-07-28 구현 완료, Claude 통합 검토 대기.

- 팩 계약을 `game-data-pack@2`로 고정했다. `formatVersion`, `mergeMode`, 프로버넌스와 승격 대상을 엄격한 JSON Schema로 검증하며, Ajv standalone 결과를 브라우저용 ESM으로 생성한다. v1 외부 팩은 자동 수용하지 않고 명시적 base migration CLI를 거친다.
- 병합은 `base` → `alongside` 또는 `promotion` 순서다. 새 외부 콘텐츠는 팩 ID 네임스페이스를 사용하고, 충돌은 `promotionTargets`가 현재 소유 팩을 정확히 지목한 경우만 허용한다. 검증·preflight·병합·참조 무결성을 단일 `loadPacks` 진입점으로 묶었다.
- 팩 본문은 IndexedDB, 활성 순서는 localStorage manifest에 보존한다. 손상 manifest 원문을 덮어쓰지 않고 복구 가능한 경고로 노출한다.
- 개발자용 `?data-packs=1` 화면에서 JSON 선택, 후보 순서·제거, 추가/상쇄/오류 preflight, 확인 후 저장을 제공한다. base만 적용·새로고침 보존은 실제 브라우저에서 확인했다. 자동화 브라우저의 파일 선택은 Chrome 확장 설정(`Allow access to file URLs`)에 막혀 수행하지 못했으며, 동일 추출 fixture의 외부 팩 로드는 TypeScript smoke에서 검증했다.
- 검증: schema 재생성 일치, generated-validator 브라우저 ESM smoke, core smoke, 데이터 팩 smoke A–H, 저장소 smoke S1–S4, `tsc --noEmit`, Vite production build가 모두 통과했다.

## Claude 검토 (2026-07-29)

- **v1 migration 경계**: `datapack.ts`에서 `formatVersion === 1`이면 `LEGACY_PACK_REQUIRES_MIGRATION`으로 실제 거부되고(추측 병합 없음), 별도 `migrateV1BasePack`이 `id === 'base'`인 팩만 명시적으로 변환함을 코드로 확인. 07·16의 "동일 포맷" 원칙을 깨지 않는다.
- **alongside/promotion 규칙**: `smoke-datapack.ts` E1–E7(정상 추가·충돌 거부·명시적 상쇄·미신고 상쇄 거부·불일치 거부·빈 target 거부·중복 ID 거부) 독립 재실행 전부 PASS. 의도한 모딩 정책과 실제 동작이 일치한다.
- **IndexedDB + localStorage manifest**: `npm run smoke:pack-storage`(S1–S4) 독립 재실행 PASS — 손상 manifest 원문 보존·경고 동작 확인. 단 실제 브라우저의 파일 선택 UX(드래그·피커)는 Codex 스스로도 "자동화 브라우저에서 수행 못함"으로 밝혔고 나도 재현하지 않았다 — 이 부분은 여전히 사람 확인에 의존한다.
- **schema:check / tsc / build**: 전부 독립 재실행 PASS.

결론: **승인.** 로더 계약·병합 정책은 기계 검증으로 충분히 뒷받침된다. 실제 파일 피커 UX만 통합 전 사람이 한 번 더 눈으로 확인할 것.
