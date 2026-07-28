import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  measureAudio,
  sha256File,
} from './audio-metrics.mjs';

const manifest = JSON.parse(
  readFileSync(resolve('public/audio/audio-manifest.json'), 'utf8'),
);
const picks = JSON.parse(
  readFileSync(resolve('audio/audio-picks.json'), 'utf8'),
);
const picksByAsset = new Map(
  picks.picks.map((pick) => [pick.assetId, pick]),
);
let verifiedFiles = 0;

function close(actual, recorded, tolerance, label) {
  if (
    !Number.isFinite(actual) ||
    !Number.isFinite(recorded) ||
    Math.abs(actual - recorded) > tolerance
  ) {
    throw new Error(
      `${label} 불일치: actual=${actual} recorded=${recorded}`,
    );
  }
}

if (manifest.assets.length !== 9 || picks.picks.length !== 9) {
  throw new Error('manifest와 picks는 정확히 9개 자산이어야 한다');
}

for (const asset of manifest.assets) {
  const pick = picksByAsset.get(asset.id);
  if (
    pick === undefined ||
    JSON.stringify(asset.humanPick) !==
      JSON.stringify({
        reviewer: pick.reviewer,
        reviewedAt: pick.reviewedAt,
        candidate: pick.candidate,
        reason: pick.reason,
      })
  ) {
    throw new Error(`${asset.id} humanPick이 사용자 선택과 다르다`);
  }
  for (const format of ['wav', 'ogg', 'mp3']) {
    const record = asset.files[format];
    const file = resolve('public', record.path.replace(/^\/+/, ''));
    const hash = sha256File(file);
    if (hash !== record.sha256) {
      throw new Error(`${asset.id}.${format} SHA-256 불일치`);
    }
    const metrics = measureAudio(file, asset.role === 'music');
    close(metrics.duration, record.duration, 0.001, `${asset.id}.${format}.duration`);
    close(metrics.peakDb, record.peakDb, 0.01, `${asset.id}.${format}.peakDb`);
    close(
      metrics.integratedLufs,
      record.integratedLufs,
      0.01,
      `${asset.id}.${format}.integratedLufs`,
    );
    if (asset.role === 'music') {
      close(
        metrics.loopBoundaryDelta,
        record.loopBoundaryDelta,
        0.000001,
        `${asset.id}.${format}.loopBoundaryDelta`,
      );
    }
    verifiedFiles++;
  }
}

console.log(
  `[audio-manifest] ${verifiedFiles}/27 files verified · ${manifest.assets.length}/9 human picks`,
);
