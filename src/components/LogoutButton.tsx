'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = '' }: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Logout berhasil');
      
      // Gunakan logout function dari AuthContext
      logout();
    } catch (error) {
      console.error('Error saat logout:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isLoggingOut
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
      } ${className}`}
    >
      <LogOut size={16} />
      <span>{isLoggingOut ? 'Keluar...' : 'Logout'}</span>
    </button>
  );
}
