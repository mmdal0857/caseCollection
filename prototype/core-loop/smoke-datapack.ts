// PROTOTYPE smoke — 게임 데이터 팩 포맷·로더 (티켓 16의 프로토 검증 자산).
// 질문: 티켓 07·16이 정한 계약 — "base 팩 = 레포에 커밋된 공식 아티팩트, mod 팩 = 외부 로드,
// **동일 포맷**" — 이 실제 CONTENT로 성립하는가. 다섯 가지를 본다:
//   A) envelope 검증 — 포맷 표식·버전·id 네임스페이스가 손상 팩을 걸러내는가
//   B) clue 형태 검증 — 카드·얼굴의 구조 불변식(facet key 규약 포함)이 기계 판정되는가
//   C) case 형태 검증 — pieces/slots 정합·조건부 정답·role frame이 기계 판정되는가
//   D) base 팩 왕복 — 실제 CONTENT를 팩으로 감싸 JSON 왕복해도 검증·병합·무결성이 성립하는가
//   E) 병합 우선순위 — mod가 base의 id를 상쇄(override)하고 새 id를 더하는 규칙 + 프로버넌스
//   F) 무결성 — 병합 후 깨진 참조(없는 카드를 가리키는 슬롯)를 잡아내는가
//   G) 스키마 동기화 — schema/game-data-pack.json의 enum이 코드의 어휘와 일치하는가
// 실행: npx esbuild smoke-datapack.ts --bundle --format=esm --platform=node --outfile=smoke-datapack.mjs && node smoke-datapack.mjs
import { readFileSync } from 'node:fs';
import { CONTENT } from './src/lib/content';
import type { CaseDef, ClueCard } from './src/lib/engine';
import {
  FRAMES, JOSA_KINDS, KINDS, PACK_FORMAT_VERSION, SUITS, TAGS,
  checkIntegrity, loadPacks, mergePacks, packFromContent,
  migrateV1BasePack, validateGameDataPack, validatePack,
  type GameDataPack,
} from './src/lib/datapack';

let failures = 0;
function check(label: string, ok: boolean, detail = ''): void {
  if (!ok) failures++;
  console.log(`[${label}] ${ok ? 'PASS' : 'FAIL'}${detail ? ` — ${detail}` : ''}`);
}

/** JSON 왕복 — 외부 파일에서 온 팩을 흉내낸다(타입 정보·undefined 소실). */
const roundtrip = (p: unknown): unknown => JSON.parse(JSON.stringify(p));

const fixtureProvenance = () => ({
  sourceSnapshotIds: ['fixture:test'],
  inputSha256: 'a'.repeat(64),
  validatorVersion: 'pack-v2',
  outputSha256: 'b'.repeat(64),
});

const minimal = (over: Record<string, unknown> = {}): unknown => ({
  format: 'game-data-pack',
  formatVersion: 2,
  id: 'mod.test',
  mergeMode: 'alongside',
  provenance: fixtureProvenance(),
  ...over,
});

console.log('=== A. envelope 검증 ===');
{
  check('A1 비객체 거부', !validateGameDataPack(null) && !validateGameDataPack('팩'));
  check('A2 최소 팩 통과', validateGameDataPack(minimal()));
  check('A3 format 표식 오류', !validateGameDataPack(minimal({ format: 'data-pack' })));
  const v = validatePack(minimal({ formatVersion: 3 }));
  check('A4 미래 버전 거부(이유 포함)', !v.ok && v.issues.some((i) => i.msg.includes('formatVersion')));
  check('A5 id 네임스페이스 규약', !validateGameDataPack(minimal({ id: 'Mod Pack!' })));
  check('A6 v2가 현재 버전', PACK_FORMAT_VERSION === 2);
  check('A7 v2 최소 팩 통과', validatePack(minimal()).ok);
  check(
    'A8 v1 외부 팩은 migration 요구',
    validatePack({ ...(minimal() as Record<string, unknown>), formatVersion: 1 }).issues
      .some((issue) => issue.code === 'LEGACY_PACK_REQUIRES_MIGRATION'),
  );
  const currentBase = packFromContent('base', CONTENT);
  const {
    mergeMode: _mergeMode,
    provenance: _provenance,
    promotionTargets: _promotionTargets,
    ...legacyFields
  } = currentBase;
  const legacyBase = { ...legacyFields, formatVersion: 1 };
  const migrated = await migrateV1BasePack(roundtrip(legacyBase));
  check('A9 v1 base → v2', migrated.ok && migrated.pack?.mergeMode === 'base');
  check(
    'A10 외부 v1은 migration 거부',
    !(await migrateV1BasePack({ ...legacyBase, id: 'mod.legacy' })).ok,
  );
}

