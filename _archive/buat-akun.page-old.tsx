'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, Save } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

// Daftar warehouse yang tersedia
const WAREHOUSE_LIST = [
  'TA ISO INV PAMANUKAN WH',
  'TA ISO INV RENGGASDENGKLOK WH',
  'TA ISO INV SUKARESMI WH',
  'TA ISO INV PONDOK GEDE WH',
  'TA ISO INV BEKASI JUANDAKALIABANG WH',
  'TA ISO INV BANTAR GEBANG WH',
  'TA ISO INV JABABEKA WH',
  'TA ISO INV CIKARANG WH',
  'TA ISO INV CIBITUNG WH',
  'TA ISO INV PEKAYON WH',
  'TA ISO INV PURWAKARTA WH'
];


// Komponen Form untuk membuat akun user
function CreateUserForm({ onModeChange }: { onModeChange: (isEdit: boolean) => void }) {
  const { addUser } = useAuth();
  const [namaAkun, setNamaAkun] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [role, setRole] = useState('SCMT,_TE Witel Inv Drafter');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  // Cek apakah ada data edit dari localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const editUserDataString = localStorage.getItem('editUserData');
      if (editUserDataString) {
        const editUserData = JSON.parse(editUserDataString);
        if (editUserData.isEdit) {
          setIsEditMode(true);
          setOriginalUsername(editUserData.originalUsername);
          setNamaAkun(editUserData.namaAkun);
          setUsername(editUserData.username);
          setWarehouse(editUserData.warehouse);
          setRole(editUserData.role);
          setPassword(''); // Password tetap kosong untuk keamanan
          
          // Beritahu parent component bahwa ini mode edit
          onModeChange(true);
          
          // Hapus data edit dari localStorage setelah digunakan
          localStorage.removeItem('editUserData');
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!namaAkun.trim() || !username.trim() || !password.trim() || !warehouse || !role) {
      setMessage({ type: 'error', text: 'Semua field harus diisi!' });
      return;
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter!' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isEditMode) {
        // Mode edit - update user yang sudah ada
        if (typeof window !== 'undefined') {
          const createdUsersString = localStorage.getItem('createdUsers');
          if (createdUsersString) {
            let createdUsers = JSON.parse(createdUsersString);
            
            // Update user berdasarkan username asli
            const userIndex = createdUsers.findIndex((user: any) => user.username === originalUsername);
            if (userIndex !== -1) {
              createdUsers[userIndex] = {
                ...createdUsers[userIndex],
                namaAkun: namaAkun.trim(),
                username: username.trim().toLowerCase(),
                password: password, // Update password jika diisi
                warehouse: warehouse,
                role: role
              };
              
              localStorage.setItem('createdUsers', JSON.stringify(createdUsers));
              setMessage({ type: 'success', text: `User "${username.trim()}" berhasil diperbarui!` });
              
              // Redirect kembali ke halaman pengaturan setelah 2 detik
              setTimeout(() => {
                window.location.href = '/admin/pengaturan';
              }, 2000);
            }
          }
        }
      } else {
        // Mode buat user baru
        const userData = {
          namaAkun: namaAkun.trim(),
          username: username.trim().toLowerCase(),
          password: password,
          warehouse: warehouse,
          role: role
        };

        // Simpan user baru menggunakan AuthContext
        addUser(userData);
        
        console.log('User baru berhasil dibuat dan disimpan:', userData);
        
        // Reset form
        setNamaAkun('');
        setUsername('');
        setPassword('');
        setWarehouse('');
        setRole('SCMT,_TE Witel Inv Drafter');
        setMessage({ type: 'success', text: `Akun user "${userData.username}" berhasil dibuat dan dapat digunakan untuk login!` });
      }
      
    } catch (error) {
      setMessage({ type: 'error', text: isEditMode ? 'Terjadi kesalahan saat memperbarui user!' : 'Terjadi kesalahan saat membuat akun!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message Alert */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle size={18} />
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nama Akun Field */}
        <div>
          <label htmlFor="namaAkun" className="block text-sm font-medium text-gray-700 mb-2">
            Nama Akun <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="namaAkun"
            value={namaAkun}
            onChange={(e) => setNamaAkun(e.target.value)}
            placeholder="Masukkan nama lengkap"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-black"
            disabled={isSubmitting}
          />
        </div>

        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-black"
            disabled={isSubmitting}
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password (min. 6 karakter)"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-black"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Role Field */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="role"
            value={role}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed font-medium"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Warehouse Field - Full Width */}
      <div>
        <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-2">
          Warehouse <span className="text-red-500">*</span>
        </label>
        <select
          id="warehouse"
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white text-black"
          disabled={isSubmitting}
        >
          <option value="">Pilih warehouse...</option>
          {WAREHOUSE_LIST.map((warehouseItem, index) => (
            <option key={index} value={warehouseItem}>
              {warehouseItem}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isEditMode ? 'Memperbarui User...' : 'Membuat Akun...'}
            </>
          ) : (
            <>
              <Save size={18} />
              {isEditMode ? 'Update User' : 'Buat Akun User'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function BuatAkunPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Pastikan komponen sudah mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect jika bukan admin
  useEffect(() => {
    if (mounted && !isLoading && user && user.role !== 'admin') {
      router.push('/item');
    }
  }, [mounted, isLoading, user, router]);

  // Jika bukan admin, jangan tampilkan halaman
  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded bg-orange-500 text-white grid place-items-center shadow-sm">
              <UserPlus size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit User' : 'Buat Akun User'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </div>

        {/* Content Area - Form Buat Akun User */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header Section */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Form Edit User' : 'Form Buat Akun User Baru'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode ? 'Ubah informasi user sesuai kebutuhan' : 'Isi semua informasi untuk membuat akun user baru'}
            </p>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <CreateUserForm onModeChange={setIsEditMode} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
