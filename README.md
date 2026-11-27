# PapiBengkel — Frontend Booking Servis

Frontend ini mengadaptasi layar booking pada `stitch_papibengkel_design_system.zip`. Tampilan mencakup pemilihan layanan, data kendaraan, slot kedatangan, review, dan konfirmasi. Ringkasan biaya dan durasi diperbarui saat pilihan berubah.

## Cara membuka

1. Ekstrak ZIP ke satu folder.
2. Buka `index.html` di Chrome, Edge, atau Firefox. Semua aset disertakan. Instalasi dan koneksi internet tidak diperlukan.

Untuk menjalankan melalui server lokal, jalankan perintah ini dari folder yang berisi `index.html`.

```powershell
python -m http.server 4177 --bind 127.0.0.1
```

Buka `http://127.0.0.1:4177` di browser.

## Coba alurnya

1. Tambah atau hapus layanan dan lihat perubahan estimasi.
2. Gunakan kendaraan contoh atau isi kendaraan baru dengan data fiktif.
3. Pilih tanggal dan slot yang tersedia dalam WIB.
4. Tinjau lalu simpan booking. Buka **Pesanan Saya** untuk melihat kode dan rincian yang tersimpan.

## Struktur

- `index.html` berisi formulir, ringkasan, dan dialog.
- `styles.css` berisi warna, tipografi, komponen, dan pengaturan layar sempit.
- `app.js` berisi data demo, pemeriksaan formulir, perhitungan estimasi, dan riwayat booking.
- `assets/` berisi logo dan thumbnail dari referensi Stitch.

Formulir berdiri sendiri dengan HTML, CSS, dan JavaScript. Ketersediaan slot adalah simulasi. Riwayat disimpan di `localStorage` untuk asal halaman yang sedang dibuka. Pemesanan asli, akun, dan pembayaran memerlukan integrasi dengan backend PapiBengkel.
