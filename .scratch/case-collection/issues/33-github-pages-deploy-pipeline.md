# GitHub Pages 배포 파이프라인 구축

Status: open
Labels: wayfinder:grilling
Assignee: Codex (GPT-5.6, 2026-07-30)
Reviewed-by:
Blocked-by:

## Question

[05](05-web-stack.md)/[08](08-mvp-scope.md)에서 GitHub Pages를 정본 배포 채널로 확정했지만 이를 실제로 자동화하는 파이프라인이 없다 — `.github/workflows/`가 비어 있고 이를 다루는 티켓 자체가 지금까지 없었다(CLAUDE.md가 2026-07-28에 이미 "채널은 결정됐고 파이프라인은 아직 없다"고 지적했으나 대응 티켓은 만들어지지 않았다). `npm run build`(vite)까지가 현재 존재하는 전부다.

확정할 것:

- **트리거**: main push마다 자동 배포 vs 수동 release 태그 vs `workflow_dispatch`. 콘텐츠가 24장·case 4개로 이미 마감([08](08-mvp-scope.md) §④)됐고 남은 변경은 화면·버그 수정 위주이므로, 과도한 자동 배포가 미완성 중간 상태를 그대로 노출할 위험도 함께 고려한다.
- **빌드 위치**: 실제 게임 소스는 `prototype/core-loop/`다 — 워크플로가 이 서브디렉터리에서 `npm ci && npm run build`를 실행하고 그 `dist/`만 게시해야 한다. 레포 루트를 그대로 게시하지 않는다.
- **base path**: GitHub Pages의 `/<repo>/` 서브경로 배포와 커스텀 도메인 배포는 Vite `base` 설정이 다르다. 현재 `vite.config`가 어느 쪽을 가정하고 있는지 먼저 확인한다.
- **Pages 소스**: GitHub Actions 배포(`actions/deploy-pages`) vs `gh-pages` 브랜치 push 방식 중 선택.
- **배포 전 게이트**: `npm run smoke*` 전체 스위트·`tsc --noEmit`·`npm run build`가 실패하면 배포를 막아야 한다 — 워크플로 어느 단계에서 무엇을 실행할지 명시.
- **Higgsfield 병행과의 경계**: 05/08은 GitHub Pages+Higgsfield 병행을 결정했지만 `higgsfield game deploy/publish`는 CLI 수동 실행이다 — 이 워크플로는 GitHub Pages만 다루고 Higgsfield 갱신은 별도 수동 절차로 남긴다는 것을 명시한다.

## Comments

- 2026-07-29 fog 발견: [MAP.md](../MAP.md)의 "Destination"은 두 스펙 모두 "/to-spec으로 넘길 준비" 상태라 적었지만, 실제 배포 자동화는 어느 스펙 초안에도 항목으로 잡힌 적이 없었다. 진행 상황 정리 세션에서 `.github/workflows/` 부재와 대응 티켓 부재를 직접 확인하고 새로 발급.
