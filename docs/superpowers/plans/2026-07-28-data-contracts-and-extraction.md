# 데이터 팩 계약·원문 추출 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 티켓 16의 `game-data-pack@2` 로드·검증·명시적 병합·정적 브라우저 import와 티켓 14의 원문 근거 기반 replay 추출 경계를 구현하고 검증한다.

**Architecture:** JSON Schema v2를 형태 정본으로 두고 Ajv standalone validator를 생성한다. TypeScript loader는 교차 참조와 `base | alongside | promotion` 병합 정책만 담당하며, Python 빌드 파이프라인은 고정 응답 replay로 측면·태그를 만들고 같은 v2 팩을 emit한다.

**Tech Stack:** Svelte 5, TypeScript 5.7, Vite 6, Ajv 8 standalone, IndexedDB, localStorage, Python 3.14 표준 라이브러리, Node/esbuild smoke harness

## Global Constraints

- 기준 설계: `docs/superpowers/specs/2026-07-28-open-ticket-resolution-program-design.md` §3~5.
- v1 root schema는 보존한다. 새 envelope 필드는 `game-data-pack@2`에만 추가한다.
- 외부 v1 팩은 추측 병합하지 않고 `LEGACY_PACK_REQUIRES_MIGRATION`으로 거부한다.
- base와 외부 팩은 같은 v2 포맷을 사용한다.
- 외부 병합 모드는 `alongside | promotion` 중 하나이며 base만 `base`를 사용한다.
- `alongside` 콘텐츠 ID는 `pack ID + "."` 접두사를 가져야 하고 충돌은 오류다.
- `promotion`은 `promotionTargets[]`에 선언한 항목만 상쇄할 수 있다.
- JSON Schema는 Ajv standalone으로 실제 실행하며 TypeScript에 형태 검증을 복제하지 않는다.
- 런타임 LLM·서버·API 키를 추가하지 않는다.
- 기존 `CONTENT`, engine 결과, core smoke 결과를 변경하지 않는다.
- Svelte `$state`를 순수 reducer에 넘길 때는 `$state.snapshot(...)`을 사용한다.
- 기존 사용자 변경 `CLAUDE.md`, `.claude/`, `.vscode/`를 수정·stage하지 않는다.
- 커밋 단계는 명령을 준비하는 승인 게이트다. 별도 사용자 승인 전에는 실행하지 않는다.
- 티켓·`MAP.md` 통합은 프로젝트 권한 모델에 따라 Claude 또는 사용자가 지정한 integration owner가 수행한다.

---

## File Structure

### TypeScript·Svelte

- `prototype/core-loop/schema/game-data-pack.json`
  - 기존 v1 schema. 변경하지 않는다.
- `prototype/core-loop/schema/game-data-pack-v2.json`
  - v2 envelope와 전체 형태 정본.
- `prototype/core-loop/scripts/generate-pack-validator.mjs`
  - v2 schema에서 standalone validator와 declaration을 생성한다.
- `prototype/core-loop/scripts/migrate-pack-v1-to-v2.ts`
  - v1 base JSON만 v2 base로 변환한다.
- `prototype/core-loop/src/lib/generated/game-data-pack-v2-validator.js`
  - 생성 산출물. 직접 편집하지 않는다.
- `prototype/core-loop/src/lib/generated/game-data-pack-v2-validator.d.ts`
  - 생성 validator의 TypeScript 계약.
- `prototype/core-loop/src/lib/datapack.ts`
  - v2 타입, schema wrapper, 교차 필드 불변식, 병합, 무결성, preflight facade.
- `prototype/core-loop/src/lib/pack-storage.ts`
  - IndexedDB pack body와 localStorage 활성 순서를 관리한다.
- `prototype/core-loop/src/lib/ui/DataPackScreen.svelte`
  - file picker, preflight report, 적용·비활성화 UI.
- `prototype/core-loop/src/App.svelte`
  - `?data-packs=1` 개발 진입점을 연결한다.
- `prototype/core-loop/src/app.css`
  - pack 화면의 기존 토큰 기반 스타일.
- `prototype/core-loop/smoke-datapack.ts`
  - v2 schema·migration·merge·integrity 회귀.
- `prototype/core-loop/smoke-pack-storage.ts`
  - 저장소 interface와 manifest 순서의 Node smoke.
- `prototype/core-loop/package.json`
  - Ajv와 생성·smoke scripts.

### Python 빌드 파이프라인

- `scripts/game_data_pack/__init__.py`
  - 패키지 공개 API.
- `scripts/game_data_pack/contracts.py`
  - 추출 request/response, rubric, canonical JSON, validation.
- `scripts/game_data_pack/adapters.py`
  - replay facet extractor, replay taste filter, case assembler protocol.
- `scripts/game_data_pack/pipeline.py`
  - source → extract → validate → filter → v2 pack orchestration.
- `scripts/game_data_pack/cli.py`
  - CLI argument와 exit code.
- `scripts/game_data_pack/__main__.py`
  - `py -m scripts.game_data_pack` 진입점.
- `scripts/extract_game_data_pack.py`
  - 기존 호출자를 새 CLI로 넘기는 얇은 호환 wrapper.
- `scripts/tests/test_game_data_pack.py`
  - Python 표준 `unittest` 계약 검증.
- `scripts/tests/fixtures/extraction/source.json`
  - 고정 문단·해시 fixture.
- `scripts/tests/fixtures/extraction/facet-response.json`
  - 정상 replay 응답.
- `scripts/tests/fixtures/extraction/taste-response.json`
  - 정상 취향 필터 응답.
- `scripts/tests/fixtures/extraction/case-response.json`
  - adapter 경계 검증용 최소 case 응답.

### Integration records

- `.scratch/case-collection/issues/16-external-data-pack-loading.md`
  - 실제 검증 결과와 잠정 Resolution.
- `.scratch/case-collection/issues/14-tag-extraction-promotion.md`
  - 실제 검증 결과와 잠정 Resolution.
- `.scratch/case-collection/MAP.md`
  - integration owner가 검토·종결 후 갱신.

---

### Task 1: v2 JSON Schema와 standalone validator

**Files:**
- Create: `prototype/core-loop/schema/game-data-pack-v2.json`
- Create: `prototype/core-loop/scripts/generate-pack-validator.mjs`
- Create: `prototype/core-loop/src/lib/generated/game-data-pack-v2-validator.js`
- Create: `prototype/core-loop/src/lib/generated/game-data-pack-v2-validator.d.ts`
- Modify: `prototype/core-loop/package.json`
- Modify: `prototype/core-loop/smoke-datapack.ts`
- Test: `prototype/core-loop/smoke-datapack.ts`

**Interfaces:**
- Consumes: 기존 `schema/game-data-pack.json`의 `$defs`.
- Produces: `validatePackShape(data: unknown): boolean`과 `errors`가 있는 generated default export.

- [ ] **Step 1: 변경 전 기준선을 기록한다**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke
rtk npm run smoke:datapack
rtk npx tsc --noEmit
rtk npm run build
```

Expected: 네 명령 모두 exit 0. `smoke:datapack` 마지막 줄은
`[datapack] PASS — 팩 계약이 기계 판정으로 성립`.

- [ ] **Step 2: v2 envelope를 요구하는 실패 smoke를 먼저 쓴다**

`smoke-datapack.ts`의 imports와 A절에 다음 검사를 추가한다.

```ts
import {
  PACK_FORMAT_VERSION,
  validatePack,
} from './src/lib/datapack';

const minimalV2 = (over: Record<string, unknown> = {}): unknown => ({
  format: 'game-data-pack',
  formatVersion: 2,
  id: 'mod.test',
  mergeMode: 'alongside',
  provenance: {
    sourceSnapshotIds: ['fixture:test'],
    inputSha256: 'a'.repeat(64),
    validatorVersion: 'pack-v2',
    outputSha256: 'b'.repeat(64),
  },
  ...over,
});

check('A6 v2가 현재 버전', PACK_FORMAT_VERSION === 2);
check('A7 v2 최소 팩 통과', validatePack(minimalV2()).ok);
check(
  'A8 v1 외부 팩은 migration 요구',
  validatePack({ ...minimalV2(), formatVersion: 1 }).issues
    .some((issue) => issue.code === 'LEGACY_PACK_REQUIRES_MIGRATION'),
);
```

- [ ] **Step 3: smoke가 예상대로 실패하는지 확인한다**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke:datapack
```

Expected: TypeScript bundle이 `PACK_FORMAT_VERSION === 2` 또는 `issue.code`
계약 부재로 실패한다.

- [ ] **Step 4: v1 schema를 복사해 v2 envelope를 정확히 추가한다**

`game-data-pack-v2.json` root는 다음 필드를 required로 가진다.

```json
{
  "$id": "case-collection/game-data-pack@2",
  "required": [
    "format",
    "formatVersion",
    "id",
    "mergeMode",
    "provenance"
  ],
  "properties": {
    "format": { "const": "game-data-pack" },
    "formatVersion": { "const": 2 },
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9_.-]*$"
    },
    "mergeMode": {
      "enum": ["base", "alongside", "promotion"]
    },
    "promotionTargets": {
      "type": "array",
      "items": { "$ref": "#/$defs/promotionTarget" },
      "uniqueItems": true
    },
    "provenance": { "$ref": "#/$defs/packProvenance" }
  }
}
```

