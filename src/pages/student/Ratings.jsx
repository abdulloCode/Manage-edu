import { useState, useEffect } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getMyRatings, getGroupRatingCalendar } from '../../api/ratings'
import { getMyGroups } from '../../api/groups'
import { useAuth } from '../../context/AuthContext'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { BookOpen, Star, Trophy, TrendingUp, CalendarDays } from 'lucide-react'

/* ── helpers ── */
function fmtDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  const M = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek']
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`
}

function scoreCfg(score, max) {
  const label = score == null ? '—' : max ? `${score}/${max}` : String(score)
  const pct   = max ? (score/max)*100 : score ?? 0
  if (score == null)  return { label, bg:'bg-gray-100', text:'text-gray-400', bar:'bg-gray-200' }
  if (pct >= 85)      return { label, bg:'bg-emerald-100', text:'text-emerald-600', bar:'bg-emerald-400' }
  if (pct >= 60)      return { label, bg:'bg-amber-100', text:'text-amber-600', bar:'bg-amber-400' }
  return                     { label, bg:'bg-rose-100', text:'text-rose-600', bar:'bg-rose-400' }
}

function buildLeaderboard(res, uid) {
  if (!res) return []
  return (Array.isArray(res.students) ? res.students : [])
    .map(s => {
      const scores = Object.values(s.ratings ?? s.scores ?? {})
      const total  = scores.reduce((a,v)=>a+(Number(v)||0), 0)
      const count  = scores.filter(v=>v!=null && v!=='').length
      return { id: s.id??s._id, name: s.name??"Noma'lum", total, count, isMe: String(s.id??s._id) === String(uid) }
    })
    .sort((a,b) => b.total-a.total || a.name.localeCompare(b.name))
}

const MEDAL = ['🥇','🥈','🥉']

/* ── Main ── */
export default function Ratings() {
  const { user } = useAuth()
  const uid = user?._id ?? user?.id
  const [tab, setTab]                       = useState('my')
  const [groups, setGroups]                 = useState([])
  const [activeGroup, setActiveGroup]       = useState(null)
  const [leaderboard, setLeaderboard]       = useState([])
  const [lbLoading, setLbLoading]           = useState(false)
  const [yearlyBoard, setYearlyBoard]       = useState([])
  const [yearlyLoading, setYearlyLoading]   = useState(false)

  const { data, loading, error } = useFetch(getMyRatings)
  const records = Array.isArray(data) ? data : []
  const { visible, sentinelRef, hasMore, shown } = useInfiniteScroll(records, 20)

  const avgScore  = records.length
    ? (records.reduce((s,r)=>s+Number(r.score??r.grade??0),0)/records.length).toFixed(1) : null
  const bestScore = records.length
    ? Math.max(...records.map(r=>Number(r.score??r.grade??0))) : null

  /* groups */
  useEffect(() => {
    getMyGroups()
      .then(({ data: d }) => {
        const list = Array.isArray(d) ? d : (d?.groups ?? [])
        setGroups(list)
        if (list.length) setActiveGroup(list[0])
      })
      .catch(()=>{})
  }, [])

  /* monthly leaderboard */
  useEffect(() => {
    if (!activeGroup) return
    const now = new Date()
    setLbLoading(true); setLeaderboard([])
    getGroupRatingCalendar(activeGroup.id??activeGroup._id, {
      year: now.getFullYear(), month: now.getMonth()+1
    })
      .then(({ data: res }) => setLeaderboard(buildLeaderboard(res, uid)))
      .catch(()=>setLeaderboard([]))
      .finally(()=>setLbLoading(false))
  }, [activeGroup, uid])

  /* yearly leaderboard — yil boshidan hozirgi oyga qadar */
  useEffect(() => {
    if (tab !== 'yearly' || !activeGroup) return
    loadYearlyBoard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activeGroup])

  const loadYearlyBoard = async () => {
    setYearlyLoading(true)
    setYearlyBoard([])
    try {
      const now          = new Date()
      const year         = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const gId          = activeGroup.id ?? activeGroup._id

      const promises = []
      for (let m = 1; m <= currentMonth; m++) {
        promises.push(
          getGroupRatingCalendar(gId, { year, month: m })
            .then(r => r.data)
            .catch(() => null)
        )
      }
      const results = await Promise.all(promises)

      const studentMap = {}
      results.forEach(res => {
        if (!res || !Array.isArray(res.students)) return
        res.students.forEach(s => {
          const id     = String(s.id ?? s._id)
          const scores = Object.values(s.ratings ?? s.scores ?? {})
          const total  = scores.reduce((a, v) => a + (Number(v) || 0), 0)
          const count  = scores.filter(v => v != null && v !== '').length
          if (!studentMap[id]) {
            studentMap[id] = { id, name: s.name ?? "Noma'lum", total: 0, count: 0,
              isMe: id === String(uid) }
          }
          studentMap[id].total += total
          studentMap[id].count += count
        })
      })

      const sorted = Object.values(studentMap)
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
      setYearlyBoard(sorted)
    } catch {
      setYearlyBoard([])
    } finally {
      setYearlyLoading(false)
    }
  }

  /* ── shared: group selector ── */
  const GroupTabs = () => groups.length > 1 ? (
    <div className="flex gap-2 flex-wrap">
      {groups.map(g => {
        const gid = g.id??g._id
        const aid = activeGroup?.id??activeGroup?._id
        return (
          <button key={gid} onClick={()=>setActiveGroup(g)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              gid===aid
                ? 'bg-violet-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'
            }`}>
            {g.name}
          </button>
        )
      })}
    </div>
  ) : null

  /* ── shared: leaderboard list ── */
  const LeaderList = ({ list, emptyText }) => {
    if (!list.length) return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-gray-400 text-sm font-medium">{emptyText}</p>
      </div>
    )

    const maxTot = list[0]?.total || 1
    return (
      <div className="space-y-2">
        {list.map((s, i) => {
          const rank = i + 1
          const pct  = Math.round((s.total / maxTot) * 100)
          return (
            <div key={s.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                s.isMe ? 'border-violet-300 ring-1 ring-violet-200' : 'border-gray-100'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                  rank===1 ? 'bg-yellow-100 text-yellow-500' :
                  rank===2 ? 'bg-gray-100   text-gray-500'   :
                  rank===3 ? 'bg-orange-100 text-orange-500' :
                  s.isMe   ? 'bg-violet-100 text-violet-600' :
                             'bg-gray-50    text-gray-400'
                }`}>
                  {rank<=3 ? MEDAL[rank-1] : rank}
                </div>

                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  s.isMe ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {s.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-[14px] font-semibold truncate ${s.isMe?'text-violet-600':'text-gray-800'}`}>
                      {s.name}
                    </span>
                    {s.isMe && (
                      <span className="text-[10px] font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-full shrink-0">
                        siz
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      s.isMe?'bg-violet-400':rank===1?'bg-yellow-400':rank===2?'bg-gray-400':rank===3?'bg-orange-400':'bg-gray-200'
                    }`} style={{width:`${pct}%`}} />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-[15px] font-black tabular-nums ${s.isMe?'text-violet-600':'text-gray-700'}`}>
                    {s.total}
                  </p>
                  <p className="text-[10px] text-gray-300">{s.count} dars</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reytinglar</h1>
        <p className="text-sm text-gray-400 mt-0.5">Baholar va natijalar</p>
      </div>

      {/* tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key:'my',     label:'Mening baholarim', icon: Star        },
          { key:'board',  label:'Oylik reyting',    icon: Trophy      },
          { key:'yearly', label:'Yillik reyting',   icon: CalendarDays },
        ].map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab===t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MY RATINGS ── */}
      {tab === 'my' && (<>
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Yuklanmoqda…</p>
          </div>
        )}
        {error && !loading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
            <p className="text-rose-500 text-sm text-center">{error}</p>
          </div>
        )}
        {!loading && !error && records.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-medium">Hali baholar yo'q</p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (<>
          {/* stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"O'rtacha ball", value: avgScore??'—'         },
              { label:'Eng yuqori',    value: bestScore??'—'        },
              { label:'Jami baho',     value: `${records.length} ta` },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                <p className="text-xl font-black text-gray-800 tabular-nums">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* list */}
          <div className="space-y-2">
            {visible.map((r, i) => {
              const score = r.score ?? r.grade
              const max   = r.maxScore ?? r.maxGrade
              const cfg   = scoreCfg(score, max)
              const pct   = max ? Math.round((score/max)*100) : null
              return (
                <div key={r.id??r._id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-violet-200 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-semibold text-gray-800 leading-snug">
                          {r.lesson?.title ?? r.title ?? r.task ?? 'Dars'}
                        </p>
                        <span className={`text-[13px] font-black px-2.5 py-0.5 rounded-xl shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {r.group?.name ? `${r.group.name} · ` : ''}{fmtDate(r.date ?? r.createdAt)}
                      </p>
                      {pct !== null && (
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.bar}`} style={{width:`${pct}%`}} />
                        </div>
                      )}
                      {r.comment && <p className="text-xs text-gray-300 mt-1 truncate">{r.comment}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-between px-1 py-2">
              <span className="text-xs text-gray-400">{shown} / {records.length} ta</span>
              {hasMore && <span className="text-xs text-violet-500 animate-pulse">Yuklanmoqda…</span>}
            </div>
            <div ref={sentinelRef} className="h-1" />
          </div>
        </>)}
      </>)}

      {/* ── MONTHLY LEADERBOARD ── */}
      {tab === 'board' && (<>
        <GroupTabs />

        {lbLoading && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Yuklanmoqda…</p>
          </div>
        )}

        {!lbLoading && (<>
          {/* my rank */}
          {(() => {
            const me   = leaderboard.find(s=>s.isMe)
            const rank = me ? leaderboard.indexOf(me)+1 : null
            if (!me) return null
            return (
              <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-200">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                  {rank<=3 ? MEDAL[rank-1] : `#${rank}`}
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-xs font-semibold mb-0.5">Sizning o'rningiz</p>
                  <p className="text-gray-800 text-2xl font-black">{rank}‑o'rin</p>
                  <p className="text-gray-400 text-xs">{me.total} ball · {me.count} ta dars</p>
                </div>
                <TrendingUp className="w-6 h-6 text-gray-300 shrink-0" />
              </div>
            )
          })()}

          <LeaderList list={leaderboard} emptyText="Guruh reytingi mavjud emas" />
        </>)}
      </>)}

      {/* ── YEARLY LEADERBOARD ── */}
      {tab === 'yearly' && (<>
        <GroupTabs />

        {/* info badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl w-fit">
          <CalendarDays className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-xs font-semibold text-violet-600">
            {new Date().getFullYear()} yil — Yanvardan hozirgi oygacha yig'ilgan ball
          </span>
        </div>

        {yearlyLoading && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Yuklanmoqda…</p>
          </div>
        )}

        {!yearlyLoading && (<>
          {/* my rank */}
          {(() => {
            const me   = yearlyBoard.find(s=>s.isMe)
            const rank = me ? yearlyBoard.indexOf(me)+1 : null
            if (!me) return null
            return (
              <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-violet-200">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl shrink-0">
                  {rank<=3 ? MEDAL[rank-1] : `#${rank}`}
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-xs font-semibold mb-0.5">Yillik o'rningiz</p>
                  <p className="text-violet-700 text-2xl font-black">{rank}‑o'rin</p>
                  <p className="text-gray-400 text-xs">{me.total} ball · {me.count} ta dars</p>
                </div>
                <TrendingUp className="w-6 h-6 text-violet-300 shrink-0" />
              </div>
            )
          })()}

          <LeaderList list={yearlyBoard} emptyText="Yillik reyting ma'lumoti yo'q" />
        </>)}
      </>)}
    </div>
  )
}
