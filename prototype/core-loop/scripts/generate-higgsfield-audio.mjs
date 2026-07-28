import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function parseArgs(values) {
  const result = new Map();
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!value.startsWith('--')) continue;
    result.set(value.slice(2), values[index + 1]);
    index++;
  }
  return result;
}

function resolveCliEntry() {
  const override = process.env.CASE_HIGGSFIELD_ENTRY;
  if (override && existsSync(override)) return override;
  const roaming = process.env.APPDATA;
  const candidate = roaming
    ? join(
        roaming,
        'npm',
        'node_modules',
        '@higgsfield',
        'cli',
        'bin',
        'higgsfield.js',
      )
    : '';
  if (candidate && existsSync(candidate)) return candidate;
  throw new Error(
    'Higgsfield CLI를 찾지 못했다. CASE_HIGGSFIELD_ENTRY에 higgsfield.js 경로를 지정한다.',
  );
}

function runGeneration(cliEntry, args) {
  const command = spawnSync('rtk', [process.execPath, cliEntry, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (command.status !== 0) {
    throw new Error(
      `Higgsfield 생성 실패\n${String(command.stderr ?? '').slice(-3000)}`,
    );
  }
  const jobs = JSON.parse(command.stdout);
  const job = jobs[0];
  if (
    !job ||
    job.status !== 'completed' ||
    typeof job.id !== 'string' ||
    typeof job.result_url !== 'string'
  ) {
    throw new Error('완료된 Higgsfield 결과를 받지 못했다');
  }
  return job;
}

async function download(url, output) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Higgsfield 결과 다운로드 실패: HTTP ${response.status}`);
  }
  writeFileSync(output, Buffer.from(await response.arrayBuffer()));
}

const args = parseArgs(process.argv.slice(2));
const specPath = resolve(args.get('spec') ?? 'audio/audio-spec.json');
const outputDir = resolve(args.get('out') ?? '.audio-candidates');
const onlyAsset = args.get('asset');
const force = args.get('force') === 'true';
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const cliEntry = resolveCliEntry();
const assets = onlyAsset
  ? spec.assets.filter((asset) => asset.id === onlyAsset)
  : spec.assets;

if (assets.length === 0) {
  throw new Error(`spec에 없는 asset: ${onlyAsset}`);
}

mkdirSync(outputDir, { recursive: true });
for (const asset of assets) {
  const model = spec.models[asset.role];
  for (const candidateLabel of asset.candidateLabels) {
    const candidateId = `${asset.id}_${candidateLabel}`;
    const metadataPath = join(outputDir, `${candidateId}.json`);
    if (!force && existsSync(metadataPath)) {
      console.log(`[higgsfield-audio] skip ${candidateId}`);
      continue;
    }
    console.log(`[higgsfield-audio] generate ${candidateId} · ${model.version}`);
    const generationArgs = [
      'generate',
      'create',
      model.id,
      '--prompt',
      asset.prompt,
    ];
    if (asset.role === 'music') {
      generationArgs.push('--duration', String(asset.duration));
    } else {
      generationArgs.push('--format', 'wav', '--sample_rate', '48000');
    }
    generationArgs.push(
      '--wait',
      '--wait-timeout',
      '20m',
      '--json',
    );
    const job = runGeneration(cliEntry, generationArgs);
    const extension = extname(new URL(job.result_url).pathname) || '.bin';
    const rawName = `${candidateId}${extension}`;
    await download(job.result_url, join(outputDir, rawName));
    const metadata = {
      format: 'audio-candidate@2',
      candidateId,
      candidateLabel,
      assetId: asset.id,
      role: asset.role,
      cue: asset.cue,
      prompt: asset.prompt,
      targetDuration: asset.duration,
      provider: model.provider,
      model: model.id,
      modelVersion: model.version,
      license: model.license,
      licenseUrl: model.licenseUrl,
      seed: null,
      generationId: job.id,
      generationUrl: job.result_url,
      generatedAt: job.created_at,
      rawPath: rawName,
    };
    writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    console.log(
      `[higgsfield-audio] ready ${candidateId} · ${basename(rawName)}`,
    );
  }
}
