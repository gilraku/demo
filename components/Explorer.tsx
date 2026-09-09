"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Database,
  Droplets,
  Factory,
  Info,
  Layers3,
  Leaf,
  Mountain,
  Move,
  Plus,
  Minus,
  RotateCcw,
  ShieldCheck,
  Sprout,
  Users,
  X,
} from "lucide-react";
import { stages, topics, type Stage } from "@/lib/topics";
import Regulations from "./Regulations";
const Landscape = dynamic(() => import("./Landscape"), {
  ssr: false,
  loading: () => (
    <div className="scene-fallback">
      <span className="spinner" />
      <p>Menyiapkan bentang tambang…</p>
    </div>
  ),
});
const icons = {
  pit: Mountain,
  water: Droplets,
  air: Factory,
  community: Users,
  reclaim: Sprout,
};
export default function Explorer() {
  const [stage, setStage] = useState<Stage>("active"),
    [selected, setSelected] = useState("water"),
    [tab, setTab] = useState<"explore" | "library">("explore"),
    [panel, setPanel] = useState<"learn" | "laws">("learn"),
    [zoom, setZoom] = useState(0),
    [reset, setReset] = useState(0),
    [query, setQuery] = useState("air limbah pertambangan");
  const about = useRef<HTMLDialogElement>(null),
    detail = useRef<HTMLElement>(null);
  const topic = topics.find((t) => t.id === selected)!;
  const available = topics.filter((t) => t.stages.includes(stage));
  const select = (id: string) => {
    setSelected(id);
    setPanel("learn");
  };
  const changeStage = (value: Stage) => {
    setStage(value);
    if (!topics.find((t) => t.id === selected)?.stages.includes(value))
      setSelected(topics.find((t) => t.stages.includes(value))!.id);
    setPanel("learn");
  };
  const openLaws = () => {
    setQuery(topic.query);
    setPanel("laws");
  };
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Bentang Tambang beranda">
          <span className="brand-symbol">
            <Layers3 size={25} />
          </span>
          <span>
            Bentang<span className="brand-light">Tambang</span>
            <small>Ruang belajar lingkungan & pertambangan</small>
          </span>
        </a>
        <nav aria-label="Navigasi utama">
          <button
            className={tab === "explore" ? "active" : ""}
            onClick={() => setTab("explore")}
          >
            <Compass size={17} />
            Jelajah bentang
          </button>
          <button
            className={tab === "library" ? "active" : ""}
            onClick={() => setTab("library")}
          >
            <BookOpen size={17} />
            Pustaka regulasi
          </button>
        </nav>
        <button
          className="about-button"
          onClick={() => about.current?.showModal()}
        >
          <Info size={17} />
          <span>Tentang ruang ini</span>
        </button>
      </header>
      {tab === "explore" ? (
        <>
          <section className="intro">
            <div>
              <div className="intro-kicker">
                <span />
                Lingkungan hidup & pertambangan batubara
              </div>
              <h1>
                Pahami bentangnya.
                <br />
                <span>Kenali tanggung jawabnya.</span>
              </h1>
              <p>
                Jelajahi kegiatan tambang, pelajari konteks lingkungan,
                <br className="desktop-break" /> dan temukan regulasi yang
                menghubungkannya.
              </p>
            </div>
            <div className="intro-note">
              <ShieldCheck size={23} />
              <div>
                <strong>
                  Dari konteks lapangan
                  <br />
                  ke sumber peraturan.
                </strong>
                <span>Dirancang untuk praktisi perusahaan</span>
              </div>
            </div>
          </section>
          <section
            className="workspace"
            aria-label="Bentang tambang interaktif"
          >
            <div className="landscape-column">
              <div className="scene-topbar">
                <div className="stage-tabs" aria-label="Tahap kegiatan">
                  {stages.map((s, i) => (
                    <button
                      key={s.id}
                      aria-pressed={stage === s.id}
                      className={stage === s.id ? "active" : ""}
                      onClick={() => changeStage(s.id)}
                    >
                      <span>{i + 1}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
                <span className="scene-tag">
                  <span />
                  Bentang interaktif
                </span>
              </div>
              <div className="scene-area">
                <div className="scene-title">
                  <span>{stages.find((s) => s.id === stage)?.subtitle}</span>
                  <strong>
                    {stage === "active"
                      ? "Kegiatan yang saling terhubung"
                      : stage === "pre"
                        ? "Ruang untuk merencanakan"
                        : "Bentang yang kembali tumbuh"}
                  </strong>
                </div>
                <Landscape
                  stage={stage}
                  selected={selected}
                  onSelect={select}
                  zoom={zoom}
                  reset={reset}
                />
                <div className="compass-mark">
                  <span>U</span>
                  <Compass size={27} strokeWidth={1} />
                </div>
                <div className="scene-controls">
                  <button
                    aria-label="Perbesar bentang"
                    onClick={() => setZoom((z) => Math.min(z + 1, 3))}
                    disabled={zoom === 3}
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    aria-label="Perkecil bentang"
                    onClick={() => setZoom((z) => Math.max(z - 1, -2))}
                    disabled={zoom === -2}
                  >
                    <Minus size={18} />
                  </button>
                  <button
                    aria-label="Atur ulang kamera"
                    onClick={() => {
                      setZoom(0);
                      setReset((v) => v + 1);
                    }}
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>
                <div className="scene-instruction">
                  <Move size={14} />
                  <span>Geser untuk memutar · Pilih titik untuk belajar</span>
                </div>
                <span className="illustration-label">
                  Ilustrasi bentang, bukan lokasi aktual
                </span>
              </div>
              <div className="location-strip">
                <span className="location-label">
                  Jelajahi lokasi
                  <ArrowDown size={13} />
                </span>
                <div className="location-buttons">
                  {available.map((t) => {
                    const Icon = icons[t.id as keyof typeof icons];
                    return (
                      <button
                        key={t.id}
                        className={selected === t.id ? "active" : ""}
                        aria-pressed={selected === t.id}
                        onClick={() => select(t.id)}
                      >
                        <Icon size={18} />
                        <span>{t.short}</span>
                        {selected === t.id ? (
                          <span className="selected-dot" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <aside ref={detail} className="learning-panel">
              <div className="panel-kicker">
                <span>
                  <span className="green-dot" />
                  {topic.category}
                </span>
                <span>
                  {String(topics.indexOf(topic) + 1).padStart(2, "0")} / 05
                </span>
              </div>
              <div className="topic-icon">
                {(() => {
                  const Icon = icons[topic.id as keyof typeof icons];
                  return <Icon size={27} strokeWidth={1.6} />;
                })()}
              </div>
              <h2>{topic.title}</h2>
              <p className="topic-description">{topic.description}</p>
              <div className="panel-tabs">
                <button
                  className={panel === "learn" ? "active" : ""}
                  onClick={() => setPanel("learn")}
                >
                  Konteks & peninjauan
                </button>
                <button
                  className={panel === "laws" ? "active" : ""}
                  onClick={openLaws}
                >
                  Regulasi terkait
                  <ArrowUpRight size={13} />
                </button>
              </div>
              {panel === "learn" ? (
                <div className="learning-content">
                  <h3>Pertanyaan untuk tim Anda</h3>
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
                      <Layers3 size={16} />
                      <strong>Dokumen untuk ditinjau</strong>
                    </div>
                    <ul>
                      {topic.documents.map((d) => (
                        <li key={d}>
                          <Check size={13} />
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
                    Panduan diskusi tim, bukan daftar kewajiban yang lengkap.
                  </p>
                </div>
              ) : (
                <Regulations query={query} />
              )}
            </aside>
          </section>
          <section className="below-scene">
            <div>
              <Leaf size={19} />
              <p>
                <strong>Setiap keputusan meninggalkan jejak.</strong> Mulai dari
                memahami hubungan kegiatan, dampak, dan pengelolaannya.
              </p>
            </div>
            <button onClick={() => setTab("library")}>
              Buka pustaka regulasi
              <ChevronRight size={16} />
            </button>
          </section>
        </>
      ) : (
        <section className="library-page">
          <div className="library-heading">
            <span className="intro-kicker">
              <span />
              Sumber untuk keputusan yang lebih terinformasi
            </span>
            <h1>Pustaka regulasi.</h1>
            <p>
              Telusuri peraturan lingkungan hidup dan pertambangan.
              <br />
              Baca sumber, periksa status, dan pahami konteks penerapannya.
            </p>
          </div>
          <div className="library-layout">
            <aside>
              <h3>Mulai dari sebuah topik</h3>
              {topics.map((t) => (
                <button
                  key={t.id}
                  className={query === t.query ? "active" : ""}
                  onClick={() => setQuery(t.query)}
                >
                  {t.title}
                  <ChevronRight size={15} />
                </button>
              ))}
              <div className="backup-note">
                <Database size={23} />
                <h3>Tetap terbaca saat sumber terganggu</h3>
                <p>
                  Salinan hasil pencarian dan isi peraturan tersedia untuk topik
                  yang sudah disimpan. Tanggal pengambilan selalu disertakan.
                </p>
                <p>
                  Salinan tidak menjamin perubahan regulasi terbaru sudah
                  tercakup.
                </p>
              </div>
            </aside>
            <Regulations query={query} />
          </div>
        </section>
      )}
      <footer>
        <span className="footer-brand">
          <Layers3 size={16} />
          Bentang Tambang
        </span>
        <span>Materi edukasi · Verifikasi sumber sebelum menerapkan</span>
        <a href="https://pasal.id" target="_blank" rel="noreferrer">
          Sumber regulasi: Pasal.id
          <ArrowUpRight size={13} />
        </a>
      </footer>
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
        <span className="brand-symbol">
          <Layers3 size={27} />
        </span>
        <h2>
          Melihat regulasi
          <br />
          dalam konteks bentangnya.
        </h2>
        <p>
          Bentang Tambang adalah ruang belajar untuk praktisi perusahaan
          pertambangan batubara. Lanskap merupakan ilustrasi untuk menjelajahi
          topik lingkungan dan mencari peraturan yang relevan.
        </p>
        <h3>Sumber & cadangan</h3>
        <p>
          Regulasi diambil dari Pasal.id. Saat layanan gagal, aplikasi memakai
          salinan yang sudah tersimpan dengan waktu pengambilan dan label data
          cadangan. Pencarian baru mungkin belum memiliki cadangan.
        </p>
        <h3>Menggunakan materi</h3>
        <p>
          Pertanyaan peninjauan bersifat editorial. Aplikasi tidak menilai
          kepatuhan perusahaan atau menggantikan pemeriksaan dokumen resmi dan
          perubahan peraturan.
        </p>
      </dialog>
    </main>
  );
}
