export const AUDIO_SPEC_FORMAT = 'AudioAssetSpec@2' as const;
export const AUDIO_MANIFEST_FORMAT = 'audio-manifest@1' as const;
export const AUDIO_SETTINGS_KEY = 'caseCollection.audioSettings@1' as const;

export type AudioRole = 'music' | 'sfx';
export type MusicCue = 'title' | 'case';
export type SfxCue =
  | 'card_pick'
  | 'card_place'
  | 'facet_lock'
  | 'chain_release'
  | 'review_pass'
  | 'review_fail'
  | 'interlude_action';

export interface AudioSpecAsset {
  id: string;
  role: AudioRole;
  cue: string;
  duration: number;
  prompt: string;
  candidateLabels: string[];
}

export interface AudioAssetSpec {
  format: typeof AUDIO_SPEC_FORMAT;
  models: {
    music: AudioModelRecord;
    sfx: AudioModelRecord;
  };
  assets: AudioSpecAsset[];
  quality: {
    musicTargetLufs: number;
    sfxTargetLufs: number;
    truePeakMaxDb: number;
    silenceFloorLufs: number;
    durationToleranceSeconds: number;
    loopBoundaryDeltaMax: number;
    formats: ['wav', 'ogg', 'mp3'];
  };
}

export interface AudioModelRecord {
  provider: string;
  id: string;
  version: string;
  license: string;
  licenseUrl: string;
}

export interface AudioFileRecord {
  path: string;
  sha256: string;
  duration: number;
  peakDb: number;
  integratedLufs: number;
  loopBoundaryDelta?: number;
}

export interface HumanAudioPick {
  reviewer: string;
  reviewedAt: string;
  candidate: string;
  reason: string;
}

export interface AudioManifestAsset {
  id: string;
  role: AudioRole;
  cue: string;
  prompt: string;
  provider: string;
  model: string;
  modelVersion: string;
  license: string;
  licenseUrl: string;
  seed: number | null;
  generationId: string;
  generationUrl: string;
  duration: number;
  files: {
    wav: AudioFileRecord;
    ogg: AudioFileRecord;
    mp3: AudioFileRecord;
  };
  humanPick: HumanAudioPick;
}

export interface AudioManifest {
  format: typeof AUDIO_MANIFEST_FORMAT;
  generatedAt: string;
  assets: AudioManifestAsset[];
}

export interface AudioContractIssue {
  path: string;
  msg: string;
}

export interface AudioContractValidation {
  ok: boolean;
  issues: AudioContractIssue[];
}

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

export interface AudioPort {
  unlock(): Promise<void>;
  playSfx(cue: SfxCue): void;
  setMusic(cue: MusicCue | null): void;
  setMuted(muted: boolean): void;
  setVolumes(values: Partial<Pick<AudioSettings, 'master' | 'music' | 'sfx'>>): void;
  getSettings(): AudioSettings;
  dispose(): void;
}

