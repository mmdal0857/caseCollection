# GitHub Pages 배포 파이프라인 구축

Status: open
Labels: wayfinder:grilling
Assignee: Codex (GPT-5.6, 2026-07-30) — Tasks 5-7 continued directly by Claude, 2026-08-01
Reviewed-by: Claude (2026-08-01; 자체 검토 출처, 독립 검토 예외를 사용자 승인)
Blocked-by:

## Question

[05](05-web-stack.md)/[08](08-mvp-scope.md)에서 GitHub Pages를 정본 배포 채널로 확정했지만 이를 실제로 자동화하는 파이프라인이 없다 — `.github/workflows/`가 비어 있고 이를 다루는 티켓 자체가 지금까지 없었다(CLAUDE.md가 2026-07-28에 이미 "채널은 결정됐고 파이프라인은 아직 없다"고 지적했으나 대응 티켓은 만들어지지 않았다). `npm run build`(vite)까지가 현재 존재하는 전부다.

확정할 것:

- **트리거**: main push마다 자동 배포 vs 수동 release 태그 vs `workflow_dispatch`. 콘텐츠가 24장·case 4개로 이미 마감([08](08-mvp-scope.md) §④)됐고 남은 변경은 화면·버그 수정 위주이므로, 과도한 자동 배포가 미완성 중간 상태를 그대로 노출할 위험도 함께 고려한다.
- **빌드 위치**: 실제 게임 소스는 `prototype/core-loop/`다 — 워크플로가 이 서브디렉터리에서 `npm ci && npm run build`를 실행하고 그 `dist/`만 게시해야 한다. 레포 루트를 그대로 게시하지 않는다.
- **base path**: GitHub Pages의 `/<repo>/` 서브경로 배포와 커스텀 도메인 배포는 Vite `base` 설정이 다르다. 현재 `vite.config`가 어느 쪽을 가정하고 있는지 먼저 확인한다.
- **Pages 소스**: GitHub Actions 배포(`actions/deploy-pages`) vs `gh-pages` 브랜치 push 방식 중 선택.
- **배포 전 게이트**: `npm run smoke*` 전체 스위트·`tsc --noEmit`·`npm run build`가 실패하면 배포를 막아야 한다 — 워크플로 어느 단계에서 무엇을 실행할지 명시.
- **Higgsfield 병행과의 경계**: 05/08은 GitHub Pages+Higgsfield 병행을 결정했지만 `higgsfield game deploy/publish`는 CLI 수동 실행이다 — 이 워크플로는 GitHub Pages만 다루고 Higgsfield 갱신은 별도 수동 절차로 남긴다는 것을 명시한다.

## Comments

