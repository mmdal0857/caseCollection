# Higgsfield Card Art Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검토 가능한 프롬프트 manifest와 재개 가능한 생성 스크립트를 만든 뒤, 대표 실패 유형 6장을 먼저 생성·검수하고 단서 카드 20장을 안전하게 완성한다.

**Architecture:** 카드별 사물 묘사는 manifest에 두고, 스타일·배경·조명 규칙은 생성 스크립트가 한 번만 결합한다. 생성은 기존 스타일 키를 참조하고 결과 URL과 파일을 기록하며, 이미 완성된 파일은 기본적으로 건너뛴다. 패턴·힌트 6장은 단서 카드 파일럿과 분리해 시각 체계가 정해진 뒤 생성한다.

**Tech Stack:** Bash, Higgsfield CLI `nano_banana_pro`, JSONL manifest, Node.js 검증 스크립트, SvelteKit 프로토타입

## Global Constraints

- 스타일 정본은 `docs/art/style-key.png`와 `scripts/cardart-generate.sh`의 `STYLE / GROUND / LIGHT / RULE`이다.
- 생성 모델은 `nano_banana_pro`, 종횡비는 `3:4`, 해상도는 `1k`다.
- 카드 아트는 용도나 측면이 아니라 사물을 그린다.
- 바탕은 평평한 근-흑색이고 조명은 중립이어야 한다.
- 태그 효과는 이미지에 굽지 않고 런타임 CSS로 계산한다.
- `content.ts`가 정의한 현재 생성 대상은 단서 20장, 패턴 4장, 힌트 2장이다.
- 패턴·힌트 6장은 단서 20장과 같은 배치에서 자동 생성하지 않는다.
- 실제 생성 전 Higgsfield CLI 설치와 인증을 사용자가 명시적으로 승인해야 한다.

---

### Task 1: 프롬프트 계약과 manifest 확정

**Files:**
- Create: `scripts/cardart-manifest.jsonl`
- Modify: `.scratch/case-collection/card-art-prompts-draft.md`
- Modify: `scripts/cardart-generate.sh`

**Interfaces:**
- Consumes: `prototype/core-loop/src/lib/content.ts`의 단서·패턴·힌트 ID
- Produces: 한 줄에 `id`, `category`, `description`, `composition`을 가진 JSONL manifest

- [ ] **Step 1: 전역 프롬프트 충돌을 재현하는 검증을 작성**

`scripts/check-cardart-manifest.mjs`를 만들 계획은 Task 2에 두고, 먼저 manifest에 아래 대표 행을 넣는다.

```json
{"id":"thread_fiber","category":"clue","description":"a few loose strands of thread and textile fibre, lying free","composition":"single"}
{"id":"scattered_belongings","category":"clue","description":"a pocket watch, a bone comb, a single leather glove and three loose coins arranged as one coherent group","composition":"group"}
{"id":"forged_ledger","category":"clue","description":"a thick account ledger lying open, ruled into narrow columns filled with illegible handwritten marks, one line scraped thin and written over in darker ink, cloth spine frayed at the head","composition":"single"}
```

- [ ] **Step 2: 전역 규칙을 실제 대상과 모순되지 않게 수정**

`scripts/cardart-generate.sh`의 `RULE`을 다음 의미로 변경한다.

```bash
RULE_SINGLE='Single isolated object, centered. The object alone as a specimen — no scene, no hands, no action, no narrative. No readable words, logos, watermark, or signature; abstract illegible marks are allowed when they are physically part of a document.'
RULE_GROUP='One coherent isolated object group, centered. The grouped objects alone as a specimen — no surrounding scene, no hands, no action, no narrative. No readable words, logos, watermark, or signature; abstract illegible marks are allowed when they are physically part of a document.'
```

`composition=single|group`에 따라 규칙을 선택한다. 이 변경은 글자를 생성하라는 뜻이 아니라 장부·편지의 물리적 잉크 흔적을 허용하는 것이다.

- [ ] **Step 3: 단서 20장을 manifest로 옮기기**

