# OpenWiki의 caseCollection/OUT 수집 파이프라인 적합성

조사일: 2026-07-27  
검토 기준: `langchain-ai/openwiki` 0.2.3 (2026-07-23 릴리스)  
근거 범위: OpenWiki 공식 저장소의 README, 릴리스, 소스, 자체 생성 문서와 Google OKF 공식 명세. 제품 소개나 제3자 글은 근거로 사용하지 않았다.

## 결론

**권고: 제한된 파일럿은 진행하되, OpenWiki를 OUT 위키 정본·Google Drive 수집기·`patternContract` 생성기로 도입하지 않는다.**

가장 잘 맞는 역할은 다음과 같다.

```text
Google Drive (비정본 벌크 저장)
  → 기존 rclone 동기화
  → 버전 고정 로컬 원문 스냅샷 + manifest/hash
  → OpenWiki 격리 실행
  → 출처가 붙은 패턴·단서 후보
  → OUT 전용 변환기 + 스키마/관계 검증 + 사람 검토
  → pd_wiki 정본
```

OpenWiki의 가치가 있는 부분은 고정된 로컬 자료를 에이전트가 탐색해 연결된 Markdown 후보로 합성하는 기능, 로컬 LLM 호환성, 사용자 지침, 업데이트 자동화다. 반면 OUT이 요구하는 안정적인 ID, 관계 필드의 단일 진실 원천, `catalog.json`의 `wiki_source_id`, 후보와 승인본의 경계는 OpenWiki가 보장하지 않는다.

| 판단 | 대상 | 이유 |
|---|---|---|
| **파일럿** | 소수의 고정 소설 스냅샷에서 `case_pattern`·`clue_type` 후보 발견 | 로컬 저장소 탐색, 사용자 지침, Markdown/OKF 출력, 로컬 LLM을 낮은 비용으로 검증할 수 있다. |
| **유지** | Drive → rclone → 로컬 원문, `catalog.json` 정본 | 이미 네트워크 없는 재현 가능한 소비 경계가 있다. OpenWiki에는 Drive 커넥터가 없다. |
| **보류** | Tavily 웹 검색을 통한 신규 자료 발견 | 기능은 있지만 비용·출처 품질·중복·저작권·아카이빙 정책을 별도 결정해야 한다. |
| **보류** | OpenWiki 커스텀 Drive/파일 커넥터 | 런타임 플러그인이 아니라 OpenWiki 소스를 수정해야 한다. 기존 rclone 경로와 중복된다. |
| **거부** | OpenWiki 산출물을 `pd_wiki` 정본으로 직접 승격 | OUT의 typed edge/frontmatter 규칙을 검증하지 않으며 LLM 합성 결과다. |
| **거부** | 전체 소설 말뭉치의 체계적 추출 엔진으로 사용 | OpenWiki는 위키 합성 에이전트이지 전권 청킹·완전 탐색·구조화 추출 파이프라인이 아니다. |

## 확인된 기능

### 버전과 실행 환경

0.2.3은 2026-07-23에 공개된 최신 릴리스이며, 패키지는 Node.js 22 이상을 요구한다. Windows에서는 npm/pnpm 설치를 권장하고, Bun 전역 설치는 `better-sqlite3` 네이티브 빌드 때문에 Visual Studio Build Tools가 필요할 수 있다. 0.2.3에는 Windows OAuth URL 열기 수정과 경로 순회 차단 등 운용·보안 수정도 포함됐다. 아직 0.x 제품이므로 장기 통합 API의 안정성을 전제해서는 안 된다. 마지막 문장은 버전 상태에 근거한 판단이다.