console.log('\n=== B. clue 형태 검증 ===');
{
  const clue = (over: Partial<ClueCard> = {}): unknown => minimal({
    clues: {
      mod_card: {
        id: 'mod_card', name: '모드 카드', suit: 'physical', kind: '사물', tags: ['논리'],
        text: '테스트용.', facets: [{ key: 'mod_card:route', frame: 'route', meaning: '경로', tags: ['논리'], note: '메모' }],
        ...over,
      },
    },
  });
  check('B1 정상 clue 통과', validateGameDataPack(clue()));
  check('B2 record 키·id 불일치', !validateGameDataPack(minimal({ clues: { other: { id: 'mod_card' } } })));
  check('B3 미정의 suit', !validateGameDataPack(clue({ suit: 'psychic' as never })));
  check('B4 미정의 kind', !validateGameDataPack(clue({ kind: '유령' as never })));
  check('B5 미정의 tag', !validateGameDataPack(clue({ tags: ['초능력'] as never })));
  check('B6 얼굴 없는 카드 거부', !validateGameDataPack(clue({ facets: [] })));
  check('B7 facet key 규약 위반', !validateGameDataPack(clue({
    facets: [{ key: 'wrong:route', frame: 'route', meaning: 'x', tags: [], note: '' }],
  })));
  check('B8 facet frame 중복 거부', !validateGameDataPack(clue({
    facets: [
      { key: 'mod_card:route', frame: 'route', meaning: 'a', tags: [], note: '' },
      { key: 'mod_card:route', frame: 'route', meaning: 'b', tags: [], note: '' },
    ],
  })));
  check('B9 gate·needsPrev 형태', !validateGameDataPack(clue({
    facets: [{ key: 'mod_card:route', frame: 'route', meaning: 'x', tags: [], note: '', needsPrev: ['워프'] as never }],
  })));
  // 티켓 19 P0 검증기 요건 — smoke.ts 섹션 F(콘텐츠 로컬 린트)의 mod 팩 등가물.
  // 로더가 이걸 안 잡으면, 조사가 새는 mod 팩이 그대로 로드돼 정답 받침이 누출된다.
  check('B10 카드명 비한글 종결 거부', !validateGameDataPack({
    ...minimal(),
    clues: { card7: { id: 'card7', name: '단서7', suit: 'physical', kind: '사물', tags: [], text: 't',
      facets: [{ key: 'card7:route', frame: 'route', meaning: 'x', tags: [], note: '' }] } },
  }));
}

