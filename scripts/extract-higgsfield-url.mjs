import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function extractResultUrl(jsonText) {
  const parsed = JSON.parse(jsonText);
  const jobs = Array.isArray(parsed) ? parsed : [parsed];
  return jobs.find((job) => typeof job?.result_url === 'string')?.result_url || '';
}

function main() {
  const input = fs.readFileSync(0, 'utf8');
  process.stdout.write(extractResultUrl(input));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