`.scratch/case-collection/card-art-prompts-draft.md`의 본편 20개 설명을 JSONL로 옮긴다. 다음 두 카드만 `composition:"group"`으로 둔다.

```text
scattered_belongings
handwriting_match
```

나머지는 `composition:"single"`이다.

- [ ] **Step 4: 패턴·힌트 6장을 보류 대상으로 명시**

manifest에는 6개를 `category:"adjunct"`로 기록하되 `enabled:false`를 추가한다.

```json
{"id":"locked-room","category":"adjunct","enabled":false,"description":"a heavy hand-forged iron door bolt seated in its keeper plate, the shaft pitted with rust, square-headed rivets through the mounting strap","composition":"single"}
```

같은 형식으로 `false-alibi`, `invisible-man`, `staged-disappearance`, `analysis`, `tipoff`를 기록한다.

- [ ] **Step 5: 초안 문서에 검토 결론 반영**

초안 상단 상태를 다음과 같이 갱신한다.

```text
상태: 단서 20장 manifest 이관 준비. 패턴·힌트 6장은 별도 시각 규칙 결정 전 생성 보류.
생성 순서: 스트레스 파일럿 6장 → 사람 검수 → 단서 20장 → 부록 재검토.
```

- [ ] **Step 6: 셸 문법 확인**

Run:

```bash
"C:/Program Files/Git/bin/bash.exe" -n scripts/cardart-generate.sh
```

Expected: 출력 없이 exit 0.

- [ ] **Step 7: 커밋**

```bash
git add scripts/cardart-manifest.jsonl scripts/cardart-generate.sh .scratch/case-collection/card-art-prompts-draft.md
git commit -m "feat(art): define validated card art manifest"
```

---

### Task 2: Manifest 정합성 검증

**Files:**
- Create: `scripts/check-cardart-manifest.mjs`
- Modify: `package.json`
- Test: `scripts/check-cardart-manifest.mjs`

**Interfaces:**
- Consumes: `scripts/cardart-manifest.jsonl`, `prototype/core-loop/src/lib/content.ts`
- Produces: exit 0과 `PASS clues=20 adjuncts=6`, 또는 중복·누락·잘못된 composition을 설명하는 exit 1

- [ ] **Step 1: 중복 ID 실패 fixture를 코드 안에 정의**

검증 함수의 인터페이스를 다음처럼 둔다.

```js
export function validateManifest(rows, contentSource) {
  return { errors: [], counts: { clues: 0, adjuncts: 0 } };
}
```

직접 실행 시 실제 manifest와 `content.ts`를 읽고 결과를 출력한다.

- [ ] **Step 2: 검증 조건 구현**

다음을 모두 검사한다.

```text
JSONL 각 줄이 파싱된다.
id가 중복되지 않는다.
composition은 single 또는 group이다.
단서 20개가 모두 enabled 상태다.
패턴·힌트 6개는 adjunct이며 enabled=false다.
manifest ID 26개가 content.ts의 단서·패턴·힌트 ID와 일치한다.
```

- [ ] **Step 3: 검증 실행**

Run:

```bash
node scripts/check-cardart-manifest.mjs
```

Expected:

```text
PASS clues=20 adjuncts=6
```

- [ ] **Step 4: 프로젝트 스크립트 등록**

루트 `package.json`이 있으면 다음을 추가한다.

```json
"art:check-manifest": "node scripts/check-cardart-manifest.mjs"
```

루트 `package.json`이 없으면 새 패키지를 만들지 않고 직접 실행 명령을 정본으로 유지한다.

- [ ] **Step 5: 커밋**

```bash
git add scripts/check-cardart-manifest.mjs package.json
git commit -m "test(art): validate card art manifest coverage"
```

루트 `package.json`이 없으면 해당 경로는 `git add`에서 제외한다.

---

### Task 3: 재개 가능한 배치 생성기

**Files:**
- Create: `scripts/cardart-batch.mjs`
- Modify: `scripts/cardart-generate.sh`
- Create at runtime: `prototype/core-loop/public/cardart/generation-log.jsonl`