console.log('\n=== C. case 형태 검증 ===');
{
  const kase = (over: Partial<CaseDef> = {}): unknown => minimal({
    cases: [{
      id: 'mod_case', title: '모드 사건', intro: '…', pieces: ['', ''],
      slots: [{ id: 'm1', label: '슬롯', answer: 'mod_card', role: { frame: 'route' } }],
      patterns: ['locked-room'], guestClues: [], packPool: [],
      ...over,
    }],
  });
  check('C1 정상 case 통과', validateGameDataPack(kase()));
  check('C2 pieces/slots 정합(slots+1)', !validateGameDataPack(kase({ pieces: [''] })));
  check('C3 조건부 정답 형태', !validateGameDataPack(kase({
    slots: [{ id: 'm1', label: 'x', answer: { stat: 'karma', gte: 5, then: 'a', else: 'b' } as never }],
    pieces: ['', ''],
  })));
  check('C4 role frame 오류', !validateGameDataPack(kase({
    slots: [{ id: 'm1', label: 'x', answer: 'a', role: { frame: '음모' } as never }],
    pieces: ['', ''],
  })));
  check('C5 슬롯 id 중복', !validateGameDataPack(kase({
    slots: [
      { id: 'm1', label: 'x', answer: 'a' },
      { id: 'm1', label: 'y', answer: 'b' },
    ],
    pieces: ['', '', ''],
  })));
  check('C6 josaAfter 미정의 값 거부', !validateGameDataPack(kase({
    slots: [{ id: 'm1', label: 'x', answer: 'a', josaAfter: '이랑' as never }],
  })));
  check('C7 josaAfter 정상값 통과', validateGameDataPack(kase({
    slots: [{ id: 'm1', label: 'x', answer: 'a', josaAfter: '으로' }],
  })));
  // 티켓 19 P0 검증기 요건: 슬롯 직후 조각이 조사로 시작하는데 josaAfter 미지정 = 정답 받침 누출.
  check('C8 조사 누출 피스(josaAfter 미지정) 거부', !validateGameDataPack(kase({
    pieces: ['', '이 이렇게 됐다'],
  })));
  check('C9 조사 누출 피스(josaAfter 지정) 통과', validateGameDataPack(kase({
    pieces: ['', '이 이렇게 됐다'],
    slots: [{ id: 'm1', label: 'x', answer: 'mod_card', role: { frame: 'route' }, josaAfter: '이가' }],
  })));
}

console.log('\n=== D. base 팩 왕복 — 실제 CONTENT가 이 포맷으로 표현되는가 ===');
{
  const base = packFromContent('base', CONTENT);
  const json = roundtrip(base);
  const v = validatePack(json);
  check('D1 base 팩 검증 통과', v.ok, v.issues.slice(0, 3).map((i) => `${i.path}: ${i.msg}`).join(' / '));
  const { content } = mergePacks([base]);
  check('D2 병합 항등 — base 단독 병합 = CONTENT', JSON.stringify(content) === JSON.stringify(CONTENT));
  const issues = checkIntegrity(content);
  check('D3 CONTENT 참조 무결성', issues.length === 0, issues.slice(0, 3).map((i) => `${i.path}: ${i.msg}`).join(' / '));
}

console.log('\n=== E. 명시적 병합 정책 — alongside 추가와 promotion 상쇄 ===');
{
  const base = packFromContent('base', CONTENT);
  const makeV2Pack = (
    overrides: Partial<GameDataPack>,
  ): GameDataPack => ({
    format: 'game-data-pack',
    formatVersion: 2,
    id: 'mod.test',
    mergeMode: 'alongside',
    provenance: fixtureProvenance(),
    ...overrides,
  });
  const ghostBell: ClueCard = {
    ...CONTENT.clues.thread_fiber,
    id: 'mod.ghost.ghost_bell',
    name: '유령의 종',
    facets: CONTENT.clues.thread_fiber.facets.map((facet) => ({
      ...facet,
      key: `mod.ghost.ghost_bell:${facet.frame}`,
    })),
  };
  const alongside = makeV2Pack({
    id: 'mod.ghost',
    clues: {
      'mod.ghost.ghost_bell': ghostBell,
    },
  });
  const accidentalCollision = makeV2Pack({
    id: 'mod.ghost',
    clues: { thread_fiber: CONTENT.clues.thread_fiber },
  });
  const promotion = makeV2Pack({
    id: 'mod.promote',
    mergeMode: 'promotion',
    promotionTargets: [{
      kind: 'clue',
      id: 'thread_fiber',
      expectedSourcePack: 'base',
    }],
    clues: {
      thread_fiber: {
        ...CONTENT.clues.thread_fiber,
        name: '승격된 실',
      },
    },
  });

  const alongsideResult = loadPacks(roundtrip(base), [roundtrip(alongside)]);
  check(
    'E1 alongside 추가',
    alongsideResult.ok &&
      alongsideResult.content?.clues['mod.ghost.ghost_bell']?.name === '유령의 종',
  );
  const collisionResult = loadPacks(
    roundtrip(base),
    [roundtrip(accidentalCollision)],
  );
  check(
    'E2 alongside 충돌 거부',
    !collisionResult.ok &&
      collisionResult.issues.some((issue) => issue.code === 'MERGE_POLICY_INVALID'),
  );
  const promotionResult = loadPacks(roundtrip(base), [roundtrip(promotion)]);
  check(
    'E3 promotion 선언 상쇄',
    promotionResult.ok &&
      promotionResult.content?.clues.thread_fiber.name === '승격된 실',
  );
  check(
    'E4 미신고 promotion 충돌 거부',
    !loadPacks(
      roundtrip(base),
      [roundtrip({ ...promotion, promotionTargets: [] })],
    ).ok,
  );
  check(
    'E5 expectedSourcePack 불일치 거부',
    !loadPacks(
      roundtrip(base),
      [roundtrip({
        ...promotion,
        promotionTargets: [{
          kind: 'clue',
          id: 'thread_fiber',
          expectedSourcePack: 'mod.other',
        }],
      })],
    ).ok,
  );
  check(
    'E6 payload 없는 promotionTargets 거부',
    !loadPacks(
      roundtrip(base),
      [roundtrip({
        ...promotion,
        clues: {},
      })],
    ).ok,
  );
  check(
    'E7 pack ID 중복 거부',
    !loadPacks(
      roundtrip(base),
      [roundtrip(alongside), roundtrip({ ...alongside, clues: {} })],
    ).ok,
  );
}

