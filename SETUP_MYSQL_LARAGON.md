# Setup Database MySQL dengan Laragon untuk RouterTrack

Panduan lengkap untuk setup database MySQL lokal menggunakan Laragon dan phpMyAdmin.

## 📋 Prerequisites

- **Laragon** sudah terinstall (download dari https://laragon.org/)
- **Node.js** versi 18 atau lebih tinggi
- **MySQL** aktif di Laragon

## 🚀 Langkah-langkah Setup

### 1. Persiapan Environment Variables

Buat file `.env.local` di root project (sejajar dengan `package.json`):

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=routertrack_db

# JWT Secret (ganti dengan random string di production)
JWT_SECRET=your-very-secret-key-change-this-in-production-min-32-chars
```

**⚠️ PENTING**: 
- Default password MySQL di Laragon kosong (empty string)
- Ganti `JWT_SECRET` dengan string random minimal 32 karakter untuk keamanan

### 2. Start Laragon dan MySQL

1. Buka **Laragon**
2. Klik **Start All** untuk menjalankan Apache & MySQL
3. Pastikan MySQL berjalan (lampu hijau)

### 3. Buka phpMyAdmin

Ada 2 cara:
- **Cara 1**: Klik kanan icon Laragon > MySQL > phpMyAdmin
- **Cara 2**: Buka browser, akses `http://localhost/phpmyadmin`

Login dengan:
- **Username**: `root`
- **Password**: *(kosong, langsung klik Go)*

### 4. Buat Database

Di phpMyAdmin:
1. Klik tab **SQL** di menu atas
2. Copy-paste isi file `database/schema-mysql.sql`
3. Klik **Go** untuk execute

Database `routertrack_db` akan otomatis dibuat beserta semua tabelnya.

### 5. Generate Password Hash untuk Admin

Jalankan script untuk generate password hash:

```bash
node scripts/generate-password-hash.js
```

Copy hash yang dihasilkan, kemudian update di database.

### 6. Insert Admin User

Di phpMyAdmin, pilih database `routertrack_db`, klik tab **SQL**, lalu execute:

```sql
-- Ganti $2a$10$... dengan hash password dari step 5
INSERT INTO users (email, password_hash, nama_akun, username, warehouse, role, status, created_by)
VALUES (
  'admin@routertrack.com',
  '$2a$10$YourHashedPasswordFromStep5',
  'Administrator',
  'admin',
  'TA ISO INV BEKASI JUANDAKALIABANG WH',
  'admin',
  'active',
  'system'
);
```

### 7. Install Dependencies

```bash
npm install
```

Ini akan install:
- `mysql2` - MySQL client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- Dan dependencies lainnya

### 8. Jalankan Aplikasi

```bash
npm run dev
```

Buka browser ke `http://localhost:3000`

## 🔐 Login Credentials

Setelah setup selesai, gunakan credentials berikut:

- **Email/Username**: `admin@routertrack.com` atau `admin`
- **Password**: `admin123456`

## 📊 Struktur Database

### Tabel `users`
Menyimpan data user dan credentials untuk authentication.

| Field | Type | Deskripsi |
|-------|------|-----------|
| id | INT | Primary key (auto increment) |
| email | VARCHAR(255) | Email user (unique) |
| password_hash | VARCHAR(255) | Password ter-hash (bcrypt) |
| nama_akun | VARCHAR(255) | Nama lengkap user |
| username | VARCHAR(255) | Username untuk login (unique) |
| warehouse | VARCHAR(255) | Lokasi warehouse |
| role | ENUM | 'admin' atau 'user' |
| status | ENUM | 'active' atau 'inactive' |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

### Tabel `ont_data`
Menyimpan data ONT (Optical Network Terminal).

| Field | Type | Deskripsi |
|-------|------|-----------|
| id | INT | Primary key |
| serial_number | VARCHAR(255) | Serial number ONT (unique) |
| item_code | VARCHAR(255) | Kode item |
| item_description | TEXT | Deskripsi item |
| owner | VARCHAR(255) | Pemilik |
| location_code | VARCHAR(255) | Kode lokasi |
| inventory_status | VARCHAR(255) | Status inventory |
| condition_status | VARCHAR(255) | Kondisi barang |

### Tabel `unrefurbish_data`
Menyimpan data hasil proses unrefurbish ONT.

| Field | Type | Deskripsi |
|-------|------|-----------|
| id | INT | Primary key |
| serial_number | VARCHAR(255) | FK ke ont_data |
| tes_visual | JSON | Data hasil tes visual |
| photos | JSON | Array foto (base64) |
| photo_count | INT | Jumlah foto |
| completed_at | TIMESTAMP | Waktu selesai |
| status | VARCHAR(50) | Status unrefurbish |

## 🔧 Troubleshooting

### MySQL tidak bisa connect

**Error**: `ECONNREFUSED` atau `Access denied`

**Solusi**:
1. Pastikan MySQL di Laragon sudah running
2. Check di `.env.local`:
   - `DB_HOST=localhost`
   - `DB_PASSWORD=` (kosong untuk Laragon default)
3. Restart Laragon jika perlu

### Database tidak ditemukan

**Error**: `ER_BAD_DB_ERROR: Unknown database 'routertrack_db'`

**Solusi**:
- Jalankan ulang SQL script di `database/schema-mysql.sql`
- Pastikan database `routertrack_db` ada di phpMyAdmin

### JWT Token error

**Error**: `jwt must be provided` atau `jwt malformed`

**Solusi**:
- Pastikan `JWT_SECRET` di `.env.local` sudah diset
- Clear browser cookies dan login ulang

### Port 3306 sudah digunakan

**Solusi**:
1. Stop MySQL service lain yang berjalan
2. Atau ubah port MySQL di Laragon settings
3. Update `DB_PORT` di `.env.local`

## 📝 Notes

### Migrasi dari Supabase

Aplikasi ini sudah **tidak menggunakan Supabase** lagi. Semua sudah diganti dengan:
- **Database**: MySQL lokal
- **Authentication**: JWT dengan bcrypt
- **Backend**: Next.js Server Actions

File-file Supabase yang bisa dihapus:
- `src/lib/supabase.ts`
- `src/contexts/AuthContextSupabase.tsx`
- `src/utils/migration.ts`
- `scripts/seed-admin.js` (versi Supabase)
- `supabase-config.example.ts`

### Keamanan

**Production checklist**:
- ✅ Ganti `JWT_SECRET` dengan random string yang kuat
- ✅ Set MySQL password yang kuat
- ✅ Enable SSL untuk MySQL connection
- ✅ Gunakan HTTPS untuk aplikasi
- ✅ Backup database secara berkala

### Backup Database

Export database:
```bash
# Dari phpMyAdmin: Export > Go
# Atau via command line:
mysqldump -u root routertrack_db > backup.sql
```

Restore database:
```bash
mysql -u root routertrack_db < backup.sql
```

## ✅ Verification

Setelah setup, test hal berikut:
1. ✅ Login dengan admin credentials
2. ✅ Buat user baru dari halaman admin
3. ✅ Tambah data ONT
4. ✅ Input data unrefurbish
5. ✅ Logout dan login kembali

## 📞 Support

Jika ada masalah, check:
1. **Laragon logs**: Laragon > Menu > Log > MySQL
2. **Next.js logs**: Terminal tempat `npm run dev` berjalan
3. **Browser console**: F12 > Console tab

---

**Last Updated**: November 2024
**Database**: MySQL 5.7+
**Framework**: Next.js 16 + Server Actions