다음 `$defs`를 추가하고 기존 v1 `$defs`를 그대로 유지한다.

```json
{
  "promotionTarget": {
    "type": "object",
    "required": ["kind", "id", "expectedSourcePack"],
    "additionalProperties": false,
    "properties": {
      "kind": {
        "enum": ["clue", "pattern", "hint", "case", "run"]
      },
      "id": { "type": "string", "minLength": 1 },
      "expectedSourcePack": { "type": "string", "minLength": 1 }
    }
  },
  "packProvenance": {
    "type": "object",
    "required": [
      "sourceSnapshotIds",
      "inputSha256",
      "validatorVersion",
      "outputSha256"
    ],
    "additionalProperties": false,
    "properties": {
      "sourceSnapshotIds": {
        "type": "array",
        "items": { "type": "string", "minLength": 1 },
        "uniqueItems": true
      },
      "inputSha256": {
        "type": "string",
        "pattern": "^[a-f0-9]{64}$"
      },
      "modelId": { "type": "string" },
      "promptVersion": { "type": "string" },
      "seed": { "type": "integer" },
      "rawResponseSha256": {
        "type": "string",
        "pattern": "^[a-f0-9]{64}$"
      },
      "validatorVersion": { "type": "string", "minLength": 1 },
      "outputSha256": {
        "type": "string",
        "pattern": "^[a-f0-9]{64}$"
      }
    }
  }
}
```

Root `additionalProperties: false`를 유지하고 다음 두 properties를 예약한다.

```json
{
  "interludes": {
    "type": "array",
    "items": { "$ref": "#/$defs/interludeDefinition" }
  },
  "endings": {
    "type": "array",
    "items": { "$ref": "#/$defs/endingDefinition" }
  }
}
```

예약 `$defs`도 느슨한 객체가 아니라 다음 exact shape를 사용한다.

```json
{
  "interludeDefinition": {
    "type": "object",
    "required": [
      "id",
      "afterCaseId",
      "beforeCaseId",
      "apBudget",
      "actions",
      "presentation",
      "provenance"
    ],
    "additionalProperties": false,
    "properties": {
      "id": { "type": "string", "minLength": 1 },
      "afterCaseId": { "type": "string", "minLength": 1 },
      "beforeCaseId": { "type": "string", "minLength": 1 },
      "apBudget": { "const": 2 },
      "actions": {
        "type": "array",
        "minItems": 3,
        "maxItems": 3,
        "items": {
          "oneOf": [
            { "$ref": "#/$defs/reconAction" },
            { "$ref": "#/$defs/interviewAction" },
            { "$ref": "#/$defs/stabilizeAction" }
          ]
        }
      },
      "presentation": { "type": "string", "minLength": 1 },
      "provenance": { "$ref": "#/$defs/packProvenance" }
    }
  },
  "reconAction": {
    "type": "object",
    "required": [
      "id", "kind", "cost", "label", "resultText",
      "revealKind", "revealValue"
    ],
    "additionalProperties": false,
    "properties": {
      "id": { "type": "string", "minLength": 1 },
      "kind": { "const": "recon" },
      "cost": { "const": 1 },
      "label": { "type": "string", "minLength": 1 },
      "resultText": { "type": "string", "minLength": 1 },
      "revealKind": { "enum": ["background", "frame", "risk"] },
      "revealValue": { "type": "string", "minLength": 1 }
    }
  },
  "interviewAction": {
    "type": "object",
    "required": [
      "id", "kind", "cost", "label", "resultText", "guestFacetKey"
    ],
    "additionalProperties": false,
    "properties": {
      "id": { "type": "string", "minLength": 1 },
      "kind": { "const": "interview" },
      "cost": { "const": 1 },
      "label": { "type": "string", "minLength": 1 },
      "resultText": { "type": "string", "minLength": 1 },
      "guestFacetKey": {
        "type": "string",
        "pattern": "^[^:]+:[^:]+$"
      }
    }
  },
  "stabilizeAction": {
    "type": "object",
    "required": [
      "id", "kind", "cost", "label", "resultText", "stat", "delta"
    ],
    "additionalProperties": false,
    "properties": {
      "id": { "type": "string", "minLength": 1 },
      "kind": { "const": "stabilize" },
      "cost": { "const": 1 },
      "label": { "type": "string", "minLength": 1 },
      "resultText": { "type": "string", "minLength": 1 },
      "stat": { "enum": ["heat", "trust"] },
      "delta": { "type": "number", "exclusiveMaximum": 0 }
    }
  },
  "endingDefinition": {
    "type": "object",
    "required": [
      "id",
      "triggerRuleId",
      "warningRuleId",
      "presentation",
      "provenance"
    ],
    "additionalProperties": false,
    "properties": {
      "id": { "type": "string", "minLength": 1 },
      "triggerRuleId": { "type": "string", "minLength": 1 },
      "warningRuleId": { "type": "string", "minLength": 1 },
      "presentation": { "type": "string", "minLength": 1 },
      "provenance": { "$ref": "#/$defs/packProvenance" }
    }
  }
}
```

Task 1은 shape와 generated validator만 만든다. reachability·truth taint와
실제 런타임 소비는 티켓 29 계획의 책임이다.

- [ ] **Step 5: Ajv standalone generator를 작성한다**

`generate-pack-validator.mjs`의 핵심은 다음과 같다.

```js
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = resolve(root, 'schema/game-data-pack-v2.json');
const outputPath = resolve(
  root,
  'src/lib/generated/game-data-pack-v2-validator.js',
);
const declarationPath = resolve(
  root,
  'src/lib/generated/game-data-pack-v2-validator.d.ts',
);
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  code: { source: true, esm: true },
});
const validate = ajv.compile(schema);
const output = `${standaloneCode(ajv, validate)}\n`;
const declaration = `export interface GeneratedSchemaError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}
declare const validate: ((data: unknown) => boolean) & {
  errors?: GeneratedSchemaError[] | null;
};
export default validate;
`;
const check = process.argv.includes('--check');

if (check) {
  const current = readFileSync(outputPath, 'utf8');
  const currentDeclaration = readFileSync(declarationPath, 'utf8');
  if (current !== output || currentDeclaration !== declaration) {
    process.stderr.write('generated validator is stale\n');
    process.exit(1);
  }
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, 'utf8');
  writeFileSync(declarationPath, declaration, 'utf8');
}
```

Declaration은 다음 계약을 가진다.

```ts
export interface GeneratedSchemaError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

declare const validate: ((data: unknown) => boolean) & {
  errors?: GeneratedSchemaError[] | null;
};

export default validate;
```

- [ ] **Step 6: package scripts와 dependency를 추가한다**

`package.json`에 다음을 추가한다.

```json
{
  "scripts": {
    "schema:generate": "node scripts/generate-pack-validator.mjs",
    "schema:check": "node scripts/generate-pack-validator.mjs --check"
  },
  "devDependencies": {
    "ajv": "^8.17.1"
  }
}
```

Run from `prototype/core-loop`:

```powershell
rtk npm install
rtk npm run schema:generate
rtk npm run schema:check
```

Expected: 세 명령 exit 0, generated validator가 생성되고 check가 stale
오류 없이 끝난다.

- [ ] **Step 7: TypeScript wrapper를 최소 구현해 smoke를 통과시킨다**

`datapack.ts`에서 v2 shape error를 기존 issue 형식으로 변환한다.

```ts
import validatePackShape from './generated/game-data-pack-v2-validator.js';

export const PACK_FORMAT_VERSION = 2;

export type MergeMode = 'base' | 'alongside' | 'promotion';
export type PackItemKind = 'clue' | 'pattern' | 'hint' | 'case' | 'run';

export interface PromotionTarget {
  kind: PackItemKind;
  id: string;
  expectedSourcePack: string;
}

export interface PackProvenance {
  sourceSnapshotIds: string[];
  inputSha256: string;
  modelId?: string;
  promptVersion?: string;
  seed?: number;
  rawResponseSha256?: string;
  validatorVersion: string;
  outputSha256: string;
}

export interface GameDataPack {
  format: typeof PACK_FORMAT;
  formatVersion: typeof PACK_FORMAT_VERSION;
  id: string;
  name?: string;
  version?: string;
  mergeMode: MergeMode;
  promotionTargets?: PromotionTarget[];
  provenance: PackProvenance;
  clues?: Record<string, ClueCard>;
  patterns?: Record<string, PatternCard>;
  hintDefs?: Record<string, HintDef>;
  cases?: CaseDef[];
  run?: Partial<RunTuning>;
  interludes?: unknown[];
  endings?: unknown[];
}

export type PackIssueCode =
  | 'SCHEMA_INVALID'
  | 'LEGACY_PACK_REQUIRES_MIGRATION'
  | 'MERGE_POLICY_INVALID'
  | 'REFERENCE_INVALID'
  | 'ART_MISSING';

export interface PackIssue {
  code: PackIssueCode;
  path: string;
  msg: string;
  packId?: string;
  severity: 'error' | 'warning';
}

function schemaIssues(data: unknown): PackIssue[] {
  if (validatePackShape(data)) return [];
  return (validatePackShape.errors ?? []).map((error) => ({
    code: 'SCHEMA_INVALID',
    path: error.instancePath.replace(/^\//, '').replaceAll('/', '.'),
    msg: error.message ?? error.keyword,
    severity: 'error',
  }));
}
```

