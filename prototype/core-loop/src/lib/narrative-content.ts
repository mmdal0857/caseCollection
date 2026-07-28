import type { CaseDef, RunContent, SlotFrame, Tag } from './engine';

export const NARRATIVE_INPUT_FORMAT = 'NarrativeGenerationInput@1' as const;
export const NARRATIVE_VALIDATOR_VERSION = 'narrative-validator@1' as const;

export interface NarrativeProvenance {
  sourceSnapshotIds: string[];
  inputSha256: string;
  modelId?: string;
  promptVersion?: string;
  seed?: number;
  rawResponseSha256?: string;
  validatorVersion: string;
  outputSha256: string;
}

export interface PublicAxisProfile {
  id: string;
  label: string;
  low: string;
  high: string;
}

export interface NarrativeGenerationInput {
  format: typeof NARRATIVE_INPUT_FORMAT;
  id: string;
  previous: {
    caseId: string;
    publicTags: Tag[];
    axisMove: number;
    riskAxis: 'heat' | 'trust';
  };
  next: {
    caseId: string;
    title: string;
    foreshadowAllowlist: string[];
    guestFacetAllowlist: {
      key: string;
      publicText: string;
    }[];
  };
  storySeed: {
    publicPremise: string;
    axisProfile: PublicAxisProfile;
  };
  presentation: {
    title: string;
    reconLabel: string;
    interviewLabel: string;
    interviewResult: string;
    stabilizeLabel: string;
    stabilizeResult: string;
  };
  provenance: NarrativeProvenance;
}

interface BaseNarrativeAction {
  id: string;
  cost: 1;
  label: string;
  resultText: string;
}

export interface ReconNarrativeAction extends BaseNarrativeAction {
  kind: 'recon';
  revealKind: 'background' | 'frame' | 'risk';
  revealValue: string;
}

export interface InterviewNarrativeAction extends BaseNarrativeAction {
  kind: 'interview';
  guestFacetKey: string;
}

export interface StabilizeNarrativeAction extends BaseNarrativeAction {
  kind: 'stabilize';
  stat: 'heat' | 'trust';
  delta: number;
}

export type NarrativeAction =
  | ReconNarrativeAction
  | InterviewNarrativeAction
  | StabilizeNarrativeAction;

export interface InterludeDefinition {
  id: string;
  afterCaseId: string;
  beforeCaseId: string;
  apBudget: 2;
  actions: [ReconNarrativeAction, InterviewNarrativeAction, StabilizeNarrativeAction];
  presentation: string;
  provenance: NarrativeProvenance;
}

export interface EndingDefinition {
  id: string;
  triggerRuleId: 'bad-press' | 'bad-collapse';
  warningRuleId: 'press' | 'collapse';
  presentation: string;
  provenance: NarrativeProvenance;
}

export interface NarrativeIssue {
  path: string;
  msg: string;
}

export interface NarrativeValidation {
  ok: boolean;
  issues: NarrativeIssue[];
}

const INPUT_KEYS = [
  'format', 'id', 'previous', 'next', 'storySeed', 'presentation', 'provenance',
] as const;
const PREVIOUS_KEYS = ['caseId', 'publicTags', 'axisMove', 'riskAxis'] as const;
const NEXT_KEYS = [
  'caseId', 'title', 'foreshadowAllowlist', 'guestFacetAllowlist',
] as const;
const GUEST_FACET_KEYS = ['key', 'publicText'] as const;
const STORY_KEYS = ['publicPremise', 'axisProfile'] as const;
const AXIS_KEYS = ['id', 'label', 'low', 'high'] as const;
const PRESENTATION_KEYS = [
  'title', 'reconLabel', 'interviewLabel', 'interviewResult',
  'stabilizeLabel', 'stabilizeResult',
] as const;
const PROVENANCE_KEYS = [
  'sourceSnapshotIds', 'inputSha256', 'modelId', 'promptVersion', 'seed',
  'rawResponseSha256', 'validatorVersion', 'outputSha256',
] as const;
const TAGS: Tag[] = ['공개', '은밀', '강압', '신중', '논리'];
const HASH_RE = /^[a-f0-9]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: NarrativeIssue[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issues.push({ path, msg: '객체여야 한다' });
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push({ path: path ? `${path}.${key}` : key, msg: '공개 입력 allowlist 밖 필드다' });
    }
  }
  return true;
}

