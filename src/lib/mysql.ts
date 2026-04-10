import mysql from 'mysql2/promise';

// Tipe data untuk database
export interface ONTData {
  id?: number;
  serial_number: string;
  item_code: string;
  item_description: string;
  owner: string;
  purchase_reference?: string;
  supplier?: string;
  location_type?: string;
  location_code?: string;
  location_description?: string;
  inventory_status?: string;
  condition_status?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
}

export interface UserData {
  id?: number;
  email: string;
  password_hash?: string;
  nama_akun: string;
  username: string;
  warehouse: string;
  role: 'admin' | 'user';
  job_role?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface UnrefurbishData {
  id?: number;
  serial_number: string;
  tes_visual: any[];
  photos: string[];
  photo_count: number;
  completed_at: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Konfigurasi koneksi MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'routertrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Connection pool
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Helper function untuk execute query
export async function query<T = any>(
  sql: string,
  values?: any[]
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results as T;
  } finally {
    connection.release();
  }
}

// Helper function untuk handle database errors
export function handleDatabaseError(error: any) {
  console.error('Database error:', error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    return {
      success: false,
      error: 'Data sudah ada dalam database'
    };
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      success: false,
      error: 'Data referensi tidak ditemukan'
    };
  }
  
  return {
    success: false,
    error: error.message || 'Terjadi kesalahan pada database'
  };
}

// Helper function untuk response sukses
export function handleDatabaseSuccess<T>(data: T) {
  return {
    success: true,
    data
  };
}

// Helper function untuk convert ISO datetime ke MySQL datetime format
export function formatDatetimeForMySQL(datetime: string | Date): string {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Test koneksi database
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
