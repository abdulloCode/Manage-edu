import { useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getMyPayments } from '../../api/payments'
import { useAuth } from '../../context/AuthContext'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { CreditCard, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'

/* ── helpers ── */
const fmt = (n) => Number(n ?? 0).toLocaleString('uz-UZ')
const fmtK = (n) => {
  const v = Number(n ?? 0)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${Math.round(v / 1_000)}K`
  return String(v)
}
const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

function fmtDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}, ${d.getFullYear()}`
}
function monthKey(r)  { return r.month ? r.month : r.date ? r.date.slice(0,7) : 'unknown' }
function monthLabel(key) {
  if (!key || key === 'unknown') return "Noma'lum oy"
  const [y, m] = key.split('-')
  return `${MONTHS_UZ[Number(m)-1] ?? m} ${y}`
}
function belongsToUser(r, uid) {
  if (!uid) return true
  const toWho = r.toWho
  if (!toWho) return true
  return String(toWho?._id ?? toWho?.id ?? toWho) === String(uid)
}


/* ── Main ── */
export default function Payments() {
  const { user } = useAuth()
  const uid = user?._id ?? user?.id
  const { data, loading, error } = useFetch(getMyPayments)

  const records = useMemo(() => {
    const raw = Array.isArray(data) ? data : (data?.payments ?? data?.data ?? data?.records ?? [])
    return [...raw.filter(r => belongsToUser(r, uid))]
      .sort((a,b) => (b.date??b.month??'').localeCompare(a.date??a.month??''))
  }, [data, uid])

  const totalPaid = useMemo(
    () => records.filter(r => r.dk==='debit').reduce((s,r) => s+Number(r.amount??0), 0), [records])
  const totalDebt = useMemo(
    () => records.filter(r => r.dk==='credit').reduce((s,r) => s+Number(r.amount??0), 0), [records])

  const grouped = useMemo(() => {
    const map = {}
    records.forEach(r => {
      const k = monthKey(r)
      if (!map[k]) map[k] = []
      map[k].push(r)
    })
    return Object.entries(map)
      .sort((a,b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({
        key, label: monthLabel(key), items,
        total: items.filter(r=>r.dk==='debit').reduce((s,r)=>s+Number(r.amount??0),0),
      }))
  }, [records])

  const flat = useMemo(() =>
    grouped.flatMap(g => [{ __header:true, ...g }, ...g.items]), [grouped])

  const { visible, sentinelRef, hasMore, shown } = useInfiniteScroll(flat, 40)

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">To'lovlar</h1>
        <p className="text-sm text-gray-400 mt-0.5">To'lov tarixi</p>
      </div>

      {/* loading */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Yuklanmoqda…</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100">
          <p className="text-rose-500 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm font-medium">To'lov ma'lumotlari topilmadi</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (<>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Jami to'landi", value: fmtK(totalPaid), sub: 'UZS', icon: <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> },
            { label: 'Qarzdorlik',    value: fmtK(totalDebt), sub: 'UZS', icon: <ArrowUpRight  className="w-4 h-4 text-rose-400"   /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">{s.icon}</div>
                <span className="text-xs text-gray-400 font-medium">{s.label}</span>
              </div>
              <p className="text-xl font-black text-gray-800 tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* list */}
        <div className="space-y-1">
          {visible.map((item, idx) => {
            /* month header */
            if (item.__header) {
              return (
                <div key={`h-${item.key}`} className="flex items-center justify-between px-1 pt-4 pb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {item.label}
                  </span>
                  {item.total > 0 && (
                    <span className="text-xs font-bold text-violet-500">+{fmtK(item.total)} UZS</span>
                  )}
                </div>
              )
            }

            const r        = item
            const isCredit = r.dk === 'debit'
            const label    = r.type?.name ?? (isCredit ? "To'lov" : 'Qarzdorlik')
            const prev     = visible[idx-1]; const next = visible[idx+1]
            const isFirst  = !prev || prev.__header
            const isLast   = !next || next.__header

            return (
              <div key={r.id??r._id}
                className={`bg-white flex items-center gap-3.5 px-4 py-3.5 border border-gray-100
                  hover:border-violet-200 transition-all
                  ${isFirst && isLast ? 'rounded-2xl' : isFirst ? 'rounded-t-2xl' : isLast ? 'rounded-b-2xl' : ''}
                  ${!isLast ? 'border-b-0' : ''}`}>

                {/* icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isCredit ? 'bg-violet-100' : 'bg-rose-100'
                }`}>
                  {isCredit
                    ? <ArrowDownLeft className="w-4.5 h-4.5 text-violet-500" />
                    : <ArrowUpRight  className="w-4.5 h-4.5 text-rose-500" />}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-800 truncate">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.date ?? r.month)}</p>
                  {r.comment && <p className="text-xs text-gray-300 truncate mt-0.5">{r.comment}</p>}
                </div>

                {/* amount */}
                <div className="text-right shrink-0">
                  <p className={`text-[15px] font-bold tabular-nums ${isCredit ? 'text-violet-600' : 'text-rose-500'}`}>
                    {isCredit ? '+' : '−'}{fmt(r.amount)}
                  </p>
                  <p className="text-[10px] text-gray-300">UZS</p>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between px-1 py-2">
            <span className="text-xs text-gray-400">{Math.min(shown, records.length)} / {records.length} ta</span>
            {hasMore && <span className="text-xs text-violet-500 animate-pulse">Yuklanmoqda…</span>}
          </div>
          <div ref={sentinelRef} className="h-1" />
        </div>
      </>)}
    </div>
  )
}
