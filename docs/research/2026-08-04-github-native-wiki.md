# GitHub 네이티브 Wiki — caseCollection 문서 채널 후보 검토

- **작성일**: 2026-08-04
- **대상 프로젝트**: caseCollection — 이미 **OpenWiki**(`openwiki/`, 리포 히스토리에 커밋, Markdown+Mermaid) + **GitHub Pages**(`.github/workflows/deploy-pages.yml`, `workflow_dispatch` 수동 트리거로 `prototype/core-loop/dist`를 `https://mmdal0857.github.io/caseCollection/`에 게시)로 문서화 파이프라인을 갖춘 상태
- **목적**: 저장소마다 켤 수 있는 GitHub 네이티브 "Wiki" 탭(별도 `<repo>.wiki.git` git 저장소, GitHub Pages·OpenWiki와 완전히 별개 기능)이 기존 조합에 실질적 가치를 더하는지, 중복 채널인지 판정
- **방법**: docs.github.com 1차 문서, GitHub 공식 블로그/체인지로그, `gh` CLI 원문(로컬 `gh --help`/`gh repo --help` 실행), REST API 레퍼런스 인덱스를 직접 조회. 커뮤니티 디스커션(`github.com/orgs/community/discussions/*`)은 GitHub 공식 입장이 아니므로 **공식 문서가 침묵하는 지점("이런 기능이 없다")을 보강하는 정황 증거로만** 명시적으로 표기해 인용했다.

---

## 0. 결론 요약

| 질문 | 답 |
|---|---|
| `<repo>.wiki.git`로 백업되는 별도 git 저장소인가? | **맞다.** `git clone https://github.com/USER/REPO.wiki.git`로 확인. |
| Markdown·Mermaid를 쓸 수 있나? | **된다.** 단 Mermaid는 일반 Markdown(2022-02-14)보다 **6개월 늦게**(2022-08-09) 별도로 추가됐다 — "Markdown이 되면 Wiki도 된다"는 가정이 이 프로젝트에서 이미 한 번 틀렸던 전례(2022년 당시)다. |
| 편집이 PR 리뷰를 거치나? | **아니다.** 공식 문서 전체에 PR·브랜치·리뷰 절차가 없다 — 웹 UI "Save Page" 또는 로컬 `git push` 직결이다. |
| GitHub Pages를 Wiki에서 빌드할 수 있나? | **못한다.** Pages의 publishing source는 브랜치 루트/`docs` 폴더/Actions workflow뿐이고 Wiki는 목록에 없다. |
| REST/GraphQL API가 있나? | **없다.** REST 레퍼런스 인덱스에 wiki 카테고리 자체가 없고, GITHUB_TOKEN·fine-grained PAT 권한 목록에도 `wiki` 스코프가 없다. |
| Actions로 Wiki를 갱신·트리거할 수 있나? | **트리거(wiki→Actions)는 공식 지원**(`gollum` 이벤트). **역방향(Actions→wiki 자동 푸시)은 공식 매커니즘이 없다** — git 저장소라는 사실에 기대 직접 push할 수는 있지만 토큰 스코프가 문서화돼 있지 않다. |
| 검색엔진에 노출되나? | **원칙적으로 안 된다.** 별표 500개 이상 + 공개편집 제한 설정을 만족해야만 색인된다. |
| **판정** | **도입하지 않는다.** 아래 §4 참조 — 좁은 조건부 예외 하나만 남긴다. |

---

## 1. 기능 정체와 동작 방식

### 활성화 및 백업 저장소

모든 저장소에는 기본적으로 문서용 Wiki 섹션이 딸려 있다("Every repository on GitHub comes equipped with a section for hosting documentation, called a wiki") — [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis). 저장소 생성 시 `gh repo create`의 `--disable-wiki` 플래그로 끌 수 있고(로컬 `gh repo create --help` 원문 확인, 2026-08-04), 기존 저장소에서는 **Settings → Features → "Wikis" 체크 해제**로 끈다. 끄더라도 콘텐츠는 삭제되지 않고 숨겨질 뿐이며, 재활성화하면 이전 페이지가 복원된다 — [Disabling wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/disabling-wikis).

