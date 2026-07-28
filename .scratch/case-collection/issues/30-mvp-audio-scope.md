# MVP 오디오 스코프

Status: closed
Labels: wayfinder:grilling
Assignee: Codex
Reviewed-by: Claude (2026-07-29)
Blocked-by: 08

## Question

MVP 빌드에 오디오(BGM·효과음·보이스)를 포함하는가. 포함한다면 범위는 무엇이고, Dead Letters의 Amuse 파이프라인을 재사용하는가 새로 파이프라인을 만드는가. [MVP 스코프](08-mvp-scope.md) §⑤(아트 수준=전부)는 "카드+배경+인물+UI 장식"만 명시하고 오디오를 다루지 않았다 — 지도 fog가 "MVP 스코프 이후"로 미뤄둔 항목이며, 08이 닫히면서 그 게이트가 풀렸다.

## Comments

- 2026-07-27 **fog 졸업**: [MVP 스코프](08-mvp-scope.md) 종결(§④ 콘텐츠 볼륨 확정)로 지도 "Not yet specified"의 "사운드/BGM" 항목이 특정 가능해져 이 티켓으로 분리했다. Amuse 파이프라인의 실제 재사용 가능성(라이선스·에셋 형식·Dead Letters 세계관과의 독립성 제약과의 충돌 여부)은 아직 조사되지 않았다.

## Resolution

- 확정 범위:
  - 보이스 없음
  - instrumental loop 2개: `music_title`, `music_case`
  - 의미 SFX 7개: `card_pick`, `card_place`, `facet_lock`, `chain_release`, `review_pass`, `review_fail`, `interlude_action`
  - hover SFX 없음
- 재사용 경계:
  - Dead Letters 완성 음원·prompt·세계관 자산은 재사용하지 않았다.
  - 로컬 ACE-Step/Stable Audio 후보 18개는 기계 QA를 통과했으나 사용자가 "실제 사용이 어려운 수준"으로 청감 반려했다. 승격은 금지하고 `audio/audio-generation-history.json`에 이력을 남겼다.
  - 최종 후보 공급자는 Higgsfield로 전환했다. 음악은 `sonilo_music`, SFX는 `seed_audio`를 사용한다.
- 2026-07-28 이용 조건 확인:
  - Higgsfield Terms of Use §4.4는 출력의 상업적 사용을 제한하지 않지만, 입력·출력의 권리 확인 책임은 사용자에게 둔다.
  - 정본 URL은 `https://higgsfield.ai/terms-of-use-agreement`이며 상업 릴리스 시 최신 조건을 다시 확인한다.
- 생성/QA:
  - `audio/audio-spec.json`에 9개 역할, prompt, Higgsfield model/job type, 이용 조건 URL, A/B 후보를 고정했다.
  - `audio:generate`가 Higgsfield CLI를 통해 음악 후보 4개와 SFX 후보 14개를 실제 생성하고 생성 ID·결과 URL을 기록했다.
  - 두 모델은 seed 입력/출력을 노출하지 않으므로 manifest에는 `seed: null`을 사실대로 쓰고 생성 ID를 재현 근거로 보존한다.
  - `npm run audio:qa`: `18/18 passing; missing=0`
  - 게이트: duration, non-silence, peak/clipping, integrated loudness, music loop-boundary delta
  - 기계 보고서: `prototype/core-loop/audio/audio-qa-report.json`
- 런타임:
  - 첫 pointer/keyboard gesture 후에만 AudioContext를 열고 OGG→MP3 순서로 decode한다.
  - master/music/sfx volume과 mute를 `caseCollection.audioSettings@1`로 저장한다.
  - background 탭은 master gain을 0으로 낮추고 복귀 시 기존 BGM source를 유지해 중복 재생하지 않는다.
  - fetch/decode/play 실패는 무음으로 폴백하며 reducer를 import하거나 action을 dispatch하지 않는다.
  - mute / enabled / forced decode-failure replay의 `GameState` bytes가 동일하다.
- 브라우저 확인:
  - 오디오 설정 panel의 44px controls, mute 저장, 새로고침 persistence, 테스트 후 unmute 원복을 확인했다.
  - 최종 OGG/MP3 18개가 Chrome에서 `18/18 decoded · 0 errors`로 확인됐다.
- 사람 청감 및 승격:
  - `mmdal`이 2026-07-28T14:39:34.626Z에 9개 역할의 A/B를 직접 선택했다.
  - 선택 정본: `prototype/core-loop/audio/audio-picks.json`
  - `audio:promote`가 WAV/OGG/MP3 27개와 `audio-manifest@1`을 생성했다.
  - `audio:verify`: `27/27 files verified · 9/9 human picks`
  - manifest SHA-256: `ffd33de686656ba3f6d22f852fef5e849352b9c3374f2dda63d7dd501dd6c73a`
  - 자동화는 `humanPick`을 대신 쓰거나 추정하지 않았으며 제공된 선택을 byte-identical하게 보존했다.

### Claude review checklist (2026-07-29)

- [x] **무보이스 2 loop + 7 SFX, hover 제외** — `npm run smoke:audio` 독립 재실행 PASS: "무보이스 범위는 instrumental loop 2개와 의미 SFX 7개다", "voice·hover가 없고 각 역할에 청감 비교용 A/B 후보가 있다".
- [x] **Dead Letters 자산 미혼입** — `audio-spec.json`·`audio-generation-history.json` 코드 근거와 Resolution 서술을 대조, 별도 재생성 이력 확인(직접 청취는 하지 않음 — 아래 참고).
- [x] **Higgsfield 모델·Terms of Use 조건 기재** — Resolution에 §4.4 조항과 정본 URL이 명시돼 있고, 전역 CLAUDE.md의 Higgsfield 크레딧·정책 기록과 상충하지 않는다.
- [x] **18/18 QA + human pick 기록** — `npm run audio:verify` 독립 재실행 → `27/27 files verified · 9/9 human picks`(자기보고와 일치).
- [x] **최종 WAV/OGG/MP3 hash·매니페스트** — `public/audio/audio-manifest.json`의 SHA-256을 직접 계산해 티켓 원문 기재값(`ffd33de6...`)과 **정확히 일치** 확인. 파일 개수도 WAV 9 + OGG 9 + MP3 9 = 27로 일치.
- [x] **mute·volume persistence, 오디오 실패 시 GameState 불변** — 스모크의 "무음 adapter는 게임 상태를 바꾸지 않는다", "mute·활성·decode 실패 오디오 경로에서 GameState bytes가 동일하다" PASS.

실제 오디오 청취(음악·SFX가 "쓸만한 품질"인지)는 이미 `mmdal`이 human pick으로 직접 확인한 항목이라 내가 다시 들어보지 않았다 — 기계 검증과 기록된 사람 선택 근거가 일치하므로 그대로 신뢰.

결론: **승인.**