function needString(
  value: unknown,
  path: string,
  issues: NarrativeIssue[],
): value is string {
  if (typeof value === 'string' && value.length > 0) return true;
  issues.push({ path, msg: '비어 있지 않은 문자열이어야 한다' });
  return false;
}

function stringArray(
  value: unknown,
  path: string,
  issues: NarrativeIssue[],
  allowEmpty = false,
): value is string[] {
  const ok = Array.isArray(value) &&
    (allowEmpty || value.length > 0) &&
    value.every((item) => typeof item === 'string' && item.length > 0);
  if (!ok) issues.push({ path, msg: '문자열 allowlist여야 한다' });
  return ok;
}

export function validateNarrativeInput(value: unknown): NarrativeValidation {
  const issues: NarrativeIssue[] = [];
  if (!exactKeys(value, INPUT_KEYS, '', issues)) return { ok: false, issues };

  if (value.format !== NARRATIVE_INPUT_FORMAT) {
    issues.push({ path: 'format', msg: `${NARRATIVE_INPUT_FORMAT}이어야 한다` });
  }
  needString(value.id, 'id', issues);

  if (exactKeys(value.previous, PREVIOUS_KEYS, 'previous', issues)) {
    needString(value.previous.caseId, 'previous.caseId', issues);
    if (
      !Array.isArray(value.previous.publicTags) ||
      value.previous.publicTags.some((tag) => !TAGS.includes(tag as Tag))
    ) {
      issues.push({ path: 'previous.publicTags', msg: '공개 태그만 허용된다' });
    }
    if (!Number.isFinite(value.previous.axisMove)) {
      issues.push({ path: 'previous.axisMove', msg: '유한한 축 이동값이어야 한다' });
    }
    if (value.previous.riskAxis !== 'heat' && value.previous.riskAxis !== 'trust') {
      issues.push({ path: 'previous.riskAxis', msg: 'heat 또는 trust여야 한다' });
    }
  }

  if (exactKeys(value.next, NEXT_KEYS, 'next', issues)) {
    needString(value.next.caseId, 'next.caseId', issues);
    needString(value.next.title, 'next.title', issues);
    stringArray(value.next.foreshadowAllowlist, 'next.foreshadowAllowlist', issues);
    if (
      !Array.isArray(value.next.guestFacetAllowlist) ||
      value.next.guestFacetAllowlist.length === 0
    ) {
      issues.push({ path: 'next.guestFacetAllowlist', msg: '공개 측면 allowlist여야 한다' });
    } else {
      value.next.guestFacetAllowlist.forEach((item, index) => {
        const path = `next.guestFacetAllowlist[${index}]`;
        if (exactKeys(item, GUEST_FACET_KEYS, path, issues)) {
          needString(item.key, `${path}.key`, issues);
          needString(item.publicText, `${path}.publicText`, issues);
        }
      });
    }
  }

  if (exactKeys(value.storySeed, STORY_KEYS, 'storySeed', issues)) {
    needString(value.storySeed.publicPremise, 'storySeed.publicPremise', issues);
    if (exactKeys(value.storySeed.axisProfile, AXIS_KEYS, 'storySeed.axisProfile', issues)) {
      for (const key of AXIS_KEYS) {
        needString(value.storySeed.axisProfile[key], `storySeed.axisProfile.${key}`, issues);
      }
    }
  }

  if (exactKeys(value.presentation, PRESENTATION_KEYS, 'presentation', issues)) {
    for (const key of PRESENTATION_KEYS) {
      needString(value.presentation[key], `presentation.${key}`, issues);
    }
  }

  if (exactKeys(value.provenance, PROVENANCE_KEYS, 'provenance', issues)) {
    stringArray(value.provenance.sourceSnapshotIds, 'provenance.sourceSnapshotIds', issues);
    if (!HASH_RE.test(String(value.provenance.inputSha256))) {
      issues.push({ path: 'provenance.inputSha256', msg: 'SHA-256 hex여야 한다' });
    }
    if (!HASH_RE.test(String(value.provenance.outputSha256))) {
      issues.push({ path: 'provenance.outputSha256', msg: 'SHA-256 hex여야 한다' });
    }
    needString(value.provenance.validatorVersion, 'provenance.validatorVersion', issues);
  }

  return { ok: issues.length === 0, issues };
}

