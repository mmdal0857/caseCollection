import type { AudioManifest, AudioFileRecord } from './audio';

const REMOTE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function publicAssetUrl(assetPath: string, base: string): string {
  if (REMOTE_URL.test(assetPath)) return assetPath;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${assetPath.replace(/^\/+/, '')}`;
}

function rebaseFile(file: AudioFileRecord, base: string): AudioFileRecord {
  return { ...file, path: publicAssetUrl(file.path, base) };
}

export function rebaseAudioManifest(
  manifest: AudioManifest,
  base: string,
): AudioManifest {
  return {
    ...manifest,
    assets: manifest.assets.map((asset) => ({
      ...asset,
      files: {
        wav: rebaseFile(asset.files.wav, base),
        ogg: rebaseFile(asset.files.ogg, base),
        mp3: rebaseFile(asset.files.mp3, base),
      },
    })),
  };
}
