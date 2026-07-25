// PROTOTYPE — throwaway. 수제 시드 콘텐츠 (04 결정: 프로토용 태그 값은 수제 시드).
// 단서 20종(위키 clue_type 49의 축소 표본, id는 위키 스타일), 패턴 4종(실제 case_pattern id),
// case 3건 + 복합 패턴 보스. 모든 case는 스타터+게스트만으로 풀리도록 튜닝(어휘 게이트 보장).
import type { RunContent, SlotFrame, Tag } from './engine';
import type { Facet } from './facets';

// v10(티켓 17): 카드마다 **얼굴 목록**. facets[0] = 카드를 얻을 때 함께 아는 "명백한" 얼굴,
// 나머지는 게스트 대여·강한 링크 발견으로 열린다(12 §4 보유 ≠ 앎).
const F = (
  card: string,
  frame: SlotFrame,
  meaning: string,
  tags: Tag[],
  note: string,
  extra: Partial<Facet> = {},
): Facet => ({ key: `${card}:${frame}`, frame, meaning, tags, note, ...extra });

// 12 §7 "안전한 구석이 없다" — 극단으로 가면 실패가 아니라 **얼굴이 잠긴다**.
const NEEDS_NOISE = { stat: 'heat' as const, gte: 2, why: '너무 조용히 움직였다 — 이렇게 요란한 해석을 꺼낼 명분이 없다' };
const NEEDS_EDGE = { stat: 'trust' as const, lt: 8, why: '반이 너무 신중하다 — 이런 거친 해석은 결재가 나지 않는다' };