export function canonicalNarrativeJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (isRecord(item)) {
      return Object.fromEntries(
        Object.entries(item)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalize(nested)]),
      );
    }
    return item;
  };
  return `${JSON.stringify(normalize(value))}\n`;
}

export function buildInterludeDefinition(
  value: NarrativeGenerationInput,
): InterludeDefinition {
  const validation = validateNarrativeInput(value);
  if (!validation.ok) {
    throw new Error(
      validation.issues.map((issue) => `${issue.path}: ${issue.msg}`).join('\n'),
    );
  }
  const revealValue = value.next.foreshadowAllowlist[0];
  const guestFacet = value.next.guestFacetAllowlist[0];
  return {
    id: value.id,
    afterCaseId: value.previous.caseId,
    beforeCaseId: value.next.caseId,
    apBudget: 2,
    actions: [
      {
        id: `${value.id}.recon`,
        kind: 'recon',
        cost: 1,
        label: value.presentation.reconLabel,
        resultText: revealValue,
        revealKind: 'background',
        revealValue,
      },
      {
        id: `${value.id}.interview`,
        kind: 'interview',
        cost: 1,
        label: value.presentation.interviewLabel,
        resultText: guestFacet.publicText,
        guestFacetKey: guestFacet.key,
      },
      {
        id: `${value.id}.stabilize`,
        kind: 'stabilize',
        cost: 1,
        label: value.presentation.stabilizeLabel,
        resultText: value.presentation.stabilizeResult,
        stat: value.previous.riskAxis,
        delta: value.previous.riskAxis === 'heat' ? -1 : 1,
      },
    ],
    presentation: value.presentation.title,
    provenance: structuredClone(value.provenance),
  };
}

const PROVENANCE: NarrativeProvenance = {
  sourceSnapshotIds: ['repo:CONTENT'],
  inputSha256: '1'.repeat(64),
  promptVersion: 'narrative-template@1',
  validatorVersion: NARRATIVE_VALIDATOR_VERSION,
  outputSha256: '2'.repeat(64),
};

const BASE_INPUTS: NarrativeGenerationInput[] = [
  {
    format: NARRATIVE_INPUT_FORMAT,
    id: 'base.interlude.c1-c2',
    previous: {
      caseId: 'c1',
      publicTags: ['논리', '은밀'],
      axisMove: 2,
      riskAxis: 'heat',
    },
    next: {
      caseId: 'c2',
      title: '부두 창고의 알리바이',
      foreshadowAllowlist: [
        '항구 쪽 창고에서 야간 경비가 죽었다. 용의자에겐 극장 표 한 장이 있다 — 너무 완벽한 알리바이.',
      ],
      guestFacetAllowlist: [{
        key: 'forged_ledger:motive',
        publicText: '다음 사건에서 위조 장부의 ‘금전 동기’ 측면을 빌린다.',
      }],
    },
    storySeed: {
      publicPremise: '완벽한 알리바이의 시간 틈을 추적한다.',
      axisProfile: { id: 'clock', label: '시간', low: '여유', high: '촉박' },
    },
    presentation: {
      title: '부두로 향하는 밤',
      reconLabel: '기사 스크랩 정찰',
      interviewLabel: '장부 담당자 면담',
      interviewResult: '다음 사건에서 장부 담당자의 공개된 측면을 빌린다.',
      stabilizeLabel: '수사선 정돈',
      stabilizeResult: '과열된 수사선을 한 단계 가라앉힌다.',
    },
    provenance: PROVENANCE,
  },
  {
    format: NARRATIVE_INPUT_FORMAT,
    id: 'base.interlude.c2-c3',
    previous: {
      caseId: 'c2',
      publicTags: ['공개', '논리'],
      axisMove: 1,
      riskAxis: 'trust',
    },
    next: {
      caseId: 'c3',
      title: '사라진 은행가',
      foreshadowAllowlist: [
        '한 은행가가 강가에서 감쪽같이 사라졌다. 남은 건 강물에 뜬 외투 한 벌뿐 — 정말 빠진 걸까.',
      ],
      guestFacetAllowlist: [{
        key: 'rehearsed_story:identity',
        publicText: '다음 사건에서 연습된 진술의 ‘신분 위장’ 측면을 빌린다.',
      }],
    },
    storySeed: {
      publicPremise: '사라짐이 아니라 연출된 신분을 추적한다.',
      axisProfile: {
        id: 'testimony',
        label: '증언 일관성',
        low: '엇갈림',
        high: '입 맞춤',
      },
    },
    presentation: {
      title: '강가에 남은 외투',
      reconLabel: '강변 동선 정찰',
      interviewLabel: '마지막 목격자 면담',
      interviewResult: '다음 사건에서 목격자가 공개한 신분 측면을 빌린다.',
      stabilizeLabel: '수사반 정돈',
      stabilizeResult: '흔들린 수사반의 신뢰를 한 단계 회복한다.',
    },
    provenance: PROVENANCE,
  },
  {
    format: NARRATIVE_INPUT_FORMAT,
    id: 'base.interlude.c3-boss',
    previous: {
      caseId: 'c3',
      publicTags: ['신중', '은밀'],
      axisMove: 1,
      riskAxis: 'heat',
    },
    next: {
      caseId: 'boss',
      title: '보이지 않는 배달부',
      foreshadowAllowlist: [
        '눈 덮인 저택, 사라진 표적, "아무도 안 왔다"는 네 증인. 그런데 눈 위엔 발자국이 있다 — 두 개의 트릭이 겹친 사건.',
      ],
      guestFacetAllowlist: [{
        key: 'uniform_habit:identity',
        publicText: '다음 사건에서 제복의 익명성의 ‘사회적 투명성’ 측면을 빌린다.',
      }],
    },
    storySeed: {
      publicPremise: '보였지만 기억되지 않은 사람을 추적한다.',
      axisProfile: { id: 'traffic', label: '인적', low: '한산', high: '붐빔' },
    },
    presentation: {
      title: '눈 덮인 저택으로',
      reconLabel: '저택 주변 정찰',
      interviewLabel: '배달 기록 면담',
      interviewResult: '다음 사건에서 제복의 공개된 정체 측면을 빌린다.',
      stabilizeLabel: '언론선 정돈',
      stabilizeResult: '저택 주변의 소란을 한 단계 가라앉힌다.',
    },
    provenance: PROVENANCE,
  },
];

