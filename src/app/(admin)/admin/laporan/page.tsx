'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ONTService } from '@/services/ontService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, User, Calendar, Clock, FileText, Download, Filter, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ONTActivity {
  id: number;
  serial_number: string;
  item_code: string;
  item_description: string;
  owner: string;
  action: string;
  timestamp: string;
  date: string;
  time: string;
  day: string;
  adminUser: string;
  inventory_status: string;
}

export default function LaporanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activities, setActivities] = useState<ONTActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filteredActivities, setFilteredActivities] = useState<ONTActivity[]>([]);

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

  // Load activity data dari database
  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      const result = await ONTService.getAllONT();
      if (result.success && 'data' in result) {
        const ontList = result.data || [];
        const activityList: ONTActivity[] = ontList.map((ont: any) => {
          const createdDate = new Date(ont.created_at || Date.now());
          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          
          return {
            id: ont.id,
            serial_number: ont.serial_number,
            item_code: ont.item_code,
            item_description: ont.item_description,
            owner: ont.owner,
            action: 'Penambahan Data ONT',
            timestamp: ont.created_at || new Date().toISOString(),
            date: createdDate.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            }),
            time: createdDate.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            day: dayNames[createdDate.getDay()],
            adminUser: ont.created_by || 'admin',
            inventory_status: ont.inventory_status || 'AVAILABLE'
          };
        });
        
        // Urutkan berdasarkan timestamp terbaru
        activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(activityList);
        setFilteredActivities(activityList);
      } else {
        console.error('Error loading ONT data:', 'error' in result ? result.error : 'Unknown error');
        setActivities([]);
        setFilteredActivities([]);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const applyLastNDaysFilter = (days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const toDateInputValue = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setFilterStartDate(toDateInputValue(start));
    setFilterEndDate(toDateInputValue(end));
  };

  // Filter activities berdasarkan rentang tanggal
  useEffect(() => {
    if (!filterStartDate && !filterEndDate) {
      setFilteredActivities(activities);
    } else {
      const start = filterStartDate ? new Date(`${filterStartDate}T00:00:00`) : null;
      const end = filterEndDate ? new Date(`${filterEndDate}T23:59:59.999`) : null;

      const filtered = activities.filter((activity) => {
        const t = new Date(activity.timestamp).getTime();
        const okStart = start ? t >= start.getTime() : true;
        const okEnd = end ? t <= end.getTime() : true;
        return okStart && okEnd;
      });
      setFilteredActivities(filtered);
    }
  }, [filterStartDate, filterEndDate, activities]);

  // Fungsi untuk export data ke PDF
  const exportToPDF = async () => {
    if (filteredActivities.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const doc = new jsPDF();
    
    // Set font untuk mendukung karakter Indonesia
    doc.setFont('helvetica');
    
    // Tambahkan logo TelkomAkses di pojok kiri atas
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          // Tambahkan logo di pojok kiri atas (x: 20, y: 10, width: 40, height: 25)
          doc.addImage(logoImg, 'PNG', 20, 10, 40, 25);
          resolve(true);
        };
        logoImg.onerror = () => {
          console.warn('Logo tidak dapat dimuat, melanjutkan tanpa logo');
          resolve(true);
        };
        logoImg.src = '/logo-telkomakses.png';
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
    }
    
    // Header perusahaan
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Data ONT', 105, 20, { align: 'center' });
    
    // Informasi kontak
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Alamat: Jl. Raya Setu No.27, Cibuntu, Kec. Cibitung, Kabupaten Bekasi', 105, 35, { align: 'center' });
    doc.text('Nomor Telepon: (021) 123-4567', 105, 40, { align: 'center' });
    doc.text('Email: telkomakses@gmail.com, Website: www.routertrack.com', 105, 45, { align: 'center' });
    
    // Garis pemisah
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
    
    // Prepare data untuk tabel
    const tableData = filteredActivities.map((activity, index) => [
      index + 1,
      activity.serial_number,
      activity.item_description,
      activity.owner,
      activity.inventory_status || 'AVAILABLE',
      activity.date + ' ' + activity.time
    ]);
    
    // Buat tabel
    autoTable(doc, {
      head: [['No', 'Serial Number', 'Item Description', 'Owner', 'Status', 'Tanggal Dibuat']],
      body: tableData,
      startY: 60,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
    });
    
    // Footer dengan informasi pembuat
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const today = new Date();
    doc.setFontSize(10);
    doc.text(`bekasi,${today.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 190, finalY, { align: 'right' });
    doc.text('administrator', 190, finalY + 15, { align: 'right' });
    
    // Download PDF
    const rangeSuffix = (filterStartDate || filterEndDate)
      ? `${filterStartDate || 'all'}_sampai_${filterEndDate || 'all'}`
      : today.toISOString().split('T')[0];
    const fileName = `laporan-ont-${rangeSuffix}.pdf`;
    doc.save(fileName);
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
            <div className="h-11 w-11 rounded bg-green-500 text-white grid place-items-center shadow-sm">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Laporan Data ONT</h1>
              <p className="text-sm text-gray-500">
                Laporan aktivitas penambahan data ONT oleh admin
              </p>
            </div>
          </div>
          {/* Logout moved to Topbar */}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Aktivitas</p>
                <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.filter(activity => {
                    const today = new Date().toISOString().split('T')[0];
                    const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
                    return activityDate === today;
                  }).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Minggu Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.filter(activity => {
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    const activityDate = new Date(activity.timestamp);
                    return activityDate >= weekAgo && activityDate <= now;
                  }).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">
                    Filter Tanggal:
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">s/d</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyLastNDaysFilter(7)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    1 Minggu
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLastNDaysFilter(30)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    1 Bulan
                  </button>
                </div>

                {(filterStartDate || filterEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Reset
                  </button>
                )}
              </div>
              
              <button
                onClick={exportToPDF}
                disabled={filteredActivities.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                <FileDown size={16} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Activities Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">
                  {(filterStartDate || filterEndDate) ? 'Tidak Ada Data pada Rentang Tanggal Tersebut' : 'Belum Ada Aktivitas'}
                </h2>
                <p className="text-gray-500 mb-4">
                  {(filterStartDate || filterEndDate)
                    ? 'Tidak ada aktivitas penambahan data ONT pada rentang tanggal yang dipilih.' 
                    : 'Belum ada aktivitas penambahan data ONT yang tercatat.'
                  }
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hari</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity, index) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.day}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{activity.serial_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.item_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.item_description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
