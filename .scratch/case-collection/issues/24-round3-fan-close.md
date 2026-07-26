# Codex 위임 스펙 — 결함 ③ 부챌침이 반응 띠·손패를 덮는다

> 이 파일은 **사용자가 Codex에 직접 전달**하기 위한 위임 스펙이다(Lane B / `Mode: direct`).
> 지배 티켓은 [24 플레이 화면 구현](24-play-screen-build.md)이고, 위계 규약은 [20](20-play-screen-hierarchy.md)이 정본이다.
> Claude가 스펙과 UX 결정을 확정했고, 디스패치와 결과 수용은 사용자가 한다.

---

## 증상 (2026-07-26 플레이 판정에서 발견)

손패 슈트 탭을 눌러 부챌침(`.stack-fan`)이 열린 뒤, **카드를 고르고 얼굴을 선택해 배치를 끝내도 부챌침이 닫히지 않는다.** `.stack-fan`은 `position: fixed; bottom: 174px; min-height: 230px`이므로 열려 있는 동안 **반응 띠(`.reaction-band`)와 손패 레일(`.hand-rail`)을 덮는다.**

[20](20-play-screen-hierarchy.md)이 관찰 6번("반응 레이어에 자리가 없다")을 해소하려고 반응 띠에 **높이를 예약한 고정 좌석**을 준 것인데, 부챌침이 그 위에 떠 있으면 그 규약이 무력화된다.

## 결정 (Claude, 변경 불가 — 이 규칙대로 구현할 것)

**부챌침은 카드를 고른 즉시 닫는다.**

근거는 [20](20-play-screen-hierarchy.md)의 위계다 — **손패는 "대기 층"**이다. 부챌침의 목적은 *고르기* 하나이고, 고른 뒤의 무대는 두루마리(주인공)와 반응 띠다. 배치가 끝날 때까지 열어 두면 대기 층이 주인공 층을 가린다.

즉 닫히는 시점은 "배치 완료"가 아니라 **"선택 완료"**다. 얼굴 피커가 열리는 동안에도 부챌침이 떠 있으면 안 된다.

## 범위 (이게 한 파일로 끝난다는 점이 중요)

`openSuit`은 `HandRail.svelte`의 **로컬 `$state`**이고, 카드 선택은 같은 컴포넌트의 `onpick` 경로를 지난다. 따라서 **컴포넌트 간 조정이 필요 없다** — `onpick`을 호출하는 자리에서 `openSuit`을 닫으면 된다.

```
Write-scope: prototype/core-loop/src/lib/ui/HandRail.svelte
             (레이아웃 보정이 꼭 필요할 때만 prototype/core-loop/src/app.css)
```

**수정 금지**: `prototype/core-loop/src/lib/*.ts` 전량(순수 모듈), `CaseScreen.svelte`, `CLAUDE.md`, `docs/agents/`, `.scratch/`, `MAP.md`. 커밋·스테이징·push 금지.

**게임 밸런스·판정 불변** — heat/trust 임계, `Tag`/`Kind`/`SlotFrame` 의미, 판정 규칙 결과. 이 작업은 표현 계층이다.

## 수용 조건

- [ ] 슈트 탭 → 부챌침 열기 → 카드 클릭 시 **부챌침이 닫힌다**
- [ ] 얼굴 피커가 열려 있는 동안 부챌침이 화면에 없다
- [ ] 배치 완료 후에도 부챌침이 없다
- [ ] 반응 띠와 손패 레일이 **어느 시점에도 가려지지 않는다**
- [ ] 같은 슈트 탭을 다시 누르면 정상적으로 다시 열린다(토글 유지)
- [ ] 슈트 탭을 눌러 여는 동작 자체는 그대로
- [ ] `npm run smoke` / `npm run smoke:datapack` 출력이 변경 전과 동일, FAIL 0
- [ ] `npx tsc --noEmit` 클린 / `npx vite build` 클린

## 반환 형식

`docs/agents/codex-collab.md`의 "Codex result contract"를 따를 것:

```
Outcome: completed | decision_required | source_conflict | blocked
Changed: <파일 목록>
Verification: <실행한 커맨드와 결과>
Deviations: <none 또는 정확한 이탈>
Housekeeping:
  docs: updated | candidate | skip
  wiki: updated | wiki_candidate | skip
  memory: updated | candidate | skip
  git: clean | changes-left | commit-approval-needed
```

렌더 검증(브라우저)이 불가하면 `completed`가 아니라 **`blocked`**로 반환하고 diff를 보존할 것 — 2차 라운드에서 실제로 그랬고, 그게 올바른 처리였다. 렌더 판정은 위임자 몫이다.

## Lane B 필수 하우스키핑

사용자 직접 위임이므로 Codex는 시작 전에 확인할 것: 현재 브랜치·dirty 워킹트리, 클레임된 wayfinder 티켓, 이 요청이 열린 설계 결정을 침범하는지, write scope가 다른 소유자의 변경과 겹치는지.

**주의 — 지금 워킹트리에 다른 세션의 미커밋 변경이 있다**: `CLAUDE.md`, `prototype/core-loop/package.json`, `docs/CODE_QUALITY_HANDOFF.md`, `.vscode/`. **이들은 건드리지 말고 보고만 할 것.**
