import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { useFetch } from '../../hooks/useFetch'
import { getGroupById } from '../../api/groups'
import { getGroupAttendance, getGroupAttendanceCalendar, updateDayAttendance } from '../../api/attendance'
import { getGroupRatingCalendar, upsertDayRating } from '../../api/ratings'
import { getGroupScreenTimeSummary } from '../../api/screenTime'
import { LoadingState, ErrorState } from '../../components/PageShell'
import { ChevronLeft, ChevronRight, CalendarCheck, Star, ChevronDown, Monitor, BarChart2 } from 'lucide-react'

const STATUS_COLORS = {
  present: 'bg-success/15 text-success hover:bg-success/25',
  absent:  'bg-error/15 text-error hover:bg-error/25',
  late:    'bg-warning/15 text-warning hover:bg-warning/25',
}

export const UZ_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
export const WEEKDAYS_UZ = ['Yak','Dush','Sesh','Chor','Pay','Jum','Shan']

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: parse calendar response into flat map keyed "studentId-YYYY-MM-DD"
// ═══════════════════════════════════════════════════════════════════════════════

function parseAttendanceCalendar(res) {
  const map = {}
  if (!res) return map

  // Format C (new): { days: [{d, l}], students: [{id, attendance: {"6": true}}] }
  if (Array.isArray(res.days) && res.days[0]?.d !== undefined && Array.isArray(res.students)) {
    const year = res.year
    const month = res.month
    res.students.forEach((student) => {
      Object.entries(student.attendance || {}).forEach(([dayNum, status]) => {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        let normalizedStatus
        if (status === true) normalizedStatus = 'present'
        else if (status === false) normalizedStatus = 'absent'
        else normalizedStatus = status ?? 'present'
        map[`${student.id}-${date}`] = normalizedStatus
      })
    })
    return map
  }

  // Format A: { days: [{ date, records: [{ studentId, status }] }] }
  const days = res.days ?? res.data?.days ?? res
  if (Array.isArray(days) && days[0]?.date !== undefined) {
    days.forEach((day) => {
      const date = day.date?.slice(0, 10)
      if (!date) return
      day.records?.forEach((r) => {
        if (r.studentId) map[`${r.studentId}-${date}`] = r.status ?? 'present'
      })
    })
    return map
  }

  // Format B: { calendar: { "2026-04-01": { studentId: status, ... } } }
  const calendar = res.calendar ?? res.data?.calendar
  if (calendar && typeof calendar === 'object') {
    Object.entries(calendar).forEach(([date, dayMap]) => {
      Object.entries(dayMap).forEach(([studentId, status]) => {
        map[`${studentId}-${date}`] = status ?? 'present'
      })
    })
    return map
  }

  return map
}

function parseRatingsCalendar(res) {
  const map = {}
  if (!res) return map

  // Format C (new): { days: [{d, l}], students: [{id, ratings: {"6": 85}}] }
  if (Array.isArray(res.days) && res.days[0]?.d !== undefined && Array.isArray(res.students)) {
    const year = res.year
    const month = res.month
    res.students.forEach((student) => {
      const scores = student.ratings ?? student.scores ?? {}
      Object.entries(scores).forEach(([dayNum, score]) => {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        map[`${student.id}-${date}`] = score !== undefined && score !== null ? String(score) : ''
      })
    })
    return map
  }

  // Format A: { days: [{ date, records: [{ studentId, score }] }] }
  const days = res.days ?? res.data?.days ?? res
  if (Array.isArray(days) && days[0]?.date !== undefined) {
    days.forEach((day) => {
      const date = day.date?.slice(0, 10)
      if (!date) return
      day.records?.forEach((r) => {
        if (r.studentId) map[`${r.studentId}-${date}`] = String(r.score ?? '')
      })
    })
    return map
  }

  // Format B: { calendar: { "2026-04-01": { studentId: score, ... } } }
  const calendar = res.calendar ?? res.data?.calendar
  if (calendar && typeof calendar === 'object') {
    Object.entries(calendar).forEach(([date, dayMap]) => {
      Object.entries(dayMap).forEach(([studentId, score]) => {
        map[`${studentId}-${date}`] = score !== undefined && score !== null ? String(score) : ''
      })
    })
    return map
  }

  return map
}

