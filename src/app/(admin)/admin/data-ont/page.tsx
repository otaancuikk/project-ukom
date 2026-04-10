'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ONTService } from '@/services/ontService';
import { UnrefurbishService } from '@/services/unrefurbishService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { List, Plus, Edit, Trash2 } from 'lucide-react';

export default function DataONTPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [ontData, setOntData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

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

  // Load data ONT dari database
  useEffect(() => {
    loadONTData();
  }, []);

  const loadONTData = async () => {
    try {
      const result = await ONTService.getAllONT();
      if (result.success && 'data' in result) {
        const rawData = result.data || [];
        const withUnrefurbishStatus = await Promise.all(
          rawData.map(async (item: any) => {
            const check = await UnrefurbishService.checkUnrefurbishStatus(item.serial_number);
            const isUnrefurbished = !!(check as any)?.data?.isUnrefurbished;
            return {
              ...item,
              __isUnrefurbished: isUnrefurbished,
            };
          })
        );
        setOntData(withUnrefurbishStatus);
      } else {
        console.error('Error loading ONT data:', 'error' in result ? result.error : 'Unknown error');
        setOntData([]);
      }
    } catch (error) {
      console.error('Error loading ONT data:', error);
      setOntData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menghapus data ONT
  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ONT ini?')) {
      try {
        const result = await ONTService.deleteONT(id);
        if (result.success) {
          // Reload data setelah berhasil hapus
          await loadONTData();
          alert('Data ONT berhasil dihapus!');
        } else {
          const errorMsg = 'error' in result ? result.error : 'Gagal menghapus data';
          alert(`Error: ${errorMsg}`);
        }
      } catch (error: any) {
        console.error('Error deleting ONT:', error);
        alert(`Error: ${error.message || 'Terjadi kesalahan saat menghapus data'}`);
      }
    }
  };

  // Fungsi untuk edit data ONT (redirect ke halaman edit)
  const handleEdit = (id: number) => {
    // Redirect ke halaman admin dengan parameter edit
    router.push(`/admin?edit=${id}`);
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
            <div className="h-11 w-11 rounded bg-blue-500 text-white grid place-items-center shadow-sm">
              <List size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Data ONT Terdaftar</h1>
            </div>
          </div>
          {/* Logout moved to Topbar */}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : ontData.length === 0 ? (
            <div className="p-8 text-center">
              <List className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Belum Ada Data ONT</h2>
              <p className="text-gray-500">
                Belum ada data ONT yang terdaftar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ontData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.serial_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.location_description || item.location_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (String(item.inventory_status || '').toUpperCase() || 'AVAILABLE') === 'AVAILABLE' 
                            ? 'bg-green-100 text-green-800' 
                            : (String(item.inventory_status || '').toUpperCase() || 'AVAILABLE') === 'UNAVAILABLE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {String(item.inventory_status || '').toUpperCase() || 'AVAILABLE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const conditionStatus = item.__isUnrefurbished
                            ? 'UNREFURBISH'
                            : String(item.condition_status || '').toUpperCase() || 'NORMAL';

                          return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          conditionStatus === 'NORMAL'
                            ? 'bg-green-100 text-green-800'
                            : conditionStatus === 'UNREFURBISH'
                            ? 'bg-red-100 text-red-800'
                            : conditionStatus === 'DAMAGED'
                            ? 'bg-red-100 text-red-800'
                            : conditionStatus === 'REPAIR'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {conditionStatus}
                        </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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
      </div>
    </ProtectedRoute>
  );
}
