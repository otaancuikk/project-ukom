'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, logoutAction, getSession } from '@/actions/auth';
import { createUserAction } from '@/actions/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { 
    id: number;
    username: string; 
    role: 'admin' | 'user'; 
    namaAkun?: string; 
    warehouse?: string;
    jobRole?: string;
    email?: string;
  } | null;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string; user?: { id: number; username: string; role: 'admin' | 'user'; namaAkun?: string; warehouse?: string; jobRole?: string; email?: string; } }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  addUser: (userData: { 
    email: string;
    username: string; 
    password: string; 
    namaAkun: string; 
    warehouse: string; 
    role?: 'admin' | 'user';
    jobRole?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cek status login saat aplikasi dimuat
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const session = await getSession();
        
        if (session.success && session.user) {
          setIsAuthenticated(true);
          setUser(session.user);
          console.log('AuthContext - User session restored:', session.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string; user?: { id: number; username: string; role: 'admin' | 'user'; namaAkun?: string; warehouse?: string; jobRole?: string; email?: string; } }> => {
    try {
      setIsLoading(true);
      
      const result = await loginAction(emailOrUsername, password);
      
      if (result.success && result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
        console.log('AuthContext - Login successful for:', result.user);
        return { success: true, user: result.user };
      }
      
      return { 
        success: false, 
        error: result.error || 'Login gagal' 
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Terjadi kesalahan saat login' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutAction();
      
      setIsAuthenticated(false);
      setUser(null);
      
      // Redirect ke login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addUser = async (userData: {
    email: string;
    username: string;
    password: string;
    namaAkun: string;
    warehouse: string;
    role?: 'admin' | 'user';
    jobRole?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await createUserAction({
        email: userData.email,
        password: userData.password,
        nama_akun: userData.namaAkun,
        username: userData.username.toLowerCase(),
        warehouse: userData.warehouse,
        role: userData.role || 'user',
        job_role: userData.jobRole,
        created_by: user?.username || 'admin'
      });
      
      if (result.success) {
        console.log('User baru berhasil dibuat:', userData.username);
      }
      
      return result;
    } catch (error: any) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: error.message || 'Gagal membuat user'
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      isLoading,
      addUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth harus digunakan dalam AuthProvider');
  }
  return context;
}
