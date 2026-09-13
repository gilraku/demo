# Integrasi Kenney Nature Kit

Sumber: https://kenney.nl/assets/nature-kit
Lisensi: CC0-1.0. Salinan lisensi asli dan manifest SHA-256 berada di
`public/assets/kenney/nature/`. Arsip sumber menyebut Nature Kit 2.1.

Tujuh GLB asli (97.964 byte total) disajikan lokal:

| Model | Pemakaian |
| --- | --- |
| tree_oak | Pohon berdaun lebar |
| tree_detailed | Variasi pohon bercabang |
| tree_palm | Palem di sisi sungai dekat permukiman |
| plant_bushDetailed | Semak berkelompok |
| grass_leafsLarge | Vegetasi rendah |
| stone_largeC | Batu alami |
| rock_largeA | Batu dengan penutup vegetasi |

`NatureInstances` memuat tujuh model secara paralel melalui cache useGLTF.
`prepareNatureGeometry` menggandakan geometri, menerapkan transformasi model,
menyatukan primitive, dan memanggang warna material menjadi warna vertex.
Geometri dinormalisasi ke tinggi satu unit dengan dasar di Y=0; penempatan
menggunakan elevasi tanah dan variasi ukuran deterministik. Model sumber
serta material cache tidak diubah. Tidak ada dependensi jaringan ke Kenney
saat aplikasi berjalan.

Palet runtime menggunakan hijau lembut untuk daun, cokelat untuk batang,
dan abu-abu hangat untuk batu. Setiap varian memakai satu instanced mesh,
sehingga tujuh varian membutuhkan tujuh draw call dasar (di luar shadow pass).
Model hanya muncul pada lokasi yang diizinkan pada tahap terkait.

Factory Kit dan Car Kit belum dimasukkan. Truk HD dan KPL tetap memakai
model khusus proyek. Bangunan fasilitas menggunakan integrasi Industrial
yang dijelaskan di bawah.

## Validasi

- 21 tes unit lulus, termasuk pemuatan dan normalisasi ketujuh GLB.
- Pemeriksaan TypeScript (`npx tsc --noEmit`) lulus.
- Uji browser `kenney.spec.ts` lulus: tujuh aset lokal berhasil dimuat dan
  dipasang ke scene, navigasi operasi/praoperasi/pascatambang berjalan,
  tanpa `pageerror` (durasi pengujian sekitar 1,6 menit).
- Screenshot `test-results/kenney-active.png` telah diperiksa secara visual.

## Bangunan dan perubahan tahap — 10 September 2026

City Kit Industrial 2.0 (Kenney, CC0) menambah empat GLB lokal:
`building-s` (workshop), `building-n` (gudang), `shipping-container-a`
(kontainer), dan `building-p` (pos pemantauan). Sumber:
https://kenney.nl/assets/city-kit-industrial

Empat model dan tekstur colormap bersama berukuran 342.818 byte. Lisensi
serta manifest SHA-256 tersimpan di `public/assets/kenney/industrial/`.
Material hasil clone memakai pencahayaan toon dan tint lembut, mempertahankan
UV dan tekstur sumber; material cache tidak dimutasi.

- Praoperasi: permukiman tetap hadir, fasilitas produksi dan pembibitan belum ada.
- Operasi: workshop, gudang, kontainer, stockpile, KPL, dan kendaraan aktif.
- Pascatambang: fasilitas produksi disembunyikan; pos kecil, petak pembibitan,
  dan akses pemeliharaan mengisi sebagian tapak lama. Ini pilihan ilustratif.

`StagePresence` mengubah tinggi dan posisi vertikal fasilitas selama 650 ms;
koordinat horizontal tetap. Pergantian arah melanjutkan nilai transisi terkini.
Vegetasi memakai identitas koordinat stabil: ukuran dan elevasi berinterpolasi,
termasuk objek yang masuk/keluar, tanpa menghapusnya di tengah animasi.
Pause/reduced-motion menyelesaikan perubahan secara langsung. Morf tanah
menggunakan durasi dan preferensi jeda yang sama.

Validasi bangunan/transisi: 23 tes unit dan TypeScript lulus. Uji browser
akhir lulus (sekitar 1,6 menit), termasuk kesiapan empat model bangunan,
status fasilitas tiap tahap, klik operasi→praoperasi→pascatambang selama
animasi berjalan, dan jeda animasi. Screenshot operasi dan pascatambang
diperiksa; fasad garasi diarahkan ke kamera utama.

