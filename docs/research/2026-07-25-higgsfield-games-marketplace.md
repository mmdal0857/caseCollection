# Higgsfield Supercomputer Games 마켓플레이스 — 배포 채널 실사

- **작성일**: 2026-07-25
- **대상 프로젝트**: caseCollection — 정적 클라이언트 온리 웹 카드 콜렉션 게임 (Svelte 5 + Vite, 서버 없음)
- **목적**: [티켓 08](../../.scratch/case-collection/issues/08-mvp-scope.md) ⑥이 **미지 변수로 명시하고 남겨둔 값** — "Higgsfield 마켓플레이스의 실제 관객 규모" — 를 실측으로 채우고, 업로드 경로의 기술적 계약을 확정한다.
- **08 ⑥ 원문**: *"알려지지 않은 변수(정직하게 기록): Higgsfield 마켓플레이스의 실제 관객 규모는 확인되지 않았다 — CLI에 목록·통계 커맨드가 없어 페이지를 직접 봐야 한다. (…) 신호가 0이면 itch.io 추가를 재검토할 것."*
- **방법**: 마켓플레이스 페이지의 SSR 페이로드 직접 파싱(50개 게임의 `playsCount`/`uniquePlayersCount`/`remixesCount`), 로컬 `higgsfield` CLI `--help` 원문, 공개된 게임 소스 ZIP 1건 실제 다운로드·해부, 공식 블로그·인트로 페이지.

---

## 0. 결론 요약

| 질문 | 답 (근거 등급) |
|---|---|
| 관객 신호가 0인가? | **아니다.** 우리 장르대(솔로 서사/카드/퍼즐) 13개 게임의 **중앙값 유니크 플레이어 132명 · 플레이 1,040회**. (실측) |
| 우리 코드를 올릴 수 있나? | **된다.** `higgsfield game deploy`는 "local browser game ZIP archives"를 받는다 — Supercomputer로 생성한 게임 전용이 아니다. (CLI 원문) |
| 공짜인가? | 배포·게시에 크레딧 소모 표기 없음. 계정: plus plan, 1,056 크레딧. (실측) |
| 숨은 비용은? | **게시하면 소스 ZIP이 무인증 공개 다운로드된다** — "리믹스"의 구현이 그것. (실측: HTTP 200, 9.6MB) |
| 라이선스상 무엇을 넘기나? | 회사에 **영구·취소불가·다단계 재실시허락 가능한 전 저작권 실시권**(목적 제한 있음) + AI 학습 이용 + 저작인격권 주장 포기. **소유권·비배타성·Output 상업적 이용은 유지.** 되돌릴 수 없다. (약관 원문 §4.3/4.4/16.4) → §4 |
| 리믹서는 권리를 받나? | **약관에 부여 규정이 없다.** §7.2는 회사 면책일 뿐 — 우리 저작권 주장은 살아 있다. 대신 회사의 재실시허락 범위가 미정의. → §4.3 |
| 08 ⑥ 결정은 유지되나? | **유지.** 단 "판정 지표"의 해상도를 낮춰야 하고, GitHub Pages가 정본이어야 한다(약관 §3.4/16.2/16.4가 만든 제약). |

---

## 1. 플랫폼 정체 — 게임 스토어가 아니라 AI 생성 파이프라인의 전시장

