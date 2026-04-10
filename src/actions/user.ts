'use server';

import bcrypt from 'bcryptjs';
import { query, handleDatabaseError, handleDatabaseSuccess, UserData } from '@/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Get all users
export async function getAllUsersAction(): Promise<UserResult> {
  try {
    const sql = `
      SELECT id, email, nama_akun, username, warehouse, role, job_role, status, created_at, created_by
      FROM user_profiles
      ORDER BY created_at DESC
    `;
    
    const results = await query<RowDataPacket[]>(sql);
    return handleDatabaseSuccess(results);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get user by ID
export async function getUserByIdAction(userId: number): Promise<UserResult> {
  try {
    const sql = `
      SELECT id, email, nama_akun, username, warehouse, role, job_role, status, created_at, created_by
      FROM user_profiles
      WHERE id = ?
      LIMIT 1
    `;
    
    const results = await query<RowDataPacket[]>(sql, [userId]);
    
    if (results.length === 0) {
      return handleDatabaseSuccess(null);
    }
    
    return handleDatabaseSuccess(results[0]);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get user by username
export async function getUserByUsernameAction(username: string): Promise<UserResult> {
  try {
    const sql = `
      SELECT id, email, nama_akun, username, warehouse, role, job_role, status, created_at, created_by
      FROM user_profiles
      WHERE username = ?
      LIMIT 1
    `;
    
    const results = await query<RowDataPacket[]>(sql, [username]);
    
    if (results.length === 0) {
      return handleDatabaseSuccess(null);
    }
    
    return handleDatabaseSuccess(results[0]);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Create user (by admin)
export async function createUserAction(userData: {
  email: string;
  password: string;
  nama_akun: string;
  username: string;
  warehouse: string;
  role?: 'admin' | 'user';
  job_role?: string;
  created_by?: string;
}): Promise<UserResult> {
  try {
    // Check for duplicate username or email
    const checkSql = `
      SELECT id FROM user_profiles
      WHERE username = ? OR email = ?
      LIMIT 1
    `;
    
    const existing = await query<RowDataPacket[]>(checkSql, [userData.username, userData.email]);
    
    if (existing && existing.length > 0) {
      return {
        success: false,
        error: `Username atau email sudah digunakan!`
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Insert new user
    const insertSql = `
      INSERT INTO user_profiles (email, password_hash, nama_akun, username, warehouse, role, job_role, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `;
    
    const result = await query<ResultSetHeader>(insertSql, [
      userData.email,
      passwordHash,
      userData.nama_akun,
      userData.username.toLowerCase(),
      userData.warehouse,
      userData.role || 'user',
      userData.job_role || null,
      userData.created_by || 'system'
    ]);

    return handleDatabaseSuccess({ id: result.insertId, ...userData, password: undefined });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Update user profile
export async function updateUserAction(id: number, userData: Partial<{
  email: string;
  nama_akun: string;
  username: string;
  warehouse: string;
  role: 'admin' | 'user';
  job_role: string;
  status: 'active' | 'inactive';
}>): Promise<UserResult> {
  try {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.email !== undefined) {
      updates.push('email = ?');
      values.push(userData.email);
    }
    if (userData.nama_akun !== undefined) {
      updates.push('nama_akun = ?');
      values.push(userData.nama_akun);
    }
    if (userData.username !== undefined) {
      updates.push('username = ?');
      values.push(userData.username);
    }
    if (userData.warehouse !== undefined) {
      updates.push('warehouse = ?');
      values.push(userData.warehouse);
    }
    if (userData.role !== undefined) {
      updates.push('role = ?');
      values.push(userData.role);
    }
    if (userData.job_role !== undefined) {
      updates.push('job_role = ?');
      values.push(userData.job_role);
    }
    if (userData.status !== undefined) {
      updates.push('status = ?');
      values.push(userData.status);
    }

    if (updates.length === 0) {
      return {
        success: false,
        error: 'Tidak ada data yang diupdate'
      };
    }

    values.push(id);

    const sql = `
      UPDATE user_profiles
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    await query<ResultSetHeader>(sql, values);

    // Get updated data
    const selectSql = `
      SELECT id, email, nama_akun, username, warehouse, role, job_role, status, created_at, created_by
      FROM user_profiles
      WHERE id = ?
    `;
    const results = await query<RowDataPacket[]>(selectSql, [id]);
    
    return handleDatabaseSuccess(results[0]);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Update user password
export async function updateUserPasswordAction(userId: number, newPassword: string): Promise<UserResult> {
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const sql = 'UPDATE user_profiles SET password_hash = ? WHERE id = ?';
    await query<ResultSetHeader>(sql, [passwordHash, userId]);
    
    return handleDatabaseSuccess({ message: 'Password berhasil diupdate' });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Delete user
export async function deleteUserAction(id: number): Promise<UserResult> {
  try {
    const sql = 'DELETE FROM user_profiles WHERE id = ?';
    await query<ResultSetHeader>(sql, [id]);
    
    return handleDatabaseSuccess({ message: 'User berhasil dihapus' });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Update user status (active/inactive)
export async function updateUserStatusAction(id: number, status: 'active' | 'inactive'): Promise<UserResult> {
  try {
    const sql = 'UPDATE user_profiles SET status = ? WHERE id = ?';
    await query<ResultSetHeader>(sql, [status, id]);
    
    return handleDatabaseSuccess({ message: 'Status user berhasil diupdate' });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get user statistics
export async function getUserStatsAction(): Promise<UserResult> {
  try {
    const totalSql = 'SELECT COUNT(*) as total FROM user_profiles';
    const activeSql = 'SELECT COUNT(*) as total FROM user_profiles WHERE status = "active"';
    const adminSql = 'SELECT COUNT(*) as total FROM user_profiles WHERE role = "admin"';
    
    const [totalResults, activeResults, adminResults] = await Promise.all([
      query<RowDataPacket[]>(totalSql),
      query<RowDataPacket[]>(activeSql),
      query<RowDataPacket[]>(adminSql)
    ]);
    
    const totalUsers = totalResults[0]?.total || 0;
    const activeUsers = activeResults[0]?.total || 0;
    const adminUsers = adminResults[0]?.total || 0;
    
    return handleDatabaseSuccess({
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}
