import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  approvePatternContract,
  buildGeneratedArtifacts,
  buildSourceFixture,
  candidateSummaries,
  canonicalJson,
  type ModelExchange,
  type ModelRole,
  type ModelTranscript,
  type PatternContractFixture,
  type PresenterOutput,
  type SelectorOutput,
  type SourceFixture,
  type TasteOutput,
  validatePresentationOutput,
  validateSelectorOutput,
  validateSourceFixture,
  validateTasteOutput,
} from './src/lib/case-generator-e2e';
import {
  enumerateLegalCandidates,
  type CandidateSearchInput,
  type TruthCandidate,
} from './src/lib/case-generator-prototype';
import { CONTENT } from './src/lib/content';

const DEFAULT_MODEL = 'qwen/qwen3.6-27b';
const DEFAULT_BASE_URL = 'http://127.0.0.1:1234/v1';
const SEED = 428;

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requiredAfter(flag: string): string {
  const value = valueAfter(flag);
  if (!value) throw new Error(`${flag} 인자가 필요하다.`);
  return value;
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('모델 응답에서 JSON 객체를 찾지 못했다.');
  }
  return JSON.parse(unfenced.slice(start, end + 1));
}

async function callModel(input: {
  role: ModelRole;
  promptVersion: string;
  system: string;
  payload: unknown;
  modelId: string;
  baseUrl: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<ModelExchange> {
  const body = {
    model: input.modelId,
    messages: [
      { role: 'system', content: input.system },
      {
        role: 'user',
        content: `JSON 입력:\n${canonicalJson(input.payload)}\nJSON 객체 하나만 반환하십시오.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: input.schemaName,
        strict: true,
        schema: input.schema,
      },
    },
    temperature: 0,
    seed: SEED,
    reasoning_effort: 'none',
    max_tokens: 1200,
    stream: false,
  };
  const response = await fetch(`${input.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  const rawResponse = await response.text();
  if (!response.ok) {
    throw new Error(
      `${input.role} 모델 호출 실패 HTTP ${response.status}: ${rawResponse.slice(0, 500)}`,
    );
  }
  const envelope = JSON.parse(rawResponse) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = envelope.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error(`${input.role} 모델이 최종 content를 반환하지 않았다.`);
  }
  return {
    role: input.role,
    promptVersion: input.promptVersion,
    input: input.payload,
    rawResponse,
    parsed: parseJsonObject(content),
  };
}

function candidateInput(
  contract: PatternContractFixture,
): CandidateSearchInput {
  const allKnown = new Set(
    Object.values(CONTENT.clues).flatMap((card) =>
      card.facets.map((facet) => facet.key),
    ),
  );
  return {
    clues: CONTENT.clues,
    recipe: contract.recipe,
    storySeed: contract.storySeed,
    axisProfile: contract.axisProfile,
    initialState: {
      heat: CONTENT.initial.heat,
      trust: CONTENT.initial.trust,
      axis: contract.axisProfile.initial,
    },
    knownFacets: allKnown,
    lentFacets: new Set(),
    tagDeltas: CONTENT.tagDeltas,
    maxCandidates: 6,
  };
}

function issueText(
  role: string,
  issues: { path: string; message: string }[],
): string {
  return `${role} 응답 계약 위반:\n${issues
    .map((issue) => `- ${issue.path}: ${issue.message}`)
    .join('\n')}`;
}

async function runLive(
  candidates: TruthCandidate[],
  contract: PatternContractFixture,
  modelId: string,
  baseUrl: string,
): Promise<ModelTranscript> {
  const summaries = candidateSummaries(candidates, CONTENT.clues);
  const selector = await callModel({
    role: 'selector',
    promptVersion: 'selector@1',
    modelId,
    baseUrl,
    schemaName: 'candidate_selection',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['candidateId', 'reason'],
      properties: {
        candidateId: {
          type: 'string',
          enum: candidates.map((candidate) => candidate.id),
        },
        reason: { type: 'string', minLength: 1 },
      },
    },
    system:
      '추론 과정을 쓰지 말고 즉시 JSON으로 답한다. 당신은 사건 후보 취향 선택기다. 입력 candidate 요약 중 하나만 고른다. candidate payload, truth, ID를 만들거나 수정하지 않는다. 출력 키는 candidateId와 reason뿐이다.',
    payload: summaries,
  });
  const selectorIssues = validateSelectorOutput(
    selector.parsed,
    new Set(candidates.map((candidate) => candidate.id)),
  );
  if (selectorIssues.length > 0) {
    throw new Error(issueText('selector', selectorIssues));
  }
  const selectedId = (selector.parsed as SelectorOutput).candidateId;
  const selected = candidates.find((candidate) => candidate.id === selectedId);
  if (!selected) throw new Error('선택 후보를 다시 찾지 못했다.');

  const safePieces = [
    '네 증언이 겹치는 자리에는 ',
    '. 그 공백을 통과한 존재를 설명하는 열쇠는 ',
    '. 그 선택은 우연이 아니라 ',
    '. 마지막으로 현장에 남은 것은 ',
    '. 네 고리가 같은 사람을 가리킨다.',
  ];
  const presenterInput = {
    truth: {
      fingerprint: selected.id,
      slots: candidateSummaries([selected], CONTENT.clues)[0].slots,
      axisPresentation: selected.axisPresentation,
    },
    storySeed: contract.storySeed,
    sourceEvidenceSummary: contract.evidence.summary,
    slotLabels: contract.recipe.slots.map((slot) => ({
      recipeSlotId: slot.id,
      label: slot.label,
    })),
    safePieces,
  };
  const presenter = await callModel({
    role: 'presenter',
    promptVersion: 'presenter@1',
    modelId,
    baseUrl,
    schemaName: 'case_presentation',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['presentation'],
      properties: {
        presentation: {
          type: 'object',
          additionalProperties: false,
          required: [
            'title',
            'intro',
            'teaser',
            'contextHint',
            'pieces',
            'slots',
            'axis',
          ],
          properties: {
            title: { type: 'string', minLength: 1 },
            intro: { type: 'string', minLength: 1 },
            teaser: { type: 'string', minLength: 1 },
            contextHint: { type: 'string', minLength: 1 },
            pieces: {
              type: 'array',
              minItems: selected.slots.length + 1,
              maxItems: selected.slots.length + 1,
              prefixItems: [
                ...safePieces.map((piece) => ({ const: piece })),
              ],
            },
            slots: {
              type: 'array',
              minItems: selected.slots.length,
              maxItems: selected.slots.length,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['recipeSlotId', 'label', 'hit'],
                properties: {
                  recipeSlotId: {
                    type: 'string',
                    enum: selected.slots.map((slot) => slot.recipeSlotId),
                  },
                  label: { type: 'string', minLength: 1 },
                  hit: { type: 'string', minLength: 1 },
                },
              },
            },
            axis: {
              type: 'object',
              additionalProperties: false,
              required: ['profileId', 'label', 'low', 'high', 'hint'],
              properties: {
                profileId: {
                  const: selected.axisPresentation.profileId,
                },
                label: { const: selected.axisPresentation.label },
                low: { const: selected.axisPresentation.low },
                high: { const: selected.axisPresentation.high },
                hint: { const: selected.axisPresentation.hint },
              },
            },
          },
        },
      },
    },
    system:
      '추론 과정을 쓰지 말고 즉시 JSON으로 답한다. 당신은 1930년대 셀 누아르 추리 case 표현기다. 확정 truth를 절대 바꾸지 않는다. 출력 키는 presentation 하나뿐이다. presentation에는 title, intro, teaser, contextHint, pieces, slots, axis만 쓴다. pieces는 입력 safePieces를 순서와 문자를 바꾸지 않고 그대로 복사한다. 입력의 facetMeaning은 제목·도입·힌트·클리어 뒤 반응을 쓸 때 의미만 참고한다. pre-solve 텍스트에는 candidate trace, ← 기호, recipeSlotId, cardId, facetKey, 정답 카드명, 정답 측면명을 쓰지 않는다. slots는 입력 recipeSlotId를 정확히 한 번씩 쓰며 label과 클리어 뒤 반응인 hit만 만든다. axis는 storySeed의 axisPresentations[0]을 그대로 복사한다.',
    payload: presenterInput,
  });
  const presenterIssues = validatePresentationOutput(
    presenter.parsed,
    selected,
    CONTENT.clues,
  );
  if (presenterIssues.length > 0) {
    throw new Error(
      `${issueText('presenter', presenterIssues)}\nparsed=${canonicalJson(
        presenter.parsed,
      ).slice(0, 4000)}`,
    );
  }

  const tasteInput = {
    candidate: candidateSummaries([selected], CONTENT.clues)[0],
    presentation: (presenter.parsed as PresenterOutput).presentation,
    sourcePattern: contract.evidence.summary,
  };
  const taste = await callModel({
    role: 'taste',
    promptVersion: 'taste@1',
    modelId,
    baseUrl,
    schemaName: 'taste_verdict',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['decision', 'tasteScore', 'reasons'],
      properties: {
        decision: { type: 'string', enum: ['keep', 'reject'] },
        tasteScore: { type: 'integer', minimum: 0, maximum: 100 },
        reasons: {
          type: 'array',
          minItems: 1,
          items: { type: 'string', minLength: 1 },
        },
      },
    },
    system:
      '추론 과정을 쓰지 말고 즉시 JSON으로 답한다. 당신은 완성된 추리 case의 취향 필터다. 구조나 문장을 수정하지 않는다. 출력 키는 decision, tasteScore, reasons뿐이다. decision은 keep 또는 reject, tasteScore는 0..100 정수, reasons는 문자열 배열이다. 원문 근거의 사회적 맹점과 게임의 카드 조립 반전이 자연스럽게 회수되면 keep한다.',
    payload: tasteInput,
  });
  const tasteIssues = validateTasteOutput(taste.parsed);
  if (tasteIssues.length > 0) {
    throw new Error(issueText('taste', tasteIssues));
  }
  if ((taste.parsed as TasteOutput).decision !== 'keep') {
    throw new Error(
      `taste filter reject: ${(taste.parsed as TasteOutput).reasons.join('; ')}`,
    );
  }

  return {
    format: 'CaseGeneratorTranscript@1',
    modelId,
    seed: SEED,
    exchanges: [selector, presenter, taste],
  };
}

function writeArtifacts(
  outputDir: string,
  transcript: ModelTranscript,
  sourceFixture: SourceFixture,
  contract: PatternContractFixture,
  candidates: TruthCandidate[],
): void {
  const artifacts = buildGeneratedArtifacts({
    sourceFixture,
    contract,
    candidates,
    transcript,
    content: CONTENT,
  });
  if (!artifacts.report.ok) {
    throw new Error(
      `GeneratedCase 검증 실패:\n${artifacts.report.checks
        .filter((check) => !check.ok)
        .flatMap((check) => check.paths.map((path) => `- ${check.id}: ${path}`))
        .join('\n')}`,
    );
  }
  const resolved = resolve(outputDir);
  mkdirSync(resolved, { recursive: true });
  writeFileSync(
    resolve(resolved, 'transcript.json'),
    canonicalJson(transcript),
    'utf8',
  );
  writeFileSync(
    resolve(resolved, 'generated-case.json'),
    canonicalJson(artifacts.generatedCase),
    'utf8',
  );
  writeFileSync(
    resolve(resolved, 'generated-pack-v2.json'),
    canonicalJson(artifacts.pack),
    'utf8',
  );
  writeFileSync(
    resolve(resolved, 'validator-report.json'),
    canonicalJson(artifacts.report),
    'utf8',
  );
  console.log(
    `[case-generator-e2e] output=${artifacts.report.outputHash} provenance=${artifacts.report.provenanceHash}`,
  );
}

async function main(): Promise<void> {
  const live = process.argv.includes('--live');
  const replayPath = valueAfter('--replay');
  if (live === Boolean(replayPath)) {
    throw new Error('--live 또는 --replay <transcript.json> 중 하나만 지정한다.');
  }
  const sourcePath = requiredAfter('--source');
  const outputDir = requiredAfter('--out');
  const sourceFixturePath =
    valueAfter('--source-fixture') ??
    'fixtures/case-generator/pg204-invisible-man.source.json';
  const contractPath =
    valueAfter('--contract') ??
    'fixtures/case-generator/pg204-invisible-man.contract.json';
  const modelId = valueAfter('--model') ?? DEFAULT_MODEL;
  const baseUrl = valueAfter('--base-url') ?? DEFAULT_BASE_URL;

  const source = readFileSync(resolve(sourcePath), 'utf8');
  const sourceFixture = JSON.parse(
    readFileSync(resolve(sourceFixturePath), 'utf8'),
  ) as SourceFixture;
  const rebuiltFixture = buildSourceFixture(source);
  const sourceIssues = validateSourceFixture(sourceFixture, source);
  if (
    sourceIssues.length > 0 ||
    canonicalJson(sourceFixture) !== canonicalJson(rebuiltFixture)
  ) {
    throw new Error(
      `source fixture 불일치:\n${sourceIssues
        .map((issue) => `- ${issue.path}: ${issue.message}`)
        .join('\n')}`,
    );
  }
  const contract = JSON.parse(
    readFileSync(resolve(contractPath), 'utf8'),
  ) as PatternContractFixture;
  const approval = approvePatternContract(sourceFixture, contract);
  if (approval.issues.length > 0) {
    throw new Error(issueText('pattern contract', approval.issues));
  }
  const candidates = enumerateLegalCandidates(candidateInput(contract));
  if (candidates.length === 0) {
    throw new Error('합법 candidate가 없다.');
  }

  const transcript = live
    ? await runLive(candidates, contract, modelId, baseUrl)
    : (JSON.parse(
        readFileSync(resolve(replayPath!), 'utf8'),
      ) as ModelTranscript);
  writeArtifacts(outputDir, transcript, sourceFixture, contract, candidates);
}

await main();