**별도 git 저장소로 백업된다**는 점이 확인된다. 로컬 클론 명령이 문서에 정확히 나온다.

```
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.wiki.git
```

— [Adding or editing wiki pages](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages)

첫 페이지는 웹 UI에서 저장소 페이지의 **Wiki 탭 → New Page → (선택) Edit mode 드롭다운으로 포맷 선택 → 텍스트 편집 → 커밋 메시지 입력 → Save Page** 순서로 만든다. 클론한 뒤에는 "you can add new files, edit existing ones, and commit your changes"라고만 되어 있고, 로컬에서 정확히 어떤 `git push` 명령을 쓰라는 문구는 없다(그냥 일반 git 저장소로 취급하면 된다는 뜻) — 같은 문서. **로컬에서 push된 것만 라이브에 반영된다**("only changes pushed to the default branch will be made live")는 점은 명시돼 있다.

### 포맷·마크업

페이지 포맷은 **파일 확장자로 결정**된다 — `.md`/`.markdown`은 Markdown 컨버터, `.textile`은 Textile 컨버터를 쓰며, GitHub의 오픈소스 Markup 라이브러리가 "다른 지원 포맷"도 변환한다고만 되어 있다(구체적인 전체 목록은 이 페이지에 없다) — [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis), [Adding or editing wiki pages](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages). 웹 UI에서는 New Page 생성 시 "Edit mode" 드롭다운으로 고른다.

### 사이드바·푸터 커스터마이징

`_Sidebar.<extension>` 또는 `_Footer.<extension>`라는 이름의 파일을 만들면 GitHub가 자동으로 사이드바·푸터로 채택한다("If you create a file named `_Footer.<extension>` or `_Sidebar.<extension>`, we'll use them to populate the footer and sidebar of your wiki, respectively") — [Creating a footer or sidebar for your wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis/creating-a-footer-or-sidebar-for-your-wiki). 웹 UI에서도 "Add a custom sidebar"/"Add a custom footer" 버튼으로 동일 파일을 만든다.

### 페이지 링크 관례 — `[[Page Name]]` vs 상대 Markdown 링크

이 지점은 실제로 **포맷에 따라 갈린다**. `editing-wiki-content` 문서의 "Adding links" 절 원문:

> "If your pages are rendered with Markdown, the link syntax is `[Link Text](full-URL-of-wiki-page)`."
> "With MediaWiki syntax, the link syntax is `[[Nameofwikipage|Link Text]]`."

