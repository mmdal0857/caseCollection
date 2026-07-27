# OpenWiki 후보 발견 최소 파일럿

Status: open
Labels: wayfinder:prototype
Assignee:
Blocked-by: 25

## Question

OpenWiki 0.2.3을 기존 `rclone → 버전 고정 로컬 원문 스냅샷` 뒤의 **비정본 후보 발견 레이어**로 사용할 가치가 있는지 실행으로 검증한다.

- 폐기 가능한 격리 Git 저장소에서 `openwiki@0.2.3`과 LM Studio를 사용한다.
- 서로 다른 사건 구조의 대표 소설 2~3권, 그중 한 권의 수정 전·후 스냅샷을 입력한다.
- `초기 생성 → 입력 불변 no-op → 단일 스냅샷 변경` 세 번을 실행한다.
- 모든 후보의 snapshot hash/source location 역추적, no-op diff 0, 변경 영향의 국소성, OUT 외부 validator의 오류 검출, LM Studio tool-call 완주를 필수 gate로 판정한다.
- 산출물은 `candidate`로만 취급하며 OUT 위키·generic pack에 자동 승격하지 않는다.

실패하면 OpenWiki를 제거하고, 성공하면 “OpenWiki 후보 발견 UI를 유지”와 “유용한 prompt·평가법만 기존 `pd_wiki` 추출 작업에 흡수” 중 어느 쪽이 나은지 결정한다.
