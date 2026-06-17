import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { UsdtRate } from '@/types'

/**
 * دریافت نرخ روز تتر (USDT/تومان) از صرافی‌های ایرانی.
 * مقادیر نهایی همیشه به «تومان» ذخیره می‌شوند.
 */
async function fetchFromNobitex(): Promise<UsdtRate | null> {
  try {
    const res = await fetch('https://api.nobitex.ir/v2/orderbook/USDTIRT', {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    let last = Number(data.lastTradePrice)
    if (!last || isNaN(last)) return null
    // تبدیل ریال به تومان در صورت نیاز
    if (last > 1_000_000) last = last / 10
    const bid = Number(data.bids?.[0]?.[0])
    const ask = Number(data.asks?.[0]?.[0])
    let buy = bid > 1_000_000 ? bid / 10 : bid
    let sell = ask > 1_000_000 ? ask / 10 : ask
    if (!buy) buy = last
    if (!sell) sell = last
    return {
      buy: Math.round(buy),
      sell: Math.round(sell),
      updatedAt: new Date().toISOString(),
      source: 'Nobitex',
    }
  } catch {
    return null
  }
}

async function fetchFromWallex(): Promise<UsdtRate | null> {
  try {
    const res = await fetch('https://api.wallex.ir/v1/markets', {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const symbols = data?.result?.symbols
    const usdt = symbols?.['USDTTMN'] ?? symbols?.['USDTIRT']
    const price = Number(usdt?.stats?.lastPrice ?? usdt?.stats?.bidPrice)
    if (!price || isNaN(price)) return null
    let p = price
    if (p > 1_000_000) p = p / 10
    return {
      buy: Math.round(p * 0.998),
      sell: Math.round(p),
      updatedAt: new Date().toISOString(),
      source: 'Wallex',
    }
  } catch {
    return null
  }
}

export function useUsdtRate() {
  const setUsdtRate = useStore((s) => s.setUsdtRate)
  const usdtRate = useStore((s) => s.usdtRate)
  const toast = useStore((s) => s.toast)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(
    async (silent = false) => {
      setLoading(true)
      let rate = await fetchFromNobitex()
      if (!rate) rate = await fetchFromWallex()
      setLoading(false)
      if (rate) {
        setUsdtRate(rate)
        if (!silent) toast(`نرخ تتر بروزرسانی شد (${rate.source})`, 'success')
        return true
      }
      // در صورت عدم دسترسی، نرخ پیش‌فرض تخمینی
      if (!usdtRate) {
        setUsdtRate({
          buy: 89000,
          sell: 89500,
          updatedAt: new Date().toISOString(),
          source: 'پیش‌فرض (دستی)',
        })
      }
      if (!silent)
        toast('عدم دسترسی به صرافی؛ می‌توانید نرخ را دستی وارد کنید', 'warning')
      return false
    },
    [setUsdtRate, toast, usdtRate],
  )

  useEffect(() => {
    // بروزرسانی خودکار اگر نرخ قدیمی یا موجود نیست
    const stale =
      !usdtRate ||
      Date.now() - new Date(usdtRate.updatedAt).getTime() > 30 * 60 * 1000
    if (stale) refresh(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { refresh, loading, usdtRate }
}