## Koridor jalan HD

Jalan melingkar kini didefinisikan di `lib/site-layout.ts` dan memakai kurva
tertutup yang sama untuk mesh jalan, gerak truk, dan pemeriksaan penempatan.
Jarak bebas mencakup setengah lebar jalan, bahu 0,75 unit, radius horizontal
model, serta toleransi sampling 0,05 unit. Jalan utama dan servis diperiksa
sepanjang spline, bukan hanya garis penghubung titik kontrol.

Batas footprint per unit tinggi model: pohon 0,47; batu 2,5; semak/daun 2,4.
Skala instance ikut diperhitungkan. Tes GLB memeriksa batas tersebut agar
penggantian model di masa depan tidak diam-diam memasukkan aset ke jalan.

Validasi koridor: 24 tes unit dan TypeScript lulus. Screenshot operasi terbaru
sudah diperiksa dan jalan melingkar terlihat bebas batu/vegetasi. Proses uji
browser penuh terhenti dengan kode 143 setelah screenshot tersimpan, sehingga
percobaan tersebut tidak dicatat sebagai lulus.

## Stockpile, permukiman, dan KPL — 10 September 2026

Factory Kit 3.0 (https://kenney.nl/assets/factory-kit, CC0) memasok
`conveyor-long-sides` dan `hopper-square`, dengan colormap lokal bersama.
Nature Kit menambah `fence_simpleLow` dan `fence_gate`. Model asli, lisensi,
dan hash sumber tersimpan dalam folder aset masing-masing.

- Conveyor modular rendah berada di sisi timur stockpile, terpisah dari
  workshop. Tumpukan batubara memiliki ukuran berbeda, dengan muatan kecil
  bergerak di atas belt saat operasi; jeda/reduced-motion menghentikannya.
- Tiga rumah di tepi permukiman mendapat pagar samping, gerbang depan,
  akses halaman, dan pot tanaman. Kebun memiliki tanaman berbaris.
- KPL memakai geometri tanggul miring dengan bukaan air, tiga elevasi air
  menurun, saluran antarsel, jalur inspeksi, dan outlet di bawah jalan servis.
  Ini ilustrasi tata letak, bukan desain hidraulik untuk konstruksi.
- Stockpile dan KPL berada di dalam transisi fasilitas operasi. Detail
  permukiman tetap hadir pada semua tahap.

Factory Kit yang dipilih beserta colormap berjumlah 44.005 byte.
Tes visual dapat diminta dengan `CAPTURE_SCENE=1 npx playwright test tests/browser/kenney.spec.ts`. Secara default tes
browser memeriksa pemuatan aset dan perilaku tahap tanpa screenshot, karena
pengambilan screenshot pascatambang sempat melewati batas 300 detik pada
lingkungan pengujian. Screenshot operasi tetap diperiksa secara terpisah.

Validasi akhir detail situs: 26 tes unit dan TypeScript lulus; uji browser
pemuatan aset, perpindahan tahap cepat, dan jeda lulus tanpa screenshot
otomatis (4,6 menit). Screenshot operasi tersimpan di
`test-results/site-details-active.png` dan telah diperiksa.

## Permukiman demo — 13 September 2026

City Kit Suburban (Kenney, CC0) menambah tiga variasi rumah lokal:
`building-type-a`, `building-type-g`, dan `building-type-s`. Model dipakai
bergantian pada sembilan rumah agar siluet permukiman tidak repetitif.
Tekstur `Textures/colormap.png` disalin mengikuti path relatif yang direferensikan
oleh GLB; material runtime di-clone lalu diberi pencahayaan toon dan tint hangat.
Manifest SHA-256 serta lisensi berada di `public/assets/kenney/suburban/`.

Stockpile tetap menggunakan heap batubara custom proyek dengan conveyor dan
hopper dari Factory Kit. Apron, curb penahan, kaki conveyor, dan beam keselamatan
ditambahkan sebagai geometri ringan agar area penyimpanan terbaca lebih jelas
dari kamera presentasi. Truk angkut tetap custom agar ukuran, warna keselamatan,
dan animasinya konsisten dengan scene.
