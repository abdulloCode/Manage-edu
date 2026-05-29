import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroupById } from '../../api/groups'
import { getMyAttendance } from '../../api/attendance'
import { getMyRatings } from '../../api/ratings'
import {
  ArrowLeft, GraduationCap, BookOpen, Clock,
  CalendarDays, Users, CheckCircle2, XCircle, Star,
  Phone, MapPin,
} from 'lucide-react'

/* ── helpers ─────────────────────────────────────────────── */

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
const DAYS_UZ   = { Du:'Du', Se:'Se', Chor:'Ch', Pay:'Pa', Ju:'Ju', Sh:'Sh', Ya:'Ya' }

function fmtDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return `${d.getDate()} ${MONTHS_UZ[d.getMonth()]} ${d.getFullYear()}`
}

const ATT_CFG = {
  present: { label:'Keldi',      bg:'bg-emerald-500', light:'bg-emerald-100', text:'text-emerald-700' },
  absent:  { label:'Kelmadi',    bg:'bg-rose-500',    light:'bg-rose-100',    text:'text-rose-700'    },
  late:    { label:'Kech keldi', bg:'bg-amber-400',   light:'bg-amber-100',   text:'text-amber-700'   },
  excused: { label:'Sababli',    bg:'bg-sky-400',     light:'bg-sky-100',     text:'text-sky-700'     },
}

function scoreBadge(score, max) {
  if (score == null) return { bg:'bg-gray-100', text:'text-gray-400', label:'—' }
  const label = max ? `${score}/${max}` : String(score)
  const pct   = max ? (score / max) * 100 : score
  if (pct >= 85) return { bg:'bg-emerald-100', text:'text-emerald-600', label }
  if (pct >= 60) return { bg:'bg-amber-100',   text:'text-amber-600',   label }
  return             { bg:'bg-rose-100',     text:'text-rose-600',    label }
}

/* ── Attendance mini-calendar ─────────────────────────────── */

function AttCalendar({ records, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const map = {}
  records.forEach(r => {
    if (!r.date) return
    const d = new Date(r.date)
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      map[d.getDate()] = r.status
    }
  })

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
        const status = map[day]
        const cfg    = ATT_CFG[status]
        return (
          <div
            key={day}
            title={cfg?.label ?? ''}
            className={`w-full aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold ${
              cfg ? `${cfg.bg} text-white` : 'bg-gray-100 text-gray-400'
            }`}
          >
            {day}
          </div>
        )
      })}
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────── */

