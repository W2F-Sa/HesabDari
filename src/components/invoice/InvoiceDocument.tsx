import type { Company, Invoice, Party, UsdtRate } from '@/types'
import { calcInvoice, calcItem } from '@/utils/invoice'
import { formatMoney, moneyToWords, toFaDigits, percent, rialToUsdt, formatNumber } from '@/utils/format'
import { toJalali } from '@/utils/date'

export interface DocProps {
  invoice: Invoice
  company: Company
  party?: Party
  usdtRate?: UsdtRate | null
}

const typeTitle: Record<string, string> = {
  sale: 'فاکتور فروش',
  purchase: 'فاکتور خرید',
  proforma: 'پیش‌فاکتور',
  return: 'فاکتور برگشت',
}

function Logo({ company }: { company: Company }) {
  if (company.logo)
    return <img src={company.logo} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'linear-gradient(135deg,#59a0ff,#1448e1)',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 900,
        fontSize: 18,
      }}
    >
      GIoT
    </div>
  )
}

/** قالب مدرن - رنگی و شیک */
function ModernTemplate({ invoice, company, party, usdtRate }: DocProps) {
  const c = calcInvoice(invoice)
  const unit = invoice.currency
  return (
    <div style={{ background: '#fff', color: '#0f172a', padding: 32, fontSize: 13 }}>
      <div
        style={{
          background: 'linear-gradient(135deg,#327bff,#1448e1)',
          borderRadius: 20,
          padding: 24,
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 8 }}>
            <Logo company={company} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{company.name}</div>
            <div style={{ opacity: 0.9, fontSize: 12 }}>{company.slogan}</div>
            <div style={{ opacity: 0.8, fontSize: 11, marginTop: 4 }} dir="ltr">
              {company.website} • {company.phone}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{typeTitle[invoice.type]}</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>شماره: {invoice.number}</div>
          <div style={{ fontSize: 13 }}>تاریخ: {toJalali(invoice.date)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
        <PartyBox party={party} title={invoice.type === 'purchase' ? 'فروشنده' : 'خریدار'} />
        <div style={{ flex: 1, background: '#f8fafc', borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#327bff' }}>اطلاعات فاکتور</div>
          <Row label="نوع" value={typeTitle[invoice.type]} />
          {invoice.dueDate && <Row label="سررسید" value={toJalali(invoice.dueDate)} />}
          {invoice.isOfficial && <Row label="نوع فاکتور" value="رسمی (مالیاتی)" />}
          {invoice.taxId && <Row label="شماره مالیاتی" value={invoice.taxId} />}
        </div>
      </div>

      <ItemsTable invoice={invoice} accent="#327bff" />

      <Totals invoice={invoice} calc={c} usdtRate={usdtRate} accent="#327bff" />

      <WordsAndNotes invoice={invoice} payable={c.payable} unit={unit} />
      <Footer company={company} />
    </div>
  )
}

/** قالب کلاسیک - رسمی با کادر */
function ClassicTemplate({ invoice, company, party, usdtRate }: DocProps) {
  const c = calcInvoice(invoice)
  const unit = invoice.currency
  return (
    <div style={{ background: '#fff', color: '#111', padding: 32, fontSize: 13 }}>
      <div style={{ textAlign: 'center', borderBottom: '3px double #333', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
          <Logo company={company} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{company.name}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{company.address}</div>
          </div>
        </div>
        <h2 style={{ marginTop: 12, fontSize: 18 }}>{typeTitle[invoice.type]}</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
        <div>شماره فاکتور: <b>{invoice.number}</b></div>
        <div>تاریخ: <b>{toJalali(invoice.date)}</b></div>
        {invoice.dueDate && <div>سررسید: <b>{toJalali(invoice.dueDate)}</b></div>}
      </div>

      <div style={{ border: '1px solid #999', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <b>مشخصات طرف حساب:</b> {party?.name ?? 'مهمان'}
        {party?.company && ` - ${party.company}`}
        {party?.mobile && ` - تلفن: ${party.mobile}`}
        {party?.address && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{party.address}</div>}
      </div>

      <ItemsTable invoice={invoice} accent="#333" bordered />
      <Totals invoice={invoice} calc={c} usdtRate={usdtRate} accent="#333" />
      <WordsAndNotes invoice={invoice} payable={c.payable} unit={unit} />
      <Footer company={company} />
    </div>
  )
}

/** قالب مینیمال - ساده و تمیز */
function MinimalTemplate({ invoice, company, party, usdtRate }: DocProps) {
  const c = calcInvoice(invoice)
  const unit = invoice.currency
  return (
    <div style={{ background: '#fff', color: '#0f172a', padding: 36, fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{typeTitle[invoice.type]}</div>
          <div style={{ color: '#64748b', marginTop: 4 }}>#{invoice.number}</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700 }}>{company.name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }} dir="ltr">{company.phone}</div>
          <div style={{ fontSize: 11, color: '#64748b' }} dir="ltr">{company.website}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 20 }}>
        <div>به: <b style={{ color: '#0f172a' }}>{party?.name ?? 'مهمان'}</b></div>
        <div>تاریخ: <b style={{ color: '#0f172a' }}>{toJalali(invoice.date)}</b></div>
      </div>
      <ItemsTable invoice={invoice} accent="#0f172a" minimal />
      <Totals invoice={invoice} calc={c} usdtRate={usdtRate} accent="#0f172a" />
      <WordsAndNotes invoice={invoice} payable={c.payable} unit={unit} />
    </div>
  )
}

/** قالب رسمی - مطابق سامانه مودیان مالیاتی */
function OfficialTemplate({ invoice, company, party, usdtRate }: DocProps) {
  const c = calcInvoice(invoice)
  const unit = invoice.currency
  return (
    <div style={{ background: '#fff', color: '#111', padding: 24, fontSize: 12 }}>
      <div style={{ border: '2px solid #1448e1', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #1448e1', background: '#eef2ff' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Logo company={company} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{company.name}</div>
              <div style={{ fontSize: 10, color: '#444' }}>
                شناسه ملی: {company.nationalId} | کد اقتصادی: {company.economicCode}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>صورتحساب فروش کالا و خدمات</div>
            <div style={{ fontSize: 10 }}>(فاکتور رسمی مالیاتی)</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            <tr>
              <td style={tdCell}><b>شماره فاکتور:</b> {invoice.number}</td>
              <td style={tdCell}><b>تاریخ:</b> {toJalali(invoice.date)}</td>
              <td style={tdCell}><b>شماره مالیاتی:</b> {invoice.taxId || '—'}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ padding: 8, background: '#f8fafc', fontWeight: 700, fontSize: 11 }}>مشخصات خریدار</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            <tr>
              <td style={tdCell}><b>نام:</b> {party?.name ?? '—'}</td>
              <td style={tdCell}><b>{party?.isLegal ? 'شناسه ملی' : 'کد ملی'}:</b> {party?.nationalId || '—'}</td>
              <td style={tdCell}><b>کد اقتصادی:</b> {party?.economicCode || '—'}</td>
            </tr>
            <tr>
              <td style={tdCell} colSpan={2}><b>نشانی:</b> {party?.address || '—'}</td>
              <td style={tdCell}><b>کدپستی:</b> {party?.postalCode || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ItemsTable invoice={invoice} accent="#1448e1" bordered official />
      <Totals invoice={invoice} calc={c} usdtRate={usdtRate} accent="#1448e1" />
      <WordsAndNotes invoice={invoice} payable={c.payable} unit={unit} />
      <Footer company={company} official />
    </div>
  )
}

const tdCell: React.CSSProperties = { border: '1px solid #c7d2fe', padding: '6px 8px' }

function PartyBox({ party, title }: { party?: Party; title: string }) {
  return (
    <div style={{ flex: 1, background: '#f8fafc', borderRadius: 16, padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#327bff' }}>{title}</div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{party?.name ?? 'مهمان'}</div>
      {party?.company && <div style={{ color: '#64748b', fontSize: 12 }}>{party.company}</div>}
      {party?.mobile && <div style={{ color: '#64748b', fontSize: 12 }} dir="ltr">{party.mobile}</div>}
      {party?.address && <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{party.address}</div>}
      {party?.nationalId && <div style={{ color: '#64748b', fontSize: 11 }}>کد/شناسه ملی: {party.nationalId}</div>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function ItemsTable({
  invoice,
  accent,
  bordered,
  minimal,
  official,
}: {
  invoice: Invoice
  accent: string
  bordered?: boolean
  minimal?: boolean
  official?: boolean
}) {
  const border = bordered ? '1px solid #cbd5e1' : minimal ? 'none' : '1px solid #e2e8f0'
  const th: React.CSSProperties = {
    background: minimal ? 'transparent' : accent === '#0f172a' ? '#f1f5f9' : `${accent}15`,
    color: minimal ? '#64748b' : accent,
    padding: '10px 8px',
    fontWeight: 700,
    fontSize: 11,
    border,
    textAlign: 'right',
    borderBottom: minimal ? '2px solid #e2e8f0' : border,
  }
  const td: React.CSSProperties = { padding: '8px', border, fontSize: 12 }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
      <thead>
        <tr>
          <th style={{ ...th, width: 36 }}>ردیف</th>
          <th style={th}>شرح کالا / خدمات</th>
          <th style={{ ...th, width: 60 }}>تعداد</th>
          <th style={{ ...th, width: 90 }}>فی واحد</th>
          {official && <th style={{ ...th, width: 70 }}>تخفیف</th>}
          {official && <th style={{ ...th, width: 60 }}>مالیات</th>}
          <th style={{ ...th, width: 100 }}>مبلغ کل</th>
        </tr>
      </thead>
      <tbody>
        {invoice.items.map((item, i) => {
          const ic = calcItem(item)
          return (
            <tr key={item.id}>
              <td style={{ ...td, textAlign: 'center' }}>{toFaDigits(i + 1)}</td>
              <td style={td}>{item.description}</td>
              <td style={{ ...td, textAlign: 'center' }}>
                {toFaDigits(item.quantity)} {item.unit}
              </td>
              <td style={{ ...td, textAlign: 'left' }}>{formatMoney(item.unitPrice, invoice.currency, false)}</td>
              {official && <td style={{ ...td, textAlign: 'left' }}>{formatMoney(ic.discount, invoice.currency, false)}</td>}
              {official && <td style={{ ...td, textAlign: 'left' }}>{formatMoney(ic.tax, invoice.currency, false)}</td>}
              <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{formatMoney(ic.total, invoice.currency, false)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Totals({
  invoice,
  calc,
  usdtRate,
  accent,
}: {
  invoice: Invoice
  calc: ReturnType<typeof calcInvoice>
  usdtRate?: UsdtRate | null
  accent: string
}) {
  const unit = invoice.currency
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
      <div style={{ width: 320, marginRight: 'auto' }}>
        <TotalRow label="جمع کل" value={formatMoney(calc.subtotal, unit, false)} />
        {calc.totalDiscount > 0 && <TotalRow label="تخفیف" value={`(${formatMoney(calc.totalDiscount, unit, false)})`} />}
        {calc.tax > 0 && <TotalRow label="مالیات بر ارزش افزوده" value={formatMoney(calc.tax, unit, false)} />}
        {calc.shipping > 0 && <TotalRow label="هزینه حمل" value={formatMoney(calc.shipping, unit, false)} />}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 12px',
            marginTop: 6,
            background: `${accent}12`,
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 15,
            color: accent,
          }}
        >
          <span>مبلغ قابل پرداخت</span>
          <span>{formatMoney(calc.payable, unit, false)} {unit === 'IRT' ? 'تومان' : 'ریال'}</span>
        </div>
        {usdtRate && (
          <div style={{ fontSize: 11, color: '#64748b', textAlign: 'left', marginTop: 6 }} dir="ltr">
            ≈ {formatNumber(rialToUsdt(calc.payable, usdtRate.sell))} USDT
          </div>
        )}
        {calc.paid > 0 && (
          <>
            <TotalRow label="پرداخت شده" value={formatMoney(calc.paid, unit, false)} />
            <TotalRow label="مانده" value={formatMoney(calc.remaining, unit, false)} />
          </>
        )}
      </div>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', fontSize: 13 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function WordsAndNotes({ invoice, payable, unit }: { invoice: Invoice; payable: number; unit: any }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
        مبلغ به حروف: <b>{moneyToWords(payable, unit)}</b>
      </div>
      {invoice.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>توضیحات: {invoice.note}</div>}
      {invoice.terms && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{invoice.terms}</div>}
    </div>
  )
}

function Footer({ company, official }: { company: Company; official?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ textAlign: 'center', fontSize: 12 }}>
        <div style={{ marginBottom: 40, color: '#64748b' }}>مهر و امضای فروشنده</div>
        {company.stamp && <img src={company.stamp} alt="stamp" style={{ width: 80, opacity: 0.8 }} />}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        <div style={{ marginBottom: 40 }}>مهر و امضای خریدار</div>
      </div>
      {official && (
        <div style={{ fontSize: 10, color: '#94a3b8', alignSelf: 'flex-end', textAlign: 'left' }}>
          {company.bankName} - شبا: {company.iban}
        </div>
      )}
    </div>
  )
}

export default function InvoiceDocument(props: DocProps) {
  switch (props.invoice.template) {
    case 'classic':
      return <ClassicTemplate {...props} />
    case 'minimal':
      return <MinimalTemplate {...props} />
    case 'official':
      return <OfficialTemplate {...props} />
    case 'modern':
    default:
      return <ModernTemplate {...props} />
  }
}

export const TEMPLATES = [
  { id: 'modern', name: 'مدرن (رنگی)' },
  { id: 'classic', name: 'کلاسیک (رسمی)' },
  { id: 'minimal', name: 'مینیمال (ساده)' },
  { id: 'official', name: 'رسمی مالیاتی (مودیان)' },
]