Higgsfield "Supercomputer"는 AI 영상·이미지 생성 플랫폼의 에이전트형 확장이고, Games는 그 안의 한 갈래다. 자연어로 게임을 만들면 코드·에셋·3D·멀티플레이·호스팅까지 자동 처리하고, 결과물을 브라우저 링크로 준다 ([games-intro](https://higgsfield.ai/games-intro)). 마켓플레이스는 그 결과물을 낯선 사람이 **발견·플레이·리믹스**하는 곳이다 ([blog: Build Multiplayer Games With AI](https://higgsfield.ai/blog/Higgsfield-Games)).

- **개시 시점**: 마켓플레이스 게임 자산의 CDN 파일명이 `photo_2026-06-12_*`, 공식 블로그(2026-06-19)가 "launched this week" — **개시 약 6주 전**(2026-06 중순).
- **모회사 체급**: Higgsfield는 2026-06 기준 연환산 매출 $500M ([TechTimes](https://www.techtimes.com/articles/319394/20260630/ai-video-startup-higgsfield-hits-500m-revenue-eyes-5b-funding-round.htm), [Sacra](https://sacra.com/c/higgsfield/)). **단, 그 트래픽은 영상 생성 사용자이지 게이머가 아니다** — 마켓플레이스 관객은 아래 실측대로 훨씬 작다.
- **호스팅 형태**: 게임마다 `https://<임의-두단어-숫자>.higgsfield.gg/` 서브도메인. 커스텀 슬러그·도메인 플래그 없음 → **URL에 브랜딩이 안 실린다.**

### 블로그의 홍보 수치와 실측의 간극

블로그는 "테스트 게임 3개가 하룻밤에 약 4,000 플레이 · 121 리믹스"를 자랑한다. 실측하면 **121 리믹스는 마켓플레이스 전체 리믹스 1,728건 중 한 게임의 몫**이고, 4,000 플레이는 상위 1~2개 게임의 며칠분이다. 홍보 수치는 틀리지 않았지만 **상위 게임 기준이고 중앙값과 두 자릿수 배 차이가 난다.**

---

## 2. 실측 관객 규모 (2026-07-25, 마켓플레이스 SSR 페이로드 50개 전량)

전체 합계: **플레이 764,621회 · 유니크 플레이어 96,482명 · 리믹스 1,728건**. 중앙값은 **플레이 1,117회 · 유니크 168명**.

분포는 극단적으로 상위 편중이다:

| 순위 | 게임 | 플레이 | 유니크 | 리믹스 |
|---|---|---:|---:|---:|
| 1 | Blockfield (복셀 멀티 FPS, 최대 22인) | 175,782 | 22,175 | 640 |
| 2 | STRIKE PROTOCOL (택티컬 FPS) | 140,767 | 19,948 | 393 |
| 3 | Gesture Synth (음악 토이) | 82,850 | 10,877 | 120 |
| 4 | Fighter World 7 | 77,832 | 3,624 | 177 |
| 5 | BULLET BALLET (불렛타임 슈터) | 64,164 | 11,395 | 63 |

**상위 5개가 전체 플레이의 70%를 먹는다.** 그리고 꼬리가 압도적으로 길다:

- 유니크 300명 미만: **32/50 (64%)**
- 유니크 100명 미만: **21/50 (42%)**
- 유니크 0명: 2개 (그중 하나가 한국어 제목 게임)

### 장르 클러스터 — 우리가 실제로 놓일 자리

| 클러스터 | n | 플레이 중앙값 | 최대 | 유니크 중앙값 | 최대 |
|---|---:|---:|---:|---:|---:|
| 멀티플레이·액션·슈터 | 17 | 1,301 | 175,782 | 168 | 22,175 |
| **솔로 서사·카드·퍼즐** | **13** | **1,040** | **1,815** | **132** | **358** |
| 토이·교육·음악 | 5 | 19 | 82,850 | 4 | 10,877 |

결정적인 대비: **멀티플레이 장르는 상한이 22,175명이지만 솔로 서사 장르의 상한은 358명이다.** 멀티플레이 중앙값도 낮지만(168) 그건 실패한 슈터가 많다는 뜻이고, 성공했을 때의 천장이 두 자릿수 배 다르다. 우리 장르에는 대박 사례가 존재하지 않는다.

**가장 가까운 비교 대상** (솔로·서사/카드/퍼즐, 유니크 내림차순):

| 게임 | 플레이 | 유니크 | 리믹스 |
|---|---:|---:|---:|
| Brisalia | 1,815 | 358 | 0 |
| Norðvík - Hold the Fjord | 1,119 | 221 | 0 |
| Silent Ward | 1,262 | 214 | 9 |
| Takeshi & Delphy: Demon Castle | 1,395 | 187 | 0 |
| ADULTING — Levels 1–10 | 815 | 132 | 1 |
| **Breach: Last Card** (카드 게임 — 최근접) | **1,116** | **89** | 2 |
| 墨剑 Ink Blade (중국어) | 406 | 66 | 0 |
| Yona & the Whale | 64 | 14 | 0 |
| Azure Oath | 34 | 5 | 0 |

**비영어·비액션 신호**: 한국어 제목 게임 1건 = **0 플레이**. 포르투갈어 교육 게임 = 19 플레이. 중국어 = 406 플레이. 표본이 각 1건이라 단정할 수 없지만, **마켓플레이스 UI가 영어이고 커버·제목만으로 클릭이 결정되므로 한국어 텍스트 중심 게임은 구조적으로 불리하다**는 방향은 일관된다.

### 목록 완전성 (정직한 한계)

- 페이지는 **50개를 고정 순서로** SSR한다(두 번 요청해 순서·집합 동일 확인). `nextCursor: null`.
- 그러나 직접 URL로 접근되는 게시된 게임 **Crypto Tycoon Exchange(431 users / 28 remixed)가 이 50개 목록에 없다.** → **50개는 "발견 가능한 전시면"이고 전체 카탈로그의 하한이다.**
- 의사결정에 중요한 것은 전체 카탈로그가 아니라 **전시면 크기**이므로 이 한계는 결론을 바꾸지 않는다. 오히려 전시면이 50개뿐이라는 사실이 유리하다 — 카테고리·검색·정렬 UI가 사실상 없고(`categoryId`가 채워진 게임이 50개 중 1개), **목록에 들어가면 전원이 한 화면에서 보인다.**

---

## 3. 업로드 경로 — 기술 계약 실측

### 3.1 CLI (원문)

```
higgsfield game deploy <zip> --title <t> --description <d> [--thumbnail <https 16:9>] [--favicon <https 1:1>] [--game-id <기존id>]
higgsfield game publish <game_id> --name <n> [--description <d>] [--cover-url <https 16:9>] [--logo-url <https 1:1>]
```

- 커맨드 설명: *"Deploy **local** browser game ZIP archives and publish deployed games to the marketplace."* → **AI 생성물 전용이 아님이 확정.** 우리 Vite `dist/`를 zip으로 올리는 경로가 정당하다.
- `deploy`와 `publish`가 **분리**돼 있다 → 비공개 링크로 먼저 검증하고, 게시는 별도 의사결정으로 미룰 수 있다. (MVP 운영상 중요)
- `--game-id`로 **동일 게임 갱신 배포** → 업데이트마다 새 리스팅이 생기지 않는다.
- 이미지 인자는 **여전히 https URL만** (로컬 경로 불가) — 티켓 13에 기록된 제약 그대로.

### 3.2 ZIP 구조 — 문서와 실측이 어긋난다

**문서 주장 2건:**
- CLI README: *"Deploy a browser-game ZIP whose root contains `index.html` and either `logic.js` or `server.js`"*
- 공식 게임 스킬: *"Assemble the source ZIP with `index.html` and **exactly one root code module** (`logic.js` or `server.js`)"*

**실측(게시된 게임 `ICEWEAR VEZZO - ROP 4` 소스 ZIP 해부, 34.8MB / 25 엔트리):**

```
manifest.json          ← game_id, name, main:"app.js", class_name:"App", socket_mode:"direct",
index.html                meta{title,description,thumbnail_path:"og/thumbnail.png",favicon_path:"og/favicon.png"}, files[]
app.js
game.js                ← index.html이 <script type="module" src="./game.js">로 로드
strings.js
assets/  (png/jpg/mp3)
og/thumbnail.png, og/favicon.png
```

→ **루트에 JS가 3개이고 `logic.js`도 `server.js`도 없다.** index.html에 Higgsfield SDK 스크립트 참조도 0건 — **순수 정적 번들이 그대로 서빙된다.**

**해석**: `logic.js`/`server.js`는 **AI 생성 경로의 저작 관례**이고(멀티플레이 시 `server.js`를 서버에서 실행하기 위한 규약으로 보인다), 플랫폼이 강제하는 게이트가 아닐 가능성이 높다. 다만 **CLI 쪽 밸리데이터가 문서대로 검사할 여지가 남아 있어** 우리는 값싼 보험을 드는 편이 낫다:

> Vite `rollupOptions.output.entryFileNames = 'logic.js'` + `assetFileNames`를 유지해 **루트에 `logic.js` 단 하나**를 두고 나머지는 `assets/`에 남긴다. 코드 한 줄짜리 변경이고, 실패해도 원인이 명확해진다.

**부수 발견 — 커버·아이콘 호스팅 요구를 우회할 단서**: 실측 ZIP은 `og/thumbnail.png`·`og/favicon.png`를 **zip 안에 넣고 `manifest.json`의 `meta.thumbnail_path`/`favicon_path`로 참조**한다. 즉 이미지를 https 호스팅하지 않고 팩에 담는 경로가 플랫폼에 존재한다. **단 이 게임이 CLI로 배포됐는지는 확인 불가**하므로 검증 필요 — `--thumbnail` 없이 manifest만으로 배포해 리스팅에 그림이 뜨는지 보면 즉시 판명된다. 뜨면 티켓 13의 "호스팅 경로도 파이프라인 산출에 포함" 요구가 삭감된다.

**용량**: 34.8MB ZIP이 실제로 게시되어 있다 → 아트 전량(카드+배경 9장+인물)을 실은 우리 빌드도 용량 문제는 없다.

### 3.3 게시의 비가역적 대가 — 소스 공개

`sourceUrl` 필드가 리스팅 페이로드에 그대로 들어 있고, 그 CloudFront URL은 **무인증으로 200을 반환한다**(실측: `Content-Type: application/zip`, 9.6MB 다운로드 성공). 상세 페이지 버튼은 `Play` / `Remix game` 두 개다.

즉 **"리믹스"의 구현은 소스 ZIP 공개 배포**다. 우리 프로젝트에 미치는 실질:

- **퍼즐 정답 유출은 새 리스크가 아니다.** 서버 없는 클라이언트 온리 설계이므로 정답은 어차피 클라이언트에 실린다(MAP.md 결정 사항). 브라우저 devtools로 볼 수 있는 것을 zip으로도 볼 수 있게 되는 차이일 뿐이다.
- **새 리스크는 콘텐츠·코드의 재사용이다.** OUT 위키 파생 case 텍스트, 검증된 순수 모듈(`engine`/`facets`/`dramaturgy`/`josa`), 그리고 생성한 아트 전량이 한 클릭 리믹스 대상이 된다. 라이선스 표기가 없으면 사실상 방치다.
- **완화책**: ZIP 루트에 `LICENSE`/`CREDITS.txt`를 포함(비용 0). 아트 워터마크는 게임 미감을 해치므로 비권장.

---

## 4. 라이선스 실사 — 게시가 실제로 넘기는 권리

출처: [Terms of Use Agreement](https://higgsfield.ai/terms-of-use-agreement) 전문(약 97,000자) 직접 파싱. 아래 인용은 원문 그대로다. **법률 자문이 아니라 조항 독해**임을 전제한다.

### 4.1 회사에 넘어가는 것 — §4.3

> **4.3. License to Your Content.** You grant Company a **non-exclusive, transferable, perpetual, irrevocable, worldwide, fully-paid, royalty-free, sublicensable (through multiple tiers of sublicensees)** right and license to **use, copy, reproduce, modify, adapt, prepare derivative works from, translate, distribute, publicly perform, and publicly display** Your Content (in whole or in part) **for the purposes of operating, providing, maintaining, and improving the Service**, and as further described in Section 4.4.

읽을 점 두 가지:

- **동사 목록은 사실상 저작권 전부**(복제·개작·2차적저작물·번역·배포·공연·공중송신)이고, **영구·취소불가·다단계 재실시허락**까지 붙는다.
- 그러나 **목적 제한이 걸려 있다** — "operating, providing, maintaining, and improving the Service". 즉 회사가 우리 게임을 떼어내 독립 상품으로 팔 권리를 명시적으로 받아간 것은 아니다. 다만 "improving the Service"의 폭이 넓고, §4.4가 그 폭을 **AI 학습까지 명시적으로 확장**한다:

> Your Content, Inputs, and Outputs **may be used by Company to train, develop, enhance, evolve, and improve its (and its affiliates') AI models**, algorithms, and related technology, products and services.

**저작인격권**: 같은 조항이 "you **waive, and agree not to assert, any moral rights**"를 요구한다. 단 "To the extent permitted by applicable law" 한정이 붙어 있고, 한국 저작권법상 저작인격권은 일신전속적이라 포괄적 사전 포기의 효력이 제한적으로 해석된다 — **한국법이 준거법이 아니라는 점**(§19.8: California law)이 이 방어선을 약화시킨다.

### 4.2 우리가 지키는 것 — §4.2 / §4.4

> **4.2.** Company **does not claim ownership of Your Content**.
> **4.4.** Company **does not claim ownership of any of your Inputs or Outputs, nor does it restrict your commercial use of Outputs**.

- **소유권은 우리 것**이고 배타적 라이선스가 아니므로(**non-exclusive**) itch.io·GitHub Pages·Steam 어디든 같은 게임을 자유롭게 올릴 수 있다. **08 ⑥의 채널 병행이 약관상 막히지 않는다.**
- **Higgsfield로 생성한 카드 아트의 상업적 사용도 명시적으로 허용**된다(티켓 13의 전제 확인). 소유권 주장도 없다.

### 4.3 핵심 질문 — 리믹서는 무슨 권리를 갖는가

**약관은 타 사용자에게 우리 콘텐츠에 대한 라이선스를 부여하지 않는다.** 관련 조항을 다 뒤져도 부여 규정이 없다:

- **§7.2 Content Provided by Other Users**는 전부 회사 면책이다 — *"Company is not responsible for and does not control User Content… You use all User Content and interact with other users at your own risk."* **권리 부여가 아니다.**
- §4.3 말미의 문장은 **고지(notice)**다: *"Please remember that other users **may be able to** search for, see, use, modify and/or reproduce any of Your Content that you submit to any area of the Service that is accessible by other users."* — "할 수 있게 될 것"이라는 사실 통보이지, 그들에게 권리를 준다는 문언이 아니다.

따라서 리믹스 기능의 법적 근거는 **§4.3의 `sublicensable (through multiple tiers)`** — 회사가 자기 라이선스를 리믹서에게 재실시허락하는 구조로 보인다. 결과는 양날이다:

- **유리**: 우리 저작권이 살아 있고 리믹서와 직접적 계약관계도 없다 → 마켓플레이스 밖으로 우리 에셋·코드를 빼내 상업적으로 쓰는 리믹서에 대해 저작권 청구 여지가 남는다.
- **불리**: 재실시허락의 **범위가 공개 약관에 정의되어 있지 않다**. 회사가 "리믹스는 Service 운영의 일부"라고 주장하면 그 sublicense가 어디까지 허용하는지 우리가 사전에 알 방법이 없다. 게시 시점에 우리는 **범위 미정의 재실시허락에 동의하는 것**이다.

### 4.4 되돌릴 수 없다

- **§16.4**: *"All provisions of this Agreement which by their nature should survive will survive termination, including without limitation ownership provisions, **licenses granted to Company**…"*
- **§16.5(c)**: 계정 삭제 후 30일 보관 뒤 영구 삭제하지만, 그 삭제는 *"(iii) any data that has been **incorporated into Company's AI models**, algorithms, or related technology pursuant to the licenses granted under Section 4"*에는 **미치지 않는다**.

→ **게시 취소·계정 삭제가 §4.3 부여를 되돌리지 않는다.** `perpetual, irrevocable`이 문언대로 작동한다. 즉 **publish는 사실상 비가역 결정**이고, deploy(비공개 링크)와 분리 운용할 실익이 여기서 다시 확인된다 — 다만 §4.3은 "Make Available … to the Service" 시점에 걸리므로 **deploy만 해도 회사에 대한 부여는 이미 발생한다.** publish가 추가로 넘기는 것은 회사 권리가 아니라 **타 사용자 노출**이다.

### 4.5 우리가 지는 보증과 면책 — 실질적으로 가장 날카로운 조항

§4.2는 업로드할 때마다 우리가 다음을 **진술·보증**하게 만든다: (a) §4.3·4.4 라이선스를 부여할 모든 권리를 보유 (b) 실존 인물의 이름·초상·음성이 있으면 동의 확보 (c) 제3자 IP·퍼블리시티·프라이버시를 침해하지 않음 (d) 추가 보상 없이 부여 가능. 그리고 §12 면책 조항은 **해지 후에도 존속**한다.

**caseCollection에 대한 구체적 함의**: 콘텐츠는 퍼블릭 도메인 추리소설 + 자체 저작 위키 파생이므로 (a)(c)(d)는 충족된다. 그러나 이 보증은 **데이터 팩 추출 파이프라인([14](../../.scratch/case-collection/issues/14-tag-extraction-promotion.md)·[16](../../.scratch/case-collection/issues/16-external-data-pack-loading.md))에 출처 검증이 필요한 법적 근거**가 된다 — 비-PD 텍스트가 한 줄 섞여 들어오면 면책 주체는 우리다. MVP 밖 티켓이지만 이 요구는 지금 기록해둘 값이 있다.

### 4.6 아트 파이프라인 파급 — 티켓 13

- **§6.4 Provenance and Watermarking**: 회사는 Output에 *"machine-readable watermarks, secure metadata, or content-provenance signals (such as those based on the **C2PA / Content Credentials** standard)"*를 심을 수 있고, *"may make such markings **imperceptible**"*하다. 모든 Output에 적용·존속을 보증하지는 않는다.
- **§4.1**: *"You may not remove, alter, or obscure any copyright, **watermark**, trademark, service mark or other proprietary notices incorporated in or accompanying the Service."*

→ **회색지대**: 우리 아트 파이프라인의 후처리(크로마키 알파 정리·아틀라스 합성·PNG 재인코딩)는 C2PA 메타데이터를 **부수적으로 파괴한다**. §4.1의 문언은 "the Service"에 부수된 표시를 겨냥하므로 Output 내 워터마크에 그대로 적용되는지는 불분명하고, 재인코딩은 통상적 제작 공정이다. **위험도는 낮게 본다** — 다만 의도적 워터마크 제거 도구를 쓰지 않는 선은 지킬 것.
- **§13.2**: 회사는 Output의 *"originality, or exclusivity"*를 보증하지 않는다 → 같은 스타일 키로 남이 유사 아트를 뽑을 수 있다. MVP 차단 사유는 아니나 **아트가 방어 가능한 차별점이 아니라는 뜻**이다.
- **§6.6**: 침해 통지를 받으면 배포 중단·삭제뿐 아니라 *"refrain from **re-generating substantially the same Output**"* 의무까지 진다 → 최악의 경우 **스타일 키 자체를 못 쓰게 될 수 있다.**

### 4.7 게시 취소 경로가 없다 (판매 계획이 있을 때 가장 중요한 조항)

**CLI**: `higgsfield game`의 서브커맨드는 **`deploy`와 `publish` 둘뿐**이다. `delete`·`unpublish`·`list`가 없다. 최상위 커맨드 전체를 훑어도 게임 관리용 삭제 경로가 없다.

**약관**: 사용자가 자기 콘텐츠를 삭제할 권리를 부여하는 조항이 **없다**. 검색 결과 `you may delete` 0건, `delete Your Content` 0건.

- **§3.2**: *"Company has **no obligation to store** any of Your Content."* (보관 의무 없음 — 삭제 권리와는 다르다)
- **§3.2**: *"If you do not choose a level of access, the Service may default to its **most permissive setting**."*
- **§6.2**: 회사는 위반 판단 시 *"immediately change, alter, or remove Your Content"* 가능 — **회사의 권한이지 우리의 권리가 아니다.**
- **§16.5**: 콘텐츠 영구 삭제는 **계정 삭제**를 통해서만 규정된다(30일 보관 후 삭제).
- **§16.3**: 사용자의 해지 방법 = 통지 + **계정 폐쇄**.

→ **약관·CLI가 문서화한 유일한 삭제 경로는 계정 전체 폐쇄다.** 게임 1건만 내리는 절차가 공개 문서에 존재하지 않는다.

**미확인(사용자만 확인 가능)**: 웹 UI에 게임 삭제·게시취소 버튼이 있을 수 있다. MCP가 미인증이라 이 세션에서 확인 불가. **첫 deploy 전에 1분만 들여 확인할 것** — 없다면 "게시 = 영구"로 취급해야 한다.

### 4.8 채널로서의 운영 리스크

- **§3.4**: 로그인·생성 활동·유효 구독이 **연속 30일 없으면 계정을 inactive로 분류**하고 콘텐츠를 cold storage로 옮길 수 있다 → **MVP 후 구독을 해지하면 호스팅 가용성이 불확실해진다.**
- **§16.2**: 회사는 중대한 위반 시 무통보 즉시 정지·해지할 수 있고, **§16.4**는 *"Company will not have any liability whatsoever to you for any suspension or termination, including for deletion of Your Content."*
- **§13.1**: Service는 as-is, all faults.

→ **08 ⑥이 GitHub Pages를 병행 채널로 둔 결정이 이 세 조항으로 사후 정당화된다.** Higgsfield는 유입 채널이고 **정본 호스팅이 될 수 없다.** 이건 선호가 아니라 약관이 만든 제약이다.

### 4.9 기타 확정 사실

- **준거법·분쟁**: California law + 연방중재법, 배심·집단소송 포기(§18). 통지 주소 535 Mission St, San Francisco. 한국 개인 개발자가 실효적으로 다툴 수 있는 구조가 아니다 → **분쟁이 나면 이긴다는 전제를 세우지 말 것.**
- **§4.6 Feedback**: 회사에 보낸 아이디어·제안·문서는 *"without any restriction, attribution, or compensation"* 사용 가능 → **설계 아이디어를 서포트 채널로 보내지 말 것.** 게임 업로드와 별개의 함정.
- **§1.6**: 마켓플레이스 게시는 **명시적으로 허용**된다 — *"creating and publishing applications, skills, or other content through Company's creator marketplace or similar features for use by other users **is permitted**"*. 자체 제작 게임 업로드가 약관 위반이 아님이 확정.

### 4.10 판정 — 판매 계획(소규모)이 있는 경우

**사용자 확정 전제(2026-07-25)**: 유료 판매 계획은 있으나 큰 수익 목적은 아니다.

**법적으로는 판매가 막히지 않는다.** 이건 명확하다:

- §4.3의 라이선스는 **non-exclusive**다 → 같은 게임을 Steam·itch.io에서 유료로 팔 권리가 그대로 남는다.
- §4.2 소유권 유지 + §4.4 *"nor does it restrict your commercial use of Outputs"*.
- §4.3의 **목적 제한**("operating, providing, maintaining, and improving the Service")은 **회사가 우리 게임을 자기 상품으로 판매할 권리는 주지 않는다** — 호스팅·전시·AI 학습까지다.

**따라서 충돌은 법이 아니라 시장에서 일어난다.** 진짜 문제는 §4.7이다: **완전히 플레이 가능한 무료판 + 다운로드 가능한 소스 zip이 영구히 남고, 내릴 경로가 문서화돼 있지 않다.** 나중에 유료판을 낼 때 그 무료판이 계속 경쟁한다.

**그러나 실측 데이터가 이 위협을 크게 깎아준다**: 우리 장르대(솔로 서사/카드/퍼즐) 13개 게임의 **리믹스 수는 0·0·0·0·0·0·0·1·1·2·9 — 중앙값 0**이다(§2). 상위 슈터들이 393~640 리믹스를 먹는 동안 서사 게임은 아무도 리믹스하지 않는다. **"소스가 공개되면 남이 베껴 판다"는 시나리오는 우리 장르에서 경험적으로 발생하지 않는다.** 남는 것은 베끼기가 아니라 **자기 잠식**이다.

**해소책 — 버전 분리.** 게시본과 판매본을 처음부터 다른 물건으로 정의한다:

| | Higgsfield 게시본 | 유료판 |
|---|---|---|
| 정체 | MVP 빌드 = 무료 데모 | 확장판 |
| 콘텐츠 | 08 ④의 잠정 분량(case 4~5건, 24장) | [18](../../.scratch/case-collection/issues/18-case-generator-shape.md) 생성기 도입 후 대량 case |
| 채널 | higgsfield.gg + GitHub Pages | itch.io(05의 butler 체인) |

이 분리는 **새 계획이 아니라 08이 이미 그은 선**이다 — ⑧이 생성기·태그 추출·외부 팩·리플레이성 검증을 MVP 밖으로 뺐고, ④는 분량을 잠정 24장으로 묶었다. **MVP는 그 자체로 데모의 형상이다.** 즉 지금 게시하는 것은 "상품을 무료로 뿌리는 것"이 아니라 "데모를 뿌리는 것"이고, 유니크 100~350명은 잠식이라기보다 **유료판의 유일한 사전 마케팅**이다.

**단 한 가지는 비가역이므로 지금 정해야 한다**: 게시본에 들어가는 순수 모듈(`engine`/`facets`/`dramaturgy`/`josa`)은 소스로 공개된다. 유료 확장판이 같은 엔진 위에 서므로 **엔진은 영구히 공개 상태가 된다.** 소규모 판매에서 방어선은 엔진이 아니라 **콘텐츠 양과 큐레이션**이므로 수용 가능하다고 본다 — 그러나 "엔진을 자산으로 삼아 라이선싱한다" 같은 계획이 있다면 게시를 보류해야 한다.

**최종 판정: 게시 가능.** 조건 3개 — ⓐ 게시본을 데모로 정의하고 그 경계를 첫 deploy 전에 확정 ⓑ zip 루트에 `LICENSE`(§4.3이 리믹서에게 권리를 주지 않으므로 우리 저작권 주장이 실효적이다) ⓒ 웹 UI 삭제 버튼 유무를 첫 deploy 전에 육안 확인.

---

## 5. 티켓 파급

### 08 ⑥ — 결정 유지, 판정 기준은 하향 조정

미지 변수는 채워졌다: **신호는 0이 아니다.** 우리 장르에서 6주에 유니크 100~350명이 기대치다. 08 ①이 원한 것은 *"정밀 계측이 아니라 가벼운 관심 신호"*였고 그 정의에는 정확히 부합한다. 따라서 **itch.io 재검토 트리거(신호 0)는 발동하지 않는다.**

다만 08 ①의 *"판정은 마켓플레이스 사용자 수"*는 **재미 검증으로 읽히면 안 된다.** 유니크 100~350명은 커버 아트와 제목이 만든 클릭 수에 가깝고(리믹스 0이 대부분 = 아무도 깊게 안 들어감), 우리 장르 상한 358명은 "이 게임이 재미있었는가"를 구분하지 못한다. 08은 이미 리플레이성 검증을 유예했으므로 논리적 충돌은 없지만, **"사용자 수가 적으면 게임이 재미없다"는 추론은 이 데이터로 금지된다** — 장르 천장이 먼저 걸린다.

### 13 — 요구 하나 추가, 하나는 검증 대기

- 커버 16:9 · 아이콘 1:1은 **여전히 https 필수**(CLI 플래그 실측). 단 §3.2의 manifest 우회 단서를 **첫 배포에서 함께 검증**하면 호스팅 산출물이 빠질 수 있다.
- **커버 아트의 중요도를 상향해야 한다.** 발견 UI에 카테고리·검색·정렬이 없어 리스팅은 커버+제목만으로 경쟁한다. 50개 전시면에서 커버는 **게임 내 아트보다 획득 효율이 높은 단일 자산**이다.

### 05 — 파급 코멘트 시 추가할 사실

배포 체인에 Higgsfield를 넣는 기술적 대가는 `dist/` 산출 규칙 한 줄(`entryFileNames: 'logic.js'`)과 zip 단계뿐이다. GitHub Pages와 산출물을 공유하므로 **채널 병행 비용이 사실상 0**이다. 반대로 얻는 것은 GitHub Pages에 없는 **유입**이다.

---

## 6. 권고

1. **08 ⑥ 유지.** Higgsfield + GitHub Pages 병행. itch.io는 MVP 밖 유지 — 신호 0 조건이 반증됐다. **단 GitHub Pages가 정본**이라는 점을 명문화할 것(§4.7).
2. **게시본을 "무료 데모"로 정의하고 유료판과 경계를 첫 deploy 전에 확정**(§4.10). 판매 계획이 있으나 소규모이므로 게시 자체는 수용 가능하다 — 법적으로 판매가 막히지 않고(non-exclusive), 우리 장르의 리믹스 실측 중앙값이 0이다. 잠식 위험은 **버전 분리로 해소**하되, 게시본에 실리는 순수 모듈이 영구 공개된다는 점은 되돌릴 수 없다.
   - 유료 채널은 [05](../../.scratch/case-collection/issues/05-web-stack.md)가 이미 확정한 itch.io butler 체인을 쓴다 — 08 ⑧의 "itch.io는 MVP 밖"은 **기각이 아니라 유예**이고, 판매 계획은 거기 착지한다.
   - **웹 UI에 게임 삭제·게시취소 버튼이 있는지 첫 deploy 전에 확인할 것**(§4.7 — CLI·약관에는 계정 폐쇄 외 경로가 없다). 없으면 "게시 = 영구"로 취급.
3. **`deploy`(비공개 링크)와 `publish`(마켓플레이스)를 분리 운용.** 08 ①의 완료 조건("올려둔 빌드")은 deploy만으로 충족된다. **주의: §4.3 부여는 deploy 시점에 이미 발생**하고, publish가 추가로 넘기는 것은 타 사용자 노출이다.
4. **첫 deploy를 기술 검증으로 설계.** 한 번에 판정: ⓐ `logic.js` 규약 강제 여부 ⓑ manifest 내장 thumbnail/favicon 인정 여부 ⓒ 한글 폰트·레이아웃 실렌더. 실패해도 `--game-id`로 갱신하면 되므로 비용은 낮다.
5. **커버 아트를 13의 1급 산출물로 승격.** 스타일 키 확정(08 ⑦) 직후, 카드 전량 생성보다 먼저.
6. **`LICENSE`를 zip 루트에 포함.** 약관이 리믹서에게 권리를 부여하지 않으므로(§4.3) 우리 저작권 주장이 살아 있다 — 라이선스 파일이 그 주장을 실효화하는 유일한 저비용 수단이다.
7. **구독 유지 여부를 배포 계획에 반영.** §3.4의 30일 inactive 규칙 때문에 구독을 끊으면 호스팅 가용성이 불확실해진다. Higgsfield 링크를 어딘가에 공표할 거라면 구독 유지가 전제다.
8. **데이터 팩 추출에 출처 검증 요구를 기록**(14·16). §4.2 보증과 §12 면책이 존속하므로 비-PD 텍스트 혼입은 우리 책임이다.
9. **설계 아이디어를 Higgsfield 서포트·피드백 채널로 보내지 말 것**(§4.6 Feedback: 무제한·무출처표기·무보상).
10. **기대치 문서화**: 유니크 100~350명. 이 숫자를 미리 적어두지 않으면 실제 결과가 나왔을 때 "실패"로 오독된다.

---

## 부록: 재현 방법

```bash
# 마켓플레이스 실측 (SSR 페이로드에 playsCount/uniquePlayersCount/remixesCount가 들어 있다)
curl -s https://higgsfield.ai/supercomputer/marketplace/games -o mp.html
# \" 이스케이프를 풀고 "gameId" 단위로 balanced object 파싱 → 50건

# CLI 계약
higgsfield game deploy --help ; higgsfield game publish --help
higgsfield account status          # plus plan, 1,056 credits (2026-07-25)

# 약관 원문 (WebFetch 요약은 조항 문언을 잃는다 — 반드시 원문 파싱)
curl -s https://higgsfield.ai/terms-of-use-agreement -o tos.html   # SSR, 약 97,000자 본문
# 태그 제거 후 'royalty-free' / 'perpetual' / 'sublicens' / '7.2.' / '16.5.' 문맥 추출
# 푸터 경로: /terms-of-use-agreement, /privacy-policy  (/terms, /legal 등은 전부 404)

# 게시 게임 소스 해부 (sourceUrl은 무인증 공개)
curl -s <cloudfront sourceUrl> -o g.zip && py -c "import zipfile;print(*zipfile.ZipFile('g.zip').namelist(),sep='\n')"
```

**주의**: 리스팅 페이로드에서 `title`↔`sourceUrl`을 문자열 윈도로 페어링하면 레코드 경계를 넘어 **잘못 짝지어진다**. `gameId`부터 balanced object로 잘라 파싱할 것.