const MUSIC_IDS = ['music_title', 'music_case'] as const;
const SFX_IDS: readonly SfxCue[] = [
  'card_pick',
  'card_place',
  'facet_lock',
  'chain_release',
  'review_pass',
  'review_fail',
  'interlude_action',
];
const HASH_RE = /^[a-f0-9]{64}$/;
const DEFAULT_SETTINGS: AudioSettings = {
  master: 0.8,
  music: 0.55,
  sfx: 0.8,
  muted: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(
  issues: AudioContractIssue[],
  ok: boolean,
  path: string,
  msg: string,
): void {
  if (!ok) issues.push({ path, msg });
}

function hasPositiveVoicePrompt(value: string): boolean {
  const withoutNegativeInstructions = value
    .toLowerCase()
    .replace(/\bno\s+(?:vocals?|voice|speech|spoken(?:\s+word)?)\b/g, '');
  return /\b(?:vocals?|voice|speech|spoken(?:\s+word)?)\b/.test(
    withoutNegativeInstructions,
  );
}

export function validateAudioSpec(value: unknown): AudioContractValidation {
  const issues: AudioContractIssue[] = [];
  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: '', msg: 'spec이 객체가 아니다' }] };
  }
  issue(issues, value.format === AUDIO_SPEC_FORMAT, 'format', 'AudioAssetSpec@2여야 한다');
  const assets = Array.isArray(value.assets) ? value.assets : [];
  issue(issues, assets.length === 9, 'assets', '정확히 9개 자산이어야 한다');
  const ids = assets
    .filter(isRecord)
    .map((asset) => String(asset.id));
  issue(issues, new Set(ids).size === ids.length, 'assets', 'asset id가 중복됐다');
  issue(
    issues,
    MUSIC_IDS.every((id) => ids.includes(id)),
    'assets',
    'title/case music loop가 모두 필요하다',
  );
  issue(
    issues,
    SFX_IDS.every((id) => ids.includes(id)),
    'assets',
    '의미 SFX 7개가 모두 필요하다',
  );
  assets.filter(isRecord).forEach((asset, index) => {
    const path = `assets[${index}]`;
    issue(
      issues,
      asset.role === 'music' || asset.role === 'sfx',
      `${path}.role`,
      'music 또는 sfx여야 한다',
    );
    issue(
      issues,
      typeof asset.prompt === 'string' &&
        !hasPositiveVoicePrompt(asset.prompt),
      `${path}.prompt`,
      '보이스 생성 지시가 없어야 한다',
    );
    issue(
      issues,
      Array.isArray(asset.candidateLabels) &&
        JSON.stringify(asset.candidateLabels) === JSON.stringify(['A', 'B']),
      `${path}.candidateLabels`,
      '청감 비교용 A/B 후보가 필요하다',
    );
  });
  issue(
    issues,
    !ids.some((id) => id.includes('voice') || id.includes('hover')),
    'assets',
    'voice와 hover SFX는 범위 밖이다',
  );
  const quality = isRecord(value.quality) ? value.quality : {};
  issue(
    issues,
    JSON.stringify(quality.formats) === JSON.stringify(['wav', 'ogg', 'mp3']),
    'quality.formats',
    'WAV/OGG/MP3를 모두 요구해야 한다',
  );
  return { ok: issues.length === 0, issues };
}

