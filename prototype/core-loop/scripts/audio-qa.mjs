import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { measureAudio, prepareCandidate } from './audio-metrics.mjs';

const args = new Map(
  process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (!value.startsWith('--')) return pairs;
    pairs.push([value.slice(2), values[index + 1]]);
    return pairs;
  }, []),
);
const specPath = resolve(args.get('spec') ?? 'audio/audio-spec.json');
const candidatesDir = resolve(args.get('candidates') ?? '.audio-candidates');
const reportPath = resolve(args.get('report') ?? 'audio/audio-qa-report.json');
const root = resolve('.');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const quality = spec.quality;
const records = [];
const expected = spec.assets.flatMap((asset) =>
  asset.candidateLabels.map((label) => `${asset.id}_${label}`),
);
const expectedIds = new Set(expected);
const assetById = new Map(spec.assets.map((asset) => [asset.id, asset]));

for (const name of readdirSync(candidatesDir).filter((item) => item.endsWith('.json'))) {
  const metadata = JSON.parse(readFileSync(join(candidatesDir, name), 'utf8'));
  if (!expectedIds.has(metadata.candidateId)) continue;
  const asset = assetById.get(metadata.assetId);
  const model = asset === undefined ? undefined : spec.models[asset.role];
  if (
    asset === undefined ||
    metadata.format !== 'audio-candidate@2' ||
    metadata.provider !== model.provider ||
    metadata.model !== model.id
  ) {
    throw new Error(`현재 spec과 출처가 다른 후보: ${metadata.candidateId}`);
  }
  const source = join(candidatesDir, metadata.rawPath);
  const prepared = join(candidatesDir, `${metadata.candidateId}.prepared.wav`);
  const targetLufs =
    metadata.role === 'music'
      ? quality.musicTargetLufs
      : quality.sfxTargetLufs;
  prepareCandidate(
    source,
    prepared,
    metadata.role,
    metadata.targetDuration,
    targetLufs,
  );
  const metrics = measureAudio(prepared, metadata.role === 'music');
  const gates = {
    duration:
      Math.abs(metrics.duration - metadata.targetDuration) <=
      quality.durationToleranceSeconds,
    nonSilent:
      Number.isFinite(metrics.integratedLufs) &&
      metrics.integratedLufs > quality.silenceFloorLufs,
    peak:
      Number.isFinite(metrics.peakDb) &&
      metrics.peakDb <= quality.truePeakMaxDb,
    loopBoundary:
      metadata.role !== 'music' ||
      (
        Number.isFinite(metrics.loopBoundaryDelta) &&
        metrics.loopBoundaryDelta <= quality.loopBoundaryDeltaMax
      ),
  };
  records.push({
    ...metadata,
    preparedPath: relative(root, prepared).replaceAll('\\', '/'),
    metrics,
    gates,
    pass: Object.values(gates).every(Boolean),
  });
}

records.sort((left, right) => left.candidateId.localeCompare(right.candidateId));
const present = new Set(records.map((record) => record.candidateId));
const report = {
  format: 'audio-qa-report@1',
  generatedAt: new Date().toISOString(),
  complete: expected.every((id) => present.has(id)),
  expectedCandidates: expected,
  missingCandidates: expected.filter((id) => !present.has(id)),
  records,
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `[audio-qa] ${records.filter((item) => item.pass).length}/${records.length} passing; ` +
  `missing=${report.missingCandidates.length}`,
);
if (!report.complete || records.some((record) => !record.pass)) process.exitCode = 1;
