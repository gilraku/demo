import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DetailData, Envelope, SearchData } from "./types";

type Kind = "search" | "detail";
type Data = SearchData | DetailData;
type Options = {
  cacheDir?: string;
  bundleDir?: string;
  token?: string;
  ttl?: number;
  fetcher?: typeof fetch;
};
export class PasalError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
export function requestPath(
  kind: Kind,
  params: { q?: string; type?: string; uri?: string },
) {
  if (kind === "detail") {
    const uri = (params.uri || "").replace(/^\//, "");
    if (
      !/^akn\/id\/act\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)?\d{4}\/[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(
        uri,
      )
    )
      throw new PasalError("Identitas peraturan tidak valid.", 400);
    return `laws/${uri}`;
  }
  const q = (params.q || "").trim().replace(/\s+/g, " ").toLowerCase();
  const type = (params.type || "").toUpperCase();
  if (q.length < 2 || q.length > 160 || (type && !/^[A-Z_]{2,24}$/.test(type)))
    throw new PasalError("Kata kunci atau jenis peraturan tidak valid.", 400);
  const search = new URLSearchParams({ q, limit: "8" });
  if (type) search.set("type", type);
  return `search?${search}`;
}
function valid(data: unknown, kind: Kind): data is Data {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const work = (v: unknown) =>
    !!v &&
    typeof v === "object" &&
    typeof (v as Record<string, unknown>).title === "string" &&
    typeof (v as Record<string, unknown>).frbr_uri === "string";
  if (kind === "search")
    return (
      typeof d.total === "number" &&
      Array.isArray(d.results) &&
      d.results.every((r) => r && work(r.work))
    );
  return (
    work(d.work) &&
    Array.isArray(d.articles) &&
    d.articles.every(
      (a) => a && typeof a.id === "number" && typeof a.type === "string",
    )
  );
}
export function createPasalClient(options: Options = {}) {
  const cacheDir =
    options.cacheDir ??
    process.env.PASAL_CACHE_DIR ??
    path.join(process.cwd(), ".cache/pasal");
  const bundleDir =
    options.bundleDir ?? path.join(process.cwd(), "data/regulations");
  const fetcher = options.fetcher ?? fetch;
  const ttl = options.ttl ?? 300_000;
  return async function getRegulations(
    kind: Kind,
    params: { q?: string; type?: string; uri?: string },
  ): Promise<Envelope<Data>> {
    const endpoint = requestPath(kind, params);
    const filename =
      createHash("sha256").update(endpoint).digest("hex") + ".json";
    const read = async (dir: string): Promise<Envelope<Data> | null> => {
      try {
        const saved = JSON.parse(
          await readFile(path.join(dir, filename), "utf8"),
        );
        return valid(saved.data, kind) &&
          Number.isFinite(Date.parse(saved.provenance?.fetchedAt))
          ? saved
          : null;
      } catch {
        return null;
      }
    };
    const [runtime, bundled] = await Promise.all([
      read(cacheDir),
      read(bundleDir),
    ]);
    const backup = [runtime, bundled]
      .filter((s): s is Envelope<Data> => s !== null)
      .sort(
        (a, b) =>
          Date.parse(b.provenance.fetchedAt) -
          Date.parse(a.provenance.fetchedAt),
      )[0];
    if (runtime && Date.now() - Date.parse(runtime.provenance.fetchedAt) < ttl)
      return {
        ...runtime,
        provenance: {
          source: "cache",
          fetchedAt: runtime.provenance.fetchedAt,
        },
      };
    try {
      const token = options.token ?? process.env.PASAL_API_TOKEN;
      if (!token) throw new PasalError("Token sumber belum dikonfigurasi.");
      const res = await fetcher(`https://pasal.id/api/v1/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!res.ok)
        throw new PasalError(
          res.status === 429
            ? "Batas permintaan Pasal.id tercapai."
            : res.status === 401
              ? "Autentikasi Pasal.id gagal."
              : `Pasal.id tidak tersedia (HTTP ${res.status}).`,
        );
      const data: unknown = await res.json();
      if (!valid(data, kind))
        throw new PasalError("Respons Pasal.id tidak dapat dibaca.");
      if (
        kind === "detail" &&
        "articles" in data &&
        data.articles.length === 0 &&
        backup &&
        "articles" in backup.data &&
        backup.data.articles.length > 0
      )
        throw new PasalError("Isi pasal terbaru belum tersedia dari Pasal.id.");
      const result: Envelope<Data> = {
        data,
        provenance: { source: "live", fetchedAt: new Date().toISOString() },
      };
      try {
        await mkdir(cacheDir, { recursive: true });
        const temp = path.join(cacheDir, `${filename}.${randomUUID()}.tmp`);
        await writeFile(temp, JSON.stringify(result));
        await rename(temp, path.join(cacheDir, filename));
      } catch {
        result.provenance.warning =
          "Data terbaru tersedia, tetapi cadangan tidak dapat disimpan pada server ini.";
      }
      return result;
    } catch (error) {
      const reason =
        error instanceof PasalError
          ? error.message
          : "Koneksi ke Pasal.id sedang bermasalah.";
      if (backup)
        return {
          data: backup.data,
          provenance: {
            source: "backup",
            fetchedAt: backup.provenance.fetchedAt,
            warning: `${reason} Menampilkan salinan tersimpan; perubahan terbaru mungkin belum tercakup.`,
          },
        };
      throw new PasalError(
        `${reason} Belum ada cadangan untuk permintaan ini. Coba topik lain atau ulangi beberapa saat lagi.`,
      );
    }
  };
}
export const getRegulations = createPasalClient();
