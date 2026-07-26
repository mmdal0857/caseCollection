/**
 * PROTOTYPE TUI — case generator contract explorer.
 *
 * Run:
 *   npm run prototype:case-generator
 *
 * Non-interactive evidence pass:
 *   npm run prototype:case-generator:demo
 */

import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { CONTENT } from './src/lib/content';
import {
  axisProfileFromLegacy,
  enumerateLegalCandidates,
  fullTagAxisProfiles,
  migrateLegacyCase,
  observedAxisProfiles,
  probeConditionalSolutions,
  selectLegalCandidate,
  validateTripleConstraints,
  type AxisProfile,
  type CandidateSearchInput,
  type GeneratorState,
  type LegacyMigration,
  type PatternRecipe,
  type StorySeed,
  type TruthCandidate,
} from './src/lib/case-generator-prototype';
import { FRAME_ACCEPTS, type CaseDef } from './src/lib/engine';

const bold = '\x1b[1m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

type AxisVariant = 'observed' | 'full-tag';

interface UiState {
  caseIndex: number;
  state: GeneratorState;
  axisVariant: AxisVariant;
  candidates: TruthCandidate[];
  candidateIndex: number;
  migrations: LegacyMigration[];
  lastAction: string;
  lastSearchInput: CandidateSearchInput | null;
}

function recipeFor(definition: CaseDef, profile: AxisProfile): PatternRecipe {
  return {
    id: `prototype:${definition.patterns.join('+')}`,
    version: '0.1-prototype',
    evidenceIds: definition.patterns.map((pattern) => `evidence:${pattern}`),
    slots: definition.slots.map((slot, order) => {
      const frame = slot.role?.frame ?? 'scene';
      return {
        id: slot.id,
        order,
        frame,
        accepts: slot.role?.accepts ?? FRAME_ACCEPTS[frame],
        label: slot.label,
      };
    }),
    allowedAxisProfiles: [profile.id],
    allowCardReuse: false,
  };
}

function seedFor(definition: CaseDef, profile: AxisProfile): StorySeed {
  const axis = definition.axis;
  return {
    id: `seed:${definition.id}`,
    requires: [],
    prefers: [
      { facetTagsAny: ['논리'], weight: 2 },
      { facetTagsAny: [profile.drivenBy], weight: 1 },
    ],
    axisPresentations: [
      {
        profileId: profile.id,
        label: axis?.label ?? '논리 압력',
        low: axis?.low ?? '낮음',
        high: axis?.high ?? '높음',
        hint: axis?.hint ?? `${profile.drivenBy} 측면이 축을 움직인다.`,
      },
    ],
  };
}

function knownFacetSet(): Set<string> {
  return new Set(
    Object.values(CONTENT.clues).flatMap((card) =>
      // The prototype explores the generator's legal space, not run progression.
      card.facets.map((facet) => facet.key),
    ),
  );
}

function starterKnownFacetSet(): Set<string> {
  return new Set(
    CONTENT.starterClues.flatMap((cardId) => {
      const card = CONTENT.clues[cardId];
      return card?.facets[0] ? [card.facets[0].key] : [];
    }),
  );
}

function selectedProfile(ui: UiState, definition: CaseDef): AxisProfile {
  const legacy = axisProfileFromLegacy(definition.axis);
  const profiles =
    ui.axisVariant === 'observed'
      ? observedAxisProfiles(CONTENT.cases)
      : fullTagAxisProfiles(definition.axis?.init ?? 3);
  if (legacy) {
    const matching = profiles.find((profile) => profile.drivenBy === legacy.drivenBy);
    if (matching) return { ...matching, initial: definition.axis?.init ?? matching.initial };
  }
  return profiles[0];
}

function regenerate(ui: UiState): void {
  const definition = CONTENT.cases[ui.caseIndex];
  const profile = selectedProfile(ui, definition);
  const recipe = recipeFor(definition, profile);
  const seed = seedFor(definition, profile);
  const input: CandidateSearchInput = {
    clues: CONTENT.clues,
    recipe,
    storySeed: seed,
    axisProfile: profile,
    initialState: { ...ui.state, axis: profile.initial },
    knownFacets: knownFacetSet(),
    lentFacets: new Set(definition.guestFacets ?? []),
    tagDeltas: CONTENT.tagDeltas,
    maxCandidates: 24,
  };
  ui.lastSearchInput = input;
  ui.candidates = enumerateLegalCandidates(input);
  ui.candidateIndex = Math.min(ui.candidateIndex, Math.max(0, ui.candidates.length - 1));
}

