# Catatan Evaluasi & Rencana Restorasi Visual 3D (Bentang Tambang)

*Dokumen ini mencatat evaluasi masalah visual pada lanskap 3D dan rencana perbaikan terinci yang akan dieksekusi.*

---

## 1. Ringkasan Masalah (Kenapa Visual Menjadi Rusak?)

Berdasarkan investigasi kode, terjadi penurunan estetika yang signifikan pada perombakan terakhir akibat:

1. **Kolam Pengelolaan Air (KPL) Berubah Menjadi Tembok Tegak**:
   - Terjadi **bug orientasi Three.js**: Mesh air menggunakan `planeGeometry args={[2.0, 5.2]}` tanpa rotasi `[-Math.PI / 2, 0, 0]`.
   - Secara *default*, `planeGeometry` menghadap ke sumbu Z (berdiri vertikal). Akibatnya, permukaan air berdiri tegak lurus setinggi 5,2 meter seperti 3 papan reklame / tembok raksasa yang menusuk ke langit.
   - Ditambah lagi, kolam diberi dasar balok tanah cokelat raksasa yang kaku (`10.5 x 0.7 x 7.5`), menghilangkan kesan kolam air berundak yang indah.

2. **Mobil HD (Dump Truck) Terlihat Berantakan & Penyok**:
   - Model truk sebelumnya yang *stylized* dan proporsional digantikan oleh tumpukan 25+ balok mikro (tangga samping, plat kisi, canopy tipis, pipa knalpot, lampu kecil) dengan skala `0.75`.
   - Pada sudut pandang kamera isometrik jauh tanpa tekstur resolusi tinggi, balok-balok kecil tersebut saling menumpuk bayangannya secara kasar (*noisy*), menghasilkan siluet yang kaku dan seperti gundukan balok penyok.

3. **Infrastruktur Terlalu Masif & Merusak Topografi**:
   - Di `lib/terrain.ts`, ditambahkan fungsi `padFactor` yang memotong lereng bukit menjadi plateau kotak datar yang kaku.
   - Workshop diberi dinding penahan (*retaining wall*) gelap tebal di bibir sungai, garis kuning pembatas bahaya, dan figur pekerja mini yang terlihat seperti pil warna-warni.
   - Kehilangan arah estetika awal: proyek ini mengusung gaya **clean stylized low-poly** (*teal & warm earth*), namun elemen baru terlalu gelap, padat, dan kaku.

---

## 2. Rencana Restorasi & Perbaikan Visual

### A. Kolam Pengelolaan Air (KPL - Sedimentation Ponds)
- [x] Kembalikan orientasi geometri air ke **horizontal (bidang XZ)**.
- [x] Buat kompartemen kolam berundak (kaskade 3 tahap) dengan efek air jernih berkilau:
  - Sel 1 (Inlet): Air sedimen keruh hangat (`#6b7868`).
  - Sel 2 (Penenang): Air transisi kehijauan (`#4c7774`).
  - Sel 3 (Outlet): Air zamrud toska jernih siap buang (`#3b827e`).
- [x] Hilangkan balok tanah cokelat raksasa kaku agar kolam menyatu lembut dengan rumput dan lereng sungai.

### B. Mobil HD (Heavy-Duty Haul Truck)
- [x] Bangun ulang model truk tambang dengan estetika *clean stylized low-poly*:
  - Bodi kokoh warna kuning tambang khas (`#d4a638`).
  - Bak jungkit (*dump body*) miring yang tegas dengan tumpukan batubara hitam pekat.
  - Kabin operator offset di sisi kiri dengan kaca gelap tajam.
  - Roda raksasa silindris berproporsi kuat dengan velg kontras.
  - Siluet bersih yang langsung terbaca jelas dan proporsional dari kamera jauh.

### C. Workshop & Area Stockpile
- [x] Sederhanakan geometri workshop: hilangkan retaining wall masif dan garis kuning yang berantakan.
- [x] Kembalikan atap beraksen toska industrial yang serasi dengan lanskap.
- [x] Stockpile batubara dibuat kerucut alami dengan overland conveyor ramping.

### D. Topografi Lereng (`lib/terrain.ts`)
- [x] Bersihkan perataan kaku `padFactor` dan gunakan *soft blending* agar perbukitan di tepi sungai mengalir alami tanpa patahan kotak buatan.

---

## 3. Berkas Terkait
* `components/Terrain.tsx`: Komponen utama 3D (kolam, truk, workshop, stockpile).
* `lib/terrain.ts`: Elevasi tanah dan perataan tapak.
* `docs/illustrated-world.md`: Panduan arah seni awal (*teal & warm-earth*).

## 4. Implementasi restorasi (9 September 2026)

- Air KPL diputar ke bidang XZ dan ditempatkan di atas dasar kolam, dengan penurunan 0,12 unit per sel. Tanggul rendah individual menggantikan fondasi besar; saluran pendek menghubungkan sel.
- Truk memakai bodi kuning, bak miring, muatan bersegi, kabin kiri, dan empat roda besar. Detail mikro tangga, knalpot, dan lampu dihapus untuk memperjelas siluet.
- Workshop memakai atap toska dan apron tipis berwarna tanah. Dinding penahan besar dan figur pekerja dihapus; bukaan bay dipindah ke depan fasad agar tidak tertutup dinding.
- Stockpile memakai alas elips dan kerucut bersegi dengan conveyor ramping.
- Perataan tapak menggunakan transisi elips dengan inti kecil yang tetap datar untuk menopang fasilitas.

Warna air merupakan ilustrasi tahapan pengendapan, bukan bukti kualitas air atau pemenuhan baku mutu.

Validasi: 14 tes unit lulus, `npx tsc --noEmit` lulus, dan tes browser `realism.spec.ts` lulus dengan batas waktu 180 detik (durasi sekitar 2,1 menit; percobaan awal mencapai batas 60 detik). Screenshot `test-results/operational-realism.png` diperiksa untuk orientasi kolam, siluet truk, dan palet fasilitas.
