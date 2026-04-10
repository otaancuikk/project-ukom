import {
  getAllUsersAction,
  getUserByIdAction,
  getUserByUsernameAction,
  createUserAction,
  updateUserAction,
  updateUserPasswordAction,
  deleteUserAction,
  updateUserStatusAction,
  getUserStatsAction
} from '@/actions/user'
import { UserData } from '@/lib/mysql'

export class UserService {
  // Mendapatkan semua user profiles
  static async getAllUsers() {
    return await getAllUsersAction()
  }

  // Mendapatkan user profile berdasarkan user_id
  static async getUserByUserId(userId: number) {
    return await getUserByIdAction(userId)
  }

  // Mendapatkan user profile berdasarkan username
  static async getUserByUsername(username: string) {
    return await getUserByUsernameAction(username)
  }

  // Membuat user profile baru
  static async createUserProfile(userProfile: {
    email: string;
    password: string;
    nama_akun: string;
    username: string;
    warehouse: string;
    role?: 'admin' | 'user';
    created_by?: string;
  }) {
    return await createUserAction(userProfile)
  }

  // Update user profile
  static async updateUserProfile(id: number, userProfile: Partial<{
    email: string;
    nama_akun: string;
    username: string;
    warehouse: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
  }>) {
    return await updateUserAction(id, userProfile)
  }

  // Update user password
  static async updateUserPassword(userId: number, newPassword: string) {
    return await updateUserPasswordAction(userId, newPassword)
  }

  // Hapus user profile
  static async deleteUserProfile(id: number) {
    return await deleteUserAction(id)
  }

  // Update status user (active/inactive)
  static async updateUserStatus(id: number, status: 'active' | 'inactive') {
    return await updateUserStatusAction(id, status)
  }

  // Mendapatkan statistik user
  static async getUserStats() {
    return await getUserStatsAction()
  }
}
