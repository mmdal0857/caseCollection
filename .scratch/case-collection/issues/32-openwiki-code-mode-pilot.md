# OpenWiki 코드 모드 파일럿

Status: open (실물 리포 채택 완료, 커밋·CI 배선은 사용자 결정 대기)
Labels: wayfinder:prototype
Assignee: Claude
Blocked-by: none

## Question

`openwiki@0.2.3`의 **code mode**(`openwiki --init`, 리포지토리 문서화 — [26](26-openwiki-candidate-discovery-pilot.md)이 테스트한 personal/ingestion mode와는 다른 경로)를 이 프로젝트의 코드구조 문서화 도구로 채택할 가치가 있는지 실행으로 검증한다.

- 26의 실패("초기 생성 후보 0건, 20분 미완주")는 personal mode로 소설 원문을 후보 위키로 뽑으려 한 것이었다 — code mode는 도구의 기본·주력 기능이라 아직 검증된 바 없다. 재시도가 아니라 첫 시도다.
- 격리된 스크래치 사본에서 `prototype/core-loop/`(순수 모듈 7종: engine·facets·dramaturgy·scenario·persona·josa·datapack)를 대상으로 `openwiki` code mode 1회 실행. `CLAUDE.md`/`AGENTS.md` 자동 삽입은 이번 파일럿에서 실물 리포에 반영하지 않는다(오염 방지 — 격리 사본에서만 발생하게 한다).
- 산출물(`openwiki/` 문서·Mermaid 다이어그램)의 실질 가치를 사람이 판단하고, 이 프로젝트 기존 문서 체계(`docs/agents/`·wayfinder 티켓·`CONTEXT.md`)와 중복·충돌 여부를 확인한다.
- Provider는 이미 구성된 크리덴셜(Gemini API 키 또는 Codex ChatGPT 로그인)로 신규 비용 없이 시도한다.

성공하면 통합 방식(별도 `openwiki/` 트리 유지 vs 기존 체계 흡수, 자동 CI 갱신 채택 여부)을 결정하고, 실패하면 이유를 기록하고 기각한다.

## 파일럿 결과 (2026-07-28)

**격리 사본에서 실행 성공.** `prototype/core-loop/`를 스크래치 디렉터리(`%TEMP%\claude\...\scratchpad\openwiki-code-pilot`)로 복사 → 임시 `git init` → Gemini provider(`GEMINI_API_KEY`, 신규 비용 없음)로 `openwiki code --init --print` 1회 실행. exit 0, 실물 리포는 전혀 건드리지 않음.

### 산출물

7개 OKF v0.1 준수 concept 문서(`openwiki/quickstart.md`, `architecture/{overview,state-engine}.md`, `domain/{facet-semantics,data-packs}.md`, `ui/presentation-layer.md`, `testing/validation-harness.md`) + 각 디렉터리 `index.md` + Mermaid 다이어그램(상태·ER·컴포넌트·흐름도).

### 품질 검증 (Claude가 자기보고를 신뢰하지 않고 직접 대조)

- **정확함**: lock mode 3종(`immediate`/`commit`/`submit`)과 그 의미, `GameState` 스키마, 되돌리기·연쇄 해제 로직이 실제 `engine.ts`와 일치. 티켓 참조(`immediate` = 12 §3, `submit` = 11 v6)까지 코드 주석에서 정확히 끌어옴 — 표면적 요약이 아니라 근거 기반 서술.
- **"npm run smoke 통과" 주장을 독립 재실행으로 확인** — 실제로 통과함(exit 0, 전 항목 PASS). 자기보고가 사실이었음을 직접 검증.
- **완전성 갭 1건 발견**: `state-engine.md`의 Action Types 표가 실제 `Action` 유니온 14종 중 **`HINT` 액션을 누락**(13종만 기재). 틀린 서술은 아니지만 빠짐 — 사람 검수 없이 그대로 승격하면 안 되는 이유.
- **거버넌스 파일 삽입은 우려보다 가벼움**: `CLAUDE.md`/`AGENTS.md`에 쓰는 건 `<!-- OPENWIKI:START/END -->`로 감싼 5줄짜리 포인터 블록뿐, 전체 재작성이 아니다 — 기존 81줄 governance 콘텐츠와 공존 가능해 보임(이번 파일럿은 실물 CLAUDE.md엔 반영 안 함).

### 판정

