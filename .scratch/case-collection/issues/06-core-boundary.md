# OUT 코어 경계

Status: open
Labels: wayfinder:grilling
Assignee:
Blocked-by: 04

## Question

OUT에서 추출하는 코어의 경계는 어디인가. 시작 가설은 최소(생성된 위키 데이터 + `pd_wiki` 조회 레이어). [카드 스키마와 카드화 대상](04-card-schema.md)이 확정한 게임의 실제 데이터 요구를 기준으로, wiki-agent 생성 파이프라인·pg_downloader/pg_pd_filter·graphify 포함 여부를 결정한다. "책 추가 → 카드 풀 확장" 야망이 경계 안으로 들어오는지 여기서 판정.
