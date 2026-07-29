import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { buildSync } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v1SchemaPath = resolve(root, 'schema/game-data-pack.json');
const v2SchemaPath = resolve(root, 'schema/game-data-pack-v2.json');
const outputPath = resolve(
  root,
  'src/lib/generated/game-data-pack-v2-validator.js',
);
const declarationPath = resolve(
  root,
  'src/lib/generated/game-data-pack-v2-validator.d.ts',
);
const v1Schema = JSON.parse(readFileSync(v1SchemaPath, 'utf8'));
const v2Schema = JSON.parse(readFileSync(v2SchemaPath, 'utf8'));
const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  code: { source: true, esm: true },
});
ajv.addSchema(v1Schema);
const validate = ajv.compile(v2Schema);
const standalone = `${standaloneCode(ajv, validate)}\n`;
const bundled = buildSync({
  stdin: {
    contents: standalone,
    resolveDir: root,
    sourcefile: 'game-data-pack-v2-validator.raw.js',
    loader: 'js',
  },
  bundle: true,
  platform: 'browser',
  format: 'esm',
  treeShaking: true,
  legalComments: 'none',
  logLevel: 'silent',
  write: false,
});
const output = bundled.outputFiles[0].text;
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

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8').replaceAll('\r\n', '\n');
  const currentDeclaration = readFileSync(declarationPath, 'utf8').replaceAll(
    '\r\n',
    '\n',
  );
  if (current !== output || currentDeclaration !== declaration) {
    process.stderr.write('generated validator is stale\n');
    process.exit(1);
  }
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, 'utf8');
  writeFileSync(declarationPath, declaration, 'utf8');
}