`formatVersion === 1`은 schema 실행 전에
`LEGACY_PACK_REQUIRES_MIGRATION` issue 하나를 반환한다.

- [ ] **Step 8: Task 1 검증과 승인 게이트**

Run from `prototype/core-loop`:

```powershell
rtk npm run schema:check
rtk npm run smoke:datapack
rtk npx tsc --noEmit
```

Expected: 모두 exit 0.

Commit after explicit approval:

```powershell
rtk git add prototype/core-loop/package.json prototype/core-loop/package-lock.json prototype/core-loop/schema/game-data-pack-v2.json prototype/core-loop/scripts/generate-pack-validator.mjs prototype/core-loop/src/lib/generated prototype/core-loop/src/lib/datapack.ts prototype/core-loop/smoke-datapack.ts
rtk git commit -m "feat: add game data pack v2 schema validator"
```

---

### Task 2: v1 base migration과 상세 issue 계약

**Files:**
- Create: `prototype/core-loop/scripts/migrate-pack-v1-to-v2.ts`
- Modify: `prototype/core-loop/src/lib/datapack.ts`
- Modify: `prototype/core-loop/smoke-datapack.ts`
- Test: `prototype/core-loop/smoke-datapack.ts`

**Interfaces:**
- Consumes: v1 base JSON, v1·v2 schemas.
- Produces: `migrateV1BasePack(data: unknown): Promise<MigrationResult>`, migration CLI.

- [ ] **Step 1: migration 실패 smoke를 쓴다**

```ts
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
```

- [ ] **Step 2: 실패를 확인한다**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke:datapack
```

Expected: `migrateV1BasePack` export 부재로 bundle FAIL.

- [ ] **Step 3: migration 결과 타입과 canonical hash helper를 구현한다**

```ts
export interface MigrationResult {
  ok: boolean;
  pack?: GameDataPack;
  issues: PackIssue[];
}

export function canonicalJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item !== null && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, nested]) => [key, normalize(nested)]),
      );
    }
    return item;
  };
  return `${JSON.stringify(normalize(value))}\n`;
}
```

Browser와 Node에서 같은 SHA-256을 쓰기 위해 hashing은 async
`crypto.subtle.digest('SHA-256', TextEncoder.encode(canonicalJson(value)))`
helper로 둔다.

- [ ] **Step 4: v1 base만 변환한다**

```ts
export async function migrateV1BasePack(data: unknown): Promise<MigrationResult> {
  if (!isObj(data) || data.formatVersion !== 1 || data.id !== 'base') {
    return {
      ok: false,
      issues: [{
        code: 'LEGACY_PACK_REQUIRES_MIGRATION',
        path: 'formatVersion',
        msg: 'v1 migration은 base pack에만 허용된다',
        severity: 'error',
      }],
    };
  }
  const inputSha256 = await sha256Hex(data);
  const withoutVersion = { ...data };
  const pack = {
    ...withoutVersion,
    formatVersion: 2,
    mergeMode: 'base',
    provenance: {
      sourceSnapshotIds: ['migration:v1-base'],
      inputSha256,
      validatorVersion: 'pack-v2',
      outputSha256: '0'.repeat(64),
    },
  };
  pack.provenance.outputSha256 = await sha256Hex({
    ...pack,
    provenance: { ...pack.provenance, outputSha256: '0'.repeat(64) },
  });
  const validation = validatePack(pack);
  return validation.ok
    ? { ok: true, pack: pack as GameDataPack, issues: [] }
    : { ok: false, issues: validation.issues };
}
```

- [ ] **Step 5: CLI를 구현한다**

CLI는 TypeScript로 작성하고 esbuild로 bundle한다. input·output을
명시적으로 받아 source를 덮어쓰지 않는다.

```ts
// bundled usage: node migrate-pack-v1-to-v2.mjs in.json out.json
import { readFileSync, writeFileSync } from 'node:fs';
import {
  canonicalJson,
  migrateV1BasePack,
} from '../src/lib/datapack';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) process.exit(2);
const source = JSON.parse(readFileSync(inputPath, 'utf8'));
if (source.id !== 'base' || source.formatVersion !== 1) process.exit(1);
const migrated = await migrateV1BasePack(source);
if (!migrated.ok) process.exit(1);
writeFileSync(outputPath, canonicalJson(migrated.pack), 'utf8');
```

`package.json`에 다음 script를 추가한다.

```json
{
  "scripts": {
    "pack:migrate": "esbuild scripts/migrate-pack-v1-to-v2.ts --bundle --format=esm --platform=node --outfile=migrate-pack-v1-to-v2.mjs && node migrate-pack-v1-to-v2.mjs"
  }
}
```

- [ ] **Step 6: migration과 회귀를 검증한다**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke:datapack
rtk npx tsc --noEmit
rtk npm run schema:check
```

Expected: 모두 exit 0, A9·A10 PASS.

Commit after explicit approval:

```powershell
rtk git add prototype/core-loop/scripts/migrate-pack-v1-to-v2.ts prototype/core-loop/src/lib/datapack.ts prototype/core-loop/smoke-datapack.ts prototype/core-loop/package.json
rtk git commit -m "feat: add explicit v1 base pack migration"
```

---

### Task 3: alongside·promotion 병합 정책

**Files:**
- Modify: `prototype/core-loop/src/lib/datapack.ts`
- Modify: `prototype/core-loop/smoke-datapack.ts`
- Test: `prototype/core-loop/smoke-datapack.ts`

**Interfaces:**
- Consumes: `GameDataPack[]`.
- Produces: `preflightPacks(packs: GameDataPack[]): PackPreflight`, policy-safe `loadPacks`.

- [ ] **Step 1: 명시적 병합 정책 실패 smoke를 쓴다**

```ts
const base = packFromContent('base', CONTENT);
const ghostBell = {
  ...CONTENT.clues.thread_fiber,
  name: '유령 종소리',
};
const makeV2Pack = (
  overrides: Partial<GameDataPack>,
): GameDataPack => ({
  format: 'game-data-pack',
  formatVersion: 2,
  id: 'mod.test',
  mergeMode: 'alongside',
  provenance: {
    sourceSnapshotIds: ['fixture'],
    inputSha256: '0'.repeat(64),
    validatorVersion: '2',
    outputSha256: '0'.repeat(64),
  },
  ...overrides,
});

const alongside = makeV2Pack({
  id: 'mod.ghost',
  mergeMode: 'alongside',
  clues: {
    'mod.ghost.ghost_bell': ghostBell,
  },
});
const accidentalCollision = makeV2Pack({
  id: 'mod.ghost',
  mergeMode: 'alongside',
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

check('E1 alongside 추가', loadPacks(base, [alongside]).ok);
check('E2 alongside 충돌 거부', !loadPacks(base, [accidentalCollision]).ok);
check('E3 promotion 선언 상쇄', loadPacks(base, [promotion]).ok);
check(
  'E4 미신고 promotion 충돌 거부',
  !loadPacks(base, [{ ...promotion, promotionTargets: [] }]).ok,
);
check(
  'E5 expectedSourcePack 불일치 거부',
  !loadPacks(base, [{
    ...promotion,
    promotionTargets: [{
      kind: 'clue',
      id: 'thread_fiber',
      expectedSourcePack: 'mod.other',
    }],
  }]).ok,
);
```

- [ ] **Step 2: 기존 자동 override 때문에 잘못 통과함을 확인한다**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke:datapack
```

Expected: E2·E4·E5 중 하나 이상 FAIL.

- [ ] **Step 3: merge policy 타입을 구현한다**

```ts
export interface PackAddition {
  kind: PackItemKind;
  id: string;
  by: string;
}

export interface PackPreflight {
  ok: boolean;
  issues: PackIssue[];
  additions: PackAddition[];
  overrides: MergeReport['overrides'];
  orderedPackIds: string[];
}

interface PackItemRef {
  kind: PackItemKind;
  id: string;
}

function policyIssue(
  packId: string,
  path: string,
  msg: string,
): PackIssue {
  return {
    code: 'MERGE_POLICY_INVALID',
    packId,
    path,
    msg,
    severity: 'error',
  };
}