- 2026-07-29 fog 발견: [MAP.md](../MAP.md)의 "Destination"은 두 스펙 모두 "/to-spec으로 넘길 준비" 상태라 적었지만, 실제 배포 자동화는 어느 스펙 초안에도 항목으로 잡힌 적이 없었다. 진행 상황 정리 세션에서 `.github/workflows/` 부재와 대응 티켓 부재를 직접 확인하고 새로 발급.
- **2026-08-01 Claude 검토(계획 실행 이어받음).** Codex가 Task 1-3(`230c4c1`~`e6e1c96`)을 구현하고 사용량 한도로 Task 4 중간(파일은 작성됐으나 미커밋)에서 멈춘 상태를 이어받아, `docs/superpowers/plans/2026-07-30-github-pages-portable-deployment.md`의 Task 4-7을 계획대로 실행했다(리뷰 대상 커밋 범위: `230c4c1`..`75a5f58`, 8개). **정직하게 밝힐 점**: Task 4는 Codex 산출물을 독립 재실행·검증한 뒤 커밋한 것이지만, Task 5-7(strict smoke CI 게이트·Pages 워크플로·전체 로컬 증명)은 이 세션에서 Claude가 직접 구현했다 — 따라서 이 절은 "다른 저자 산출물의 독립 리뷰"가 아니라 자체 검토이며, 사용자 판단(2026-08-01)으로 그 상태를 그대로 기록해 충분하다고 결정했다.
  - ① **05/08/13 정합**: 워크플로가 Higgsfield를 호출하지 않고(§5의 병행 결정과 충돌 없음), 이미지 모델을 호출하지 않으며(13의 생성 규칙과 충돌 없음), `workflow_dispatch`만 트리거라 08 §④의 콘텐츠 마감 이후 과도 자동배포 우려와도 맞는다.
  - ② **CONTEXT.md 용어**: 이번 변경은 순수 배포 인프라(경로·CI·워크플로)만 다뤄 "case"·"측면" 등 도메인 용어를 전혀 사용하지 않는다 — 충돌 없음.
  - ③ **자산·참조 존재**: 설계 스펙(`docs/superpowers/specs/2026-07-30-github-pages-portable-deployment-design.md`)·계획(`docs/superpowers/plans/2026-07-30-github-pages-portable-deployment.md`) 전부 실재 확인. `.art-source/cardart/`는 git 미추적(0 파일), `public/assets/`의 23개 WebP 파생본만 추적 — 설계 §8이 요구한 "Drive가 소스, Git은 배포 파생본만" 경계가 실제로 지켜짐을 `git ls-files`로 확인.
  - ④ **커맨드·배포 경로 재실행**: `npm ci`→`schema:check`→`test:release-tools`(48/48)→`smoke:ci`(11개 스모크 전체 PASS)→`release:verify-source`→`typecheck`→`build`→`release:verify-dist` 전부 독립 재실행 PASS. `vite preview --base /caseCollection/`을 실제로 띄우고 Chrome DevTools로 홈→브리핑→케이스 화면까지 진행해 카드 4장·배경·오디오 매니페스트·OGG가 전부 `/caseCollection/` 하위에서 200으로 로드됨을 확인(콘솔에 처리되지 않은 예외 없음 — 유일한 404는 무관한 루트 `favicon.ico`).
  - **Status는 open 유지** — 계획의 Task 9(실 GitHub 저장소 생성·push·Pages 배포)는 외부에 공개되는 비가역적 조치라 사용자 판단(2026-08-01)으로 이 세션에서는 보류. 저장소 이름·공개 범위가 정해지면 재개.
- **2026-08-02 NAN 2026 해커톤 제출 준비 세션 — 브랜치 통합 + 실통합 검증.** `ticket/33-pages`(위 review가 다룬 10개 커밋)를 독립 재검증(모든 게이트 직접 재실행: `test:release-tools` 48-49/49, `smoke:ci` 11개 전체, `typecheck`, `build`, `release:verify-source`, `release:verify-dist`, `release:verify-pages-workflow` 전부 PASS)한 뒤 `main`에 로컬 fast-forward 머지(`34616a0..616ee98`), 워크트리·브랜치 정리 완료.
  - **실통합에서만 드러난 gap**: 격리 워크트리(신선한 체크아웃)에서는 안 보였지만 `main`의 실제 작업 디렉터리에서 재검증하니 `release:verify-source`/`release:verify-dist`가 즉시 FAIL — `prototype/core-loop/public/cardart`(20장 원본 PNG + `benchmark/` 81MB, 티켓 13 시절부터 `.gitignore`에도 안 걸린 채 방치)와 `public/protoart`(21MB, 폐기된 프로토 하네스의 잔재 산출물)가 `.art-source/` 재구성 이전부터 `public/` 아래 그대로 남아 있었던 것 — 설계 §4.1이 "이래서 일반 빌드가 실수로 못 담는다"고 명시한 바로 그 경계 위반. `git status`로 두 디렉터리가 미추적(untracked)임을 확인 후 `public/cardart` → `.art-source/cardart`, `public/protoart` → `.art-source/protoart`로 파일시스템 이동(git 추적 대상 아니므로 커밋 불필요) — Drive가 여전히 원본 정본이라 데이터 손실 없음. 이동 중 `public/cardart/benchmark`가 낡은 `vite dev` 좀비 프로세스 2개(PID 23596·13928, 세션 시작 전부터 떠 있던 것으로 추정)에 잠겨 `EPERM`으로 실패 — 사용자 승인 받아 해당 프로세스 종료 후 재시도해 해결. 이동 후 재검증 전부 PASS.
  - 결론: 설계·구현·검증기 로직 자체는 정확했다. 이 gap은 "완결된 계획을 격리 워크트리에서만 확인하고 실제 통합 대상(main의 진짜 작업 디렉터리)에서 재확인하지 않으면 놓칠 수 있는" 통합 단계 고유의 결함이었다 — 앞으로 이런 계획은 병합 직후 실제 작업 디렉터리에서 최소 1회 release 게이트 재실행을 통합 완료 조건에 포함할 것.
