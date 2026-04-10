'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ONTService } from '@/services/ontService';
import { UnrefurbishService } from '@/services/unrefurbishService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Search, Edit } from 'lucide-react';

// Interface untuk data ONT
interface ONTData {
  id: string;
  serial_number: string;
  item_code: string;
  owner: string;
  location_code: string;
  inventory_status: string;
  condition_status: string;
  jenis: string;
  merkType: string;
  lokasiAsal: string;
  lokasiRefurbish: string;
  kategori: string;
  status: string;
  tanggal: string;
}

export default function InputUnrefurbishPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState('SERIAL_NUMBER');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ONTData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Pastikan komponen sudah mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fungsi untuk mencari data ONT
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      alert('Masukkan nilai pencarian!');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Cari data ONT di database MySQL
      const result = await ONTService.searchONT(searchType, searchValue);
      
      if (!result.success) {
        const errorMsg = 'error' in result ? result.error : 'Terjadi kesalahan saat mencari data';
        alert(errorMsg);
        setSearchResults([]);
        return;
      }

      if (result.data && result.data.length > 0) {
        // Cek status unrefurbish untuk setiap ONT
        const resultsWithStatus = await Promise.all(
          result.data.map(async (ont: any) => {
            const unrefurbishCheck = await UnrefurbishService.checkUnrefurbishStatus(ont.serial_number);
            const isUnrefurbished = !!(unrefurbishCheck as any)?.data?.isUnrefurbished;

            return {
              id: ont.id.toString(),
              serial_number: ont.serial_number,
              item_code: ont.item_code,
              owner: ont.owner,
              location_code: ont.location_code || 'Unknown',
              inventory_status: String(ont.inventory_status || '').toUpperCase() || 'AVAILABLE',
              condition_status: isUnrefurbished
                ? 'UNREFURBISH'
                : String(ont.condition_status || '').toUpperCase() || 'NORMAL',
              tanggal: new Date(ont.created_at).toLocaleDateString('id-ID'),
              jenis: 'ONT',
              merkType: ont.item_description || 'Unknown',
              lokasiAsal: ont.location_description || 'Unknown',
              lokasiRefurbish: ont.location_description || 'Unknown',
              kategori: 'Refurbish',
              status: isUnrefurbished ? 'Unrefurbished' : 'Stock'
            };
          })
        );
        
        setSearchResults(resultsWithStatus);
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fungsi untuk handle aksi edit
  const handleEdit = (serialNumber: string) => {
    // Redirect ke halaman detail unrefurbish dengan serial number
    router.push(`/input-unrefurbish/detail?serial=${encodeURIComponent(serialNumber)}`);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded bg-red-500 text-white grid place-items-center shadow-sm">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Input Unrefurbish</h1>
            </div>
          </div>
          {/* Logout moved to Topbar */}
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex gap-3">
              {/* Fixed Search Type */}
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700">
                SERIAL_NUMBER
              </div>

              {/* Search Input */}
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Masukkan Serial Number..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Mencari...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Cari
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {searchResults.length > 0 ? (
              <>
                {/* Results Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Hasil Pencarian</h3>
                      <p className="text-sm text-gray-500">Showing 1 to {searchResults.length} of {searchResults.length} entries</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Search:</span>
                      <input
                        type="text"
                        value={searchValue}
                        readOnly
                        className="px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merk - Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi Asal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi Refurbish</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searchResults.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.tanggal}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.serial_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.jenis}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.merkType}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.lokasiAsal}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.lokasiRefurbish}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.owner}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.inventory_status === 'AVAILABLE'
                                ? 'bg-green-100 text-green-800'
                                : item.inventory_status === 'UNAVAILABLE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.inventory_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.condition_status === 'NORMAL'
                                ? 'bg-green-100 text-green-800'
                                : item.condition_status === 'UNREFURBISH'
                                ? 'bg-red-100 text-red-800'
                                : item.condition_status === 'DAMAGED'
                                ? 'bg-red-100 text-red-800'
                                : item.condition_status === 'REPAIR'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.condition_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleEdit(item.serial_number)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                            >
                              <Edit size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-sm bg-blue-500 text-white rounded">1</span>
                    </div>
                    <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
                <p className="text-gray-500">Tidak ditemukan data dengan kriteria pencarian tersebut</p>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-500">Silakan lakukan pencarian untuk menampilkan detail ONT</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
