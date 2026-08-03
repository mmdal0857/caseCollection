import assert from 'node:assert/strict';
import test from 'node:test';

import { createServer } from 'vite';

test('renders the canonical neutral Raiden portrait at a portable asset URL', async (t) => {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    mode: 'production',
    server: { middlewareMode: true },
  });
  t.after(() => server.close());

  const { render } = await server.ssrLoadModule('svelte/server');
  const module = await server.ssrLoadModule('/src/lib/ui/ReactionBand.svelte');
  const { body } = render(module.default, {
    props: {
      submit: null,
      slotLabel: () => '',
    },
  });

  assert.match(body, /src="\/assets\/characters\/raiden-neutral\.webp"/);
  assert.match(body, /alt="레이든"/);
});
