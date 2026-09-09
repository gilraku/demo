# Bentang Tambang

Ruang belajar interaktif untuk praktisi perusahaan pertambangan batubara. Lanskap Three.js memenuhi layar dengan kamera perspektif, terrain berjenjang, jalan angkut, vegetasi, sungai, kolam, dan fasilitas. Memilih lokasi membuka panel konteks dan sumber regulasi Pasal.id; menutup panel mengembalikan pandangan luas. Pada ponsel konteks ditampilkan sebagai bottom sheet.

Implementasi aktif: `components/ImmersiveExplorer.tsx` (pengalaman dan panel), `components/CinematicLandscape.tsx` (kamera, WebGL, dan fallback), `components/Terrain.tsx` (geometri dan material), serta `lib/terrain.ts` (kontur dan lokasi). Generasi geometri bersifat deterministik dan ilustratif.

## Kompatibilitas grafis

Pemeriksaan WebGL selesai sebelum renderer dimulai, dengan percobaan ulang tanpa antialiasing. Jika konteks grafis tetap gagal, aplikasi menampilkan peta 2D interaktif, detail kesalahan, dan tombol mencoba kembali. Aplikasi tidak dapat mengaktifkan WebGL atau akselerasi grafis yang dinonaktifkan oleh pengaturan browser atau driver.

Di Chrome, `chrome://gpu` menampilkan status WebGL/WebGL2 dan alasan pemblokiran grafis. Hasil tes browser otomatis tidak menjamin profil Chrome pengguna memiliki pengaturan atau driver yang sama.

`tests/browser/chrome-native.spec.ts` menguji Chrome tanpa argumen `--enable-unsafe-swiftshader` dan mencatat apakah hasilnya renderer 3D atau fallback 2D. Tes interaksi lainnya menggunakan renderer perangkat lunak yang dikonfigurasi secara eksplisit di Playwright; hasil kedua mode harus dibedakan.

## Jalankan

Node.js 22+ diperlukan. Instal dependensi dengan `npm ci`, buat `.env.local` berdasarkan `.env.example`, lalu isi `PASAL_API_TOKEN` dengan token Pasal.id. Jalankan `npm run dev` dan buka http://localhost:3000.

Untuk produksi lokal: `npm run build` kemudian `npm start`. Token hanya digunakan server dan tidak boleh diberi prefiks `NEXT_PUBLIC_`.

## Cadangan regulasi

`data/regulations/` berisi snapshot asli lima pencarian tematik dan 38 detail peraturan dari Pasal.id. Sebanyak 32 detail mempunyai isi (5.359 simpul bab/pasal/ayat), sedangkan enam detail hanya mempunyai metadata karena sumber belum menyediakan teks. Masing-masing menyimpan respons sumber dan `provenance.fetchedAt`. Snapshot merupakan salinan pada waktu pengambilan, bukan jaminan konsolidasi hukum terbaru. Respons detail kosong tidak menimpa cadangan yang sudah mempunyai teks.

Alur pembacaan:

1. Salinan runtime berumur kurang dari lima menit dapat langsung digunakan.
2. Server mencoba Pasal.id dengan timeout delapan detik. Respons berhasil divalidasi dan disimpan secara atomik ke `.cache/pasal/`.
3. Jika jaringan, autentikasi, batas request, atau format respons gagal, server memilih salinan valid terbaru dari cache runtime dan snapshot bawaan. UI memberi label **Data cadangan**, waktu pengambilan, dan alasan fallback.
4. Tanpa cadangan untuk permintaan yang sama, aplikasi menampilkan pesan kegagalan. Hasil kosong dan data hukum palsu tidak digunakan sebagai pengganti gangguan layanan.

Cadangan pencarian terkait dengan kata kunci dan filter yang tepat. Pencarian bebas atau filter baru belum tentu mempunyai salinan. Pilihan topik bawaan menggunakan kata kunci yang telah dicadangkan; detail untuk seluruh hasil snapshot awal juga dicadangkan.

