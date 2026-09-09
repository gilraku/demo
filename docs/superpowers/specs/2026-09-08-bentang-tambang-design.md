# Bentang Tambang — spesifikasi versi pertama

## Tujuan dan pengguna

Aplikasi edukasi interaktif berbahasa Indonesia untuk praktisi perusahaan pertambangan batubara, terutama fungsi lingkungan, operasional, dan kepatuhan. Pengguna memahami hubungan lokasi kegiatan, tahap tambang, topik kewajiban lingkungan, dan sumber peraturan. Aplikasi tidak menetapkan kepatuhan suatu perusahaan.

Konsep lanskap tambang telah disetujui pengguna. Pengguna menyerahkan pilihan teknologi dan mengutamakan visual menarik serta responsif.

## Pengalaman utama

Halaman utama langsung menampilkan diorama tambang 3D dengan judul Bentang Tambang dan pilihan tahap Praoperasi, Operasi, serta Pascatambang. Lanskap memuat pit tambang, fasilitas pengelolaan air, sungai, permukiman, dan lahan reklamasi. Tahap terpilih mengubah penekanan visual dan topik yang tersedia. Perubahan ini merupakan ilustrasi edukasi, bukan simulasi fisik dampak lingkungan.

Pengguna memilih lokasi melalui penanda 3D atau daftar topik HTML yang setara. Kamera bergerak singkat menuju lokasi tersebut. Panel menampilkan konteks kegiatan, pertanyaan peninjauan untuk praktisi, dan tombol pencarian regulasi terkait. Hasil pencarian menampilkan judul, jenis, tahun, status, cuplikan, dan tautan sumber. Pengguna dapat membuka detail peraturan serta menelusuri struktur pasalnya.

Pencarian bebas dan filter jenis peraturan tersedia tanpa harus berinteraksi dengan objek 3D. Topik terpilih, tahap, dan hasil pencarian tidak hilang ketika panel ditutup di ponsel.

## Ruang lingkup materi

- Praoperasi: perizinan kegiatan, persetujuan lingkungan, dan perencanaan pengelolaan serta pemantauan lingkungan.
- Operasi: pengelolaan air, emisi dan debu, limbah, pemantauan, serta pelaporan.
- Area sekitar: sungai, masyarakat, partisipasi, dan pengaduan lingkungan.
- Pascatambang: reklamasi, pemulihan lahan, dan rencana pascatambang.

Teks editorial menjelaskan konteks dan pertanyaan pembelajaran. Klaim kewajiban spesifik hanya ditampilkan jika didukung isi peraturan yang diperiksa. Hasil pencarian tidak otomatis dianggap sebagai semua kewajiban yang berlaku pada lokasi pengguna. Status berlaku, diubah, dicabut, dan ketidakpastian status dari API ditampilkan secara eksplisit.

## Visual dan tata letak

Diorama menjadi pusat perhatian dengan tanah berlapis, pit bertingkat, sungai, vegetasi, kolam, dan bangunan industri geometris. Model dibuat secara prosedural agar ringan dan konsisten. Palet: langit #E6EFF4, vegetasi #375C4A, batubara #26313B, tanah #A77954, air #368DA8, penanda #F0BD51. Panel menggunakan putih #FFFFFF dan teks #1E303B.

Tipografi menggunakan keluarga sans-serif yang jelas dengan hierarki judul, label lokasi, dan isi. Antarmuka berbahasa Indonesia; detail implementasi tidak muncul dalam alur produk.

Desktop: bilah navigasi ringkas, area diorama luas, pilihan tahap, dan panel detail di sisi kanan. Ponsel: diorama lebih pendek dengan panel informasi di bawahnya dan pilihan tahap yang tetap mudah dijangkau. Tidak ada navigasi yang bergantung pada hover.

## Teknologi dan batas komponen

Next.js App Router, TypeScript, React Three Fiber, Drei, Three.js, dan CSS responsif. Scene 3D dimuat di klien secara dinamis. Komponen terpisah menangani lanskap, pilihan tahap, daftar topik, panel edukasi, pencarian, dan pembaca peraturan.

