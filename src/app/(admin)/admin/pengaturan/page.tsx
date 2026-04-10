'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/userService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Settings, Plus, Edit, Trash2, AlertCircle, CheckCircle, RefreshCw, UserCircle, Shield, MapPin, Calendar } from 'lucide-react';

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

interface UserData {
  id: number;
  nama_akun: string;
  username: string;
  role: 'admin' | 'user';
  job_role?: string;
  warehouse: string;
  status: 'active' | 'inactive';
  created_at: string;
  created_by: string;
}

export default function PengaturanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Load data user dari database
  useEffect(() => {
    loadUserData();
  }, [refreshKey]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const result = await UserService.getAllUsers();
      if (result.success && 'data' in result) {
        setUserData(result.data || []);
      } else {
        console.error('Error loading user data:', 'error' in result ? result.error : 'Unknown error');
        setUserData([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk refresh data
  const refreshUserData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fungsi untuk menghapus user
  const handleDeleteUser = async (userId: number, username: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) {
      try {
        const result = await UserService.deleteUserProfile(userId);
        if (result.success) {
          refreshUserData();
          alert(`User "${username}" berhasil dihapus!`);
        } else {
          const errorMsg = 'error' in result ? result.error : 'Gagal menghapus user';
          alert(`Error: ${errorMsg}`);
        }
      } catch (error: any) {
        console.error('Error deleting user:', error);
        alert(`Error: ${error.message || 'Terjadi kesalahan saat menghapus user'}`);
      }
    }
  };

  // Fungsi untuk toggle status user
  const handleToggleStatus = async (userId: number, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const result = await UserService.updateUserStatus(userId, newStatus);
      if (result.success) {
        refreshUserData();
        alert(`Status user berhasil diubah menjadi ${newStatus}!`);
      } else {
        const errorMsg = 'error' in result ? result.error : 'Gagal mengubah status user';
        alert(`Error: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert(`Error: ${error.message || 'Terjadi kesalahan saat mengubah status'}`);
    }
  };

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
            <div className="h-11 w-11 rounded bg-purple-500 text-white grid place-items-center shadow-sm">
              <Settings size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Pengaturan User</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/buat-akun')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Buat Akun Baru
            </button>
            {/* Logout moved to Topbar */}
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data user...</p>
            </div>
          ) : userData.length === 0 ? (
            <div className="p-8 text-center">
              <UserCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Belum Ada User</h2>
              <p className="text-gray-500 mb-4">
                Belum ada user yang terdaftar dalam sistem.
              </p>
              <button
                onClick={() => router.push('/admin/buat-akun')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                Buat Akun Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userData.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserCircle className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.nama_akun}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.role === 'admin' ? (
                            <Shield className="h-4 w-4 text-red-500 mr-2" />
                          ) : (
                            <UserCircle className="h-4 w-4 text-blue-500 mr-2" />
                          )}
                          <span className={`text-sm font-medium ${
                            user.role === 'admin' ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {user.role === 'admin' ? 'Administrator' : (user.job_role || 'SCMT-TA WITEL INV DRAFTER')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          {user.warehouse}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(user.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/buat-akun?edit=${user.id}`)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={refreshUserData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={18} />
            Refresh Data
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
