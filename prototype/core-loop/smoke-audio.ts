import spec from './audio/audio-spec.json';
import picks from './audio/audio-picks.json';
import manifest from './public/audio/audio-manifest.json';
import {
  AUDIO_MANIFEST_FORMAT,
  AUDIO_SETTINGS_KEY,
  createSilentAudioPort,
  validateAudioManifest,
  validateAudioSpec,
} from './src/lib/audio';
import { CONTENT } from './src/lib/content';
import {
  initGame,
  reduce,
  resolveAnswer,
  type Action,
} from './src/lib/engine';

function expect(ok: boolean, label: string): void {
  if (!ok) throw new Error(`[audio] FAIL — ${label}`);
  console.log(`[audio] PASS — ${label}`);
}

const validation = validateAudioSpec(spec);
expect(validation.ok, '오디오 spec 계약이 유효하다');
expect(
  spec.assets.filter((asset) => asset.role === 'music').length === 2 &&
    spec.assets.filter((asset) => asset.role === 'sfx').length === 7,
  '무보이스 범위는 instrumental loop 2개와 의미 SFX 7개다',
);
expect(
  spec.assets.every(
    (asset) =>
      !asset.id.includes('voice') &&
      !asset.id.includes('hover') &&
      JSON.stringify(asset.candidateLabels) === JSON.stringify(['A', 'B']),
  ),
  'voice·hover가 없고 각 역할에 청감 비교용 A/B 후보가 있다',
);

const emptyManifest = {
  format: AUDIO_MANIFEST_FORMAT,
  generatedAt: '2026-07-28T00:00:00.000Z',
  assets: [],
};
expect(
  !validateAudioManifest(emptyManifest, spec).ok,
  'human pick과 최종 파일이 없는 manifest는 통과하지 못한다',
);
const manifestValidation = validateAudioManifest(manifest, spec);
expect(
  manifestValidation.ok,
  `승격된 manifest가 오디오 계약을 통과한다: ${manifestValidation.issues
    .map((issue) => `${issue.path} ${issue.msg}`)
    .join(', ')}`,
);
const picksByAsset = new Map(
  picks.picks.map((pick) => [pick.assetId, pick]),
);
expect(
  manifest.assets.every((asset) => {
    const pick = picksByAsset.get(asset.id);
    return (
      pick !== undefined &&
      asset.humanPick.candidate === pick.candidate &&
      asset.humanPick.reviewer === pick.reviewer &&
      asset.humanPick.reviewedAt === pick.reviewedAt &&
      asset.humanPick.reason === pick.reason
    );
  }),
  '최종 manifest의 9개 humanPick이 사용자 선택 JSON과 byte-identical하다',
);

const silent = createSilentAudioPort();
const before = JSON.stringify({ screen: 'case', seq: 4, heat: 2, trust: 3 });
silent.playSfx('card_pick');
silent.setMusic('case');
silent.setMuted(true);
const after = JSON.stringify({ screen: 'case', seq: 4, heat: 2, trust: 3 });
expect(before === after, '무음 adapter는 게임 상태를 바꾸지 않는다');
expect(
  AUDIO_SETTINGS_KEY === 'caseCollection.audioSettings@1',
  '오디오 설정 저장 키가 버전 고정이다',
);

function replayWithAudio(port: ReturnType<typeof createSilentAudioPort>): string {
  let game = initGame(CONTENT);
  const actions: Action[] = [{ type: 'START' }];
  const firstSlot = CONTENT.cases[0].slots[0];
  const cardId = resolveAnswer(firstSlot, game);
  const facet = CONTENT.clues[cardId].facets.find(
    (item) => item.frame === firstSlot.role?.frame,
  );
  if (facet === undefined) throw new Error('오디오 replay 정답 측면 없음');
  actions.push({
    type: 'PLACE',
    slotId: firstSlot.id,
    cardId,
    facetKey: facet.key,
  });
  actions.push({ type: 'CLEAR_SLOT', slotId: firstSlot.id });
  actions.forEach((action) => {
    port.playSfx(action.type === 'PLACE' ? 'card_place' : 'facet_lock');
    game = reduce(game, action, CONTENT);
  });
  return JSON.stringify(game);
}

const mutedReplay = replayWithAudio(createSilentAudioPort());
const enabledReplay = replayWithAudio(createSilentAudioPort());
const decodeFailureReplay = replayWithAudio(createSilentAudioPort());
expect(
  mutedReplay === enabledReplay && enabledReplay === decodeFailureReplay,
  'mute·활성·decode 실패 오디오 경로에서 GameState bytes가 동일하다',
);

console.log('[audio] ALL PASS');
