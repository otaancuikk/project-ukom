import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 w-full border-b bg-white flex items-center shadow-sm">
      <div className="px-4 w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 hover:bg-gray-100 rounded">
            <Menu size={20} className="text-gray-600" />
          </button>
          {/* User block removed to avoid duplicate with Sidebar */}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={18} className="text-gray-600" />
          </button>
          </div>
      </div>
    </header>
  );
}