function visitPackItems(
  pack: GameDataPack,
  visit: (item: PackItemRef) => void,
): void {
  Object.keys(pack.clues ?? {}).forEach((id) => visit({ kind: 'clue', id }));
  Object.keys(pack.patterns ?? {}).forEach((id) => visit({ kind: 'pattern', id }));
  Object.keys(pack.hintDefs ?? {}).forEach((id) => visit({ kind: 'hint', id }));
  (pack.cases ?? []).forEach(({ id }) => visit({ kind: 'case', id }));
  if (pack.run !== undefined) visit({ kind: 'run', id: 'run' });
}
```

- [ ] **Step 4: 모든 쓰기 전에 policy를 검증한다**

```ts
export function preflightPacks(
  packs: GameDataPack[],
): PackPreflight {
  const issues: PackIssue[] = [];
  const additions: PackAddition[] = [];
  const provenance: Record<string, string> = {};
  const overrides: MergeReport['overrides'] = [];
  const seenPackIds = new Set<string>();

  packs.forEach((pack, index) => {
    if (seenPackIds.has(pack.id)) {
      issues.push(policyIssue(pack.id, 'id', 'pack ID가 중복됐다'));
    }
    seenPackIds.add(pack.id);
    if (index === 0 && pack.mergeMode !== 'base') {
      issues.push(policyIssue(pack.id, 'mergeMode', '첫 팩은 base여야 한다'));
    }
    if (index > 0 && pack.mergeMode === 'base') {
      issues.push(policyIssue(pack.id, 'mergeMode', 'base는 첫 팩 하나뿐이다'));
    }
    visitPackItems(pack, ({ kind, id }) => {
      const key = `${kind}:${id}`;
      const from = provenance[key];
      if (from === undefined) {
        if (
          pack.mergeMode === 'alongside' &&
          kind !== 'run' &&
          !id.startsWith(`${pack.id}.`)
        ) {
          issues.push(policyIssue(
            pack.id,
            `${kind}.${id}`,
            `alongside id는 "${pack.id}."로 시작해야 한다`,
          ));
        }
        additions.push({ kind, id, by: pack.id });
        provenance[key] = pack.id;
        return;
      }
      const target = pack.promotionTargets?.find(
        (item) => item.kind === kind && item.id === id,
      );
      if (
        pack.mergeMode !== 'promotion' ||
        target?.expectedSourcePack !== from
      ) {
        issues.push(policyIssue(
          pack.id,
          `${kind}.${id}`,
          `상쇄 대상 ${kind}:${id}의 현재 소유자는 ${from}이다`,
        ));
        return;
      }
      overrides.push({ kind, id, from, by: pack.id });
      provenance[key] = pack.id;
    });
    for (const target of pack.promotionTargets ?? []) {
      const used = overrides.some((item) =>
        item.by === pack.id &&
        item.kind === target.kind &&
        item.id === target.id
      );
      if (!used) {
        issues.push(policyIssue(
          pack.id,
          `promotionTargets.${target.kind}.${target.id}`,
          '선언한 상쇄 대상에 대응하는 payload가 없다',
        ));
      }
    }
  });

  return {
    ok: issues.every((item) => item.severity !== 'error'),
    issues,
    additions,
    overrides,
    orderedPackIds: packs.map((pack) => pack.id),
  };
}
```

`alongside`의 `run` 필드는 전역 tuning을 충돌시키므로 거부한다.
`promotionTargets`에 선언됐지만 실제 payload에 없는 target도 오류다.

- [ ] **Step 5: merge와 load를 preflight 뒤에만 실행한다**

```ts
function validateAllPackShapes(
  values: unknown[],
): { ok: true; packs: GameDataPack[] } | { ok: false; issues: PackIssue[] } {
  const packs: GameDataPack[] = [];
  const issues: PackIssue[] = [];
  values.forEach((value, index) => {
    const checked = validatePack(value);
    if (!checked.ok) {
      issues.push(...checked.issues.map((issue) => ({
        ...issue,
        path: `packs.${index}.${issue.path}`,
      })));
    } else {
      packs.push(value as GameDataPack);
    }
  });
  return issues.length === 0
    ? { ok: true, packs }
    : { ok: false, issues };
}

function mergeValidatedPacks(
  packs: GameDataPack[],
): { content: RunContent; report: MergeReport } {
  return mergePacks(packs);
}

export function loadPacks(
  baseJson: unknown,
  externalJsons: unknown[] = [],
): LoadResult {
  const validated = validateAllPackShapes([baseJson, ...externalJsons]);
  if (!validated.ok) return validated;
  const preflight = preflightPacks(validated.packs);
  if (!preflight.ok) return { ok: false, issues: preflight.issues };
  const { content, report } = mergeValidatedPacks(validated.packs);
  const integrity = checkIntegrity(content);
  return {
    ok: integrity.length === 0,
    content,
    report,
    preflight,
    issues: integrity,
  };
}
```

- [ ] **Step 6: 정상·오류 정책과 전체 회귀를 검증한다**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke
rtk npm run smoke:datapack
rtk npx tsc --noEmit
```

Expected: 모두 exit 0. E1~E5 PASS. 기존 CONTENT JSON roundtrip과
무결성 결과가 변경되지 않는다.

Commit after explicit approval:

```powershell
rtk git add prototype/core-loop/src/lib/datapack.ts prototype/core-loop/smoke-datapack.ts
rtk git commit -m "feat: enforce explicit data pack merge modes"
```

---

### Task 4: IndexedDB body와 localStorage 활성 순서

**Files:**
- Create: `prototype/core-loop/src/lib/pack-storage.ts`
- Create: `prototype/core-loop/smoke-pack-storage.ts`
- Modify: `prototype/core-loop/package.json`
- Test: `prototype/core-loop/smoke-pack-storage.ts`

**Interfaces:**
- Consumes: validated `GameDataPack`.
- Produces: `PackStore`, `createIndexedDbPackStore`, `PackManifest`.

- [ ] **Step 1: in-memory store smoke를 먼저 쓴다**

```ts
import {
  createMemoryPackStore,
  resolveManifest,
  type PackManifest,
} from './src/lib/pack-storage';

const manifest: PackManifest = {
  version: 1,
  activePackIds: ['mod.b', 'mod.a'],
};
const store = createMemoryPackStore();
await store.put({ id: 'mod.a', json: { id: 'mod.a' }, importedAt: 1 });
await store.put({ id: 'mod.b', json: { id: 'mod.b' }, importedAt: 2 });
const ordered = await resolveManifest(store, manifest);
check(
  'S1 manifest 순서',
  ordered.packs.map((pack) => pack.id).join(',') === 'mod.b,mod.a',
);
check(
  'S2 없는 manifest id 경고',
  (await resolveManifest(store, {
    version: 1,
    activePackIds: ['mod.missing'],
  })).issues.some((issue) => issue.code === 'PACK_BODY_MISSING'),
);
```

- [ ] **Step 2: smoke가 export 부재로 실패하는지 확인한다**

Run from `prototype/core-loop`:

```powershell
rtk npx esbuild smoke-pack-storage.ts --bundle --format=esm --platform=node --outfile=smoke-pack-storage.mjs
```

Expected: `pack-storage` module 부재로 FAIL.

- [ ] **Step 3: storage interface와 순수 manifest 로직을 구현한다**

```ts
export interface StoredPack {
  id: string;
  json: unknown;
  importedAt: number;
}

export interface PackManifest {
  version: 1;
  activePackIds: string[];
}

export interface PackStorageIssue {
  code: 'PACK_BODY_MISSING' | 'MANIFEST_CORRUPT';
  id?: string;
  message: string;
}

export interface PackStore {
  list(): Promise<StoredPack[]>;
  get(id: string): Promise<StoredPack | undefined>;
  put(pack: StoredPack): Promise<void>;
  delete(id: string): Promise<void>;
}

export function createMemoryPackStore(): PackStore {
  const values = new Map<string, StoredPack>();
  return {
    list: async () => [...values.values()],
    get: async (id) => values.get(id),
    put: async (pack) => { values.set(pack.id, pack); },
    delete: async (id) => { values.delete(id); },
  };
}

export async function resolveManifest(
  store: PackStore,
  manifest: PackManifest,
): Promise<{ packs: StoredPack[]; issues: PackStorageIssue[] }> {
  const packs: StoredPack[] = [];
  const issues: PackStorageIssue[] = [];
  for (const id of manifest.activePackIds) {
    const pack = await store.get(id);
    if (pack === undefined) {
      issues.push({
        code: 'PACK_BODY_MISSING',
        id,
        message: `활성 팩 body가 없다: ${id}`,
      });
    } else {
      packs.push(pack);
    }
  }
  return { packs, issues };
}
```

- [ ] **Step 4: IndexedDB adapter를 구현한다**

DB와 key는 고정한다.

```ts
const DB_NAME = 'case-collection';
const DB_VERSION = 1;
const STORE_NAME = 'data-packs';
export const PACK_MANIFEST_KEY = 'case-collection.pack-manifest.v1';
```

`createIndexedDbPackStore(indexedDB)`는 `id` keyPath store를 만들고
각 transaction의 `oncomplete`, `onerror`, `onabort`를 Promise에 연결한다.
`loadPackManifest(storage)`는 parse 오류 시 빈 manifest와
`MANIFEST_CORRUPT` warning을 반환하고 원문 문자열을 삭제하지 않는다.

