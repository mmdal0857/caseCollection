# OpenWiki 후보 발견 최소 파일럿

Status: closed
Labels: wayfinder:prototype
Assignee: Codex (GPT-5.6, 2026-07-27)
Reviewed-by: Claude (2026-07-27)
Blocked-by: 25

## Question

OpenWiki 0.2.3을 기존 `rclone → 버전 고정 로컬 원문 스냅샷` 뒤의 **비정본 후보 발견 레이어**로 사용할 가치가 있는지 실행으로 검증한다.

- 폐기 가능한 격리 Git 저장소에서 `openwiki@0.2.3`과 LM Studio를 사용한다.
- 서로 다른 사건 구조의 대표 소설 2~3권, 그중 한 권의 수정 전·후 스냅샷을 입력한다.
- `초기 생성 → 입력 불변 no-op → 단일 스냅샷 변경` 세 번을 실행한다.
- 모든 후보의 snapshot hash/source location 역추적, no-op diff 0, 변경 영향의 국소성, OUT 외부 validator의 오류 검출, LM Studio tool-call 완주를 필수 gate로 판정한다.
- 산출물은 `candidate`로만 취급하며 OUT 위키·generic pack에 자동 승격하지 않는다.

실패하면 OpenWiki를 제거하고, 성공하면 “OpenWiki 후보 발견 UI를 유지”와 “유용한 prompt·평가법만 기존 `pd_wiki` 추출 작업에 흡수” 중 어느 쪽이 나은지 결정한다.

## Resolution

**OpenWiki 런타임 도입을 기각하고, provenance prompt와 strict validator만 기존 `pd_wiki` 검색·추출 경로에 흡수한다.**

격리 브랜치 `prototype/openwiki-candidate-pilot`에서 OpenWiki 0.2.3, Node 24.14.0, LM Studio `qwen/qwen3.6-27b`로 실행했다. 입력은 서로 다른 사건 구조의 PG 204·244·6133이며, 원문 전체와 source별 60,000자 발췌를 각각 불변 복사 snapshot으로 만들었다. 모든 작업은 OS temp의 신규 Git 저장소에서 수행해 OUT·Drive 정본을 수정하지 않았다.

실측:

- 원문 3권 전체 초기 생성은 약 20분 동안 완주하지 못했고 후보가 0건이었다.
- 60,000자×3권 발췌 초기 생성도 600초 상한에서 후보 0건으로 종료됐다.
- 초기 생성 실패 뒤 no-op·단일 snapshot 변경은 fail-fast로 생략했다. 사전 gate는 초기 후보와 provenance가 있어야만 의미가 있으므로, 더 작은 입력으로 성공 사례를 만들기 위해 판정 기준을 낮추지 않았다.
- 같은 모델에 보낸 최소 function call은 41,863ms, HTTP 200, `finish_reason=tool_calls`로 통과했다. 따라서 LM Studio endpoint나 기본 tool-call 지원 불능이 아니라 OpenWiki 에이전트의 prompt/context 운용 비용이 실패 원인이다.
- 외부 strict validator는 누락 SHA(`source.hash_mismatch`)와 존재하지 않는 OUT pattern 관계(`relation.pattern_unknown`)를 모두 거부했다.

필수 gate 중 traceability와 OpenWiki+LM Studio 완주가 실패했으므로 파일럿 사전 규칙대로 도입을 중단한다. no-op·국소성은 초기 생성 실패 때문에 검증되지 않았으며, 실패를 PASS로 해석하지 않는다.

재사용할 것은 `wiki candidate` 전용 frontmatter, `source_snapshot_ids`, snapshot SHA-256, source line range, 기존 pattern ID allowlist, 외부 validator다. 버릴 것은 OpenWiki 런타임·update 메커니즘 의존·OUT 자동 승격이다.

프로토타입과 결과: 브랜치 `prototype/openwiki-candidate-pilot`, 커밋 `dd51e50`, 파일 `prototype/openwiki-candidate-pilot/OPENWIKI_PILOT_RESULTS.md`. 실행기는 full/excerpt 모드, 상한, fail-fast, 직접 LM tool smoke를 제공한다.

## Claude 검토 (2026-07-27, housekeeping 중 발견·소급 처리)

이 티켓은 `Reviewed-by:` 헤더 없이 closed였다 — [18](18-case-generator-shape.md)·[27](27-mcp-personalized-case-authoring.md)과 같은 패턴(Assignee: Codex, 결정 Resolution 작성)인데도 [codex-collab.md](../../../docs/agents/codex-collab.md) "예외" 절의 검토 대기 조회(`grep -L "^Reviewed-by: Claude" $(grep -l "^Reviewed-by:" issues/*.md)`)에 애초에 걸리지 않는 사각지대였다 — 필드 자체가 없으면 조회가 그 파일을 보지 못한다. housekeeping 중 발견해 소급 검토한다.

**ⓐ 기존 closed 결정과의 정합 — 통과.** [25](25-openwiki-collection-fit-research.md)의 "격리 파일럿만 권고" 판단, [18](18-case-generator-shape.md)의 "OpenWiki는 선택적 파일럿, 코어 의존성 아님" 경계와 정확히 들어맞는다 — 오히려 이번 실패가 그 경계를 지키길 잘했음을 실증한다.

**ⓑ CONTEXT.md 용어 — 통과.** `wiki candidate`·`source_snapshot_ids` 등은 18 검토에서 이미 확인한 "원문 스냅샷"·"위키 후보" 용어의 재사용이다. 신규 등재 불필요.

**ⓒ 인용 자산 실재 — 통과.** `prototype/openwiki-candidate-pilot`(`dd51e50`) 워크트리 실재 확인.

**ⓓ 수용 조건 재실행 — 해당 없음(격리 실험, main 미영향).** Resolution이 실패를 실패로 정직하게 기록했고("실패를 PASS로 해석하지 않는다") main 코드에 손대지 않았으므로 재실행할 산출물이 없다.

### 검토 결과: 수용. 프로세스 갭 하나 별도 기록

결정 내용에는 반증 지점이 없다. **별도로**, 이번 사각지대(Assignee: Codex + Resolution 작성 패턴인데 `Reviewed-by:` 필드 자체가 누락)를 막으려면 검토 대기 조회를 필드 유무가 아니라 `Assignee: Codex` 패턴 기준으로 바꾸는 편이 안전하다 — `docs/agents/codex-collab.md`에 조회 커맨드 보강을 제안(하우스키핑 완료 보고에 별도 기재).