Perbarui snapshot dengan `npm run backup:refresh`. Perintah memanggil lima pencarian dan detail hasilnya secara berurutan, menjaga salinan lama jika pembaruan gagal, dan mengembalikan exit code bukan nol bila ada kegagalan. Berkas JSON adalah data yang dihasilkan script, bukan isi editorial buatan aplikasi.

Untuk server dengan filesystem sementara atau hanya-baca, tentukan `PASAL_CACHE_DIR` ke volume persisten yang dapat ditulis. Tanpa volume persisten, snapshot bawaan tetap tersedia, tetapi hasil baru bisa hilang saat restart atau redeploy. Snapshot dibundel melalui konfigurasi file tracing Next.js. Pembaruan berkala dapat dijalankan oleh scheduler deployment sesuai kebutuhan; proyek ini belum memasang scheduler atau melakukan deployment.

## Pemeriksaan

- `npm test`: persistensi, identitas peraturan daerah, respons rusak, isolasi pencarian, serta fallback gangguan jaringan/401/429/500. Memastikan seluruh hasil cadangan awal memiliki detail yang dapat dibaca tanpa API.
- `npm run build`: kompilasi produksi dan TypeScript.
- `npx playwright test`: dengan server lokal berjalan di port 3000 dan Google Chrome terpasang, memeriksa lanskap, perubahan tahap, pembaca peraturan, viewport ponsel, keyboard, dan fallback tanpa WebGL. Screenshot tersimpan di `test-results/`.

## Batas materi

Pertanyaan peninjauan merupakan panduan diskusi editorial, bukan daftar kewajiban lengkap atau penilaian kepatuhan. Periksa isi sumber, status, perubahan regulasi, persetujuan lingkungan, serta dokumen perusahaan sebelum menerapkan. Lanskap adalah ilustrasi, bukan lokasi aktual maupun simulasi kuantitatif pencemaran.

Tidak ada akun, database, chatbot AI, atau layanan penilaian kepatuhan dalam versi ini. UI tetap bisa menampilkan materi dan daftar topik jika WebGL tidak tersedia. Font web memiliki fallback sistem bila koneksi font gagal.

## GitHub Pages

Demo publik: https://gilraku.github.io/demo/

Push ke `main` menjalankan workflow `.github/workflows/pages.yml`, tes, build,
dan deployment Pages. Pilih **GitHub Actions** sebagai sumber Pages di pengaturan
repository. `npm run build:pages` menghasilkan folder `out/` dengan base path
`/demo`. Build memakai salinan proyek di `.cache/pages` tanpa route API;
server lokal tetap bisa dijalankan dengan `npm run dev`.

Versi Pages memuat aset Kenney lokal dan salinan regulasi bertanggal dari
`data/regulations`. Pencarian tersedia untuk lima topik bawaan, dengan filter
jenis pada hasil tersimpan. Pencarian bebas di luar topik tersebut memerlukan
Pasal.id atau deployment server Next.js. Token API tidak diperlukan di Pages
dan tidak disertakan dalam hasil build.

## Vercel (server dan API langsung)

Proyek Vercel `bentang-tambang` terhubung ke repo GitHub ini. Production memakai
`npm run build` dengan server Next.js dan route `/api/regulations`.
Atur `PASAL_API_TOKEN` sebagai environment variable **Sensitive** untuk Production
pada Vercel. Jangan aktifkan `NEXT_PUBLIC_STATIC_EXPORT` atau
`NEXT_PUBLIC_BASE_PATH` di Vercel; keduanya khusus build GitHub Pages.

`vercel.json` mengarahkan cache ke `/tmp/bentang-tambang/pasal`, yang bersifat
sementara per instance. Salinan regulasi bawaan tetap tersedia saat API bermasalah.
`.vercelignore` mengecualikan file environment lokal dari unggahan deployment.