console.log('\n=== F. 병합 후 무결성 — 깨진 참조를 잡는다 ===');
{
  const base = packFromContent('base', CONTENT);
  const broken: GameDataPack = {
    format: 'game-data-pack', formatVersion: 2, id: 'mod.broken',
    mergeMode: 'alongside',
    provenance: fixtureProvenance(),
    cases: [{
      id: 'mod.broken.bad_case', title: '깨진 사건', intro: '…', pieces: ['', ''],
      slots: [{ id: 'x1', label: '슬롯', answer: 'no_such_card', role: { frame: 'route' } }],
      patterns: ['locked-room'], guestClues: ['also_missing'], packPool: [],
    }],
  };
  const loaded = loadPacks(roundtrip(base), [roundtrip(broken)]);
  check('F1 없는 카드 참조 검출', !loaded.ok && loaded.issues.some((i) => i.msg.includes('no_such_card')));
  check('F2 guestClues 참조 검출', loaded.issues.some((i) => i.msg.includes('also_missing')));
}

console.log('\n=== G. 스키마 동기화 — JSON Schema의 enum = 코드의 어휘 ===');
{
  const schema = JSON.parse(readFileSync(new URL('./schema/game-data-pack.json', import.meta.url), 'utf-8'));
  const same = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
  check('G1 tag enum 일치', same(schema.$defs.tag.enum, TAGS));
  check('G2 suit enum 일치', same(schema.$defs.suit.enum, SUITS));
  check('G3 kind enum 일치', same(schema.$defs.kind.enum, KINDS));
  check('G4 frame enum 일치', same(schema.$defs.frame.enum, FRAMES));
  check('G5 josaKind enum 일치', same(schema.$defs.josaKind.enum, JOSA_KINDS));
}

console.log('\n=== H. Python emit → TypeScript loader 교차 검증 ===');
{
  const emitted = JSON.parse(readFileSync(
    new URL(
      '../../scripts/tests/fixtures/extraction/emitted-pack.json',
      import.meta.url,
    ),
    'utf-8',
  ));
  const loaded = loadPacks(packFromContent('base', CONTENT), [emitted]);
  check(
    'H1 emitted alongside 팩 로드',
    loaded.ok &&
      loaded.content?.clues[
        'extracted.fixture.fixture.time_gap'
      ]?.name === '시각의 공백',
    loaded.issues.map((issue) => `${issue.path}: ${issue.msg}`).join(' / '),
  );
}

console.log(`\n[datapack] ${failures === 0 ? 'PASS — 팩 계약이 기계 판정으로 성립' : `FAIL — ${failures}건`}`);
process.exit(failures === 0 ? 0 : 1);
