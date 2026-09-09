export type Stage = "pre" | "active" | "post";
export type Topic = {
  id: string;
  title: string;
  short: string;
  category: string;
  query: string;
  stages: Stage[];
  position: [number, number, number];
  description: string;
  questions: string[];
  documents: string[];
};
export const stages: { id: Stage; label: string; subtitle: string }[] = [
  { id: "pre", label: "Praoperasi", subtitle: "Rencanakan sebelum bergerak" },
  { id: "active", label: "Operasi", subtitle: "Kelola dampak setiap hari" },
  {
    id: "post",
    label: "Pascatambang",
    subtitle: "Pulihkan fungsi bentang alam",
  },
];
export const topics: Topic[] = [
  {
    id: "pit",
    title: "Perencanaan & perizinan",
    short: "Area tambang",
    category: "Tata kelola",
    query: "pertambangan batubara",
    stages: ["active"],
    position: [-2, 1.25, 0],
    description:
      "Hubungkan rencana kegiatan pertambangan dengan dokumen perizinan dan pengelolaan lingkungan yang relevan.",
    questions: [
      "Apakah ruang lingkup kegiatan sesuai dokumen dan persetujuan yang dimiliki?",
      "Adakah perubahan kegiatan yang perlu ditinjau oleh tim perizinan?",
      "Siapa pemilik tindak lanjut lintas fungsi di perusahaan?",
    ],
    documents: [
      "Dokumen perizinan kegiatan",
      "Dokumen lingkungan dan persetujuannya",
      "Rencana kegiatan dan peta wilayah",
    ],
  },
  {
    id: "water",
    title: "Air & pengendalian pencemaran",
    short: "Pengelolaan air",
    category: "Lingkungan",
    query: "air limbah pertambangan",
    stages: ["active"],
    position: [2.1, 1.05, 1.6],
    description:
      "Telusuri hubungan area tangkapan air, kolam pengendapan, titik penaatan, dan badan air penerima.",
    questions: [
      "Apakah sumber air limbah dan aliran drainase sudah dipetakan?",
      "Parameter dan titik pemantauan mana yang tercantum dalam dokumen perusahaan?",
      "Bagaimana hasil pemantauan dan tindak lanjutnya dicatat?",
    ],
    documents: [
      "Neraca dan peta pengelolaan air",
      "Persetujuan teknis yang relevan",
      "Hasil pemantauan kualitas air",
    ],
  },
  {
    id: "air",
    title: "Emisi, debu & limbah",
    short: "Fasilitas operasi",
    category: "Pengendalian dampak",
    query: "pengelolaan limbah B3",
    stages: ["active"],
    position: [0.6, 1.3, -1.8],
    description:
      "Kenali sumber dampak dari fasilitas, lalu lintas angkutan, serta penyimpanan dan pengelolaan limbah.",
    questions: [
      "Sumber emisi, debu, dan limbah apa saja yang ada dalam inventaris?",
      "Apakah catatan pengelolaan dapat ditelusuri sampai tindak lanjutnya?",
      "Bagaimana tim operasi menerima temuan pemantauan lingkungan?",
    ],
    documents: [
      "Inventaris sumber dampak",
      "Catatan pengelolaan limbah",
      "Laporan pemantauan dan tindak lanjut",
    ],
  },
  {
    id: "community",
    title: "Masyarakat & badan air",
    short: "Wilayah sekitar",
    category: "Partisipasi",
    query: "perlindungan pengelolaan lingkungan hidup",
    stages: ["pre", "active", "post"],
    position: [3.6, 1.3, -1.7],
    description:
      "Lihat kegiatan dari perspektif wilayah sekitar: akses informasi, partisipasi, pemantauan, dan pengaduan lingkungan.",
    questions: [
      "Bagaimana masukan masyarakat dicatat dan ditindaklanjuti?",
      "Apakah informasi dampak disampaikan secara mudah dipahami?",
      "Apakah tim memiliki rekam tindak lanjut pengaduan?",
    ],
    documents: [
      "Catatan konsultasi dan partisipasi",
      "Register pengaduan",
      "Dokumentasi tindak lanjut",
    ],
  },
  {
    id: "reclaim",
    title: "Reklamasi & pascatambang",
    short: "Lahan reklamasi",
    category: "Pemulihan",
    query: "reklamasi pascatambang",
    stages: ["active", "post"],
    position: [-3.1, 1.65, -2.5],
    description:
      "Pelajari keterkaitan perencanaan pemulihan, pelaksanaan reklamasi, dan pemantauan hasil pada lahan bekas tambang.",
    questions: [
      "Bagaimana rencana reklamasi terhubung dengan tahapan pembukaan lahan?",
      "Bukti pelaksanaan dan pemantauan apa yang sudah tersedia?",
      "Bagaimana rencana pascatambang ditinjau ketika kondisi kegiatan berubah?",
    ],
    documents: [
      "Rencana reklamasi dan pascatambang",
      "Dokumentasi pelaksanaan",
      "Hasil pemantauan pemulihan lahan",
    ],
  },
];
