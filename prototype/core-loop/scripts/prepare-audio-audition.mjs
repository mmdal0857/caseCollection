import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';

const report = JSON.parse(
  readFileSync(resolve('audio/audio-qa-report.json'), 'utf8'),
);
if (!report.complete || report.records.some((record) => !record.pass)) {
  throw new Error('모든 후보가 QA를 통과한 뒤에만 audition page를 만들 수 있다');
}
const output = resolve('public/audio-candidates');
mkdirSync(output, { recursive: true });
for (const record of report.records) {
  copyFileSync(
    resolve(record.preparedPath),
    join(output, `${record.candidateId}.wav`),
  );
}
const groups = Object.values(
  report.records.reduce((result, record) => {
    (result[record.assetId] ??= []).push(record);
    return result;
  }, {}),
);
const cards = groups.map((records) => {
  const options = records.map((record, index) => `
    <label class="candidate">
      <span><input type="radio" name="${record.assetId}" value="${record.candidateId}"> 후보 ${record.candidateLabel ?? (index === 0 ? 'A' : 'B')} · ${record.modelVersion}</span>
      <audio controls preload="metadata" src="./${record.candidateId}.wav"></audio>
      <small>${record.metrics.integratedLufs.toFixed(1)} LUFS · peak ${record.metrics.peakDb.toFixed(1)} dBFS${record.metrics.loopBoundaryDelta === undefined ? '' : ` · loop Δ ${record.metrics.loopBoundaryDelta.toFixed(4)}`}</small>
    </label>
  `).join('');
  return `
    <section>
      <h2>${records[0].assetId}</h2>
      <p>${records[0].prompt}</p>
      <div class="pair">${options}</div>
    </section>
  `;
}).join('');
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>caseCollection 오디오 A/B</title>
  <style>
    :root{font-family:system-ui,sans-serif;color:#171512;background:#e8e0d2}
    body{max-width:1100px;margin:auto;padding:32px 20px 80px}
    h1{font-size:clamp(2rem,6vw,4rem);margin:.2em 0} .lede{max-width:70ch}
    section{border:2px solid;padding:18px;margin:20px 0;background:#f5efe4;box-shadow:6px 6px 0 #171512}
    h2{margin:0} section>p{color:#514b43}
    .pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .candidate{display:grid;gap:8px;border:1px solid;padding:12px;background:#fff}
    audio{width:100%} small{font-variant-numeric:tabular-nums}
    input[type=text]{width:100%;min-height:44px;box-sizing:border-box;padding:8px}
    textarea{width:100%;min-height:240px;box-sizing:border-box}
    button{min-height:44px;padding:0 18px;font-weight:800}
    @media(max-width:700px){.pair{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <p>LOCAL REVIEW · 티켓 30</p>
  <h1>오디오 A/B 청취 선택</h1>
  <p class="lede">각 역할에서 A 또는 B를 실제로 듣고 하나씩 선택하세요. 검토자와 선택 이유를 적고 9개를 모두 고르면 승격에 바로 사용할 수 있는 JSON이 완성됩니다. 이 페이지는 로컬 파일만 재생합니다.</p>
  ${cards}
  <section>
    <h2>선택 JSON</h2>
    <p><label>검토자 <input id="reviewer" type="text" autocomplete="name" placeholder="이름 또는 식별 가능한 별칭"></label></p>
    <p><label>선택 이유 <input id="reason" type="text" placeholder="예: 게임 톤과 기능성에 가장 적합한 후보"></label></p>
    <p id="status">0/9 선택</p>
    <textarea id="output" readonly></textarea>
    <button id="copy" type="button" disabled>JSON 복사</button>
  </section>
  <script>
    const expected = ${JSON.stringify(groups.map((records) => records[0].assetId))};
    const output = document.querySelector('#output');
    const status = document.querySelector('#status');
    const copy = document.querySelector('#copy');
    const reviewer = document.querySelector('#reviewer');
    const reason = document.querySelector('#reason');
    function render() {
      const reviewedAt = new Date().toISOString();
      const picks = expected.flatMap((assetId) => {
        const selected = document.querySelector('input[name="' + assetId + '"]:checked');
        return selected ? [{
          assetId,
          candidate:selected.value,
          reviewer:reviewer.value.trim(),
          reviewedAt,
          reason:reason.value.trim()
        }] : [];
      });
      const metadataReady = reviewer.value.trim() !== '' && reason.value.trim() !== '';
      status.textContent = picks.length + '/' + expected.length + ' 선택 · 검토 기록 ' + (metadataReady ? '완료' : '미완료');
      output.value = JSON.stringify({format:'audio-picks@1',picks}, null, 2);
      copy.disabled = picks.length !== expected.length || !metadataReady;
    }
    document.addEventListener('change', render);
    document.addEventListener('input', render);
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(output.value);
      copy.textContent = '복사 완료';
    });
    render();
  </script>
</body>
</html>`;
writeFileSync(join(output, 'index.html'), html);
console.log(`[audio-audition] ${groups.length} roles -> ${basename(output)}/index.html`);
