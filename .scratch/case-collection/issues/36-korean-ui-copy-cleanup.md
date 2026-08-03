# 사용자 노출 영문 카피 한국어화 Implementation Plan

Status: closed
Labels: wayfinder:task
Assignee: Claude
Blocked-by:

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.
>
> **Execution note (2026-08-03, Claude):** this repo's `docs/agents/codex-collab.md` overrides the generic sub-skill above with a project-specific rule — coding delegation goes through Codex Workflow T (Entry Lane A), not a generic Claude implementer subagent. See `## Codex delegation` below.

**Goal:** 한국어 우선 MVP의 일반 플레이 경로와 복구 오류 경로에서 남아 있는 영문 UI 카피를 한국어로 통일하고, 같은 문구가 다시 들어오면 CI가 실패하게 한다.

**Architecture:** 게임 상태·데이터 팩 식별자·저장 형식은 바꾸지 않고 표시 계층의 카피만 교체한다. 정적 소스 감사 스모크가 현재 발견된 영문 노출을 금지하고 새 한국어 문구의 존재를 확인하며, 실제 브라우저에서는 정상 진행과 손상 저장 데이터 복구 화면을 각각 확인한다.

**Tech Stack:** Svelte 5, TypeScript, Vite, Node.js smoke scripts

## Global Constraints

- [MAP](../MAP.md)의 확정 제약인 **한국어 우선, 영어는 파이프라인 슬롯만**을 따른다. 이번 티켓은 영어 지원 또는 i18n 프레임워크 도입 작업이 아니다.
- 내부 식별자(`GOOD`, `BAD`, `INTERLUDE_ACTION`), 타입·스키마 필드, 파일명, CSS class, localStorage key는 호환성을 위해 변경하지 않는다.
- 화면용 제품명은 **「단서수집가」**로 쓴다. 저장소·패키지·배포 경로의 `caseCollection`은 변경하지 않는다.
  - 2026-08-03 개정: NAN 2026 제출 준비 세션에서 제출용 PDF·플레이 영상이 이미 「단서수집가」로 확정·배포됐음을 확인 — 원래 이 계획이 적어둔 「사건 수집록」 대신 제출 자료와 통일한다(사용자 결정).
- `?data-packs=1` 개발자 화면은 `JSON`, 파일명, 스키마 경로, 오류 코드처럼 정확성이 필요한 기술 식별자를 유지할 수 있다. 다만 설명 문장은 한국어로 쓴다.
- `AP`는 화면에서 **「행동력」**, `run`은 문맥에 따라 **「수사」 또는 「수사 기록」**, `BAD ending`은 **「실패 결말」**로 쓴다.
- 게임 규칙, 저장 데이터 형태, reducer 동작, 레이아웃과 CSS는 변경하지 않는다.

---

## 조사 근거와 확정 교체표

2026-08-03 소스 감사에서 다음 사용자 노출을 확인했다. 아래 문구를 구현 기준으로 삼고 별도 카피 결정은 다시 열지 않는다.

| 화면/상태 | 현재 노출 | 교체 문구 |
|---|---|---|
| 브라우저 탭 | `PROTOTYPE — caseCollection 코어 루프` | `단서수집가` |
| 홈·상단 브랜드 | `CASE COLLECTION` | `단서수집가` |
| 홈 저장 경고 | `저장된 run을 복구하지 못했습니다.` | `저장된 수사 기록을 복구하지 못했습니다.` |
| 새 수사 확인창 | `기존 run...` | `기존 수사 기록...` |
| 브리핑 | `CASE N` / `BOSS BRIEFING` | `사건 N` / `최종 사건 브리핑` |
| 이론 검토 | `CASE REVIEW` | `사건 검토` |
| 컬렉션 표제 | `COLLECTION` | `컬렉션` |
| 인터루드 표제 | `INTERLUDE · 3선 2택` | `막간 수사 · 3선 2택` |
| 인터루드 비용 | `AP 1` | `행동력 1` |
| 인터루드 설명 | `guest allowlist` / `게스트 allowlist` | `대여 가능 목록` |
| 결말 표제 | `ENDING` / `BAD ENDING` | `결말` / `실패 결말` |
| 결말 오류 | `경고 기록이 없는 ending은...` | `경고 기록이 없는 결말은...` |
| 결말 이동 버튼 | `Run Summary` | `수사 요약` |
| 요약 표제 | `RUN SUMMARY` | `수사 요약` |
| 요약 안내 | `BAD 엔딩이어도...` | `실패 결말이어도...` |
| 요약 홈 버튼 | `Home` | `첫 화면` |
| 저장 복구 세부 오류 | `JSON`, `envelope`, `RunSnapshot@1`, `action sequence`가 섞인 문장 | 오류 코드에 따라 `저장 데이터가 손상되었습니다.`, `현재 버전에서 읽을 수 없는 저장 데이터입니다.`, `호환되지 않는 저장 데이터 형식입니다.`, `저장된 수사 상태가 유효하지 않습니다.` |
| 컬렉션 저장 오류 | `CORRUPT_JSON` 등 raw code | 코드별 한국어 설명. raw code는 사용자 화면에 직접 출력하지 않음 |
| 데이터 팩 개발 화면의 설명 | `base`, `body`, `manifest`, `JSON parse failed`가 섞인 문장 | `기본 팩`, `내용`, `활성 목록`, `JSON 해석 실패` |

