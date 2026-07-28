import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function resolveMediaTool(name) {
  const override = process.env[`CASE_AUDIO_${name.toUpperCase()}`];
  if (override && existsSync(override)) return override;
  const direct = spawnSync('where.exe', [name], { encoding: 'utf8' });
  const fromPath = direct.stdout?.split(/\r?\n/).find(Boolean);
  if (direct.status === 0 && fromPath) return fromPath;
  const packages = join(
    process.env.LOCALAPPDATA ?? '',
    'Microsoft',
    'WinGet',
    'Packages',
  );
  if (existsSync(packages)) {
    for (const packageName of readdirSync(packages)) {
      if (!packageName.startsWith('Gyan.FFmpeg_')) continue;
      const packageDir = join(packages, packageName);
      for (const versionDir of readdirSync(packageDir)) {
        const candidate = join(packageDir, versionDir, 'bin', `${name}.exe`);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  throw new Error(`${name} executable not found`);
}

const FFMPEG = resolveMediaTool('ffmpeg');
const FFPROBE = resolveMediaTool('ffprobe');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.binary ? null : 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')}\n` +
      `${result.error?.message ?? ''}\n` +
      `${String(result.stderr ?? '').slice(-2000)}`,
    );
  }
  return result;
}

export function prepareCandidate(input, output, role, duration, targetLufs) {
  const filters = [
    `atrim=0:${duration}`,
    `apad=pad_dur=${duration}`,
    `atrim=0:${duration}`,
    `loudnorm=I=${targetLufs}:TP=-1.5:LRA=7`,
  ];
  if (role === 'music') {
    filters.push('afade=t=in:st=0:d=0.02');
    filters.push(`afade=t=out:st=${Math.max(0, duration - 0.02)}:d=0.02`);
  }
  run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-af', filters.join(','),
    '-ar', '48000',
    '-c:a', 'pcm_s24le',
    output,
  ]);
}

function lastNumber(text, regex) {
  const matches = [...text.matchAll(regex)];
  return matches.length === 0 ? Number.NaN : Number(matches.at(-1)[1]);
}

function loopBoundaryDelta(file) {
  const result = run(
    FFMPEG,
    [
      '-hide_banner', '-loglevel', 'error',
      '-i', file,
      '-f', 'f32le',
      '-acodec', 'pcm_f32le',
      '-ac', '2',
      '-ar', '48000',
      '-',
    ],
    { binary: true },
  );
  const buffer = result.stdout;
  const samples = new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    Math.floor(buffer.byteLength / 4),
  );
  // 클릭은 접합점 바로 주변의 불연속이다. 48 kHz stereo 기준 약 5.3 ms만
  // 비교해 음악적 프레이즈 차이를 click으로 오판하지 않는다.
  const count = Math.min(512, Math.floor(samples.length / 2));
  let squared = 0;
  for (let index = 0; index < count; index++) {
    const delta = samples[index] - samples[samples.length - count + index];
    squared += delta * delta;
  }
  return Math.sqrt(squared / Math.max(1, count));
}

export function measureAudio(file, includeLoop = false) {
  const probe = run(FFPROBE, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  const loudnessRun = run(FFMPEG, [
    '-hide_banner', '-nostats',
    '-i', file,
    '-filter_complex', 'ebur128=peak=true',
    '-f', 'null',
    'NUL',
  ]);
  const stderr = loudnessRun.stderr;
  const integratedLufs = lastNumber(stderr, /\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/g);
  const peakDb = lastNumber(stderr, /\bPeak:\s*(-?\d+(?:\.\d+)?)\s+dBFS/g);
  return {
    duration: Number(probe.stdout.trim()),
    peakDb,
    integratedLufs,
    ...(includeLoop ? { loopBoundaryDelta: loopBoundaryDelta(file) } : {}),
  };
}

export function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function transcode(input, output, format) {
  const codecArgs =
    format === 'ogg'
      ? ['-c:a', 'libvorbis', '-q:a', '6']
      : ['-c:a', 'libmp3lame', '-q:a', '2'];
  run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    ...codecArgs,
    output,
  ]);
}
