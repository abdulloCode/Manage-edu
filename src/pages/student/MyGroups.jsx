import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { getMyGroups, enrollInGroup } from '../../api/groups'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { Users, BookOpen, GraduationCap, Clock, ChevronRight, UserPlus, X } from 'lucide-react'

/* ── EnrollModal ── */
function EnrollModal({ group, onClose, onEnrolled }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handle = async () => {
    setLoading(true); setError(null)
    try {
      await enrollInGroup(group._id ?? group.id)
      onEnrolled(); onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? "Xatolik yuz berdi")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">Guruhga qo'shilish</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="bg-violet-50 rounded-2xl p-4 mb-4 space-y-2">
          <p className="font-semibold text-gray-800">{group.name}</p>
          {group.course?.title && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
              <span>{group.course.title}</span>
            </div>
          )}
          {group.teacher?.name && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <GraduationCap className="w-4 h-4 text-violet-400 shrink-0" />
              <span>{group.teacher.name}</span>
            </div>
          )}
          {group.schedule?.fromHour && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-violet-400 shrink-0" />
              <span>{(group.schedule.days ?? []).join(', ')} · {group.schedule.fromHour}–{group.schedule.toHour}</span>
            </div>
          )}
        </div>

        {error && <p className="text-rose-500 text-sm text-center mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">
            Bekor
          </button>
          <button onClick={handle} disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition-colors disabled:opacity-60">
            {loading ? '...' : "Qo'shilish"}
          </button>
        </div>
      </div>
    </div>
  )
}


/* ── Main ── */
export default function MyGroups() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(getMyGroups)
  const [enrollTarget, setEnrollTarget] = useState(null)

  const groups    = Array.isArray(data) ? data : (data?.groups ?? [])
  const enrolled  = groups.filter(g => g.isEnrolled)
  const available = groups.filter(g => !g.isEnrolled && g.status === 'active')

  const { visible, sentinelRef, hasMore, shown } = useInfiniteScroll(groups, 20)

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guruhlarim</h1>
        <p className="text-sm text-gray-400 mt-0.5">Guruhlar va jadvallar</p>
      </div>

      {/* stats */}
      {!loading && !error && groups.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: groups.length,    label: 'Jami guruh' },
            { value: enrolled.length,  label: 'Faol'       },
            { value: available.length, label: "Qo'shilish" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-black text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

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

      {!loading && !error && groups.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Guruhlar mavjud emas</p>
        </div>
      )}

      {/* list */}
      {!loading && !error && groups.length > 0 && (
        <div className="space-y-2">
          {visible.map(g => {
            const gid       = g.id ?? g._id
            const isEnr     = g.isEnrolled
            const isAct     = g.status !== 'inactive' && g.status !== 'ended'
            const pct       = g.maxStudents ? Math.round((g.currentStudents / g.maxStudents) * 100) : 0
            const canEnroll = !isEnr && isAct && g.currentStudents < g.maxStudents

            return (
              <div key={gid}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  {/* icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isEnr ? 'bg-violet-100' : 'bg-gray-100'
                  }`}>
                    <Users className={`w-5 h-5 ${isEnr ? 'text-violet-500' : 'text-gray-400'}`} />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800 text-[15px] truncate">{g.name}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isEnr ? 'bg-violet-100 text-violet-600' :
                        isAct ? 'bg-emerald-100 text-emerald-600' :
                                'bg-gray-100 text-gray-400'
                      }`}>
                        {isEnr ? "Ro'yxatda" : isAct ? 'Mavjud' : 'Nofaol'}
                      </span>
                    </div>

                    {g.course?.title && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                        <BookOpen className="w-3 h-3" /> {g.course.title}
                      </p>
                    )}
                    {g.teacher?.name && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {g.teacher.name}
                        {g.schedule?.fromHour && ` · ${g.schedule.fromHour}–${g.schedule.toHour}`}
                      </p>
                    )}

                    {/* capacity */}
                    {g.maxStudents > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            pct >= 90 ? 'bg-rose-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {g.currentStudents}/{g.maxStudents}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* action */}
                  <div className="shrink-0">
                    {isEnr ? (
                      <button onClick={() => navigate(`/student/groups/${gid}`)}
                        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-violet-100 hover:text-violet-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : canEnroll ? (
                      <button onClick={() => setEnrollTarget(g)}
                        className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center hover:bg-violet-600 transition-colors">
                        <UserPlus className="w-4 h-4 text-white" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between px-1 py-2">
            <span className="text-xs text-gray-400">{shown} / {groups.length} ta guruh</span>
            {hasMore && <span className="text-xs text-violet-500 animate-pulse">Yuklanmoqda…</span>}
          </div>
          <div ref={sentinelRef} className="h-1" />
        </div>
      )}

      {enrollTarget && (
        <EnrollModal
          group={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onEnrolled={() => { refetch(); setEnrollTarget(null) }}
        />
      )}
    </div>
  )
}
