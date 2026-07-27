# 스타일 키

`style-key.png` — 모든 카드 아트가 `--image-references`로 무는 **단 하나의 스타일 기준**. [ticket 13](../../.scratch/case-collection/issues/13-card-art-pipeline.md) 확정.

## 왜 이 바이너리만 커밋하는가

CLAUDE.md의 원칙은 "생성 바이너리는 미커밋, 레시피가 정본"이다. **스타일 키는 그 예외다** — 산출물이 아니라 **입력**이고, 생성이 확률적이므로 레시피만으로는 같은 그림이 다시 나오지 않는다. 키가 없으면 49장이 각자 다른 스타일로 구워진다.

게임 카드 PNG는 Google Drive에서 관리하고 `scripts/sync-cardart.cmd pull|push <Drive 폴더>`로 작업 사본과 복사한다. 어느 방향도 대상에만 있는 파일을 삭제하지 않는다. 비교 벤치마크를 포함한 `prototype/core-loop/public/cardart/` 전체는 Git에 커밋하지 않는다.

## Google Drive 정본과 동기화

현재 정본 경로는 `G:\내 드라이브\caseCollection\cardart\clues`다. `G:`는 공식 Google Drive for desktop의 스트리밍 드라이브이며, 드라이브 문자는 PC마다 다를 수 있으므로 스크립트에 하드코딩하지 않는다.

```bat
:: 로컬에서 확정한 최종본을 Drive로 보낸다.
scripts\sync-cardart.cmd push "G:\내 드라이브\caseCollection\cardart\clues"

:: 새 작업 사본이나 다른 PC에서 최종본을 받는다.
scripts\sync-cardart.cmd pull "G:\내 드라이브\caseCollection\cardart\clues"
```

2026-07-27 기준 최종 clue 20장(19,711,637바이트)을 업로드하고 로컬과 Drive의 SHA-256을 전수 대조했다. 불일치는 0개였다. 모델·템플릿 비교용 48장은 정본에 올리지 않는다.

Drive 커넥터 OAuth는 Google 보안 검증 오류로 사용할 수 없었으므로 재시도나 보안 우회를 하지 않는다. 프로젝트 전체를 Drive의 “컴퓨터 폴더”로 동기화하면 `.git`, 의존성, 빌드 산출물까지 감시하게 되므로 사용하지 않는다. Windows 정션·심볼릭 링크도 Drive의 안정적인 동기화 계약으로 간주하지 않는다. 카드 최종본만 위 폴더에 두고 명시적인 `push`/`pull`을 실행하는 방식이 정본 경계와 삭제 방향을 가장 분명하게 유지한다.

실제로 2026-07-26 세션에서 이 파일이 부재한 상태였고, `scripts/cardart-generate.sh`가 **경고 없이 레퍼런스 없이 생성하도록** 되어 있었다. 13이 실측한 보장(키를 물리면 드리프트 0/12)이 조용히 사라지는 구조였다. 그래서 (1) 키를 커밋하고 (2) 스크립트가 키 부재 시 **중단**하도록 고쳤다.

## 정본 정보

- 생성일: 2026-07-26
- 모델: `nano_banana_pro`, 3:4, 1k (2크레딧)
- 대상: 실·섬유 — [12 §1](../../.scratch/case-collection/issues/12-context-tag-semantics.md)이 "아트가 한 얼굴에 커밋하면 다면성 발견이 죽는다"고 지목한 대표 다면 카드. 키의 대상이 재질감을 정하므로 **의도적으로 그 사례를 골랐다.**
- 스타일 문자열은 `scripts/cardart-generate.sh`의 `STYLE`/`GROUND`/`LIGHT`/`RULE` 변수가 정본이며, 키도 **그 네 개를 그대로 이어붙인 프롬프트**로 생성했다(키만 다른 프롬프트를 쓰면 키와 카드가 어긋난다).

스타일 키 자체를 생성한 모델은 위 기록대로 `nano_banana_pro`다. 카드 본 생성 모델은 2026-07-27의 48장 비교 실측 후
`gpt_image_2` low, 3:4, 1k(0.5크레딧)로 변경됐다. 키의 출처 모델과 키를 참조하는 생성 모델은 같을 필요가 없다.
GPT Image 2 low가 문서·단일 사물·복수 사물·가로형 사물에서 대상 가독성과 스타일 충실도를 가장 안정적으로 함께 지켰다.
`nano_banana_2_lite`는 일부 조합에서 키의 실·섬유 피사체를 새 대상 대신 복제해 기본 모델에서 제외했다.

## 다시 만들어야 할 때

키를 교체하면 **이미 구운 카드 전량이 그 키와 어긋난다.** 교체는 카드 재생성을 동반하는 결정이므로 티켓 없이 하지 말 것.

재생성 절차는 `scripts/cardart-generate.sh`의 네 변수를 읽어 같은 프롬프트를 조립하고, 대상만 위 "실·섬유"로 두는 것이다. 결과를 눈으로 판정한 뒤(생성 규칙 3가지 대조: 용도 아닌 사물 / 평평한 근-흑색 바탕 / 조명 중립) 이 파일을 덮어쓴다.
