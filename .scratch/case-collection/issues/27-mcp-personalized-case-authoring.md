# MCP 기반 맞춤형 case 저작

Status: open
Labels: wayfinder:grilling
Assignee: Codex (GPT-5.6, 2026-07-27)
Reviewed-by: 
Blocked-by: 18

## Question

플레이어가 자신의 LLM 환경을 사용해 취향에 맞는 case를 만들 수 있도록, 게임측 case 생성기와 검증기를 MCP로 노출한다.

목표 경험은 다음과 같다.

- 로컬 개발에서는 LM Studio 등 로컬 LLM으로 프로토콜 적합성·반복 테스트를 수행한다.
- 실제 고품질 저작에서는 사용자가 Claude 또는 Codex에 MCP를 연결하고 자연어로 사건을 주문한다.
- LLM은 자유형 게임 코드가 아니라 `truth / presentation / obstacles` 규약의 case 초안을 작성한다.
- 엔진은 정합성·도달성·조사 누출·소프트락을 결정론적으로 검증하고, 검증된 data pack만 설치한다.
- 게임 본체는 정적 클라이언트와 런타임 LLM 0 원칙을 유지한다. MCP는 별도 오프라인 저작 도구다.

확정할 것:

- **MCP 경계**: MCP 서버가 공급자 API를 직접 호출하는가, 아니면 Claude·Codex·로컬 에이전트가 MCP host가 되어 초안을 작성하는가.
- **저작 단계**: 취향 요청 → 저비용 구조 초안 → 기계 검증 → presentation 작성 → 재검증 → 설치를 어떤 도구 계약으로 나눌지.
- **토큰 안전성**: 조회 응답 상한, dry-run, 캐시, 단계별 승인, 예상량과 실측량 기록을 어떻게 제공할지.
- **설치 권한**: 읽기·검증 도구와 파일을 변경하는 설치 도구를 분리하고, 명시적 승인 없이 기존 pack을 덮어쓰지 않게 할 방법.
- **호환성 검증**: 로컬 LLM 테스트가 Claude·Codex 실사용 경로의 프로토콜·스키마·오류 복구를 충분히 대표하는지 판정할 contract test.

## Resolution

2026-07-27 방향 승인:

1. **Host-driven compiler MCP**를 채택한다. Claude·Codex·로컬 에이전트가 MCP host이며, MCP 서버 자체는 특정 LLM 공급자 API를 호출하거나 API 키를 보관하지 않는다.
2. MCP는 case 저작용 컴파일러 경계다. LLM이 구조화 초안을 제출하면 엔진이 검증·정규화·미리보기·설치를 담당한다.
3. 로컬 LLM은 저비용 대량 품질 기준이 아니라 tool-call, schema repair, validation loop, budget gate의 개발·회귀 테스트에 우선 사용한다.
4. Claude·Codex 사용량은 host가 소유한다. MCP가 외부 모델의 실제 토큰 상한을 강제할 수 있다고 주장하지 않으며, 대신 응답 크기 제한·작업 단계화·캐시·승인 gate와 측정 가능한 receipt를 제공한다.
5. 첫 버전은 게임 전 오프라인 case 생성만 지원한다. 플레이 중 실시간 증언 생성, 능동형 상대 AI, 런타임 규칙 변경은 제외한다.
6. 상세 설계: `docs/superpowers/specs/2026-07-27-mcp-personalized-case-authoring-design.md`.