**Interfaces:**
- Consumes: manifest 행과 선택적 카드 ID 목록
- Produces: 카드별 PNG와 `{id,url,path,generatedAt}` 로그 행

- [ ] **Step 1: dry-run의 기대 출력을 정의**

Run:

```bash
node scripts/cardart-batch.mjs --dry-run thread_fiber forged_ledger
```

Expected:

```text
PLAN thread_fiber composition=single
PLAN forged_ledger composition=single
TOTAL 2
```

- [ ] **Step 2: 선택·건너뛰기 로직 구현**

`cardart-batch.mjs`는 다음 규칙을 지킨다.

```text
명시된 ID가 있으면 그 ID만 선택한다.
ID가 없으면 enabled=true인 clue만 선택한다.
기존 PNG가 있으면 기본적으로 SKIP한다.
--force일 때만 기존 PNG를 다시 생성한다.
adjunct는 --include-adjunct를 줘도 enabled=false인 동안 생성하지 않는다.
한 카드 실패 시 이후 카드를 생성하지 않고 exit 1 한다.
```

- [ ] **Step 3: 생성 스크립트에 composition 인자 추가**

호출 형식을 다음으로 확장한다.

```bash
bash scripts/cardart-generate.sh thread_fiber "a few loose strands of thread and textile fibre, lying free" single
```

인자가 없으면 `single`을 기본값으로 하여 기존 직접 호출과 호환한다.

- [ ] **Step 4: URL 로그를 원자적으로 추가**

성공한 결과만 `generation-log.jsonl`에 추가한다. 토큰이나 인증 정보는 기록하지 않는다.

- [ ] **Step 5: 무비용 dry-run 검증**

Run:

```bash
node scripts/cardart-batch.mjs --dry-run thread_fiber scattered_belongings forged_ledger omitted_witness venom_trace confronted_servant
```

Expected: `TOTAL 6`, 네트워크 요청과 PNG 생성 없음.

- [ ] **Step 6: 커밋**

```bash
git add scripts/cardart-batch.mjs scripts/cardart-generate.sh
git commit -m "feat(art): add resumable card art batching"
```

---

### Task 4: Higgsfield 실행 환경 확인

**Files:**
- Modify only if needed: user PATH outside repository

**Interfaces:**
- Consumes: 공식 Higgsfield CLI 설치와 사용자 OAuth 세션
- Produces: `account status` 성공과 `nano_banana_pro` 현재 스키마 확인

- [ ] **Step 1: 설치 승인을 사용자에게 받기**

현재 PowerShell PATH에는 `higgsfield`가 없다. 공식 설치 스크립트는 외부 코드를 사용자 환경에서 실행하므로 명시 승인 전 실행하지 않는다.

- [ ] **Step 2: 승인 후 공식 CLI 설치**

Run:

```bash
"C:/Program Files/Git/bin/bash.exe" -lc "curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh"
```

Expected: 설치 경로가 출력되고 exit 0.

- [ ] **Step 3: 인증 확인**

Run:

```bash
higgsfield account status
```

Expected: 인증된 계정 상태. `Session expired` 또는 `Not authenticated`면 사용자가 직접 `higgsfield auth login`을 실행한다.

- [ ] **Step 4: 모델 전체 목록과 스키마 확인**

Run:

```bash
higgsfield model list --json
higgsfield model get nano_banana_pro --json
```

Expected: `nano_banana_pro`가 존재하고 `3:4`, `1k`, 이미지 레퍼런스 입력을 지원한다.

---

### Task 5: 스트레스 파일럿 6장 생성 및 사람 검수

**Files:**
- Create at runtime: `prototype/core-loop/public/cardart/*.png`
- Create at runtime: `prototype/core-loop/public/cardart/generation-log.jsonl`
- Modify after review: `scripts/cardart-manifest.jsonl`

**Interfaces:**
- Consumes: 검증된 manifest, 스타일 키, 인증된 Higgsfield CLI
- Produces: 서로 다른 실패 유형을 대표하는 PNG 6장

- [ ] **Step 1: 파일럿 생성**

Run:

```bash
node scripts/cardart-batch.mjs thread_fiber forged_ledger scattered_belongings omitted_witness venom_trace confronted_servant
```

Expected: PNG 6장과 URL 로그 6행.

- [ ] **Step 2: 92px 가독성 검수**

각 이미지를 카드 UI에 넣고 다음을 판정한다.

```text
thread_fiber: 스타일 키와 같은 스타일이되 단순 복제가 아니다.
forged_ledger: 장부로 읽히며 글자가 실제 문장처럼 생성되지 않는다.
scattered_belongings: 하나의 묶음으로 읽히고 장면처럼 보이지 않는다.
omitted_witness: 빈 의자가 다른 사람-부재 대역과 구분된다.
venom_trace: 병 자체보다 흔적 카드로 읽힐 여지가 남는다.
confronted_servant: 가로로 긴 벨 보드가 3:4 프레임에서 잘리지 않는다.
```

- [ ] **Step 3: 실패 카드만 설명 수정**

스타일·배경·조명 문제가 공통으로 발생했을 때만 전역 규칙을 수정한다. 한 사물의 가독성 문제는 해당 `description`만 수정한다.

- [ ] **Step 4: 실패 카드만 `--force`로 재생성**

Run:

```bash
node scripts/cardart-batch.mjs --force venom_trace
```

Expected: 예시 실패 카드인 `venom_trace`만 재생성되고 통과한 기존 카드는 재생성되지 않는다. 실제 실패 카드가 다르면 그 카드 ID로 같은 명령을 실행한다.

- [ ] **Step 5: 파일럿 판정 기록 커밋**

바이너리는 프로젝트 `.gitignore` 정책대로 커밋하지 않는다. manifest 설명 변경과 초안의 검수 메모만 커밋한다.

```bash
git add scripts/cardart-manifest.jsonl .scratch/case-collection/card-art-prompts-draft.md
git commit -m "docs(art): record card art pilot findings"
```

---

### Task 6: 단서 20장 완성 후 부록 재평가

**Files:**
- Create at runtime: `prototype/core-loop/public/cardart/*.png`
- Modify: `.scratch/case-collection/card-art-prompts-draft.md`

**Interfaces:**
- Consumes: 파일럿을 통과한 프롬프트 계약
- Produces: 단서 카드 PNG 20장과 부록 6장의 생성 여부 결정

- [ ] **Step 1: 남은 단서 생성**

Run:

```bash
node scripts/cardart-batch.mjs
```

Expected: 기존 파일럿 6장은 SKIP, 나머지 단서 14장은 생성.

- [ ] **Step 2: 전체 단서 UI 검수**

20장을 한 화면에 놓고 다음을 확인한다.

```text
카드 간 사물 실루엣이 구분된다.
근-흑색 바탕과 중립 조명이 유지된다.
내부 액자·표본 카드·흰 종이 배경이 생기지 않았다.
사람의 부재를 대역한 omitted_witness와 uniform_habit가 혼동되지 않는다.
문서 카드 네 장이 모두 사각형으로만 뭉개지지 않는다.
태그 CSS 처리 전에도 원본 명사가 읽힌다.
```

- [ ] **Step 3: 패턴·힌트 6장 생성 여부 결정**

다음 중 하나를 명시적으로 선택한다.

```text
A. 단서와 같은 중립 사물 아트를 쓰고 카드 프레임만 별도 처리한다.
B. 패턴·힌트 전용 추상 시각 언어를 별도 설계한다.
C. MVP에서는 슈트/종류 공용 폴백을 사용하고 개별 아트를 보류한다.
```

초기 개발의 과설계를 피하려면 기본 권고는 C다. 패턴·힌트의 개별 아트가 플레이 판독에 실제로 필요한지 UI에서 먼저 확인한다.

- [ ] **Step 4: 결과 문서 갱신**

초안에 생성 성공 수, 재시도 카드, 부록 결정, 남은 49종 확장 범위를 기록한다.

- [ ] **Step 5: 커밋**

```bash
git add .scratch/case-collection/card-art-prompts-draft.md
git commit -m "docs(art): close prototype clue art batch"
```
