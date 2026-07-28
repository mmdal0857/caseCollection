# 원문 기반 태그 추출 승격 스펙

Status: closed
Labels: wayfinder:grilling
Assignee: Codex
Reviewed-by: Claude (2026-07-29)
Blocked-by: 12

## Question

[카드 스키마와 카드화 대상](04-card-schema.md)에서 문맥 태그 값은 "게임 로컬 수제 시드 → 원문 기반 빌드타임 추출 승격" 2단계로 확정됐다. [문맥 태그 의미론 설계](12-context-tag-semantics.md)가 태그 어휘를 확정한 뒤 승격의 스펙을 정한다: 원문(catalog `pg_id` → 구텐베르크 / Drive `pd_novels/` / 로컬 `f:/Project/out/raw_texts/`)에서 무엇을 어떻게 추출하는가(단서 유형별 태그 매핑, LLM 추출·검증 절차), 파이프라인이 어디에 사는가([OUT 코어 경계](06-core-boundary.md)와의 관계 — 게임 레포 vs OUT vs 별도), 수제 시드와의 병합·재생성 절차, "catalog에 책 추가 → 카드 풀 자동 확장" 야망과의 접속. 산출은 스펙 ②(코어 추출·모듈화)에 들어간다.

## Comments

- 2026-07-21 **[12](12-context-tag-semantics.md) 확정으로 블록 해제 — 그리고 임무가 커졌다.** 12가 넘긴 입력:
  - **조사 팩트: 위키엔 재사용 가능한 태그 축이 없다.** `docs/wiki/stories/*.md`의 `trope_tags`는 77편에 걸쳐 **고유값 149개**이며 전부 `staged_adventure_service`·`treehouse_secret` 류 일회성 롱테일 라벨이다. clue 카테고리 4종은 이미 슈트로 소진. → 승격의 원천은 **위키가 아니라 원문**이어야 한다는 게 사실로 확정됐다.
  - **추출 대상이 "태그 값"에서 "측면(facet)"로 확대**. 12에서 카드가 `(frame, 의미문)` 쌍인 측면을 여럿 갖기로 확정 — 49장 × 측면 2~3 = **의미문 100~150개**가 추출·저작 대상이다. 태그(공개·은밀·강압·신중·논리 계열)는 그 위에 얹히는 작은 어휘.
  - **파이프라인 형태 권고(사용자 제안 + 12에서 보강)**: `로컬 sLLM 대량 생성 → 엔진 기계 검증 → LLM 취향 필터`. 핵심은 **기계 검증을 앞에 두는 것** — 03의 이중 제약(풀 수 있음 + 정답이 이야기로 성립함)이 기계 판정 가능하기 때문이다(프로토 순수 모듈 `engine.ts` 솔버빌리티 + `cardFitsSlot`/`scenario.ts` 응집도). 대부분을 공짜·확정적으로 걸러낸 뒤 LLM 판단은 "재미있는가"에만 쓴다. 환경엔 이미 LM Studio(`lms`, `--parallel N`)가 있고 비용 0.
  - **case 가변축**도 산출물에 포함된다 — 재사용 풀(6~8종)과 각 축의 게이팅 규칙.

- 2026-07-19 (opus session) [OUT 코어 경계](06-core-boundary.md) 확정으로 **위치 확정**: "파이프라인이 어디 사는가"의 답은 **게임측 레이어**다. 06이 코어를 **게임 무관(L)**으로 그었으므로 — 코어(추출 파이프라인)는 caseCollection의 문맥 태그를 몰라야 재사용된다 — 문맥 태그 추출은 코어 산출물(`cleaned_texts/` + 위키 데이터)을 **소비하는 게임측 빌드 스테이지**로 둔다(스펙 ①). 따라서 이 티켓 산출의 귀속을 **스펙 ②가 아니라 게임측(스펙 ①)** 으로 정정. 다만 태그 어휘 자체는 [문맥 태그 의미론 설계](12-context-tag-semantics.md)가 확정해야 하므로 blocked-by 12 유지. 이 티켓은 그 이후 추출 *세부*(매핑·LLM 절차·수제 시드 병합)를 스펙한다.
- 2026-07-23 (fable session) **파이프라인 뼈대 랜딩** (`scripts/extract_game_data_pack.py` — 06이 확정한 게임측 빌드 스테이지 위치, 추출 세부는 여전히 이 티켓 소관):
  - 스테이지: 소스 적재(실측 — catalog 110권·clue_type 49건이 `docs/wiki/clues/` 4파일=4슈트·case_pattern 4종) → 후보 선정 → **LLM 측면·태그 추출 STUB**(이 티켓의 심장, 미결) → case 생성 STUB → 스키마 검증(enum을 `schema/game-data-pack.json`에서 읽어 로더와 자동 동기화) → 팩 emit.
  - 실측: `--emit-draft` 산출물(49건)이 TS 로더 `loadPacks`를 통과해 base 위 69장 병합 확인 — "catalog에 책 추가 → 카드 풀 자동 확장" 야망의 배관이 양끝으로 이어짐.
  - `--id-prefix` 'wiki.'(병기, 기본) vs ''(승격 상쇄) — 수제 시드와의 병합·재생성 절차(이 티켓 미결 스펙)를 CLI 선택지로 뼈대화. 근거는 16의 id 충돌 실측.
  - 미결 유지: LLM 추출·검증 절차, 단서 유형별 태그·측면·kind 매핑(현재 슈트 휴리스틱 자리표시자), case 생성 절차.

