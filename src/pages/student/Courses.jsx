import { useFetch } from '../../hooks/useFetch'
import { getAllCourses } from '../../api/courses'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { BookOpen, Clock, Tag, XCircle } from 'lucide-react'

const fmt = (n) => Number(n ?? 0).toLocaleString('uz-UZ')

const STATUS_CFG = {
  active:   { label: 'Faol',       bg: 'bg-emerald-100', text: 'text-emerald-700' },
  inactive: { label: 'Nofaol',     bg: 'bg-gray-100',    text: 'text-gray-500'    },
  archived: { label: 'Arxivlandi', bg: 'bg-gray-100',    text: 'text-gray-400'    },
}

const COLORS = [
  'bg-violet-100 text-violet-600',
  'bg-sky-100 text-sky-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-indigo-100 text-indigo-600',
]

export default function Courses() {
  const { data, loading, error } = useFetch(getAllCourses)
  const courses = Array.isArray(data) ? data : (data?.data ?? [])

  const { visible, sentinelRef, hasMore, shown } = useInfiniteScroll(courses, 20)

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-10">
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        <div className="flex items-center justify-between px-1">
          <h1 className="text-2xl font-bold text-gray-900">Kurslar</h1>
          {!loading && (
            <span className="text-[13px] text-gray-400">{courses.length} ta kurs</span>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-10 text-center">
            <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Yuklanmoqda…</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-3xl p-8 text-center">
            <XCircle className="w-8 h-8 text-rose-300 mx-auto mb-2" />
            <p className="text-rose-500 font-medium text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium text-sm">Kurslar mavjud emas</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="space-y-3">
            {visible.map((c, i) => {
              const status = STATUS_CFG[c.status] ?? STATUS_CFG.active
              const color  = COLORS[i % COLORS.length]
              const price  = Number(c.price ?? c.monthlyFee ?? 0)

              return (
                <div key={c.id ?? c._id}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">

                  {/* icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                    <BookOpen className={`w-6 h-6 ${color.split(' ')[1]}`} />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[15px] font-semibold text-gray-800 leading-snug">{c.title ?? c.name}</p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {c.description && (
                      <p className="text-[12px] text-gray-400 line-clamp-2 mb-2">{c.description}</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      {c.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[12px] text-gray-500 font-medium">{c.duration} oy</span>
                        </div>
                      )}
                      {c.category && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[12px] text-gray-500 font-medium">{c.category}</span>
                        </div>
                      )}
                      <div className="ml-auto">
                        {price === 0 ? (
                          <span className="text-[13px] font-bold text-emerald-600">Bepul</span>
                        ) : (
                          <span className="text-[13px] font-bold text-gray-700 tabular-nums">
                            {fmt(price)} <span className="text-[11px] text-gray-400 font-normal">UZS/oy</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* syllabus preview */}
                    {c.syllabus && c.syllabus.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.syllabus.slice(0, 4).map((s, si) => (
                          <span key={si}
                            className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                        {c.syllabus.length > 4 && (
                          <span className="text-[11px] text-gray-400 px-1">+{c.syllabus.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-[12px] text-gray-400">{shown} / {courses.length} ta kurs</span>
              {hasMore && <span className="text-[12px] text-violet-500 animate-pulse">Yuklanmoqda…</span>}
            </div>
            <div ref={sentinelRef} className="h-1" />
          </div>
        )}

      </div>
    </div>
  )
}
