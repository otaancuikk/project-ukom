'use server';

import { query, handleDatabaseError, handleDatabaseSuccess, ONTData } from '@/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ONTResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Update ONT by serial number (for condition_status updates from unrefurbish flow)
export async function updateONTBySerialNumberAction(
  serialNumber: string,
  ontData: Partial<ONTData>
): Promise<ONTResult> {
  try {
    console.log('[updateONTBySerialNumberAction] payload:', { serialNumber, ontData });
    const sql = `
      UPDATE ont_data
      SET
        inventory_status = COALESCE(?, inventory_status),
        condition_status = COALESCE(?, condition_status)
      WHERE serial_number = ?
      LIMIT 1
    `;

    const values = [
      ontData.inventory_status ?? null,
      ontData.condition_status ?? null,
      serialNumber
    ];
    console.log('[updateONTBySerialNumberAction] VALUES BEFORE QUERY:', values);

    const result = await query<ResultSetHeader>(sql, values);
    console.log('[updateONTBySerialNumberAction] update result:', {
      affectedRows: result.affectedRows,
      changedRows: (result as any).changedRows,
      info: (result as any).info
    });

    const selectSql = 'SELECT * FROM ont_data WHERE serial_number = ? LIMIT 1';
    const results = await query<RowDataPacket[]>(selectSql, [serialNumber]);
    console.log('[updateONTBySerialNumberAction] select length:', results.length);

    if (!result.affectedRows) {
      if (!results.length) {
        return {
          success: false,
          error: `ONT dengan serial number "${serialNumber}" tidak ditemukan`
        };
      }
    }

    return handleDatabaseSuccess(results[0] || null);
  } catch (error) {
    console.error('[updateONTBySerialNumberAction] error:', error);
    return handleDatabaseError(error);
  }
}

// Get all ONT data
export async function getAllONTAction(): Promise<ONTResult> {
  try {
    const sql = `
      SELECT * FROM ont_data
      ORDER BY created_at DESC
    `;
    
    const results = await query<RowDataPacket[]>(sql);
    return handleDatabaseSuccess(results);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Search ONT by criteria
export async function searchONTAction(searchType: string, searchValue: string): Promise<ONTResult> {
  try {
    let sql = '';
    let params: any[] = [];

    switch (searchType) {
      case 'SERIAL_NUMBER':
        sql = 'SELECT * FROM ont_data WHERE serial_number LIKE ? ORDER BY created_at DESC';
        params = [`%${searchValue}%`];
        break;
      case 'ITEM_CODE':
        sql = 'SELECT * FROM ont_data WHERE item_code LIKE ? ORDER BY created_at DESC';
        params = [`%${searchValue}%`];
        break;
      case 'OWNER':
        sql = 'SELECT * FROM ont_data WHERE owner LIKE ? ORDER BY created_at DESC';
        params = [`%${searchValue}%`];
        break;
      case 'LOCATION_CODE':
        sql = 'SELECT * FROM ont_data WHERE location_code LIKE ? ORDER BY created_at DESC';
        params = [`%${searchValue}%`];
        break;
      default:
        return {
          success: false,
          error: 'Tipe pencarian tidak valid'
        };
    }

    const results = await query<RowDataPacket[]>(sql, params);
    return handleDatabaseSuccess(results);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get ONT by ID
export async function getONTByIdAction(id: number): Promise<ONTResult> {
  try {
    const sql = `
      SELECT * FROM ont_data
      WHERE id = ?
      LIMIT 1
    `;
    
    const results = await query<RowDataPacket[]>(sql, [id]);
    
    if (results.length === 0) {
      return handleDatabaseSuccess(null);
    }
    
    return handleDatabaseSuccess(results[0]);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get ONT by serial number (exact match)
export async function getONTBySerialNumberAction(serialNumber: string): Promise<ONTResult> {
  try {
    const sql = `
      SELECT * FROM ont_data
      WHERE serial_number = ?
      LIMIT 1
    `;
    
    const results = await query<RowDataPacket[]>(sql, [serialNumber]);
    
    if (results.length === 0) {
      return handleDatabaseSuccess(null);
    }
    
    return handleDatabaseSuccess(results[0]);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Create new ONT
export async function createONTAction(ontData: Omit<ONTData, 'id' | 'created_at' | 'updated_at'>): Promise<ONTResult> {
  try {
    // Check for duplicate serial number
    const checkResult = await getONTBySerialNumberAction(ontData.serial_number);
    
    if (checkResult.success && checkResult.data) {
      return {
        success: false,
        error: `Serial Number "${ontData.serial_number}" sudah terdaftar! Gunakan serial number yang berbeda.`
      };
    }

    const sql = `
      INSERT INTO ont_data (
        serial_number, item_code, item_description, owner,
        purchase_reference, supplier, location_type, location_code,
        location_description, inventory_status, condition_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query<ResultSetHeader>(sql, [
      ontData.serial_number,
      ontData.item_code,
      ontData.item_description,
      ontData.owner,
      ontData.purchase_reference || null,
      ontData.supplier || null,
      ontData.location_type || null,
      ontData.location_code || null,
      ontData.location_description || null,
      ontData.inventory_status || null,
      ontData.condition_status || null,
      ontData.created_by || null
    ]);

    return handleDatabaseSuccess({ id: result.insertId, ...ontData });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Update ONT
export async function updateONTAction(id: number, ontData: Partial<ONTData>): Promise<ONTResult> {
  try {
    const sql = `
      UPDATE ont_data
      SET
        item_code = COALESCE(?, item_code),
        item_description = COALESCE(?, item_description),
        owner = COALESCE(?, owner),
        purchase_reference = COALESCE(?, purchase_reference),
        supplier = COALESCE(?, supplier),
        location_type = COALESCE(?, location_type),
        location_code = COALESCE(?, location_code),
        location_description = COALESCE(?, location_description),
        inventory_status = COALESCE(?, inventory_status),
        condition_status = COALESCE(?, condition_status)
      WHERE id = ?
    `;
    
    await query<ResultSetHeader>(sql, [
      ontData.item_code,
      ontData.item_description,
      ontData.owner,
      ontData.purchase_reference,
      ontData.supplier,
      ontData.location_type,
      ontData.location_code,
      ontData.location_description,
      ontData.inventory_status,
      ontData.condition_status,
      id
    ]);

    // Get updated data
    const selectSql = 'SELECT * FROM ont_data WHERE id = ?';
    const results = await query<RowDataPacket[]>(selectSql, [id]);
    
    return handleDatabaseSuccess(results[0]);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Delete ONT
export async function deleteONTAction(id: number): Promise<ONTResult> {
  try {
    const sql = 'DELETE FROM ont_data WHERE id = ?';
    await query<ResultSetHeader>(sql, [id]);
    
    return handleDatabaseSuccess({ message: 'Data ONT berhasil dihapus' });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get ONT statistics
export async function getONTStatsAction(): Promise<ONTResult> {
  try {
    const countONTSql = 'SELECT COUNT(*) as total FROM ont_data';
    const countUnrefurbishSql = 'SELECT COUNT(*) as total FROM unrefurbish_data';
    
    const [ontResults, unrefurbishResults] = await Promise.all([
      query<RowDataPacket[]>(countONTSql),
      query<RowDataPacket[]>(countUnrefurbishSql)
    ]);
    
    const totalONT = ontResults[0]?.total || 0;
    const unrefurbishedONT = unrefurbishResults[0]?.total || 0;
    
    return handleDatabaseSuccess({
      totalONT,
      unrefurbishedONT,
      stockONT: totalONT - unrefurbishedONT
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}
