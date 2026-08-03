import { readFile } from 'node:fs/promises';

const rules = [
  { file: 'index.html', forbidden: ['PROTOTYPE', 'caseCollection'], required: ['<title>단서수집가</title>'] },
  { file: 'src/App.svelte', forbidden: ['CASE COLLECTION', '기존 run'], required: ['단서수집가', '기존 수사 기록'] },
  {
    file: 'src/lib/ui/HomeScreen.svelte',
    forbidden: ['CASE COLLECTION', '저장된 run', '<span>{collectionIssue}</span>'],
    required: [
      '단서수집가',
      '저장된 수사 기록',
      '컬렉션 저장 데이터가 손상되었습니다.',
      '현재 버전에서 읽을 수 없는 컬렉션 저장 데이터입니다.',
      '호환되지 않는 컬렉션 저장 데이터 형식입니다.',
      '저장된 컬렉션 상태가 유효하지 않습니다.',
    ],
  },
  { file: 'src/lib/ui/BriefingScreen.svelte', forbidden: ['BOSS BRIEFING', '`CASE ${'], required: ['최종 사건 브리핑', '`사건 ${'] },
  { file: 'src/lib/ui/CaseScreen.svelte', forbidden: ['CASE REVIEW'], required: ['사건 검토'] },
  { file: 'src/lib/ui/CollectionScreen.svelte', forbidden: ['>COLLECTION<'], required: ['>컬렉션<'] },
  { file: 'src/lib/ui/InterludeScreen.svelte', forbidden: ['>INTERLUDE', 'guest allowlist', 'AP 1'], required: ['막간 수사', '대여 가능 목록', '행동력 1'] },
  { file: 'src/lib/ui/EndScreen.svelte', forbidden: ['BAD ENDING', "'ENDING'", 'ending은', 'Run Summary'], required: ['실패 결말', "'결말'", '수사 요약'] },
  { file: 'src/lib/ui/RunSummaryScreen.svelte', forbidden: ['RUN SUMMARY', 'BAD 엔딩', '>Home<'], required: ['수사 요약', '실패 결말', '>첫 화면<'] },
  { file: 'src/lib/content.ts', forbidden: ['게스트 allowlist'], required: ['대여 가능 목록'] },
  { file: 'src/lib/run-session.ts', forbidden: ['올바른 JSON', '저장 envelope', 'RunSnapshot@1 형식', 'action sequence'], required: ['저장 데이터가 손상되었습니다.', '현재 버전에서 읽을 수 없는 저장 데이터입니다.', '호환되지 않는 저장 데이터 형식입니다.', '저장된 수사 상태가 유효하지 않습니다.'] },
  { file: 'src/lib/ui/DataPackScreen.svelte', forbidden: ['JSON parse failed', 'base 뒤에', 'manifest에서 비활성화'], required: ['JSON 해석 실패', '기본 팩 뒤에', '활성 목록에서 비활성화'] },
  { file: 'src/lib/pack-storage.ts', forbidden: ['활성 팩 body가 없다'], required: ['활성 팩 내용이 없다'] },
];

let failures = 0;
for (const { file, forbidden, required } of rules) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  for (const phrase of forbidden) {
    if (!source.includes(phrase)) continue;
    failures += 1;
    console.error(`FAIL ${file}: ${phrase}`);
  }
  for (const phrase of required) {
    if (source.includes(phrase)) continue;
    failures += 1;
    console.error(`FAIL ${file}: missing ${phrase}`);
  }
}

if (failures > 0) process.exitCode = 1;
else console.log('PASS Korean player UI copy');
