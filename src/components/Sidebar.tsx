"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Plus, List, Settings, UserPlus, UserCircle, Package, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname();
  // Logika active state yang tepat
  let active = false;
  
  if (href === "#") {
    // Link placeholder tidak pernah aktif
    active = false;
  } else if (href === "/item") {
    // Halaman item hanya aktif jika exact match
    active = pathname === "/item";
  } else if (href === "/admin") {
    // Halaman admin utama hanya aktif jika exact match
    active = pathname === "/admin";
  } else {
    // Halaman lain aktif jika exact match atau ada sub-routes
    active = pathname === href || pathname.startsWith(href + "/");
  }
  
  // Tentukan warna berdasarkan halaman
  const activeColor = "bg-red-500 text-white";
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors ${
        active ? activeColor : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="shrink-0" size={18} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex w-64 shrink-0 h-dvh sticky top-0 flex-col bg-white border-r border-gray-200">
      {/* User Profile */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
        <div className="h-10 w-10 rounded-full bg-gray-200 grid place-items-center">
          <UserCircle size={20} className="text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          {user && (
            <>
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                {user.namaAkun || user.username}
              </div>
              <div className="text-[11px] text-gray-500 truncate">Supply Chain Management</div>
            </>
          )}
        </div>
      </div>

      {/* Role & Warehouse Info */}
      {user && (
        <div className="px-4 py-3 text-[11px] leading-relaxed border-b border-gray-200 bg-gray-50">
          <div className="text-gray-600">
            <span className="font-semibold text-gray-800">Role</span> : {user.role === 'admin' ? 'Administrator' : (user.jobRole || 'SCMT-TA WITEL INV DRAFTER')}
          </div>
          <div className="mt-1 text-gray-600">
            <span className="font-semibold text-gray-800">Warehouse</span> : {user.warehouse || 'TLA WITEL CCAN JABAR BARAT (BEKASI) WH'}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {user?.role === 'admin' ? (
          <>
            <div className="text-[10px] uppercase tracking-wider px-3 py-2 text-gray-400 font-semibold">MENU</div>
            <NavItem href="/admin" icon={Plus} label="Tambah Data ONT" />
            <NavItem href="/admin/data-ont" icon={List} label="Data ONT Terdaftar" />
            <NavItem href="/admin/laporan" icon={BarChart3} label="Laporan Data ONT" />
            <NavItem href="/admin/buat-akun" icon={UserPlus} label="Buat Akun User" />
            <NavItem href="/admin/input-unrefurbish" icon={Package} label="Input Unrefurbish" />
            <NavItem href="/admin/pengaturan" icon={Settings} label="Manajemen User" />
          </>
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-wider px-3 py-2 text-gray-400 font-semibold">MENU</div>
            <NavItem href="/item" icon={FileText} label="Item" />
            <NavItem href="/input-unrefurbish" icon={Package} label="Input Unrefurbish" />
          </>
        )}
      </nav>
    </aside>
  );
}
