import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import {
  measureAudio,
  sha256File,
  transcode,
} from './audio-metrics.mjs';

const args = new Map(
  process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (!value.startsWith('--')) return pairs;
    pairs.push([value.slice(2), values[index + 1]]);
    return pairs;
  }, []),
);
const spec = JSON.parse(readFileSync(resolve(args.get('spec') ?? 'audio/audio-spec.json'), 'utf8'));
const report = JSON.parse(readFileSync(resolve(args.get('report') ?? 'audio/audio-qa-report.json'), 'utf8'));
const picks = JSON.parse(readFileSync(resolve(args.get('picks') ?? 'audio/audio-picks.json'), 'utf8'));
const outputDir = resolve(args.get('out') ?? 'public/audio');
const manifestPath = join(outputDir, 'audio-manifest.json');
const root = resolve('.');
const reportById = new Map(report.records.map((record) => [record.candidateId, record]));
const pickByAsset = new Map(picks.picks.map((pick) => [pick.assetId, pick]));
const manifestAssets = [];

for (const asset of spec.assets) {
  const pick = pickByAsset.get(asset.id);
  if (pick === undefined) throw new Error(`human pick 없음: ${asset.id}`);
  const candidate = reportById.get(pick.candidate);
  if (candidate === undefined || !candidate.pass || candidate.assetId !== asset.id) {
    throw new Error(`통과한 후보가 아님: ${asset.id} -> ${pick.candidate}`);
  }
  if (
    !pick.reviewer ||
    !pick.reviewedAt ||
    !pick.reason ||
    Number.isNaN(Date.parse(pick.reviewedAt))
  ) {
    throw new Error(`human pick 기록 불완전: ${asset.id}`);
  }
  mkdirSync(outputDir, { recursive: true });
  const wav = join(outputDir, `${asset.id}.wav`);
  const ogg = join(outputDir, `${asset.id}.ogg`);
  const mp3 = join(outputDir, `${asset.id}.mp3`);
  copyFileSync(resolve(candidate.preparedPath), wav);
  transcode(wav, ogg, 'ogg');
  transcode(wav, mp3, 'mp3');
  const files = {};
  for (const [format, path] of Object.entries({ wav, ogg, mp3 })) {
    files[format] = {
      path: `/${relative(resolve('public'), path).replaceAll('\\', '/')}`,
      sha256: sha256File(path),
      ...measureAudio(path, asset.role === 'music'),
    };
  }
  manifestAssets.push({
    id: asset.id,
    role: asset.role,
    cue: asset.cue,
    prompt: asset.prompt,
    provider: candidate.provider,
    model: candidate.model,
    modelVersion: candidate.modelVersion,
    license: candidate.license,
    licenseUrl: candidate.licenseUrl,
    seed: candidate.seed,
    generationId: candidate.generationId,
    generationUrl: candidate.generationUrl,
    duration: asset.duration,
    files,
    humanPick: {
      reviewer: pick.reviewer,
      reviewedAt: pick.reviewedAt,
      candidate: pick.candidate,
      reason: pick.reason,
    },
  });
}

const manifest = {
  format: 'audio-manifest@1',
  generatedAt: new Date().toISOString(),
  assets: manifestAssets,
};
mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[audio-promote] wrote ${manifestPath} (${manifestAssets.length} assets)`);
