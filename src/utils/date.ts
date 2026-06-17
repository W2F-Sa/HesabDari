import jalaali from 'jalaali-js'
import { toFaDigits } from './format'

const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

function pad(n: number): string {
  return n < 10 ? `۰${toFaDigits(n)}` : toFaDigits(n)
}

/** تبدیل ISO به تاریخ شمسی خوانا */
export function toJalali(iso: string | Date, withTime = false): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return '-'
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  let out = `${toFaDigits(jy)}/${pad(jm)}/${pad(jd)}`
  if (withTime) {
    out += ` - ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return out
}

/** تاریخ شمسی کامل با نام روز و ماه */
export function toJalaliLong(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return '-'
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const weekday = WEEKDAYS[d.getDay()]
  return `${weekday} ${toFaDigits(jd)} ${MONTHS[jm - 1]} ${toFaDigits(jy)}`
}

export function jalaliMonthName(jm: number): string {
  return MONTHS[jm - 1] ?? ''
}

/** تبدیل تاریخ شمسی (رشته YYYY/MM/DD) به ISO */
export function jalaliToISO(jStr: string): string | null {
  const parts = jStr.split(/[\/\-]/).map((p) => parseInt(p.replace(/[^\d]/g, ''), 10))
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const [jy, jm, jd] = parts
  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return null
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd, 12, 0, 0).toISOString()
}

/** اجزای تاریخ جلالی امروز */
export function todayJalali(): { jy: number; jm: number; jd: number } {
  const d = new Date()
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function isoToJalaliInput(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
}

/** اختلاف روز بین دو تاریخ */
export function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime()
  const d2 = new Date(b).getTime()
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

export { MONTHS as JALALI_MONTHS, WEEKDAYS as JALALI_WEEKDAYS }
