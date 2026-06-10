import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { getMyTeacherData, getMyTeacherGroups } from "../../api/teachers";
import { getGroupById } from "../../api/groups";
import {
  Users, BookOpen, Wallet, TrendingUp, TrendingDown,
  ChevronRight, GraduationCap, Bell, Search,
  CalendarDays, BarChart2,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────── */

const fmt  = (n) => Number(n ?? 0).toLocaleString("uz-UZ");
const fmtK = (n) => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

const TODAY_ALIASES = {
  0: ["Ya","Yak","Yakshanba"],
  1: ["Du","Dush","Dushanba"],
  2: ["Se","Sesh","Seshanba"],
  3: ["Chor","Chorshanba"],
  4: ["Pa","Pay","Payshanba"],   // admin "Pa", some APIs "Pay"
  5: ["Ju","Jum","Juma"],
  6: ["Sha","Sh","Shan","Shanba"], // admin "Sha", legacy "Sh"/"Shan"
};
const DAY_LABELS = ["Ya","Du","Se","Ch","Pa","Ju","Sh"];

function toMin(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/* ── Wave sparkline ──────────────────────────────────────── */
function Wave({ color = "#7C3AED", opacity = 0.15 }) {
  const W = 200, H = 40;
  const pts = [
    [0,28],[30,18],[60,30],[90,14],[120,22],[150,10],[180,20],[200,16],
  ];
  const line = pts.reduce((a, [x,y], i) =>
    i === 0 ? `M ${x} ${y}` : `${a} C ${pts[i-1][0]+20} ${pts[i-1][1]}, ${x-20} ${y}, ${x} ${y}`, "");
  const fill = `${line} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 40 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`wg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={opacity * 2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#wg${color.replace("#","")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity={opacity * 5} strokeLinecap="round" />
    </svg>
  );
}

/* ── Activity line chart ─────────────────────────────────── */
function ActivityChart({ groups }) {
  const [hovered, setHovered] = useState(null);

  // For each day of week, calculate % of groups that have class
  const vals = useMemo(() => {
    const dayIdx = { Ya:0,Yak:0, Du:1,Dush:1, Se:2,Sesh:2, Chor:3, Pay:4, Ju:5,Jum:5, Sh:6,Shan:6 };
    const counts = Array(7).fill(0);
    groups.forEach(g => {
      (g.schedule?.days ?? []).forEach(d => {
        const i = dayIdx[d];
        if (i !== undefined) counts[i]++;
      });
    });
    const max = Math.max(...counts, 1);
    return counts.map(c => Math.round((c / max) * 80 + 10));
  }, [groups]);

  const W = 420, H = 120, padX = 20, padY = 10;
  const xStep = (W - padX * 2) / 6;
  const pts = vals.map((v, i) => ({
    x: padX + i * xStep,
    y: padY + (1 - v / 100) * (H - padY * 2),
  }));

  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    return `${acc} C ${prev.x + xStep / 2} ${prev.y}, ${pt.x - xStep / 2} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");
  const fillPath = `${linePath} L ${pts[6].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <div className="relative select-none">
      {/* y-axis labels */}
      <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[10px] text-gray-400 font-medium">
        {[100,75,50,25,0].map(v => <span key={v}>{v}</span>)}
      </div>
      <div className="pl-7">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 120 }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* grid lines */}
          {[padY, padY+(H-padY*2)*0.25, padY+(H-padY*2)*0.5, padY+(H-padY*2)*0.75, H-padY].map((y,i) => (
            <line key={i} x1={padX} x2={W-padX} y1={y} y2={y}
              stroke="#f0f0f0" strokeWidth="1" />
          ))}
          <path d={fillPath} fill="url(#actGrad)" />
          <path d={linePath} fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((pt, i) => (
            <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: "pointer" }}>
              <circle cx={pt.x} cy={pt.y} r={hovered === i ? 6 : 3.5}
                fill={hovered === i ? "#7C3AED" : "#fff"}
                stroke="#7C3AED" strokeWidth={hovered === i ? 2 : 1.5}
                style={{ transition: "r 0.15s" }}
              />
              {hovered === i && (
                <g>
                  <rect x={pt.x - 38} y={pt.y - 28} width={76} height={22}
                    rx={6} fill="#7C3AED" />
                  <text x={pt.x} y={pt.y - 13} textAnchor="middle"
                    fill="white" fontSize={10} fontWeight="bold">
                    {vals[i]}% · {["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"][i]}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
        {/* x-axis */}
        <div className="flex justify-between px-[20px] mt-1">
          {DAY_LABELS.map(d => (
            <span key={d} className="text-[11px] text-gray-400 font-medium">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────── */
function StatCard({ label, value, sub, iconBg, icon: Icon, wave, valueColor, onClick }) {
  const isLong = String(value).replace(/[^0-9]/g, '').length >= 7;
  const fontSize = isLong ? 'text-base' : String(value).replace(/[^0-9]/g, '').length >= 5 ? 'text-lg' : 'text-2xl';
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col"
    >
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
          <p className={`${fontSize} font-black tabular-nums leading-none truncate ${valueColor ?? "text-gray-800"}`}>
            {value}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ChevronRight className="w-5 h-4 text-gray-200 ml-1 mt-0.5" />
      </div>
      <div className="mt-auto">
        <Wave color={wave.color} opacity={wave.opacity} />
      </div>
    </button>
  );
}

/* ── Main ────────────────────────────────────────────────── */

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const role = user?.role?.toLowerCase()?.trim() ?? "teacher";

  const { data: rawTeacher, loading: tLoad } = useFetch(getMyTeacherData);
  const { data: rawGroups,  loading: gLoad  } = useFetch(getMyTeacherGroups);

  const teacher = rawTeacher?.data ?? rawTeacher ?? {};
  const groups  = useMemo(() =>
    Array.isArray(rawGroups) ? rawGroups :
    Array.isArray(rawGroups?.data) ? rawGroups.data : [],
    [rawGroups]
  );

  // Guruh ro'yxatida schedule bo'lmasa, alohida yuklash
  const [scheduleMap, setScheduleMap] = useState({});
  useEffect(() => {
    const noSched = groups.filter(g => !g.schedule);
    if (!noSched.length) return;
    Promise.allSettled(
      noSched.slice(0, 30).map(g => {
        const gid = g.id ?? g._id;
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

  const bal            = teacher?.balance ?? teacher ?? {};
  const userBal        = user?.balance ?? {};

  const salary         = Number(bal.expectedSalary  ?? bal.kutilganMaosh  ?? userBal.kutilganMaosh  ?? teacher?.salary  ?? 0);
  const balance        = Number(bal.balance         ?? bal.sofBalans      ?? userBal.sofBalans      ?? 0);
  const credit         = Number(bal.credit          ?? bal.actualPayments ?? bal.ushlaQolindi       ?? userBal.ushlaQolindi ?? teacher?.credit ?? 0);
  const debit          = Number(bal.debit           ?? bal.tolangan       ?? userBal.tolangan        ?? teacher?.debit   ?? 0);
  const groupBreakdown = bal.groupBreakdown ?? userBal.groupBreakdown ?? [];

  const totalStudents = groups.reduce(
    (s, g) => s + (g.currentStudents ?? g.students?.length ?? 0), 0
  );
  const firstName = user?.name?.split(" ")[0] ?? "O'qituvchi";
  const initials  = (user?.name ?? "T").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  /* today's schedule */
  const nowMin  = new Date().getHours() * 60 + new Date().getMinutes();
  const todayIdx = new Date().getDay();
  const aliases  = TODAY_ALIASES[todayIdx] ?? [];
  const todayGroups = useMemo(() =>
    groups
      .map(g => ({ ...g, _sched: g.schedule ?? scheduleMap[g.id ?? g._id] ?? null }))
      .filter(g => (g._sched?.days ?? []).some(d => aliases.includes(d)))
      .sort((a, b) => (toMin(a._sched?.fromHour) ?? 0) - (toMin(b._sched?.fromHour) ?? 0)),
    [groups, aliases, scheduleMap]
  );

  /* filtered groups for search */
  const filteredGroups = useMemo(() =>
    search.trim()
      ? groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()) ||
                           g.course?.title?.toLowerCase().includes(search.toLowerCase()))
      : groups,
    [groups, search]
  );

  if (tLoad || gLoad) {
    return (
      <div className="min-h-screen bg-[#F4F5FF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5FF] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* ── HEADER ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          {/* avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
            {initials}
          </div>
          {/* greeting */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800">
              Xush kelibsiz, {firstName} 👋
            </h1>
            <p className="text-sm text-gray-400">Bugungi umumiy ko'rinish</p>
          </div>
          {/* search */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>
          {/* bell */}
          <div className="relative shrink-0">
            <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            label="Guruhlar"
            value={groups.length}
            sub="tayinlangan"
            icon={GraduationCap}
            iconBg="bg-violet-100 text-violet-600"
            wave={{ color: "#7C3AED", opacity: 0.12 }}
            onClick={() => navigate(`/${role}/groups`)}
          />
          <StatCard
            label="O'quvchilar"
            value={totalStudents}
            sub="jami"
            icon={Users}
            iconBg="bg-sky-100 text-sky-600"
            wave={{ color: "#0EA5E9", opacity: 0.12 }}
            onClick={() => navigate(`/${role}/groups`)}
          />
          <StatCard
            label="O'ylik Maosh"
            value={fmt(salary)}
            sub="UZS"
            icon={Wallet}
            iconBg="bg-emerald-100 text-emerald-600"
            wave={{ color: "#10B981", opacity: 0.12 }}
          />
          <StatCard
            label="Balans"
            value={`${balance >= 0 ? "+" : "−"}${fmt(Math.abs(balance))}`}
            sub="UZS"
            icon={balance >= 0 ? TrendingUp : TrendingDown}
            iconBg={balance >= 0 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-500"}
            wave={{ color: balance >= 0 ? "#F59E0B" : "#F43F5E", opacity: 0.12 }}
            valueColor={balance >= 0 ? "text-amber-600" : "text-rose-500"}
          />
        </div>

        {/* ── BALANCE + QUICK ACTIONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Maosh balansi */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Maosh Balansi</p>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                balance >= 0
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
              }`}>
                {balance >= 0 ? "✓" : "✗"} {balance >= 0 ? "Hisobiy" : "Qarzdor"}
              </span>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tabular-nums ${
                  balance >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}>
                  {balance >= 0 ? "+" : "−"}{fmt(Math.abs(balance))}
                </span>
                <span className="text-sm text-gray-400 font-medium">UZS</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Kutilgan Maosh", val: salary,            color: "text-gray-700",     bg: "bg-gray-50"       },
                  { label: "To'langan",      val: credit,            color: "text-emerald-600",  bg: "bg-emerald-50"    },
                  { label: "Ushlab Qolindi", val: debit,             color: "text-rose-500",     bg: "bg-rose-50"       },
                  { label: "Sof Balans",
                    val: Math.abs(balance),
                    prefix: balance >= 0 ? "+" : "−",
                    color: balance >= 0 ? "text-emerald-600" : "text-rose-500",
                    bg: balance >= 0 ? "bg-emerald-50" : "bg-rose-50",
                  },
                ].map(({ label, val, color, bg, prefix = "" }) => (
                  <div key={label} className={`rounded-xl p-3 ${bg}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-xs font-black tabular-nums leading-tight ${color}`}>
                      {prefix}{fmt(val)}
                      <span className="text-[10px] font-normal text-gray-400 ml-0.5">UZS</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* group breakdown */}
              {groupBreakdown.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guruh bo'yicha</p>
                  {groupBreakdown.map(g => (
                    <div key={g.groupId} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{g.groupName}</span>
                      <span className="text-xs text-gray-400">{g.studentCount} o'q</span>
                      <span className="text-sm font-bold text-gray-700 tabular-nums">{fmtK(g.expectedSalary)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tezkor Harakatlar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tezkor Harakatlar</p>
            <div className="flex flex-col gap-2 flex-1">
              {[
                {
                  label: "Guruhlarim",
                  sub: "Davomat va baholarni boshqarish",
                  icon: GraduationCap,
                  color: "bg-violet-100 text-violet-600",
                  onClick: () => navigate(`/${role}/groups`),
                },
                {
                  label: "Profil",
                  sub: "Shaxsiy ma'lumotlarni ko'rish",
                  icon: Users,
                  color: "bg-sky-100 text-sky-600",
                  onClick: () => navigate(`/${role}/profile`),
                },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SCHEDULE + ACTIVITY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bugungi dars jadvali */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-violet-500" />
                <p className="text-sm font-bold text-gray-800">Bugungi dars jadvali</p>
              </div>
              <button
                onClick={() => navigate(`/${role}/groups`)}
                className="text-[12px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
              >
                Barchasi
              </button>
            </div>

            {todayGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <CalendarDays className="w-9 h-9 text-violet-200" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Bugun dars yo'q</p>
                <p className="text-xs text-gray-400">Yaxshilab dam oling! 😊</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayGroups.map(g => {
                  const sched   = g._sched;
                  const from    = toMin(sched?.fromHour);
                  const to      = toMin(sched?.toHour);
                  const ongoing = from != null && to != null && nowMin >= from && nowMin < to;
                  const done    = to != null && nowMin >= to;
                  return (
                    <button
                      key={g._id ?? g.id}
                      onClick={() => navigate(`/${role}/groups/${g._id ?? g.id}`)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left ${done ? "opacity-40" : ""}`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        ongoing ? "bg-emerald-500 animate-pulse" : done ? "bg-gray-300" : "bg-violet-400"
                      }`} />
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-800 truncate">{g.name}</p>
                        <p className="text-[12px] text-gray-400 truncate">
                          {g.course?.title ?? g.course?.name ?? ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-[12px] font-bold text-gray-700 tabular-nums">
                          {sched?.fromHour} – {sched?.toHour}
                        </p>
                        {ongoing && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Davom etyapti
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Faoliyat statistikasi */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-violet-500" />
                <p className="text-sm font-bold text-gray-800">Faoliyat statistikasi</p>
              </div>
              <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Bu hafta ▾
              </span>
            </div>
            <div className="px-4 py-4">
              <ActivityChart groups={groups.map(g => ({ ...g, schedule: g.schedule ?? scheduleMap[g.id ?? g._id] ?? null }))} />
            </div>
          </div>
        </div>

        {/* ── GROUPS LIST (with search filter) ── */}
        {filteredGroups.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <p className="text-sm font-bold text-gray-800">Mening guruhlarim</p>
              </div>
              <button
                onClick={() => navigate(`/${role}/groups`)}
                className="text-[12px] font-semibold text-violet-600 bg-violet-100 px-3 py-1.5 rounded-xl hover:bg-violet-200 transition-colors"
              >
                Barchasini ko'rish →
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredGroups.slice(0, 8).map(g => {
                const used = g.currentStudents ?? g.students?.length ?? 0;
                const max  = g.maxStudents ?? 0;
                const pct  = max > 0 ? Math.round((used / max) * 100) : 0;
                const isAct = g.status !== "inactive" && g.status !== "archived";
                return (
                  <button
                    key={g.id ?? g._id}
                    onClick={() => navigate(`/${role}/groups/${g.id ?? g._id}`)}
                    className="w-full text-left flex items-center gap-3 px-5 py-3.5 hover:bg-violet-50/50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-800 truncate">{g.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {g.course && (
                          <p className="text-[12px] text-gray-400 truncate">{g.course.title ?? g.course.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 90 ? "bg-rose-400" : pct >= 70 ? "bg-amber-400" : "bg-violet-400"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] text-gray-400">{used}/{max}</span>
                        </div>
                        <span className={`text-[10px] font-bold ${isAct ? "text-emerald-600" : "text-gray-400"}`}>
                          {isAct ? "● Faol" : "○ Nofaol"}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {groups.length === 0 && !tLoad && !gLoad && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-violet-200" />
            </div>
            <p className="font-semibold text-gray-400">Hozircha guruhlar yo'q</p>
          </div>
        )}

      </div>
    </div>
  );
}
