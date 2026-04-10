'use server';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query, handleDatabaseError, handleDatabaseSuccess, UserData } from '@/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    username: string;
    role: 'admin' | 'user';
    namaAkun: string;
    warehouse: string;
    jobRole?: string;
    email: string;
  };
}

interface RegisterResult {
  success: boolean;
  error?: string;
  userId?: number;
}

interface SessionResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    role: 'admin' | 'user';
    namaAkun: string;
    warehouse: string;
    jobRole?: string;
    email: string;
  };
  error?: string;
}

// Login action
export async function loginAction(email: string, password: string): Promise<LoginResult> {
  try {
    // Cari user berdasarkan email atau username
    const sql = `
      SELECT id, email, password_hash, nama_akun, username, warehouse, role, job_role, status
      FROM user_profiles
      WHERE (email = ? OR username = ?) AND status = 'active'
      LIMIT 1
    `;
    
    const results = await query<RowDataPacket[]>(sql, [email, email]);
    
    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'Email/Username atau password salah'
      };
    }

    const user = results[0];

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Email/Username atau password salah'
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      path: '/'
    });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        namaAkun: user.nama_akun,
        warehouse: user.warehouse,
        jobRole: user.job_role || undefined,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat login'
    };
  }
}

// Register action
export async function registerAction(
  email: string,
  password: string,
  userData: {
    username: string;
    namaAkun: string;
    warehouse: string;
    role?: 'admin' | 'user';
  }
): Promise<RegisterResult> {
  try {
    // Cek apakah username atau email sudah digunakan
    const checkSql = `
      SELECT id FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
    `;
    
    const existing = await query<RowDataPacket[]>(checkSql, [userData.username, email]);
    
    if (existing && existing.length > 0) {
      return {
        success: false,
        error: 'Username atau email sudah digunakan'
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user baru
    const insertSql = `
      INSERT INTO user_profiles (email, password_hash, nama_akun, username, warehouse, role, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'active', 'system')
    `;
    
    const result = await query<ResultSetHeader>(insertSql, [
      email,
      passwordHash,
      userData.namaAkun,
      userData.username.toLowerCase(),
      userData.warehouse,
      userData.role || 'user'
    ]);

    return {
      success: true,
      userId: result.insertId
    };
  } catch (error) {
    console.error('Register error:', error);
    return handleDatabaseError(error);
  }
}

// Logout action
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

// Get current session
export async function getSession(): Promise<SessionResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'No token found'
      };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      role: 'admin' | 'user';
      email: string;
    };

    // Get user data dari database
    const sql = `
      SELECT id, email, nama_akun, username, warehouse, role, job_role, status
      FROM user_profiles
      WHERE id = ? AND status = 'active'
      LIMIT 1
    `;
    
    const results = await query<RowDataPacket[]>(sql, [decoded.userId]);
    
    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const user = results[0];

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        namaAkun: user.nama_akun,
        warehouse: user.warehouse,
        jobRole: user.job_role || undefined,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Session error:', error);
    return {
      success: false,
      error: 'Invalid session'
    };
  }
}

// Verify token (untuk middleware atau protected routes)
export async function verifyAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return false;
    }

    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}
