import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getStudentMonthlyScreenTime } from '../../api/screenTime'
import { getGroupById } from '../../api/groups'
import { useFetch } from '../../hooks/useFetch'
import { LoadingState, ErrorState } from '../../components/PageShell'
import { CAT_CFG, fmtMin, UZ_MONTHS, WEEKDAYS_UZ, SmoothAreaChart } from './GroupDetail'
import { AppIcon } from '../../utils/appIcons'
import {
  ChevronLeft, ChevronRight, Hourglass, Target, Trophy, Clock,
  GraduationCap, PartyPopper, TrendingUp, TrendingDown, CalendarCheck, Smartphone,
} from 'lucide-react'

const CAT_HEX = {
  entertainment: '#f87171',
  social:        '#f472b6',
  education:     '#34d399',
  music:         '#60a5fa',
  games:         '#fbbf24',
  productivity:  '#2dd4bf',
  other:         '#d1d5db',
}

const ENTERTAINMENT_CATS = ['entertainment', 'social', 'games', 'music']

// Backendda kunlik "maqsad" maydoni yo'q — frontendda standart 6 soatlik chegara ishlatiladi.
const GOAL_MINUTES = 360

export default function StudentScreenTimeReport() {
  const { id: groupId, studentId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()

  const now = new Date()
  const [month, setMonth] = useState(
    state?.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllApps, setShowAllApps] = useState(false)

  // Sahifa to'g'ridan-to'g'ri ochilsa (state bo'lmasa) — guruhdan o'quvchi nomini topamiz.
  const fetchGroup = useCallback(() => getGroupById(groupId), [groupId])
  const { data: rawGroup } = useFetch(state?.student ? () => Promise.resolve({ data: null }) : fetchGroup, [groupId])
  const group = rawGroup?.data ?? rawGroup
  const student = state?.student ?? group?.students?.find(s => (s.id ?? s._id) === studentId)

  useEffect(() => {
    setLoading(true)
    getStudentMonthlyScreenTime(studentId, month)
      .then(r => setData(r.data?.data ?? r.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [studentId, month])

  const topApps = data?.topApps ?? data?.apps ?? []
  const monthTotal = data?.totalMinutes ?? data?.total ?? 0

  const days = useMemo(() => {
    const raw = data?.dailyBreakdown ?? data?.days ?? []
    return [...raw].sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')))
  }, [data])

  const today = days[days.length - 1]
  const yesterday = days[days.length - 2]
  const todayMinutes = today?.totalMinutes ?? today?.minutes ?? 0
  const yesterdayMinutes = yesterday?.totalMinutes ?? yesterday?.minutes ?? 0
  const todayApps = today?.apps ?? today?.topApps ?? (days.length ? [] : topApps)

  const diffPct = yesterdayMinutes > 0
    ? Math.round(((todayMinutes - yesterdayMinutes) / yesterdayMinutes) * 100)
    : null

  const goalPct = Math.min(100, Math.round((todayMinutes / GOAL_MINUTES) * 100))
  const reachedGoal = todayMinutes <= GOAL_MINUTES

  // "Vaqt taqsimoti" — bugungi (yoki ma'lumot bo'lmasa oylik) ilovalar kategoriyasi bo'yicha
  const catTotals = useMemo(() => {
    const source = todayApps.length ? todayApps : topApps
    const map = {}
    source.forEach(a => {
      const cat = a.category ?? 'other'
      map[cat] = (map[cat] ?? 0) + (a.minutes ?? 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [todayApps, topApps])

  const catTotalSum = catTotals.reduce((s, [, v]) => s + v, 0) || 1
  const eduMinutes = catTotals.find(([c]) => c === 'education')?.[1] ?? 0
  const funMinutes = catTotals.filter(([c]) => ENTERTAINMENT_CATS.includes(c)).reduce((s, [, v]) => s + v, 0)
  const eduPct = Math.round((eduMinutes / catTotalSum) * 100)
  const funPct = Math.round((funMinutes / catTotalSum) * 100)
  const activeDays = days.filter(d => (d.totalMinutes ?? d.minutes ?? 0) > 0).length

  // "Haftalik trend" — oxirgi 7 kun
  const last7 = days.slice(-7)
  const weeklyValues = last7.map(d => d.totalMinutes ?? d.minutes ?? 0)
  const weeklyLabels = last7.map(d => {
    const dt = new Date(d.date)
    return isNaN(dt.getTime()) ? '' : WEEKDAYS_UZ[dt.getDay()]
  })

  const visibleApps = showAllApps ? topApps : topApps.slice(0, 6)

  const monthLabel = `${UZ_MONTHS[Number(month.split('-')[1]) - 1]} ${month.split('-')[0]}`
  const prevMonth = () => {
    const d = new Date(month + '-01')
    d.setMonth(d.getMonth() - 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const d = new Date(month + '-01')
    d.setMonth(d.getMonth() + 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next <= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`) setMonth(next)
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">

      {/* Header */}
      <div className="flex items-center gap-3 bg-base-100 rounded-2xl border border-base-200 shadow-sm px-4 py-3">
        <button onClick={() => navigate(`/teacher/groups/${groupId}`)} className="btn btn-ghost btn-sm btn-square">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 font-black text-sm flex items-center justify-center shrink-0">
          {student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base-content truncate">{student?.name ?? "O'quvchi"}</p>
          <p className="text-xs text-base-content/50">Ekran vaqti tahlili</p>
        </div>
        <div className="flex items-center gap-1 bg-base-200/50 rounded-2xl px-1 py-1 shrink-0">
          <button onClick={prevMonth} className="btn btn-ghost btn-xs btn-square">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold px-1 whitespace-nowrap">{monthLabel}</span>
          <button onClick={nextMonth} className="btn btn-ghost btn-xs btn-square">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : !data ? (
        <ErrorState message="Bu o'quvchi uchun ekran vaqti ma'lumoti topilmadi" />
      ) : (
        <>
          {/* Hero: Bugungi ekran vaqti + maqsad */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-violet-800 text-white p-6">
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -right-2 bottom-2 opacity-15">
              <Hourglass className="w-28 h-28" />
            </div>
            <p className="text-xs font-semibold text-violet-200 mb-1">Bugun</p>
            <p className="text-3xl font-black mb-2">
              {Math.floor(todayMinutes / 60)} soat {todayMinutes % 60} daqiqa
            </p>
            {diffPct !== null && (
              <div className="inline-flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-xs font-bold mb-4">
                {diffPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(diffPct)}% kechagiga nisbatan
              </div>
            )}
            <div className={diffPct === null ? 'mt-4' : ''}>
              <div className="flex items-center justify-between text-xs font-semibold text-violet-100 mb-1.5">
                <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Maqsad: {GOAL_MINUTES / 60} soat</span>
                <span className="tabular-nums">{fmtMin(todayMinutes)} / {fmtMin(GOAL_MINUTES)}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${reachedGoal ? 'bg-emerald-300' : 'bg-amber-300'}`} style={{ width: `${goalPct}%` }} />
              </div>
            </div>
          </div>

          {/* Vaqt taqsimoti */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5">
            <p className="text-sm font-bold text-base-content mb-4">Vaqt taqsimoti</p>
            {catTotals.length === 0 ? (
              <div className="py-6 text-center text-xs text-base-content/40">Ma'lumot yo'q</div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative shrink-0">
                  <DonutChart segments={catTotals.map(([cat, v]) => ({ value: v, color: CAT_HEX[cat] ?? CAT_HEX.other }))} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-base-content">{fmtMin(catTotalSum)}</span>
                    <span className="text-[10px] text-base-content/40">jami</span>
                  </div>
                </div>
                <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {catTotals.map(([cat, v]) => {
                    const cfg = CAT_CFG[cat] ?? CAT_CFG.other
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.color}`} />
                        <span className="text-xs text-base-content/60 flex-1 truncate">{cfg.label}</span>
                        <span className="text-xs font-bold text-base-content tabular-nums">{fmtMin(v)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <StatCard icon={Clock} label="Jami vaqt" value={fmtMin(todayMinutes)} />
              <StatCard icon={GraduationCap} label="Ta'lim vaqti" value={`${eduPct}%`} />
              <StatCard icon={Smartphone} label="Ko'ngilochar vaqt" value={`${funPct}%`} />
              <StatCard icon={CalendarCheck} label="Faol kunlar" value={`${activeDays}`} />
            </div>
          </div>

          {/* Eng ko'p ishlatilgan ilovalar */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-base-content">Eng ko'p ishlatilgan ilovalar</p>
              {topApps.length > 6 && (
                <button onClick={() => setShowAllApps(v => !v)} className="text-xs font-bold text-violet-600">
                  {showAllApps ? 'Kamroq' : 'Barchasi'}
                </button>
              )}
            </div>
            {topApps.length === 0 ? (
              <div className="py-8 text-center text-xs text-base-content/40">Ma'lumot yo'q</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {visibleApps.map((app, i) => {
                  const pct = monthTotal > 0 ? ((app.minutes ?? 0) / monthTotal * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <AppIcon app={app} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-base-content truncate">{app.appName}</span>
                          <span className="text-xs font-bold text-base-content/70 tabular-nums ml-2 shrink-0">{fmtMin(app.minutes)}</span>
                        </div>
                        <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-violet-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Haftalik trend */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5">
            <p className="text-sm font-bold text-base-content mb-4">Haftalik trend</p>
            <SmoothAreaChart values={weeklyValues} color="#7C3AED" height={140} />
            <div className="flex justify-between mt-2 px-3">
              {weeklyLabels.map((l, i) => (
                <span key={i} className="text-[10px] text-base-content/40 w-6 text-center">{l}</span>
              ))}
            </div>
          </div>

          {/* Maqsad holati banneri */}
          {days.length > 0 && (
            reachedGoal ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700">Yaxshi ish!</p>
                  <p className="text-xs text-emerald-600/80">Bugun ekran vaqti maqsad doirasida.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-700">Maqsaddan oshib ketdi</p>
                  <p className="text-xs text-amber-600/80">Bugungi ekran vaqti maqsaddan {fmtMin(todayMinutes - GOAL_MINUTES)} ko'p.</p>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-base-200/40 rounded-2xl p-3.5">
      <Icon className="w-4 h-4 text-violet-500 mb-2" />
      <p className="text-base font-black text-base-content">{value}</p>
      <p className="text-[10px] text-base-content/50">{label}</p>
    </div>
  )
}

// Kategoriyalar bo'yicha vaqt taqsimoti — SVG donut grafigi
function DonutChart({ segments, size = 120, strokeWidth = 14 }) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F1F6" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * c
          const circle = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return circle
        })}
      </g>
    </svg>
  )
}