export const CONTENT: RunContent = {
  clues: {
    // ---- physical ----
    thread_fiber: {
      id: 'thread_fiber', name: '실·섬유 잔재', suit: 'physical', kind: '사물', tags: ['은밀'],
      text: '실 한 오라기는 외부에서 잠금을 조작한 경로다. 밀실은 실로 잠긴다.',
      // 12 §1의 대표 예시 — 밀실선 침입 도구, 투명인간선 신분 단서.
      facets: [
        F('thread_fiber', 'route', '침입 도구', ['은밀'], '실을 걸어 바깥에서 빗장을 당긴다. 밀실은 실로 잠긴다.',
          { line: '문은 안에서 잠겼다 — 실 한 오라기가 바깥에서 그것을 해냈다.' }),
        F('thread_fiber', 'trace', '접촉 증거', ['논리'], '스친 자리에만 남는다. 옷깃이 어디에 닿았는지의 지도.',
          { line: '누군가 여기 몸을 붙였다. 섬유가 그 자리를 기억한다.' }),
        F('thread_fiber', 'identity', '신분의 실마리', ['논리'], '이 실은 아무 옷에나 쓰지 않는다 — 특정한 제복의 것이다.',
          { needsPrev: ['omission', 'identity'], line: '보이지 않던 자의 윤곽이 실오라기 하나로 좁혀진다.' }),
      ],
    },
    mud_footprint: {
      id: 'mud_footprint', name: '진흙 발자국', suit: 'physical', kind: '사물', tags: ['공개'],
      text: '발자국은 체류의 증명 — 지워지지 않은 것은 서두름의 증거다.',
      facets: [
        F('mud_footprint', 'trace', '체류의 증명', ['공개'], '지워지지 않은 발자국은 서두름의 증거다.',
          { line: '그는 분명히 여기 서 있었다. 진흙이 증언한다.' }),
        F('mud_footprint', 'route', '이동 경로', ['공개'], '발끝의 방향이 어디서 와서 어디로 갔는지 말한다.',
          { line: '발끝이 가리키는 쪽으로 길이 열린다.' }),
        F('mud_footprint', 'scene', '연출된 자국', ['논리'], '너무 선명한 발자국은 남긴 것이 아니라 찍은 것이다.',
          { needsPrev: ['scene', 'omission'], line: '이 발자국은 걸어서 생기지 않았다 — 누군가 정성껏 찍었다.' }),
      ],
    },
    vent_gap: {
      id: 'vent_gap', name: '환기구 틈', suit: 'physical', kind: '사물', tags: ['논리'],
      text: '사람이 못 지나가는 틈도 무언가는 지나간다. 밀실의 고전적 허점.',
      facets: [
        F('vent_gap', 'route', '밀실의 허점', ['논리'], '사람은 못 지나가도 무언가는 지나간다.',
          { line: '밀실은 완벽하지 않았다. 천장 구석에 손가락 두 개 폭의 구멍이 있다.' }),
        F('vent_gap', 'means', '전달 통로', ['은밀'], '통로가 곧 흉기가 된다 — 무엇을 흘려보냈느냐의 문제.',
          { needsPrev: ['route'], gate: { stat: 'axis', gte: 4, why: '봉인이 아직 단단하다 — 이 틈이 무언가를 나른다는 해석이 서지 않는다' },
            line: '구멍은 길이 아니라 관이었다. 무언가가 이리로 흘러들었다.' }),
      ],
    },
    rope_mark: {
      id: 'rope_mark', name: '밧줄 마찰 자국', suit: 'physical', kind: '사물', tags: ['강압', '논리'],
      text: '마찰 자국의 방향은 힘이 어디서 왔는지 말한다.',
      facets: [
        F('rope_mark', 'means', '구속의 도구', ['강압'], '묶였다는 것은 저항했다는 것이다.',
          { line: '밧줄 마찰 자국 — 억지로 묶어둔 자취다.' }),
        F('rope_mark', 'trace', '힘의 방향', ['논리'], '마찰의 결이 힘이 어디서 왔는지 말한다.',
          { line: '자국의 결이 위를 향한다 — 힘은 아래에서 왔다.' }),
        F('rope_mark', 'route', '하강 경로', ['은밀'], '창밖으로 내려간 자의 무게가 여기 걸려 있다.',
          { needsPrev: ['route', 'trace'], line: '길은 문이 아니라 창이었다.' }),
      ],
    },
    ash_residue: {
      id: 'ash_residue', name: '벽난로의 재', suit: 'physical', kind: '사물', tags: ['은밀'],
      text: '태운 것은 숨기고 싶은 것이다. 재는 부주의한 고백이다.',
      facets: [
        F('ash_residue', 'trace', '소각의 흔적', ['은밀'], '태운 것은 숨기고 싶은 것이다.',
          { line: '재는 부주의한 고백이다.' }),
        F('ash_residue', 'record', '사라진 문서', ['논리'], '재의 두께가 몇 장이었는지 말한다.',
          { gate: { stat: 'heat', gte: 5, why: '세간이 조용하다 — 아직 태워 없앨 만큼 몰리지 않았다' },
            line: '태워진 것은 종이였다. 그것도 여러 장.' }),
        F('ash_residue', 'scene', '치워진 현장', ['신중'], '난롯가만 유독 깨끗한 방은 정리된 방이다.',
          { needsPrev: ['scene'] }),
      ],
    },
    scattered_belongings: {
      id: 'scattered_belongings', name: '흐트러진 소지품', suit: 'physical', kind: '사물', tags: ['공개'],
      text: '진짜 사고 현장은 정돈돼 있고, 연출된 현장은 어질러져 있다.',
      facets: [
        F('scattered_belongings', 'scene', '연출된 현장', ['공개'], '진짜 사고는 정돈돼 있고, 꾸민 현장은 어질러져 있다.',
          { line: '이 어질러짐에는 순서가 있다 — 누군가 연출했다.' }),
        F('scattered_belongings', 'trace', '몸싸움의 자취', ['공개'], '엎어진 방향이 힘의 궤적을 그린다.', { gate: NEEDS_NOISE }),
        F('scattered_belongings', 'omission', '빠진 물건', ['논리'], '어질러진 더미에서 **없는 것**이 답이다.',
          { needsPrev: ['scene', 'record'], line: '있어야 할 것이 없다. 그 빈자리가 이름을 부른다.' }),
      ],
    },
    // ---- behavioral ----
    omitted_witness: {
      id: 'omitted_witness', name: '증언에서 빠진 인물', suit: 'behavioral', kind: '사람', tags: ['논리'],
      text: '아무도 언급하지 않은 사람이 늘 그 자리에 있었다. Invisible Man의 원리.',
      facets: [
        F('omitted_witness', 'omission', '목격의 공백', ['논리'], '아무도 이름을 대지 않은 사람이 늘 거기 있었다.',
          { line: '증언 넷이 겹치는 자리에 이름 하나가 비어 있다.' }),
        F('omitted_witness', 'identity', '사회적 투명인간', ['은밀'], '보이지만 세어지지 않는 사람 — 가장 완벽한 은신.',
          { needsPrev: ['omission', 'identity'], line: '그는 숨지 않았다. 아무도 그를 손님으로 세지 않았을 뿐이다.' }),
        F('omitted_witness', 'motive', '잊힌 원한', ['강압'], '세어지지 않는 자에게는 세어지지 않은 억울함이 쌓인다.', { gate: NEEDS_EDGE }),
      ],
    },
    rehearsed_story: {
      id: 'rehearsed_story', name: '연습된 진술', suit: 'behavioral', kind: '행위', tags: ['신중'],
      text: '토씨까지 같은 진술은 기억이 아니라 대본이다.',
      facets: [
        F('rehearsed_story', 'action', '알리바이 장치', ['신중'], '토씨까지 같은 진술은 기억이 아니라 대본이다.',
          { line: '두 사람이 같은 문장을 말했다 — 기억은 그렇게 겹치지 않는다.' }),
        F('rehearsed_story', 'identity', '신분 위장', ['은밀'], '대본을 외운 자는 남의 인생을 연기하는 중이다.',
          { needsPrev: ['scene', 'identity', 'omission'], line: '그는 진술을 외운 게 아니라, 다른 사람이 되는 법을 외웠다.' }),
        F('rehearsed_story', 'omission', '합의된 침묵', ['강압'], '같은 대목에서 같이 말을 아낀다면 그건 약속이다.',
          { gate: NEEDS_EDGE, needsPrev: ['omission'] }),
      ],
    },
    sudden_wealth: {
      id: 'sudden_wealth', name: '갑작스러운 씀씀이', suit: 'behavioral', kind: '행위', tags: ['공개'],
      text: '돈의 출처가 없는 소비는 사건의 날짜를 가리킨다.',
      facets: [
        F('sudden_wealth', 'motive', '금전 동기', ['공개'], '출처 없는 소비는 사건의 날짜를 가리킨다.',
          { line: '그의 씀씀이가 바뀐 날짜가 사건의 날짜와 겹친다.' }),
        F('sudden_wealth', 'action', '사후의 처신', ['공개'], '일이 끝난 뒤에야 사람은 씀씀이를 못 참는다.', { gate: NEEDS_NOISE }),
        F('sudden_wealth', 'record', '자금의 흐름', ['논리'], '영수증이 남긴 선을 따라가면 계좌가 나온다.',
          { needsPrev: ['motive', 'record'] }),
      ],
    },
    night_errand: {
      id: 'night_errand', name: '심야의 심부름', suit: 'behavioral', kind: '행위', tags: ['은밀'],
      text: '매일 밤 같은 시각의 외출은 습관이 아니라 관리다 — 무언가를 먹이고 있다.',
      facets: [
        F('night_errand', 'action', '반복된 행동', ['은밀'], '매일 밤 같은 시각의 외출은 습관이 아니라 관리다.',
          { line: '같은 시각, 같은 문. 그는 무언가를 먹이고 있었다.' }),
        F('night_errand', 'route', '야간의 동선', ['은밀'], '밤마다 같은 길을 걸은 발이 지도를 그린다.',
          { needsPrev: ['route', 'trace'] }),
        F('night_errand', 'identity', '이중생활', ['은밀'], '밤의 일과가 낮의 사람과 다르면, 그는 두 사람이다.',
          { needsPrev: ['identity', 'scene'], line: '낮의 그와 밤의 그는 같은 사람이 아니었다.' }),
      ],
    },
    confronted_servant: {
      id: 'confronted_servant', name: '하인 추궁', suit: 'behavioral', kind: '행위', tags: ['강압'],
      text: '압박은 빠른 답을 주지만, 겁먹은 입은 진실보다 생존을 말한다.',
      facets: [
        F('confronted_servant', 'action', '압박 수사', ['강압'], '빠른 답을 주지만, 겁먹은 입은 진실보다 생존을 말한다.',
          { line: '그는 곧바로 불었다 — 너무 곧바로.' }),
        F('confronted_servant', 'omission', '겁먹은 침묵', ['강압'], '말하지 않은 대목이 그가 지키는 사람을 가리킨다.', { gate: NEEDS_EDGE }),
        F('confronted_servant', 'record', '받아낸 진술서', ['공개'], '서명된 종이는 법정에서 무겁고, 복도에서 가볍다.',
          { needsPrev: ['action'] }),
      ],
    },
    uniform_habit: {
      id: 'uniform_habit', name: '제복의 익명성', suit: 'behavioral', kind: '행위', tags: ['은밀', '논리'],
      text: '제복을 입은 사람은 목격되지만 기억되지 않는다. 사회적 투명인간.',
      facets: [
        F('uniform_habit', 'identity', '사회적 투명성', ['은밀', '논리'], '제복을 입은 사람은 목격되지만 기억되지 않는다.',
          { line: '배달부는 늘 거기 있었다. 아무도 그를 사람으로 세지 않았다.' }),
        F('uniform_habit', 'route', '출입의 자유', ['논리'], '제복은 열쇠다 — 어느 문이든 열어준다.',
          { needsPrev: ['identity'], line: '제복 앞에서 문은 잠기지 않는다.' }),
        F('uniform_habit', 'omission', '기억되지 않음', ['은밀'], '증언에서 빠지는 건 숨어서가 아니라 익숙해서다.',
          { needsPrev: ['identity', 'omission'] }),
      ],
    },
    // ---- documentary ----
    forged_ledger: {
      id: 'forged_ledger', name: '위조 장부', suit: 'documentary', kind: '기록', tags: ['논리', '신중'],
      text: '숫자의 거짓말은 필적보다 정직하다 — 맞춰보면 어긋난 날이 나온다.',
      facets: [
        F('forged_ledger', 'motive', '금전 동기', ['논리', '신중'], '맞춰보면 어긋난 날이 나온다. 그날이 이유다.',
          { line: '장부의 어긋난 하루가 사건의 이유를 적어두었다.' }),
        F('forged_ledger', 'record', '숫자의 거짓말', ['논리'], '숫자의 거짓말은 필적보다 정직하다.',
          { line: '고쳐 쓴 숫자는 고친 사람을 닮는다.' }),
        F('forged_ledger', 'action', '은폐 작업', ['은밀'], '장부를 고치는 데는 밤과 손과 이유가 필요하다.',
          { needsPrev: ['motive', 'record'] }),
      ],
    },
    torn_letter: {
      id: 'torn_letter', name: '찢긴 편지', suit: 'documentary', kind: '기록', tags: ['은밀'],
      text: '찢은 것은 부정이고, 남긴 조각은 미련이다. 조각은 맞춰진다.',
      facets: [
        F('torn_letter', 'record', '미련의 조각', ['은밀'], '찢은 것은 부정이고, 남긴 조각은 미련이다.',
          { line: '찢어놓고도 버리지 못했다. 조각은 맞춰진다.' }),
        F('torn_letter', 'motive', '감정의 동기', ['신중'], '돈이 아닌 이유는 늘 편지에 적혀 있다.'),
        F('torn_letter', 'omission', '지워진 이름', ['논리'], '찢긴 자리가 하필 이름 칸이라면, 그게 답이다.',
          { needsPrev: ['omission', 'record'], line: '찢긴 선이 정확히 이름을 지나간다.' }),
      ],
    },
    train_ticket: {
      id: 'train_ticket', name: '기차표 반쪽', suit: 'documentary', kind: '기록', tags: ['공개'],
      text: '표는 몸이 어디 있었는지의 물증 — 알리바이의 최대 적.',
      facets: [
        F('train_ticket', 'route', '이동 수단', ['공개'], '표는 몸이 어디 있었는지의 물증이다.',
          { line: '반쪽짜리 표가 두 도시를 한 줄로 잇는다.' }),
        F('train_ticket', 'record', '시간의 물증', ['공개'], '개찰 시각은 사람보다 정직하다.'),
        F('train_ticket', 'omission', '알리바이의 균열', ['논리'], '표가 말하는 시각과 진술이 말하는 시각 사이의 공백.',
          { needsPrev: ['route', 'record'],
            gate: { stat: 'axis', gte: 5, why: '아직 시간이 촉박하지 않다 — 이 어긋남은 눈에 띄지 않는다' },
            line: '표는 그가 거기 없었다고 말한다.' }),
      ],
    },
    insurance_policy: {
      id: 'insurance_policy', name: '거액의 보험 증서', suit: 'documentary', kind: '기록', tags: ['공개'],
      text: '수익자 란은 용의자 명단이다.',
      facets: [
        F('insurance_policy', 'motive', '수익자의 이름', ['공개'], '수익자 란은 용의자 명단이다.',
          { line: '수익자 란에 적힌 이름이 조용히 웃고 있다.' }),
        F('insurance_policy', 'record', '계약의 물증', ['신중'], '서명과 날짜가 있는 종이는 반박하기 어렵다.'),
        F('insurance_policy', 'scene', '연출의 목적', ['논리'], '시신 없는 실종에 보험이 걸려 있으면, 그게 연출의 이유다.',
          { needsPrev: ['scene', 'motive'], line: '이 실종은 사고가 아니라 청구서였다.' }),
      ],
    },
    // ---- forensic ----
    // venom_trace에 route 얼굴은 **일부러 없다** — "독이 제 발로 문을 열고 들어왔나" 개그를 살린다.
    venom_trace: {
      id: 'venom_trace', name: '독물 흔적', suit: 'forensic', kind: '사물', tags: ['신중'],
      text: '독은 흉기 없는 살인 — 주입 자국의 위치가 경로를 말한다.',
      facets: [
        F('venom_trace', 'means', '흉기 없는 살인', ['신중'], '독은 손을 대지 않고 죽이는 법이다.',
          { line: '흉기는 없었다. 필요하지 않았으니까.' }),
        F('venom_trace', 'trace', '주입 자국', ['논리'], '자국의 각도가 손이 어디서 왔는지 말한다.'),
      ],
    },
    tod_gap: {
      id: 'tod_gap', name: '사망 시각의 공백', suit: 'forensic', kind: '현상', tags: ['논리'],
      text: '진술과 검시가 어긋나는 시간대 — 그 공백에 범행이 산다.',
      facets: [
        F('tod_gap', 'omission', '시간의 공백', ['논리'], '진술과 검시가 어긋나는 시간대에 범행이 산다.',
          { line: '검시가 말한 시각은 막이 오르기 한참 전이다.' }),
        F('tod_gap', 'record', '검시의 반증', ['신중'], '검시 소견서는 증인보다 흔들리지 않는다.'),
      ],
    },
    handwriting_match: {
      id: 'handwriting_match', name: '필적 일치', suit: 'forensic', kind: '현상', tags: ['신중'],
      text: '글씨는 변장을 못 한다. 눌러 쓴 획이 서명이다.',
      facets: [
        F('handwriting_match', 'record', '서명의 증명', ['신중'], '글씨는 변장을 못 한다. 눌러 쓴 획이 서명이다.',
          { line: '두 종이의 획이 같은 손을 가리킨다.' }),
        F('handwriting_match', 'identity', '위장의 균열', ['논리'], '이름을 바꿔도 손버릇은 못 바꾼다.',
          { needsPrev: ['identity', 'record'], line: '새 이름 아래에 옛 손이 남아 있다.' }),
      ],
    },
    burned_note: {
      id: 'burned_note', name: '복원된 탄 쪽지', suit: 'forensic', kind: '기록', tags: ['은밀'],
      text: '태워도 눌린 자국은 남는다. 재에서 문장이 돌아온다.',
      facets: [
        F('burned_note', 'record', '재에서 온 문장', ['은밀'], '태워도 눌린 자국은 남는다.',
          { line: '재 속에서 문장 하나가 돌아왔다.' }),
        F('burned_note', 'motive', '태운 이유', ['논리'], '무엇을 태웠는지보다 왜 태웠는지가 답이다.',
          { needsPrev: ['record', 'motive'] }),
      ],
    },
  },

  patterns: {
    'locked-room':          { id: 'locked-room',          name: '밀실',        text: '밀실은 방의 문제가 아니라 "들어가지 않고 죽이는 법"의 문제다.' },
    'false-alibi':          { id: 'false-alibi',          name: '거짓 알리바이', text: '알리바이는 시간의 트릭 — 부러뜨릴 곳은 진술이 아니라 시계다.' },
    'invisible-man':        { id: 'invisible-man',        name: '투명인간',    text: '가장 완벽한 은신은 보이지만 기억되지 않는 것이다.' },
    'staged-disappearance': { id: 'staged-disappearance', name: '연출된 실종', text: '실종이 연출이라면, 남겨진 물건들이 대본이다.' },
  },

  hintDefs: {
    analysis: { id: 'analysis', name: '감식 의뢰', desc: '채운 슬롯 하나의 정오 판정 (주목 +1)', heatCost: 1 },
    tipoff:   { id: 'tipoff',   name: '익명 제보', desc: '슬롯 하나의 정답 슈트를 귀띔', heatCost: 0 },
  },

  cases: [
    {
      id: 'c1',
      title: '온실의 밀실',
      intro: '재계 인사가 안에서 잠긴 온실에서 숨진 채 발견됐다. 문도 창도 잠겨 있었고, 열쇠는 피해자의 주머니 속에 있었다.',
      // ticket 19: 슬롯 직후 리터럴 조사 금지 — josaAfter가 배치된 카드 기준으로 동적 계산한다.
      pieces: [
        '범인은 방에 들어가지 않았다. ',
        ' 통로가 되었고, ',
        ' 피해자를 죽였다. ',
        ' 수단의 이동 경로를 증명하며, ',
        ' 범인의 오랜 준비를 드러낸다.',
      ],
      slots: [
        { id: 'c1s1', label: '침입 경로',    answer: 'vent_gap',    hit: '환기구 틈 — 사람은 못 지나도 독은 지나간다. 밀실은 깨졌다.', role: { frame: 'route' }, josaAfter: '이가' },
        { id: 'c1s2', label: '살해 수단',    answer: 'venom_trace', hit: '주입 자국의 각도가 외부에서 온 손을 가리킨다.', role: { frame: 'means' }, josaAfter: '이가' },
        { id: 'c1s3', label: '물리적 흔적',  answer: 'thread_fiber', role: { frame: 'trace', noun: '흔적' }, josaAfter: '이가' },
        { id: 'c1s4', label: '행동 단서',    answer: 'night_errand', role: { frame: 'action' }, josaAfter: '이가' },
      ],
      patterns: ['locked-room'],
      guestClues: ['vent_gap', 'night_errand'],
      // 12 §4: 게스트는 카드뿐 아니라 **얼굴도** 빌려준다.
      // 실·섬유는 이미 갖고 있지만 "침입 도구"로만 알고 있다 — 이 사건이 "접촉 증거"를 가르친다.
      guestFacets: ['thread_fiber:trace'],
      axis: { id: 'seal', label: '봉인', low: '단단함', high: '허술함', init: 2, drivenBy: '논리',
        hint: '논리적 해석을 쌓을수록 밀실의 봉인이 허술해 보이기 시작한다.' },
      packPool: ['ash_residue', 'sudden_wealth', 'insurance_policy'],
      misfits: {
        c1s1: {
          venom_trace: '독이 제 발로 문을 열고 들어왔다는 건가? 침입 경로부터 틀렸다.',
          mud_footprint: '발자국? 이 방은 드나든 자취가 없어 밀실이라 부른다. 자네가 지금 하나 만들었군.',
          train_ticket: '기차표가 온실 자물쇠를 땄다? 레이든은 관자놀이를 눌렀다.',
        },
        c1s2: {
          thread_fiber: '실오라기로 사람을 죽였다 — 목을 졸랐나, 아니면 수의를 지었나?',
          omitted_witness: '없는 사람이 흉기라니. 유령 재판이라도 열 셈인가.',
        },
        c1s3: {
          omitted_witness: '그건 흔적이 아니라 사람일세. 손에 쥘 수 있는 걸 가져오게.',
        },
        c1s4: {
          train_ticket: '온실에서 죽었는데 기차표라. 피해자가 통근이라도 했나?',
        },
      },
    },
    {
      id: 'c2',
      title: '부두 창고의 알리바이',
      teaser: '항구 쪽 창고에서 야간 경비가 죽었다. 용의자에겐 극장 표 한 장이 있다 — 너무 완벽한 알리바이.',
      intro: '야간 경비가 창고에서 살해됐다. 유력 용의자는 그 시각 시내 극장에 있었다고 주장한다 — 표까지 있다.',
      contextHint: '수첩 메모: 세간의 주목이 뜨거워지면(주목 5+) 범인은 종이를 태운다.',
      // '에서'·'에'는 받침 무관 불변 조사라 누출이 아니다 — 그대로 둔다.
      pieces: [
        '극장 알리바이는 ',
        '에서 무너진다. 범인은 ',
        ' 두 장소를 오갔고, ',
        ' 창고 체류를 증명한다. 동기는 ',
        '에 있고, ',
        ' 마지막 못을 박는다.',
      ],
      slots: [
        { id: 'c2s1', label: '알리바이의 균열', answer: 'tod_gap', hit: '검시가 말한 사망 시각은 극장 막이 오르기 한참 전이다. 알리바이가 시간을 잘못 짚었다.', role: { frame: 'omission', noun: '균열' } },
        { id: 'c2s2', label: '이동 수단',      answer: 'train_ticket', role: { frame: 'route' }, josaAfter: '으로' },
        { id: 'c2s3', label: '체류의 증거',    answer: 'mud_footprint', role: { frame: 'trace', noun: '자취' }, josaAfter: '이가' },
        { id: 'c2s4', label: '동기',           answer: 'forged_ledger', role: { frame: 'motive', noun: '동기' } },
        { id: 'c2s5', label: '결정적 증거',    answer: { stat: 'heat', gte: 5, then: 'burned_note', else: 'torn_letter' }, role: { frame: 'record' }, josaAfter: '이가' },
      ],
      patterns: ['false-alibi'],
      guestClues: ['forged_ledger', 'burned_note'],
      guestPattern: 'false-alibi',
      axis: { id: 'clock', label: '시간', low: '여유', high: '촉박', init: 3, drivenBy: '공개',
        hint: '떠들썩하게 움직일수록 시계가 빨리 간다 — 촉박해져야 보이는 어긋남이 있다.' },
      packPool: ['confronted_servant', 'handwriting_match', 'rope_mark'],
      misfits: {
        c2s1: {
          sudden_wealth: '흥청망청 쓴 건 맞아. 하지만 씀씀이는 알리바이의 시계를 되돌리지 못하네.',
          venom_trace: '독으로 알리바이를 깬다? 시간이 문제지 흉기가 문제가 아닐세.',
        },
        c2s2: {
          venom_trace: '독을 타고 두 장소를 오갔다? 자네 지금 독을 교통편으로 부르는군.',
          omitted_witness: '없는 사람은 이동도 안 하네.',
        },
        c2s4: {
          train_ticket: '기차표가 사람을 죽일 동기가 되나? 표값이 그렇게 비쌌나.',
        },
        c2s5: {
          mud_footprint: '진흙 발자국으로 알리바이의 마지막 못을 박는다기엔… 발이 좀 약하다.',
        },
      },
    },
    {
      id: 'c3',
      title: '사라진 은행가',
      teaser: '한 은행가가 강가에서 감쪽같이 사라졌다. 남은 건 강물에 뜬 외투 한 벌뿐 — 정말 빠진 걸까.',
      intro: '은행가가 아편굴 2층 창가에서 목격된 뒤 증발했다. 방엔 걸인 한 명뿐이었고, 창밖 강물에서 그의 외투가 건져졌다.',
      contextHint: '수첩 메모: 주목이 뜨거우면(주목 5+) 목격자들은 입을 다문다 — 증언의 구멍을 봐야 한다.',
      pieces: [
        '강에서 건진 외투와 ',
        ' 납치가 아니라 연출을 말한다. 그는 ',
        ' 다른 사람이 되었고, ',
        ' 이유를, ',
        ' 이중생활을 증명한다. 마지막 열쇠는 ',
        '.',
      ],
      slots: [
        { id: 'c3s1', label: '연출된 현장',     answer: 'scattered_belongings', hit: '진짜 사고는 정돈돼 있고, 꾸민 현장은 어질러져 있다. 이건 연출이다.', role: { frame: 'scene' }, josaAfter: '은는' },
        { id: 'c3s2', label: '신분 위장',       answer: 'rehearsed_story', role: { frame: 'identity', avoidTags: ['공개'], quality: '위장' }, josaAfter: '으로' },
        { id: 'c3s3', label: '금전 동기',       answer: 'forged_ledger', role: { frame: 'motive', noun: '동기' }, josaAfter: '이가' },
        { id: 'c3s4', label: '이중생활의 흔적', answer: 'night_errand', role: { frame: 'action' }, josaAfter: '이가' },
        { id: 'c3s5', label: '목격의 공백',     answer: { stat: 'heat', gte: 5, then: 'omitted_witness', else: 'tod_gap' }, role: { frame: 'omission', noun: '공백' }, josaAfter: '이다' },
      ],
      patterns: ['staged-disappearance'],
      guestClues: ['scattered_belongings'],
      guestPattern: 'staged-disappearance',
      // "연습된 진술"을 [신분 위장]으로 읽는 법을 이 사건이 가르친다 —
      // 단, 그 얼굴은 앞 슬롯이 [연출된 현장]으로 잠겨야 열린다(needsPrev). 포석이 강제되는 지점.
      guestFacets: ['rehearsed_story:identity'],
      axis: { id: 'testimony', label: '증언 일관성', low: '엇갈림', high: '입 맞춤', init: 4, drivenBy: '신중',
        hint: '신중하게 다룰수록 증언이 매끄러워진다 — 매끄러운 증언은 대본일 수 있다.' },
      packPool: ['ash_residue', 'sudden_wealth', 'insurance_policy', 'confronted_servant', 'handwriting_match', 'rope_mark'],
      misfits: {
        c3s1: {
          venom_trace: '독은 사람을 죽이지 사라지게 하진 않아. 이 사건엔 아직 시체가 없네.',
          thread_fiber: '실오라기 하나로 실종을 연출한다? 무대가 너무 초라하군.',
        },
        c3s2: {
          mud_footprint: '발자국은 그가 있었다는 증거지, 다른 사람이 됐다는 증거가 아닐세.',
        },
        c3s4: {
          insurance_policy: '보험 증서는 동기 쪽이야. 이중생활의 흔적은 밤마다 반복된 행동에서 찾게.',
        },
      },
    },
    {
      id: 'boss',
      title: '보이지 않는 배달부',
      teaser: '눈 덮인 저택, 사라진 표적, "아무도 안 왔다"는 네 증인. 그런데 눈 위엔 발자국이 있다 — 두 개의 트릭이 겹친 사건.',
      intro: '눈 쌓인 저택에서 협박장을 받던 인사가 사라졌다. 네 명의 증인은 "아무도 드나들지 않았다"고 입을 모은다 — 그러나 눈 위엔 발자국이 있다. 두 개의 골격이 겹친 사건이다.',
      contextHint: '수첩 메모: 주목 5+ — 범인은 조심스러워지고(흔적은 섬유만), 종이는 태워진다.',
      // b4·b6은 조건부 정답의 받침이 갈리는 슬롯 — 정적 조사로는 저작 자체가 불가능했던 지점(ticket 19).
      pieces: [
        '증인들은 거짓말하지 않았다 — ',
        ' 그들의 눈을 가렸다. ',
        ' 범인을 풍경으로 만들었고, ',
        ' 완벽한 부재를 연출했다. 그러나 ',
        ' 남았다. ',
        ' 동기를 말하고, ',
        ' 사건을 끝낸다.',
      ],
      slots: [
        { id: 'b1', label: '목격의 맹점',      answer: 'omitted_witness', hit: '아무도 이름을 대지 않은 사람 — 늘 거기 있었지만 아무도 그를 "손님"으로 세지 않았다.', role: { frame: 'omission', noun: '맹점' }, josaAfter: '이가' },
        { id: 'b2', label: '사회적 투명성',    answer: 'uniform_habit', hit: '제복. 배달부는 목격되지만 기억되지 않는다. 그게 완벽한 은신이다.', role: { frame: 'identity', avoidTags: ['공개'], quality: '투명함' }, josaAfter: '이가' },
        { id: 'b3', label: '알리바이 장치',    answer: 'rehearsed_story', role: { frame: 'action' }, josaAfter: '이가' },
        { id: 'b4', label: '남겨진 물리 흔적', answer: { stat: 'heat', gte: 5, then: 'thread_fiber', else: 'mud_footprint' }, role: { frame: 'trace', noun: '흔적' }, josaAfter: '이가' },
        { id: 'b5', label: '금전 동기',        answer: 'forged_ledger', role: { frame: 'motive', noun: '동기' }, josaAfter: '이가' },
        { id: 'b6', label: '결정적 증거',      answer: { stat: 'heat', gte: 5, then: 'burned_note', else: 'torn_letter' }, role: { frame: 'record' }, josaAfter: '이가' },
      ],
      patterns: ['invisible-man', 'false-alibi'],
      guestClues: ['uniform_habit'],
      guestPattern: 'invisible-man',
      axis: { id: 'traffic', label: '인적', low: '한산', high: '붐빔', init: 3, drivenBy: '공개',
        hint: '떠들썩할수록 저택에 사람이 몰린다 — 붐빌수록 한 사람쯤 세지 않고 넘어간다.' },
      packPool: [],
      misfits: {
        b1: {
          venom_trace: '독 얘기가 아닐세. 네 증인이 왜 같은 거짓을 말하는지, 그 구멍을 보게.',
        },
        b2: {
          scattered_belongings: '어질러진 물건이 사람을 투명하게 만들진 않아. 누가 눈에 안 띄었는지를 묻게.',
          sudden_wealth: '눈에 띄는 씀씀이는 투명성의 정반대일세.',
        },
        b5: {
          uniform_habit: '제복은 은신이지 동기가 아닐세. 돈의 출처를 다시 보게.',
        },
      },
    },
  ],

  // 순서 평가 — 첫 매칭만 발동. BAD 게이트가 최우선.
  // v10(12 §7): **등급형** — 죽는 방향은 둘(공개 과다·강압 과다)이고, 그 아래 "아프지만 생존" 밴드가
  // 마지막 경고를 준다. 은밀·신중 극단은 죽지 않는 대신 **얼굴이 잠긴다**(안전한 구석 없음).
  interludeEvents: [
    {
      id: 'bad-press',
      cond: { heatGte: 8 },
      title: '언론 재판',
      desc: '',
      bad: {
        title: 'BAD — 언론 재판',
        desc: '수사는 신문 1면에서 끝났다. 떠들썩한 보도 속에 진범은 짐을 쌌고, 항구에는 어젯밤 배가 한 척 떠났다. 이번 run은 여기서 끝난다.',
      },
    },
    {
      // 죽는 방향 둘째(12 §7 신규) — 기존엔 신뢰 저하가 잔소리 이벤트에 그쳤다.
      id: 'bad-collapse',
      cond: { trustLt: 1 },
      title: '수사반 붕괴',
      desc: '',
      bad: {
        title: 'BAD — 수사반 붕괴',
        desc: '거친 수사가 반을 갈랐다. 조서에 서명할 사람이 남지 않았고, 자네 책상은 오늘부로 비워진다. 이번 run은 여기서 끝난다.',
      },
    },
    {
      // "아프지만 생존" 밴드 — 반드시 예고한다(보이는 위험은 전략, 안 보이는 위험은 함정).
      id: 'last-warning',
      cond: { heatGte: 6 },
      title: '편집장의 최후통첩',
      desc: '신문사가 자네 이름을 1면에 올릴 준비를 마쳤다. 한 발만 더 시끄러워지면(주목 8+) 수사는 언론 재판으로 끝난다. 이건 마지막 경고다.',
      investigation: [
        { id: 'deal', label: '데스크와 거래를 튼다', reveal: '"조용히 넘겨주면 하루는 벌어드리지." 신문은 하루 늦출 수 있다 — 대신 다음 사건은 조용한 해석으로 풀어야 한다.', isHint: true },
      ],
      choices: [
        { id: 'retract', label: '기사를 물린다', effects: { heat: -3, trust: -1 }, result: '한 발 물러섰다. 지면은 식었지만 반장은 자네가 겁먹었다고 적었다. (주목 -3, 신뢰 -1)' },
        { id: 'ride',    label: '버틴다',        effects: { heat: 1 },            result: '버텼다. 내일 아침 신문이 어떻게 나올지는 아무도 모른다. (주목 +1)' },
      ],
    },
    {
      // 은밀 극단 — 실패가 아니라 **얼굴 잠김**. 죽지 않지만 쓸 수 있는 해석이 마른다.
      id: 'too-quiet',
      cond: { heatLte: 1 },
      title: '너무 조용한 수사',
      desc: '아무도 이 사건을 모른다. 그래서 아무도 협조하지 않는다. 요란한 해석([몸싸움의 자취]·[사후의 처신] 같은)은 꺼낼 명분이 없어 잠겨 있다 — 조용한 구석은 안전하지만, 거기서는 풀 수 없는 사건이 있다.',
      investigation: [
        { id: 'leak', label: '한 줄만 흘려본다', reveal: '작은 기사 한 줄로도 증인 몇은 입을 연다. 주목을 올리면 잠긴 얼굴이 열린다 — 위험은 그 다음 문제다.', isHint: true },
      ],
      choices: [
        { id: 'leak-it', label: '소문을 흘린다',   effects: { heat: 2 },  result: '거리에 이야기가 돌기 시작했다. 잠겼던 해석이 하나둘 열린다. (주목 +2)' },
        { id: 'stay',    label: '계속 조용히 간다', effects: { trust: 1 }, result: '반장은 만족했다. 자네의 어휘는 여전히 좁다. (신뢰 +1)' },
      ],
    },
    {
      id: 'press-swarm',
      cond: { heatGte: 5 },
      title: '기자들이 몰려든다',
      desc: '사건이 신문에 났다. 편집장들이 수사 상황을 내놓으라 아우성이다. 주목이 이대로 끓어오르면(8+) 수사는 끝장이다.',
      investigation: [
        { id: 'morgue',   label: '기사 스크랩을 뒤진다', reveal: '한 기자가 다음 표적을 미리 알고 있었다. 언론이 뜨거우면 목격자들이 겁을 먹고 입을 다문다 — 다음 사건은 증언의 구멍부터 봐야 한다.', isHint: true },
        { id: 'street',   label: '거리의 소문을 듣는다', reveal: '항구 노동자들이 "요즘 밤마다 배가 조용히 뜬다"고 수군댄다. 도주로가 열려 있다는 뜻이다.' },
      ],
      choices: [
        { id: 'briefing',  label: '공개 브리핑',   effects: { heat: -3, trust: -1 }, result: '기자들은 만족했지만, 반장은 "수사를 신문에 파느냐"며 얼굴을 굳혔다. (주목 -3, 신뢰 -1)' },
        { id: 'rebut',     label: '증거로 반박한다', requires: { tag: '논리', count: 2 }, effects: { heat: -3, trust: 1 }, result: '검증된 논리 단서들을 내밀자 추측 기사가 사그라들었다. 반장이 고개를 끄덕인다. (주목 -3, 신뢰 +1)' },
        { id: 'ignore',    label: '무대응',        effects: { heat: 1 }, result: '침묵은 새 추측 기사를 낳았다. (주목 +1)' },
      ],
    },
    {
      id: 'chief-favor',
      cond: { trustGte: 6 },
      title: '반장의 신임',
      desc: '조용하고 착실한 수사가 윗선의 눈에 들었다. 반장이 감식반 의뢰권을 내민다.',
      investigation: [
        { id: 'files',  label: '반장의 미결 서류를 넘겨본다', reveal: '다음 사건 파일이 눈에 띈다 — 완벽한 알리바이일수록 시간을 의심하라는 반장의 붉은 메모가 적혀 있다.', isHint: true },
        { id: 'archive', label: '옛 사건 기록을 대조한다',    reveal: '비슷한 수법이 20년 전에도 있었다. 사망 시각의 공백이 열쇠였다.', isHint: true },
      ],
      choices: [
        { id: 'take',    label: '받는다',   effects: { gainHint: 'analysis' }, result: '감식 의뢰권 1장을 얻었다.' },
        { id: 'decline', label: '사양한다', effects: { heat: -1 }, result: '"필요 없습니다." 겸손이 소문을 잠재웠다. (주목 -1)' },
      ],
    },
    {
      // 붕괴 직전 경고 밴드 — "아프지만 생존"(12 §7). 신뢰 0이 되면 위의 bad-collapse가 먼저 잡는다.
      id: 'doubt',
      cond: { trustLt: 3 },
      title: '수사반의 회의감',
      desc: '거친 수사가 이어지자 반 내부에서 회의감이 돈다. 협조가 굼떠지고 있다.',
      investigation: [
        { id: 'partner', label: '동료 형사를 붙잡고 캔다',  reveal: '"자네 방식이 거칠어서 다들 몸을 사려." 협조가 굼뜨면 다음 사건의 목격자도 입을 열지 않는다.', isHint: true },
        { id: 'desk',    label: '책상 위 쪽지를 살핀다',    reveal: '누군가 남긴 낙서: "연출된 현장은 늘 너무 어질러져 있다." 무슨 뜻인지는 아직 모른다.' },
      ],
      choices: [
        { id: 'report', label: '성과를 보고한다', effects: { trust: 2, heat: 1 }, result: '보고서가 회의감을 눌렀지만, 복도 밖으로 말이 샜다. (신뢰 +2, 주목 +1)' },
        { id: 'quiet',  label: '묵묵히 계속한다', effects: {}, result: '말 대신 일로 답하기로 했다. 변한 것은 없다.' },
      ],
    },
    {
      id: 'tip-letter',
      cond: 'default',
      title: '익명의 제보 편지',
      desc: '서명 없는 편지가 책상에 놓여 있다. 발신인 불명 — 다음 사건에 관한 것일지도 모른다.',
      investigation: [
        { id: 'read',    label: '편지를 곱씹어 읽는다',   reveal: '"당신이 찾는 사람은 늘 눈앞에 있었소." 다음 사건은 보이지만 기억되지 않는 자를 조심하라는 경고 같다.', isHint: true },
        { id: 'envelope', label: '봉투를 살핀다',         reveal: '봉투 안쪽에 실오라기 하나가 붙어 있다. 발신인은 조심스러운 사람이다.' },
      ],
      choices: [
        { id: 'open', label: '열어본다',   effects: { gainHint: 'tipoff' }, result: '익명 제보 1장을 얻었다. 출처는 끝내 알 수 없었다.' },
        { id: 'burn', label: '태워버린다', effects: { heat: -1 }, result: '출처 불명의 호의는 사양한다. 조용한 수사가 이어졌다. (주목 -1)' },
      ],
    },
  ],

  // 템포·행동 경제: AP 3 — 조사 리드(각 1) + 아래 행동들. 전부는 못 한다.
  interludeAP: 3,
  interludeActions: [
    { id: 'report', label: '보고서 정리', desc: '신뢰 +1', cost: 1, effects: { trust: 1 }, once: true },
    { id: 'hush',   label: '소문 잠재우기', desc: '주목 -2', cost: 2, effects: { heat: -2 }, once: true },
    { id: 'buy_tip', label: '정보원 매수', desc: '익명 제보 1장', cost: 2, effects: { gainHint: 'tipoff' }, once: true },
    { id: 'lab',    label: '감식반 요청', desc: '감식 의뢰 1장', cost: 3, effects: { gainHint: 'analysis' }, once: true },
  ],

  starterClues: [
    'thread_fiber', 'mud_footprint',
    'omitted_witness', 'rehearsed_story',
    'torn_letter', 'train_ticket',
    'venom_trace', 'tod_gap',
    'confronted_servant', 'rope_mark',
  ],
  starterPatterns: ['locked-room'],
  starterHints: ['analysis', 'tipoff'],
  initial: { heat: 1, trust: 3 },

  // 임시 조합식: 확정된 카드의 태그가 배경 상태를 움직인다.
  tagDeltas: {
    공개: { heat: 1, trust: 0 },
    은밀: { heat: -1, trust: 0 },
    강압: { heat: 1, trust: -1 },
    신중: { heat: 0, trust: 1 },
    논리: { heat: 0, trust: 0 }, // 상태 불변 — 대신 인터루드 선택지를 연다
  },
  badHeat: 8,
};
