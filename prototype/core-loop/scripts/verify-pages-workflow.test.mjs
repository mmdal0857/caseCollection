import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';

import { validatePagesWorkflow, WORKFLOW_PATH } from './verify-pages-workflow.mjs';

const SHAS = {
  checkout: '3d3c42e5aac5ba805825da76410c181273ba90b1',
  setupNode: '249970729cb0ef3589644e2896645e5dc5ba9c38',
  configurePages: '45bfe0192ca1faeb007ade9deae92b16b8254a0d',
  uploadPagesArtifact: 'fc324d3547104276b827a68afc52ff2a11cc49c9',
  deployPages: 'cd2ce8fcbc39b97be8ca5fce6e763baed58fa128',
};

function validDocument() {
  return {
    name: 'Deploy GitHub Pages',
    on: { workflow_dispatch: null },
    permissions: { contents: 'read' },
    concurrency: { group: 'pages', 'cancel-in-progress': false },
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        defaults: { run: { 'working-directory': 'prototype/core-loop' } },
        steps: [
          { uses: `actions/checkout@${SHAS.checkout}` },
          {
            uses: `actions/setup-node@${SHAS.setupNode}`,
            with: { 'node-version': 24, cache: 'npm', 'cache-dependency-path': 'prototype/core-loop/package-lock.json' },
          },
          { uses: `actions/configure-pages@${SHAS.configurePages}` },
          { run: 'npm ci' },
          { run: 'npm run schema:check' },
          { run: 'npm run test:release-tools' },
          { run: 'npm run smoke:ci' },
          { run: 'npm run release:verify-source' },
          { run: 'npm run typecheck' },
          { run: 'npm run build' },
          { run: 'npm run release:verify-dist' },
          {
            uses: `actions/upload-pages-artifact@${SHAS.uploadPagesArtifact}`,
            with: { path: 'prototype/core-loop/dist' },
          },
        ],
      },
      deploy: {
        needs: 'build',
        'runs-on': 'ubuntu-latest',
        permissions: { pages: 'write', 'id-token': 'write' },
        environment: { name: 'github-pages', url: '${{ steps.deployment.outputs.page_url }}' },
        steps: [
          { name: 'Deploy', id: 'deployment', uses: `actions/deploy-pages@${SHAS.deployPages}` },
        ],
      },
    },
  };
}

function clone(document) {
  return structuredClone(document);
}

test('accepts the approved workflow document with no issues', () => {
  assert.deepEqual(validatePagesWorkflow(validDocument()), { ok: true, issues: [] });
});

test('top-level workflow rejects a shell default that neutralizes exact run steps', () => {
  const document = clone(validDocument());
  document.defaults = { run: { shell: 'bash {0} || true' } };

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'workflow'));
});

test('top-level workflow rejects env that can change command behavior', () => {
  const document = clone(validDocument());
  document.env = { NODE_OPTIONS: '--require ./bypass.cjs' };

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'workflow'));
});

test('top-level workflow requires the approved workflow name', () => {
  const document = clone(validDocument());
  document.name = 'Deploy bypass';

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'name'));
});

test('rejects an extra trigger alongside workflow_dispatch', () => {
  const document = clone(validDocument());
  document.on.push = { branches: ['main'] };

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'on'));
});

test('rejects extra build permissions beyond contents: read', () => {
  const document = clone(validDocument());
  document.permissions = { contents: 'read', actions: 'read' };

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.build.permissions'));
});

test('rejects deploy permissions missing id-token: write', () => {
  const document = clone(validDocument());
  document.jobs.deploy.permissions = { pages: 'write' };

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.deploy.permissions'));
});

test('rejects a deploy environment name other than github-pages', () => {
  const document = clone(validDocument());
  document.jobs.deploy.environment.name = 'production';

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.deploy.environment.name'));
});

test('rejects a build working directory other than prototype/core-loop', () => {
  const document = clone(validDocument());
  document.jobs.build.defaults.run['working-directory'] = '.';

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.build.defaults.run.working-directory'));
});

test('rejects a build job missing the release:verify-dist gate command', () => {
  const document = clone(validDocument());
  document.jobs.build.steps = document.jobs.build.steps.filter(
    (step) => step.run !== 'npm run release:verify-dist',
  );

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.message.includes('release:verify-dist')));
});

test('semantic gate rejects exact-command neutralization', () => {
  const document = clone(validDocument());
  document.jobs.build.steps.find((step) => step.run === 'npm run typecheck').run = 'npm run typecheck || true';

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.build.steps[8].run'));
});

test('semantic gate rejects continue-on-error on a step', () => {
  const document = clone(validDocument());
  document.jobs.build.steps[3]['continue-on-error'] = true;

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.build.steps[3].continue-on-error'));
});

test('semantic gate rejects continue-on-error on a job', () => {
  const document = clone(validDocument());
  document.jobs.build['continue-on-error'] = true;

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.build.continue-on-error'));
});

