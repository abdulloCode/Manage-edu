import { useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getMyAttendance } from '../../api/attendance'
import { PageShell, LoadingState, ErrorState, EmptyState } from '../../components/PageShell'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

/* ── helpers ── */

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('uz-UZ')
}

function monthKey(r) { return r.date ? r.date.slice(0, 7) : 'unknown' }
function monthLabel(key) {
  const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
  if (!key || key === 'unknown') return "Noma'lum oy"
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`
}

const STATUS_CFG = {
  present: { label: 'Keldi',      cls: 'badge-success' },
  absent:  { label: 'Kelmadi',    cls: 'badge-error'   },
  late:    { label: 'Kech keldi', cls: 'badge-warning' },
  excused: { label: 'Sababli',    cls: 'badge-info'    },
}

/* ── Main ── */

export default function Attendance() {
  const { data, loading, error } = useFetch(getMyAttendance)
  const records = Array.isArray(data) ? data : []

  const total   = records.length
  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const late    = records.filter(r => r.status === 'late').length
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0

  const grouped = useMemo(() => {
    const map = {}
    records.forEach(r => {
      const k = monthKey(r)
      if (!map[k]) map[k] = []
      map[k].push(r)
    })
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({ key, label: monthLabel(key), items }))
  }, [records])

  const flat = useMemo(() =>
    grouped.flatMap(g => [{ __header: true, key: g.key, label: g.label, count: g.items.length }, ...g.items]),
    [grouped],
  )

  const { visible, sentinelRef, hasMore, shown } = useInfiniteScroll(flat, 40)

  return (
    <PageShell title="Davomat" subtitle="Dars qatnashuvlari tarixi">

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} />}
      {!loading && !error && records.length === 0 && <EmptyState message="Davomat ma'lumotlari topilmadi" />}

      {!loading && !error && records.length > 0 && (
        <>
          {/* stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Davomat',  value: `${rate}%`,  sub: `${total} ta dars` },
              { label: 'Keldi',    value: present,      sub: 'ta'              },
              { label: 'Kelmadi',  value: absent,       sub: 'ta'              },
              { label: 'Kech',     value: late,         sub: 'ta'              },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100">
                <p className="text-xl font-black text-gray-800 tabular-nums">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* table */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase bg-base-200/50">
                    <th>Sana</th>
                    <th>Guruh</th>
                    <th>Dars</th>
                    <th>Izoh</th>
                    <th className="text-right">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => {
                    if (item.__header) {
                      return (
                        <tr key={`h-${item.key}`} className="bg-base-200/40">
                          <td colSpan={4} className="py-2">
                            <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">
                              {item.label}
                            </span>
                          </td>
                          <td className="text-right py-2">
                            <span className="text-xs text-base-content/40">{item.count} ta</span>
                          </td>
                        </tr>
                      )
                    }

                    const r   = item
                    const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.excused

                    return (
                      <tr key={r.id ?? r._id} className="hover">
                        <td className="text-sm whitespace-nowrap">{fmtDate(r.date)}</td>
                        <td className="text-sm text-base-content/60">
                          {r.group?.name ?? r.group ?? '—'}
                        </td>
                        <td className="text-sm text-base-content/60">
                          {r.lesson?.title ?? r.lesson ?? '—'}
                        </td>
                        <td className="text-sm text-base-content/40 max-w-xs truncate">
                          {r.note ?? '—'}
                        </td>
                        <td className="text-right">
                          <span className={`badge badge-sm ${cfg.cls}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-base-200">
              <span className="text-xs text-base-content/40">{Math.min(shown, total)} / {total} ta yozuv</span>
              {hasMore && <span className="text-xs text-primary animate-pulse">Yuklanmoqda…</span>}
            </div>
            <div ref={sentinelRef} className="h-1" />
          </div>
        </>
      )}
    </PageShell>
  )
}
