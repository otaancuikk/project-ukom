'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Save, AlertCircle, Edit } from 'lucide-react';
import { ONTService } from '@/services/ontService';

// Daftar lokasi terdaftar
const LOKASI_TERDAFTAR = [
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

// Komponen Form untuk menambah/edit data ONT
function ONTForm({ editId }: { editId?: string }) {
  const { user } = useAuth();

  // Load data untuk edit mode
  useEffect(() => {
    if (editId) {
      setIsEditMode(true);
      loadONTData(parseInt(editId));
    }
  }, [editId]);

  const loadONTData = async (id: number) => {
    setIsLoading(true);
    try {
      const result = await ONTService.getONTById(id);
      if (result.success && result.data) {
        const data = result.data;
        setSerialNumber(data.serial_number || '');
        setItemCode(data.item_code || '');
        setItemDescription(data.item_description || '');
        setOwner(data.owner || 'TELKOM');
        // setPurchaseReference(data.purchase_reference || 'PO-T00000-20170714-00001');
        setSupplier(data.supplier || 'ZTE');
        setLocationType(data.location_type || 'WAREHOUSE');
        setLocationCode(data.location_code || '');
        setLocationDescription(data.location_description || '');
        setInventoryStatus((data.inventory_status || 'AVAILABLE').toUpperCase());
        setConditionStatus('NORMAL');
      } else {
        setMessage({ type: 'error', text: 'Data ONT tidak ditemukan' });
      }
    } catch (error: any) {
      console.error('Error loading ONT data:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data ONT' });
    } finally {
      setIsLoading(false);
    }
  };
  const [serialNumber, setSerialNumber] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [owner, setOwner] = useState('TELKOM');
  // const [purchaseReference, setPurchaseReference] = useState('PO-T00000-20170714-00001');
  const [supplier, setSupplier] = useState('ZTE');
  const [locationType, setLocationType] = useState('WAREHOUSE');
  const [locationCode, setLocationCode] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState('');
  const [conditionStatus, setConditionStatus] = useState('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!serialNumber.trim() || !itemCode.trim() || !itemDescription.trim() || !owner.trim()) {
      setMessage({ type: 'error', text: 'Field wajib harus diisi!' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      let result;
      
      if (isEditMode && editId) {
        // Update data ONT yang sudah ada
        result = await ONTService.updateONT(parseInt(editId), {
          item_code: itemCode.trim(),
          item_description: itemDescription.trim(),
          owner: owner.trim(),
          purchase_reference: 'PO-T00000-20170714-00001',
          supplier: supplier.trim(),
          location_type: locationType.trim(),
          location_code: locationCode.trim(),
          location_description: locationDescription.trim(),
          inventory_status: (inventoryStatus || 'AVAILABLE').toUpperCase(),
          condition_status: 'NORMAL'
        });
      } else {
        // Simpan data ONT baru ke database MySQL
        result = await ONTService.createONT({
          serial_number: serialNumber.trim(),
          item_code: itemCode.trim(),
          item_description: itemDescription.trim(),
          owner: owner.trim(),
          purchase_reference: 'PO-T00000-20170714-00001',
          supplier: supplier.trim(),
          location_type: locationType.trim(),
          location_code: locationCode.trim(),
          location_description: locationDescription.trim(),
          inventory_status: (inventoryStatus || 'AVAILABLE').toUpperCase(),
          condition_status: 'NORMAL',
          created_by: user?.username || 'admin'
        });
      }

      if (!result.success) {
        const errorMsg = ('error' in result ? result.error : undefined) || `Terjadi kesalahan saat ${isEditMode ? 'mengupdate' : 'menyimpan'} data`;
        setMessage({ type: 'error', text: errorMsg });
        return;
      }
      
      console.log(`Data ONT berhasil ${isEditMode ? 'diupdate' : 'disimpan'}:`, result.data);
      
      if (isEditMode) {
        setMessage({ type: 'success', text: 'Data ONT berhasil diupdate!' });
        // Redirect ke halaman data ONT setelah 2 detik
        setTimeout(() => {
          router.push('/admin/data-ont');
        }, 2000);
      } else {
        // Reset form untuk mode tambah
        setSerialNumber('');
        setItemCode('');
        setItemDescription('');
        setOwner('TELKOM');
        // setPurchaseReference('PO-T00000-20170714-00001');
        setSupplier('ZTE');
        setLocationType('WAREHOUSE');
        setLocationCode('');
        setLocationDescription('');
        setInventoryStatus('AVAILABLE');
        setConditionStatus('NORMAL');
        setMessage({ type: 'success', text: 'Data ONT berhasil ditambahkan ke database!' });
      }
      
    } catch (error: any) {
      console.error('Error saving ONT data:', error);
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan data!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data...</p>
      </div>
    );
  }

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

      {/* Grid untuk form fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serial Number Field */}
        <div>
          <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Serial Number ONT <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="serialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Masukkan serial number ONT"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-black"
            disabled={isSubmitting || isEditMode}
            readOnly={isEditMode}
          />
        </div>

        {/* Item Code Field */}
        <div>
          <label htmlFor="itemCode" className="block text-sm font-medium text-gray-700 mb-2">
            Item Code <span className="text-red-500">*</span>
          </label>
          <select
            id="itemCode"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white text-black"
            disabled={isSubmitting}
          >
            <option value="">Pilih Item Code...</option>
            <option value="5G0NTF600">5G0NTF600</option>
            <option value="5G0NTF660">5G0NTF660</option>
            <option value="5G0NTF670">5G0NTF670</option>
          </select>
        </div>

        {/* Item Description Field */}
        <div>
          <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Item Description <span className="text-red-500">*</span>
          </label>
          <select
            id="itemDescription"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white text-black"
            disabled={isSubmitting}
          >
            <option value="">Pilih item description...</option>
            <option value="ONT_ZTE-F600">ONT_ZTE-F600</option>
            <option value="ONT_ZTE-F660">ONT_ZTE-F660</option>
            <option value="ONT_ZTE-F670">ONT_ZTE-F670</option>
          </select>
        </div>

        {/* Owner Field */}
        <div>
          <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
            Owner <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="owner"
            value={owner}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-black cursor-not-allowed"
          />
        </div>

        {/* Supplier Field */}
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
            Supplier
          </label>
          <input
            type="text"
            id="supplier"
            value={supplier}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-black cursor-not-allowed"
          />
        </div>

        {/* Location Type Field */}
        <div>
          <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-2">
            Location Type
          </label>
          <input
            type="text"
            id="locationType"
            value={locationType}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-black cursor-not-allowed"
          />
        </div>

        {/* Location Code Field */}
        <div>
          <label htmlFor="locationCode" className="block text-sm font-medium text-gray-700 mb-2">
            Location Code
          </label>
          <select
            id="locationCode"
            value={locationCode}
            onChange={(e) => setLocationCode(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white text-black"
            disabled={isSubmitting}
          >
            <option value="">Pilih Location Code...</option>
            <option value="A6140">A6140</option>
            <option value="A6150">A6150</option>
            <option value="A6160">A6160</option>
          </select>
        </div>

        {/* Location Description Field */}
        <div>
          <label htmlFor="locationDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Location Description
          </label>
          <select
            id="locationDescription"
            value={locationDescription}
            onChange={(e) => setLocationDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white text-black"
            disabled={isSubmitting}
          >
            <option value="">Pilih location description...</option>
            {LOKASI_TERDAFTAR.map((lokasi, index) => (
              <option key={index} value={lokasi}>
                {lokasi}
              </option>
            ))}
          </select>
        </div>

        {/* Inventory Status Field */}
        <div>
          <label htmlFor="inventoryStatus" className="block text-sm font-medium text-gray-700 mb-2">
            Inventory Status
          </label>
          <select
            id="inventoryStatus"
            value={(inventoryStatus || 'AVAILABLE').toUpperCase()}
            onChange={(e) => setInventoryStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white text-black"
            disabled={isSubmitting}
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="UNAVAILABLE">UNAVAILABLE</option>
          </select>
        </div>

        {/* Condition Status Field */}
        <div>
          <label htmlFor="conditionStatus" className="block text-sm font-medium text-gray-700 mb-2">
            Condition Status
          </label>
          <input
            type="text"
            id="conditionStatus"
            value={conditionStatus}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-black cursor-not-allowed"
          />
        </div>

      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Menyimpan...
            </>
          ) : (
            <>
              {isEditMode ? <Edit size={18} /> : <Save size={18} />}
              {isEditMode ? 'Update Data ONT' : 'Simpan Data ONT'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}


export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // Get edit ID from URL params
  const editId = searchParams.get('edit');

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
      <div className="max-w-7xl mx-auto pb-40">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded bg-red-500 text-white grid place-items-center shadow-sm">
              <Plus size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Tambah Data Ont</h1>
            </div>
          </div>
        </div>

        {/* Content Area - Form Tambah Data ONT */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header Section */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">{editId ? 'Edit Data ONT' : ''}</h2>
            <p className="text-sm text-gray-500 mt-1">{editId ? 'Edit data ONT yang sudah ada' : 'Input data ONT baru ke dalam Data RouterTrack'}</p>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <ONTForm editId={editId || undefined} />
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
