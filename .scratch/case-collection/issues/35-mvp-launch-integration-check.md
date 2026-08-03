# MVP 출시 통합 점검

Status: open
Labels: wayfinder:grilling
Assignee: Codex
Blocked-by: 33, 34, 36

## Question

[08](08-mvp-scope.md)이 정한 8개 MVP 항목과 이후 닫힌 14·16·21·22·23·24·28·29·30·31은 각자 독립적으로 검증됐지만, 이들을 하나의 배포 가능한 빌드로 묶어 처음부터 끝까지 실제로 플레이해 본 기록은 아직 없다. [33](33-github-pages-deploy-pipeline.md)(배포 파이프라인)과 [34](34-pattern-hint-card-art.md)(남은 카드 아트)이 닫히면 그다음이 이 점검이다.

확정할 것:

- **엔드투엔드 플레이스루**: Home → 새 수사 → Briefing → case 3~4개(보스 포함) → Interlude → Ending → Run Summary → 컬렉션까지 실제 브라우저에서 한 번 완주하고, [24](24-play-screen-build.md) 3파동·[31](31-pickup-affordance.md)에서 나온 회귀 패턴("겹침"의 원인은 매번 "컨테이너가 뷰포트를 넘음")이 재발하지 않는지 확인한다.
- **레이든 인물 아트**: `persona.ts`가 2026-07-29 기준으로도 여전히 "프로토용 페르소나 — 정식은 OUT 위키 반영 예정" 주석을 단 텍스트 전용 상태다. [08](08-mvp-scope.md) §⑤가 요구한 OUT 스프라이트(`raiden_neutral/wry/grim`) 연결이 실제로 됐는지 확인하고, 안 됐다면 텍스트 전용으로 출시할지 이번 점검에서 결론짓는다. (2026-07-29 티켓 발급 세션에서 이 항목을 별도 티켓으로 쪼개지 않고 여기서 처리하기로 결정했다 — `## Comments` 참조.)
- **오디오·데이터 팩 실배선**: 30(오디오)·16(외부 팩 로더)이 만든 계약이 실제 프로덕션 빌드에 배선돼 있는지 확인한다. `content.ts` 하드코딩 자체는 [08](08-mvp-scope.md) §⑧이 생성기·태그추출·외부팩을 MVP 밖으로 뒀으므로 결함이 아니다 — 그러나 오디오 매니페스트 재생과 팩 로더 UI(있다면)가 실제로 이 빌드에 연결돼 동작하는지는 별도 확인이 필요하다.
- **배포 전 마지막 게이트**: `npm run smoke*` 전체·`tsc --noEmit`·`npm run build`가 33의 CI를 통과한 실제 배포본에서 위 플레이스루를 재확인한다.

## Comments

- 2026-07-29: 진행 상황 정리 세션에서 "레이든 인물 아트 통합"을 후보 티켓으로 검토했으나 사용자가 별도 티켓으로 분리하지 않기로 했다 — 대신 이 통합 점검의 확정 항목에 포함해 처리하기로 함.
- 2026-08-02: NAN 2026 해커톤 사전 과제 제출(마감 2026-08-10) 준비 세션에서 사용자가 이 통합 점검을 데모 제출용으로 한시적으로 축소하기로 결정 — 33이 만든 배포 URL에서 Home → 새 수사 → case → Interlude/Ending → Run Summary → 컬렉션까지 한 번 완주하고 [24](24-play-screen-build.md)·[31](31-pickup-affordance.md) 회귀("겹침")가 재발하지 않는지만 확인한다. 레이든 인물 아트 통합 여부 확정과 오디오·데이터 팩 실배선 전수 확인, 34(패턴 카드 아트) 반영은 이 축소판의 범위 밖 — 해커톤 제출 이후 원래 확정 항목 전체로 재개해야 이 티켓을 닫을 수 있다. 이 축소 확인은 별도 기록으로 남기고 이 티켓 자체는 열린 채로 유지.
- 2026-08-02: 위 데모 축소 점검 완료. GitHub Actions 실행 [`30712010808`](https://github.com/mmdal0857/caseCollection/actions/runs/30712010808)이 성공한 실제 배포본 [`https://mmdal0857.github.io/caseCollection/`](https://mmdal0857.github.io/caseCollection/)에서 UI를 직접 조작해 case 4개와 Interlude 3개를 거쳐 GOOD Ending(`사건부 완결`)·Run Summary·Collection까지 완주했다. 요약은 case 4/4, 최종 제출 4회, 보유 카드 16/20, 알려진 측면 19/55였다. 1280×720과 1024×768 모두 가로 overflow가 없었고, play 화면의 반응 띠와 hand rail 사이 실제 간격은 각각 16px로 겹침 0이었다. 앱 소유 document·JS·CSS·audio·background·card image 요청은 모두 200이었고 처리되지 않은 앱 예외는 없었다(유일한 404는 앱 범위 밖 루트 `favicon.ico`). 데모 축소 범위만 완료한 것이므로 Status는 open으로 유지하며, 해커톤 이후 레이든 인물 아트 결정·오디오/데이터 팩 실배선 전수 확인·34 반영을 재개한다.
- 2026-08-03: 실제 화면에 남은 영문 카피가 발견되어 [36](36-korean-ui-copy-cleanup.md)을 발급하고 이 티켓의 blocker로 추가했다. 2026-08-02 데모 완주 기록은 화면 동작과 레이아웃을 증명하지만 한국어 우선 카피 완료를 증명하지 않으므로, 36이 닫히기 전에는 이 출시 통합 티켓도 닫지 않는다.
- 2026-08-04: 사용자가 OUT의 `raiden_neutral/wry/grim` 세 파일이 동일한 중립 이미지라는 실측을 확인하고, 중립 초상 1장만 반응 띠에 연결하며 존재하지 않는 표정 차이는 가장하지 않는 안을 확정했다. OUT 위키와 충돌하던 파이프 묘사도 제거한다.
- 2026-08-04 로컬 production 통합 점검 완료: 같은 `dist`에서 Home → 새 수사 → Briefing → case 4개 → Interlude 3개 → GOOD Ending(`사건부 완결`) → Run Summary → Collection을 새 런으로 연속 완주했다. 결과는 사건 4/4·최종 제출 4회·보유 카드 16/20·알려진 측면 21/55였다. 1280×720과 1024×768에서 document overflow 0, 플레이 보드 하단 오차 0px, 반응 띠–핸드 간격 16px, 오디오 UI–핸드 겹침 0을 실측했다. 레이든 WebP·배경·카드·오디오 요청은 모두 200/304였고, 404는 앱 자산이 아닌 브라우저 기본 `favicon.ico`뿐이었다. 생성기 replay의 실제 `game-data-pack@2`도 개발자 UI에서 추가 46·상쇄 0·문제 0으로 저장되고 새로고침 뒤 IDB에서 재수화됐다. 최신 커밋의 GitHub Pages 배포·공개 URL 재검증은 외부 변경 승인을 기다린다.
