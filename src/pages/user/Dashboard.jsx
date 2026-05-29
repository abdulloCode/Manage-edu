import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyStudentData } from '../../api/students'
import { getMyGroups, getGroupById } from '../../api/groups'
import { getMyRatings, getGroupRatingCalendar } from '../../api/ratings'
import { getMyAttendance } from '../../api/attendance'
import { getMyHomework, getMySubmissions } from '../../api/homework'
import { useAuth } from '../../context/AuthContext'
import {
  TrendingUp, TrendingDown, BookOpen, Star,
  AlertCircle, ChevronRight, GraduationCap,
  Users, CalendarDays, FileText, Trophy,
} from 'lucide-react'

const fmt = (n) => Number(n ?? 0).toLocaleString('uz-UZ')

const MOTTOS = [
  "Har kuni o'qish – katta natija! 🎯",
  "Bilim eng yaxshi investitsiya! 📚",
  "Bugun o'rgangan narsa, ertangi muvaffaqiyat! ⭐",
  "Sen buni uddalay olasan, davom et! 💪",
  "Har kuni ozgina o'sish — katta natija! 🌱",
]

const TODAY_ALIASES = {
  0: ['Ya', 'Yak', 'Sun', 'Yakshanba'],
  1: ['Du', 'Dush', 'Mon', 'Dushanba'],
  2: ['Se', 'Sesh', 'Tue', 'Seshanba'],
  3: ['Chor', 'Wed', 'Chorshanba'],
  4: ['Pa', 'Pay', 'Thu', 'Payshanba'],   // admin saves "Pa"
  5: ['Ju', 'Jum', 'Fri', 'Juma'],
  6: ['Sha', 'Sh', 'Shan', 'Sat', 'Shanba'], // admin saves "Sha"
}

function toMin(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
}

