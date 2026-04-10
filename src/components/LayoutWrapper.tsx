'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ReactNode, useEffect } from 'react';

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Halaman yang tidak memerlukan sidebar/topbar
  const isLoginPage = pathname === '/login';
  
  // Redirect ke login jika belum terautentikasi dan bukan di halaman login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      console.log('LayoutWrapper: Redirecting to login from', pathname);
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, isLoginPage, pathname, router]);
  
  // Jika sedang loading, tampilkan loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Jika di halaman login, tampilkan tanpa sidebar/topbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Jika belum terautentikasi, tampilkan loading sementara redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  // Jika terautentikasi dan bukan halaman login, tampilkan dengan sidebar/topbar
  return (
    <div className="min-h-dvh w-full flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
        <Topbar />
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