test('semantic gate rejects if conditions on jobs and steps', () => {
  const jobDocument = clone(validDocument());
  jobDocument.jobs.deploy.if = 'always()';
  const stepDocument = clone(validDocument());
  stepDocument.jobs.build.steps[4].if = 'success()';

  const jobResult = validatePagesWorkflow(jobDocument);
  const stepResult = validatePagesWorkflow(stepDocument);
  assert.equal(jobResult.ok, false);
  assert.ok(jobResult.issues.some((current) => current.path === 'jobs.deploy.if'));
  assert.equal(stepResult.ok, false);
  assert.ok(stepResult.issues.some((current) => current.path === 'jobs.build.steps[4].if'));
});

test('semantic gate rejects an extra job', () => {
  const document = clone(validDocument());
  document.jobs.audit = { 'runs-on': 'ubuntu-latest', steps: [] };

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs'));
});

test('semantic gate rejects wrong action order and placement', () => {
  const document = clone(validDocument());
  [document.jobs.build.steps[1], document.jobs.build.steps[2]] = [
    document.jobs.build.steps[2],
    document.jobs.build.steps[1],
  ];

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.build.steps[1].uses'));
});

test('semantic gate rejects reordered and duplicate run commands', () => {
  const reordered = clone(validDocument());
  [reordered.jobs.build.steps[3], reordered.jobs.build.steps[4]] = [
    reordered.jobs.build.steps[4],
    reordered.jobs.build.steps[3],
  ];
  const duplicate = clone(validDocument());
  duplicate.jobs.build.steps.splice(4, 0, { run: 'npm ci' });

  assert.equal(validatePagesWorkflow(reordered).ok, false);
  assert.equal(validatePagesWorkflow(duplicate).ok, false);
});

test('semantic gate rejects altered or extra setup-node with values', () => {
  const altered = clone(validDocument());
  altered.jobs.build.steps[1].with['node-version'] = 22;
  const extra = clone(validDocument());
  extra.jobs.build.steps[1].with['registry-url'] = 'https://registry.npmjs.org';

  assert.equal(validatePagesWorkflow(altered).ok, false);
  assert.equal(validatePagesWorkflow(extra).ok, false);
});

test('semantic gate rejects with mappings on actions that approve none', () => {
  const document = clone(validDocument());
  document.jobs.build.steps[2].with = { enablement: false };

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.build.steps[2].with'));
});

test('semantic gate rejects extra deploy steps and altered deploy identity', () => {
  const extraStep = clone(validDocument());
  extraStep.jobs.deploy.steps.push({ run: 'echo bypass' });
  const alteredIdentity = clone(validDocument());
  alteredIdentity.jobs.deploy.steps[0].id = 'other';

  assert.equal(validatePagesWorkflow(extraStep).ok, false);
  assert.equal(validatePagesWorkflow(alteredIdentity).ok, false);
});

test('rejects an upload-pages-artifact path other than prototype/core-loop/dist', () => {
  const document = clone(validDocument());
  const step = document.jobs.build.steps.find((current) => current.uses?.startsWith('actions/upload-pages-artifact'));
  step.with.path = 'dist';

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'uses:actions/upload-pages-artifact'));
});

test('rejects a concurrency group other than pages', () => {
  const document = clone(validDocument());
  document.concurrency.group = 'deploy';

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'concurrency.group'));
});

test('rejects cancel-in-progress true', () => {
  const document = clone(validDocument());
  document.concurrency['cancel-in-progress'] = true;

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'concurrency.cancel-in-progress'));
});

test('rejects a deploy job that does not need build', () => {
  const document = clone(validDocument());
  delete document.jobs.deploy.needs;

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'jobs.deploy.needs'));
});

test('rejects an action pinned to a tag instead of a SHA', () => {
  const document = clone(validDocument());
  document.jobs.build.steps[0].uses = 'actions/checkout@v7.0.1';

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'uses:actions/checkout'));
});

test('rejects an action pinned to an unexpected SHA', () => {
  const document = clone(validDocument());
  document.jobs.build.steps[0].uses = `actions/checkout@${'0'.repeat(40)}`;

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'uses:actions/checkout'));
});

test('rejects an action repository outside the five approved actions', () => {
  const document = clone(validDocument());
  document.jobs.build.steps.push({ uses: `actions/cache@${'a'.repeat(40)}` });

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'uses:actions/cache'));
});

test('rejects a workflow missing one of the five approved actions', () => {
  const document = clone(validDocument());
  document.jobs.build.steps = document.jobs.build.steps.filter(
    (step) => !step.uses?.startsWith('actions/configure-pages'),
  );

  const result = validatePagesWorkflow(document);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((current) => current.path === 'uses:actions/configure-pages'));
});

test('accepts the real .github/workflows/deploy-pages.yml on disk', async () => {
  const text = await readFile(WORKFLOW_PATH, 'utf8');
  const document = parse(text);

  assert.deepEqual(validatePagesWorkflow(document), { ok: true, issues: [] });
});
