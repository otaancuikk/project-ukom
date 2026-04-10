'use server';

import { query, handleDatabaseError, handleDatabaseSuccess, UnrefurbishData, formatDatetimeForMySQL } from '@/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UnrefurbishResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Get all unrefurbish data
export async function getAllUnrefurbishAction(): Promise<UnrefurbishResult> {
  try {
    const sql = `
      SELECT 
        u.*,
        o.serial_number as ont_serial_number,
        o.item_code,
        o.item_description,
        o.owner
      FROM unrefurbish_data u
      LEFT JOIN ont_data o ON u.serial_number = o.serial_number
      ORDER BY u.completed_at DESC
    `;
    
    const results = await query<RowDataPacket[]>(sql);
    
    // Parse JSON fields
    const parsedResults = results.map((row: any) => ({
      ...row,
      tes_visual: typeof row.tes_visual === 'string' ? JSON.parse(row.tes_visual) : row.tes_visual,
      photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos,
      ont_data: {
        serial_number: row.ont_serial_number,
        item_code: row.item_code,
        item_description: row.item_description,
        owner: row.owner
      }
    }));
    
    return handleDatabaseSuccess(parsedResults);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get unrefurbish by serial number
export async function getUnrefurbishBySerialNumberAction(serialNumber: string): Promise<UnrefurbishResult> {
  try {
    const sql = `
      SELECT 
        u.*,
        o.serial_number as ont_serial_number,
        o.item_code,
        o.item_description,
        o.owner
      FROM unrefurbish_data u
      LEFT JOIN ont_data o ON u.serial_number = o.serial_number
      WHERE u.serial_number = ?
      LIMIT 1
    `;
    
    const results = await query<RowDataPacket[]>(sql, [serialNumber]);
    
    if (results.length === 0) {
      return handleDatabaseSuccess(null);
    }

    const row = results[0];
    const parsedResult = {
      ...row,
      tes_visual: typeof row.tes_visual === 'string' ? JSON.parse(row.tes_visual) : row.tes_visual,
      photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos,
      ont_data: {
        serial_number: row.ont_serial_number,
        item_code: row.item_code,
        item_description: row.item_description,
        owner: row.owner
      }
    };
    
    return handleDatabaseSuccess(parsedResult);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Save unrefurbish data (insert or update)
export async function saveUnrefurbishAction(
  unrefurbishData: Omit<UnrefurbishData, 'id' | 'created_at' | 'updated_at'>
): Promise<UnrefurbishResult> {
  try {
    // Check if data already exists
    const checkResult = await getUnrefurbishBySerialNumberAction(unrefurbishData.serial_number);
    
    // Convert arrays to JSON strings
    const tesVisualJson = JSON.stringify(unrefurbishData.tes_visual);
    const photosJson = JSON.stringify(unrefurbishData.photos);
    
    if (checkResult.success && checkResult.data) {
      // Update existing data
      const updateSql = `
        UPDATE unrefurbish_data
        SET
          tes_visual = ?,
          photos = ?,
          photo_count = ?,
          completed_at = ?,
          status = ?
        WHERE serial_number = ?
      `;
      
      await query<ResultSetHeader>(updateSql, [
        tesVisualJson,
        photosJson,
        unrefurbishData.photo_count,
        formatDatetimeForMySQL(unrefurbishData.completed_at),
        unrefurbishData.status,
        unrefurbishData.serial_number
      ]);
      
      return await getUnrefurbishBySerialNumberAction(unrefurbishData.serial_number);
    } else {
      // Insert new data
      const insertSql = `
        INSERT INTO unrefurbish_data (
          serial_number, tes_visual, photos, photo_count,
          completed_at, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await query<ResultSetHeader>(insertSql, [
        unrefurbishData.serial_number,
        tesVisualJson,
        photosJson,
        unrefurbishData.photo_count,
        formatDatetimeForMySQL(unrefurbishData.completed_at),
        unrefurbishData.status,
        unrefurbishData.created_by || null
      ]);
      
      return handleDatabaseSuccess({ id: result.insertId, ...unrefurbishData });
    }
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Delete unrefurbish data
export async function deleteUnrefurbishAction(id: number): Promise<UnrefurbishResult> {
  try {
    const sql = 'DELETE FROM unrefurbish_data WHERE id = ?';
    await query<ResultSetHeader>(sql, [id]);
    
    return handleDatabaseSuccess({ message: 'Data unrefurbish berhasil dihapus' });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Check unrefurbish status for a specific ONT
export async function checkUnrefurbishStatusAction(serialNumber: string): Promise<UnrefurbishResult> {
  try {
    const result = await getUnrefurbishBySerialNumberAction(serialNumber);
    
    return {
      success: true,
      data: {
        isUnrefurbished: result.success && result.data !== null,
        data: result.data
      }
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// Get unrefurbish statistics
export async function getUnrefurbishStatsAction(): Promise<UnrefurbishResult> {
  try {
    const totalSql = 'SELECT COUNT(*) as total FROM unrefurbish_data';
    const completedSql = 'SELECT COUNT(*) as total FROM unrefurbish_data WHERE status = "Unrefurbished"';
    
    const [totalResults, completedResults] = await Promise.all([
      query<RowDataPacket[]>(totalSql),
      query<RowDataPacket[]>(completedSql)
    ]);
    
    const totalUnrefurbish = totalResults[0]?.total || 0;
    const completedUnrefurbish = completedResults[0]?.total || 0;
    
    return handleDatabaseSuccess({
      totalUnrefurbish,
      completedUnrefurbish
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}
