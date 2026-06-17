import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { RateSource, UsdtRate, CurrencyRate } from '@/types'

/**
 * دریافت نرخ لحظه‌ای تتر (USDT) از ۵ منبع و نرخ یوان (CNY).
 * تمام مقادیر نهایی به «تومان» نرمال‌سازی می‌شوند.
 */

const num = (v: unknown): number => {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v ?? '').replace(/[,٬\s]/g, ''))
  return isNaN(n) ? 0 : n
}

// منابعی که همیشه قیمت را به ریال می‌دهند (نوبیتکس، TGJU) همیشه تقسیم بر ۱۰
const alwaysRial = (v: number) => Math.round(v / 10)

interface FetchResult {
  source: RateSource
  cny?: number // تومان
}

async function jget(url: string, ms = 9000): Promise<any> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(String(res.status))
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

const now = () => new Date().toISOString()
const failed = (key: string, name: string): RateSource => ({
  key,
  name,
  buy: 0,
  sell: 0,
  ok: false,
  updatedAt: now(),
})

async function fetchNobitex(): Promise<FetchResult> {
  try {
    const d = await jget('https://apiv2.nobitex.ir/v2/orderbook/USDTIRT')
    const last = alwaysRial(num(d.lastTradePrice))
    const ask = alwaysRial(num(d.asks?.[0]?.[0])) || last
    const bid = alwaysRial(num(d.bids?.[0]?.[0])) || last
    if (!last) throw new Error('no price')
    return { source: { key: 'nobitex', name: 'نوبیتکس', buy: bid, sell: ask || last, ok: true, updatedAt: now() } }
  } catch {
    return { source: failed('nobitex', 'نوبیتکس') }
  }
}

async function fetchTetherland(): Promise<FetchResult> {
  try {
    const d = await jget('https://api.tetherland.com/currencies')
    const u = d?.data?.currencies?.USDT
    const sell = Math.round(num(u?.sell_price ?? u?.price))
    const buy = Math.round(num(u?.buy_price ?? u?.price))
    if (!sell) throw new Error('no price')
    return { source: { key: 'tetherland', name: 'تترلند', buy: buy || sell, sell, ok: true, updatedAt: now() } }
  } catch {
    return { source: failed('tetherland', 'تترلند') }
  }
}

async function fetchBitpin(): Promise<FetchResult> {
  try {
    const d = await jget('https://api.bitpin.org/v1/mkt/markets/')
    const m = (d?.results ?? []).find(
      (x: any) => x?.currency1?.code === 'USDT' && (x?.currency2?.code === 'IRT' || x?.currency2?.code === 'TMN'),
    )
    const price = Math.round(num(m?.price))
    if (!price) throw new Error('no price')
    return { source: { key: 'bitpin', name: 'بیت‌پین', buy: price, sell: price, ok: true, updatedAt: now() } }
  } catch {
    return { source: failed('bitpin', 'بیت‌پین') }
  }
}

async function fetchExir(): Promise<FetchResult> {
  try {
    const d = await jget('https://api.exir.io/v2/tickers')
    const t = d?.['usdt-irt']
    const sell = Math.round(num(t?.last ?? t?.close))
    const buy = Math.round(num(t?.open ?? t?.last))
    if (!sell) throw new Error('no price')
    return { source: { key: 'exir', name: 'اکسیر', buy: buy || sell, sell, ok: true, updatedAt: now() } }
  } catch {
    return { source: failed('exir', 'اکسیر') }
  }
}

async function fetchTgju(): Promise<FetchResult> {
  for (const host of ['call2', 'call3', 'call4', 'call1', 'call5']) {
    try {
      const d = await jget(`https://${host}.tgju.org/ajax.json`, 8000)
      const c = d?.current
      const tether = alwaysRial(num(c?.['crypto-tether-irr']?.p))
      const cny = alwaysRial(num(c?.['price_cny']?.p))
      if (!tether) continue
      return {
        source: { key: 'tgju', name: 'TGJU (بازار آزاد)', buy: tether, sell: tether, ok: true, updatedAt: now() },
        cny: cny || undefined,
      }
    } catch {
      continue
    }
  }
  return { source: failed('tgju', 'TGJU (بازار آزاد)') }
}

function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

export function useRates() {
  const setUsdtRate = useStore((s) => s.setUsdtRate)
  const setRateSources = useStore((s) => s.setRateSources)
  const setCnyRate = useStore((s) => s.setCnyRate)
  const usdtRate = useStore((s) => s.usdtRate)
  const rateSources = useStore((s) => s.rateSources)
  const cnyRate = useStore((s) => s.cnyRate)
  const toast = useStore((s) => s.toast)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(
    async (silent = false) => {
      setLoading(true)
      const results = await Promise.all([
        fetchNobitex(),
        fetchTetherland(),
        fetchBitpin(),
        fetchExir(),
        fetchTgju(),
      ])
      setLoading(false)

      const sources = results.map((r) => r.source)
      setRateSources(sources)

      const okSources = sources.filter((s) => s.ok && s.sell > 0)
      const cny = results.find((r) => r.cny)?.cny

      if (cny) {
        setCnyRate({ price: cny, updatedAt: now(), source: 'TGJU' })
      }

      if (okSources.length) {
        const sell = median(okSources.map((s) => s.sell))
        const buy = median(okSources.map((s) => s.buy).filter((b) => b > 0)) || sell
        const rate: UsdtRate = {
          buy,
          sell,
          updatedAt: now(),
          source: `میانگین ${okSources.length} منبع`,
        }
        setUsdtRate(rate)
        if (!silent) toast(`نرخ تتر از ${okSources.length} منبع بروزرسانی شد`, 'success')
        return true
      }

      if (!silent) toast('عدم دسترسی به منابع نرخ؛ می‌توانید دستی وارد کنید', 'warning')
      return false
    },
    [setUsdtRate, setRateSources, setCnyRate, toast],
  )

  useEffect(() => {
    const stale = !usdtRate || Date.now() - new Date(usdtRate.updatedAt).getTime() > 15 * 60 * 1000
    if (stale) refresh(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { refresh, loading, usdtRate, rateSources, cnyRate }
}

// سازگاری با کد قبلی
export const useUsdtRate = useRates