```ts
export interface ManifestStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadPackManifest(
  storage: ManifestStorage,
): { manifest: PackManifest; issues: PackStorageIssue[] } {
  const raw = storage.getItem(PACK_MANIFEST_KEY);
  if (raw === null) {
    return { manifest: { version: 1, activePackIds: [] }, issues: [] };
  }
  try {
    const value = JSON.parse(raw) as unknown;
    if (
      typeof value !== 'object' ||
      value === null ||
      (value as PackManifest).version !== 1 ||
      !Array.isArray((value as PackManifest).activePackIds) ||
      !(value as PackManifest).activePackIds.every(
        (id: unknown) => typeof id === 'string',
      )
    ) {
      throw new Error('invalid manifest shape');
    }
    return { manifest: value as PackManifest, issues: [] };
  } catch (error) {
    return {
      manifest: { version: 1, activePackIds: [] },
      issues: [{
        code: 'MANIFEST_CORRUPT',
        message: error instanceof Error ? error.message : String(error),
      }],
    };
  }
}

export function savePackManifest(
  storage: ManifestStorage,
  manifest: PackManifest,
): void {
  storage.setItem(PACK_MANIFEST_KEY, JSON.stringify(manifest));
}

export function createIndexedDbPackStore(
  factory: IDBFactory,
): PackStore {
  // openDb()는 onupgradeneeded에서 STORE_NAME을 keyPath "id"로 만든다.
  // list/get/put/delete는 각각 readonly/readwrite transaction 하나를 열고,
  // request 오류와 transaction abort를 모두 reject로 변환한다.
  return createIdbStore(factory, DB_NAME, DB_VERSION, STORE_NAME);
}
```

`createIdbStore`는 이 파일의 비공개 helper이며 `openDb`, `requestResult`,
`transactionDone` 세 Promise helper로 구현한다. smoke에서는 memory store만
사용하고, 브라우저 QA에서 실제 IndexedDB adapter를 검증한다.

- [ ] **Step 5: 실제 IndexedDB 없이 순수 계약을 통과시킨다**

`package.json`에 추가한다.

```json
{
  "scripts": {
    "smoke:pack-storage": "esbuild smoke-pack-storage.ts --bundle --format=esm --platform=node --outfile=smoke-pack-storage.mjs && node smoke-pack-storage.mjs"
  }
}
```

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke:pack-storage
rtk npx tsc --noEmit
```

Expected: exit 0, S1·S2 PASS.

Commit after explicit approval:

```powershell
rtk git add prototype/core-loop/src/lib/pack-storage.ts prototype/core-loop/smoke-pack-storage.ts prototype/core-loop/package.json
rtk git commit -m "feat: persist external data packs locally"
```

---

### Task 5: 정적 브라우저 data pack preflight 화면

**Files:**
- Create: `prototype/core-loop/src/lib/ui/DataPackScreen.svelte`
- Modify: `prototype/core-loop/src/App.svelte`
- Modify: `prototype/core-loop/src/app.css`
- Test: browser at `/?data-packs=1`

**Interfaces:**
- Consumes: `packFromContent('base', CONTENT)`, `loadPacks`, `PackStore`.
- Produces: file picker → report → confirm → persisted activation.

- [ ] **Step 1: 존재하지 않는 화면을 import해 build를 먼저 실패시킨다**

`App.svelte`에 다음 분기를 추가한다.

```svelte
<script lang="ts">
  import DataPackScreen from './lib/ui/DataPackScreen.svelte';
  import { packFromContent } from './lib/datapack';
  const showDataPacks =
    new URLSearchParams(window.location.search).get('data-packs') === '1';
</script>

