# case 생성 E2E 데이터팩 프로토타입

Status: closed
Labels: wayfinder:prototype
Assignee: Codex
Reviewed-by: Claude (2026-07-29)
Blocked-by: 18

## Question

고정된 실제 원문 스냅샷 하나를 최종 data pack까지 통과시켜 case 생성 계약의 아직 종이로만 검증된 경계를 실행으로 검증한다.

- `sourceSnapshot → patternEvidence → 승인 후보 patternRecipe` 변환을 최소 한 경로로 구현한다.
- `patternRecipe + storySeed.requires`로 합법 candidate를 결정론적으로 열거한다.
- 실제 sLLM에는 candidate 요약만 전달하고 `candidateId + reason`만 수용한다.
- 별도 표현 생성기에는 확정 truth와 `storySeed`만 전달하고 `presentation` 필드만 수용한다.
- 생성 뒤 삼중 제약·조사 린트·상태 조건 안정성·LLM allowlist·presentation 참조 무결성을 검사한다.
- 최종 취향 필터는 `keep/reject + tasteScore + reasons`만 반환하게 한다.
- 같은 입력과 버전으로 두 번 emit해 candidate 순서, 출력 hash, provenance envelope가 동일한지 확인한다.
- 기존 수제 case data pack과 나란히 smoke를 통과시킨다.

완료 조건은 재현 가능한 실행 명령, 입력 fixture, 최종 `GeneratedCase`, validator 보고서, 두 번의 동일성 비교 결과다.

## Comments

- 2026-07-27 **브랜치 병합 시점 결정 — 이 티켓에서 판단**: [case 생성 파이프라인의 형태](18-case-generator-shape.md) 검토가 `prototype/case-generator-shape`(격리 브랜치·워크트리)를 지도 Notes의 "프로토 브랜치는 main에 병합"(core-loop 전례)과 배치된다고 지적했다. 사용자 판단(2026-07-27): **지금은 격리 유지, 이 티켓이 실 sLLM·실 원문까지 이어붙일 때 병합 여부를 다시 판단**한다. 이 세션을 여는 사람은 착수 전에 먼저 이 판단부터 할 것 — 미리 정책으로 굳히지 않았으므로 자동으로 병합/격리 어느 쪽도 아니다.

## Resolution

- 실행 위치: 격리 워크트리 `prototype/case-generator-shape`. 이 결과는 아직 commit/merge하지 않았다.
- 실제 원문: `F:\Project\out\raw_texts\204.txt`
  - 전체 SHA-256: `516076490c5530c6f299bda8a472f2ae8718f675db0a32fb478c58a5de9757f3`
  - 고정 입력: `prototype/core-loop/fixtures/case-generator/pg204-invisible-man.source.json`
  - 승인 계약: `prototype/core-loop/fixtures/case-generator/pg204-invisible-man.contract.json`
- 실제 sLLM transcript:
  - 로컬 모델 식별자: `casegen-gemma-e4b` (`google/gemma-4-e4b`)
  - 역할: selector / presenter / taste
  - 저장 경로: `prototype/core-loop/artifacts/case-generator/approved/transcript.json`
- 승인 산출물:
  - `prototype/core-loop/artifacts/case-generator/approved/generated-case.json`
  - `prototype/core-loop/artifacts/case-generator/approved/generated-pack-v2.json`
  - `prototype/core-loop/artifacts/case-generator/approved/validator-report.json`
  - semantic output hash: `66791aeabf553ff0c231801601bd216a3030363bcc95e342f2e24a87fbb7f5f5`
  - provenance hash: `2a3e4a2b8856084b063fbe101066da6c0b1b8ac881211f32244e2d7d44d3956d`
- 동일한 승인 transcript를 두 경로로 replay한 결과 파일이 byte-identical이다.
  - transcript: `9d1d10fd56f2cd9d5a987144bb4846201fd7f394f7b9adf7ca1d328b8e7b1f0a`
  - generated case: `5cb4d35a0ea33eed7af138200248d37b1e7ee20fd2760f6308ad27eee0d0fbd3`
  - generated pack v2: `c1e55856b02e42f58a102d64896babb0a7cc5b19b788a162424185d0ef0f18f2`
  - validator report: `7144e8e2bc48675d2c27033101ca0449620a19144efb6b287e07b78baa1750f8`
- 재현 명령:
  - `npm run fixture:pg204`
  - `npm run e2e:case-generator -- --replay <transcript.json> --source F:/Project/out/raw_texts/204.txt --out <output-directory>`
  - `npm run smoke:case-generator-e2e`
  - `npm run generator:demo`
  - `npm run smoke`
  - `npm run smoke:datapack`
  - `npm run typecheck`
  - `npm run build`
