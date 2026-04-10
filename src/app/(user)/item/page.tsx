'use client';

import { FileText, Search, User, UserCircle, Building2, Shield, AlertCircle } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { ONTService } from "@/services/ontService";
import { UnrefurbishService } from "@/services/unrefurbishService";
import { useState, useEffect } from "react";

interface ONTData {
  id: number;
  serial_number: string;
  item_code: string;
  item_description: string;
  owner: string;
  purchase_reference?: string;
  supplier: string;
  location_type: string;
  location_code: string;
  location_description: string;
  inventory_status: string;
  condition_status: string;
  created_at: string;
  created_by: string;
}

export default function ItemPage() {
  const { user } = useAuth();
  const [searchType, setSearchType] = useState('SERIAL_NUMBER');
  const [searchValue, setSearchValue] = useState('');
  const [foundONT, setFoundONT] = useState<ONTData | null>(null);
  const [searchMessage, setSearchMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fungsi untuk mencari data ONT
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setSearchMessage({ type: 'error', text: 'Masukkan nilai pencarian!' });
      return;
    }

    setIsSearching(true);
    setSearchMessage(null);
    setFoundONT(null);

    try {
      // Cari data ONT di database MySQL
      const result = await ONTService.searchONT(searchType, searchValue);
      
      if (!result.success) {
        const errorMsg = ('error' in result ? result.error : undefined) || 'Terjadi kesalahan saat mencari data';
        setSearchMessage({ type: 'error', text: errorMsg });
        return;
      }

      if (result.data && result.data.length > 0) {
        // Ambil data pertama jika ada multiple results
        const foundData = result.data[0];

        const unrefurbishCheck = await UnrefurbishService.checkUnrefurbishStatus(foundData.serial_number);
        const isUnrefurbished = !!(unrefurbishCheck as any)?.data?.isUnrefurbished;
        if (isUnrefurbished) {
          foundData.condition_status = 'UNREFURBISH';
        }

        setFoundONT(foundData);
        setSearchMessage({ type: 'success', text: 'Data ONT ditemukan!' });
      } else {
        setSearchMessage({ type: 'error', text: `Data ONT dengan ${searchType.toLowerCase().replace('_', ' ')} "${searchValue}" tidak ditemukan.` });
      }

    } catch (error: any) {
      console.error('Error searching ONT:', error);
      setSearchMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat mencari data!' });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded bg-red-500 text-white grid place-items-center shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Item</h1>
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
              onKeyPress={handleKeyPress}
              disabled={isSearching}
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
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Cari</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Message */}
        {searchMessage && (
          <div className={`flex items-center gap-2 p-3 mt-4 rounded-lg text-sm ${
            searchMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : searchMessage.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <AlertCircle size={16} />
            <span>{searchMessage.text}</span>
          </div>
        )}
      </div>

      {/* Detail Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {foundONT ? (
          <>
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detail ONT</h3>
              <p className="text-sm text-gray-500">Serial Number: {foundONT.serial_number}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
              {[
                ["Serial Number", foundONT.serial_number],
                ["Item Code", foundONT.item_code],
                ["Item Description", foundONT.item_description],
                ["Owner", foundONT.owner],
                ["Supplier", foundONT.supplier],
                ["Location Type", foundONT.location_type],
                ["Location Code", foundONT.location_code],
                ["Location Description", foundONT.location_description],
                ["Inventory Status", foundONT.inventory_status || 'AVAILABLE'],
                ["Condition Status", foundONT.condition_status],
              ].map(([label, value], i) => (
                <div key={i} className="space-y-1.5">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</div>
                  <div className="h-px bg-gray-200" />
                  <div className="text-sm text-gray-800 min-h-[20px]">{value || "-"}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-3">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data</h3>
            <p className="text-gray-500">Silakan lakukan pencarian untuk menampilkan detail ONT</p>
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}