**정공법(code mode)은 실사용 품질에 도달했다.** 26의 실패와 무관한 결론 — 그건 곁다리 기능(personal mode)의 실패였다. 다만 완전성 갭이 있어 **자동 승격이 아니라 사람 검수를 거친 채택**을 권고.

### 남은 결정 (사용자)

1. 채택 범위: `prototype/core-loop/`만 vs 리포 전체
2. 통합 방식: 별도 `openwiki/` 트리로 병행 vs 기존 `docs/agents/`·`CONTEXT.md` 체계에 흡수
3. CI 자동 갱신(GitHub Actions) 배선 여부 — 배선 전 별도 검토 필요(권한·트리거 빈도·비용)
4. 실물 리포에 실제로 실행해 `CLAUDE.md`/`AGENTS.md`에 포인터 블록을 남길지 여부

## 실물 리포 실행 시도 (2026-07-28, 실패·롤백)

사용자 승인 후 리포 루트에서 Gemini provider로 `openwiki code --init --print` 실제 실행. **Gemini 프로젝트 월간 spend cap 초과로 실패** — `--init`의 LLM 호출 전 스캐폴딩 단계(`.github/workflows/openwiki-update.yml`, `CLAUDE.md`/`AGENTS.md` OPENWIKI 포인터 블록)만 생성되고 실제 `openwiki/` 콘텐츠는 만들어지지 않아 **내용 없는 곳을 가리키는 깨진 참조** 상태가 됐다. 그대로 두면 다음 세션이 혼란스러우므로 즉시 롤백: `AGENTS.md` 삭제(신규 파일이라 전량 OpenWiki 블록뿐), `.github/` 삭제, `CLAUDE.md`는 OpenWiki 블록 hunk만 되돌리고 다른 세션의 기존 diff(`Wiki-Project-Root:`)는 그대로 보존. 롤백 후 리포는 이번 시도 이전 상태와 동일(`git diff CLAUDE.md` 확인).

**원인 추정**: 스크래치 파일럿 성공 이후 이 세션에서 housekeeping 중 `wiki-agent-daily` Cloud Scheduler 트리거(Gemini 2.5 Flash 호출 포함)도 같은 GCP 프로젝트 쿼터를 썼다 — 공유 spend cap이 누적돼 실물 실행 시점에 소진됐을 가능성.

**막힘.** 재개하려면 다음 중 하나가 필요(사용자 행동):
- https://ai.studio/spend 에서 spend cap 상향 또는 리셋 대기
- 다른 provider로 전환 — `openai-chatgpt`(Codex 계정, 브라우저 OAuth 필요 → 비대화형 세션에서 자동화 불가), 또는 신규 API 키(OpenAI/OpenRouter/Bedrock 등)

Status는 `open`으로 유지, 위 조치 후 재시도.

## 로컬 LM Studio 재시도 (2026-07-28, 두 번째 실패·롤백)

전역 설정에 Gemini 외 API 키가 없어(DeepL·GitHub만 존재) 사용자 지시로 이미 켜져 있는 로컬 LM Studio(`qwen/qwen3.6-27b`, 컨텍스트 262144, `openai-compatible` provider)로 리포 루트에서 재시도.

**exit 0으로 "완료"됐지만 실질 산출물이 0이었다** — `openwiki/index.md`가 OKF frontmatter와 빈 `# Files` 헤더만 갖고 생성되고 concept 문서·디렉터리는 하나도 없음. `--print` stdout도 0바이트. LM Studio 서버 로그로 대조: `n_tokens = 18586`, `truncated = 0`, `Finished streaming response` — **컨텍스트 초과·강제 절단이 아니라 모델이 정상 종료하고도 실질 콘텐츠를 안(못) 만든 것**. 26의 personal mode 실패("후보 0건")와 표면적 원인은 다르지만 결과 패턴은 동일 — **이 로컬 모델·환경 조합이 OpenWiki의 DeepAgents 에이전트 루프 자체와 안 맞는다**는 게 이제 code/personal 두 mode에서 공통으로 관측됨.

같은 방식으로 롤백(`CLAUDE.md` OPENWIKI hunk 제거, `AGENTS.md`·`.github/`·`openwiki/` 삭제) — `git diff CLAUDE.md`가 다시 이전 세션 diff만 남긴 상태(index `eb35f35`)로 확인.

