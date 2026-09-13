"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Database,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { stages, topics, type Stage } from "@/lib/topics";
import Regulations from "./Regulations";
const Landscape = dynamic(() => import("./CinematicLandscape"), {
  ssr: false,
  loading: () => (
    <div className="world-loading">
      <span className="spinner" />
      <p>Menyiapkan bentang…</p>
    </div>
  ),
});
const chapter = {
  pre: {
    title: "Sebelum tanah dibuka.",
    description:
      "Kenali wilayah, rencanakan kegiatan, dan telusuri persetujuan lingkungan.",
  },
  active: {
    title: "Di dalam operasi.",
    description:
      "Jelajahi hubungan kegiatan tambang, pengelolaan dampak, dan regulasinya.",
  },
  post: {
    title: "Setelah penambangan.",
    description:
      "Telusuri pemulihan lahan dan tanggung jawab yang berlanjut setelah operasi.",
  },
};
export default function ImmersiveExplorer() {
  const [stage, setStage] = useState<Stage>("active"),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState<"world" | "library">("world"),
    [panel, setPanel] = useState<"learn" | "laws">("learn"),
    [zoom, setZoom] = useState(0),
    [paused, setPaused] = useState(false),
    [reset, setReset] = useState(0),
    [query, setQuery] = useState("air limbah pertambangan");
  const about = useRef<HTMLDialogElement>(null),
    drawer = useRef<HTMLElement>(null),
    trigger = useRef<HTMLElement | null>(null);
  const topic = topics.find((t) => t.id === selected);
  const close = () => {
    setSelected(null);
    trigger.current?.focus();
  };
  const select = (id: string) => {
    trigger.current = document.activeElement as HTMLElement;
    setSelected(id);
    setPanel("learn");
  };
  useEffect(() => {
    if (selected) drawer.current?.focus({ preventScroll: true });
  }, [selected]);
  const openLaws = () => {
    if (topic) setQuery(topic.query);
    setPanel("laws");
  };
  return (
    <main
      className={
        tab === "world"
          ? `experience ${selected ? "has-drawer" : ""}`
          : "library-mode"
      }
    >
      <header className="experience-header">
        <button
          className="wordmark"
          onClick={() => {
            setTab("world");
            setSelected(null);
          }}
          aria-label="Bentang Tambang beranda"
        >
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="m3 30 11-19 6 9 5-15 12 25H3Z" />
            <path d="m8 30 7-11 5 11m2 0 4-13 6 13" />
          </svg>
          <span>
            Bentang Tambang<small>Lingkungan hidup / Batubara</small>
          </span>
        </button>
        <nav aria-label="Navigasi utama">
          <button
            className={tab === "world" ? "active" : ""}
            onClick={() => setTab("world")}
          >
            Jelajah
          </button>
          <button
            className={tab === "library" ? "active" : ""}
            onClick={() => setTab("library")}
          >
            Pustaka regulasi
            <BookOpen size={14} />
          </button>
        </nav>
        <button
          className="about-link"
          onClick={() => about.current?.showModal()}
        >
          Tentang proyek
          <ArrowUpRight size={14} />
        </button>
      </header>
      <div
        className={`world-layer ${tab === "world" ? "" : "is-hidden"}`}
        aria-hidden={tab !== "world"}
      >
        <>
          <div className="world-viewport">
            <Landscape
              stage={stage}
              selected={selected}
              onSelect={select}
              zoom={zoom}
              reset={reset}
              paused={paused || tab !== "world"}
            />
          </div>
          <div className="world-shade" aria-hidden="true" />
          <div className="world-caption">
            <span>Eksplorasi lingkungan pertambangan</span>
            <span>Lanskap ilustratif</span>
          </div>
          <div className="world-tools" aria-label="Kontrol kamera">
            <button
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? "Lanjutkan animasi" : "Jeda animasi"}
              aria-pressed={paused}
            >
              {paused ? "▷" : "Ⅱ"}
            </button>
            <button
              onClick={() => setZoom((v) => Math.min(v + 1, 3))}
              disabled={zoom === 3}
              aria-label="Perbesar bentang"
            >
              <Plus size={17} />
            </button>
            <button
              onClick={() => setZoom((v) => Math.max(v - 1, -2))}
              disabled={zoom === -2}
              aria-label="Perkecil bentang"
            >
              <Minus size={17} />
            </button>
            <button
              onClick={() => {
                setZoom(0);
                setReset((v) => v + 1);
                setSelected(null);
              }}
              aria-label="Atur ulang kamera"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <section className="chapter-summary" aria-label="Tahap terpilih">
            <span className="chapter-label">
              {stages.find((s) => s.id === stage)?.label}
            </span>
            <h1>{chapter[stage].title}</h1>
            <p>{chapter[stage].description}</p>
            <div className="chapter-locations" aria-label="Pilih lokasi">
              {topics
                .filter((t) => t.stages.includes(stage))
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => select(t.id)}
                    aria-pressed={selected === t.id}
                  >
                    {t.short}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
            </div>
          </section>
          <div className="world-bottom">
            <div className="chapter-switcher" aria-label="Tahap kegiatan">
              {stages.map((s, i) => (
                <button
                  key={s.id}
                  className={stage === s.id ? "active" : ""}
                  aria-pressed={stage === s.id}
                  onClick={() => {
                    setStage(s.id);
                    setSelected(null);
                    setZoom(0);
                  }}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                  <i />
                </button>
              ))}
            </div>
            <div className="world-hint">
              <Compass size={20} strokeWidth={1} />
              <span>
                Geser untuk menjelajah
                <br />
                Pilih penanda untuk membuka konteks
              </span>
            </div>
            <span className="world-credit">
              Regulasi bersumber dari{" "}
              <a href="https://pasal.id" target="_blank" rel="noreferrer">
                Pasal.id
              </a>
            </span>
          </div>
          {topic ? (
            <aside
              className="context-drawer"
              ref={drawer}
              tabIndex={-1}
              aria-label={`Konteks ${topic.short}`}
              onKeyDown={(e) => {
                if (e.key === "Escape" && e.target === e.currentTarget) close();
              }}
            >
              <div className="drawer-heading">
                <span>{topic.category}</span>
                <button
                  className="drawer-close"
                  onClick={close}
                  aria-label="Tutup konteks"
                >
                  <X size={21} />
                </button>
              </div>
              <span className="drawer-location">{topic.short}</span>
              <h2>{topic.title}</h2>
              <p className="topic-description">{topic.description}</p>
              <div className="panel-tabs">
                <button
                  className={panel === "learn" ? "active" : ""}
                  onClick={() => setPanel("learn")}
                >
                  Peninjauan tim
                </button>
                <button
                  className={panel === "laws" ? "active" : ""}
                  onClick={openLaws}
                >
                  Sumber regulasi
                  <ArrowUpRight size={13} />
                </button>
              </div>
              {panel === "learn" ? (
                <div className="learning-content">
                  <h3>Mulai dari pertanyaan ini</h3>
                  <ul className="questions">
                    {topic.questions.map((q, i) => (
                      <li key={q}>
                        <span>{i + 1}</span>
                        <p>{q}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="document-box">
                    <div>
                      <BookOpen size={16} />
                      <strong>Dokumen untuk ditinjau</strong>
                    </div>
                    <ul>
                      {topic.documents.map((d) => (
                        <li key={d}>
                          <Check size={14} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="primary-button" onClick={openLaws}>
                    Telusuri regulasi terkait
                    <ArrowUpRight size={17} />
                  </button>
                  <p className="editorial-note">
                    Panduan diskusi, bukan penilaian kepatuhan perusahaan.
                  </p>
                </div>
              ) : (
                <Regulations query={query} />
              )}
            </aside>
          ) : null}
        </>
      </div>
      {tab === "library" ? (
        <div className="library-layer">
          <section className="library-page">
          <div className="library-heading">
            <span className="library-eyebrow">
              Referensi lingkungan & pertambangan
            </span>
            <h1>Pustaka regulasi.</h1>
            <p>Telusuri isi peraturan, periksa status, dan baca sumbernya.</p>
          </div>
          <div className="library-layout">
            <aside>
              <h3>Jelajahi topik</h3>
              {topics.map((t) => (
                <button
                  key={t.id}
                  className={query === t.query ? "active" : ""}
                  onClick={() => setQuery(t.query)}
                >
                  {t.title}
                  <ArrowUpRight size={14} />
                </button>
              ))}
              <div className="backup-note">
                <Database size={22} />
                <h3>Salinan tetap tersedia.</h3>
                <p>
                  Saat Pasal.id bermasalah, hasil tersimpan dapat dibaca dengan
                  tanggal pengambilan. Pencarian baru belum tentu memiliki
                  cadangan.
                </p>
              </div>
            </aside>
            <Regulations query={query} />
          </div>
          </section>
        </div>
      ) : null}
      <dialog
        ref={about}
        className="about-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) about.current?.close();
        }}
      >
        <button
          className="icon-button"
          aria-label="Tutup informasi"
          onClick={() => about.current?.close()}
        >
          <X size={20} />
        </button>
        <h2>Bentang Tambang</h2>
        <p>
          Eksplorasi visual lingkungan pertambangan batubara untuk praktisi
          perusahaan. Kontur dan fasilitas adalah ilustrasi, bukan representasi
          lokasi tertentu atau simulasi dampak.
        </p>
        <h3>Referensi tata kegiatan</h3>
        <p>
          Alur kegiatan terinspirasi dari publikasi{" "}
          <a
            href="https://www.adaroindonesia.com/pages/view/Adaro_Mining.html"
            target="_blank"
            rel="noreferrer"
          >
            Adaro Indonesia
          </a>{" "}
          dan pengelolaan lingkungan{" "}
          <a
            href="https://www.kpc.co.id/sustainability/environment-sustainability/"
            target="_blank"
            rel="noreferrer"
          >
            Kaltim Prima Coal
          </a>
          . Tata letak disederhanakan untuk edukasi, bukan rekonstruksi lokasi
          atau rancangan teknis kolam.
        </p>
        <h3>Sumber regulasi</h3>
        <p>
          Pasal.id menyediakan pencarian dan isi regulasi. Cadangan diberi waktu
          pengambilan dan tidak menjamin perubahan terbaru sudah tercakup.
          Beberapa sumber hanya mempunyai metadata.
        </p>
        <h3>Konteks pembelajaran</h3>
        <p>
          Pertanyaan peninjauan adalah materi editorial untuk diskusi tim.
          Periksa sumber resmi, perubahan peraturan, dan dokumen perusahaan
          sebelum menerapkan.
        </p>
      </dialog>
    </main>
  );
}