/* ── Activity chart (SVG sparkline) ───────────────────── */
function ActivityChart({ attendance }) {
  const LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Ya']
  const dayMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }

  const now = new Date()
  const dow = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000)

  const counts = Array(7).fill(null).map(() => ({ total: 0, present: 0 }))
  attendance.forEach(r => {
    if (!r.date) return
    const d = new Date(r.date)
    if (d >= weekStart && d < weekEnd) {
      const di = dayMap[d.getDay()] ?? 0
      counts[di].total++
      if (r.status === 'present') counts[di].present++
    }
  })

  const overall = attendance.length > 0
    ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100
    : 60

  const vals = counts.map((c, i) =>
    c.total > 0 ? (c.present / c.total) * 100
    : Math.max(10, Math.min(95, overall + Math.sin(i * 1.3) * 22))
  )

  const W = 340, H = 72, padX = 8, padY = 6
  const xStep = (W - padX * 2) / 6
  const pts = vals.map((v, i) => ({
    x: padX + i * xStep,
    y: padY + (1 - v / 100) * (H - padY * 2),
  }))

  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = pts[i - 1]
    return `${acc} C ${prev.x + xStep / 2} ${prev.y}, ${pt.x - xStep / 2} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')
  const fillPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <div>
      <div className="flex gap-2">
        {/* Y labels */}
        <div className="flex flex-col justify-between text-[9px] font-semibold text-gray-300 pb-0.5" style={{ height: H }}>
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
        {/* SVG */}
        <svg viewBox={`0 0 ${W} ${H}`} className="flex-1" style={{ height: H }}>
          <defs>
            <linearGradient id="actFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[padY, padY + (H - padY * 2) / 2, H - padY].map((y, i) => (
            <line key={i} x1={padX} x2={W - padX} y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />
          ))}
          <path d={fillPath} fill="url(#actFill)" />
          <path d={linePath} fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          {pts.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#7C3AED" stroke="white" strokeWidth="1.5" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between pl-7 pr-1 mt-1">
        {LABELS.map(d => (
          <span key={d} className="text-[10px] font-semibold text-gray-400">{d}</span>
        ))}
      </div>
    </div>
  )
}

/* ── Homework status map ──────────────────────────────── */
const HW_STATUS = {
  submitted: { label: 'Bajarildi', bg: 'bg-green-100',  text: 'text-green-700'  },
  graded:    { label: 'Baholandi', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  late:      { label: 'Kechikdi',  bg: 'bg-red-100',    text: 'text-red-600'    },
  pending:   { label: 'Jarayonda', bg: 'bg-amber-100',  text: 'text-amber-700'  },
}

const HW_COLORS = [
  { bg: 'bg-purple-100', fg: 'text-purple-600' },
  { bg: 'bg-red-100',    fg: 'text-red-500'    },
  { bg: 'bg-green-100',  fg: 'text-green-600'  },
  { bg: 'bg-blue-100',   fg: 'text-blue-600'   },
  { bg: 'bg-amber-100',  fg: 'text-amber-600'  },
]

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════ */
export default function UserDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [studentData,      setStudentData]      = useState(null)
  const [groups,           setGroups]           = useState([])
  const [ratings,          setRatings]          = useState([])
  const [attendance,       setAttendance]       = useState([])
  const [homeworks,        setHomeworks]        = useState([])
  const [submissions,      setSubmissions]      = useState([])
  const [loading,          setLoading]          = useState(true)
  const [leaderboard,      setLeaderboard]      = useState([])
  const [lbGroup,          setLbGroup]          = useState(null)
  const [scheduleMap,      setScheduleMap]      = useState({})

  const motto = useMemo(() => MOTTOS[new Date().getDay() % MOTTOS.length], [])

  useEffect(() => {
    Promise.all([
      getMyStudentData()
        .then(r => r.data?.data || r.data || null).catch(() => null),
      getMyGroups()
        .then(r => {
          const d = r.data
          return Array.isArray(d) ? d : Array.isArray(d?.groups) ? d.groups : Array.isArray(d?.data) ? d.data : []
        }).catch(() => []),
      getMyRatings()
        .then(r => Array.isArray(r.data) ? r.data : r.data?.data ?? []).catch(() => []),
      getMyAttendance()
        .then(r => Array.isArray(r.data) ? r.data : r.data?.data ?? []).catch(() => []),
      getMyHomework()
        .then(r => { const d = r.data; return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [] }).catch(() => []),
      getMySubmissions()
        .then(r => { const d = r.data; return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [] }).catch(() => []),
    ]).then(([sd, gr, rt, att, hw, subs]) => {
      setStudentData(sd); setGroups(gr); setRatings(rt)
      setAttendance(att); setHomeworks(hw); setSubmissions(subs)
      // Birinchi guruh uchun oylik leaderboard yukla
      const firstGroup = Array.isArray(gr) ? gr[0] : null
      if (firstGroup) {
        const gId = firstGroup._id || firstGroup.id
        const now = new Date()
        setLbGroup(firstGroup)
        getGroupRatingCalendar(gId, { year: now.getFullYear(), month: now.getMonth() + 1 })
          .then(r => {
            const res = r.data?.data || r.data
            if (!res || !Array.isArray(res.students)) return
            const myId = sd?._id ?? sd?.id
            const board = res.students
              .map(s => {
                const scores = Object.values(s.ratings ?? s.scores ?? {})
                const total  = scores.reduce((a, v) => a + (Number(v) || 0), 0)
                return { id: s.id ?? s._id, name: s.name ?? "Noma'lum", total, isMe: String(s.id ?? s._id) === String(myId) }
              })
              .sort((a, b) => b.total - a.total)
            setLeaderboard(board)
          })
          .catch(() => {})
      }
    }).finally(() => setLoading(false))
  }, [])

  // Guruh ro'yxatida schedule bo'lmasa, alohida yuklash
  useEffect(() => {
    const noSched = groups.filter(g => !g.schedule);
    if (!noSched.length) return;
    Promise.allSettled(
      noSched.slice(0, 20).map(g => {
        const gid = g._id ?? g.id;
        return getGroupById(gid)
          .then(r => ({ id: gid, schedule: (r.data?.data || r.data)?.schedule ?? null }))
          .catch(() => ({ id: gid, schedule: null }));
      })
    ).then(results => {
      const map = {};
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.schedule) {
          map[r.value.id] = r.value.schedule;
        }
      });
      setScheduleMap(map);
    });
  }, [groups.length]); // eslint-disable-line

  const balance     = Number(studentData?.balance ?? 0)
  const missedCount = useMemo(() => attendance.filter(a => a.status === 'absent').length, [attendance])
  const totalScore  = useMemo(() => ratings.reduce((s, r) => s + Number(r.score ?? r.grade ?? 0), 0), [ratings])
  const ratedCount  = useMemo(() => ratings.filter(r => Number(r.score ?? r.grade ?? 0) > 0).length, [ratings])

  /* today schedule */
  const todayIdx     = new Date().getDay()
  const todayAliases = TODAY_ALIASES[todayIdx] ?? []
  const nowMin       = new Date().getHours() * 60 + new Date().getMinutes()
  const todayGroups  = useMemo(() => (
    groups
      .map(g => ({ ...g, _sched: g.schedule ?? scheduleMap[g._id ?? g.id] ?? null }))
      .filter(g => (g._sched?.days ?? []).some(d => todayAliases.includes(d)))
      .sort((a, b) => (toMin(a._sched?.fromHour) ?? 0) - (toMin(b._sched?.fromHour) ?? 0))
  ), [groups, todayAliases, scheduleMap])

  /* homework with status */
  const hwWithStatus = useMemo(() => homeworks.slice(0, 5).map((hw, i) => {
    const id  = hw._id || hw.id
    const sub = submissions.find(s => {
      const sid = s.homework?._id || s.homework?.id || s.homeworkId || s.homework
      return sid === id
    })
    let status = 'pending'
    if (sub) status = sub.status === 'graded' ? 'graded' : 'submitted'
    else if (hw.deadline && new Date(hw.deadline) < new Date()) status = 'late'
    return { ...hw, _status: status, _color: HW_COLORS[i % HW_COLORS.length] }
  }), [homeworks, submissions])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    )
  }

  const initials = (user?.name ?? 'O').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#F4F6FF] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* ── HEADER ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800">
              Salom, {user?.name?.split(' ')[0] || "O'quvchi"} {'👋'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5 truncate">{motto}</p>
          </div>
          <button className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* ── STAT CARDS ────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <button onClick={() => navigate('/student/payments')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                {balance < 0
                  ? <TrendingDown className="w-5 h-5 text-red-500" />
                  : <TrendingUp   className="w-5 h-5 text-emerald-600" />}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Balans</p>
            <p className="text-lg font-bold text-gray-800 tabular-nums leading-tight">{fmt(balance)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">UZS</p>
          </button>

          <button onClick={() => navigate('/student/groups')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Guruhlar</p>
            <p className="text-lg font-bold text-gray-800 tabular-nums leading-tight">{groups.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{groups.length} ta guruh</p>
          </button>

          <button onClick={() => navigate('/student/attendance')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 leading-tight">Qoldirilgan darslar</p>
            <p className="text-lg font-bold text-gray-800 tabular-nums leading-tight">{missedCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{attendance.length} ta darsdan</p>
          </button>

          <button onClick={() => navigate('/student/ratings')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-violet-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jami ball</p>
            <p className="text-lg font-bold text-gray-800 tabular-nums leading-tight">{totalScore}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{ratedCount} ta bahoning yig'indisi</p>
          </button>
        </div>

        {/* ── SCHEDULE + HOMEWORK ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bugungi dars jadvali */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">Bugungi dars jadvali</h2>
              </div>
              <button onClick={() => navigate('/student/groups')}
                className="text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors flex items-center gap-0.5">
                Barchasi<ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {todayGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <CalendarDays className="w-10 h-10 text-violet-200" />
                </div>
                <p className="text-sm font-semibold text-gray-500 mt-1">Bugun dars yo'q</p>
                <p className="text-xs text-gray-400">Yaxshilab dam oling! {'😊'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayGroups.map(g => {
                  const sched   = g._sched
                  const from    = toMin(sched?.fromHour)
                  const to      = toMin(sched?.toHour)
                  const ongoing = from != null && to != null && nowMin >= from && nowMin < to
                  const done    = to != null && nowMin >= to
                  return (
                    <div key={g._id || g.id}
                      className={`flex items-center gap-3 px-5 py-3.5 ${done ? 'opacity-40' : ''}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        ongoing ? 'bg-green-500 animate-pulse' : done ? 'bg-gray-300' : 'bg-violet-400'
                      }`} />
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{g.name}</p>
                        <p className="text-xs text-gray-400 truncate">{g.course?.title || g.course?.name || ''}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-xs font-bold text-gray-700 tabular-nums">
                          {sched?.fromHour} – {sched?.toHour}
                        </p>
                        {ongoing && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            Davom etyapti
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Topshiriqlarim */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">Topshiriqlarim</h2>
              </div>
              <button onClick={() => navigate('/student/homework')}
                className="text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors flex items-center gap-0.5">
                Barchasi<ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {hwWithStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-violet-200" />
                </div>
                <p className="text-sm font-semibold text-gray-500 mt-1">Vazifalar yo'q</p>
                <p className="text-xs text-gray-400">Hozircha topshiriq berilmagan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {hwWithStatus.map((hw, i) => {
                  const st = HW_STATUS[hw._status] || HW_STATUS.pending
                  return (
                    <div key={hw._id || hw.id || i} className="flex items-center gap-3 px-5 py-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hw._color.bg}`}>
                        <BookOpen className={`w-4 h-4 ${hw._color.fg}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{hw.title || hw.name || '—'}</p>
                        <p className="text-xs text-gray-400 truncate">{hw.description || hw.subject || ''}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── GROUPS + ACTIVITY ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Mening guruhlarim */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">Mening guruhlarim</h2>
              </div>
              <button onClick={() => navigate('/student/groups')}
                className="text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors flex items-center gap-0.5">
                Barchasi<ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <Users className="w-8 h-8 text-violet-200" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Guruh yo'q</p>
                <p className="text-xs text-gray-400">Admin siz uchun guruh tayinlaydi</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {groups.map((g, i) => {
                  const isActive = g.status !== 'inactive' && g.status !== 'archived'
                  return (
                    <button key={g._id || g.id || i}
                      onClick={() => navigate('/student/groups')}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{g.name}</p>
                        <p className="text-xs text-gray-400">
                          {g.currentStudents ?? g.students?.length ?? 0} nafar o'quvchi
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isActive ? 'Faol' : 'Nofaol'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* O'quv faolligim */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">O'quv faolligim</h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                Bu hafta
              </span>
            </div>
            <div className="px-5 py-4">
              <ActivityChart attendance={attendance} />
            </div>
            {/* attendance quick stats */}
            <div className="grid grid-cols-3 border-t border-gray-100">
              {[
                { label: 'Keldi',      val: attendance.filter(a => a.status === 'present').length, cls: 'text-green-600' },
                { label: 'Kelmadi',    val: missedCount,                                            cls: 'text-red-500'   },
                { label: 'Kech keldi', val: attendance.filter(a => a.status === 'late').length,     cls: 'text-amber-600' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="flex flex-col items-center py-3 gap-0.5">
                  <span className={`text-base font-bold tabular-nums ${cls}`}>{val}</span>
                  <span className="text-[10px] font-semibold text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── GURUH REYTINGI ────────────────────────────── */}
        {leaderboard.length > 0 && (() => {
          const myRank = leaderboard.findIndex(s => s.isMe)
          const me     = myRank >= 0 ? leaderboard[myRank] : null
          const top5   = leaderboard.slice(0, 5)
          const maxTot = leaderboard[0]?.total || 1
          const MEDAL  = ['🥇', '🥈', '🥉']
          const now    = new Date()
          const monthLabel = now.toLocaleString('uz-UZ', { month: 'long', year: 'numeric' })

          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* header */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-violet-500" />
                  <h2 className="text-sm font-bold text-gray-800">Guruh reytingi</h2>
                  {lbGroup && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
                      {lbGroup.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-medium">{monthLabel}</span>
                  <button onClick={() => navigate('/student/ratings')}
                    className="text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors flex items-center gap-0.5">
                    Barchasi<ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mening o'rnim banner */}
              {me && (
                <div className="mx-4 mt-4 mb-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 p-4 flex items-center gap-4 text-white">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0 font-black">
                    {myRank < 3 ? MEDAL[myRank] : `#${myRank + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold opacity-75 mb-0.5">Sizning o'rningiz</p>
                    <p className="text-xl font-black">{myRank + 1}‑o'rin</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black tabular-nums">{me.total}</p>
                    <p className="text-[11px] opacity-60">ball</p>
                  </div>
                </div>
              )}

              {/* Top 5 */}
              <div className="divide-y divide-gray-50 px-2 pb-2">
                {top5.map((s, i) => {
                  const pct = Math.round((s.total / maxTot) * 100)
                  return (
                    <div key={s.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${s.isMe ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                      {/* rank */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? 'bg-yellow-100 text-yellow-600' :
                        i === 1 ? 'bg-gray-100 text-gray-500' :
                        i === 2 ? 'bg-orange-100 text-orange-500' :
                        s.isMe  ? 'bg-violet-100 text-violet-600' :
                                  'bg-gray-50 text-gray-400'
                      }`}>
                        {i < 3 ? MEDAL[i] : i + 1}
                      </div>
                      {/* avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        s.isMe ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                      {/* name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-xs font-semibold truncate ${s.isMe ? 'text-violet-700' : 'text-gray-800'}`}>
                            {s.name}
                          </span>
                          {s.isMe && <span className="text-[9px] font-bold bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full shrink-0">siz</span>}
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            s.isMe ? 'bg-violet-400' :
                            i === 0 ? 'bg-yellow-400' :
                            i === 1 ? 'bg-gray-400' :
                            i === 2 ? 'bg-orange-400' : 'bg-gray-200'
                          }`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {/* score */}
                      <span className={`text-sm font-black tabular-nums shrink-0 ${s.isMe ? 'text-violet-600' : 'text-gray-600'}`}>
                        {s.total}
                      </span>
                    </div>
                  )
                })}
              </div>

              {leaderboard.length > 5 && myRank >= 5 && me && (
                <div className="px-5 pb-4 pt-1">
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-100`}>
                    <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-black shrink-0">
                      #{myRank + 1}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {me.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-violet-700 truncate">{me.name}</span>
                        <span className="text-[9px] font-bold bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full shrink-0">siz</span>
                      </div>
                    </div>
                    <span className="text-sm font-black tabular-nums text-violet-600 shrink-0">{me.total}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

      </div>
    </div>
  )
}