## 범위 밖

- 소스 코드 주석, 테스트 이름, 엔진 로그, 데이터 팩 스키마 키와 오류 코드 자체의 번역
- 영문판 카피 작성, 언어 선택 UI, locale 감지, 번역 파일 체계 도입
- `caseCollection` 저장소명·패키지명·GitHub Pages 경로 변경
- 카드명·사건 본문의 내용 개정. 단, 실제 화면에 노출되는 `guest allowlist` 같은 구현 용어 제거는 범위 안이다.

## Codex delegation

```markdown
Mode: T
Owner: Claude
Source-ticket: .scratch/case-collection/issues/36-korean-ui-copy-cleanup.md
Decision-state: closed (implementation ticket ready for an agent — copy-only, no open design question)
Write-scope:
  - prototype/core-loop/index.html
  - prototype/core-loop/package.json
  - prototype/core-loop/src/App.svelte
  - prototype/core-loop/src/lib/content.ts
  - prototype/core-loop/src/lib/run-session.ts
  - prototype/core-loop/src/lib/pack-storage.ts
  - prototype/core-loop/src/lib/ui/*.svelte
  - prototype/core-loop/smoke-run-session.ts
  - prototype/core-loop/smoke-collection.ts
  - prototype/core-loop/scripts/verify-korean-ui-copy.mjs (new)
  - prototype/core-loop/scripts/run-core-smoke-ci.mjs
  - prototype/core-loop/scripts/run-core-smoke-ci.test.mjs
  - openwiki/testing/guidance.md
Knowledge-sources:
  - This ticket's own 교체표 and Task 1-4 code blocks (self-contained, no external wiki lookup needed)
Acceptance:
  - npm run smoke:korean-ui -> PASS Korean player UI copy
  - npm run smoke:run-session && npm run smoke:collection -> both PASS
  - node --test scripts/run-core-smoke-ci.test.mjs -> all pass
  - npm run test:release-tools && npm run smoke:ci && npm run typecheck && npm run build -> all exit 0, no FAIL token
Scope excluded from delegation: Task 4 Steps 4-6 (browser walkthrough, Resolution draft) and Task 5 (ticket close + MAP.md + commit) stay with Claude — browser verification and ticket/commit authority are not Codex's job per this doc's Authority model.
Integration-owner: Claude
Status: completed
```

### Task 1: 영문 노출을 재현하는 카피 감사 스모크 추가

**Files:**
- Create: `prototype/core-loop/scripts/verify-korean-ui-copy.mjs`
- Modify: `prototype/core-loop/package.json`

**Interfaces:**
- Consumes: 플레이어 UI를 구성하는 `index.html`, `src/App.svelte`, `src/lib/ui/*.svelte`, `src/lib/content.ts`, `src/lib/run-session.ts`
- Produces: `npm run smoke:korean-ui`; 금지 문구가 있으면 `FAIL <file>: <phrase>`를 출력하고 exit code 1, 모두 제거되면 `PASS Korean player UI copy`를 출력하고 exit code 0

- [x] **Step 1: 현재 회귀를 정확히 잡는 스모크 스크립트를 작성한다**

