import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fetchRegulations } from '../lib/static-regulations';

test('Pages serves dated topic snapshots and handles unavailable queries', async () => {
  const original = globalThis.fetch;
  process.env.NEXT_PUBLIC_STATIC_EXPORT = '1';
  process.env.NEXT_PUBLIC_BASE_PATH = '/demo';
  globalThis.fetch = async (url) => {
    assert.match(String(url), /^\/demo\/regulations\/[a-f0-9]{64}\.json$/);
    try {
      return new Response(await readFile(`data${String(url).slice('/demo'.length)}`, 'utf8'));
    } catch { return new Response('', { status: 404 }); }
  };
  try {
    const response = await fetchRegulations('/api/regulations?q=pertambangan%20batubara');
    assert.equal(response.status, 200);
    const saved = await response.json();
    assert.equal(saved.provenance.source, 'backup');
    assert.ok(saved.data.results.length > 0);
    const missing = await fetchRegulations('/api/regulations?q=unavailable-query-123');
    assert.equal(missing.status, 404);
  } finally {
    globalThis.fetch = original;
    delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  }
});