- 추가 교차 검증: 생성된 `generated-pack-v2.json`을 data-contracts 워크트리의 v2 schema/Ajv validator로 검사해 `PASS — cases=5 overrides=0`을 확인했다.
- 티켓 29 이후 최신 run 그래프와의 교차 회귀에서 `boss→generated case` 전환 인터루드 누락을 발견해, generated pack이 공개 allowlist 기반 `recon`·다음 사건 guest facet 기반 `interview`·`stabilize`를 함께 emit하도록 보완했다.
- validator는 승인 evidence, 후보 allowlist, truth/trace/card/facet 누출, 조사·문장 경계, presentation 참조, 상태 조건 안정성, taste 권한, 공개 piece 계약을 모두 검사한다. 모델 원문 응답은 transcript에 보존하되 공개 pre-solve piece는 승인 계약의 안전한 문장으로 정규화한다.

### Claude review checklist (2026-07-29)

- [x] **selector·presenter·taste 권한 경계** — `npm run smoke:case-generator-e2e` 독립 재실행 PASS(19개 케이스 전부), 그중 "selector가 allowlist 밖 candidateId를 발명하면 거부", "표현기가 truth 필드를 반환하면 거부", "취향 필터는 keep/reject·점수·이유만 반환" 개별 확인.
- [x] **공개 piece 정규화가 provenance를 훼손하지 않음** — 같은 스모크의 "pre-solve pieces는 모델 표현이 아니라 공개 등급 계약으로 정규화된다" PASS.
- [x] **두 replay byte 동일성 + v2 pack 교차검증** — 직접 해시 대조: `generated-pack-v2.json` SHA-256이 티켓 원문 기재값과 정확히 일치(`c1e5585...`). 이 파일을 `.worktrees/data-contracts-extraction`의 v2 validator(`check-pack-file.mjs`)로 **워크트리를 건너뛰어 교차 실행** → `PASS — cases=5 overrides=0`, 자기보고와 동일.
- [x] `npx tsc --noEmit`, `npm run build`, `npm run smoke`, `npm run smoke:datapack` 모두 이 워크트리에서 독립 재실행 PASS.

**⚠️ commit/merge 여부 — 예상보다 무거운 문제로 격상.** 이 브랜치(`prototype/case-generator-shape`, HEAD `2d4f42d`)는 현재 **main보다 28개 커밋 뒤처져 있다**(`git log prototype/case-generator-shape..main` 확인) — 티켓 08 MVP 스코프 확정, 티켓 18·26·27 검토, 티켓 24 플레이 화면 구현, 티켓 31, 카드 아트 파이프라인 전체, 그리고 이 워크트리 격리 규칙 자체를 만든 거버넌스 커밋(`9e04b87`)까지 전부 이 브랜치엔 없다. `.scratch/case-collection/MAP.md`의 `git diff main` 결과가 "삭제"로 보이는 줄들은 실제 삭제가 아니라 **이 브랜치가 그 결정들이 생기기 전 상태에 멈춰 있기 때문**이다. 따라서:
  - 이 브랜치를 그대로 `git merge`하거나 이 워크트리의 `MAP.md` 초안을 그대로 채택하면 main의 28개 커밋 분량 결정이 손실된다 — **naive merge 금지**.
  - 실제 새 산출물(`case-generator-e2e.ts`, `smoke-case-generator-e2e.ts`, `build-pg204-fixture.ts`, `e2e-case-generator.ts`, `fixtures/case-generator/`, `artifacts/case-generator/`, 이 티켓 파일 자체)은 전부 **추가 전용 파일**이라 기술적으로는 현재 main 위에 깨끗하게 재적용 가능해 보인다 — 다만 실제로 그렇게 하려면 먼저 이 브랜치를 현재 main으로 rebase(또는 새 파일만 cherry-pick)하는 별도 작업이 필요하다.
  - `.worktrees/data-contracts-extraction`(0 커밋 뒤처짐, 이미 최신 main 기준)과 통합 순서를 맞출 것 — data-contracts-extraction을 먼저 main에 합친 뒤, 이 브랜치를 그 새 main으로 rebase하는 순서를 권장.

기술 검증(코드·해시·테스트)은 **승인**. 위 rebase는 사용자 승인(2026-07-29) 후 실제로 수행했다 — 이 브랜치를 새 main(`199806f`, ticket 14·16·21·22·23·29·30 통합 이후)으로 rebase해 `.gitignore`·`package.json`·이 파일 자체의 add/add 충돌을 해결했다.
