import {
  getAllONTAction,
  searchONTAction,
  getONTByIdAction,
  getONTBySerialNumberAction,
  createONTAction,
  updateONTAction,
  updateONTBySerialNumberAction,
  deleteONTAction,
  getONTStatsAction
} from '@/actions/ont'
import { ONTData } from '@/lib/mysql'

export class ONTService {
  // Mendapatkan semua data ONT
  static async getAllONT() {
    return await getAllONTAction()
  }

  // Mencari ONT berdasarkan kriteria
  static async searchONT(searchType: string, searchValue: string) {
    return await searchONTAction(searchType, searchValue)
  }

  // Mendapatkan ONT berdasarkan ID
  static async getONTById(id: number) {
    return await getONTByIdAction(id)
  }

  // Mencari ONT berdasarkan serial number (exact match)
  static async getONTBySerialNumber(serialNumber: string) {
    return await getONTBySerialNumberAction(serialNumber)
  }

  // Menambah data ONT baru
  static async createONT(ontData: Omit<ONTData, 'id' | 'created_at' | 'updated_at'>) {
    return await createONTAction(ontData)
  }

  // Update data ONT
  static async updateONT(id: number, ontData: Partial<ONTData>) {
    return await updateONTAction(id, ontData)
  }

  static async updateONTBySerialNumber(serialNumber: string, ontData: Partial<ONTData>) {
    return await updateONTBySerialNumberAction(serialNumber, ontData)
  }

  // Hapus data ONT
  static async deleteONT(id: number) {
    return await deleteONTAction(id)
  }

  // Mendapatkan statistik ONT
  static async getONTStats() {
    return await getONTStatsAction()
  }
}
