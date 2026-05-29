import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getMyHomework, getMySubmissions, submitHomework } from '../../api/homework'
import { PageShell, LoadingState, ErrorState, EmptyState } from '../../components/PageShell'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

function SubmitModal({ hw, onClose, onSubmitted }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await submitHomework(hw.id ?? hw._id, { text })
      onSubmitted()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Topshirishda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3">✕</button>
        <h3 className="font-bold text-lg mb-1">Vazifani topshirish</h3>
        <p className="text-sm text-base-content/60 mb-4">{hw.title}</p>
        {error && <div className="alert alert-error py-2 text-sm mb-3"><span>{error}</span></div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <div className="label pb-1"><span className="label-text font-medium">Javobingiz</span></div>
            <textarea
              className="textarea textarea-bordered w-full h-28 resize-none"
              placeholder="Bu yerga javobingizni yozing..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </label>
          <div className="modal-action mt-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Bekor qilish</button>
            <button type="submit" disabled={loading} className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`}>Topshirish</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}

const DEADLINE_STATUS = (deadline) => {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diff = (d - now) / (1000 * 60 * 60 * 24)
  if (diff < 0) return { label: "Muddati o'tgan", cls: 'badge-error' }
  if (diff < 2) return { label: 'Yaqinda tugaydi', cls: 'badge-warning' }
  return { label: `Muddat: ${d.toLocaleDateString('uz-UZ')}`, cls: 'badge-ghost' }
}

function HomeworkTable({ items, onSubmit }) {
  const { visible, sentinelRef, hasMore, shown } = useInfiniteScroll(items, 20)
  if (items.length === 0) return <EmptyState message="Hali vazifa berilmagan" />
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr className="text-xs text-base-content/50 uppercase bg-base-200/50">
              <th>Nomi</th>
              <th>Guruh</th>
              <th>Muddat</th>
              <th className="text-right">Amal</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((hw) => {
              const dl = DEADLINE_STATUS(hw.deadline)
              return (
                <tr key={hw.id ?? hw._id} className="hover">
                  <td>
                    <p className="font-medium text-sm">{hw.title}</p>
                    {hw.description && <p className="text-xs text-base-content/40 line-clamp-1">{hw.description}</p>}
                  </td>
                  <td className="text-sm text-base-content/60">{hw.group?.name ?? hw.group ?? '—'}</td>
                  <td>
                    {dl ? <span className={`badge badge-sm ${dl.cls}`}>{dl.label}</span> : <span className="text-base-content/30 text-xs">—</span>}
                  </td>
                  <td className="text-right">
                    <button className="btn btn-primary btn-xs" onClick={() => onSubmit(hw)}>
                      Topshirish
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-base-200">
        <span className="text-xs text-base-content/40">{shown} / {items.length} ta</span>
        {hasMore && <span className="text-xs text-primary animate-pulse">Yuklanmoqda…</span>}
      </div>
      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}

function SubmissionsTable({ items }) {
  const { visible, sentinelRef, hasMore, shown } = useInfiniteScroll(items, 20)
  if (items.length === 0) return <EmptyState message="Hali javoblar yo'q" />
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr className="text-xs text-base-content/50 uppercase bg-base-200/50">
              <th>Vazifa</th>
              <th>Topshirilgan vaqt</th>
              <th>Baho</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.id ?? s._id} className="hover">
                <td className="font-medium text-sm">{s.homework?.title ?? s.homeworkTitle ?? '—'}</td>
                <td className="text-sm text-base-content/60">
                  {s.submittedAt ? new Date(s.submittedAt).toLocaleString('uz-UZ') : '—'}
                </td>
                <td>
                  {s.grade != null
                    ? <span className="badge badge-primary badge-sm">{s.grade}</span>
                    : <span className="text-base-content/30 text-xs">Baholanmagan</span>}
                </td>
                <td>
                  <span className={`badge badge-sm ${s.status === 'graded' ? 'badge-success' : 'badge-ghost'}`}>
                    {s.status === 'graded' ? 'Baholandi' : 'Topshirildi'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-base-200">
        <span className="text-xs text-base-content/40">{shown} / {items.length} ta</span>
        {hasMore && <span className="text-xs text-primary animate-pulse">Yuklanmoqda…</span>}
      </div>
      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}

export default function HomeworkPage() {
  const [tab, setTab] = useState('assigned')
  const [submitTarget, setSubmitTarget] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: hwData, loading: hwLoading, error: hwError } = useFetch(getMyHomework, [refreshKey])
  const { data: subData, loading: subLoading, error: subError } = useFetch(getMySubmissions, [refreshKey])

  const homework    = Array.isArray(hwData)  ? hwData  : []
  const submissions = Array.isArray(subData) ? subData : []

  return (
    <PageShell title="Vazifalar" subtitle="Topshiriqlar va javoblar">
      <div role="tablist" className="tabs tabs-boxed w-fit">
        <button role="tab" className={`tab ${tab === 'assigned' ? 'tab-active' : ''}`} onClick={() => setTab('assigned')}>
          Berilgan
          {homework.length > 0 && <span className="badge badge-sm badge-primary ml-2">{homework.length}</span>}
        </button>
        <button role="tab" className={`tab ${tab === 'submissions' ? 'tab-active' : ''}`} onClick={() => setTab('submissions')}>
          Mening javoblarim
          {submissions.length > 0 && <span className="badge badge-sm ml-2">{submissions.length}</span>}
        </button>
      </div>

      {tab === 'assigned' && (
        hwLoading ? <LoadingState /> :
        hwError   ? <ErrorState message={hwError} /> :
        <HomeworkTable items={homework} onSubmit={setSubmitTarget} />
      )}
      {tab === 'submissions' && (
        subLoading ? <LoadingState /> :
        subError   ? <ErrorState message={subError} /> :
        <SubmissionsTable items={submissions} />
      )}

      {submitTarget && (
        <SubmitModal
          hw={submitTarget}
          onClose={() => setSubmitTarget(null)}
          onSubmitted={() => { setRefreshKey((k) => k + 1); setTab('submissions') }}
        />
      )}
    </PageShell>
  )
}
