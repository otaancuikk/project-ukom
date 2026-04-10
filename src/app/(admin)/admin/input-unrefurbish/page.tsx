'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Search, Edit } from 'lucide-react';
import { ONTService } from '@/services/ontService';

// Interface untuk data ONT dari database
interface ONTData {
  id: number;
  serial_number: string;
  item_code: string;
  item_description?: string;
  owner: string;
  location_code: string;
  location_description?: string;
  jenis: string;
  merk: string;
  type: string;
  lokasi_asal: string;
  lokasi_refurbish: string;
  kategori: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Interface untuk hasil pencarian dengan status unrefurbish
interface SearchResultData {
  id: number;
  serialNumber: string;
  itemCode: string;
  owner: string;
  locationCode: string;
  inventoryStatus: string;
  conditionStatus: string;
  jenis: string;
  merkType: string;
  lokasiAsal: string;
  lokasiRefurbish: string;
  kategori: string;
  status: string;
  tanggal: string;
}

export default function AdminInputUnrefurbishPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState('SERIAL_NUMBER');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
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
      // Cari data ONT dari database menggunakan ONTService
      const searchResult = await ONTService.searchONT(searchType, searchValue);
      
      if (!searchResult.success || !('data' in searchResult) || !searchResult.data) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const foundData: ONTData[] = searchResult.data;

      // Cek status unrefurbish dari localStorage
      const unrefurbishDataString = localStorage.getItem('unrefurbishData');
      let unrefurbishList = [];
      if (unrefurbishDataString) {
        unrefurbishList = JSON.parse(unrefurbishDataString);
      }

      // Transform data dari database ke format yang dibutuhkan UI
      const resultsWithStatus: SearchResultData[] = foundData.map((ont) => {
        const unrefurbishData = unrefurbishList.find((item: any) => item.serialNumber === ont.serial_number);
        const isUnrefurbished = !!unrefurbishData;

        return {
          id: ont.id,
          serialNumber: ont.serial_number,
          itemCode: ont.item_code,
          owner: ont.owner,
          locationCode: ont.location_code || 'Unknown',
          inventoryStatus: String((ont as any).inventory_status || '').toUpperCase() || 'AVAILABLE',
          conditionStatus: isUnrefurbished
            ? 'UNREFURBISH'
            : String((ont as any).condition_status || '').toUpperCase() || 'NORMAL',
          jenis: 'ONT', // Default jenis
          merkType: ont.item_description || 'Unknown', // Use item_description as merkType
          lokasiAsal: ont.location_description || 'Unknown', // Use location_description as lokasi asal
          lokasiRefurbish: ont.location_description || 'Unknown', // Same for refurbish location
          kategori: 'Refurbish', // Default kategori
          status: isUnrefurbished ? 'Unrefurbished' : 'Stock',
          tanggal: new Date(ont.created_at).toLocaleDateString('id-ID')
        };
      });

      setSearchResults(resultsWithStatus);

    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fungsi untuk handle aksi edit (admin bisa edit semua)
  const handleEdit = (serialNumber: string) => {
    // Redirect ke halaman detail admin unrefurbish dengan serial number
    router.push(`/admin/input-unrefurbish/detail?serial=${encodeURIComponent(serialNumber)}`);
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
                placeholder="Masukkan nilai pencarian..."
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
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
                        <tr key={`ont-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.tanggal}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.serialNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.jenis}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.merkType}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.lokasiAsal}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.lokasiRefurbish}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.owner}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.inventoryStatus === 'AVAILABLE'
                                ? 'bg-green-100 text-green-800'
                                : item.inventoryStatus === 'UNAVAILABLE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.inventoryStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.conditionStatus === 'NORMAL'
                                ? 'bg-green-100 text-green-800'
                                : item.conditionStatus === 'UNREFURBISH'
                                ? 'bg-red-100 text-red-800'
                                : item.conditionStatus === 'DAMAGED'
                                ? 'bg-red-100 text-red-800'
                                : item.conditionStatus === 'REPAIR'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.conditionStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleEdit(item.serialNumber)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                            >
                              <Edit size={12} />
                              {item.status === 'Unrefurbished' ? 'Edit' : 'Input'}
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