- [OpenWiki 0.2.3 릴리스](https://github.com/langchain-ai/openwiki/releases/tag/0.2.3)
- [0.2.3 package.json](https://github.com/langchain-ai/openwiki/blob/0.2.3/package.json)
- [0.2.3 README의 Windows 설치 안내](https://github.com/langchain-ai/openwiki/blob/0.2.3/README.md#install)

### 실제 커넥터 범위

0.2.3의 `ConnectorId`와 레지스트리가 구현한 built-in은 정확히 일곱 개다.

- `git-repo`: 로컬 Git 저장소
- `google`: **Gmail**
- `hackernews`
- `notion`
- `slack`
- `web-search`: Tavily 검색
- `x`: X/Twitter

Google 커넥터는 Gmail API를 사용한다. README도 Drive·Calendar 등은 향후 확장 여지로 표현한다. 따라서 **Google Drive 파일 수집은 현재 지원하지 않는다.**

- [커넥터 타입](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/connectors/types.ts)
- [커넥터 레지스트리](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/connectors/registry.ts)
- [Gmail 구현](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/connectors/sources/gmail.ts)
- [공식 커넥터 설명](https://github.com/langchain-ai/openwiki/blob/0.2.3/openwiki/integrations/connectors.md)

`git-repo`는 저장소의 모든 파일을 raw에 복제하지 않는다. 경로, 브랜치, HEAD, 최근 20개 커밋, `git status --short`, `git diff --name-status HEAD`를 담은 compact manifest를 만들고, 에이전트가 설정된 로컬 저장소를 진실 원천으로 직접 탐색한다. 이는 OUT의 로컬 `raw_texts`가 Git 작업 트리 안에 있을 때 파일 접근 경로로 쓸 수 있지만, 임의 디렉터리나 개별 파일을 위한 별도 built-in connector는 아니다.

- [git-repo 구현](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/connectors/sources/git-repo.ts)
- [로컬 저장소를 진실 원천으로 취급하는 에이전트 지침](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/agent/prompt.ts)

`web-search`는 설정된 질의를 Tavily로 실행하는 검색 커넥터다. 임의 URL 목록을 그대로 보존하는 범용 웹 크롤러나 WARC 아카이버는 아니다.

- [web-search 구현](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/connectors/sources/web-search.ts)

### 커넥터 확장성

확장은 가능하지만 플러그인 방식은 아니다. 공식 `write-connector` 스킬은 OpenWiki OSS 저장소의 TypeScript 모듈로 커넥터를 추가하고 타입, 레지스트리, source 구현, onboarding, 테스트를 함께 수정하라고 명시한다. 동적 커넥터 패키지나 신뢰되지 않은 manifest의 런타임 로딩은 금지한다.

그러므로 Drive나 일반 파일 커넥터가 꼭 필요하면 포크/기여 형태의 유지보수 비용이 생긴다. caseCollection에는 이미 rclone 기반 로컬 수집 경계가 있으므로 이 비용을 지불할 이유가 아직 없다.

- [공식 write-connector 스킬](https://github.com/langchain-ai/openwiki/blob/0.2.3/skills/write-connector/SKILL.md)

### raw, manifest, 상태와 출처

네트워크를 사용하는 built-in connector는 결정론적 수집 코드를 먼저 실행하고 `~/.openwiki/connectors/<id>/raw/<run-id>/`에 JSON/manifest를 쓴다. 이후 합성 에이전트가 로컬 raw를 읽는다. credentialed fetch를 모델 제어 경로에서 분리한 설계는 적절하다.

공통 state에는 `lastRunAt`, `latestIds`, 최근 20개 run 기록이 들어갈 수 있다. 다만 증분성은 커넥터별이다. X는 `since_id`를 쓰지만, git-repo는 이전 HEAD부터의 콘텐츠 snapshot을 만드는 대신 현재 manifest와 최근 커밋을 다시 기록한다. Gmail과 web search도 “모든 원본의 불변 버전 저장소”를 제공하지 않는다. OpenWiki의 state를 소설 원문 버전 관리로 간주해서는 안 된다.

공식 connector 작성 지침은 raw에 source ID, timestamp, URL, author와 citation에 충분한 provenance를 보존하고, 가능한 경우 content hash/cursor를 저장하라고 요구한다. 그러나 이는 확장 규약이며 모든 생성 위키 페이지에 claim-level citation이 존재한다는 보장은 아니다. OpenWiki 0.2.3은 OKF v0.1을 출력하고, 실제 에이전트 지침은 inline source reference와 evidence note를 권장한다.

- [수집 orchestration](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/ingestion.ts)
- [raw/state IO](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/connectors/io.ts)
- [connector 공통 타입과 state](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/connectors/types.ts)
- [공식 connector provenance 규칙](https://github.com/langchain-ai/openwiki/blob/0.2.3/skills/write-connector/SKILL.md)
- [에이전트의 evidence/source 지침](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/agent/prompt.ts)

결론적으로 OpenWiki raw는 **조사 근거 캐시**로는 유용하지만, OUT이 원하는 **원문 스냅샷 원장**은 별도로 만들어야 한다.

### Markdown/OKF 출력과 스키마 강제력

OpenWiki 0.2.3은 code/personal 두 모드 모두 OKF v0.1 Markdown bundle을 출력한다.

- 각 concept는 YAML frontmatter의 non-empty `type`만 필수다.
- `index.md`와 `log.md`는 예약 파일이다.
- concept 간 표준 Markdown link를 방향성은 있지만 **타입 없는** 관계 edge로 취급한다.
- producer-defined frontmatter 필드는 허용되며 업데이트 시 보존하도록 지시된다.

이 유연성 때문에 OUT의 `id`, `works`, `uses_patterns`, `yields_clue_types`, `common_clues`, `typical_locations`, `parent_work`, `source_page` 같은 필드를 extension으로 싣는 것은 가능하다. 그러나 OpenWiki validator는 그 필드들의 타입, 참조 무결성, 단일 진실 원천을 검사하지 않는다.

내장 frontmatter validator의 핵심 강제는 parseable YAML과 `type`이다. middleware는 잘못된 OKF frontmatter를 에이전트에게 고치라고 경고하고, index와 Mermaid를 후처리한다. 임의 JSON Schema, OUT 전용 YAML Schema, 관계 검증 hook을 등록하는 공개 인터페이스는 확인되지 않았다.

- [README의 OKF v0.1 호환성](https://github.com/langchain-ai/openwiki/blob/0.2.3/README.md#open-knowledge-format-compatibility)
- [OKF prompt와 extension 보존 규칙](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/agent/prompt.ts)
- [frontmatter validator](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/okf/frontmatter.ts)
- [OKF middleware](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/agent/okf-middleware.ts)

추가 호환성 주의점이 있다. OpenWiki는 v0.1을 명시하지만 Google의 현재 공식 명세는 v0.2이며 `sources`, `generated`, `verified`, `status`, `stale_after`를 정의하고 `timestamp`와 본문의 `# Citations`를 대체했다. OpenWiki가 unknown extension을 보존하므로 이 필드들을 후보 포맷에 사용할 수는 있지만, 0.2.3 자체가 v0.2 semantics를 검증한다고 보면 안 된다.

- [Google OKF 공식 명세](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)

### 지침, 템플릿과 자동화

사용자 지침은 실용적이다.

- code mode: 저장소의 `openwiki/INSTRUCTIONS.md`
- personal mode: `~/.openwiki/INSTRUCTIONS.md`
- source instance별 `ingestionGoal`

반면 built-in onboarding template은 `code`와 `personal` 두 가지뿐이다. “추리 사건 패턴 추출”용 구조를 정의하는 schema/template 시스템은 아니며, 정확한 출력 규약은 `INSTRUCTIONS.md`와 외부 검증기로 보완해야 한다.

- [onboarding 설정과 지침 저장](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/onboarding.ts)
- [두 onboarding template과 source 설정](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/credentials.tsx)

code mode의 `--init`은 `openwiki/`, GitHub Actions workflow, 저장소 루트의 `AGENTS.md`와 `CLAUDE.md`를 관리한다. 후자의 기존 내용 전체를 덮지는 않고 `<!-- OPENWIKI:START -->` 블록만 추가·갱신하지만, 분명한 저장소 mutation이다. 에이전트 자체의 init/update 쓰기는 docs-only backend가 `openwiki/` 아래로 제한한다.

따라서 파일럿은 실제 OUT/caseCollection 루트가 아니라 폐기 가능한 별도 Git 저장소에서 실행해야 한다. personal mode는 저장소의 `AGENTS.md`/`CLAUDE.md`를 관리하지 않지만 전역 `~/.openwiki/wiki`를 사용하므로, 기존 개인 위키와의 충돌 여부를 먼저 확인해야 한다.

- [code mode의 AGENTS/CLAUDE/workflow 변경](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/code-mode.ts)
- [docs-only write guard](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/agent/docs-only-backend.ts)

code mode 업데이트는 `openwiki/.last-update.json`의 `gitHead`/`updatedAt`과 생성 위키 content hash를 사용한다. 같은 content hash이면 metadata도 바꾸지 않아 no-op PR을 피하고, 이전 Git HEAD 이후 변경을 근거로 surgical update를 지시한다. 이는 Git 저장소 기반 파일럿에 유리하다.

- [업데이트 snapshot과 no-op 처리](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/agent/utils.ts)
- [공식 update/CI 운용 문서](https://github.com/langchain-ai/openwiki/blob/0.2.3/openwiki/operations/credentials-and-updates.md)

### 로컬 LLM, 보안, telemetry, Windows

LM Studio는 공식 지원 예에 포함된다. `openai-compatible` provider에 `http://localhost:1234/v1`, 로드된 model ID, 임의의 non-empty API key 값을 설정한다. 다만 OpenWiki는 filesystem/shell/connector tool을 쓰는 에이전트이므로 모델의 tool-calling 정확도와 긴 원문 처리 능력은 별도 파일럿 gate다. 호환 endpoint라는 사실만으로 결과 품질이 보장되지는 않는다는 판단이다.

- [LM Studio 설정 예](https://github.com/langchain-ai/openwiki/blob/0.2.3/README.md#openai-compatible-endpoints)
- [에이전트 tool 사용 지침](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/agent/prompt.ts)

보안상 긍정적인 부분:

- credentialed fetch와 LLM synthesis가 분리된다.
- connector raw를 untrusted evidence로 취급하고 내부 지시를 따르지 말라고 prompt에 명시한다.
- MCP connector는 allowlist/read-only policy를 둔다.
- secret은 config/raw가 아니라 `~/.openwiki/.env`에 보관한다.
- OpenWiki home은 POSIX 권한을 제한하고 Windows에서는 `icacls`로 사용자/SYSTEM만 접근하도록 best-effort ACL을 적용한다.

주의할 부분:

- Windows ACL 강화 실패는 실행을 막지 않는다.
- OAuth/connector token과 모델 credential이 한 로컬 env 파일에 모인다.
- LangSmith tracing을 설정하면 실행 추적이 외부 서비스로 나갈 수 있으므로 비공개 원문 파일럿에서는 설정하지 않아야 한다.
- 익명 telemetry는 기본 활성이다. 공식 설명상 파일 내용, 경로, URL, prompt, model output, credential은 보내지 않고 command/outcome/provider/connector 이름 등을 보낸다. `OPENWIKI_TELEMETRY_DISABLED=1` 또는 `DO_NOT_TRACK=1`로 끌 수 있다.

- [connector/MCP 안전 경계](https://github.com/langchain-ai/openwiki/blob/0.2.3/openwiki/integrations/connectors.md)
- [Windows ACL 구현](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/windows-acl.ts)
- [OpenWiki home 권한 설정](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/openwiki-home.ts)
- [telemetry 설명과 opt-out](https://github.com/langchain-ai/openwiki/blob/0.2.3/README.md#telemetry)

native local schedule 설치는 현재 macOS LaunchAgent 전용이다. Windows에서는 schedule 정보만 저장되고 native 설치는 되지 않으므로 Task Scheduler, 기존 자동화, 또는 CI가 필요하다.

- [스케줄 구현](https://github.com/langchain-ai/openwiki/blob/0.2.3/src/schedules.ts)

## OUT과의 적합성

2026-07-27 로컬 OUT 자료에서 확인한 현재 경계는 다음과 같다.

- `F:\Project\out\docs\superpowers\plans\2026-06-09-bq-wiki-vector-search-phase-b.md:21-26,512-518`: Drive의 `pd_novels/*.txt`를 rclone으로 로컬 `raw_texts/` 등에 복사하고 Python ingest는 로컬 파일만 읽는다.
- `F:\Project\out\pd_wiki\semantic\novels.py:1`: `catalog.json`과 로컬 TXT를 읽는 network-zero 수집 경로다.
- `F:\Project\out\docs\wiki\SCHEMA.md:29-50`: 관계는 한쪽 frontmatter 필드가 단일 진실 원천이고 역방향은 loader가 계산한다.
- `F:\Project\out\docs\wiki\SCHEMA.md:54-153`: source, case pattern, clue, story별 frontmatter와 ID 참조 규약이 이미 존재한다.
- `F:\Project\out\docs\wiki\SCHEMA.md:190-200`: `catalog.json`의 `wiki_source_id`가 canonical slug이며 Drive에만 있는 과거 변형은 비정본이다.

이 경계는 OpenWiki보다 강하다. 따라서 OpenWiki를 Drive에 직접 붙이는 설계는 기능상 불가능할 뿐 아니라, 가능해져도 정본 경계를 약화시킨다.

OpenWiki와 OUT의 핵심 차이는 다음과 같다.

| 관심사 | OpenWiki 0.2.3 | OUT/pd_wiki | 필요한 조치 |
|---|---|---|---|
| 노드 identity | 파일 경로가 concept identity, `type`만 필수 | 명시적 `id`, `slug`, `pg_*`, `wiki_source_id` | 변환기가 catalog/기존 ID를 할당하고 신규 ID 충돌을 검사 |
| 관계 | Markdown link 기반 untyped edge | 지정 frontmatter 필드 기반 typed edge, 역방향 계산 | link를 정본 관계로 사용하지 말고 OUT 필드로 변환 |
| 출처 | raw와 evidence note, page별 attribution은 prompt 의존 | catalog/work/source 관계와 로컬 원문 | 모든 후보에 snapshot ID/hash와 source location을 필수화 |
| 검증 | OKF 최소 frontmatter + Mermaid | 도메인 loader/스키마/참조 규칙 | OpenWiki 출력 후 외부 strict validator 실행 |
| 갱신 | Git HEAD/content hash, connector별 state | rclone + catalog + 로컬 파일 | upstream snapshot manifest가 변경 판단의 기준 |
| 승인 | 합성 결과가 곧 OpenWiki page | 정본 데이터 | `candidate` namespace와 사람 승격 gate 유지 |

## 최소 파일럿

목표는 “OpenWiki를 설치할 수 있는가”가 아니라 다음 한 질문에 답하는 것이다.

> 고정된 소설 원문을 LM Studio로 읽혀, OUT 규약으로 검증 가능한 출처 추적형 사건 패턴 후보를 기존 방식보다 유용하게 만들 수 있는가?

### 1. 격리

- 폐기 가능한 별도 Git 저장소를 만든다. OUT/caseCollection 루트에서 실행하지 않는다.
- `openwiki@0.2.3`을 pin한다.
- Node.js 22 이상과 npm/pnpm을 사용한다.
- `OPENWIKI_TELEMETRY_DISABLED=1`, LangSmith 미설정, LM Studio `openai-compatible` endpoint를 사용한다.
- code mode를 택해 모든 mutation을 이 격리 저장소 안에 가둔다. 생성되는 `AGENTS.md`, `CLAUDE.md`, workflow도 파일럿 산출물로만 취급한다.

### 2. 입력

대표 소설 2~3권만 사용한다.

- 서로 다른 사건 구조를 가진 원문
- 그중 한 권은 수정 전/후 두 snapshot
- `catalog.json`에서 필요한 최소 metadata
- 각 snapshot에 `snapshot_id`, catalog work ID, 파일명, byte size, SHA-256, upstream modified time(확보 가능한 경우), fetched time을 담은 manifest

OpenWiki가 snapshot을 만들게 하지 않는다. rclone 이후의 별도 deterministic 단계가 manifest/hash를 고정한다.

### 3. 지침과 출력 경계

`openwiki/INSTRUCTIONS.md`에는 다음을 요구한다.

- canonical OUT 페이지를 쓰지 말고 `candidate` concept만 생성
- 후보마다 `source_snapshot_ids`, source file, 장/절 또는 line range, 짧은 근거 요약 기록
- 이미 존재하는 `case_pattern`/`clue_type` ID를 우선 매핑
- 확신이 낮거나 서로 충돌하는 해석을 숨기지 않음
- 원문에 없는 사건·동기·인과를 만들지 않음
- 하나의 pattern 후보와 근거를 같은 page에 유지

OpenWiki 출력은 그대로 OUT에 복사하지 않는다. 별도 변환기가 candidate page를 임시 OUT frontmatter로 바꾸고, 기존 loader/strict validator를 production 경로 밖에서 실행한다.

### 4. 세 번의 실행

1. **초기 생성:** 첫 snapshot 묶음에서 후보 위키 생성
2. **no-op 재실행:** 입력 변경 없이 update하여 위키 diff가 없는지 확인
3. **부분 변경:** 한 소설의 새 snapshot만 commit하고 update하여 관련 후보만 바뀌는지 확인

Tavily, Gmail, Notion, Drive 신규 connector, 전체 100권 말뭉치는 이 파일럿에서 제외한다.

### 5. 판정 기준

필수 gate:

- 후보의 100%가 존재하는 snapshot hash와 source location으로 역추적됨
- 원문을 바꾸지 않은 no-op run에서 생성 위키 diff가 없음
- 한 source 변경이 무관한 후보 page의 대량 rewrite를 일으키지 않음
- 변환된 후보가 OUT validator에서 누락 ID·잘못된 relation type을 자동 검출할 수 있음
- LM Studio 모델이 tool-call 실패나 빈 최종 응답 없이 완주함
- 사람이 후보별로 `accept`, `revise`, `reject`, `unsupported`를 판정할 수 있을 만큼 근거가 구체적임

관찰 지표:

- 소설별 runtime과 모델 token/호출 수
- 생성 후보 수, 중복률
- accept/revise/reject/unsupported 비율
- 기존 수작업/현재 wiki 대비 새롭고 유용한 후보 수
- snapshot 갱신 때 영향을 받은 page 수

traceability나 no-op gate가 실패하면 도입을 중단한다. 품질만 부족하면 더 큰 모델이나 기존 `pd_wiki` 검색으로 근거 범위를 먼저 좁힌 뒤 한 번만 재시험한다.

## 파일럿 뒤의 선택

성공해도 다음 결정은 “OpenWiki가 정본인가”가 아니다. 선택지는 두 가지다.

1. **OpenWiki를 후보 발견 UI/에이전트로 유지:** OUT 변환기와 검증기가 정본 경계를 담당한다.
2. **유용한 prompt와 평가법만 흡수:** 전체 OpenWiki 의존 없이 기존 `pd_wiki` chunk/search 위에 더 작은 추출 작업을 구현한다.

전체 소설에서 빠짐없는 추출이 중요하다면 두 번째가 더 자연스러울 가능성이 높다. OpenWiki prompt 자체가 모든 파일을 읽지 말고 targeted discovery를 하라고 지시하므로, 대규모 말뭉치 completeness는 제품 목표가 아니다.

## 아직 실험으로만 답할 수 있는 항목

- 현재 LM Studio 모델이 OpenWiki의 tool-calling과 긴 한국어 지침을 얼마나 안정적으로 수행하는가
- 한 권 분량 TXT에서 pattern 후보 recall이 충분한가
- OUT extension frontmatter가 실제 반복 update에서 의미적으로도 보존되는가
- source location을 장/절/line 수준으로 일관되게 만들 수 있는가
- 기존 `pd_wiki` semantic search로 관련 구간을 선별해 줄 때 품질·비용이 얼마나 개선되는가

이 항목들은 공식 자료로 확정할 수 없으며, 위 최소 파일럿의 측정 대상이다.
