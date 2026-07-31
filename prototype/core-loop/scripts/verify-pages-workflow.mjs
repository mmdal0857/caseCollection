import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const SHA_PATTERN = /^[0-9a-f]{40}$/;

const APPROVED_ACTIONS = new Map([
  ['actions/checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
  ['actions/setup-node', '249970729cb0ef3589644e2896645e5dc5ba9c38'],
  ['actions/configure-pages', '45bfe0192ca1faeb007ade9deae92b16b8254a0d'],
  ['actions/upload-pages-artifact', 'fc324d3547104276b827a68afc52ff2a11cc49c9'],
  ['actions/deploy-pages', 'cd2ce8fcbc39b97be8ca5fce6e763baed58fa128'],
]);

const REQUIRED_BUILD_COMMANDS = [
  'npm ci',
  'npm run schema:check',
  'npm run test:release-tools',
  'npm run smoke:ci',
  'npm run release:verify-source',
  'npm run typecheck',
  'npm run build',
  'npm run release:verify-dist',
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const WORKFLOW_PATH = path.resolve(scriptDir, '../../../.github/workflows/deploy-pages.yml');

function issue(issues, pathname, message) {
  issues.push({ path: pathname, message });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function collectSteps(document) {
  const jobs = isPlainObject(document?.jobs) ? document.jobs : {};
  const steps = [];
  for (const job of Object.values(jobs)) {
    for (const step of Array.isArray(job?.steps) ? job.steps : []) steps.push(step);
  }
  return steps;
}

function checkTrigger(document, issues) {
  const on = document?.on;
  const keys = isPlainObject(on) ? Object.keys(on) : [];
  if (keys.length !== 1 || keys[0] !== 'workflow_dispatch') {
    issue(issues, 'on', `must declare only workflow_dispatch, found: ${keys.join(', ') || '(none)'}`);
  }
}

function checkPermissions(pathname, actual, required, issues) {
  if (!isPlainObject(actual)) {
    issue(issues, pathname, `must be an object equal to ${JSON.stringify(required)}`);
    return;
  }
  const actualKeys = Object.keys(actual).sort();
  const requiredKeys = Object.keys(required).sort();
  const matches = actualKeys.length === requiredKeys.length
    && actualKeys.every((key, index) => key === requiredKeys[index] && actual[key] === required[key]);
  if (!matches) {
    issue(issues, pathname, `must be exactly ${JSON.stringify(required)}, found ${JSON.stringify(actual)}`);
  }
}

function checkBuildPermissions(document, issues) {
  const build = document?.jobs?.build;
  const effective = build?.permissions ?? document?.permissions;
  checkPermissions('jobs.build.permissions', effective, { contents: 'read' }, issues);
}

function checkDeployPermissions(document, issues) {
  const deploy = document?.jobs?.deploy;
  checkPermissions(
    'jobs.deploy.permissions',
    deploy?.permissions,
    { pages: 'write', 'id-token': 'write' },
    issues,
  );
}

function checkEnvironment(document, issues) {
  const name = document?.jobs?.deploy?.environment?.name;
  if (name !== 'github-pages') {
    issue(issues, 'jobs.deploy.environment.name', `must be "github-pages", found ${JSON.stringify(name)}`);
  }
}

function checkWorkingDirectory(document, issues) {
  const workingDirectory = document?.jobs?.build?.defaults?.run?.['working-directory'];
  if (workingDirectory !== 'prototype/core-loop') {
    issue(
      issues,
      'jobs.build.defaults.run.working-directory',
      `must be "prototype/core-loop", found ${JSON.stringify(workingDirectory)}`,
    );
  }
}

function checkRequiredCommands(document, issues) {
  const runSteps = (document?.jobs?.build?.steps ?? [])
    .map((step) => step?.run)
    .filter((command) => typeof command === 'string');
  for (const required of REQUIRED_BUILD_COMMANDS) {
    if (!runSteps.some((command) => command.includes(required))) {
      issue(issues, 'jobs.build.steps', `missing required command: ${required}`);
    }
  }
}

function checkUploadPath(document, issues) {
  const uploadStep = collectSteps(document).find(
    (step) => typeof step?.uses === 'string' && step.uses.startsWith('actions/upload-pages-artifact'),
  );
  const uploadPath = uploadStep?.with?.path;
  if (uploadPath !== 'prototype/core-loop/dist') {
    issue(
      issues,
      'uses:actions/upload-pages-artifact',
      `path must be "prototype/core-loop/dist", found ${JSON.stringify(uploadPath)}`,
    );
  }
}

function checkConcurrency(document, issues) {
  const concurrency = document?.concurrency;
  if (concurrency?.group !== 'pages') {
    issue(issues, 'concurrency.group', `must be "pages", found ${JSON.stringify(concurrency?.group)}`);
  }
  if (concurrency?.['cancel-in-progress'] !== false) {
    issue(
      issues,
      'concurrency.cancel-in-progress',
      `must be boolean false, found ${JSON.stringify(concurrency?.['cancel-in-progress'])}`,
    );
  }
}

function checkDeployNeedsBuild(document, issues) {
  const needs = document?.jobs?.deploy?.needs;
  const needsBuild = needs === 'build' || (Array.isArray(needs) && needs.length === 1 && needs[0] === 'build');
  if (!needsBuild) {
    issue(issues, 'jobs.deploy.needs', `must be "build", found ${JSON.stringify(needs)}`);
  }
}

function checkActions(document, issues) {
  const usedRepos = new Set();
  for (const step of collectSteps(document)) {
    const uses = step?.uses;
    if (typeof uses !== 'string') continue;
    const atIndex = uses.lastIndexOf('@');
    if (atIndex === -1) {
      issue(issues, `uses:${uses}`, 'must be pinned with @<sha>');
      continue;
    }
    const repo = uses.slice(0, atIndex);
    const ref = uses.slice(atIndex + 1);
    usedRepos.add(repo);
    const approvedSha = APPROVED_ACTIONS.get(repo);
    if (approvedSha === undefined) {
      issue(issues, `uses:${repo}`, 'is not one of the five approved action repositories');
      continue;
    }
    if (!SHA_PATTERN.test(ref)) {
      issue(issues, `uses:${repo}`, `must be pinned to a 40-character lowercase SHA, found "${ref}"`);
      continue;
    }
    if (ref !== approvedSha) {
      issue(issues, `uses:${repo}`, `must be pinned to ${approvedSha}, found ${ref}`);
    }
  }
  for (const repo of APPROVED_ACTIONS.keys()) {
    if (!usedRepos.has(repo)) issue(issues, `uses:${repo}`, 'is required but missing from the workflow');
  }
}

export function validatePagesWorkflow(document) {
  const issues = [];
  checkTrigger(document, issues);
  checkBuildPermissions(document, issues);
  checkDeployPermissions(document, issues);
  checkEnvironment(document, issues);
  checkWorkingDirectory(document, issues);
  checkRequiredCommands(document, issues);
  checkUploadPath(document, issues);
  checkConcurrency(document, issues);
  checkDeployNeedsBuild(document, issues);
  checkActions(document, issues);
  return { ok: issues.length === 0, issues };
}

async function main() {
  const text = await readFile(WORKFLOW_PATH, 'utf8');
  const document = parse(text);
  const report = validatePagesWorkflow(document);
  if (!report.ok) {
    for (const current of report.issues) console.error(`FAIL ${current.path}: ${current.message}`);
    process.exitCode = 1;
    return;
  }
  console.log('PASS deploy-pages.yml verified');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  });
}
