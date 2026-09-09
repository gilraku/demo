"use client";
import { fetchRegulations } from "@/lib/static-regulations";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Search,
  X,
  Database,
  Wifi,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type {
  DetailData,
  Envelope,
  SearchData,
  SearchResult,
} from "@/lib/types";

function sourceHref(result: SearchResult) {
  const href = result.best_passage?.href || result.best_passage?.work_href;
  return href?.startsWith("/peraturan/")
    ? `https://pasal.id${href}`
    : `https://pasal.id/search?q=${encodeURIComponent(result.work.title)}`;
}
function Provenance({ value }: { value: Envelope<unknown>["provenance"] }) {
  const date = new Date(value.fetchedAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <div className={`provenance ${value.source === "backup" ? "backup" : ""}`}>
      <div>
        {value.source === "live" ? <Wifi size={14} /> : <Database size={14} />}
        <strong>
          {value.source === "backup"
            ? "Data cadangan"
            : value.source === "cache"
              ? "Salinan terbaru"
              : "Terhubung ke Pasal.id"}
        </strong>
      </div>
      <span>Diambil {date}</span>
      {value.warning ? <p>{value.warning}</p> : null}
    </div>
  );
}
export default function Regulations({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange?: (q: string) => void;
}) {
  const [draft, setDraft] = useState(query),
    [type, setType] = useState(""),
    [submitted, setSubmitted] = useState(query),
    [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Envelope<SearchData> | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [law, setLaw] = useState<SearchResult | null>(null);
  useEffect(() => {
    setDraft(query);
    setSubmitted(query);
    setType("");
  }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    const params = new URLSearchParams({ q: submitted });
    if (type) params.set("type", type);
    fetchRegulations(`/api/regulations?${params}`, { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then(setResult)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e.message || "Pencarian gagal. Silakan coba lagi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [submitted, type, retry]);
  return (
    <section className="regulations" aria-label="Pencarian regulasi">
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          const q = draft.trim();
          if (q.length >= 2) {
            setSubmitted(q);
            setRetry((r) => r + 1);
            onQueryChange?.(q);
          }
        }}
      >
        <Search size={18} />
        <input
          aria-label="Kata kunci regulasi"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Cari peraturan atau topik…"
          minLength={2}
          maxLength={160}
          required
        />
        <button type="submit" aria-label="Cari regulasi">
          <ArrowUpRight size={20} />
        </button>
      </form>
      <div className="result-toolbar">
        <span>
          {loading
            ? "Menelusuri sumber…"
            : result
              ? `${result.data.results.length} hasil ditampilkan`
              : "Sumber regulasi"}
        </span>
        <select
          aria-label="Jenis peraturan"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Semua jenis</option>
          <option value="UU">Undang-undang</option>
          <option value="PP">Peraturan pemerintah</option>
          <option value="PERMEN">Peraturan menteri</option>
          <option value="PERDA">Peraturan daerah</option>
        </select>
      </div>
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="loading-regs">
            <span className="spinner" />
            <p>Mengambil regulasi dan memeriksa cadangan…</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={22} />
            <p>{error}</p>
            <button
              className="text-button"
              onClick={() => setRetry((v) => v + 1)}
            >
              <RefreshCw size={14} />
              Coba lagi
            </button>
          </div>
        ) : result ? (
          <>
            <Provenance value={result.provenance} />
            {result.data.results.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={26} />
                <h3>Belum ada hasil yang cocok</h3>
                <p>
                  Gunakan istilah lebih umum, seperti “reklamasi” atau
                  “lingkungan hidup”.
                </p>
                {result.data.did_you_mean?.map((s) => (
                  <button
                    className="suggestion"
                    key={s.work_id}
                    onClick={() => {
                      setDraft(s.work.title);
                      setSubmitted(s.work.title);
                    }}
                  >
                    {s.work.title}
                  </button>
                ))}
              </div>
            ) : (
              result.data.results.map((item) => (
                <article className="law-card" key={item.work_id}>
                  <div className="law-meta">
                    <span>
                      {item.work.type} {item.work.number}/{item.work.year}
                    </span>
                    <span
                      className={`status ${item.work.status === "dicabut" ? "revoked" : ""}`}
                    >
                      {item.work.status_uncertain
                        ? "Status belum pasti"
                        : item.work.status || "Status belum tersedia"}
                    </span>
                  </div>
                  <button className="law-title" onClick={() => setLaw(item)}>
                    {item.work.title}
                    <ArrowUpRight size={17} />
                  </button>
                  {item.snippet ? <p>{item.snippet}</p> : null}
                  <div className="law-actions">
                    <button onClick={() => setLaw(item)}>
                      <BookOpen size={14} />
                      Baca peraturan
                    </button>
                    <a href={sourceHref(item)} target="_blank" rel="noreferrer">
                      Sumber
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                </article>
              ))
            )}
          </>
        ) : null}
      </div>
      {law ? <LawReader law={law} onClose={() => setLaw(null)} /> : null}
    </section>
  );
}
function LawReader({
  law,
  onClose,
}: {
  law: SearchResult;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [result, setResult] = useState<Envelope<DetailData> | null>(null),
    [error, setError] = useState(""),
    [filter, setFilter] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setResult(null);
    fetchRegulations(
      `/api/regulations?${new URLSearchParams({ uri: law.work.frbr_uri })}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then(setResult)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [law.work.frbr_uri, retry]);
  const articles = result?.data.articles
    .filter((a) =>
      `${a.type} ${a.number || ""} ${a.heading || ""} ${a.content || ""}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
    )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return (
    <dialog
      ref={dialog}
      className="reader-dialog"
      aria-labelledby="reader-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="reader-content">
        <header>
          <span>
            <BookOpen size={18} />
            Pustaka regulasi
          </span>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Tutup pembaca"
          >
            <X size={21} />
          </button>
        </header>
        <h2 id="reader-title">{law.work.title}</h2>
        <a
          className="source-link"
          href={sourceHref(law)}
          target="_blank"
          rel="noreferrer"
        >
          Lihat di Pasal.id
          <ArrowUpRight size={15} />
        </a>
        {result ? (
          <>
            <Provenance value={result.provenance} />
            <p className="reader-status">
              Status menurut sumber:{" "}
              <strong>
                {result.data.work.status || "Belum tersedia"}
                {result.data.work.status_uncertain ? " (belum pasti)" : ""}
              </strong>
              . Periksa perubahan dan rujukan terkait sebelum menerapkan.
            </p>
            <label className="reader-filter">
              <Search size={17} />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Temukan kata atau pasal…"
                aria-label="Cari dalam peraturan"
              />
            </label>
            <div className="articles">
              {articles?.length ? (
                articles.map((a) => (
                  <section className={`article article-${a.type}`} key={a.id}>
                    <h3>
                      {a.type === "pasal"
                        ? `Pasal ${a.number || ""}`
                        : a.type === "bab"
                          ? `Bab ${a.number || ""}`
                          : a.type === "ayat"
                            ? `Ayat ${a.number || ""}`
                            : a.heading || a.number || a.type}
                    </h3>
                    {a.heading &&
                    (a.type === "pasal" ||
                      a.type === "bab" ||
                      a.type === "ayat") ? (
                      <h4>{a.heading}</h4>
                    ) : null}
                    {a.content ? <p>{a.content}</p> : null}
                  </section>
                ))
              ) : (
                <p>
                  {result.data.articles.length === 0
                    ? "Sumber belum menyediakan teks untuk peraturan ini. Metadata telah tersimpan; gunakan tautan sumber untuk menelusuri dokumennya."
                    : "Tidak ada isi yang cocok dengan pencarian ini."}
                </p>
              )}
            </div>
            {result.data.relationships?.length ? (
              <section className="relationships">
                <h3>Hubungan peraturan</h3>
                {result.data.relationships.map((r, i) => (
                  <p key={i}>
                    <strong>{r.type}</strong> — {r.related_work.title}
                  </p>
                ))}
              </section>
            ) : null}
          </>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button
              className="text-button"
              onClick={() => setRetry((v) => v + 1)}
            >
              <RefreshCw size={15} />
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="loading-regs">
            <span className="spinner" />
            Mengambil isi peraturan…
          </div>
        )}
      </div>
    </dialog>
  );
}