export const BASE_INTERLUDES: InterludeDefinition[] =
  BASE_INPUTS.map(buildInterludeDefinition);

export const BASE_ENDINGS: EndingDefinition[] = [
  {
    id: 'base.ending.press',
    triggerRuleId: 'bad-press',
    warningRuleId: 'press',
    presentation:
      '수사는 신문 1면에서 끝났다. 떠들썩한 보도 속에 진범은 짐을 쌌고, 항구에는 어젯밤 배가 한 척 떠났다. 이번 run은 여기서 끝난다.',
    provenance: PROVENANCE,
  },
  {
    id: 'base.ending.collapse',
    triggerRuleId: 'bad-collapse',
    warningRuleId: 'collapse',
    presentation:
      '거친 수사가 반을 갈랐다. 조서에 서명할 사람이 남지 않았고, 자네 책상은 오늘부로 비워진다. 이번 run은 여기서 끝난다.',
    provenance: PROVENANCE,
  },
];

const FRAME_LABEL: Record<SlotFrame, string> = {
  route: '경로',
  means: '수단',
  trace: '흔적',
  action: '행동',
  motive: '동기',
  record: '기록',
  omission: '공백',
  scene: '현장',
  identity: '정체',
};

export function validateNarrativeDefinitions(
  content: Pick<
    RunContent,
    | 'cases' | 'interludes' | 'endings' | 'initial' | 'badHeat' | 'tagDeltas'
  >,
): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  const cases = new Map<string, { definition: CaseDef; index: number }>();
  content.cases.forEach((definition, index) => {
    cases.set(definition.id, { definition, index });
  });

  const interludeIds = new Set<string>();
  const edges = new Set<string>();
  content.interludes.forEach((definition, index) => {
    const path = `interludes[${index}]`;
    if (interludeIds.has(definition.id)) {
      issues.push({ path: `${path}.id`, msg: `interlude id "${definition.id}" 중복` });
    }
    interludeIds.add(definition.id);
    const after = cases.get(definition.afterCaseId);
    const before = cases.get(definition.beforeCaseId);
    if (after === undefined) {
      issues.push({ path: `${path}.afterCaseId`, msg: '이전 case가 없다' });
    }
    if (before === undefined) {
      issues.push({ path: `${path}.beforeCaseId`, msg: '다음 case가 없다' });
    }
    if (after !== undefined && before !== undefined && before.index !== after.index + 1) {
      issues.push({ path, msg: 'interlude는 인접한 두 case 사이만 연결할 수 있다' });
    }
    const edge = `${definition.afterCaseId}->${definition.beforeCaseId}`;
    if (edges.has(edge)) {
      issues.push({ path, msg: `case 전환 "${edge}"가 중복됐다` });
    }
    edges.add(edge);

    const kinds = definition.actions.map((action) => action.kind);
    if (
      definition.apBudget !== 2 ||
      kinds.length !== 3 ||
      new Set(kinds).size !== 3 ||
      !['recon', 'interview', 'stabilize'].every((kind) => kinds.includes(kind as never))
    ) {
      issues.push({ path: `${path}.actions`, msg: 'AP 2에서 recon/interview/stabilize를 정확히 한 번씩 정의해야 한다' });
    }

    const next = before?.definition;
    for (const [actionIndex, action] of definition.actions.entries()) {
      const actionPath = `${path}.actions[${actionIndex}]`;
      if (action.kind === 'recon' && next !== undefined) {
        const allowed = new Set<string>([
          next.title,
          ...(next.teaser === undefined ? [] : [next.teaser]),
          ...(next.contextHint === undefined ? [] : [next.contextHint]),
          ...(next.slots[0]?.role === undefined
            ? []
            : [FRAME_LABEL[next.slots[0].role.frame]]),
        ]);
        if (!allowed.has(action.revealValue) || action.resultText !== action.revealValue) {
          issues.push({
            path: actionPath,
            msg: 'recon 결과는 다음 case의 공개 복선 allowlist와 byte-identical이어야 한다',
          });
        }
      }
      if (action.kind === 'interview' && next !== undefined) {
        if (!(next.guestFacets ?? []).includes(action.guestFacetKey)) {
          issues.push({
            path: `${actionPath}.guestFacetKey`,
            msg: '다음 case guestFacets allowlist 밖 측면이다',
          });
        }
      }
      if (
        action.kind === 'stabilize' &&
        !(
          (action.stat === 'heat' && action.delta < 0) ||
          (action.stat === 'trust' && action.delta > 0)
        )
      ) {
        issues.push({
          path: `${actionPath}.delta`,
          msg: 'stabilize는 heat를 낮추거나 trust를 높여야 한다',
        });
      }
    }
  });

  for (let index = 0; index < content.cases.length - 1; index++) {
    const edge = `${content.cases[index].id}->${content.cases[index + 1].id}`;
    if (!edges.has(edge)) {
      issues.push({ path: 'interludes', msg: `case 전환 "${edge}" 정의가 없다` });
    }
  }

  const endingIds = new Set<string>();
  const pairs = new Set<string>();
  content.endings.forEach((ending, index) => {
    const path = `endings[${index}]`;
    if (endingIds.has(ending.id)) {
      issues.push({ path: `${path}.id`, msg: `ending id "${ending.id}" 중복` });
    }
    endingIds.add(ending.id);
    pairs.add(`${ending.triggerRuleId}:${ending.warningRuleId}`);
    const validPair =
      (ending.triggerRuleId === 'bad-press' && ending.warningRuleId === 'press') ||
      (ending.triggerRuleId === 'bad-collapse' && ending.warningRuleId === 'collapse');
    if (!validPair) {
      issues.push({ path, msg: 'BAD trigger와 선행 warning 규칙이 맞지 않는다' });
    }
  });

  const canRaiseHeat = Object.values(content.tagDeltas).some((delta) => delta.heat > 0);
  const canLowerTrust = Object.values(content.tagDeltas).some((delta) => delta.trust < 0);
  if (
    pairs.has('bad-press:press') &&
    !(content.badHeat > 0 && content.badHeat <= 10 && canRaiseHeat)
  ) {
    issues.push({ path: 'endings', msg: 'press warning에서 BAD trigger로 도달할 수 없다' });
  }
  if (
    pairs.has('bad-collapse:collapse') &&
    !(content.initial.trust >= 1 && canLowerTrust)
  ) {
    issues.push({ path: 'endings', msg: 'collapse warning에서 BAD trigger로 도달할 수 없다' });
  }
  if (!pairs.has('bad-press:press') || !pairs.has('bad-collapse:collapse')) {
    issues.push({ path: 'endings', msg: 'press와 collapse BAD 엔딩이 모두 필요하다' });
  }
  return issues;
}
