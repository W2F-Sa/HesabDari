import { useState, useEffect } from 'react'
import { isoToJalaliInput, jalaliToISO, todayJalali } from '@/utils/date'
import { toEnDigits } from '@/utils/format'
import { Calendar } from 'lucide-react'

interface Props {
  value: string // ISO
  onChange: (iso: string) => void
  label?: string
}

/** انتخاب تاریخ شمسی به صورت ورودی متنی YYYY/MM/DD */
export default function JalaliDatePicker({ value, onChange, label }: Props) {
  const [text, setText] = useState(value ? isoToJalaliInput(value) : '')

  useEffect(() => {
    setText(value ? isoToJalaliInput(value) : '')
  }, [value])

  const commit = (raw: string) => {
    const clean = toEnDigits(raw)
    setText(clean)
    const iso = jalaliToISO(clean)
    if (iso) onChange(iso)
  }

  const setToday = () => {
    const { jy, jm, jd } = todayJalali()
    const str = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
    commit(str)
  }

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium">{label}</span>}
      <div className="relative">
        <input
          dir="ltr"
          className="glass-input text-center"
          placeholder="۱۴۰۵/۰۱/۰۱"
          value={text}
          onChange={(e) => commit(e.target.value)}
        />
        <button
          type="button"
          onClick={setToday}
          title="امروز"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Calendar size={16} />
        </button>
      </div>
    </label>
  )
}
