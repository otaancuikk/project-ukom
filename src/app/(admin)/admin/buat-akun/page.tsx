'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, Save, ArrowLeft, Edit } from 'lucide-react';
import { UserService } from '@/services/userService';

// Daftar warehouse yang tersedia
const WAREHOUSE_LIST = [
  'TA ISO INV KEDIRI WH',
  'TA ISO INV MOJOKERTO WH',
  'TA ISO INV BLITAR WH',
  'TA ISO INV SEMARANG WH',
  'TA ISO INV KENDAL WH',
  'TA ISO INV KUDUS WH',
  'TA ISO INV CIKARANG WH',
  'TA ISO INV CIBITUNG WH',
  'TA ISO INV BEKASIJUANDA WH'
];

export default function BuatAkunPage() {
  const { user, isLoading, addUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // Edit mode detection
  const editUserId = searchParams.get('edit');
  const isEditMode = !!editUserId;
  const [loadingUserData, setLoadingUserData] = useState(isEditMode);
  
  // Form states
  const [namaAkun, setNamaAkun] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [jobRole, setJobRole] = useState('SCMT-TA WITEL INV DRAFTER');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Load user data for edit mode
  useEffect(() => {
    if (isEditMode && editUserId && mounted) {
      loadUserForEdit(parseInt(editUserId));
    }
  }, [isEditMode, editUserId, mounted]);

  const loadUserForEdit = async (userId: number) => {
    try {
      setLoadingUserData(true);
      const result = await UserService.getUserByUserId(userId);
      if (result.success && 'data' in result && result.data) {
        const userData = result.data;
        setNamaAkun(userData.nama_akun);
        setEmail(userData.email || '');
        setWarehouse(userData.warehouse);
        setJobRole(userData.job_role || 'SCMT-TA WITEL INV DRAFTER');
        // Don't pre-fill passwords for security
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data user untuk diedit' });
      }
    } catch (error: any) {
      console.error('Error loading user for edit:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat data user' });
    } finally {
      setLoadingUserData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!namaAkun.trim() || !email.trim() || !warehouse) {
      setMessage({ type: 'error', text: 'Nama akun, email, dan warehouse harus diisi!' });
      return;
    }

    // Validasi password hanya untuk mode create atau jika password diisi untuk edit
    if (!isEditMode || (isEditMode && password.trim())) {
      if (!password.trim() || !confirmPassword.trim()) {
        setMessage({ type: 'error', text: 'Password dan konfirmasi password harus diisi!' });
        return;
      }
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Format email tidak valid!' });
      return;
    }

    // Validasi password minimal 6 karakter (hanya jika password diisi)
    if (password.trim() && password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter!' });
      return;
    }

    // Validasi konfirmasi password (hanya jika password diisi)
    if (password.trim() && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      let result;
      
      if (isEditMode && editUserId) {
        // Update user
        const updateData: any = {
          email: email,
          nama_akun: namaAkun.trim(),
          warehouse: warehouse,
          job_role: jobRole
        };
        
        result = await UserService.updateUserProfile(parseInt(editUserId), updateData);
        
        // Update password separately if provided
        if (password.trim()) {
          const passwordResult = await UserService.updateUserPassword(parseInt(editUserId), password);
          if (!passwordResult.success) {
            setMessage({ type: 'error', text: 'Data berhasil diupdate tapi gagal mengubah password' });
            return;
          }
        }
        
        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: `Data user "${namaAkun.trim()}" berhasil diupdate!` 
          });
        }
      } else {
        // Create new user - generate username from email
        const generatedUsername = email.split('@')[0].toLowerCase();
        result = await addUser({
          email: email,
          username: generatedUsername,
          password: password,
          namaAkun: namaAkun.trim(),
          warehouse: warehouse,
          role: 'user',
          jobRole: jobRole
        });
        
        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: `Akun user "${namaAkun.trim()}" berhasil dibuat! User dapat login dengan email: ${email}` 
          });
          
          // Reset form for create mode
          setNamaAkun('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setWarehouse('');
          setJobRole('SCMT-TA WITEL INV DRAFTER');
        }
      }

      if (result.success) {
        // Redirect ke pengaturan setelah 3 detik
        setTimeout(() => {
          router.push('/admin/pengaturan');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.error || `Terjadi kesalahan saat ${isEditMode ? 'mengupdate' : 'membuat'} akun!` });
      }
      
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} user:`, error);
      setMessage({ type: 'error', text: error.message || `Terjadi kesalahan saat ${isEditMode ? 'mengupdate' : 'membuat'} akun!` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jika bukan admin, jangan tampilkan halaman
  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/pengaturan')}
              className="h-11 w-11 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 grid place-items-center shadow-sm transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
            <div className={`h-11 w-11 rounded text-white grid place-items-center shadow-sm ${
              isEditMode ? 'bg-blue-500' : 'bg-green-500'
            }`}>
              {isEditMode ? <Edit size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit User' : 'Buat Akun User Baru'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditMode ? 'Edit data user yang sudah ada' : 'Buat akun user baru untuk Data RouterTrack'}
              </p>
            </div>
          </div>
          {/* Logout moved to Topbar */}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Loading state for edit mode */}
            {loadingUserData ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data user...</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Message Alert */}
              {message && (
                <div className={`flex items-center gap-2 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* Grid untuk form fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nama Akun */}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-black"
                    disabled={isSubmitting}
                  />
                </div>


                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="Masukkan email untuk login"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-black"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Warehouse */}
                <div>
                  <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-2">
                    Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="warehouse"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white text-black"
                    disabled={isSubmitting}
                  >
                    <option value="">Pilih Warehouse</option>
                    {WAREHOUSE_LIST.map((wh, index) => (
                      <option key={index} value={wh}>{wh}</option>
                    ))}
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="jobRole"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-black"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password {!isEditMode && <span className="text-red-500">*</span>}
                    {isEditMode && <span className="text-sm text-gray-500">(kosongkan jika tidak ingin mengubah)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isEditMode ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password (min. 6 karakter)"}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-black"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isEditMode ? "Ulangi password baru (jika mengubah)" : "Ulangi password"}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-black"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/admin/pengaturan')}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEditMode ? 'Mengupdate...' : 'Membuat Akun...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {isEditMode ? 'Update User' : 'Buat Akun'}
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Informasi Penting</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {isEditMode ? (
                  <>
                    <li>• Kosongkan field password jika tidak ingin mengubah password</li>
                    <li>• Email akan digunakan untuk login</li>
                    <li>• Perubahan data akan langsung tersimpan di database</li>
                  </>
                ) : (
                  <>
                    <li>• User akan login menggunakan email dan password</li>
                    <li>• Password minimal 6 karakter untuk keamanan</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