```js
import { readFile } from 'node:fs/promises';

const rules = [
  { file: 'index.html', forbidden: ['PROTOTYPE', 'caseCollection'], required: ['<title>단서수집가</title>'] },
  { file: 'src/App.svelte', forbidden: ['CASE COLLECTION', '기존 run'], required: ['단서수집가', '기존 수사 기록'] },
  { file: 'src/lib/ui/HomeScreen.svelte', forbidden: ['CASE COLLECTION', '저장된 run'], required: ['단서수집가', '저장된 수사 기록'] },
  { file: 'src/lib/ui/BriefingScreen.svelte', forbidden: ['BOSS BRIEFING', '`CASE ${'], required: ['최종 사건 브리핑', '`사건 ${'] },
  { file: 'src/lib/ui/CaseScreen.svelte', forbidden: ['CASE REVIEW'], required: ['사건 검토'] },
  { file: 'src/lib/ui/CollectionScreen.svelte', forbidden: ['>COLLECTION<'], required: ['>컬렉션<'] },
  { file: 'src/lib/ui/InterludeScreen.svelte', forbidden: ['INTERLUDE', 'guest allowlist', 'AP 1'], required: ['막간 수사', '대여 가능 목록', '행동력 1'] },
  { file: 'src/lib/ui/EndScreen.svelte', forbidden: ['BAD ENDING', "'ENDING'", 'ending은', 'Run Summary'], required: ['실패 결말', "'결말'", '수사 요약'] },
  { file: 'src/lib/ui/RunSummaryScreen.svelte', forbidden: ['RUN SUMMARY', 'BAD 엔딩', '>Home<'], required: ['수사 요약', '실패 결말', '>첫 화면<'] },
  { file: 'src/lib/content.ts', forbidden: ['게스트 allowlist'], required: ['대여 가능 목록'] },
  { file: 'src/lib/run-session.ts', forbidden: ['올바른 JSON', '저장 envelope', 'RunSnapshot@1 형식', 'action sequence'], required: ['저장 데이터가 손상되었습니다.', '현재 버전에서 읽을 수 없는 저장 데이터입니다.', '호환되지 않는 저장 데이터 형식입니다.', '저장된 수사 상태가 유효하지 않습니다.'] },
];

let failures = 0;
for (const { file, forbidden, required } of rules) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  for (const phrase of forbidden) {
    if (!source.includes(phrase)) continue;
    failures += 1;
    console.error(`FAIL ${file}: ${phrase}`);
  }
  for (const phrase of required) {
    if (source.includes(phrase)) continue;
    failures += 1;
    console.error(`FAIL ${file}: missing ${phrase}`);
  }
}

if (failures > 0) process.exitCode = 1;
else console.log('PASS Korean player UI copy');
```

- [x] **Step 2: package script를 추가한다**

```json
"smoke:korean-ui": "node scripts/verify-korean-ui-copy.mjs"
```

- [x] **Step 3: 스모크가 현재 코드에서 실패하는지 확인한다**

Run: `npm run smoke:korean-ui`

Expected: 위 교체표의 현재 영문 문구와 아직 없는 한국어 대체 문구가 `FAIL`로 보고되고 exit code 1.

### Task 2: 정상 플레이 경로의 표시 카피 교체

**Files:**
- Modify: `prototype/core-loop/index.html`
- Modify: `prototype/core-loop/src/App.svelte`
- Modify: `prototype/core-loop/src/lib/ui/HomeScreen.svelte`
- Modify: `prototype/core-loop/src/lib/ui/BriefingScreen.svelte`
- Modify: `prototype/core-loop/src/lib/ui/CaseScreen.svelte`
- Modify: `prototype/core-loop/src/lib/ui/CollectionScreen.svelte`
- Modify: `prototype/core-loop/src/lib/ui/InterludeScreen.svelte`
- Modify: `prototype/core-loop/src/lib/ui/EndScreen.svelte`
- Modify: `prototype/core-loop/src/lib/ui/RunSummaryScreen.svelte`
- Modify: `prototype/core-loop/src/lib/content.ts`

**Interfaces:**
- Consumes: 기존 Svelte props와 `RunContent`; Task 1의 금지 문구 목록
- Produces: 교체표의 한국어 카피를 사용하는 동일한 화면 그래프. 컴포넌트 API와 `Action` payload는 그대로 유지

- [x] **Step 1: 브라우저 제목·브랜드·진행 표제를 교체한다**

`index.html`, `App.svelte`, `HomeScreen.svelte`, `BriefingScreen.svelte`, `CaseScreen.svelte`, `CollectionScreen.svelte`에서 교체표의 문구를 그대로 적용한다. `CASE ${game.caseIndex + 1}`은 ``사건 ${game.caseIndex + 1}``로 바꾸고, 내부 `caseIndex`나 화면 상태 값은 건드리지 않는다.

- [x] **Step 2: 인터루드 카피를 교체한다**

`InterludeScreen.svelte`의 표제를 `막간 수사 · 3선 2택`, 비용을 `행동력 1`, fallback 면담 설명을 `다음 사건의 대여 가능 목록에서 측면 하나를 빌린다.`로 바꾼다. `content.ts`의 authored 면담 설명도 같은 어휘로 맞춘다.

- [x] **Step 3: 결말과 요약 카피를 교체한다**

`EndScreen.svelte`와 `RunSummaryScreen.svelte`에 교체표의 `결말`, `실패 결말`, `수사 요약`, `첫 화면`을 적용한다. 내부 분기 값 `GOOD`/`BAD`와 `SHOW_SUMMARY`는 유지한다.

- [x] **Step 4: 정상 경로용 스모크를 다시 실행한다**

Run: `npm run smoke:korean-ui`

Expected: 저장 복구 문구만 아직 `FAIL`; 정상 플레이 화면의 금지 문구는 더 이상 보고되지 않음.

### Task 3: 저장 복구·개발자 도구 경계에서 raw 영문 코드 분리

**Files:**
- Modify: `prototype/core-loop/src/App.svelte`
- Modify: `prototype/core-loop/src/lib/run-session.ts`
- Modify: `prototype/core-loop/src/lib/ui/HomeScreen.svelte`
- Modify: `prototype/core-loop/src/lib/ui/DataPackScreen.svelte`
- Modify: `prototype/core-loop/src/lib/pack-storage.ts`
- Test: `prototype/core-loop/smoke-run-session.ts`
- Test: `prototype/core-loop/smoke-collection.ts`

**Interfaces:**
- Consumes: `SnapshotIssueCode`, `CollectionLoadResult['issue']`, 기존 손상 원문 보존 정책
- Produces: 내부 오류 코드는 유지하되 플레이어 화면에는 한국어 설명만 전달. 손상 원문을 자동 삭제하지 않는 기존 동작은 유지

- [x] **Step 1: 저장 복구 테스트 기대값을 한국어 사용자 문구로 먼저 바꾼다**

`smoke-run-session.ts`에서 네 오류 코드의 `message`를 다음과 같이 검증한다.

```ts
const expectedMessage = {
  CORRUPT_JSON: '저장 데이터가 손상되었습니다.',
  FUTURE_VERSION: '현재 버전에서 읽을 수 없는 저장 데이터입니다.',
  INCOMPATIBLE_FORMAT: '호환되지 않는 저장 데이터 형식입니다.',
  STATE_INVALID: '저장된 수사 상태가 유효하지 않습니다.',
};
```

Run: `npm run smoke:run-session`

Expected: 기존 영문 혼합 메시지와 달라 FAIL.

- [x] **Step 2: 저장 스냅샷 메시지와 확인창을 교체한다**

`run-session.ts`가 위 네 문구를 반환하게 하고, `App.svelte` 확인창의 `기존 run`을 `기존 수사 기록`으로 바꾼다. 진단용 `SnapshotIssue.code`는 유지한다.

- [x] **Step 3: 컬렉션 오류 코드를 UI 경계에서 한국어로 매핑한다**

`HomeScreen.svelte`에서 raw code를 그대로 렌더링하지 않고 다음 exhaustiveness-preserving map을 사용한다.

```ts
const collectionIssueCopy = {
  CORRUPT_JSON: '컬렉션 저장 데이터가 손상되었습니다.',
  FUTURE_VERSION: '현재 버전에서 읽을 수 없는 컬렉션 저장 데이터입니다.',
  INCOMPATIBLE_FORMAT: '호환되지 않는 컬렉션 저장 데이터 형식입니다.',
  STATE_INVALID: '저장된 컬렉션 상태가 유효하지 않습니다.',
} satisfies Record<NonNullable<CollectionLoadResult['issue']>, string>;
```

`collectionIssue` prop 타입을 `CollectionLoadResult['issue']`로 좁히고 `{collectionIssueCopy[collectionIssue]}`를 렌더링한다. `collection.ts`가 보존하는 raw code와 저장 호환성은 바꾸지 않는다.

- [x] **Step 4: 개발자 데이터 팩 화면의 설명 문장만 한국어화한다**

`DataPackScreen.svelte`의 `JSON parse failed`를 `JSON 해석 실패`, `base 뒤에`를 `기본 팩 뒤에`, `manifest에서 비활성화`를 `활성 목록에서 비활성화`로 바꾼다. `pack-storage.ts`의 `활성 팩 body가 없다`는 `활성 팩 내용이 없다`로 바꾼다. `<code>{issue.code}</code>`, 업로드 파일명, 스키마 경로는 Global Constraints의 기술 식별자 예외로 유지한다.

- [x] **Step 5: 저장과 카피 스모크를 통과시킨다**

Run: `npm run smoke:run-session && npm run smoke:collection && npm run smoke:korean-ui`

Expected: 세 명령 모두 PASS, 출력에 `FAIL` 없음.

### Task 4: CI 편입과 실제 브라우저 수용 검증

**Files:**
- Modify: `prototype/core-loop/scripts/run-core-smoke-ci.mjs`
- Modify: `prototype/core-loop/scripts/run-core-smoke-ci.test.mjs`
- Modify: `openwiki/testing/guidance.md`

**Interfaces:**
- Consumes: Task 1의 `smoke:korean-ui`
- Produces: release gate에 포함된 한국어 UI 카피 회귀 검사와 수동 브라우저 검증 기록

- [x] **Step 1: strict smoke suite에 카피 검사를 편입한다**

`CORE_SMOKE_SCRIPTS`의 `smoke:public-assets` 앞에 `smoke:korean-ui`를 추가하고, 테스트에는 다음 검증을 추가한다.

```js
assert.ok(CORE_SMOKE_SCRIPTS.includes('smoke:korean-ui'));
```

`openwiki/testing/guidance.md`의 CI smoke 개수와 UI 변경 최소 검증에 `smoke:korean-ui`를 반영한다.

- [x] **Step 2: 정적 감사로 남은 영문 후보를 검토한다**

Run:

```powershell
rg -n "CASE COLLECTION|BOSS BRIEFING|CASE REVIEW|INTERLUDE|RUN SUMMARY|Run Summary|BAD ENDING|ENDING|COLLECTION|Home|AP 1|guest allowlist|저장된 run|ending은|BAD 엔딩|PROTOTYPE" src index.html
```

Expected: 사용자 노출 카피 0건. 내부 enum/action/type 또는 주석만 남으면 이 티켓의 범위 밖임을 diff review에서 확인한다.

- [x] **Step 3: 전체 자동 검증을 실행한다**

Run:

```powershell
npm run test:release-tools
npm run smoke:ci
npm run typecheck
npm run build
```

Expected: 모두 exit code 0이며 어떤 출력에도 `FAIL` 없음.

- [x] **Step 4: 브라우저 정상 경로를 확인한다**

Home → Briefing → Case → Review → Clear → Interlude → Ending → Run Summary → Collection을 한 번 진행한다. 각 화면의 eyebrow·버튼·설명에 교체표의 영문이 없고, `단서수집가`, `최종 사건 브리핑`, `막간 수사`, `행동력`, `결말`, `수사 요약`, `첫 화면`이 실제로 렌더링되는지 확인한다.

- [x] **Step 5: 브라우저 복구 오류 경로를 확인한다**

DevTools에서 `case-collection.run-snapshot.v1`과 `case-collection.collection.v1`에 각각 손상 JSON을 넣고 새로고침한다. 화면에 raw code나 `JSON`, `run`, `envelope`, `sequence`가 노출되지 않고 한국어 오류 설명과 원문 보존 안내가 보이는지 확인한다. 확인 뒤 해당 테스트 데이터만 삭제하고 정상 저장을 다시 확인한다.

- [x] **Step 6: 자동·브라우저 검증 결과를 티켓의 `## Resolution` 초안에 기록한다**

자동 명령의 통과 여부와 브라우저에서 확인한 정상·복구 경로를 각각 한 문단으로 기록한다. 아직 `Status`를 닫거나 MAP을 수정하지 않는다.

### Task 5: 티켓 종료 housekeeping과 커밋

**Files:**
- Modify: `.scratch/case-collection/issues/36-korean-ui-copy-cleanup.md`
- Modify: `.scratch/case-collection/MAP.md`

**Interfaces:**
- Consumes: Task 4의 자동·브라우저 검증 기록
- Produces: 닫힌 티켓 36과 MAP의 `[검증]` 결정 색인. [35](35-mvp-launch-integration-check.md)의 blocker 표기는 그대로 두며, `Status: closed`가 되면 자동으로 해소된 것으로 해석

- [x] **Step 1: 티켓을 닫고 MAP에 검증 결과를 색인한다**

검증이 모두 통과한 경우에만 `Status: closed`로 바꾸고, `## Resolution`에 실제 교체 범위·예외·검증 결과를 확정 기록한다. MAP `Decisions so far`에는 다음 형식으로 한 줄을 추가한다.

```markdown
- `[검증]` [사용자 노출 영문 카피 한국어화](issues/36-korean-ui-copy-cleanup.md) — 일반 플레이·저장 복구 화면의 영문 카피를 한국어로 통일하고, 내부 식별자는 유지한 채 `smoke:korean-ui`를 release gate에 편입했다.
```

- [x] **Step 2: 이번 티켓 파일만 stage해 커밋한다**

```powershell
git add prototype/core-loop/index.html prototype/core-loop/package.json prototype/core-loop/src/App.svelte prototype/core-loop/src/lib/content.ts prototype/core-loop/src/lib/run-session.ts prototype/core-loop/src/lib/pack-storage.ts prototype/core-loop/src/lib/ui prototype/core-loop/smoke-run-session.ts prototype/core-loop/smoke-collection.ts prototype/core-loop/scripts/verify-korean-ui-copy.mjs prototype/core-loop/scripts/run-core-smoke-ci.mjs prototype/core-loop/scripts/run-core-smoke-ci.test.mjs openwiki/testing/guidance.md .scratch/case-collection/issues/36-korean-ui-copy-cleanup.md .scratch/case-collection/MAP.md
git commit -m "fix: 한국어 UI 카피 정리 (ticket 36)"
```

## Acceptance Criteria

- 일반 플레이 및 저장 복구 화면에서 교체표의 영문 문구가 보이지 않는다.
- 화면용 제품명은 `단서수집가`이지만 내부 `caseCollection` 식별자와 저장 데이터 호환성은 유지된다.
- 컬렉션 오류 raw code는 플레이어 화면에 직접 출력되지 않는다.
- 개발자 도구는 기술 식별자를 유지하되 설명 문장은 한국어다.
- `smoke:korean-ui`가 현재 발견된 영문 문구의 재도입을 실패로 잡고 `smoke:ci`에 포함된다.
- `test:release-tools`, `smoke:ci`, `typecheck`, `build`가 통과하며 브라우저 정상·복구 경로가 확인된다.

## Comments

- 2026-08-03: 사용자가 실제 실행 화면에 남은 영문을 지적해 발급. 소스 감사 결과 정상 화면뿐 아니라 저장 복구 오류와 브라우저 제목에도 혼합 카피가 있었으며, [35](35-mvp-launch-integration-check.md)의 최종 출시 점검 전에 닫아야 하는 선행 작업으로 연결했다.

## Resolution

2026-08-03: 브라우저 제목과 제품 브랜드를 `단서수집가`로 통일하고, 브리핑·사건 검토·막간 수사·결말·수사 요약·컬렉션의 사용자 노출 카피를 한국어로 교체했다. 저장 복구 경계에서는 `SnapshotIssue.code`와 `CollectionLoadResult['issue']` 식별자를 유지하면서 사용자에게는 한국어 설명만 보이도록 분리했다. 개발자 데이터 팩 화면의 파일명·오류 코드·스키마 경로와 저장 형식은 호환성을 위해 유지했다.

`smoke:korean-ui`를 추가하고 12개 스크립트의 `smoke:ci` release gate에 편입했다. `npm run smoke:run-session`, `npm run smoke:collection`, `npm run smoke:korean-ui`, `npm run test:release-tools`(68/68), `npm run smoke:ci`(12/12), `npm run typecheck`, `npm run build`가 모두 통과했고 출력에 `FAIL`이 없었다.

실제 프로덕션 빌드를 브라우저에서 Home → Briefing → Case → Review → Clear → Interlude → Ending → Run Summary → Collection 순서로 4개 사건을 완주했다. `단서수집가`, `최종 사건 브리핑`, `막간 수사`, `행동력`, `결말`, `수사 요약`, `첫 화면`, `컬렉션`이 실제 렌더링되고 대체 대상 영문이 보이지 않음을 확인했다. 두 localStorage 키에 손상 JSON을 넣은 복구 경로에서도 raw code·`JSON`·`run`·`envelope`·`sequence`가 노출되지 않고 한국어 오류 설명과 원문 보존 안내가 보였다. 검증 후 손상 테스트 데이터를 삭제하고 새 정상 수사 저장을 다시 생성했다.
