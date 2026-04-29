import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { getMyTeacherGroups } from '../../api/teachers'
import { PageShell, LoadingState, ErrorState, EmptyState } from '../../components/PageShell'

const STATUS_STYLE = {
  active:   { dot: 'bg-success', text: 'text-success',   label: 'Active' },
  inactive: { dot: 'bg-warning', text: 'text-warning',   label: 'Inactive' },
  archived: { dot: 'bg-base-content/30', text: 'text-base-content/40', label: 'Archived' },
}

export default function MyGroups() {
  const { data, loading, error } = useFetch(getMyTeacherGroups)
  const groups = Array.isArray(data) ? data : []
  const navigate = useNavigate()

  return (
    <PageShell
      title="My Groups"
      subtitle={loading ? '' : `${groups.length} group${groups.length !== 1 ? 's' : ''} assigned`}
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && groups.length === 0 && (
        <EmptyState message="No groups assigned yet" />
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.map((g) => {
            const s = STATUS_STYLE[g.status] ?? STATUS_STYLE.active
            const used = g.currentStudents ?? g.students?.length ?? 0
            const max  = g.maxStudents ?? g.capacity ?? 0
            const pct  = max > 0 ? Math.round((used / max) * 100) : 0
            const barColor = pct >= 90 ? 'bg-error' : pct >= 70 ? 'bg-warning' : 'bg-success'

            return (
              <button
                key={g.id}
                onClick={() => navigate(`/teacher/groups/${g.id}`)}
                className="w-full text-left rounded-2xl bg-base-100 border border-base-200 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base-content text-sm">{g.name}</h3>
                        <span className={`flex items-center gap-1 text-xs font-medium ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </div>
                      {g.course && (
                        <p className="text-xs text-base-content/50 mt-0.5 truncate">
                          {g.course.title ?? g.course.name}
                          {g.course.duration ? ` · ${g.course.duration}` : ''}
                        </p>
                      )}
                      {g.schedule && (
                        <p className="text-xs text-base-content/40 mt-0.5">
                          {Array.isArray(g.schedule.days) ? g.schedule.days.join(', ') : g.schedule.days}
                          {g.schedule.fromHour && g.schedule.toHour && ` · ${g.schedule.fromHour}–${g.schedule.toHour}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: capacity + arrow */}
                  <div className="flex items-center gap-4 shrink-0">
                    {max > 0 && (
                      <div className="hidden sm:flex flex-col items-end gap-1.5 min-w-[80px]">
                        <span className="text-xs text-base-content/40">
                          {used} / {max} students
                        </span>
                        <div className="w-20 h-1.5 rounded-full bg-base-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-base-content/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