function extractScheduledDays(res) {
  if (!res) return null
  if (Array.isArray(res.days) && res.days.length > 0 && typeof res.days[0].d === 'number') {
    return res.days
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// Attendance Tab
// ═══════════════════════════════════════════════════════════════════════════════

function AttendanceTab({ groupId, students: studentsProp }) {
  const { showToast } = useToast()
  const [viewDate, setViewDate] = useState(new Date())
  const [data, setData] = useState({})
  const [original, setOriginal] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [scheduledDays, setScheduledDays] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayDay = today.getDate()
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthLabel = `${UZ_MONTHS[viewDate.getMonth()]} ${year}`
  const isCurMonth = year === today.getFullYear() && month === (today.getMonth() + 1)

  const daysToRender = useMemo(() => {
    if (scheduledDays) return scheduledDays
    return Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1 }))
  }, [scheduledDays, daysInMonth])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getGroupAttendanceCalendar(groupId, { year, month })
      .then(({ data: res }) => {
        if (cancelled) return
        const map = parseAttendanceCalendar(res)
        setData(map)
        setOriginal(map)
        setScheduledDays(extractScheduledDays(res))
        setHasChanges(false)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [groupId, year, month])

  const setStatus = (studentId, day, status) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setData((prev) => {
      const next = { ...prev, [`${studentId}-${date}`]: status }
      setHasChanges(true)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    const changes = []
    Object.entries(data).forEach(([key, value]) => {
      if (value !== original[key]) {
        const parts = key.split('-')
        const studentId = parts[0]
        const date = parts.slice(1).join('-')
        if (date === todayStr) changes.push({ studentId, date, status: value })
      }
    })
    if (changes.length === 0) {
      setSaving(false)
      showToast("⚠️ Bugungi kun uchun hech qanday o'zgarish yo'q", 'error', 3000)
      return
    }
    try {
      const results = await Promise.allSettled(changes.map((c) => updateDayAttendance(groupId, c)))
      const succeeded = results.filter((r) => r.status === 'fulfilled')
      const failed = results.filter((r) => r.status === 'rejected' && r.reason?.response?.status !== 400)
      const newOriginal = { ...original }
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const c = changes[i]
          newOriginal[`${c.studentId}-${c.date}`] = c.status
        }
      })
      setOriginal(newOriginal)
      setHasChanges(false)
      if (failed.length > 0) {
        showToast(`⚠️ ${succeeded.length} ta saqlandi, ${failed.length} ta xatolik`, 'error', 5000)
      } else {
        showToast(`✅ Davomat saqlandi (${succeeded.length} ta)`, 'success', 3000)
      }
    } catch {
      showToast("❌ Davomatni saqlashda xatolik yuz berdi", 'error', 5000)
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const students = studentsProp?.length > 0 ? studentsProp : []

  if (loading) return <LoadingState />
  if (students.length === 0) {
    return (
      <div className="py-12 text-center text-base-content/60 text-sm rounded-2xl bg-base-100 border border-base-200">
        Bu guruhda o'quvchilar yo'q
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Month selector + Save ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="btn btn-ghost btn-sm btn-square">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold min-w-[130px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="btn btn-ghost btn-sm btn-square">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving || !hasChanges}
          className="btn btn-primary btn-sm gap-1.5"
        >
          {saving ? <span className="loading loading-spinner loading-xs" /> : (
            <>
              <CalendarCheck className="w-3.5 h-3.5" />
              Saqlash
            </>
          )}
        </button>
      </div>

      {/* ── MOBILE: Today's cards ── */}
      {isCurMonth && (
        <div className="lg:hidden flex flex-col gap-2">
          <div className="flex items-center gap-2 pb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Bugungi davomat</span>
            {hasChanges && (
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                O'zgartirildi
              </span>
            )}
          </div>

          {students.map((s) => {
            const status = data[`${s.id}-${todayStr}`] ?? 'present'
            const changed = data[`${s.id}-${todayStr}`] !== original[`${s.id}-${todayStr}`]
            return (
              <div
                key={s.id}
                className={`rounded-2xl p-3.5 border transition-all ${
                  changed ? 'border-primary/40 bg-primary/5' : 'border-base-200 bg-base-100'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-base-200 flex items-center justify-center text-sm font-black text-base-content shrink-0">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-bold text-sm text-base-content flex-1 min-w-0">{s.name}</span>
                  {changed && (
                    <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded-full shrink-0">
                      yangi
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'present', label: 'Keldi',   activeClass: 'bg-success text-white shadow-lg shadow-success/25' },
                    { value: 'absent',  label: 'Kelmadi', activeClass: 'bg-error text-white shadow-lg shadow-error/25' },
                    { value: 'late',    label: 'Kech',    activeClass: 'bg-warning text-white shadow-lg shadow-warning/25' },
                  ].map(({ value, label, activeClass }) => (
                    <button
                      key={value}
                      onClick={() => setStatus(s.id, todayDay, value)}
                      className={`py-3 rounded-xl text-xs font-black transition-all ${
                        status === value
                          ? activeClass
                          : 'bg-base-200 text-base-content/50 active:bg-base-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MOBILE: History toggle ── */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowCalendar((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold text-base-content/50 hover:text-base-content transition-colors py-1"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCalendar ? 'rotate-180' : ''}`} />
          Oylik jadval
        </button>
        {showCalendar && (
          <div className="overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-sm mt-2">
            <table className="table table-xs w-full">
              <thead>
                <tr className="bg-base-200/60">
                  <th className="sticky left-0 bg-base-200/60 z-10 min-w-[110px] text-left text-[10px] font-bold uppercase tracking-wide">
                    O'quvchi
                  </th>
                  {daysToRender.map((dayObj) => (
                    <th key={dayObj.d} className="text-center min-w-[26px] text-[10px] font-semibold text-base-content/60">
                      {dayObj.d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-base-200/20">
                    <td className="sticky left-0 bg-base-100 z-10 font-medium text-xs py-1.5 text-base-content truncate max-w-[110px]">
                      {s.name}
                    </td>
                    {daysToRender.map((dayObj) => {
                      const date = `${year}-${String(month).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
                      const status = data[`${s.id}-${date}`] ?? 'present'
                      const isToday = date === todayStr
                      return (
                        <td key={dayObj.d} className="p-0.5 text-center">
                          <div
                            className={`w-5 h-5 text-[8px] font-black rounded flex items-center justify-center mx-auto
                              ${status === 'present' ? 'bg-success/20 text-success' : status === 'absent' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'}
                              ${isToday ? 'ring-1 ring-primary/50' : 'opacity-60'}`}
                          >
                            {status === 'present' ? 'K' : status === 'absent' ? 'Y' : '!'}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DESKTOP: Full calendar table ── */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-sm">
        <table className="table table-xs w-full">
          <thead>
            <tr className="bg-base-200/60">
              <th className="sticky left-0 bg-base-200/60 z-10 min-w-[150px] text-left text-xs font-bold uppercase tracking-wider text-base-content">
                O'quvchi
              </th>
              {daysToRender.map((dayObj) => {
                const day = dayObj.d
                const label = dayObj.l
                const isWeekend = label
                  ? (label === 'Ya' || label === 'Sh')
                  : (new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6)
                return (
                  <th
                    key={day}
                    className={`text-center min-w-[40px] text-[11px] font-semibold ${isWeekend ? 'text-error' : 'text-base-content/70'}`}
                  >
                    <div className="leading-tight">
                      {label && <div className="text-[9px]">{label}</div>}
                      <div>{day}</div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-base-200/20">
                <td className="sticky left-0 bg-base-100 z-10 font-medium text-sm py-2 text-base-content">{s.name}</td>
                {daysToRender.map((dayObj) => {
                  const day = dayObj.d
                  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const status = data[`${s.id}-${date}`] ?? 'present'
                  const changed = data[`${s.id}-${date}`] !== original[`${s.id}-${date}`]
                  const isToday = date === todayStr
                  return (
                    <td key={day} className="p-0.5">
                      {isToday ? (
                        <select
                          value={status}
                          onChange={(e) => setStatus(s.id, day, e.target.value)}
                          className={`w-full h-7 text-[11px] font-bold text-center border-0 outline-none cursor-pointer appearance-none rounded transition-colors ring-1 ring-primary/60 ${STATUS_COLORS[status]} ${changed ? 'ring-primary' : ''}`}
                        >
                          <option value="present">K</option>
                          <option value="absent">Y</option>
                          <option value="late">K!</option>
                        </select>
                      ) : (
                        <div
                          className={`w-full h-7 text-[11px] font-bold text-center rounded flex items-center justify-center opacity-50 cursor-not-allowed select-none ${STATUS_COLORS[status]}`}
                        >
                          {status === 'present' ? 'K' : status === 'absent' ? 'Y' : 'K!'}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center flex-wrap gap-3 text-xs text-base-content/60">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-success text-white font-bold text-[9px] flex items-center justify-center">K</span>
          Keldi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-error text-white font-bold text-[9px] flex items-center justify-center">Y</span>
          Kelmadi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-warning text-white font-bold text-[9px] flex items-center justify-center">!</span>
          Kech keldi
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ratings Tab
// ═══════════════════════════════════════════════════════════════════════════════

function RatingsTab({ groupId, students: studentsProp }) {
  const { showToast } = useToast()
  const [viewDate, setViewDate] = useState(new Date())
  const [data, setData] = useState({})
  const [original, setOriginal] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [scheduledDays, setScheduledDays] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayDay = today.getDate()
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthLabel = `${UZ_MONTHS[viewDate.getMonth()]} ${year}`
  const isCurMonth = year === today.getFullYear() && month === (today.getMonth() + 1)

  const daysToRender = useMemo(() => {
    if (scheduledDays) return scheduledDays
    return Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1 }))
  }, [scheduledDays, daysInMonth])

  const monthlyAverages = useMemo(() => {
    const map = {}
    const list = studentsProp?.length > 0 ? studentsProp : []
    list.forEach((s) => {
      let sum = 0
      let count = 0
      daysToRender.forEach((d) => {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
        const score = data[`${s.id}-${date}`]
        if (score !== '' && score !== undefined) {
          const n = Number(score)
          if (!isNaN(n)) { sum += n; count++ }
        }
      })
      map[s.id] = count > 0 ? sum / count : null
    })
    return map
  }, [studentsProp, daysToRender, data, year, month])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getGroupRatingCalendar(groupId, { year, month })
      .then(({ data: res }) => {
        if (cancelled) return
        const map = parseRatingsCalendar(res)
        setData(map)
        setOriginal(map)
        setScheduledDays(extractScheduledDays(res))
        setHasChanges(false)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [groupId, year, month])

  const setScore = (studentId, day, val) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setData((prev) => {
      const next = { ...prev, [`${studentId}-${date}`]: val }
      setHasChanges(true)
      return next
    })
  }

  const save = async () => {
    setSaving(true)

    const unrated = students.filter((s) => {
      const score = data[`${s.id}-${todayStr}`]
      return score === undefined || score === ''
    })
    if (unrated.length > 0) {
      setSaving(false)
      showToast(`⚠️ ${unrated.map((s) => s.name).join(', ')} — baho kiritilmagan`, 'error', 4000)
      return
    }

    const changes = []
    Object.entries(data).forEach(([key, value]) => {
      if (value !== original[key] && value !== '') {
        const parts = key.split('-')
        const studentId = parts[0]
        const dateStr = parts.slice(1).join('-')
        if (dateStr !== todayStr) return
        const [y, m, d] = dateStr.split('-').map(Number)
        changes.push({ studentId, day: d, month: m, year: y, score: Number(value) })
      }
    })
    if (changes.length === 0) {
      setSaving(false)
      showToast("⚠️ Bugungi kun uchun hech qanday o'zgarish yo'q", 'error', 3000)
      return
    }
    try {
      const results = await Promise.allSettled(changes.map((c) => upsertDayRating(groupId, c)))
      const succeeded = results.filter((r) => r.status === 'fulfilled')
      const failed = results.filter((r) => r.status === 'rejected' && r.reason?.response?.status !== 400)
      const newOriginal = { ...original }
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const c = changes[i]
          const date = `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`
          newOriginal[`${c.studentId}-${date}`] = String(c.score)
        }
      })
      setOriginal(newOriginal)
      setHasChanges(false)
      if (failed.length > 0) {
        showToast(`⚠️ ${succeeded.length} ta saqlandi, ${failed.length} ta xatolik`, 'error', 5000)
      } else {
        showToast(`✅ Baholar saqlandi (${succeeded.length} ta)`, 'success', 3000)
      }
    } catch {
      showToast("❌ Baholarni saqlashda xatolik yuz berdi", 'error', 5000)
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const students = studentsProp?.length > 0 ? studentsProp : []

  if (loading) return <LoadingState />
  if (students.length === 0) {
    return (
      <div className="py-12 text-center text-base-content/60 text-sm rounded-2xl bg-base-100 border border-base-200">
        Bu guruhda o'quvchilar yo'q
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Month selector + Save ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="btn btn-ghost btn-sm btn-square">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold min-w-[130px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="btn btn-ghost btn-sm btn-square">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving || !hasChanges}
          className="btn btn-primary btn-sm gap-1.5"
        >
          {saving ? <span className="loading loading-spinner loading-xs" /> : (
            <>
              <Star className="w-3.5 h-3.5" />
              Saqlash
            </>
          )}
        </button>
      </div>

      {/* ── MOBILE: Today's rating cards ── */}
      {isCurMonth && (
        <div className="lg:hidden flex flex-col gap-2">
          <div className="flex items-center gap-2 pb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Bugungi baholar</span>
            {hasChanges && (
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                O'zgartirildi
              </span>
            )}
          </div>

          {students.map((s) => {
            const score = data[`${s.id}-${todayStr}`] ?? ''
            const avg = monthlyAverages[s.id]
            const num = score !== '' ? Number(score) : null
            return (
              <div key={s.id} className="bg-base-100 rounded-2xl p-3.5 border border-base-200 shadow-sm">
                {/* Student header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-base-200 flex items-center justify-center text-sm font-black text-base-content shrink-0">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-base-content leading-tight">{s.name}</div>
                    {avg !== null && (
                      <div className={`text-xs font-bold leading-tight ${avg >= 8 ? 'text-success' : avg >= 5 ? 'text-warning' : 'text-error'}`}>
                        O'rtacha: {avg.toFixed(1)}
                      </div>
                    )}
                  </div>
                  {num !== null && (
                    <span className={`text-2xl font-black tabular-nums leading-none ${num >= 8 ? 'text-success' : num >= 5 ? 'text-warning' : 'text-error'}`}>
                      {score}
                    </span>
                  )}
                </div>

                {/* 1–10 grid */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => {
                    const isSelected = score === String(n)
                    return (
                      <button
                        key={n}
                        onClick={() => setScore(s.id, todayDay, String(n))}
                        className={`h-11 rounded-xl text-sm font-black transition-all select-none active:scale-95 ${
                          isSelected
                            ? n >= 8
                              ? 'bg-success text-white shadow-md shadow-success/30'
                              : n >= 5
                              ? 'bg-warning text-white shadow-md shadow-warning/30'
                              : 'bg-error text-white shadow-md shadow-error/30'
                            : 'bg-base-200 text-base-content/50 active:bg-base-300'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MOBILE: History toggle ── */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowCalendar((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold text-base-content/50 hover:text-base-content transition-colors py-1"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCalendar ? 'rotate-180' : ''}`} />
          Oylik jadval
        </button>
        {showCalendar && (
          <div className="overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-sm mt-2">
            <table className="table table-xs w-full">
              <thead>
                <tr className="bg-base-200/60">
                  <th className="sticky left-0 bg-base-200/60 z-10 min-w-[110px] text-left text-[10px] font-bold uppercase tracking-wide">
                    O'quvchi
                  </th>
                  {daysToRender.map((dayObj) => (
                    <th key={dayObj.d} className="text-center min-w-[26px] text-[10px] font-semibold text-base-content/60">
                      {dayObj.d}
                    </th>
                  ))}
                  <th className="text-center min-w-[40px] text-[10px] font-bold bg-base-200/80">O'rt.</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-base-200/20">
                    <td className="sticky left-0 bg-base-100 z-10 font-medium text-xs py-1.5 text-base-content truncate max-w-[110px]">
                      {s.name}
                    </td>
                    {daysToRender.map((dayObj) => {
                      const date = `${year}-${String(month).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
                      const score = data[`${s.id}-${date}`] ?? ''
                      const num = score !== '' ? Number(score) : null
                      const color = num === null ? 'text-base-content/20' : num >= 8 ? 'text-success' : num >= 5 ? 'text-warning' : 'text-error'
                      return (
                        <td key={dayObj.d} className="p-0.5 text-center">
                          <span className={`text-[9px] font-bold ${color}`}>{score || '—'}</span>
                        </td>
                      )
                    })}
                    <td className="text-center font-bold text-xs bg-base-200/30">
                      {monthlyAverages[s.id] === null ? (
                        <span className="text-base-content/40">-</span>
                      ) : (
                        <span className={monthlyAverages[s.id] >= 8 ? 'text-success' : monthlyAverages[s.id] >= 5 ? 'text-warning' : 'text-error'}>
                          {monthlyAverages[s.id].toFixed(1)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DESKTOP: Full calendar table ── */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-sm">
        <table className="table table-xs w-full">
          <thead>
            <tr className="bg-base-200/60">
              <th className="sticky left-0 bg-base-200/60 z-10 min-w-[150px] text-left text-xs font-bold uppercase tracking-wider text-base-content">
                O'quvchi
              </th>
              {daysToRender.map((dayObj) => {
                const day = dayObj.d
                const label = dayObj.l
                const isWeekend = label
                  ? (label === 'Ya' || label === 'Sh')
                  : (new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6)
                return (
                  <th
                    key={day}
                    className={`text-center min-w-[44px] text-[11px] font-semibold ${isWeekend ? 'text-error' : 'text-base-content/70'}`}
                  >
                    <div className="leading-tight">
                      {label && <div className="text-[9px]">{label}</div>}
                      <div>{day}</div>
                    </div>
                  </th>
                )
              })}
              <th className="text-center min-w-[60px] text-[11px] font-bold bg-base-200/80 uppercase tracking-wider text-base-content">
                O'rtacha
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-base-200/20">
                <td className="sticky left-0 bg-base-100 z-10 font-medium text-sm py-2 text-base-content">{s.name}</td>
                {daysToRender.map((dayObj) => {
                  const day = dayObj.d
                  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const score = data[`${s.id}-${date}`] ?? ''
                  const changed = data[`${s.id}-${date}`] !== original[`${s.id}-${date}`]
                  const num = score !== '' ? Number(score) : null
                  const color = num === null ? '' : num >= 8 ? 'text-success' : num >= 5 ? 'text-warning' : 'text-error'
                  const isToday = date === todayStr
                  return (
                    <td key={day} className="p-0.5">
                      {isToday ? (
                        <select
                          value={score}
                          onChange={(e) => setScore(s.id, day, e.target.value)}
                          className={`w-full h-7 text-[11px] font-bold text-center border border-primary/40 outline-none bg-base-100 cursor-pointer rounded transition-colors ${color} ${changed ? 'ring-1 ring-primary' : ''}`}
                          title={`${s.name} — ${date}${score !== '' ? `: ${score}` : ''}`}
                        >
                          <option value="">—</option>
                          {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className={`w-full h-7 text-[11px] font-bold text-center rounded flex items-center justify-center opacity-50 cursor-not-allowed bg-base-200/30 ${color}`}
                          title={`${date} — faqat bugun o'zgartiriladi`}
                        >
                          {score !== '' ? score : <span className="text-base-content/20">—</span>}
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="text-center font-bold text-sm bg-base-200/30 min-w-[60px]">
                  {monthlyAverages[s.id] === null ? (
                    <span className="text-base-content/60">-</span>
                  ) : (
                    <span className={monthlyAverages[s.id] >= 8 ? 'text-success' : monthlyAverages[s.id] >= 5 ? 'text-warning' : 'text-error'}>
                      {monthlyAverages[s.id].toFixed(1)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center flex-wrap gap-3 text-xs text-base-content/60">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded text-success font-bold flex items-center justify-center text-[10px]">8+</span>
          A'lo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded text-warning font-bold flex items-center justify-center text-[10px]">5+</span>
          Yaxshi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded text-error font-bold flex items-center justify-center text-[10px]">&lt;5</span>
          Past
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Screen Time Tab
// ═══════════════════════════════════════════════════════════════════════════════

export const CAT_CFG = {
  entertainment: { label: 'Ko\'rinish',    color: 'bg-red-400',    text: 'text-red-500'    },
  social:        { label: 'Ijtimoiy',      color: 'bg-pink-400',   text: 'text-pink-500'   },
  education:     { label: 'Ta\'lim',       color: 'bg-emerald-400',text: 'text-emerald-600'},
  music:         { label: 'Musiqa',        color: 'bg-blue-400',   text: 'text-blue-500'   },
  games:         { label: 'O\'yinlar',     color: 'bg-amber-400',  text: 'text-amber-600'  },
  productivity:  { label: 'Samaradorlik',  color: 'bg-teal-400',   text: 'text-teal-600'   },
  other:         { label: 'Boshqa',        color: 'bg-gray-300',   text: 'text-gray-500'   },
}

export function fmtMin(min) {
  const m = Number(min ?? 0)
  if (m >= 60) return `${Math.floor(m / 60)}s ${m % 60}d`
  return `${m}d`
}

// StayFree uslubidagi silliq to'lqinsimon maydon grafigi (SVG)
export function SmoothAreaChart({ values, color = '#7C3AED', height = 130 }) {
  const w = 600
  const h = height
  const pad = 14
  if (!values || values.length === 0) {
    return (
      <div className="rounded-2xl bg-base-200/40 flex items-center justify-center text-xs text-base-content/40" style={{ height }}>
        Ma'lumot yo'q
      </div>
    )
  }
  const max = Math.max(...values, 1)
  const n = values.length
  const stepX = n > 1 ? (w - pad * 2) / (n - 1) : 0
  const pts = values.map((v, i) => [
    pad + (n > 1 ? i * stepX : (w - pad * 2) / 2),
    pad + (h - pad * 2) * (1 - v / max),
  ])
  let path = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
    path += ` Q ${x1} ${y1} ${mx} ${my}`
  }
  path += ` T ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`
  const fillPath = `${path} L ${pts[pts.length - 1][0]} ${h - pad} L ${pts[0][0]} ${h - pad} Z`
  const gradId = `grad-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + (h - pad * 2) * i / 3} y2={pad + (h - pad * 2) * i / 3} stroke="#F1F1F6" strokeWidth="1" />
      ))}
      <path d={fillPath} fill={`url(#${gradId})`} stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4.5" fill="#fff" />
          <circle cx={x} cy={y} r="3" fill={color} />
        </g>
      ))}
    </svg>
  )
}

function ScreenTimeTab({ groupId, students }) {
  const navigate = useNavigate()
  const now = new Date()
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getGroupScreenTimeSummary(month, groupId)
      .then(r => {
        const raw = r.data?.data ?? r.data ?? []
        setSummary(Array.isArray(raw) ? raw : [])
      })
      .catch(() => setSummary([]))
      .finally(() => setLoading(false))
  }, [month, groupId])

  // Students bilan summary ni birlashtirish
  const rows = useMemo(() => {
    return students.map(s => {
      const sid = s.id ?? s._id
      const found = summary.find(x => (x.studentId ?? x.id ?? x._id) === sid)
      return { ...s, id: sid, screenTime: found ?? null }
    }).sort((a, b) => (b.screenTime?.totalMinutes ?? 0) - (a.screenTime?.totalMinutes ?? 0))
  }, [students, summary])

  const maxMin = useMemo(() =>
    Math.max(...rows.map(r => r.screenTime?.totalMinutes ?? 0), 1), [rows])

  const prevMonth = () => {
    const d = new Date(month + '-01')
    d.setMonth(d.getMonth() - 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const d = new Date(month + '-01')
    d.setMonth(d.getMonth() + 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next <= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
      setMonth(next)
  }

  const monthLabel = `${UZ_MONTHS[Number(month.split('-')[1]) - 1]} ${month.split('-')[0]}`

  return (
    <div className="space-y-4">

      {/* Oy navigatsiyasi */}
      <div className="flex items-center justify-between bg-base-100 rounded-2xl border border-base-200 shadow-sm px-5 py-3">
        <button onClick={prevMonth} className="btn btn-ghost btn-sm btn-square">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-base-content">{monthLabel}</span>
        <button onClick={nextMonth} className="btn btn-ghost btn-sm btn-square">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Jadval */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-base-200 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-base-content">Ekran vaqti reytingi</span>
          <span className="ml-auto text-xs text-base-content/40">{rows.filter(r => r.screenTime).length}/{rows.length} ta sinxronlashgan</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-base-200">
            {rows.map((row, idx) => {
              const min = row.screenTime?.totalMinutes ?? 0
              const pct = Math.round((min / maxMin) * 100)
              const topApp = row.screenTime?.topApps?.[0]
              const hasSynced = !!row.screenTime

              return (
                <button
                  key={row.id}
                  onClick={() => navigate(`/teacher/groups/${groupId}/students/${row.id}/screen-time`, { state: { student: row, month } })}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-base-200/40 transition-colors text-left"
                >
                  {/* Rank */}
                  <span className={`text-sm font-black w-6 shrink-0 text-center ${
                    idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-base-content/30'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </span>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {row.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-base-content truncate">{row.name}</span>
                      {hasSynced ? (
                        <span className="text-xs font-bold text-violet-600 tabular-nums shrink-0">{fmtMin(min)}</span>
                      ) : (
                        <span className="text-[10px] text-base-content/30 shrink-0">sync yo'q</span>
                      )}
                    </div>
                    {hasSynced ? (
                      <>
                        <div className="h-1.5 bg-base-200 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        {topApp && (
                          <p className="text-[10px] text-base-content/40 truncate">
                            Eng ko'p: <span className="font-semibold">{topApp.appName}</span> · {fmtMin(topApp.minutes)}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="h-1.5 bg-base-200/50 rounded-full" />
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-base-content/20 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('attendance')

  const fetchGroup = useCallback(() => getGroupById(id), [id])
  const { data: rawGroup, loading, error } = useFetch(fetchGroup, [id])
  const group = rawGroup?.data || rawGroup

  const fetchAttendanceForRoster = useCallback(
    () => getGroupAttendance(id, new Date().toISOString().split('T')[0]),
    [id]
  )
  const { data: attendanceRoster } = useFetch(fetchAttendanceForRoster, [id])

  const students = useMemo(() => {
    if (group?.students?.length > 0) return group.students
    if (!Array.isArray(attendanceRoster)) return []
    const map = {}
    attendanceRoster.forEach((r) => {
      if (r.student && r.studentId) map[r.studentId] = r.student
    })
    return Object.values(map)
  }, [group, attendanceRoster])

  if (loading) return <div className="flex flex-col gap-6"><LoadingState /></div>
  if (error) return <div className="flex flex-col gap-6"><ErrorState message={error} /></div>

  const TABS = [
    { key: 'attendance', label: 'Davomat', icon: <CalendarCheck className="w-3.5 h-3.5" /> },
    { key: 'ratings',    label: 'Baholar', icon: <Star          className="w-3.5 h-3.5" /> },
    { key: 'screentime', label: 'Tahlil',  icon: <Monitor       className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="flex flex-col gap-4 md:gap-6">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm btn-square mt-0.5 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-base-content leading-tight">
            {group?.name ?? 'Guruh'}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            {group?.course && (
              <span className="text-sm text-base-content/60">
                {group.course.title ?? group.course.name}
              </span>
            )}
            {group?.schedule && (
              <>
                <span className="text-base-content/30">·</span>
                <span className="text-sm text-base-content/60">
                  {Array.isArray(group.schedule.days) ? group.schedule.days.join(', ') : group.schedule.days}
                  {group.schedule.fromHour && group.schedule.toHour &&
                    ` · ${group.schedule.fromHour}–${group.schedule.toHour}`}
                </span>
              </>
            )}
            <span className="text-base-content/30">·</span>
            <span className="text-sm text-base-content/60">{students.length} o'quvchi</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-base-200/60 rounded-xl w-fit">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-base-100 text-base-content shadow-sm'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'attendance' && <AttendanceTab  groupId={id} students={students} />}
      {activeTab === 'ratings'    && <RatingsTab     groupId={id} students={students} />}
      {activeTab === 'screentime' && <ScreenTimeTab  groupId={id} students={students} />}
    </div>
  )
}
