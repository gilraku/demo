import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPasalClient, requestPath } from "../lib/pasal";

const data = {
  query: "reklamasi",
  total: 1,
  results: [
    {
      work_id: 1,
      work: {
        title: "Example fixture",
        frbr_uri: "/akn/id/act/pp/2010/78",
        type: "PP",
        number: "78",
        year: 2010,
        status: "berlaku",
      },
      snippet: "Fixture only",
      matching_pasals: [],
    },
  ],
};
test("accepts regional regulation identifiers returned by Pasal.id", () => {
  assert.equal(
    requestPath("detail", {
      uri: "/akn/id/act/perda/prov-sulawesi-tengah/2023/1",
    }),
    "laws/akn/id/act/perda/prov-sulawesi-tengah/2023/1",
  );
  assert.equal(
    requestPath("detail", { uri: "/akn/id/act/perda/kab-ngawi/2025/4" }),
    "laws/akn/id/act/perda/kab-ngawi/2025/4",
  );
});
test("persists successful data and serves dated backup during outage across client restarts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pasal-test-"));
  try {
    const live = createPasalClient({
      cacheDir: dir,
      bundleDir: dir + "/empty",
      token: "test",
      fetcher: async () => new Response(JSON.stringify(data)),
      ttl: 0,
    });
    const first = await live("search", { q: "reklamasi" });
    assert.equal(first.provenance.source, "live");
    const offline = createPasalClient({
      cacheDir: dir,
      bundleDir: dir + "/empty",
      token: "test",
      fetcher: async () => {
        throw new Error("offline");
      },
      ttl: 0,
    });
    const fallback = await offline("search", { q: "reklamasi" });
    assert.deepEqual(fallback.data, data);
    assert.equal(fallback.provenance.source, "backup");
    assert.equal(fallback.provenance.fetchedAt, first.provenance.fetchedAt);
    assert.ok(fallback.provenance.warning);
    await assert.rejects(() => offline("search", { q: "other" }), /cadangan/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("invalid upstream payload cannot replace a good backup", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pasal-test-"));
  try {
    const options = {
      cacheDir: dir,
      bundleDir: dir + "/empty",
      token: "test",
      ttl: 0,
    };
    await createPasalClient({
      ...options,
      fetcher: async () => new Response(JSON.stringify(data)),
    })("search", { q: "reklamasi" });
    const result = await createPasalClient({
      ...options,
      fetcher: async () => new Response('{"error":"bad"}'),
    })("search", { q: "reklamasi" });
    assert.equal(result.provenance.source, "backup");
    assert.deepEqual(result.data, data);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("rejects invalid law paths before calling upstream", async () => {
  let called = false;
  const client = createPasalClient({
    token: "test",
    fetcher: async () => {
      called = true;
      return new Response("{}");
    },
  });
  await assert.rejects(
    () => client("detail", { uri: "../../secrets" }),
    /valid/,
  );
  assert.equal(called, false);
});

test("bundled searches and all their law details remain readable with no API connection", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pasal-test-"));
  try {
    const client = createPasalClient({
      cacheDir: dir,
      token: "test",
      fetcher: async () => {
        throw new Error("offline");
      },
      ttl: 0,
    });
    const files = await readdir("data/regulations");
    let searches = 0,
      details = 0;
    for (const file of files) {
      const saved = JSON.parse(
        await readFile(join("data/regulations", file), "utf8"),
      );
      if (saved.data.results) {
        searches++;
        const result = await client("search", { q: saved.data.query });
        assert.equal(result.provenance.source, "backup");
        for (const law of saved.data.results) {
          const detail = await client("detail", { uri: law.work.frbr_uri });
          assert.equal(detail.provenance.source, "backup");
          assert.ok("articles" in detail.data);
          details++;
        }
      }
    }
    assert.equal(searches, 5);
    assert.ok(details >= 38);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

for (const status of [401, 429, 500])
  test(`HTTP ${status} falls back to bundled data without losing provenance`, async () => {
    const dir = await mkdtemp(join(tmpdir(), "pasal-test-"));
    try {
      const client = createPasalClient({
        cacheDir: dir,
        token: "test",
        fetcher: async () => new Response("{}", { status }),
        ttl: 0,
      });
      const result = await client("search", { q: "reklamasi pascatambang" });
      assert.equal(result.provenance.source, "backup");
      assert.ok(result.provenance.fetchedAt);
      assert.ok(result.provenance.warning);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

test("an empty detail response does not overwrite previously saved article content", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pasal-test-"));
  try {
    const detail = {
      work: data.results[0].work,
      articles: [
        { id: 1, type: "pasal", number: "1", content: "Fixture text" },
      ],
    };
    const options = {
      cacheDir: dir,
      bundleDir: dir + "/empty",
      token: "test",
      ttl: 0,
    };
    await createPasalClient({
      ...options,
      fetcher: async () => new Response(JSON.stringify(detail)),
    })("detail", { uri: detail.work.frbr_uri });
    const result = await createPasalClient({
      ...options,
      fetcher: async () =>
        new Response(JSON.stringify({ ...detail, articles: [] })),
    })("detail", { uri: detail.work.frbr_uri });
    assert.equal(result.provenance.source, "backup");
    assert.deepEqual(result.data, detail);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