export default function StudentGroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [group,   setGroup]   = useState(null)
  const [att,     setAtt]     = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getGroupById(id).then(r => r.data).catch(() => null),
      getMyAttendance().then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? [])).catch(() => []),
      getMyRatings().then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? [])).catch(() => []),
    ]).then(([g, a, rt]) => {
      setGroup(g)
      setAtt(a)
      setRatings(rt)
    }).finally(() => setLoading(false))
  }, [id])

  /* filter only this group */
  const groupAtt = useMemo(() =>
    att.filter(r => {
      const gid = r.group?._id ?? r.group?.id ?? r.group ?? r.groupId
      return gid === id
    }), [att, id])

  const groupRatings = useMemo(() =>
    ratings.filter(r => {
      const gid = r.group?._id ?? r.group?.id ?? r.group ?? r.groupId
      return gid === id
    }), [ratings, id])

  /* stats */
  const attTotal   = groupAtt.length
  const attPresent = groupAtt.filter(r => r.status === 'present').length
  const attRate    = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0
  const avgRating  = groupRatings.length
    ? (groupRatings.reduce((s, r) => s + Number(r.score ?? r.grade ?? 0), 0) / groupRatings.length).toFixed(1)
    : null

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center gap-3 p-4">
        <p className="text-gray-400 font-medium">Guruh topilmadi</p>
        <button onClick={() => navigate('/student/groups')}
          className="text-sm text-violet-600 font-semibold">
          ← Guruhlarimga qaytish
        </button>
      </div>
    )
  }

  const isActive = group.status !== 'inactive' && group.status !== 'ended'
  const schedule = group.schedule ?? {}
  const days     = (schedule.days ?? []).map(d => DAYS_UZ[d] ?? d).join(', ')

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-10">
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* ── back + title ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/groups')}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{group.name}</h1>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {isActive ? 'Faol' : 'Nofaol'}
            </span>
          </div>
        </div>

        {/* ── stats row ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Davomat',    value: `${attRate}%`,                  color: attRate >= 75 ? 'text-emerald-500' : 'text-rose-500' },
            { label: "O'rtacha ball", value: avgRating ?? '—',            color: 'text-violet-600' },
            { label: "O'quvchilar", value: `${group.currentStudents ?? 0}`, color: 'text-gray-700' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-3.5 text-center shadow-sm">
              <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* ── info cards ── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">

          {/* course */}
          {group.course && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-4.5 h-4.5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Kurs</p>
                <p className="text-[14px] font-semibold text-gray-800">{group.course.title ?? group.course.name}</p>
                {group.course.duration && (
                  <p className="text-[12px] text-gray-400">{group.course.duration} oy</p>
                )}
              </div>
            </div>
          )}

          {/* teacher */}
          {group.teacher && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4.5 h-4.5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Ustoz</p>
                <p className="text-[14px] font-semibold text-gray-800">{group.teacher.name}</p>
                {group.teacher.qualification && (
                  <p className="text-[12px] text-gray-400">{group.teacher.qualification}</p>
                )}
              </div>
              {group.teacher.phone && (
                <a href={`tel:${group.teacher.phone}`}
                  className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-sky-500" />
                </a>
              )}
            </div>
          )}

          {/* schedule */}
          {(days || schedule.fromHour) && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Jadval</p>
                {days && <p className="text-[14px] font-semibold text-gray-800">{days}</p>}
                {schedule.fromHour && (
                  <p className="text-[12px] text-gray-400">{schedule.fromHour} – {schedule.toHour}</p>
                )}
              </div>
            </div>
          )}

          {/* room */}
          {group.room && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <MapPin className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Xona</p>
                <p className="text-[14px] font-semibold text-gray-800">
                  {group.room.name ?? `Xona ${group.room.number}`}
                </p>
                {group.room.capacity && (
                  <p className="text-[12px] text-gray-400">{group.room.capacity} kishi sig'imli</p>
                )}
              </div>
            </div>
          )}

          {/* dates */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Clock className="w-4.5 h-4.5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Davr</p>
              <p className="text-[13px] font-semibold text-gray-700">
                {fmtDate(group.startDate)} – {group.endDate ? fmtDate(group.endDate) : 'Hozirgi kungacha'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-gray-400">To'lov</p>
              <p className="text-[13px] font-bold text-gray-700">
                {group.monthlyFeePerStudent
                  ? `${Number(group.monthlyFeePerStudent).toLocaleString('uz-UZ')} UZS`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── this month attendance ── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-500" />
              <span className="text-[13px] font-semibold text-gray-700">
                Davomat — {MONTHS_UZ[month - 1]} {year}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              {Object.entries(ATT_CFG).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                  <span className="text-gray-400 hidden sm:inline">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-4">
            {groupAtt.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">Bu guruh uchun davomat ma'lumoti yo'q</p>
            ) : (
              <AttCalendar records={groupAtt} year={year} month={month} />
            )}
          </div>

          {/* legend row */}
          {attTotal > 0 && (
            <div className="grid grid-cols-3 border-t border-gray-100">
              {[
                { label: 'Keldi',    val: attPresent,                                    cls: 'text-emerald-500' },
                { label: 'Kelmadi', val: groupAtt.filter(r => r.status === 'absent').length,  cls: 'text-rose-500'    },
                { label: 'Kech',    val: groupAtt.filter(r => r.status === 'late').length,    cls: 'text-amber-500'   },
              ].map(({ label, val, cls }) => (
                <div key={label} className="flex flex-col items-center py-3">
                  <span className={`text-lg font-black ${cls}`}>{val}</span>
                  <span className="text-[11px] text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── my ratings in this group ── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Star className="w-4 h-4 text-violet-500" />
            <span className="text-[13px] font-semibold text-gray-700">Mening baholarim</span>
            {groupRatings.length > 0 && (
              <span className="ml-auto text-[12px] text-gray-400">{groupRatings.length} ta</span>
            )}
          </div>

          {groupRatings.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Bu guruh uchun baholar yo'q</p>
            </div>
          ) : (
            <div>
              {groupRatings.slice(0, 20).map((r, i) => {
                const score  = r.score ?? r.grade
                const max    = r.maxScore ?? r.maxGrade
                const badge  = scoreBadge(score, max)
                const title  = r.lesson?.title ?? r.title ?? r.task ?? 'Dars'
                const isLast = i === Math.min(groupRatings.length, 20) - 1
                const date   = r.date ?? r.createdAt
                return (
                  <div key={r.id ?? r._id}
                    className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-gray-50' : ''}`}>
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-800 truncate">{title}</p>
                      {date && (
                        <p className="text-[12px] text-gray-400">
                          {new Date(date).toLocaleDateString('uz-UZ')}
                        </p>
                      )}
                    </div>
                    <span className={`text-[13px] font-black px-2.5 py-1 rounded-xl shrink-0 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                )
              })}
              {groupRatings.length > 20 && (
                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <button onClick={() => navigate('/student/ratings')}
                    className="text-[13px] text-violet-600 font-semibold">
                    Barchasi ko'rish ({groupRatings.length} ta) →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