export function validateAudioManifest(
  value: unknown,
  specValue: unknown,
): AudioContractValidation {
  const issues: AudioContractIssue[] = [];
  const specCheck = validateAudioSpec(specValue);
  if (!specCheck.ok) {
    return {
      ok: false,
      issues: specCheck.issues.map((item) => ({
        ...item,
        path: `spec:${item.path}`,
      })),
    };
  }
  const spec = specValue as AudioAssetSpec;
  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: '', msg: 'manifest가 객체가 아니다' }] };
  }
  issue(
    issues,
    value.format === AUDIO_MANIFEST_FORMAT,
    'format',
    'audio-manifest@1이어야 한다',
  );
  const assets = Array.isArray(value.assets) ? value.assets : [];
  issue(
    issues,
    assets.length === spec.assets.length,
    'assets',
    'spec의 모든 자산이 있어야 한다',
  );
  const byId = new Map<string, Record<string, unknown>>();
  assets.filter(isRecord).forEach((asset) => byId.set(String(asset.id), asset));
  for (const expected of spec.assets) {
    const asset = byId.get(expected.id);
    const path = `assets.${expected.id}`;
    if (asset === undefined) {
      issues.push({ path, msg: 'manifest에 자산이 없다' });
      continue;
    }
    issue(issues, asset.role === expected.role, `${path}.role`, 'spec role과 다르다');
    issue(issues, asset.cue === expected.cue, `${path}.cue`, 'spec cue와 다르다');
    issue(
      issues,
      typeof asset.prompt === 'string' && asset.prompt === expected.prompt,
      `${path}.prompt`,
      '승인 spec prompt와 다르다',
    );
    const expectedModel = spec.models[expected.role];
    issue(
      issues,
      asset.provider === expectedModel.provider &&
        asset.model === expectedModel.id &&
        asset.modelVersion === expectedModel.version &&
        asset.license === expectedModel.license &&
        asset.licenseUrl === expectedModel.licenseUrl,
      `${path}.model`,
      '승인 공급자·모델·이용 조건과 다르다',
    );
    issue(
      issues,
      asset.seed === null || Number.isInteger(asset.seed),
      `${path}.seed`,
      '모델이 seed를 노출하지 않으면 null, 노출하면 정수여야 한다',
    );
    issue(
      issues,
      typeof asset.generationId === 'string' &&
        asset.generationId.length > 0 &&
        typeof asset.generationUrl === 'string' &&
        /^https:\/\//.test(asset.generationUrl),
      `${path}.generation`,
      'Higgsfield 생성 ID와 결과 URL이 필요하다',
    );
    const pick = isRecord(asset.humanPick) ? asset.humanPick : null;
    issue(
      issues,
      pick !== null &&
        typeof pick.reviewer === 'string' &&
        pick.reviewer.length > 0 &&
        typeof pick.reviewedAt === 'string' &&
        !Number.isNaN(Date.parse(pick.reviewedAt)) &&
        typeof pick.candidate === 'string' &&
        expected.candidateLabels.some(
          (label) => pick.candidate === `${expected.id}_${label}`,
        ) &&
        typeof pick.reason === 'string' &&
        pick.reason.length > 0,
      `${path}.humanPick`,
      '실제 사람의 선택 기록이 필요하다',
    );
    const files = isRecord(asset.files) ? asset.files : {};
    for (const format of ['wav', 'ogg', 'mp3'] as const) {
      const file = isRecord(files[format]) ? files[format] : null;
      issue(
        issues,
        file !== null &&
          typeof file.path === 'string' &&
          HASH_RE.test(String(file.sha256)) &&
          Number.isFinite(file.duration) &&
          Number.isFinite(file.peakDb) &&
          Number.isFinite(file.integratedLufs),
        `${path}.files.${format}`,
        '경로·SHA-256·duration·peak·loudness가 필요하다',
      );
    }
  }
  return { ok: issues.length === 0, issues };
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function loadSettings(): AudioSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) ?? 'null');
    if (!isRecord(parsed)) return { ...DEFAULT_SETTINGS };
    return {
      master: Number.isFinite(parsed.master)
        ? clampVolume(Number(parsed.master))
        : DEFAULT_SETTINGS.master,
      music: Number.isFinite(parsed.music)
        ? clampVolume(Number(parsed.music))
        : DEFAULT_SETTINGS.music,
      sfx: Number.isFinite(parsed.sfx)
        ? clampVolume(Number(parsed.sfx))
        : DEFAULT_SETTINGS.sfx,
      muted: parsed.muted === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: AudioSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 저장 실패는 오디오 설정만 휘발시킨다. 게임 상태에는 관여하지 않는다.
  }
}

export function createSilentAudioPort(): AudioPort {
  let settings = loadSettings();
  return {
    async unlock() {},
    playSfx() {},
    setMusic() {},
    setMuted(muted) {
      settings = { ...settings, muted };
      saveSettings(settings);
    },
    setVolumes(values) {
      settings = {
        ...settings,
        ...(values.master === undefined ? {} : { master: clampVolume(values.master) }),
        ...(values.music === undefined ? {} : { music: clampVolume(values.music) }),
        ...(values.sfx === undefined ? {} : { sfx: clampVolume(values.sfx) }),
      };
      saveSettings(settings);
    },
    getSettings: () => ({ ...settings }),
    dispose() {},
  };
}

class BrowserAudioPort implements AudioPort {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private settings = loadSettings();
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private failed = new Set<string>();
  private musicCue: MusicCue | null = null;
  private musicSource: AudioBufferSourceNode | null = null;