{#if showDataPacks}
  <DataPackScreen basePack={packFromContent('base', CONTENT)} />
{:else}
  <!-- 기존 screen-holder 전체 -->
{/if}
```

Run from `prototype/core-loop`:

```powershell
rtk npm run build
```

Expected: `DataPackScreen.svelte`를 찾을 수 없어 FAIL.

- [ ] **Step 2: file read와 preflight 상태를 구현한다**

`DataPackScreen.svelte`의 state와 파일 handler는 다음 계약을 사용한다.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadPacks, type GameDataPack, type LoadResult } from '../datapack';
  import {
    createIndexedDbPackStore,
    loadPackManifest,
    resolveManifest,
    savePackManifest,
  } from '../pack-storage';

  let { basePack }: { basePack: GameDataPack } = $props();
  let candidates = $state<{ fileName: string; json: unknown }[]>([]);
  let result = $state<LoadResult | null>(null);
  let busy = $state(false);
  let persistError = $state('');
  const store = createIndexedDbPackStore(indexedDB);

  onMount(async () => {
    const loaded = loadPackManifest(localStorage);
    const resolved = await resolveManifest(store, loaded.manifest);
    candidates = resolved.packs.map((pack) => ({
      fileName: `${pack.id}.json`,
      json: pack.json,
    }));
    result = loadPacks(basePack, candidates.map((item) => item.json));
  });

  async function choose(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    candidates = [];
    for (const file of Array.from(input.files ?? [])) {
      try {
        candidates.push({
          fileName: file.name,
          json: JSON.parse(await file.text()),
        });
      } catch {
        candidates.push({
          fileName: file.name,
          json: { __parseError: true },
        });
      }
    }
    result = loadPacks(
      basePack,
      candidates.map((item) => item.json),
    );
  }

  async function confirmPacks(): Promise<void> {
    if (result?.ok !== true) return;
    busy = true;
    persistError = '';
    try {
      const packs = candidates.map((item) => item.json as GameDataPack);
      for (const pack of packs) {
        await store.put({
          id: pack.id,
          json: pack,
          importedAt: Date.now(),
        });
      }
      savePackManifest(localStorage, {
        version: 1,
        activePackIds: packs.map((pack) => pack.id),
      });
    } catch (error) {
      persistError = error instanceof Error ? error.message : String(error);
    } finally {
      busy = false;
    }
  }
</script>
```

- [ ] **Step 3: report와 confirm UI를 구현한다**

```svelte
<main class="pack-screen">
  <header>
    <p class="eyebrow">개발자 도구</p>
    <h1>데이터 팩</h1>
  </header>

  <label class="pack-picker">
    JSON 팩 선택
    <input type="file" accept=".json,application/json" multiple onchange={choose} />
  </label>

  {#if result}
    <section aria-live="polite">
      <h2>{result.ok ? '적용 가능' : '적용할 수 없음'}</h2>
      <p>
        추가 {result.preflight?.additions.length ?? 0} ·
        상쇄 {result.preflight?.overrides.length ?? 0} ·
        문제 {result.issues.length}
      </p>
      <ul>
        {#each result.issues as issue}
          <li class:error={issue.severity === 'error'}>
            <code>{issue.code}</code> {issue.path} — {issue.msg}
          </li>
        {/each}
      </ul>
      <button disabled={!result.ok || busy} onclick={confirmPacks}>
        검증된 팩 적용
      </button>
      {#if persistError}
        <p role="alert">{persistError}</p>
      {/if}
    </section>
  {/if}
</main>
```

`confirmPacks`는 result가 `ok`일 때만 모든 candidate body를 IndexedDB에
put하고 active order를 localStorage에 저장한다. 한 팩이라도 실패하면
어떤 body도 활성화하지 않는다.

- [ ] **Step 4: 기존 토큰으로 화면을 스타일한다**

`app.css`에 다음 최소 규칙을 추가한다.

```css
.pack-screen {
  width: min(920px, calc(100% - 48px));
  margin: 32px auto;
  color: var(--ink);
}

.pack-picker,
.pack-screen section {
  display: block;
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--ink) 28%, transparent);
  background: var(--bg);
}

.pack-screen li.error {
  color: #ef9a8f;
}

.pack-screen button:focus-visible,
.pack-screen input:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}
```

- [ ] **Step 5: build와 브라우저 수동 검증을 수행한다**

Run from `prototype/core-loop`:

```powershell
rtk npm run build
rtk npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/?data-packs=1`.

Verify:

1. 정상 alongside 팩은 추가 수와 적용 버튼을 보여준다.
2. 동명 ID 팩은 `MERGE_POLICY_INVALID`와 disabled 버튼을 보여준다.
3. 손상 JSON은 parse 오류로 표시되고 base 화면은 죽지 않는다.
4. 적용 후 새로고침해도 활성 순서가 유지된다.
5. 누락 art가 있는 정상 팩은 warning만 표시한다.

- [ ] **Step 6: 전체 회귀와 승인 게이트**

Run from `prototype/core-loop`:

```powershell
rtk npm run smoke
rtk npm run smoke:datapack
rtk npm run smoke:pack-storage
rtk npx tsc --noEmit
rtk npm run build
```

Expected: 모두 exit 0.

Commit after explicit approval:

```powershell
rtk git add prototype/core-loop/src/lib/ui/DataPackScreen.svelte prototype/core-loop/src/App.svelte prototype/core-loop/src/app.css
rtk git commit -m "feat: add local data pack preflight screen"
```

---

### Task 6: 원문 근거·tag rubric·replay extractor

**Files:**
- Create: `scripts/game_data_pack/__init__.py`
- Create: `scripts/game_data_pack/contracts.py`
- Create: `scripts/game_data_pack/adapters.py`
- Create: `scripts/tests/test_game_data_pack.py`
- Create: `scripts/tests/fixtures/extraction/source.json`
- Create: `scripts/tests/fixtures/extraction/facet-response.json`
- Create: `scripts/tests/fixtures/extraction/taste-response.json`
- Test: `scripts/tests/test_game_data_pack.py`

**Interfaces:**
- Consumes: `SourceSnapshot`, replay JSON.
- Produces: validated `FacetDraft[]`, `TasteDecision`, canonical SHA-256.

- [ ] **Step 1: 근거 없는 tag와 잘못된 span을 거부하는 실패 test를 쓴다**

```py
import copy
import json
import unittest
from hashlib import sha256
from pathlib import Path

from scripts.game_data_pack.contracts import (
    canonical_sha256,
    validate_facet_drafts,
)

FIXTURES = Path(__file__).parent / "fixtures" / "extraction"


class FacetDraftContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = json.loads(
            (FIXTURES / "source.json").read_text(encoding="utf-8")
        )
        self.response = json.loads(
            (FIXTURES / "facet-response.json").read_text(encoding="utf-8")
        )
        paragraph = self.source["paragraphs"][0]["text"]
        self.assertEqual(len(paragraph), 27)
        self.assertEqual(
            sha256(paragraph.encode("utf-8")).hexdigest(),
            self.source["sha256"],
        )

    def test_valid_response(self) -> None:
        self.assertEqual(
            validate_facet_drafts(self.source, self.response),
            [],
        )

    def test_rejects_quote_outside_source(self) -> None:
        bad = copy.deepcopy(self.response)
        bad["facets"][0]["evidence"][0]["quote"] = "원문에 없는 문장"
        issues = validate_facet_drafts(self.source, bad)
        self.assertIn("EVIDENCE_MISMATCH", {issue.code for issue in issues})

    def test_rejects_tag_without_rubric_reason(self) -> None:
        bad = copy.deepcopy(self.response)
        bad["facets"][0]["tagReasons"] = {}
        issues = validate_facet_drafts(self.source, bad)
        self.assertIn("TAG_REASON_MISSING", {issue.code for issue in issues})

    def test_canonical_hash_ignores_object_key_order(self) -> None:
        self.assertEqual(
            canonical_sha256({"b": 2, "a": 1}),
            canonical_sha256({"a": 1, "b": 2}),
        )
```

- [ ] **Step 2: test가 module 부재로 실패하는지 확인한다**

Run from repo root:

```powershell
rtk py -m unittest scripts.tests.test_game_data_pack -v
```

Expected: `scripts.game_data_pack.contracts` import FAIL.

- [ ] **Step 3: exact extraction contracts를 구현한다**

```py
from dataclasses import dataclass
from hashlib import sha256
import json
from typing import Any, Literal, TypedDict

KINDS = {"사람", "사물", "행위", "기록", "현상"}
FRAMES = {
    "route", "means", "trace", "action", "motive",
    "record", "omission", "scene", "identity",
}
TAG_RUBRIC = {
    "공개": "정보·행동을 공적 기록이나 다수의 시야에 올린다.",
    "은밀": "노출을 늘리지 않고 접근·관찰·회수를 가능하게 한다.",
    "강압": "위협·힘·압박으로 진술이나 행동을 얻는다.",
    "신중": "증거 보존·절차·검증을 우선한다.",
    "논리": "모순·시간·인과·배제로 가능한 해석을 줄인다.",
}


@dataclass(frozen=True)
class ExtractionIssue:
    code: str
    path: str
    message: str


class TasteDecision(TypedDict):
    decision: Literal["keep", "reject"]
    tasteScore: int
    reasons: list[str]


def canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ) + "\n"


def canonical_sha256(value: Any) -> str:
    return sha256(canonical_json(value).encode("utf-8")).hexdigest()


def validate_facet_drafts(source: dict, response: dict) -> list[ExtractionIssue]:
    issues: list[ExtractionIssue] = []
    paragraphs = {
        item["id"]: item["text"]
        for item in source.get("paragraphs", [])
        if isinstance(item, dict)
        and isinstance(item.get("id"), str)
        and isinstance(item.get("text"), str)
    }
    card = response.get("card", {})
    facets = response.get("facets", [])
    if card.get("kind") not in KINDS:
        issues.append(ExtractionIssue("KIND_INVALID", "card.kind", "허용 kind가 아니다"))
    if not isinstance(card.get("name"), str) or not card["name"].strip():
        issues.append(ExtractionIssue("CARD_NAME_EMPTY", "card.name", "카드명이 비어 있다"))
    if not isinstance(facets, list):
        return issues + [
            ExtractionIssue("FACETS_INVALID", "facets", "facets는 배열이어야 한다")
        ]

    seen_frames: set[str] = set()
    for index, facet in enumerate(facets):
        path = f"facets.{index}"
        frame = facet.get("frame")
        if frame not in FRAMES:
            issues.append(ExtractionIssue("FRAME_INVALID", f"{path}.frame", "허용 frame이 아니다"))
        elif frame in seen_frames:
            issues.append(ExtractionIssue("FRAME_DUPLICATE", f"{path}.frame", "card 안에서 frame이 중복됐다"))
        else:
            seen_frames.add(frame)

        tags = facet.get("tags")
        if not isinstance(tags, list) or not 1 <= len(tags) <= 2:
            issues.append(ExtractionIssue("TAG_COUNT_INVALID", f"{path}.tags", "tag는 1~2개여야 한다"))
            tags = []
        reasons = facet.get("tagReasons")
        if not isinstance(reasons, dict):
            reasons = {}
        for tag in tags:
            if tag not in TAG_RUBRIC:
                issues.append(ExtractionIssue("TAG_INVALID", f"{path}.tags", f"허용 tag가 아니다: {tag}"))
            if not isinstance(reasons.get(tag), str) or not reasons[tag].strip():
                issues.append(ExtractionIssue("TAG_REASON_MISSING", f"{path}.tagReasons.{tag}", "rubric 근거가 없다"))

        evidence = facet.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            issues.append(ExtractionIssue("EVIDENCE_MISSING", f"{path}.evidence", "원문 근거가 없다"))
            continue
        for evidence_index, item in enumerate(evidence):
            evidence_path = f"{path}.evidence.{evidence_index}"
            text = paragraphs.get(item.get("paragraphId"))
            start = item.get("start")
            end = item.get("end")
            quote = item.get("quote")
            if (
                text is None
                or not isinstance(start, int)
                or isinstance(start, bool)
                or not isinstance(end, int)
                or isinstance(end, bool)
                or start < 0
                or end < start
                or end > len(text)
                or text[start:end] != quote
            ):
                issues.append(ExtractionIssue("EVIDENCE_MISMATCH", evidence_path, "원문 span과 quote가 일치하지 않는다"))
    return issues


def validate_taste_response(value: dict) -> TasteDecision:
    if set(value) != {"decision", "tasteScore", "reasons"}:
        raise ValueError("taste response fields must be decision, tasteScore, reasons")
    score = value["tasteScore"]
    if (
        value["decision"] not in {"keep", "reject"}
        or not isinstance(score, int)
        or isinstance(score, bool)
        or not 0 <= score <= 100
        or not isinstance(value["reasons"], list)
        or not all(isinstance(reason, str) and reason for reason in value["reasons"])
    ):
        raise ValueError("invalid taste response")
    return value
```

`validate_facet_drafts`는 다음 순서로 검사한다.

1. kind·frame·tag enum
2. facet당 tag 1~2개
3. 동일 card의 frame 중복
4. `paragraphId`, `start`, `end`, `quote`가 source paragraph와 정확히 일치
5. 각 tag에 `tagReasons[tag]` 한 줄 존재
6. 카드명이 완성형 한글로 끝남

- [ ] **Step 4: replay adapter를 구현한다**

```py
import json
from pathlib import Path
from typing import Protocol

from .contracts import canonical_sha256


class FacetExtractor(Protocol):
    def extract(self, request: dict) -> dict: ...


class TasteFilter(Protocol):
    def decide(self, request: dict) -> dict: ...


class ReplayJsonAdapter:
    def __init__(self, root: Path, suffix: str) -> None:
        self.root = root
        self.suffix = suffix

    def run(self, request: dict) -> dict:
        path = self.root / f"{canonical_sha256(request)}.{self.suffix}.json"
        return json.loads(path.read_text(encoding="utf-8"))
```

`FacetReplayExtractor`와 `ReplayTasteFilter`는 `ReplayJsonAdapter`를
감싸고 각각 output shape를 검사한다. taste filter는
`keep | reject`, `tasteScore`, `reasons` 외 필드를 거부한다.

- [ ] **Step 5: fixture를 계약에 맞춰 고정한다**

`source.json`:

```json
{
  "id": "fixture:facet-contract",
  "sha256": "a633e0b7b7f67fa058e5d63f89415cb7635309d5430720b2fd845f667ad14422",
  "paragraphs": [
    {
      "id": "p1",
      "text": "장부의 날짜와 기차표의 시각은 서로 맞지 않았다."
    }
  ]
}
```

`facet-response.json`의 핵심:

```json
{
  "card": {
    "id": "fixture.time_gap",
    "name": "시각의 공백",
    "suit": "documentary",
    "kind": "기록"
  },
  "facets": [
    {
      "frame": "record",
      "meaning": "서로 모순되는 시각 기록",
      "tags": ["논리", "신중"],
      "tagReasons": {
        "논리": "두 기록의 시간 모순으로 해석을 줄인다.",
        "신중": "기록을 대조한 뒤 결론을 낸다."
      },
      "evidence": [
        {
          "paragraphId": "p1",
          "start": 0,
          "end": 27,
          "quote": "장부의 날짜와 기차표의 시각은 서로 맞지 않았다."
        }
      ]
    }
  ]
}
```

Test setup이 실제 paragraph 길이와 SHA-256을 계산해 fixture 메타를
검증하도록 한다. 숫자를 수동 신뢰하지 않는다.

- [ ] **Step 6: 계약 test를 통과시킨다**

Run from repo root:

```powershell
rtk py -m unittest scripts.tests.test_game_data_pack -v
```

Expected: 4개 이상 test PASS.

Commit after explicit approval:

```powershell
rtk git add scripts/game_data_pack scripts/tests/test_game_data_pack.py scripts/tests/fixtures/extraction
rtk git commit -m "feat: define evidence-backed facet extraction contract"
```

---

### Task 7: extraction pipeline·case adapter·v2 emit

**Files:**
- Create: `scripts/game_data_pack/pipeline.py`
- Create: `scripts/game_data_pack/cli.py`
- Create: `scripts/game_data_pack/__main__.py`
- Create: `scripts/tests/fixtures/extraction/case-response.json`
- Modify: `scripts/game_data_pack/adapters.py`
- Modify: `scripts/extract_game_data_pack.py`
- Modify: `scripts/tests/test_game_data_pack.py`
- Test: `scripts/tests/test_game_data_pack.py`
- Test: `prototype/core-loop/smoke-datapack.ts`

**Interfaces:**
- Consumes: OUT source inventory, replay adapters, explicit merge mode.
- Produces: canonical `game-data-pack@2` JSON.

- [ ] **Step 1: alongside와 promotion emit 실패 tests를 쓴다**

```py
from scripts.game_data_pack.pipeline import build_pack


class PipelineTests(unittest.TestCase):
    def test_alongside_prefixes_every_id(self) -> None:
        pack = build_pack(
            pack_id="extracted.fixture",
            merge_mode="alongside",
            source=self.source,
            facet_response=self.response,
            taste_response={"decision": "keep", "tasteScore": 80, "reasons": ["명료함"]},
            case_response={"cases": []},
            promotion_targets=[],
        )
        self.assertEqual(pack["formatVersion"], 2)
        self.assertEqual(pack["mergeMode"], "alongside")
        self.assertTrue(
            all(key.startswith("extracted.fixture.") for key in pack["clues"])
        )

    def test_promotion_requires_exact_target(self) -> None:
        with self.assertRaisesRegex(ValueError, "promotion target"):
            build_pack(
                pack_id="extracted.fixture",
                merge_mode="promotion",
                source=self.source,
                facet_response=self.response,
                taste_response={"decision": "keep", "tasteScore": 80, "reasons": ["명료함"]},
                case_response={"cases": []},
                promotion_targets=[],
            )
```

- [ ] **Step 2: pipeline module 부재로 실패하는지 확인한다**

Run from repo root:

```powershell
rtk py -m unittest scripts.tests.test_game_data_pack.PipelineTests -v
```

Expected: `pipeline` import FAIL.

- [ ] **Step 3: case assembler protocol을 구현한다**

```py
class CaseAssembler(Protocol):
    def assemble(self, request: dict) -> dict: ...


class ReplayCaseAssembler:
    def __init__(self, response_path: Path) -> None:
        self.response_path = response_path

    def assemble(self, request: dict) -> dict:
        response = json.loads(self.response_path.read_text(encoding="utf-8"))
        if set(response) != {"cases"} or not isinstance(response["cases"], list):
            raise ValueError("case response must contain only cases[]")
        return response
```

기존 `assemble_cases`의 빈 배열 STUB를 이 protocol 주입으로 교체한다.
clue-only 실행도 `ReplayCaseAssembler`에 `{"cases":[]}`를 명시적으로
전달해야 하며 adapter 없이 조용히 빈 배열을 만들지 않는다.

- [ ] **Step 4: v2 pack builder를 구현한다**

```py
import copy

from .contracts import (
    canonical_sha256,
    validate_facet_drafts,
    validate_taste_response,
)


def format_issues(issues: list) -> str:
    return "; ".join(
        f"{issue.code} {issue.path}: {issue.message}"
        for issue in issues
    )


def clue_from_facet_response(
    pack_id: str,
    merge_mode: str,
    response: dict,
) -> dict:
    card = response["card"]
    source_id = card["id"]
    clue_id = (
        f"{pack_id}.{source_id}"
        if merge_mode == "alongside"
        else source_id
    )
    facets = [
        {
            "key": f"{clue_id}:{facet['frame']}",
            "frame": facet["frame"],
            "meaning": facet["meaning"],
            "note": facet["meaning"],
            "tags": facet["tags"],
        }
        for facet in response["facets"]
    ]
    return {
        "id": clue_id,
        "name": card["name"],
        "suit": card["suit"],
        "kind": card["kind"],
        "tags": sorted({tag for facet in facets for tag in facet["tags"]}),
        "text": " / ".join(facet["meaning"] for facet in facets),
        "facets": facets,
    }


def require_promotion_target(
    clue_id: str,
    promotion_targets: list[dict],
) -> None:
    matches = [
        target
        for target in promotion_targets
        if target.get("kind") == "clue"
        and target.get("id") == clue_id
        and isinstance(target.get("expectedSourcePack"), str)
        and target["expectedSourcePack"]
    ]
    if len(matches) != 1:
        raise ValueError(f"promotion target missing or ambiguous: {clue_id}")


def build_provenance(source: dict, facet_response: dict) -> dict:
    return {
        "sourceSnapshotIds": [source["id"]],
        "inputSha256": canonical_sha256(source),
        "rawResponseSha256": canonical_sha256(facet_response),
        "validatorVersion": "facet-contract-v1",
        "outputSha256": "0" * 64,
    }


def pack_output_sha256(pack: dict) -> str:
    normalized = copy.deepcopy(pack)
    normalized["provenance"]["outputSha256"] = "0" * 64
    return canonical_sha256(normalized)


def build_pack(
    *,
    pack_id: str,
    merge_mode: str,
    source: dict,
    facet_response: dict,
    taste_response: dict,
    case_response: dict,
    promotion_targets: list[dict],
) -> dict:
    if merge_mode not in {"alongside", "promotion"}:
        raise ValueError("merge_mode must be alongside or promotion")
    if set(case_response) != {"cases"} or not isinstance(case_response["cases"], list):
        raise ValueError("case response must contain only cases[]")
    extraction_issues = validate_facet_drafts(source, facet_response)
    if extraction_issues:
        raise ValueError(format_issues(extraction_issues))
    taste = validate_taste_response(taste_response)
    if taste["decision"] != "keep":
        raise ValueError("taste filter rejected extraction")
    clue = clue_from_facet_response(pack_id, merge_mode, facet_response)
    if merge_mode == "promotion":
        require_promotion_target(clue["id"], promotion_targets)
    pack = {
        "format": "game-data-pack",
        "formatVersion": 2,
        "id": pack_id,
        "mergeMode": merge_mode,
        "promotionTargets": promotion_targets,
        "provenance": build_provenance(source, facet_response),
        "clues": {clue["id"]: clue},
        "cases": case_response["cases"],
    }
    pack["provenance"]["outputSha256"] = pack_output_sha256(pack)
    return pack
```

`clue_from_facet_response`는 alongside에서 `pack ID + "." + source card ID`로
ID와 facet key를 함께 바꾼다. promotion에서는 source card ID를 유지한다.

- [ ] **Step 5: CLI를 구현한다**

`py -m scripts.game_data_pack`는 아래 parser를 사용한다.

```py
def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-root", type=Path, default=Path("."))
    parser.add_argument("--pack-id", required=True)
    parser.add_argument(
        "--merge-mode",
        choices=("alongside", "promotion"),
        required=True,
    )
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--facet-response", type=Path, required=True)
    parser.add_argument("--taste-response", type=Path, required=True)
    parser.add_argument("--case-response", type=Path, required=True)
    parser.add_argument("--promotion-targets", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    return parser


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = create_parser().parse_args(argv)
    try:
        out_root = args.out_root.resolve()
        output = (out_root / args.out).resolve()
        output.relative_to(out_root)
        targets = (
            read_json(args.promotion_targets)
            if args.promotion_targets is not None
            else []
        )
        pack = build_pack(
            pack_id=args.pack_id,
            merge_mode=args.merge_mode,
            source=read_json(args.source),
            facet_response=read_json(args.facet_response),
            taste_response=read_json(args.taste_response),
            case_response=read_json(args.case_response),
            promotion_targets=targets,
        )
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary = output.with_suffix(output.suffix + ".tmp")
        temporary.write_text(canonical_json(pack), encoding="utf-8")
        temporary.replace(output)
        return 0
    except (OSError, json.JSONDecodeError) as error:
        print(error, file=sys.stderr)
        return 2
    except (ValueError, KeyError, TypeError) as error:
        print(error, file=sys.stderr)
        return 1
```

CLI는 stdout을 UTF-8로 재설정하고 검증 실패 시 exit 1, 입력 경로 오류 시
exit 2, 성공 시 exit 0을 반환한다. output은 temp sibling에 쓴 뒤
`Path.replace`로 원자 교체한다.

- [ ] **Step 6: 기존 script를 호환 wrapper로 바꾼다**

```py
#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.game_data_pack.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
```

문서화된 안정 명령은 Store alias 함정을 피하기 위해
`py -m scripts.game_data_pack`로 바꾼다.

- [ ] **Step 7: Python test와 TypeScript loader를 이어 검증한다**

Run from repo root:

```powershell
rtk py -m unittest scripts.tests.test_game_data_pack -v
rtk py -m scripts.game_data_pack --source scripts/tests/fixtures/extraction/source.json --facet-response scripts/tests/fixtures/extraction/facet-response.json --taste-response scripts/tests/fixtures/extraction/taste-response.json --case-response scripts/tests/fixtures/extraction/case-response.json --pack-id extracted.fixture --merge-mode alongside --out build/extracted.fixture.json
rtk py -m scripts.game_data_pack --source scripts/tests/fixtures/extraction/source.json --facet-response scripts/tests/fixtures/extraction/facet-response.json --taste-response scripts/tests/fixtures/extraction/taste-response.json --case-response scripts/tests/fixtures/extraction/case-response.json --pack-id extracted.fixture --merge-mode alongside --out build/extracted.fixture.replay.json
rtk proxy powershell -NoProfile -Command "(Get-FileHash 'build/extracted.fixture.json' -Algorithm SHA256).Hash -eq (Get-FileHash 'build/extracted.fixture.replay.json' -Algorithm SHA256).Hash"
```

`smoke-datapack.ts`에 repo-root 기준 `build/extracted.fixture.json`을 읽는
H section을 추가하고 base와 함께 `loadPacks`에 전달한다. Run from
`prototype/core-loop`:

```powershell
rtk npm run smoke:datapack
```

Expected: Python tests PASS, 두 CLI가 exit 0, hash 비교가 `True`, emitted
pack이 base와 alongside로 병합되고 integrity PASS.

- [ ] **Step 8: 전체 파동 회귀와 승인 게이트**

Run from repo root:

```powershell
rtk py -m unittest scripts.tests.test_game_data_pack -v
```

Run from `prototype/core-loop`:

```powershell
rtk npm run schema:check
rtk npm run smoke
rtk npm run smoke:datapack
rtk npm run smoke:pack-storage
rtk npx tsc --noEmit
rtk npm run build
```

Expected: 모두 exit 0.

Commit after explicit approval:

```powershell
rtk git add scripts/game_data_pack scripts/extract_game_data_pack.py scripts/tests prototype/core-loop/smoke-datapack.ts
rtk git commit -m "feat: emit evidence-backed extracted data packs"
```

---

### Task 8: 티켓 증거 기록과 integration handoff

**Files:**
- Modify: `.scratch/case-collection/issues/16-external-data-pack-loading.md`
- Modify: `.scratch/case-collection/issues/14-tag-extraction-promotion.md`
- Modify after integration approval: `.scratch/case-collection/MAP.md`
- Modify: `docs/superpowers/specs/2026-07-28-open-ticket-resolution-program-design.md`

**Interfaces:**
- Consumes: Tasks 1~7의 실제 명령 출력·브라우저 QA·diff.
- Produces: 두 티켓의 잠정 Resolution과 Claude 4점 검토 요청.

- [ ] **Step 1: 실제 변경 범위와 기존 dirty file을 다시 확인한다**

Run from repo root:

```powershell
rtk git status --short
rtk git diff --check
rtk git diff --stat
```

Expected: `CLAUDE.md`, `.claude/`, `.vscode/`는 기존 사용자 변경으로
분리돼 있고 이 계획 파일들만 구현 변경으로 식별된다.

- [ ] **Step 2: ticket 16에 검증 가능한 Resolution을 기록한다**

Header에 빈 review field를 추가한다.

```markdown
Reviewed-by:
```

Resolution에는 다음 사실만 실제 결과값으로 기록한다.

```markdown
## Resolution

`game-data-pack@2`를 base·외부 공통 계약으로 채택했다. 외부 팩은
`alongside | promotion`을 명시하며, alongside는 pack ID 접두사를 강제하고
promotion은 `promotionTargets[]`의 `kind + id + expectedSourcePack`과
일치하는 항목만 상쇄한다. v1 외부 팩은 자동 추측하지 않고 migration
오류로 거부한다.

형태 검증은 `schema/game-data-pack-v2.json`에서 생성한 Ajv standalone
validator가 담당하고, TypeScript는 병합 정책과 병합 후 참조 무결성만
검사한다. 브라우저 import는 file preflight 후 pack body를 IndexedDB에,
활성 순서를 localStorage에 저장한다. 오류 팩은 격리하고 base로 계속
시작한다.

검증:
- `npm run schema:check`, `smoke`, `smoke:datapack`,
  `smoke:pack-storage`, `tsc --noEmit`, `build`: 모두 exit 0
- 브라우저 `?data-packs=1`: alongside 적용, 충돌 거부, 손상 JSON 격리,
  새로고침 후 순서 유지
```
위 결과 중 하나라도 실제 실행과 다르면 Resolution을 기록하지 않고 해당
Task로 돌아간다.

- [ ] **Step 3: ticket 14에 검증 가능한 Resolution을 기록한다**

Header에 빈 `Reviewed-by:`를 추가하고 다음 결정을 실제 검증 결과와 함께
기록한다.

```markdown
## Resolution

슈트는 위키 clue library 분류를 유지하되 kind·frame·tag를 슈트에서
자동 추론하지 않는다. facet당 tag는 1~2개이며 각 tag는 원문 span과
역학 rubric 사유를 가진다. replay extractor가 enum·근거 span·중복
frame·조사 저작 규약을 기계 검증한 뒤 taste filter가
`keep/reject + tasteScore + reasons`만 반환한다.

수제 base와의 병합은 티켓 16의 alongside/promotion 계약을 사용한다.
case 조립은 별도 규칙을 발명하지 않고 티켓 18·28 생성기와 연결되는
`CaseAssembler` adapter를 호출한다. catalog 증가는 후보 팩만 만들며
MVP 24장·4 case를 자동 확장하지 않는다.

검증:
- `py -m unittest scripts.tests.test_game_data_pack -v`: exit 0
- replay CLI emit 2회: canonical SHA-256 동일
- emitted alongside 팩 + base: datapack smoke exit 0
```

- [ ] **Step 4: Claude 4점 검토용 handoff를 만든다**

두 티켓의 `## Claude 검토`에서 확인할 네 항목을 handoff에 명시한다.

```markdown
1. closed 결정 06·07·08·12·18과의 정합
2. CONTEXT.md의 팩·카드·측면·case 용어
3. schema·generated validator·fixture·실행 명령의 실재
4. smoke·unittest·browser 수용 조건 재실행
```

Claude 검토 전에는 `Reviewed-by:`를 비워 두고, 프로젝트 규약이 요구하면
`Status: open`을 유지한다. integration owner가 검토를 마치면
`Status: closed`, `Reviewed-by: Claude (YYYY-MM-DD)`, MAP 색인을 한 번에
반영한다.

- [ ] **Step 5: 설계 문서 상태를 실제 결과에 맞춘다**

설계 문서 header를 다음 중 실제 상태로 바꾼다.

```markdown
상태: 데이터 계약 파동 구현 완료, Claude 검토 대기
```

또는 Claude 검토가 같은 세션에 완료됐다면:

```markdown
상태: 데이터 계약 파동 검토·통합 완료
```

- [ ] **Step 6: 최종 파동 검증**

Run from repo root:

```powershell
rtk git diff --check
rtk py -m unittest scripts.tests.test_game_data_pack -v
```

Run from `prototype/core-loop`:

```powershell
rtk npm run schema:check
rtk npm run smoke
rtk npm run smoke:datapack
rtk npm run smoke:pack-storage
rtk npx tsc --noEmit
rtk npm run build
```

Expected: 모두 exit 0. ticket Resolution에 적은 숫자와 실제 출력이 일치한다.

Commit after explicit approval and integration-owner review:

```powershell
rtk git add .scratch/case-collection/issues/14-tag-extraction-promotion.md .scratch/case-collection/issues/16-external-data-pack-loading.md .scratch/case-collection/MAP.md docs/superpowers/specs/2026-07-28-open-ticket-resolution-program-design.md
rtk git commit -m "resolve: 데이터 팩 로드와 원문 추출 계약 (tickets 14, 16)"
```

---

## Plan Self-Review Checklist

- [x] Spec §3.2 v1/v2 경계가 Tasks 1~2에 있다.
- [x] Spec §4.1 alongside/promotion 정책이 Task 3에 있다.
- [x] Spec §4.2 schema·교차 참조 단계가 Tasks 1·3에 있다.
- [x] Spec §4.3 IndexedDB/localStorage UX가 Tasks 4~5에 있다.
- [x] Spec §4.4 수용 조건이 Tasks 1~5 smoke에 매핑된다.
- [x] Spec §5.1~5.2 추출 output·rubric이 Task 6에 있다.
- [x] Spec §5.3 adapter·taste filter가 Tasks 6~7에 있다.
- [x] Spec §5.4 alongside/promotion emit이 Task 7에 있다.
- [x] Spec §5.5 수용 조건이 Task 7 전체 회귀에 있다.
- [x] 두 티켓 Resolution과 Claude 검토 gate가 Task 8에 있다.
- [x] 모든 code step에 실제 signature 또는 payload가 있다.
- [x] commit은 별도 승인 전 실행하지 않는다는 제약이 모든 Task에 적용된다.
