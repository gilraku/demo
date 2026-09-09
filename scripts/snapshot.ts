import { createPasalClient } from "../lib/pasal";
import { topics } from "../lib/topics";
import type { SearchData } from "../lib/types";
import path from "node:path";

async function main() {
  if (!process.env.PASAL_API_TOKEN)
    throw new Error("Set PASAL_API_TOKEN di .env.local terlebih dahulu.");
  const client = createPasalClient({
    cacheDir: path.join(process.cwd(), "data/regulations"),
    ttl: 0,
  });
  const seen = new Set<string>();
  let searches = 0,
    details = 0,
    failed = 0;
  for (const topic of topics) {
    try {
      const result = await client("search", { q: topic.query });
      if (result.provenance.source !== "live" || result.provenance.warning) {
        failed++;
        console.log(
          `${topic.short}: cadangan lama dipertahankan; refresh belum berhasil.`,
        );
        continue;
      }
      searches++;
      for (const law of (result.data as SearchData).results) {
        const uri = law.work.frbr_uri;
        if (seen.has(uri)) continue;
        seen.add(uri);
        try {
          const detail = await client("detail", { uri });
          if (detail.provenance.source === "live" && !detail.provenance.warning)
            details++;
          else failed++;
        } catch {
          failed++;
          console.log(`Detail belum tersedia: ${law.work.title}`);
        }
      }
      console.log(`${topic.short}: hasil pencarian tersimpan.`);
    } catch (error) {
      failed++;
      console.log(error instanceof Error ? error.message : "Refresh gagal.");
    }
  }
  console.log(JSON.stringify({ searches, details, failed }));
  if (failed) process.exitCode = 1;
}
main().catch(() => {
  console.error("Pengambilan cadangan gagal. Periksa konfigurasi dan koneksi.");
  process.exitCode = 1;
});
