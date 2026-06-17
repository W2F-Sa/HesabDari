import { useState } from 'react'
import { useAuth } from '@/store/useAuth'
import { useStore } from '@/store/useStore'
import { Lock, User, LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'

export default function Login() {
  const login = useAuth((s) => s.login)
  const toast = useStore((s) => s.toast)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const ok = await login(username, password)
    setLoading(false)
    if (!ok) toast('نام کاربری یا رمز عبور نادرست است', 'error')
    else toast('ورود موفق', 'success')
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass-card p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <CompanyLogo size={72} />
            <div>
              <h1 className="text-2xl font-extrabold">ماهان الکترونیک پرنیا</h1>
              <p className="text-sm text-muted">سامانه جامع حسابداری و انبارداری GIoT</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">نام کاربری</label>
              <div className="relative">
                <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="glass-input pr-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">رمز عبور</label>
              <div className="relative">
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={show ? 'text' : 'password'}
                  className="glass-input px-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <LogIn size={18} />
              {loading ? 'در حال ورود…' : 'ورود به سامانه'}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-2xl bg-brand-500/10 p-3 text-xs leading-6 text-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-500" />
            <span>
              اطلاعات ورود پیش‌فرض: نام کاربری <b>admin</b> و رمز عبور{' '}
              <b dir="ltr">K9m#Pt4xQ@2w</b>. پس از ورود حتماً از بخش تنظیمات رمز خود را تغییر دهید.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