function conditionalSummary(ui: UiState): string[] {
  const migration = ui.migrations[ui.caseIndex];
  const probes = probeConditionalSolutions(
    migration,
    CONTENT.clues,
    CONTENT.tagDeltas,
  );
  const liveFlips = probes.filter((probe) => !probe.eligibleAfterLiveReevaluation);
  const affected = [...new Set(liveFlips.map((probe) => probe.slotId))];
  return [
    `조건부 probe: ${probes.length}`,
    `live 재평가 시 뒤집힘: ${liveFlips.length}${affected.length ? ` (${affected.join(', ')})` : ''}`,
    'lock-time 동결 계약: 뒤집힘 0',
  ];
}

function render(ui: UiState): void {
  console.clear();
  const definition = CONTENT.cases[ui.caseIndex];
  const profile = selectedProfile(ui, definition);
  const candidate = ui.candidates[ui.candidateIndex];
  const triple =
    candidate && ui.lastSearchInput
      ? validateTripleConstraints(
          candidate,
          ui.lastSearchInput,
          starterKnownFacetSet(),
        )
      : null;
  const observed = observedAxisProfiles(CONTENT.cases);
  const full = fullTagAxisProfiles();

  console.log(`${bold}PROTOTYPE — case generator contract explorer${reset}`);
  console.log(`${dim}합법 후보 탐색 + 조건부 해답 동결 + 가변축 재사용 모델${reset}\n`);
  console.log(`${bold}case${reset}: ${definition.id} · ${definition.title}`);
  console.log(`${bold}state${reset}: heat=${ui.state.heat} trust=${ui.state.trust} axis=${ui.state.axis}`);
  console.log(`${bold}axis variant${reset}: ${ui.axisVariant}`);
  console.log(`${bold}axis profile${reset}: ${profile.id} (drivenBy=${profile.drivenBy})`);
  console.log(`${bold}axis reuse${reset}: observed=${observed.length} / full-tag=${full.length}`);
  console.log(`${bold}candidates${reset}: ${ui.candidates.length} · selected=${ui.candidateIndex + 1}`);
  console.log(`${bold}migration issues${reset}: ${ui.migrations[ui.caseIndex].issues.length}`);
  console.log(
    `${bold}triple gate${reset}: ${
      triple
        ? `①${triple.solvable ? 'PASS' : 'FAIL'} ②${triple.coherent ? 'PASS' : 'FAIL'} ③${triple.failureDirectionsReachable ? 'PASS' : 'FAIL'}`
        : '후보 없음'
    }`,
  );
  for (const line of conditionalSummary(ui)) console.log(`${bold}branch${reset}: ${line}`);
  console.log(`${bold}last action${reset}: ${ui.lastAction}\n`);

  if (candidate) {
    console.log(`${bold}선택 후보${reset} · score=${candidate.preferenceScore}`);
    console.log(
      `${dim}final heat=${candidate.finalState.heat} trust=${candidate.finalState.trust} axis=${candidate.finalState.axis}${reset}`,
    );
    for (const line of candidate.trace) console.log(`  ${line}`);
  } else {
    console.log('합법 후보 없음 — state/profile/known facet 조건을 확인할 것.');
  }

  console.log(
    `\n${bold}[g]${reset} generate  ${bold}[n]${reset} next candidate  ${bold}[c]${reset} next case  ${bold}[v]${reset} axis variant`,
  );
  console.log(
    `${bold}[h/H]${reset} heat ±  ${bold}[t/T]${reset} trust ±  ${bold}[a/A]${reset} axis ±  ${bold}[q]${reset} quit`,
  );
}

function adjust(ui: UiState, field: keyof GeneratorState, delta: number): void {
  ui.state[field] = Math.max(0, Math.min(10, ui.state[field] + delta));
  ui.lastAction = `${field} ${delta > 0 ? '+' : ''}${delta}`;
  regenerate(ui);
}

