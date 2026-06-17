import { useState, useEffect } from 'react'
import { toEnDigits, formatNumber } from '@/utils/format'
import clsx from 'clsx'

interface Props {
  value: number
  onChange: (v: number) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  suffix?: string
}

/** ورودی عددی با جداکننده هزارگان و پشتیبانی از ارقام فارسی */
export default function NumberInput({
  value,
  onChange,
  label,
  placeholder,
  className,
  disabled,
  suffix,
}: Props) {
  const [text, setText] = useState(value ? formatNumber(value) : '')

  useEffect(() => {
    const current = parseFloat(toEnDigits(text).replace(/[٬,\/]/g, '')) || 0
    if (current !== value) {
      setText(value ? formatNumber(value) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handle = (raw: string) => {
    const clean = toEnDigits(raw).replace(/[^\d.]/g, '')
    const num = parseFloat(clean) || 0
    setText(clean === '' ? '' : formatNumber(num))
    onChange(num)
  }

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium">{label}</span>}
      <div className="relative">
        <input
          inputMode="numeric"
          dir="ltr"
          className={clsx('glass-input text-left', suffix && 'pl-14', className)}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => handle(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}