- **2026-08-02 Codex 독립 감사·수정 및 중첩 경로 collection 증명.** 기존 기록의 `230c4c1..75a5f58`은 시작 커밋을 제외하므로, 당시 구현의 정확한 포함 범위는 `230c4c1^..75a5f58`(9개)이다. 중요 지적 수정까지 포함한 최종 감사 범위는 `230c4c1^..0de95bf`(12개)다. Claude가 Tasks 5-7을 직접 작성한 뒤 검토했다는 기존 고지는 그대로 유효하며, 위 `Reviewed-by`는 저자 독립 검토를 주장하지 않고 사용자가 승인한 자체 검토 예외와 출처만 기록한다.
  - 독립 감사에서 확인한 중요 4건을 회귀 테스트 우선으로 수정했다:
    1. stdout/stderr 사이에서 분할된 `FAIL` 탐지.
    2. JSON escape를 해제한 문자열에서 소유 루트-절대(owned root-absolute) `/assets/`·`/audio/` URL 검사.
    3. 정확한 workflow job·step·command·action·`with` 및 최상위 shape 검사.
    4. `public`/`dist` 링크 거부와 prefix-boundary 실수를 막는 component-safe required-file realpath containment.
  - scoped 재검토 결과: 첫 재검토는 위 1·2·4를 `ADDRESSED`로, 최상위 `defaults.run.shell`·`env` 미검사인 3을 `NOT ADDRESSED`로 판정했고 별도 신규 Critical/Important 문제는 없었다. 이 잔여 3은 `0de95bf`에서 닫았고, 두 번째 scoped 재검토는 이를 `ADDRESSED`, 신규 Critical/Important 없음, 전체 `CLEAN`으로 판정했다.
  - 최종 로컬 게이트를 다시 실행해 `test:release-tools` 67/67, `smoke:ci` 11/11, `release:verify-source`, `typecheck`, 155-module `build`, `release:verify-dist`가 모두 PASS했다. 빌드 산출물은 27,367,847 bytes다.
  - `http://127.0.0.1:4173/caseCollection/`에서 Home→새 수사→Briefing→case→물리 카드 스택→Collection→case 복귀를 실제 Chrome DevTools 세션으로 확인했다. 오디오 매니페스트, title/case OGG, `trust-low.webp`, 카드 4장(`vent_gap`, `thread_fiber`, `mud_footprint`, `rope_mark`)이 모두 `/caseCollection/` 아래에서 200으로 응답했고, 화면에는 배경과 카드 그림이 fallback glyph가 아닌 실제 이미지로 렌더됐다. 처리되지 않은 예외는 없었으며 비소유 루트 `favicon.ico` 404와 사용자 동작 전 AudioContext 자동재생 경고만 관찰됐다.
  - **이 감사 시점의 Status는 계속 open** — Task 9의 저장소/공개 범위 결정, remote 추가, push, Pages 설정, 수동 dispatch와 실제 배포 URL 검증은 별도 외부 변경 승인 없이는 수행하지 않았다.