— [Editing wiki content](https://docs.github.com/en/communities/documenting-your-project-with-wikis/editing-wiki-content)

즉 **이중 대괄호 `[[Page Name]]` 위키링크 문법은 페이지가 MediaWiki 마크업으로 작성됐을 때 쓰는 문법이지, Markdown 페이지의 표준 링크 방식이 아니다.** caseCollection처럼 Markdown으로 쓸 경우 표준 상대 Markdown 링크(`[텍스트](페이지-이름)`)가 정본 방식이다. 이건 "GitHub wiki = `[[ ]]`"라는 통념(제3자 블로그·MediaWiki 시절 관성)과 어긋나는 확인 결과다.

### 접근 제어

- **공개 저장소**: 기본적으로 협업자(collaborator, write 권한 이상)만 편집 가능("By default, only people with write access to your repository can make changes to wikis") — [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis). Settings → Features에서 **"Restrict editing to collaborators only"를 해제**하면 "GitHub.com에 계정이 있는 누구나" 편집할 수 있게 된다 — [Changing access permissions for wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/changing-access-permissions-for-wikis).
- **비공개 저장소**: "저장소에 접근 권한이 있는 사람만 wiki에 접근할 수 있다"("only people with access to the repository can access the wiki") — [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis). 비공개 저장소는 애초에 "공개편집 허용" 토글의 전제(공개 저장소)가 성립하지 않으므로, 사실상 항상 협업자 전용이다.
- **브랜치 보호 규칙과의 관계**: [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) 문서 전체에 wiki 언급이 **전혀 없다**. 브랜치 보호는 메인 저장소의 브랜치에만 적용되는 개념이고, wiki는 별도 저장소이며 애초에 브랜치가 저장소 UI의 Branches 탭에 노출되지 않는다. → **wiki는 repo 권한 체계·브랜치 보호 규칙 어느 쪽으로도 커버되지 않는, 자체적인 on/off 토글 하나뿐인 접근 모델**이다.

### Mermaid 다이어그램

일반 Markdown 파일(README, 이슈, PR 등)의 Mermaid 렌더링은 **2022-02-14**에 발표됐다 — [Include diagrams in your Markdown files with Mermaid](https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/). 그러나 **Wiki는 별도로, 6개월 뒤인 2022-08-09**에 지원이 추가됐다("Wikis now support math and Mermaid diagrams") — [GitHub Changelog: Wikis now support math and Mermaid diagrams](https://github.blog/changelog/2022-08-09-wikis-now-support-math-and-mermaid-diagrams/). 2026-08-04 현재는 둘 다 지원된 지 오래됐으므로 **현재 시점 기준으로는 기능 동등**하다 — 다만 "일반 Markdown 기능 발표 = Wiki도 자동 적용"이라는 가정이 이 플랫폼에서 최소 한 번 성립하지 않았다는 사실은 향후 신규 Markdown 기능(예: 새 확장 문법)을 Wiki에 그대로 기대하면 안 된다는 근거가 된다.

### 알려진 한계

- **PR 리뷰 없음**: `about-wikis`, `adding-or-editing-wiki-pages`, `editing-wiki-content`, `changing-access-permissions-for-wikis` 네 개 공식 문서 어디에도 pull request, 브랜치, 리뷰 절차에 대한 언급이 없다 — 편집은 웹 UI "Save Page" 직결 또는 로컬 `git push` 직결이다. (정황 보강: 커뮤니티 디스커션에 따르면 wiki 저장소는 웹 UI로 fork가 안 되고, 로컬에서 브랜치를 만들어도 GitHub 쪽에는 노출되지 않아 PR을 열 수 있는 대상 자체가 없다 — [community discussion #38796](https://github.com/orgs/community/discussions/38796), [community discussion #139840](https://github.com/orgs/community/discussions/139840). 이건 GitHub 공식 발표가 아니라 사용자 보고이므로 참고용으로만 인용한다.)
- **REST/GraphQL API 없음**: REST API 레퍼런스 인덱스([REST API reference](https://docs.github.com/en/rest))에 wiki 카테고리가 없다(Actions, Issues, Pull Requests, Pages, Repositories 등은 있지만 Wikis는 없음). 커뮤니티에서도 반복 요청되는 기능 공백으로 보고된다 — [community discussion #153222 "WIKI API's are missing"](https://github.com/orgs/community/discussions/153222)(2025-03-06, GitHub 공식 답변 아님, 미해결 요청으로만 인용).
- **저장 용량**: "For performance reasons, wikis have a soft limit of 5,000 total files, regardless of file type." — [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis).
- **검색**: Wiki 콘텐츠는 저장소 코드 검색과 **분리된 별도 검색**이다. `in:wiki`, `repo:`, `user:`, `org:` 같은 전용 qualifier로 wiki 제목/본문을 검색한다 — [Searching wikis](https://docs.github.com/en/search-github/searching-on-github/searching-wikis).
- **외부 검색엔진 노출**: "Search engines will only index wikis with 500 or more stars that you configure to prevent public editing." — [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis). caseCollection처럼 별 500개에 크게 못 미치는 개인 프로젝트는 **Wiki가 Google 등에 잡히지 않는다.**
- **GitHub Pages는 Wiki에서 빌드할 수 없다**: Pages의 publishing source는 "The source branch can be any branch in your repository, and the source folder can either be the root of the repository (`/`) on the source branch or a `/docs` folder on the source branch" 또는 GitHub Actions workflow뿐이다. Wiki 저장소는 이 목록에 없다 — [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

---

## 2. 일상 사용

### 첫 페이지 만들기 — 웹 UI vs 로컬 클론

- **웹 UI**: 저장소 메인 페이지 → **Wiki** 탭 → **New Page** → (선택) Edit mode로 포맷 지정 → 편집 → 커밋 메시지 → **Save Page** — [Adding or editing wiki pages](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages).
- **로컬**: `git clone https://github.com/OWNER/REPO.wiki.git` 뒤 파일 추가·수정·커밋·push — 같은 문서.

### `gh` CLI — 전용 서브커맨드 없음 (확인)

로컬 `gh --version`(2.96.0, 2026-08-04) 기준 `gh --help` 전체 출력의 CORE/ACTIONS/ALIAS/ADDITIONAL/HELP 어느 카테고리에도 `wiki` 서브커맨드가 없다. `gh repo --help`의 GENERAL/TARGETED 커맨드 목록(`create`, `clone`, `edit`, `archive`, `delete` 등)에도 wiki 전용 항목이 없다. **유일한 접점은 `gh repo create --disable-wiki` 플래그**(생성 시점에 끄기만 가능, 편집·조회 불가) — 위 두 명령의 원문 `--help` 출력에서 직접 확인. 이는 태스크 배경에서 예상했던 대로다: **`gh`는 wiki 콘텐츠를 다루는 기능이 없다.**

### GitHub Actions — wiki 변경을 감지해 트리거 (`gollum` 이벤트, 공식 지원)

`on: gollum`은 "Runs your workflow when someone creates or updates a Wiki page"라고 명시된 정식 트리거다. 다만 **"This event will only trigger a workflow run if the workflow file exists on the default branch"** — 메인 저장소의 기본 브랜치에 워크플로 파일이 있어야 하며, `GITHUB_SHA`/`GITHUB_REF`는 wiki 커밋이 아니라 **메인 저장소 기본 브랜치의 최신 커밋/브랜치**를 가리킨다 — [Events that trigger workflows: gollum](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#gollum).

### GitHub Actions → wiki로 콘텐츠 밀어넣기 (공식 매커니즘 없음)

wiki가 일반 git 저장소라는 사실(§1)에 기대면 workflow 안에서 `git clone`/`push`로 `.wiki.git`에 쓰는 것 자체는 기술적으로 가능하다고 추론할 수 있다. 그러나 이걸 뒷받침하는 **공식 토큰 권한 체계가 존재하지 않는다**:

- **GITHUB_TOKEN 권한 문서**의 예시들은 `contents`, `issues`, `pull-requests` 같은 스코프를 다루며, 전체 스코프 목록을 확인해도 `wiki` 항목이 없다 — [Controlling permissions for GITHUB_TOKEN](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token).
- **fine-grained PAT 권한 목록**(Actions, Administration, Contents, Issues, Pull requests, Pages, Webhooks 등 30개 카테고리)에도 `Wiki`/`Wikis` 항목이 **없다** — [Permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

즉 "Actions에서 wiki에 자동으로 콘텐츠를 밀어넣는다"는 패턴은 **문서화된 지원 대상이 아니다** — 되더라도 어떤 토큰 스코프가 실제로 필요한지 공식 문서가 답을 주지 않는다. 이는 caseCollection이 이미 자동화한 "housekeeping 스킬이 `openwiki/`를 갱신해 일반 git commit/PR로 메인 저장소에 반영"하는 흐름(`contents` 권한 하나로 완결, 완전히 문서화됨)과 **극명하게 대비**된다.

---

## 3. 현재 OpenWiki+Pages 조합과의 직접 비교

| 축 | OpenWiki (`openwiki/`) + GitHub Pages | 네이티브 GitHub Wiki |
|---|---|---|
| 버전 관리 위치 | 메인 저장소 히스토리(`openwiki/` 커밋) | **별도** `<repo>.wiki.git` 저장소 |
| 변경 리뷰 | 일반 git 커밋/PR 경로를 그대로 탈 수 있음 | **없음** — Save Page/로컬 push가 즉시 라이브([Adding or editing wiki pages](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages), 4개 공식 문서에 PR 절차 언급 전무) |
| Mermaid | 지원(OpenWiki 자체 생성 산출물) | 지원(2022-08-09부터, [changelog](https://github.blog/changelog/2022-08-09-wikis-now-support-math-and-mermaid-diagrams/)) — 현재 시점 동등 |
| 게시 URL | `https://mmdal0857.github.io/caseCollection/` — CNAME으로 커스텀 도메인 연결 가능(Pages 일반 기능) | `https://github.com/OWNER/REPO/wiki` — **커스텀 도메인 불가**(Pages 전용 기능이라 Wiki에 없음, [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)에 Wiki가 source로 없다는 사실과 결합해 추론) |
| CI/자동화 훅 | 메인 저장소 push 이벤트로 자연히 트리거(`workflow_dispatch` 현재 수동), REST/GraphQL API로 콘텐츠 완전 제어 가능 | **wiki→Actions**: `gollum` 이벤트로 가능([Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#gollum)). **Actions→wiki**: 문서화된 토큰 스코프 없음(§2) |
| 발견성(디스커버리) | Pages 링크는 저장소 페이지의 외부 링크(About 섹션 등)일 뿐, 저장소 자체 nav 탭 아님 | 활성화 시 저장소 상단 **1급 nav 탭**("Wiki") — GitHub 방문자에게는 더 눈에 띔 |
| 외부 검색엔진(Google 등) 노출 | Pages는 일반 정적 사이트라 원칙적으로 색인 가능 | **원칙적으로 색인 안 됨** — 별 500개 이상 + 공개편집 제한 조건을 만족해야만([About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis)) |
| 저장소 검색 | 메인 저장소 코드 검색에 포함 | **분리된 wiki 전용 검색**(`in:wiki` qualifier, [Searching wikis](https://docs.github.com/en/search-github/searching-on-github/searching-wikis)) |
| REST/GraphQL API | 메인 저장소 Contents API로 완전 제어 | **없음**([REST API reference](https://docs.github.com/en/rest)에 카테고리 부재) |
| 접근 제어 세밀도 | 저장소 권한·브랜치 보호 규칙 전체 적용 | on/off 토글 하나뿐 — 브랜치 보호 규칙과 무관([About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)에 wiki 언급 없음) |

---

## 4. 판정

**도입하지 않는다.** 좁은 조건부 예외 하나만 남긴다.

### 왜 중복이 아니라 "손해"에 가까운가

단순 중복(있어도 그만, 없어도 그만)이라면 "선호 문제"로 남겨둘 수 있지만, 이 조사에서 확인된 사실들은 **네이티브 Wiki를 병행하면 기존 설계보다 명백히 나빠지는 축**을 여럿 보여준다.

1. **정본이 쪼개진다, 그것도 자동 동기화 없이.** caseCollection의 문서화 원칙(`CLAUDE.md`)은 이미 "결정 기록은 wayfinder 티켓의 `## Resolution`", "`MAP.md`는 색인이지 정본이 아니다"처럼 **단일 정본 원칙**을 명시적으로 지킨다. `openwiki/`가 메인 저장소 히스토리 안에 있는 것 자체가 이 원칙의 연장이다. Wiki를 추가하면 콘텐츠가 같은 주제를 다루는 **두 번째 git 저장소**에 생기는데, Actions→wiki 자동 푸시가 문서화되지 않은 상태(§2)이므로 "OpenWiki 갱신 → Wiki도 자동 갱신"을 안정적으로 걸 방법이 없다. 결국 사람이 두 곳에 수동으로 반영해야 하고, 어긋나는 순간 "어느 쪽이 맞나"라는 새로운 질문이 생긴다.
2. **PR 리뷰가 빠지는 게 이 프로젝트에는 손실이다.** 1인 유지보수 프로젝트라 "리뷰어가 없다"는 반론이 가능하지만, 이 저장소는 실제로 Codex 협업(`docs/agents/codex-collab.md`)과 커밋 단위 diff 추적을 적극 활용한다. Wiki는 diff·blame·리버트가 일반 git 도구로는 되지만 **GitHub UI 상의 PR 흐름·CI 게이트에 자연히 걸리지 않는다** — 지금 Pages 배포 파이프라인이 `schema:check`/`smoke:ci`/`typecheck`/`build`를 게이트로 거는 것과 대비되는, 검증되지 않는 직결 채널이 하나 늘어나는 것.
3. **검색엔진 노출이라는 잠재적 장점이 이 프로젝트 규모에서는 무효화된다.** "GitHub 저장소 방문자에게 nav 탭으로 더 잘 보인다"는 장점은 있지만, 외부 검색엔진 색인은 별 500개 이상이라는 문턱 때문에 사실상 닫혀 있다(§1). 즉 Wiki의 발견성 이점은 "이미 저장소를 찾아온 사람"에게만 적용되고, 그런 사람은 About 섹션의 Pages 링크로도 충분히 닿는다.
4. **커스텀 도메인·API 제어권이 없다.** Pages는 이미 CNAME 확장 여지가 있고 REST API로 완전히 프로그래밭틱하게 다룰 수 있다. Wiki는 두 가지 다 안 된다(§1, §3) — 나중에 배포 자동화를 더 정교하게 만들 때 Wiki 쪽은 항상 "수동 git push 아니면 방법이 없다"는 병목으로 남는다.

### 유일하게 남기는 조건부 예외

Wiki가 실제로 유리해지는 지점은 정확히 하나다 — **"git에 접근 권한이 없는 비기술 협업자가, PR도 clone도 없이 GitHub.com 로그인만으로 캐주얼한 메모를 즉시 편집해야 하는 상황."** 공개 저장소에서 "Restrict editing to collaborators only"를 끄면 **GitHub.com 계정만 있으면 누구나** 편집할 수 있다는 점([Changing access permissions for wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/changing-access-permissions-for-wikis))은 git 저장소 기반의 OpenWiki/티켓 트래커로는 재현할 수 없는 유일한 능력이다.

현재 caseCollection은 git 사용자가 사실상 1인(`MMDAL`)이고 `.scratch/` 이슈 트래커·OpenWiki 모두 이미 git 워크플로로 굴러가고 있어, "git 없이 편집해야 하는 사람"이 존재하지 않는다. 이 조건이 채워지지 않은 지금 Wiki를 켜면 위 4가지 손실만 발생하고 얻는 이점이 없다.

**재검토 트리거**: 나중에 git/PR에 익숙하지 않은 외부 협업자(예: 카피라이팅만 돕는 사람, 논-엔지니어 기획 협업자)가 생기고 그 사람이 승인 없이 빠르게 메모를 남길 채널이 필요해지면, 그때 **그 용도로만** 좁게 켜고 "정본은 여전히 `openwiki/`·티켓"이라는 원칙을 Wiki 첫 페이지에 명시하는 방식으로 재고할 것.

---

## 부록: 재현 방법

```bash
# gh CLI에 wiki 서브커맨드가 없음을 확인
gh --help                    # ADDITIONAL COMMANDS 목록에 wiki 없음
gh repo --help                # GENERAL/TARGETED 커맨드에 wiki 없음
gh repo create --help         # --disable-wiki 플래그만 존재 (생성 시 끄기 전용)

# wiki 저장소 클론 (공식 문서의 명령 그대로)
git clone https://github.com/OWNER/REPO.wiki.git

# REST API에 wiki 카테고리가 없음
# https://docs.github.com/en/rest 의 카테고리 목록을 직접 확인 (Actions/Issues/Pages/Pull Requests 등은 있고 Wikis는 없음)
```
