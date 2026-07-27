# MCP 기반 맞춤형 case 저작

Status: open
Labels: wayfinder:grilling
Assignee: Codex (GPT-5.6, 2026-07-27)
Reviewed-by: Claude (2026-07-27)
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

## Claude 검토 (2026-07-27)

Claude 한도로 Codex가 예외 진행한 결정이므로 [codex-collab.md](../../../docs/agents/codex-collab.md) "예외" 절이 요구하는 4가지를 대조했다.

**ⓐ 기존 closed 결정과의 정합 — 통과, 단 스코프는 별개 판단이 필요.** [05](05-web-stack.md)의 "정적 클라이언트 온리·런타임 LLM 배제, 콘텐츠는 빌드타임 생성" 원칙과 충돌하지 않는다 — Resolution ⑤가 "게임 전 오프라인 case 생성만 지원, 플레이 중 실시간 생성·능동형 AI·런타임 규칙 변경은 제외"로 명시해 런타임 LLM 0 원칙을 그대로 지킨다. [18](18-case-generator-shape.md)의 truth/presentation/obstacles 분리와 LLM 경계(선택·표현·평가만, payload 미변조)도 그대로 상속한다. 어긋나는 곳은 없다.

다만 이 티켓은 **지도 어디에도 fog로 예고된 적 없는 새 스코프**다 — `MAP.md`의 "Destination"·"Not yet specified"엔 플레이어가 자기 LLM으로 case를 저작하는 기능이 없다. [08](08-mvp-scope.md) §⑧은 생성기 자체(18)조차 "MVP 밖"으로 명시했는데, 27은 그 생성기 위에 얹는 한 단계 더 먼 기능이다. 설계는 정합적이지만 **정합성 검토로는 "이게 지금 원하는 다음 걸음인가"를 판정할 수 없다** — 이건 제가 대신 못 내리는 제품 스코프 결정이다.

**ⓑ CONTEXT.md 용어 — 해당 없음(통과).** 이 티켓은 게임 도메인 어휘가 아니라 저작 도구 아키텍처를 다룬다. CONTEXT.md는 실제로 건드리지 않았고, host-driven MCP·candidate·budget gate는 플레이어가 보는 말이 아니라 도구 내부 개념이라 그게 맞다.

**ⓒ 인용 자산 실재 — 통과.** `docs/superpowers/specs/2026-07-27-mcp-personalized-case-authoring-design.md`(267줄) 실재 확인.

**ⓓ 수용 조건 재실행 — 해당 없음(코드 산출물 없음).** `Status: open` 유지가 맞다 — §Question의 확정 항목 5개 중 실제로 답한 건 ①MCP 경계(host-driven) 하나뿐이고, 저작 단계·토큰 안전성·설치 권한·호환성 검증 4개는 Resolution에 산발적으로만 스친다(④가 토큰 안전성을 부분적으로만 다룸). "방향 승인"이지 확정이 아니라는 스스로의 표현이 정확하다.

### 검토 결과: 설계 정합, 진행 여부는 스코프 결정 대기

반증 지점은 없다. 진행하려면 08의 MVP 경계를 넘는 스코프 확장을 사용자가 먼저 승인해야 한다 — 그 전엔 §Question의 나머지 4개 확정 항목에 착수하지 않는다.
