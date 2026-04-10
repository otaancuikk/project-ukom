'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Settings, Plus, Edit, Trash2, AlertCircle, CheckCircle, RefreshCw, UserCircle, Shield, MapPin, Calendar, X, Save } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

// Komponen untuk menampilkan daftar user
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

function UserList({ refreshKey }: { refreshKey?: number }) {
  const [userData, setUserData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    namaAkun: '',
    username: '',
    warehouse: '',
    role: 'user'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data user dari localStorage
  useEffect(() => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      // Data user default
      const defaultUsers = [
        {
          id: 1,
          namaAkun: 'Administrator System',
          username: 'admin',
          role: 'admin',
          warehouse: 'Admin Warehouse',
          status: 'active',
          createdAt: '2024-11-01T08:00:00Z',
          createdBy: 'system'
        },
        {
          id: 2,
          namaAkun: 'User Demo',
          username: 'user1',
          role: 'user',
          warehouse: 'Demo Warehouse',
          status: 'active',
          createdAt: '2024-11-05T10:30:00Z',
          createdBy: 'system'
        }
      ];

      // Ambil user yang dibuat dari localStorage
      const createdUsersString = localStorage.getItem('createdUsers');
      let createdUsers: any[] = [];
      
      if (createdUsersString) {
        createdUsers = JSON.parse(createdUsersString).map((user: any, index: number) => ({
          id: defaultUsers.length + index + 1,
          namaAkun: user.namaAkun,
          username: user.username,
          role: user.role,
          warehouse: user.warehouse,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        }));
      }

      // Gabungkan user default dengan user yang dibuat
      const allUsers = [...defaultUsers, ...createdUsers];
      setUserData(allUsers);
      setLoading(false);
    }
  }, [refreshKey]);

  // Fungsi untuk menghapus user
  const handleDeleteUser = (userId: number, username: string) => {
    // Tidak bisa menghapus user default (admin dan user1)
    if (userId <= 2) {
      alert('User default tidak dapat dihapus!');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) {
      if (typeof window !== 'undefined') {
        const createdUsersString = localStorage.getItem('createdUsers');
        if (createdUsersString) {
          let createdUsers = JSON.parse(createdUsersString);
          // Hapus user berdasarkan username
          createdUsers = createdUsers.filter((user: any) => user.username !== username);
          localStorage.setItem('createdUsers', JSON.stringify(createdUsers));
          
          // Refresh data setelah hapus
          refreshUserData();
          alert(`User "${username}" berhasil dihapus!`);
        }
      }
    }
  };

  // Fungsi untuk edit user
  const handleEditUser = (userId: number, username: string) => {
    // Tidak bisa edit user default
    if (userId <= 2) {
      alert('User default tidak dapat diedit!');
      return;
    }
    
    // Cari user yang akan diedit
    const userToEdit = userData.find(user => user.id === userId);
    if (userToEdit) {
      // Simpan data user yang akan diedit ke localStorage untuk diambil di halaman buat-akun
      if (typeof window !== 'undefined') {
        localStorage.setItem('editUserData', JSON.stringify({
          originalUsername: userToEdit.username,
          namaAkun: userToEdit.namaAkun,
          username: userToEdit.username,
          warehouse: userToEdit.warehouse,
          role: userToEdit.role,
          isEdit: true
        }));
      }
      
      // Redirect ke halaman buat-akun
      window.location.href = '/admin/buat-akun';
    }
  };

  // Fungsi untuk menyimpan perubahan edit user
  const handleSaveEdit = async () => {
    if (!editForm.namaAkun.trim() || !editForm.username.trim() || !editForm.warehouse) {
      alert('Semua field harus diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (typeof window !== 'undefined') {
        const createdUsersString = localStorage.getItem('createdUsers');
        if (createdUsersString) {
          let createdUsers = JSON.parse(createdUsersString);
          
          // Update user berdasarkan username lama
          const userIndex = createdUsers.findIndex((user: any) => user.username === editingUser.username);
          if (userIndex !== -1) {
            createdUsers[userIndex] = {
              ...createdUsers[userIndex],
              namaAkun: editForm.namaAkun.trim(),
              username: editForm.username.trim().toLowerCase(),
              warehouse: editForm.warehouse,
              role: editForm.role
            };
            
            localStorage.setItem('createdUsers', JSON.stringify(createdUsers));
            
            // Refresh data setelah edit
            refreshUserData();
            setEditingUser(null);
            alert(`User "${editForm.username}" berhasil diperbarui!`);
          }
        }
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan perubahan!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk membatalkan edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      namaAkun: '',
      username: '',
      warehouse: '',
      role: 'user'
    });
  };

  // Fungsi untuk refresh data user
  const refreshUserData = () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      const defaultUsers = [
        {
          id: 1,
          namaAkun: 'Administrator System',
          username: 'admin',
          role: 'admin',
          warehouse: 'Admin Warehouse',
          status: 'active',
          createdAt: '2024-11-01T08:00:00Z',
          createdBy: 'system'
        },
        {
          id: 2,
          namaAkun: 'User Demo',
          username: 'user1',
          role: 'user',
          warehouse: 'Demo Warehouse',
          status: 'active',
          createdAt: '2024-11-05T10:30:00Z',
          createdBy: 'system'
        }
      ];

      const createdUsersString = localStorage.getItem('createdUsers');
      let createdUsers: any[] = [];
      
      if (createdUsersString) {
        createdUsers = JSON.parse(createdUsersString).map((user: any, index: number) => ({
          id: defaultUsers.length + index + 1,
          namaAkun: user.namaAkun,
          username: user.username,
          role: user.role,
          warehouse: user.warehouse,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        }));
      }

      const allUsers = [...defaultUsers, ...createdUsers];
      setUserData(allUsers);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'supervisor': return 'bg-blue-100 text-blue-700';
      case 'user': return 'bg-green-100 text-green-700';
      case 'operator': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'supervisor': return 'Supervisor';
      case 'user': return 'User';
      case 'operator': return 'Operator';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data user...</p>
      </div>
    );
  }

  if (userData.length === 0) {
    return (
      <div className="text-center py-8">
        <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada user yang terdaftar</p>
      </div>
    );
  }

  return (
    <>
      {/* Modal Edit User */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Nama Akun */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Akun <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.namaAkun}
                  onChange={(e) => setEditForm({ ...editForm, namaAkun: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  disabled={isSubmitting}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  disabled={isSubmitting}
                />
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.warehouse}
                  onChange={(e) => setEditForm({ ...editForm, warehouse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-black"
                  disabled={isSubmitting}
                >
                  <option value="">Pilih warehouse...</option>
                  {WAREHOUSE_LIST.map((warehouse, index) => (
                    <option key={index} value={warehouse}>
                      {warehouse}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={editForm.role}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
      {userData.map((userItem) => (
        <div key={userItem.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <UserCircle className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">{userItem.namaAkun}</h3>
                  <p className="text-sm text-gray-600">@{userItem.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(userItem.role)}`}>
                    {getRoleLabel(userItem.role)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">{userItem.warehouse}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Dibuat: {formatDate(userItem.createdAt)} oleh {userItem.createdBy}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleEditUser(userItem.id, userItem.username)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
              >
                <Edit size={12} />
                Edit
              </button>
              <button 
                onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                <Trash2 size={12} />
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Total: {userData.length} user terdaftar
        </p>
      </div>
    </div>
    </>
  );
}

export default function PengaturanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Pastikan komponen sudah mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fungsi untuk trigger refresh dari parent component
  const handleRefreshUsers = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

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
            <div className="h-11 w-11 rounded bg-purple-500 text-white grid place-items-center shadow-sm">
              <Settings size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Pengaturan</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </div>

        {/* Content Area - Daftar User */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header Section */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Manajemen User</h2>
            <p className="text-sm text-gray-500 mt-1">Daftar semua user yang terdaftar dalam sistem</p>
          </div>

          {/* User List Section */}
          <div className="p-6">
            <UserList refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
