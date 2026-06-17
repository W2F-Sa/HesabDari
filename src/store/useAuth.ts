import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'
import { hashPassword } from '@/utils/helpers'

// رمز عبور پیش‌فرض تصادفی (در اولین اجرا ساخته می‌شود و قابل تغییر در تنظیمات است)
export const DEFAULT_USERNAME = 'admin'
export const DEFAULT_PASSWORD = 'K9m#Pt4xQ@2w'

interface AuthState {
  user: AuthUser | null
  isAuthed: boolean
  initialized: boolean
  ensureSeed: () => Promise<void>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  changePassword: (oldPwd: string, newPwd: string) => Promise<boolean>
  changeUsername: (newUsername: string, currentPwd: string) => Promise<boolean>
  setDisplayName: (name: string) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthed: false,
      initialized: false,

      ensureSeed: async () => {
        if (get().user) {
          set({ initialized: true })
          return
        }
        const passwordHash = await hashPassword(DEFAULT_PASSWORD)
        set({
          user: {
            username: DEFAULT_USERNAME,
            passwordHash,
            displayName: 'مدیر سیستم',
            role: 'admin',
          },
          initialized: true,
        })
      },

      login: async (username, password) => {
        const user = get().user
        if (!user) return false
        const hash = await hashPassword(password)
        if (username.trim() === user.username && hash === user.passwordHash) {
          set({
            isAuthed: true,
            user: { ...user, lastLogin: new Date().toISOString() },
          })
          return true
        }
        return false
      },

      logout: () => set({ isAuthed: false }),

      changePassword: async (oldPwd, newPwd) => {
        const user = get().user
        if (!user) return false
        const oldHash = await hashPassword(oldPwd)
        if (oldHash !== user.passwordHash) return false
        const newHash = await hashPassword(newPwd)
        set({ user: { ...user, passwordHash: newHash } })
        return true
      },

      changeUsername: async (newUsername, currentPwd) => {
        const user = get().user
        if (!user) return false
        const hash = await hashPassword(currentPwd)
        if (hash !== user.passwordHash) return false
        set({ user: { ...user, username: newUsername.trim() } })
        return true
      },

      setDisplayName: (name) => {
        const user = get().user
        if (!user) return
        set({ user: { ...user, displayName: name } })
      },
    }),
    {
      name: 'giot-hesabdari-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
)