**갱신된 결론**: 이 환경에서 OpenWiki 실사용은 **클라우드급 모델(이번 스크래치 파일럿에서 성공한 Gemini 등)에서만 검증됐고, 로컬 모델 경로는 code mode도 막힌다.** 다음 재개는 Gemini spend cap 조치 또는 `openai-chatgpt` 브라우저 로그인(사용자 참여 필요) 둘 중 하나로만 가능.

## 실물 리포 채택 성공 (2026-07-28, openai-chatgpt provider)

사용자가 직접 인터랙티브 터미널에서 `OPENWIKI_PROVIDER=openai-chatgpt openwiki code --init` 실행 → ChatGPT(Codex 계정) 브라우저 로그인 완료, 토큰이 `~/.openwiki/.env`에 저장됨. 이어서 Claude가 저장된 토큰으로 `--print` 비대화형 실행을 리포 루트에서 완주.

**exit 0, 실질 콘텐츠 생성 성공.** `openwiki/`에 7개 concept 문서 + 4개 디렉터리 index 생성: `quickstart.md`, `architecture/overview.md`, `domain/game-model.md`, `workflows/play-and-content.md`, `operations/runbook.md`, `testing/guidance.md`, `source-map.md`. `CLAUDE.md`·`AGENTS.md`에 `<!-- OPENWIKI:START/END -->` 포인터 블록 삽입(다른 세션의 기존 `Wiki-Project-Root:` diff는 보존됨, 확인 완료). `.github/workflows/openwiki-update.yml`(매일 08:00 UTC cron + workflow_dispatch) 생성.

### 품질 검증 (자기보고를 신뢰하지 않고 직접 대조)

- **`App.svelte`가 `content.ts`의 하드코딩 `CONTENT`를 import하고 datapack 로더는 부트스트랩이 아니다** — `grep`으로 확인, 정확.
- **"`npm run smoke`는 datapack 스위트와 달리 실패해도 nonzero exit를 강제하지 않는다"** — `smoke.ts`에 `process.exit` 자체가 없고 `smoke-datapack.ts`엔 `process.exit(failures===0?0:1)`이 있음을 확인, 정확. 미묘하지만 실무에 중요한 차이를 스스로 찾아냄.
- **이 프로젝트 고유의 인식론적 함정을 정확히 재현**: "격리 워크트리는 기각이 아니라 유예"라는 CLAUDE.md의 정확한 표현을 그대로 채택. `ticket 08의 ## Comments가 정본`이라는 미묘한 예외까지 반영. **자기 자신의 산출물(`AGENTS.md`·`.github`·`openwiki/`)이 초기화 시점엔 untracked였다는 점, 그리고 `CLAUDE.md`가 현재 dirty 상태라 stale할 수 있다는 점까지 스스로 경고**함 — 과신하지 않도록 설계된 서술.
- 스크래치 파일럿(Gemini)보다 한 단계 더 나은 결과 — Gemini 파일럿에서 발견됐던 `HINT` 액션 누락 같은 완전성 갭은 이번 spot-check 범위에선 발견 안 됨(전수 검증은 아님).

### 판정: 채택 성공, 커밋은 보류

지금 리포는 전부 **미커밋 상태**(이 세션의 다른 미관련 변경과 섞이지 않도록 별도 유지). 커밋 여부·범위(openwiki/ 트리만 vs CLAUDE.md/AGENTS.md 포인터 포함)는 사용자 승인 필요.

### 남은 결정 → 결정됨 (2026-07-28)

1. **커밋**: 보류 — 사용자가 직접 리뷰 예정. VS Code Markdown Preview(`Ctrl+Shift+V`, 내장 Mermaid 렌더링)로 확인 가능, 별도 GUI 불필요.
2. **CI 자동 갱신**: **미채택.** `.github/workflows/openwiki-update.yml` 삭제 — GitHub Secrets 미설정 + Gemini spend cap 초과 상태에서 도입해도 즉시 실패. 대신 `/housekeeping`이 주기적으로 `openwiki code --update --print`를 돌리는 쪽으로 결정(Step 2.7 신설).
3. **스킬 등록 완료**: `~/.claude/skills/openwiki-code-wiki/SKILL.md`(실행·provider·실패 처리·GUI 리뷰 절차) + `housekeeping` 스킬에 Step 2.7 추가. `openwiki` CLI는 스크래치 사본이 아니라 **전역 npm 설치**(`npm install -g openwiki@0.2.3`)로 전환해 세션 간 재사용 가능.