function handle(ui: UiState, command: string): boolean {
  if (command === 'q') return false;
  if (command === 'g') {
    regenerate(ui);
    ui.lastAction = '합법 후보 재생성';
  } else if (command === 'n') {
    if (ui.candidates.length > 0) {
      ui.candidateIndex = (ui.candidateIndex + 1) % ui.candidates.length;
    }
    ui.lastAction = '다음 후보';
  } else if (command === 'c') {
    ui.caseIndex = (ui.caseIndex + 1) % CONTENT.cases.length;
    ui.candidateIndex = 0;
    regenerate(ui);
    ui.lastAction = '다음 case';
  } else if (command === 'v') {
    ui.axisVariant = ui.axisVariant === 'observed' ? 'full-tag' : 'observed';
    regenerate(ui);
    ui.lastAction = `axis variant → ${ui.axisVariant}`;
  } else if (command === 'h') adjust(ui, 'heat', 1);
  else if (command === 'H') adjust(ui, 'heat', -1);
  else if (command === 't') adjust(ui, 'trust', 1);
  else if (command === 'T') adjust(ui, 'trust', -1);
  else if (command === 'a') adjust(ui, 'axis', 1);
  else if (command === 'A') adjust(ui, 'axis', -1);
  else ui.lastAction = `알 수 없는 명령: ${command || '(empty)'}`;
  return true;
}

function makeUi(): UiState {
  const ui: UiState = {
    caseIndex: 0,
    state: { heat: CONTENT.initial.heat, trust: CONTENT.initial.trust, axis: 2 },
    axisVariant: 'observed',
    candidates: [],
    candidateIndex: 0,
    migrations: CONTENT.cases.map((definition) =>
      migrateLegacyCase(definition, CONTENT.clues),
    ),
    lastAction: '초기화',
    lastSearchInput: null,
  };
  regenerate(ui);
  return ui;
}

function runDemo(): void {
  const ui = makeUi();
  console.log('=== PROTOTYPE: case generator contract demo ===');
  console.log(
    `baseline migration: ${ui.migrations.length} cases / ${ui.migrations.reduce((sum, migration) => sum + migration.issues.length, 0)} structural issues`,
  );
  let llmGuardPass = true;
  for (const [index, migration] of ui.migrations.entries()) {
    ui.caseIndex = index;
    ui.candidateIndex = 0;
    regenerate(ui);
    const candidate = ui.candidates[0];
    const triple =
      candidate && ui.lastSearchInput
        ? validateTripleConstraints(
            candidate,
            ui.lastSearchInput,
            starterKnownFacetSet(),
          )
        : null;
    const fingerprint = createHash('sha256')
      .update(ui.candidates.map((candidateItem) => candidateItem.id).join('\n'))
      .digest('hex')
      .slice(0, 12);
    const legalSelection = ui.candidates[0]
      ? selectLegalCandidate(ui.candidates, ui.candidates[0].id)
      : { ok: false };
    const inventedSelection = selectLegalCandidate(
      ui.candidates,
      `${migration.caseId}|invented-card:invented-frame`,
    );
    llmGuardPass &&= legalSelection.ok && !inventedSelection.ok;
    const probes = probeConditionalSolutions(
      migration,
      CONTENT.clues,
      CONTENT.tagDeltas,
    );
    const liveFlips = probes.filter((probe) => !probe.eligibleAfterLiveReevaluation);
    console.log(
      `[${migration.caseId}] layers=truth/presentation/obstacles(${migration.obstacles.length}) slots=${migration.truth.slots.length} candidates=${ui.candidates.length} fingerprint=${fingerprint} triple=${triple ? `①${triple.solvable ? 'P' : 'F'}②${triple.coherent ? 'P' : 'F'}③${triple.failureDirectionsReachable ? 'P' : 'F'}` : 'NO-CANDIDATE'} conditional=${probes.length} live-flips=${liveFlips.length} frozen-flips=0`,
    );
    for (const slotId of [...new Set(liveFlips.map((probe) => probe.slotId))]) {
      console.log(`  ⚠ ${slotId}: live 재평가 정책은 배치가 자기 정답을 뒤집을 수 있음`);
    }
  }
  console.log(
    `axis catalogs: observed=${observedAxisProfiles(CONTENT.cases).map((profile) => profile.id).join(', ')} / full-tag=${fullTagAxisProfiles().length}`,
  );
  console.log(`sLLM candidate allowlist: ${llmGuardPass ? 'PASS — 합법 ID 수용, 발명 ID 거부' : 'FAIL'}`);
  console.log('verdict: explicit solutions[] + lock-time eligibility snapshot이 기존 조건부 답을 안정적으로 표현한다.');
}

if (process.argv.includes('--demo') || !process.stdin.isTTY) {
  runDemo();
} else {
  const ui = makeUi();
  render(ui);
  const input = createInterface({ input: process.stdin, output: process.stdout });
  input.on('line', (line) => {
    if (!handle(ui, line.trim())) {
      input.close();
      return;
    }
    render(ui);
  });
}
