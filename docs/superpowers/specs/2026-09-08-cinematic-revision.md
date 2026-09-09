# Bentang Tambang — revisi sinematik yang disetujui

Pengguna menolak komposisi dashboard/diorama dan menyetujui rekomendasi lanskap sinematik semi-realistis. Implementasi dilanjutkan langsung sesuai persetujuan.

- Lanskap perspektif memenuhi viewport desktop. Terrain luas dengan kontur tak beraturan, jenjang pit, jalan angkut, kolam pengendapan, sungai, vegetasi rapat, fasilitas industri dan permukiman. Cahaya atmosferik, kabut jarak, variasi material tanah dan tutupan vegetasi memberi kedalaman.
- Navigasi minimal di atas scene. Tahap kegiatan dan pilihan lokasi tetap HTML. Panel pembelajaran hanya dibuka setelah lokasi dipilih; penutupan panel mengembalikan pandangan luas. Kamera berpindah ke lokasi secara halus, mengikuti reduced-motion.
- Warna antarmuka putih tulang, arang, serta amber lokasi terpilih; tipografi besar hanya untuk nama tahap. Panel baca berkontras tinggi. Di ponsel panel menjadi bottom sheet yang dapat digulir.
- Data Pasal.id dan cadangan yang ada tetap digunakan. Tidak ada angka pemantauan atau simulasi kepatuhan yang dikarang.
- Inisialisasi WebGL berurutan dengan percobaan tanpa antialiasing. Browser yang gagal mendapat peta 2D interaktif, detail diagnostik, dan tombol retry. Browser dengan WebGL dinonaktifkan tidak bisa dipaksa mendukung WebGL oleh aplikasi.
- Uji browser renderer perangkat lunak dibedakan dari diagnosis Chrome tanpa opsi pemaksaan renderer. Jangan menyatakan masalah Chrome pengguna selesai hanya dari tes software renderer.

## Rencana implementasi

1. Buat pembangkit terrain dan scene terpisah agar geometri/material tidak bercampur dengan materi regulasi.
2. Ganti komposisi Explorer dengan viewport, navigasi, kontrol tahap, dan drawer konteks. Gunakan kembali pembaca regulasi.
3. Tambahkan fallback peta dan diagnostik grafis; verifikasi buka/tutup drawer, tahap, regulasi, mobile, reduced motion, serta Chrome tanpa renderer paksa.
4. Periksa screenshot, uji data, dan build produksi. Catat batas bukti Chrome pengguna secara eksplisit.

## Hasil verifikasi

Komposisi layar penuh, terrain perspektif, panel kontekstual, dan bottom sheet sudah diimplementasikan. Pengujian desktop mencakup buka/tutup lokasi, perubahan tahap, pencarian, serta pembaca regulasi. Pengujian ponsel dan peta interaktif saat WebGL diblokir lulus. Tes Chrome tanpa argumen renderer perangkat lunak berhasil menginisialisasi 3D pada lingkungan pengujian. Profil Chrome pengguna belum diperiksa langsung, sehingga kompatibilitas profil tersebut belum dapat dipastikan.

Pemeriksaan build awal terhambat keluaran kosong dari proses TypeScript terpisah di sandbox. Pemeriksaan TypeScript langsung lulus, dan build produksi di luar sandbox lulus tanpa menonaktifkan pemeriksaan tipe.
