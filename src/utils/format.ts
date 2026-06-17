import type { CurrencyUnit } from '@/types'

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** تبدیل ارقام لاتین به فارسی */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

/** تبدیل ارقام فارسی/عربی به لاتین (برای ورودی‌ها) */
export function toEnDigits(input: string): string {
  if (!input) return input
  return input
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/** جداکننده هزارگان با ارقام فارسی */
export function formatNumber(value: number, fa = true): string {
  if (value === null || value === undefined || isNaN(value)) value = 0
  const fixed = Math.round((value + Number.EPSILON) * 100) / 100
  const parts = fixed.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
  const out = parts.join('/')
  return fa ? toFaDigits(out) : out
}

export const CURRENCY_LABEL: Record<CurrencyUnit, string> = {
  IRR: 'ریال',
  IRT: 'تومان',
  USDT: 'تتر',
  USD: 'دلار',
  EUR: 'یورو',
}

/** نمایش مبلغ با واحد. مقدار پایه همیشه ریال است. */
export function formatMoney(
  amountRial: number,
  unit: CurrencyUnit = 'IRR',
  withLabel = true,
): string {
  let value = amountRial
  if (unit === 'IRT') value = amountRial / 10
  const num = formatNumber(value)
  return withLabel ? `${num} ${CURRENCY_LABEL[unit]}` : num
}

/** تبدیل مبلغ ریالی به تتر */
export function rialToUsdt(amountRial: number, usdtRateToman: number): number {
  if (!usdtRateToman) return 0
  const toman = amountRial / 10
  return toman / usdtRateToman
}

/** تبدیل عدد به حروف فارسی (برای فاکتور رسمی) */
const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const TEENS = [
  'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده',
]
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = [
  '', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد',
]
const SCALE = ['', ' هزار', ' میلیون', ' میلیارد', ' بیلیون']

function threeDigitToWords(n: number): string {
  const parts: string[] = []
  const h = Math.floor(n / 100)
  const rem = n % 100
  if (h > 0) parts.push(HUNDREDS[h])
  if (rem >= 10 && rem < 20) {
    parts.push(TEENS[rem - 10])
  } else {
    const t = Math.floor(rem / 10)
    const o = rem % 10
    if (t > 0) parts.push(TENS[t])
    if (o > 0) parts.push(ONES[o])
  }
  return parts.join(' و ')
}

export function numberToWords(num: number): string {
  num = Math.floor(Math.abs(num))
  if (num === 0) return 'صفر'
  const groups: number[] = []
  while (num > 0) {
    groups.push(num % 1000)
    num = Math.floor(num / 1000)
  }
  const words: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue
    words.push(threeDigitToWords(groups[i]) + SCALE[i])
  }
  return words.join(' و ')
}

export function moneyToWords(amountRial: number, unit: CurrencyUnit = 'IRR'): string {
  let value = amountRial
  let label = 'ریال'
  if (unit === 'IRT') {
    value = amountRial / 10
    label = 'تومان'
  }
  return `${numberToWords(value)} ${label}`
}

export function percent(value: number): string {
  return `${toFaDigits(value)}٪`
}