  constructor(private readonly manifest: AudioManifest) {
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  async unlock(): Promise<void> {
    if (this.context === null) {
      const AudioContextClass =
        globalThis.AudioContext ??
        (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass === undefined) return;
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.applyGains();
    }
    try {
      await this.context.resume();
      await this.startMusicIfReady();
    } catch {
      // autoplay 거부는 무음 유지. 다음 gesture에서 unlock을 다시 호출할 수 있다.
    }
  }

  playSfx(cue: SfxCue): void {
    void this.playOneShot(cue);
  }

  setMusic(cue: MusicCue | null): void {
    if (this.musicCue === cue) return;
    this.musicCue = cue;
    this.stopMusic();
    void this.startMusicIfReady();
  }

  setMuted(muted: boolean): void {
    this.settings = { ...this.settings, muted };
    saveSettings(this.settings);
    this.applyGains();
  }

  setVolumes(values: Partial<Pick<AudioSettings, 'master' | 'music' | 'sfx'>>): void {
    this.settings = {
      ...this.settings,
      ...(values.master === undefined ? {} : { master: clampVolume(values.master) }),
      ...(values.music === undefined ? {} : { music: clampVolume(values.music) }),
      ...(values.sfx === undefined ? {} : { sfx: clampVolume(values.sfx) }),
    };
    saveSettings(this.settings);
    this.applyGains();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  dispose(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.stopMusic();
    void this.context?.close().catch(() => undefined);
    this.context = null;
  }

  private readonly onVisibility = (): void => {
    this.applyGains();
  };

  private applyGains(): void {
    const hidden = typeof document !== 'undefined' && document.hidden;
    const master = this.settings.muted || hidden ? 0 : this.settings.master;
    if (this.masterGain !== null) this.masterGain.gain.value = master;
    if (this.musicGain !== null) this.musicGain.gain.value = this.settings.music;
    if (this.sfxGain !== null) this.sfxGain.gain.value = this.settings.sfx;
  }

  private assetForCue(cue: string): AudioManifestAsset | undefined {
    return this.manifest.assets.find((asset) => asset.cue === cue);
  }

  private bufferFor(asset: AudioManifestAsset): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(asset.id);
    if (cached !== undefined) return cached;
    const pending = this.decode(asset);
    this.buffers.set(asset.id, pending);
    return pending;
  }

  private async decode(asset: AudioManifestAsset): Promise<AudioBuffer | null> {
    if (this.context === null || this.failed.has(asset.id)) return null;
    const sources = [asset.files.ogg.path, asset.files.mp3.path];
    for (const path of sources) {
      try {
        const response = await fetch(path);
        if (!response.ok) continue;
        return await this.context.decodeAudioData(await response.arrayBuffer());
      } catch {
        // 다음 포맷을 시도한다.
      }
    }
    this.failed.add(asset.id);
    return null;
  }

  private async playOneShot(cue: SfxCue): Promise<void> {
    if (this.context === null || this.sfxGain === null) return;
    const asset = this.assetForCue(cue.replaceAll('_', '-'));
    if (asset === undefined) return;
    const buffer = await this.bufferFor(asset);
    if (buffer === null || this.context === null || this.sfxGain === null) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGain);
    try {
      source.start();
    } catch {
      // 재생 실패는 해당 one-shot만 버린다.
    }
  }

  private async startMusicIfReady(): Promise<void> {
    if (
      this.context === null ||
      this.musicGain === null ||
      this.musicCue === null ||
      this.musicSource !== null
    ) return;
    const asset = this.assetForCue(this.musicCue);
    if (asset === undefined) return;
    const buffer = await this.bufferFor(asset);
    if (
      buffer === null ||
      this.context === null ||
      this.musicGain === null ||
      this.musicSource !== null
    ) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);
    this.musicSource = source;
    source.onended = () => {
      if (this.musicSource === source) this.musicSource = null;
    };
    try {
      source.start();
    } catch {
      if (this.musicSource === source) this.musicSource = null;
    }
  }

  private stopMusic(): void {
    const source = this.musicSource;
    this.musicSource = null;
    if (source === null) return;
    source.onended = null;
    try {
      source.stop();
    } catch {
      // 이미 종료된 source다.
    }
  }
}

export function createBrowserAudioPort(manifest: AudioManifest | null): AudioPort {
  if (
    manifest === null ||
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return createSilentAudioPort();
  }
  return new BrowserAudioPort(manifest);
}
