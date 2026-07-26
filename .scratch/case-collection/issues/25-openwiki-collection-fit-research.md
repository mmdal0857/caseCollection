# OpenWiki 수집·위키 보강 적합성 리서치

Status: closed
Labels: wayfinder:research
Assignee: research-subagent (Codex, 2026-07-27)
Blocked-by:

## Question

`langchain-ai/openwiki`의 현재 기능과 제약을 일차 자료로 검증하고, caseCollection/OUT의 수집 파이프라인에 도입할지 판단한다.

- 로컬 저장소·웹·Google Drive 등 수집 커넥터의 실제 지원 범위와 확장성
- 원본·manifest·출처 근거 보존, 증분 갱신, 변경 추적 방식
- 생성 위키의 OKF/Markdown 구조와 OUT frontmatter·`pd_wiki` 관계 모델 사이의 변환 가능성
- 커스텀 지침·템플릿·스키마 강제·검증 훅·자동화 인터페이스
- 로컬 LLM/LM Studio 사용, 비용·보안·telemetry·Windows 운용 제약
- 기존 OUT 위키의 대체재, 상류 수집기, 후보 보강기 중 적절한 역할
- Google Drive에서 계속 갱신되는 소설을 원문 스냅샷으로 수집하는 흐름과의 결합 가능성

공식 문서·공식 저장소 소스·릴리스 등 일차 자료만 근거로 삼고, 도입/파일럿/보류 판단과 최소 실험 범위를 제안한다.

## Resolution

OpenWiki 0.2.3은 기존 `rclone → 버전 고정 로컬 원문 스냅샷` 뒤에서 **비정본 후보 발견 레이어**로만 제한 파일럿할 가치가 있다. OUT 위키 정본, Google Drive 직접 수집기, `patternContract` 생성기, 전체 소설 말뭉치의 체계적 추출 엔진으로는 도입하지 않는다.

확인된 핵심 근거:

- built-in 커넥터 7종에 Google Drive와 임의 파일 수집은 없다. `google`은 Gmail 전용이며, 새 커넥터는 런타임 플러그인이 아니라 OpenWiki TypeScript 소스 수정이 필요하다.
- raw/run/state 분리, 로컬 Git 탐색, 사용자 지침, OKF Markdown, LM Studio 호환, Git diff 기반 업데이트는 후보 발견 실험에 유용하다.
- OKF 검증은 사실상 parseable YAML과 `type` 중심이어서 OUT의 typed frontmatter 관계·참조 무결성·단일 진실 원천을 보장하지 않는다.
- page/claim 수준 출처 추적은 prompt 의존이며, 원문 스냅샷 원장을 대신할 수 없다.
- code mode는 마커 블록으로 `AGENTS.md`·`CLAUDE.md`와 workflow를 변경하고, Windows native schedule은 없어 실제 저장소가 아닌 격리 Git 저장소에서 실험해야 한다.

최소 파일럿은 대표 소설 2~3권과 수정 전후 스냅샷 하나를 대상으로 `초기 생성 → no-op 재실행 → 단일 스냅샷 변경` 세 번을 수행한다. 모든 후보의 snapshot hash/source location 역추적, no-op diff 0, 관련 페이지만 국소 갱신, OUT 외부 validator 검출, LM Studio tool-call 완주를 필수 gate로 둔다.

리서치 산출물: [OpenWiki의 caseCollection/OUT 수집 파이프라인 적합성](../../../docs/research/2026-07-27-openwiki-collection-fit.md)
