import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Node rejects a direct spawn of a .cmd/.bat file with EINVAL since the
// CVE-2024-27980 fix; shell:true is now required. Args here are always
// internal, static npm script names (never external input), so the
// otherwise-warranted DEP0190 injection warning does not apply.
process.noDeprecation = true;

const FAIL_PATTERN = /\bFAIL\b/;
const TAIL_LENGTH = 8;

export const CORE_SMOKE_SCRIPTS = [
  'smoke:validator-esm',
  'smoke',
  'smoke:datapack',
  'smoke:pack-storage',
  'smoke:run-flow',
  'smoke:run-session',
  'smoke:collection',
  'smoke:narrative',
  'smoke:audio',
  'smoke:public-assets',
  'smoke:case-generator-e2e',
];

function createFailDetector() {
  let tail = '';
  return (chunkText) => {
    const window = tail + chunkText;
    const found = FAIL_PATTERN.test(window);
    tail = window.slice(-TAIL_LENGTH);
    return found;
  };
}

export async function runChecked(command, args, options = {}) {
  const {
    cwd = process.cwd(),
    stdout = process.stdout,
    stderr = process.stderr,
    env = process.env,
    shell = false,
  } = options;
  const detectStdoutFail = createFailDetector();
  const detectStderrFail = createFailDetector();
  let sawFail = false;

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, shell });
    const forward = (target, detectFail) => (chunk) => {
      if (detectFail(chunk.toString())) sawFail = true;
      target.write(chunk);
    };
    child.stdout.on('data', forward(stdout, detectStdoutFail));
    child.stderr.on('data', forward(stderr, detectStderrFail));
    child.on('error', (error) => {
      reject(new Error(`failed to start ${command}: ${error.message}`));
    });
    child.on('close', (code, signal) => {
      const label = `${command} ${args.join(' ')}`;
      if (signal) {
        reject(new Error(`${label} terminated by signal ${signal}`));
      } else if (sawFail) {
        reject(new Error(`${label} printed FAIL`));
      } else if (code !== 0) {
        reject(new Error(`${label} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

export async function runSmokeSuite(scripts, options = {}) {
  const {
    command = process.platform === 'win32' ? 'npm.cmd' : 'npm',
    buildArgs = (script) => ['run', script],
    cwd = process.cwd(),
    stdout = process.stdout,
    stderr = process.stderr,
    env = process.env,
    shell = process.platform === 'win32',
  } = options;
  for (const script of scripts) {
    await runChecked(command, buildArgs(script), { cwd, stdout, stderr, env, shell });
  }
}

async function main() {
  try {
    await runSmokeSuite(CORE_SMOKE_SCRIPTS);
    console.log(`PASS smoke:ci scripts=${CORE_SMOKE_SCRIPTS.length}`);
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
