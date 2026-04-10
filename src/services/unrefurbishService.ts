import {
  getAllUnrefurbishAction,
  getUnrefurbishBySerialNumberAction,
  saveUnrefurbishAction,
  deleteUnrefurbishAction,
  checkUnrefurbishStatusAction,
  getUnrefurbishStatsAction
} from '@/actions/unrefurbish'
import { UnrefurbishData } from '@/lib/mysql'

export class UnrefurbishService {
  // Mendapatkan semua data unrefurbish
  static async getAllUnrefurbish() {
    return await getAllUnrefurbishAction()
  }

  // Mendapatkan data unrefurbish berdasarkan serial number
  static async getUnrefurbishBySerialNumber(serialNumber: string) {
    return await getUnrefurbishBySerialNumberAction(serialNumber)
  }

  // Menambah atau update data unrefurbish
  static async saveUnrefurbish(unrefurbishData: Omit<UnrefurbishData, 'id' | 'created_at' | 'updated_at'>) {
    return await saveUnrefurbishAction(unrefurbishData)
  }

  // Hapus data unrefurbish
  static async deleteUnrefurbish(id: number) {
    return await deleteUnrefurbishAction(id)
  }

  // Cek status unrefurbish untuk ONT tertentu
  static async checkUnrefurbishStatus(serialNumber: string) {
    return await checkUnrefurbishStatusAction(serialNumber)
  }

  // Mendapatkan statistik unrefurbish
  static async getUnrefurbishStats() {
    return await getUnrefurbishStatsAction()
  }
}
