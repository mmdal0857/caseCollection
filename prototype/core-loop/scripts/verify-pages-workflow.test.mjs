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