Route server aplikasi menjadi perantara Pasal.id. Token dibaca dari variabel lingkungan PASAL_API_TOKEN dan tidak dimasukkan ke kode browser, URL, log, atau repositori. Berkas contoh konfigurasi hanya berisi placeholder. Tidak diperlukan database atau akun pengguna untuk versi pertama.

## Integrasi Pasal.id

Dokumentasi sumber: https://pasal.id/api, diperiksa 8 September 2026.

- GET /api/v1/search: kata kunci, filter jenis, maksimal 20 hasil.
- GET /api/v1/laws/{frbr_uri}: metadata, struktur isi peraturan, dan hubungan antarperaturan.
- GET /api/v1/laws: tersedia untuk daftar dan filter bila diperlukan, bukan prasyarat alur utama.

Server menerima parameter yang divalidasi dan hanya memanggil host Pasal.id dengan jalur endpoint yang ditentukan. Pencarian dilakukan melalui submit eksplisit, bukan pada setiap karakter. Cache singkat mengurangi permintaan berulang. Permintaan memiliki batas waktu; pencarian baru membatalkan pemrosesan hasil lama di antarmuka.

Tautan pasal memakai best_passage.href bila tersedia. Tanpa locator pasal yang valid, tampilkan tautan akar peraturan yang tersedia tanpa mengarang nomor atau alamat pasal. Respons detail dinormalisasi berdasarkan struktur aktual API sebelum dirender.

Kesalahan autentikasi, pembatasan request, timeout, hasil kosong, dan kegagalan layanan memiliki pesan yang jelas serta tindakan mencoba kembali. Jangan mengganti kegagalan API dengan hasil regulasi palsu. Diorama dan konteks pembelajaran tetap dapat dijelajahi saat API tidak tersedia.

Tambahan yang disetujui pengguna: cadangan regulasi saat API gagal. Snapshot bawaan mencakup lima pencarian tematik dan seluruh 38 detail peraturan unik pada hasilnya. Server menyimpan respons valid baru secara atomik, lalu memakai salinan terbaru saat koneksi atau API gagal. UI selalu menampilkan sumber live/cache/cadangan serta waktu pengambilan. Pencarian baru tanpa cadangan menampilkan pesan yang jujur. Pembaruan snapshot dilakukan melalui `npm run backup:refresh`; deployment persisten memerlukan volume cache yang dapat ditulis.

## Aksesibilitas dan performa

Semua pilihan lokasi tersedia sebagai tombol HTML dengan fokus keyboard terlihat. Informasi status disampaikan melalui teks selain warna. Preferensi reduced-motion mematikan perpindahan kamera animasi. Teks hukum tetap berada di HTML, bukan tekstur 3D.

Batasi rasio piksel rendering, gunakan geometri berulang, dan hindari efek pascaproses berat. Sediakan tampilan topik 2D jika WebGL tidak tersedia. Tidak ada rotasi kamera otomatis yang terus berjalan. Kontrol orbit dibatasi agar lanskap tidak terbalik atau hilang dari pandangan.

## Verifikasi dan penerimaan

- Build produksi dan pemeriksaan TypeScript berhasil.
- Pencarian nyata menggunakan token server mengembalikan hasil, dan detail yang dipilih sesuai peraturan hasil pencarian.
- Uji validasi parameter serta respons API gagal dan kosong pada batas integrasi.
- Periksa tampilan desktop dan ponsel, navigasi keyboard, fallback WebGL, serta reduced-motion.
- Pastikan token tidak terdapat dalam aset klien atau berkas terlacak.
- Pengguna dapat memilih tahap, memilih lokasi, mencari peraturan, membaca detail, dan membuka sumber tanpa kehilangan konteks topik.

## Di luar versi pertama

Penilaian kepatuhan perusahaan, unggah dokumen internal, akun, penyimpanan progres di server, chatbot AI, notifikasi perubahan regulasi, simulasi pencemaran kuantitatif, dan publikasi ke layanan hosting tidak termasuk versi pertama.
