import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const manifest = JSON.parse(
  readFileSync(resolve('public/audio/audio-manifest.json'), 'utf8'),
);
const outputDir = resolve('public/audio-candidates');
const items = manifest.assets.flatMap((asset) =>
  ['ogg', 'mp3'].map((format) => ({
    id: `${asset.id}.${format}`,
    path: asset.files[format].path,
  })),
);
const players = items
  .map(
    (item) => `
      <li>
        <strong>${item.id}</strong>
        <audio controls preload="metadata" data-id="${item.id}" src="${item.path}"></audio>
      </li>`,
  )
  .join('');
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>caseCollection 최종 오디오 검증</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:960px;margin:auto;padding:32px;background:#eee7da;color:#171512}
    li{display:grid;grid-template-columns:1fr 2fr;gap:12px;align-items:center;margin:10px 0}
    audio{width:100%}
  </style>
</head>
<body>
  <h1>최종 오디오 브라우저 디코드</h1>
  <p id="status">0/${items.length} decoded · 0 errors</p>
  <ul>${players}</ul>
  <script>
    const settled = new Map();
    const total = ${items.length};
    const status = document.querySelector('#status');
    function render() {
      const decoded = [...settled.values()].filter((value) => value === 'decoded').length;
      const errors = [...settled.values()].filter((value) => value === 'error').length;
      status.textContent = decoded + '/' + total + ' decoded · ' + errors + ' errors';
    }
    for (const audio of document.querySelectorAll('audio')) {
      const done = (result) => {
        if (settled.has(audio.dataset.id)) return;
        settled.set(audio.dataset.id, result);
        render();
      };
      audio.addEventListener('loadedmetadata', () => done('decoded'));
      audio.addEventListener('error', () => done('error'));
      if (audio.readyState >= 1) done('decoded');
    }
    render();
  </script>
</body>
</html>`;
mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'final.html'), html);
console.log(`[audio-browser-verify] ${items.length} sources -> audio-candidates/final.html`);
