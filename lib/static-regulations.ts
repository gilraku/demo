import { publicPath } from "./public-path";

/** Pages serves the same dated snapshots as the server's offline fallback. */
export async function fetchRegulations(url: string, init?: RequestInit): Promise<Response> {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT !== "1") return fetch(url, init);
  const params = new URL(url, "https://local.invalid").searchParams;
  const uri = params.get("uri");
  const query = new URLSearchParams({
    q: (params.get("q") || "").trim().replace(/\s+/g, " ").toLowerCase(),
    limit: "8",
  });
  // Bundled searches are unfiltered; apply the selected type locally.
  const endpoint = uri ? `laws/${uri.replace(/^\//, "")}` : `search?${query}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  const response = await fetch(publicPath(`/regulations/${key}.json`), init);
  if (!response.ok) return Response.json({ error: "Versi demo hanya memuat salinan regulasi untuk topik yang tersedia. Pilih topik lain atau kunjungi Pasal.id untuk pencarian lengkap." }, { status: 404 });
  const saved = await response.json();
  if (!uri && params.get("type")) {
    saved.data.results = saved.data.results.filter((r: { work: { type?: string } }) => r.work.type === params.get("type"));
    saved.data.total = saved.data.results.length;
  }
  saved.provenance = { ...saved.provenance, source: "backup", warning: "Demo GitHub Pages menggunakan salinan tersimpan; perubahan terbaru belum tercakup." };
  return Response.json(saved);
}
