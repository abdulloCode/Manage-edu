import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { getGroupById } from '../../api/groups'
import { getGroupAttendance, getGroupAttendanceCalendar, updateDayAttendance } from '../../api/attendance'
import { getGroupRatingCalendar, upsertDayRating } from '../../api/ratings'
import { LoadingState, ErrorState } from '../../components/PageShell'

const STATUS_COLORS = {
  present: 'bg-success/15 text-success hover:bg-success/25',
  absent:  'bg-error/15 text-error hover:bg-error/25',
  late:    'bg-warning/15 text-warning hover:bg-warning/25',
}

const STATUS_LABELS = { present: 'P', absent: 'A', late: 'L' }

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

function extractCalendarStudents(res) {
  if (!res || !Array.isArray(res.students)) return null
  return res.students.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }))
}

// ═══════════════════════════════════════════════════════════════════════════════
// Attendance Tab — Monthly Calendar
// ═══════════════════════════════════════════════════════════════════════════════

function AttendanceTab({ groupId, students: studentsProp }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [data, setData] = useState({})      // { "studentId-YYYY-MM-DD": "present" }
  const [original, setOriginal] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [scheduledDays, setScheduledDays] = useState(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const daysToRender = useMemo(() => {
    if (scheduledDays) return scheduledDays
    return Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1 }))
  }, [scheduledDays, daysInMonth])

  // Fetch monthly calendar
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
        changes.push({ studentId, date, status: value })
      }
    })
    try {
      await Promise.all(changes.map((c) => updateDayAttendance(groupId, c)))
      setOriginal({ ...data })
      setHasChanges(false)
    } catch (err) {
      console.error(err)
      alert('Failed to save some attendance records')
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const students = studentsProp?.length > 0 ? studentsProp : []

  if (loading) return <LoadingState />
  if (students.length === 0) {
    return <div className="py-12 text-center text-base-content/30 text-sm rounded-2xl bg-base-100 border border-base-200">No students in this group</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn btn-sm btn-ghost btn-square">←</button>
          <span className="text-base font-semibold min-w-[160px] text-center text-base-content">{monthLabel}</span>
          <button onClick={nextMonth} className="btn btn-sm btn-ghost btn-square">→</button>
        </div>
        <button
          onClick={save}
          disabled={saving || !hasChanges}
          className="btn btn-primary btn-sm px-5"
        >
          {saving ? <span className="loading loading-spinner loading-xs" /> : 'Save Attendance'}
        </button>
      </div>

      {/* Calendar table */}
      <div className="overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-sm">
        <table className="table table-xs w-full">
          <thead>
            <tr className="bg-base-200/60">
              <th className="sticky left-0 bg-base-200/60 z-10 min-w-[150px] text-left text-xs font-bold uppercase tracking-wider text-base-content">Student</th>
              {daysToRender.map((dayObj) => {
                const day = dayObj.d
                const label = dayObj.l
                const isWeekend = label ? (label === 'Ya' || label === 'Sh') : (new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6)
                return (
                  <th key={day} className={`text-center min-w-[40px] text-[11px] font-semibold ${isWeekend ? 'text-error/60' : 'text-base-content/50'}`}>
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
                  return (
                    <td key={day} className="p-0.5">
                      <select
                        value={status}
                        onChange={(e) => setStatus(s.id, day, e.target.value)}
                        className={`w-full h-7 text-[11px] font-bold text-center border-0 outline-none cursor-pointer appearance-none rounded transition-colors ${STATUS_COLORS[status]} ${changed ? 'ring-1 ring-primary/40' : ''}`}
                        title={`${s.name} — ${date}: ${status}`}
                      >
                        <option value="present">P</option>
                        <option value="absent">A</option>
                        <option value="late">L</option>
                      </select>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-base-content/50">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/15 text-success font-bold text-[10px] flex items-center justify-center">P</span> Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-error/15 text-error font-bold text-[10px] flex items-center justify-center">A</span> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/15 text-warning font-bold text-[10px] flex items-center justify-center">L</span> Late</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-primary/40" /> Changed</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ratings Tab — Monthly Calendar
// ═══════════════════════════════════════════════════════════════════════════════

function RatingsTab({ groupId, students: studentsProp }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [data, setData] = useState({})      // { "studentId-YYYY-MM-DD": "85" }
  const [original, setOriginal] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [scheduledDays, setScheduledDays] = useState(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

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

  // Fetch monthly calendar
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
    const num = val.replace(/[^0-9]/g, '').slice(0, 2)
    if (num !== '' && Number(num) > 10) return
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setData((prev) => {
      const next = { ...prev, [`${studentId}-${date}`]: num }
      setHasChanges(true)
      return next
    })
  }

  const handleRatingKeyDown = (e) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
    e.preventDefault()

    const input = e.target
    const td = input.closest('td')
    const tr = td.closest('tr')
    const table = tr.closest('table')
    const rows = table.querySelectorAll('tbody tr')
    const rowIndex = Array.from(rows).indexOf(tr)
    const colIndex = Array.from(tr.children).indexOf(td)

    let targetInput = null

    if (e.key === 'ArrowLeft') {
      for (let i = colIndex - 1; i >= 0; i--) {
        const inp = tr.children[i]?.querySelector('input')
        if (inp) { targetInput = inp; break }
      }
    } else if (e.key === 'ArrowRight') {
      for (let i = colIndex + 1; i < tr.children.length; i++) {
        const inp = tr.children[i]?.querySelector('input')
        if (inp) { targetInput = inp; break }
      }
    } else if (e.key === 'ArrowUp') {
      for (let i = rowIndex - 1; i >= 0; i--) {
        const inp = rows[i].children[colIndex]?.querySelector('input')
        if (inp) { targetInput = inp; break }
      }
    } else if (e.key === 'ArrowDown') {
      for (let i = rowIndex + 1; i < rows.length; i++) {
        const inp = rows[i].children[colIndex]?.querySelector('input')
        if (inp) { targetInput = inp; break }
      }
    }

    if (targetInput) {
      targetInput.focus()
      targetInput.select()
    }
  }

  const save = async () => {
    setSaving(true)
    const changes = []
    Object.entries(data).forEach(([key, value]) => {
      if (value !== original[key] && value !== '') {
        const parts = key.split('-')
        const studentId = parts[0]
        const dateStr = parts.slice(1).join('-')
        const [y, m, d] = dateStr.split('-').map(Number)
        changes.push({ studentId, day: d, month: m, year: y, score: Number(value) })
      }
    })
    try {
      await Promise.all(changes.map((c) => upsertDayRating(groupId, c)))
      setOriginal({ ...data })
      setHasChanges(false)
    } catch (err) {
      console.error(err)
      alert('Failed to save some ratings')
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const students = studentsProp?.length > 0 ? studentsProp : []

  if (loading) return <LoadingState />
  if (students.length === 0) {
    return <div className="py-12 text-center text-base-content/30 text-sm rounded-2xl bg-base-100 border border-base-200">No students in this group</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn btn-sm btn-ghost btn-square">←</button>
          <span className="text-base font-semibold min-w-[160px] text-center text-base-content">{monthLabel}</span>
          <button onClick={nextMonth} className="btn btn-sm btn-ghost btn-square">→</button>
        </div>
        <button
          onClick={save}
          disabled={saving || !hasChanges}
          className="btn btn-primary btn-sm px-5"
        >
          {saving ? <span className="loading loading-spinner loading-xs" /> : 'Save Ratings'}
        </button>
      </div>

      {/* Calendar table */}
      <div className="overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-sm">
        <table className="table table-xs w-full">
          <thead>
            <tr className="bg-base-200/60">
              <th className="sticky left-0 bg-base-200/60 z-10 min-w-[150px] text-left text-xs font-bold uppercase tracking-wider text-base-content">Student</th>
              {daysToRender.map((dayObj) => {
                const day = dayObj.d
                const label = dayObj.l
                const isWeekend = label ? (label === 'Ya' || label === 'Sh') : (new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6)
                return (
                  <th key={day} className={`text-center min-w-[44px] text-[11px] font-semibold ${isWeekend ? 'text-error/60' : 'text-base-content/50'}`}>
                    <div className="leading-tight">
                      {label && <div className="text-[9px]">{label}</div>}
                      <div>{day}</div>
                    </div>
                  </th>
                )
              })}
              <th className="text-center min-w-[60px] text-[11px] font-bold bg-base-200/80 uppercase tracking-wider text-base-content">Monthly</th>
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
                  return (
                    <td key={day} className="p-0.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder=""
                        value={score}
                        onChange={(e) => setScore(s.id, day, e.target.value)}
                        onKeyDown={handleRatingKeyDown}
                        className={`w-full h-7 text-[11px] font-bold text-center border border-base-200 outline-none bg-base-100 focus:bg-base-200/50 rounded transition-colors ${color} ${changed ? 'ring-1 ring-primary/40' : ''}`}
                        title={`${s.name} — ${date}${score !== '' ? `: ${score}` : ''}`}
                      />
                    </td>
                  )
                })}
                <td className="text-center font-bold text-sm bg-base-200/30 min-w-[60px] text-base-content">
                  {monthlyAverages[s.id] === null ? (
                    <span className="text-base-content/30">-</span>
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-base-content/50">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded text-success font-bold text-[10px] flex items-center justify-center">8+</span> Excellent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded text-warning font-bold text-[10px] flex items-center justify-center">5+</span> Good</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded text-error font-bold text-[10px] flex items-center justify-center">&lt;5</span> Needs work</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-primary/40" /> Changed</span>
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
  const { data: group, loading, error } = useFetch(fetchGroup, [id])

  // Fetch attendance to get student roster (group API doesn't return students)
  const fetchAttendanceForRoster = useCallback(() => getGroupAttendance(id, new Date().toISOString().split('T')[0]), [id])
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

  if (loading) return (
    <div className="flex flex-col gap-6">
      <LoadingState />
    </div>
  )
  if (error) return (
    <div className="flex flex-col gap-6">
      <ErrorState message={error} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/teacher/groups')}
          className="btn btn-ghost btn-sm btn-square mt-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-base-content">{group?.name ?? 'Group'}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {group?.course && (
              <span className="text-sm text-base-content/50">
                {group.course.title ?? group.course.name}
              </span>
            )}
            {group?.schedule && (
              <>
                <span className="text-base-content/20">·</span>
                <span className="text-sm text-base-content/40">
                  {Array.isArray(group.schedule.days) ? group.schedule.days.join(', ') : group.schedule.days}
                  {group.schedule.fromHour && group.schedule.toHour && ` · ${group.schedule.fromHour}–${group.schedule.toHour}`}
                </span>
              </>
            )}
            <span className="text-base-content/20">·</span>
            <span className="text-sm text-base-content/40">{students.length} students</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-base-200/60 rounded-xl w-fit">
        {[
          { key: 'attendance', label: 'Attendance' },
          { key: 'ratings',    label: 'Ratings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-base-100 text-base-content shadow-sm'
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'attendance' && (
        <AttendanceTab groupId={id} students={students} />
      )}
      {activeTab === 'ratings' && (
        <RatingsTab groupId={id} students={students} />
      )}
    </div>
  )
}
