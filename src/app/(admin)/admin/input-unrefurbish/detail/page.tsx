'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, ArrowLeft, Check, Search, Upload, X } from 'lucide-react';
import { ONTService } from '@/services/ontService';

// Interface untuk data ONT dari database
interface ONTDataDB {
  id: number;
  serial_number: string;
  item_code: string;
  item_description: string;
  owner: string;
  location_code: string;
  location_description: string;
  inventory_status?: string;
  condition_status?: string;
  created_at: string;
}

// Interface untuk data ONT yang ditampilkan di UI
interface ONTData {
  id: string;
  serialNumber: string;
  itemCode: string;
  itemDescription: string;
  owner: string;
  inventoryStatus: string;
  jenis: string;
  merkType: string;
  kategori: string;
}

// Interface untuk tes visual
interface TesVisualItem {
  id: number;
  name: string;
  status: 'ok' | 'nok' | null;
  keterangan: string;
}

export default function AdminInputUnrefurbishDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [ontData, setOntData] = useState<ONTData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnrefurbished, setIsUnrefurbished] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);

  // Data tes visual
  const [tesVisualData, setTesVisualData] = useState<TesVisualItem[]>([
    { id: 1, name: 'Main Unit', status: 'ok', keterangan: '' },
    { id: 2, name: 'Antena', status: 'ok', keterangan: '' },
    { id: 3, name: 'Tombol Power', status: 'ok', keterangan: '' },
    { id: 4, name: 'Tampilan SN', status: 'ok', keterangan: '' },
    { id: 5, name: 'Nama Pabrikan', status: 'ok', keterangan: '' },
    { id: 6, name: 'Merk', status: 'ok', keterangan: '' },
    { id: 7, name: 'Type', status: 'ok', keterangan: '' },
    { id: 8, name: 'PON SN', status: 'ok', keterangan: '' },
  ]);

  // Pastikan komponen sudah mounted
  useEffect(() => {
    setMounted(true);
    const serial = searchParams.get('serial');
    if (serial) {
      setSerialNumber(serial);
      loadONTData(serial);
    }
  }, [searchParams]);

  // Load data ONT berdasarkan serial number dari database
  const loadONTData = async (serial: string) => {
    try {
      setIsLoading(true);
      
      // Load data ONT dari database
      const ontResult = await ONTService.getONTBySerialNumber(serial);
      if (ontResult.success && 'data' in ontResult && ontResult.data) {
        const dbData: ONTDataDB = ontResult.data;
        
        // Transform data dari database ke format UI
        const transformedData: ONTData = {
          id: dbData.id.toString(),
          serialNumber: dbData.serial_number,
          itemCode: dbData.item_code,
          itemDescription: dbData.item_description || 'Unknown',
          owner: dbData.owner,
          inventoryStatus: String(dbData.inventory_status || '').toUpperCase() || 'AVAILABLE',
          jenis: 'ONT',
          merkType: dbData.item_description || 'Unknown',
          kategori: 'Refurbish'
        };
        
        setOntData(transformedData);
      } else {
        setOntData(null);
      }

      // Cek status unrefurbish dari localStorage
      if (typeof window !== 'undefined') {
        const unrefurbishDataString = localStorage.getItem('unrefurbishData');
        if (unrefurbishDataString) {
          const unrefurbishList = JSON.parse(unrefurbishDataString);
          const unrefurbishData = unrefurbishList.find((item: any) => item.serialNumber === serial);
          if (unrefurbishData) {
            setIsUnrefurbished(true);
            setTesVisualData(unrefurbishData.tesVisual || tesVisualData);
            // Load saved photos dari localStorage
            setSavedPhotos(unrefurbishData.photos || []);
            setUploadedPhotos([]); // Reset karena File objects tidak bisa disimpan di localStorage
          }
        }
      }
    } catch (error) {
      console.error('Error loading ONT data:', error);
      setOntData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk kembali ke halaman sebelumnya
  const handleBack = () => {
    router.back();
  };

  // Fungsi untuk update status tes visual
  const updateTesVisual = (id: number, field: 'status' | 'keterangan', value: any) => {
    setTesVisualData(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Fungsi untuk handle upload foto
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  // Fungsi untuk hapus foto
  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Fungsi untuk hapus saved photo
  const removeSavedPhoto = (index: number) => {
    setSavedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Fungsi untuk mengkonversi file ke base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Fungsi untuk menyimpan data unrefurbish
  const handleSelesai = async () => {
    if (typeof window !== 'undefined') {
      try {
        // Konversi semua foto baru ke base64
        const photoPromises = uploadedPhotos.map(photo => fileToBase64(photo));
        const newPhotosBase64 = await Promise.all(photoPromises);
        
        // Gabungkan foto lama dan baru
        const allPhotos = [...savedPhotos, ...newPhotosBase64];

        // Simpan data unrefurbish ke localStorage
        const unrefurbishDataString = localStorage.getItem('unrefurbishData') || '[]';
        const unrefurbishList = JSON.parse(unrefurbishDataString);
        
        // Cek apakah data sudah ada
        const existingIndex = unrefurbishList.findIndex((item: any) => item.serialNumber === serialNumber);
        
        const unrefurbishData = {
          serialNumber: serialNumber,
          tesVisual: tesVisualData,
          photos: allPhotos,
          photoCount: allPhotos.length,
          completedAt: new Date().toISOString(),
          status: 'Unrefurbished'
        };

        if (existingIndex >= 0) {
          // Update data yang sudah ada
          unrefurbishList[existingIndex] = unrefurbishData;
        } else {
          // Tambah data baru
          unrefurbishList.push(unrefurbishData);
        }

        localStorage.setItem('unrefurbishData', JSON.stringify(unrefurbishList));

        try {
          console.log('[AdminInputUnrefurbishDetailPage] updating ONT condition_status payload:', {
            serialNumber,
            condition_status: 'UNREFURBISH'
          });
          const updateResult = await ONTService.updateONTBySerialNumber(serialNumber, { condition_status: 'UNREFURBISH' });
          console.log('[AdminInputUnrefurbishDetailPage] updateONTBySerialNumber response:', updateResult);
          if (updateResult && 'success' in (updateResult as any) && (updateResult as any).success === false) {
            console.error('Failed updating ONT condition_status:', updateResult);
            alert('Data unrefurbish tersimpan, tapi gagal mengubah Condition Status ONT ke UNREFURBISH');
          }
        } catch (e) {
          console.error('Error updating ONT condition_status:', e);
          alert('Data unrefurbish tersimpan, tapi terjadi error saat update Condition Status ONT');
        }
        
        alert('Data berhasil disimpan!');
        handleBack();
      } catch (error) {
        console.error('Error saving photos:', error);
        alert('Terjadi kesalahan saat menyimpan foto!');
      }
    }
  };

  // Fungsi untuk enable edit mode (khusus admin)
  const handleEnableEdit = () => {
    setIsUnrefurbished(false);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="h-11 w-11 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 grid place-items-center shadow-sm transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="h-11 w-11 rounded bg-red-500 text-white grid place-items-center shadow-sm">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin - Detail Input Unrefurbish</h1>
              <p className="text-sm text-gray-500">
                Serial Number: {serialNumber}
              </p>
            </div>
          </div>
          {/* Logout moved to Topbar */}
        </div>

        {/* Data ONT Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Header dengan Status */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Data NTEI</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-sm font-semibold rounded bg-green-100 text-green-800">
                {ontData?.inventoryStatus || 'AVAILABLE'}
              </span>
              {isUnrefurbished && (
                <button
                  onClick={handleEnableEdit}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  Enable Edit
                </button>
              )}
            </div>
          </div>

          {/* Form Data ONT */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Memuat data ONT...</p>
              </div>
            ) : ontData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ontData.serialNumber}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                    <div className="flex items-center gap-1">
                      <Check className="h-5 w-5 text-green-500" />
                      <Search className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Owner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                  <input
                    type="text"
                    value={ontData.owner}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                {/* Item Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Code</label>
                  <input
                    type="text"
                    value={ontData.itemCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                {/* Item Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Description</label>
                  <input
                    type="text"
                    value={ontData.itemDescription}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <input
                    type="text"
                    value="Refurbish"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Data ONT tidak ditemukan</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleBack}
                className="px-6 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Tes Visual Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Tes Visual</h2>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300">NO</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300">URAIAN TES</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300">OK</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300">NOK</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  {tesVisualData.map((item, index) => (
                    <tr key={item.id} className="border-t border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">{item.name}</td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <input
                          type="radio"
                          name={`status-${item.id}`}
                          checked={item.status === 'ok'}
                          onChange={() => updateTesVisual(item.id, 'status', 'ok')}
                          disabled={isUnrefurbished}
                          className="h-4 w-4 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <input
                          type="radio"
                          name={`status-${item.id}`}
                          checked={item.status === 'nok'}
                          onChange={() => updateTesVisual(item.id, 'status', 'nok')}
                          disabled={isUnrefurbished}
                          className="h-4 w-4 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={item.keterangan}
                          onChange={(e) => updateTesVisual(item.id, 'keterangan', e.target.value)}
                          disabled={isUnrefurbished}
                          className={`w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none text-gray-900 ${
                            isUnrefurbished ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                          }`}
                          rows={2}
                          placeholder="Keterangan..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upload Foto Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload Foto Kondisi ONT</h2>
            <p className="text-sm text-gray-500 mt-1">Upload foto untuk dokumentasi kondisi ONT</p>
          </div>

          <div className="p-6">
            {/* Upload Area */}
            {!isUnrefurbished && (
              <div className="mb-6">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG atau JPEG (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            )}

            {/* Message for admin edit mode */}
            {isUnrefurbished && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 text-center">
                  ℹ️ Mode Admin: Klik "Enable Edit" untuk mengedit data yang sudah selesai.
                </p>
              </div>
            )}

            {/* Uploaded Photos (for editing mode) */}
            {!isUnrefurbished && uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Foto Baru ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Foto Baru {index + 1}
                      </div>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium">{photo.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleDateString('id-ID')} - {new Date().toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Saved Photos */}
            {savedPhotos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedPhotos.map((photoBase64, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photoBase64}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Foto {index + 1}
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        ✓ Tersimpan
                      </div>
                      {!isUnrefurbished && (
                        <button
                          onClick={() => removeSavedPhoto(index)}
                          className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium">Foto {index + 1}</p>
                      <p className="text-xs text-gray-500">
                        Foto dokumentasi unrefurbish
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Demo Photos (jika belum ada upload dan belum ada saved photos) */}
            {uploadedPhotos.length === 0 && savedPhotos.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Foto 1</p>
                      <p className="text-xs">Belum ada foto</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">Foto 1</p>
                    <p className="text-xs text-gray-500">Klik upload untuk menambah foto</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Foto 2</p>
                      <p className="text-xs">Belum ada foto</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">Foto 2</p>
                    <p className="text-xs text-gray-500">Klik upload untuk menambah foto</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6 mb-8">
          <button
            onClick={handleBack}
            className="px-6 py-2 text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSelesai}
            className="px-8 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            Selesai
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
