import { useState, useEffect } from 'react';
import { Clock, CalendarDays, BookOpen } from 'lucide-react';

// API'dan keladigan kun qisqartmalari (UZ)
const TODAY_ALIASES = {
  0: ['Ya', 'Yak', 'Sun'],
  1: ['Du', 'Dush', 'Mon'],
  2: ['Se', 'Sesh', 'Tue'],
  3: ['Chor', 'Wed'],
  4: ['Pay', 'Thu'],
  5: ['Ju', 'Jum', 'Fri'],
  6: ['Sh', 'Shan', 'Sat'],
};

const DAY_NAMES_UZ = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

function toMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function countdown(diffMin) {
  if (diffMin <= 0) return null;
  if (diffMin < 60) return `${diffMin} daqiqada`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h} soat ${m} daqiqada` : `${h} soatda`;
}

export default function TodaySchedule({ groups }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayIdx   = new Date().getDay();
  const todayName  = DAY_NAMES_UZ[todayIdx];
  const aliases    = TODAY_ALIASES[todayIdx] ?? [];
  const nowMin     = nowMinutes();

  const todayGroups = (groups ?? [])
    .filter(g => {
      const days = g.schedule?.days ?? [];
      return days.some(d => aliases.includes(d));
    })
    .sort((a, b) => (toMinutes(a.schedule?.fromHour) ?? 0) - (toMinutes(b.schedule?.fromHour) ?? 0));

  return (
    <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-base-200 bg-base-200/40 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <p className="text-sm font-black text-base-content flex-1">Bugungi dars jadvali</p>
        <span className="text-xs font-semibold text-base-content/40">{todayName}</span>
      </div>

      {todayGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-base-content/30">
          <CalendarDays className="w-8 h-8 text-base-content/15" />
          <p className="text-sm font-medium">Bugun dars yo'q</p>
        </div>
      ) : (
        <div className="divide-y divide-base-200">
          {todayGroups.map(g => {
            const from    = toMinutes(g.schedule?.fromHour);
            const to      = toMinutes(g.schedule?.toHour);
            const ongoing = from !== null && to !== null && nowMin >= from && nowMin < to;
            const done    = to !== null && nowMin >= to;
            const diff    = from !== null ? from - nowMin : null;
            const soon    = diff !== null && diff > 0 && diff <= 30;

            let badge, dotCls, rowCls = '';
            if (done) {
              badge  = <span className="text-[10px] font-bold text-base-content/25 bg-base-200 px-2 py-0.5 rounded-full">Tugagan</span>;
              dotCls = 'bg-base-content/20';
              rowCls = 'opacity-40';
            } else if (ongoing) {
              badge  = <span className="text-[10px] font-bold text-white bg-success px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />Dars davom etyapti</span>;
              dotCls = 'bg-success animate-pulse';
            } else if (diff !== null && diff > 0) {
              const cd = countdown(diff);
              badge  = <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${soon ? 'text-warning bg-warning/10' : 'text-base-content/40 bg-base-200'}`}>
                <Clock className="w-2.5 h-2.5 inline -mt-px mr-0.5" />{cd}
              </span>;
              dotCls = soon ? 'bg-warning animate-pulse' : 'bg-primary/40';
            } else {
              badge  = null;
              dotCls = 'bg-base-content/20';
            }

            return (
              <div key={g._id || g.id} className={`flex items-center gap-3 px-5 py-3.5 ${rowCls}`}>
                {/* status dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />

                {/* icon */}
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-base-content truncate">{g.name}</p>
                  <p className="text-xs text-base-content/40 truncate">
                    {g.course?.title || g.course?.name || g.courseName || ''}
                  </p>
                </div>

                {/* time + badge */}
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs font-bold text-base-content tabular-nums">
                    {g.schedule?.fromHour} – {g.schedule?.toHour}
                  </p>
                  {badge}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