## Resolution

2026-07-28 구현 완료, Claude 통합 검토 대기.

- 기존 슈트 휴리스틱·STUB을 제거하고 게임 레포의 빌드타임 Python 패키지로 교체했다. 추출 응답이 `kind`, `frame`, 의미문, 정확한 원문 evidence span, 태그를 직접 제시하며, 입력 snapshot hash와 응답 계약을 엄격히 검증한다.
- 측면은 frame 중복을 금지하고 태그는 1–2개만 허용한다. 각 태그에는 12번 티켓의 루브릭과 정확히 일치하는 이유가 필요하며, 원문 밖 인용·미정 enum·추가 필드를 거부한다.
- `FacetExtractor`, `TasteFilter`, `CaseAssembler` 경계를 분리하고 canonical request hash 기반 replay 어댑터를 제공했다. 기계 검증 뒤 취향 필터를 실행하며, case 산출도 엄격한 shape를 통과해야 한다.
- emit은 16번 계약의 `game-data-pack@2`를 사용한다. alongside는 clue·facet ID를 팩 네임스페이스로 바꾸고 promotion은 정확한 target 선언 없이는 기존 ID를 유지할 수 없다. 프로버넌스와 자기참조 안정 output hash를 기록하며 원자적으로 파일을 교체한다.
- 검증: Python 계약/어댑터/파이프라인 14개 테스트 통과, 동일 입력 2회 산출 byte 일치(`1d5edf37f9e916e8a50e865f3713dd19cad027ff88ce7ebc899ad85fcf98a776`), 산출 fixture를 TypeScript v2 loader가 base와 함께 로드하는 smoke H 통과.

## Claude 검토 (2026-07-29)

독립 재실행으로 검증 — 자기보고를 신뢰하지 않고 직접 대조했다.

- **LLM이 kind/frame/tag를 직접 제시하는 경계**: 12·14의 의미론과 맞는다. 슈트→kind/frame 자동 추론 없이 facet 문구에서 직접 분류하는 방식이 스펙(`docs/superpowers/plans/2026-07-28-data-contracts-and-extraction.md` §5.2)과 일치하고, `contracts.py`가 원문 밖 인용·미정 enum·추가 필드를 실제로 거부하는 것을 코드로 확인.
- **1–2 태그·루브릭·evidence span 게이트**: `scripts/tests/test_game_data_pack.py`를 독립 재실행 — **14/14 PASS** (자기보고 수치와 일치). `test_rejects_more_than_two_tags`, `test_rejects_tag_without_rubric_reason`, `test_rejects_quote_outside_source` 등 개별 거부 경로가 실제 테스트로 존재해 품질 게이트로 충분하다고 판단.
- **FacetExtractor → TasteFilter → CaseAssembler 순서 보존**: 파이프라인 코드와 테스트 구조상 기계 검증이 취향 필터보다 앞선다는 순서가 유지됨을 확인.
- **동일 입력 2회 byte 일치**: `test_cli_emits_identical_canonical_files` PASS로 재확인(개별 해시값은 별도 재현하지 않았으나 결정성 자체는 테스트로 검증됨).
- **TypeScript 쪽 교차 로드**: `npm run smoke:datapack` 독립 재실행 → H1 포함 전체 PASS.

결론: **승인.** 기술 검증 항목은 전부 통과. 남은 것은 통합 시점 회귀검증 재실행뿐(아래 공통 주의 참조).
