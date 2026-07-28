import { readFileSync, writeFileSync } from 'node:fs';
import {
  canonicalJson,
  migrateV1BasePack,
} from '../src/lib/datapack';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) process.exit(2);

const source = JSON.parse(readFileSync(inputPath, 'utf8')) as unknown;
const migrated = await migrateV1BasePack(source);
if (!migrated.ok || migrated.pack === undefined) process.exit(1);

writeFileSync(outputPath, canonicalJson(migrated.pack), 'utf8');
