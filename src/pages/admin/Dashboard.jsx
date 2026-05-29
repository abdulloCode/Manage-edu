import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";
import {
  Users,
  UserCheck,
  UserMinus,
  LayoutGrid,
  Calendar,
  AlertCircle,
  Trophy,
  TrendingUp,
  ArrowLeft,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

import { getAllGroups, getAllRooms } from "../../api/groups";
import { getAllTeachers } from "../../api/teacher";
import { getStudents, getStudentById } from "../../api/students";
import { getGroupAttendanceCalendar } from "../../api/attendance";
import { getGroupRatingCalendar } from "../../api/ratings";
import { getAllPayments, getMyPayments } from "../../api/payments";
import { createPayment, deletePayment, updatePayment } from "../../api/payments";

// ─── CONSTANTS ────────────────────────────────────────────────
// Bugungi kun → guruh schedule.days da ishlatiladigan alias lar
const TODAY_DAY_ALIASES = {
  0: ["Ya", "Yak"],
  1: ["Du", "Dush"],
  2: ["Se", "Sesh"],
  3: ["Chor"],
  4: ["Pa", "Pay"],
  5: ["Ju", "Jum"],
  6: ["Sh", "Sha", "Shan"],
};

const DAYS = [
  { key: "Du",  label: "Du"  },
  { key: "Se",  label: "Se"  },
  { key: "Chor",label: "Chor"},
  { key: "Pa",  label: "Pa"  },
  { key: "Ju",  label: "Ju"  },
  { key: "Sha", label: "Sha" },
  { key: "Yak", label: "Yak" },
];

const getTodayKey = () => {
  const aliases = TODAY_DAY_ALIASES[new Date().getDay()] ?? [];
  return DAYS.find((d) => aliases.includes(d.key))?.key ?? "Du";
};

const TIME_SLOTS = [];
for (let h = 6; h < 20; h++) {
  TIME_SLOTS.push(
    `${String(h).padStart(2, "0")}:00 - ${String(h).padStart(2, "0")}:30`,
  );
  TIME_SLOTS.push(
    `${String(h).padStart(2, "0")}:30 - ${String(h + 1).padStart(2, "0")}:00`,
  );
}

// ─── HELPERS ──────────────────────────────────────────────────
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const slotStartMinutes = (slot) => timeToMinutes(slot.split(" - ")[0]);

const getDk = (payment) => {
  if (payment?.dk) return payment.dk;
  if (typeof payment?.type === "object" && payment.type?.dk) return payment.type.dk;
  return "credit";
};

// ─── ROOM COLORS — har xona o'z rangida ───────────────────────
const ROOM_PALETTES = [
  { bg: "bg-emerald-500", text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-zinc-800",    text: "text-white",    sub: "text-white/65"  },
  { bg: "bg-cyan-600",    text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-red-500",     text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-blue-500",    text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-violet-600",  text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-amber-400",   text: "text-zinc-900", sub: "text-zinc-700"  },
  { bg: "bg-rose-700",    text: "text-white",    sub: "text-white/65"  },
  { bg: "bg-teal-600",    text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-indigo-600",  text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-orange-500",  text: "text-white",    sub: "text-white/75"  },
  { bg: "bg-pink-600",    text: "text-white",    sub: "text-white/75"  },
];

const getRoomColor = (roomId, rooms) => {
  const idx = rooms.findIndex((r) => (r._id || r.id) === roomId);
  return ROOM_PALETTES[(idx >= 0 ? idx : rooms.length) % ROOM_PALETTES.length];
};

const getStatus = (fromHour, toHour) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(fromHour);
  const end = timeToMinutes(toHour);
  if (cur < start)
    return { label: "Kutilmoqda", cls: "badge-ghost", dot: "bg-base-300" };
  if (cur < end)
    return {
      label: "Darsda",
      cls: "badge-success",
      dot: "bg-success animate-pulse",
    };
  return { label: "Tugadi", cls: "badge-error", dot: "bg-error" };
};

import { useAuth } from "../../context/AuthContext";
import { useHasPage, formatPhone } from "../../utils/permissions";
import { useLang } from "../../context/LangContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLang();
  const isManager = user?.role?.toLowerCase()?.trim() === "manager";
  const hasStudents = useHasPage("students");
  const hasTeachers = useHasPage("teachers");
  const hasGroups = useHasPage("groups");
  const hasPayments = useHasPage("payments");
  const hasReports = useHasPage("reports");

  const [selectedDay, setSelectedDay] = useState(getTodayKey);
  const [viewMode, setViewMode] = useState("room");
  const [activeSection, setActiveSection] = useState("schedule");
  const [data, setData] = useState({
    groups: [],
    teachers: [],
    students: [],
    rooms: [],
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [ratingsData, setRatingsData] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [paymentsData, setPaymentsData] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentModal, setPaymentModal] = useState({
    show: false,
    payment: null,
    mode: "edit",
  });
  const [groupsStudentsData, setGroupsStudentsData] = useState({});
  const [loadingGroupsStudents, setLoadingGroupsStudents] = useState(false);

  useEffect(() => {
    const needStudents = hasStudents || hasGroups || hasPayments || hasReports;
    Promise.all([
      hasGroups ? getAllGroups() : Promise.resolve({ data: { data: [] } }),
      hasTeachers ? getAllTeachers() : Promise.resolve({ data: { data: [] } }),
      needStudents ? getStudents() : Promise.resolve({ data: { data: [] } }),
      hasGroups ? getAllRooms() : Promise.resolve({ data: { data: [] } }),
    ]).then(([gRes, tRes, sRes, rRes]) => {
      const gData = gRes.data?.data ?? gRes.data ?? [];
      const tData = tRes.data?.data ?? tRes.data ?? [];
      const sData = sRes.data?.data ?? sRes.data ?? [];
      const rData = rRes.data?.data ?? rRes.data ?? [];

      const mappedGroups = gData.map((g) => {
        const teacher = tData.find((t) => (t._id || t.id) === g.teacherId);
        const room = rData.find((r) => (r._id || r.id) === g.roomId);
        return {
          ...g,
          teacherName: teacher?.name ?? "",
          roomName: room?.name ?? "",
        };
      });

      setData({
        groups: mappedGroups,
        teachers: tData,
        students: sData,
        rooms: rData,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasGroups && data.groups.length > 0) loadTodayAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.groups]);

  const loadTodayAttendance = async () => {
    if (!data.groups.length) return;
    setLoadingAttendance(true);
    try {
      const today   = new Date();
      const year    = today.getFullYear();
      const month   = today.getMonth() + 1;
      const todayStr = today.toISOString().split("T")[0];
      const todayDay = today.getDate();
      const nowMin   = today.getHours() * 60 + today.getMinutes();
      const aliases  = TODAY_DAY_ALIASES[today.getDay()] ?? [];

      // Faqat bugun darsi bor va vaqti boshlangan guruhlarni so'raymiz
      const todayStartedGroups = data.groups.filter((g) =>
        g.schedule?.days?.some((d) => aliases.includes(d)) &&
        timeToMinutes(g.schedule?.fromHour) <= nowMin
      );

      // Birinchi yuklashda (loadingAttendance hali false edi) — hamma guruh
      const groupsToFetch = todayStartedGroups.length > 0 ? todayStartedGroups : data.groups;

      const results = await Promise.allSettled(
        groupsToFetch.map((g) => getGroupAttendanceCalendar(g._id || g.id, { year, month }))
      );

      const allToday = [];
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const group = groupsToFetch[i];
        const gId = group._id || group.id;
        const res = r.value.data?.data || r.value.data;
        if (!res) return;

        // Format C: { days:[{d,l}], students:[{id, attendance:{"6": true/false}}] }
        if (Array.isArray(res.days) && res.days[0]?.d !== undefined && Array.isArray(res.students)) {
          res.students.forEach((s) => {
            const status = s.attendance?.[String(todayDay)];
            if (status === undefined) return;
            allToday.push({
              studentId: s.id || s._id,
              groupId: gId,
              date: todayStr,
              status: status === true ? "present" : status === false ? "absent" : (status || "present"),
            });
          });
        }
        // Format A: { days:[{date, records:[{studentId, status}]}] }
        else if (Array.isArray(res.days) && res.days[0]?.date !== undefined) {
          const dayObj = res.days.find((d) => d.date?.slice(0, 10) === todayStr);
          dayObj?.records?.forEach((rec) => {
            allToday.push({ studentId: rec.studentId, groupId: gId, date: todayStr, status: rec.status || "present" });
          });
        }
        // Format B: { calendar:{ "YYYY-MM-DD":{ studentId: status } } }
        else if (res.calendar) {
          Object.entries(res.calendar[todayStr] || {}).forEach(([studentId, status]) => {
            allToday.push({ studentId, groupId: gId, date: todayStr, status: status === true ? "present" : status === false ? "absent" : (status || "present") });
          });
        }
        // Raw array
        else {
          (Array.isArray(res) ? res : [])
            .filter((a) => a.date?.slice(0, 10) === todayStr)
            .forEach((a) => allToday.push({ studentId: a.studentId, groupId: a.groupId || gId, date: todayStr, status: a.status || "present" }));
        }
      });

      setAttendanceData(allToday);
    } catch {
      setAttendanceData([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const absentStudents = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return attendanceData
      .filter((a) => a.status === "absent" && a.date === todayStr)
      .map((a) => {
        const student = data.students.find((s) => (s._id || s.id) === a.studentId);
        const group = data.groups.find((g) => (g._id || g.id) === a.groupId);
        const teacher = data.teachers.find((t) => (t._id || t.id) === group?.teacherId);
        return {
          ...a,
          studentName: student?.name || "Noma'lum",
          studentPhone: formatPhone(student?.phone),
          parentPhone: formatPhone(student?.parentPhone || student?.parent?.phone || student?.parentContact),
          groupName: group?.name || "—",
          teacherName: teacher?.name || "Noma'lum",
          balance: student?.balance || 0,
        };
      });
  }, [attendanceData, data.students, data.groups, data.teachers]);

  const absentStudentsCount = absentStudents.length;

  // ── Baho qo'yilmagan guruhlar ──
  const noPriceGroups = useMemo(() => {
    const myId      = user?._id || user?.id;
    const isTeacher = user?.role?.toLowerCase()?.trim() === "teacher";
    return data.groups.filter((g) => {
      if (isTeacher && g.teacherId !== myId) return false;
      return !g.monthlyFeePerStudent || Number(g.monthlyFeePerStudent) <= 0;
    });
  }, [data.groups, user]);

  // ── Davomat qilmagan teacherlar (darsi boshlangan, lekin attendance yo'q) ──
  const teachersWithoutAttendance = useMemo(() => {
    if (!data.groups.length) return [];
    const now     = new Date();
    const nowMin  = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toISOString().split("T")[0];
    const aliases  = TODAY_DAY_ALIASES[now.getDay()] ?? [];
    const myId    = user?._id || user?.id;
    const isTeacher = user?.role?.toLowerCase()?.trim() === "teacher";

    return data.groups
      .filter((g) => {
        // Teacher bo'lsa faqat o'z guruhlarini ko'rsin
        if (isTeacher && g.teacherId !== myId) return false;
        // 1. Bugun darsi bor
        if (!g.schedule?.days?.some((d) => aliases.includes(d))) return false;
        if (nowMin < timeToMinutes(g.schedule.fromHour)) return false;
        // 2. Bu guruh uchun bugun attendance yo'q
        const gId = g._id || g.id;
        return !attendanceData.some((a) => a.groupId === gId && a.date === todayStr);
      })
      .map((g) => {
        const teacher = data.teachers.find((t) => (t._id || t.id) === g.teacherId);
        return {
          groupId:     g._id || g.id,
          groupName:   g.name,
          fromHour:    g.schedule.fromHour,
          toHour:      g.schedule.toHour,
          teacherName: teacher?.name || g.teacherName || "Noma'lum",
          teacherPhone: formatPhone(teacher?.phone),
        };
      });
  }, [data.groups, data.teachers, attendanceData, user]);

  // ── Attendance polling (server yuki minimal) ──
  useEffect(() => {
    if (!hasGroups || !data.groups.length) return;

    const tick = () => {
      // 1. Hozir ish vaqti emas (07:00 – 22:00) — polling yo'q
      const h = new Date().getHours();
      if (h < 7 || h >= 22) return;

      // 2. Sahifa yashirilgan — polling yo'q
      if (document.hidden) return;

      // 3. Hamma davomat qilgan — polling to'xtatiladi (interval tozalanadi)
      if (teachersWithoutAttendance.length === 0) return;

      loadTodayAttendance();
    };

    const id = setInterval(tick, 90_000); // 90 soniya
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.groups, hasGroups, teachersWithoutAttendance.length]);

  const handleShowAbsent = () => {
    setActiveSection("absent");
  };

  const handleShowRating = () => {
    setActiveSection("rating");
  };

  const handleShowPayments = () => {
    setActiveSection("payments");
  };

  const handleBackToSchedule = () => {
    if (hasGroups) {
      setActiveSection("schedule");
    } else if (hasPayments) {
      setActiveSection("payments");
    } else if (hasReports) {
      setActiveSection("rating");
    }
  };

  const paymentStats = useMemo(() => {
    if (!Array.isArray(paymentsData) || paymentsData.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        todayIncome: 0,
        todayExpense: 0,
        monthIncome: 0,
        monthExpense: 0,
      };
    }

    const totalIncome = paymentsData
      .filter((p) => getDk(p) === "credit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExpense = paymentsData
      .filter((p) => getDk(p) === "debit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const netBalance = totalIncome - totalExpense;

    const today = new Date().toISOString().split("T")[0];
    const todayPayments = paymentsData.filter((p) => p.date === today);
    const todayIncome = todayPayments
      .filter((p) => getDk(p) === "credit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const todayExpense = todayPayments
      .filter((p) => getDk(p) === "debit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthPayments = paymentsData.filter((p) =>
      p.month?.startsWith(currentMonth),
    );
    const monthIncome = monthPayments
      .filter((p) => getDk(p) === "credit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const monthExpense = monthPayments
      .filter((p) => getDk(p) === "debit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalIncome,
      totalExpense,
      netBalance,
      todayIncome,
      todayExpense,
      monthIncome,
      monthExpense,
    };
  }, [paymentsData]);

  useEffect(() => {
    if (hasReports && data.groups.length > 0) loadRatings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.groups]);

  const loadRatings = async () => {
    if (!data.groups.length) return;
    setLoadingRatings(true);
    try {
      const today = new Date();

      // So'nggi 6 oy uchun { year, month } ro'yxati
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
      });

      const results = await Promise.allSettled(
        data.groups.flatMap((g) =>
          months.map((m) => getGroupRatingCalendar(g._id || g.id, m))
        )
      );

      // results indeksini group bilan moslashtirish
      const groupOf = (idx) => data.groups[Math.floor(idx / months.length)];

      // studentId → { studentId, studentName, groupId, score } — oylik yig'indi
      const studentMap = {};

      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const group = groupOf(i);
        const gId   = group._id || group.id;
        const res   = r.value.data?.data || r.value.data;
        if (!res) return;

        // Format C: { students:[{id, name, ratings:{"1":8,"5":7,...}}] }
        if (Array.isArray(res.students)) {
          res.students.forEach((s) => {
            const sid    = String(s.id || s._id);
            const scores = s.ratings ?? s.scores ?? {};
            const total  = Object.values(scores)
              .reduce((acc, v) => acc + (Number(v) || 0), 0);
            if (total === 0) return;
            if (!studentMap[sid]) {
              studentMap[sid] = { studentId: sid, studentName: s.name, groupId: gId, score: 0 };
            }
            studentMap[sid].score += total;
          });
        }
        // Format A: { days:[{date, records:[{studentId, score}]}] }
        else if (Array.isArray(res.days) && res.days[0]?.date !== undefined) {
          res.days.forEach((day) => {
            day?.records?.forEach((rec) => {
              if (!rec.score) return;
              const sid = String(rec.studentId);
              if (!studentMap[sid]) {
                studentMap[sid] = { studentId: sid, studentName: rec.studentName, groupId: gId, score: 0 };
              }
              studentMap[sid].score += Number(rec.score);
            });
          });
        }
        // Format B: { calendar:{ "YYYY-MM-DD":{ studentId: score } } }
        else if (res.calendar) {
          Object.values(res.calendar).forEach((dayObj) => {
            Object.entries(dayObj || {}).forEach(([studentId, score]) => {
              if (!score) return;
              const sid = String(studentId);
              if (!studentMap[sid]) {
                studentMap[sid] = { studentId: sid, groupId: gId, score: 0 };
              }
              studentMap[sid].score += Number(score);
            });
          });
        }
      });

      setRatingsData(Object.values(studentMap));
    } catch {
      setRatingsData([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  useEffect(() => {
    if (hasPayments) loadPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGroupsStudents = async () => {
    setLoadingGroupsStudents(true);
    try {
      const groupsStudentsMap = {};
      for (const group of data.groups) {
        if (group.studentIds && Array.isArray(group.studentIds)) {
          const students = await Promise.all(
            group.studentIds.map((studentId) =>
              getStudentById(studentId)
                .then((res) => res.data?.data || res.data)
                .catch(() => null),
            ),
          );
          groupsStudentsMap[group._id || group.id] = students.filter(
            (s) => s !== null,
          );
        } else {
          groupsStudentsMap[group._id || group.id] = [];
        }
      }
      setGroupsStudentsData(groupsStudentsMap);
    } catch {
      setGroupsStudentsData({});
    } finally {
      setLoadingGroupsStudents(false);
    }
  };

  const handlePaymentAction = async (action, payment) => {
    try {
      if (action === "delete") {
        await deletePayment(payment._id || payment.id);
        setPaymentsData((prev) =>
          prev.filter(
            (p) => (p._id || p.id) !== (payment._id || payment.id),
          ),
        );
      } else if (action === "edit") {
        await updatePayment(payment._id || payment.id, payment);
        setPaymentsData((prev) =>
          prev.map((p) =>
            (p._id || p.id) === (payment._id || payment.id)
              ? { ...payment, ...p }
              : p,
          ),
        );
      } else if (action === "add") {
        const { data } = await createPayment(payment);
        setPaymentsData((prev) => [data, ...prev]);
      }
      await loadPayments();
    } catch (err) {
      showToast(
        "Amalga o'tkazildi: " + err.response?.data?.message ||
          "Xatolik yuz berdi",
        "error",
        5000,
      );
    }
  };

  useEffect(() => {
    if (hasGroups && data.groups.length > 0) {
      loadGroupsStudents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGroups, data.groups, selectedDay]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = isManager
        ? await getMyPayments()
        : await getAllPayments({ limit: 1000 });
      const allPayments =
        res.data?.payments || res.data?.data || res.data || [];
      setPaymentsData(Array.isArray(allPayments) ? allPayments : []);
    } catch {
      setPaymentsData([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const studentRatings = useMemo(() => {
    if (!Array.isArray(ratingsData)) return [];

    const result = ratingsData
      .map((r) => {
        const student = data.students.find((s) => String(s._id || s.id) === String(r.studentId));
        const group   = data.groups.find((g) => String(g._id || g.id) === String(r.groupId));
        const teacher = data.teachers.find((t) => (t._id || t.id) === group?.teacherId);
        return {
          studentId:   r.studentId,
          totalScore:  r.score,
          ratingCount: 1,
          studentName: student?.name || r.studentName || "Noma'lum",
          studentSurname: student?.surname || "",
          studentPhone: formatPhone(student?.phone),
          groupName:   group?.name || "—",
          teacherName: teacher?.name || "Noma'lum",
          averageScore: String(r.score),
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return result;
  }, [ratingsData, data.students, data.groups, data.teachers]);

  // Bugungi kun DAYS kaliti
  const todayDayKey = useMemo(() => {
    const aliases = TODAY_DAY_ALIASES[new Date().getDay()] ?? [];
    return DAYS.find((d) => aliases.includes(d.key))?.key ?? null;
  }, []);

  const columns = useMemo(
    () => (viewMode === "room" ? data.rooms : data.teachers),
    [viewMode, data],
  );

  const dayGroups = useMemo(() => {
    return data.groups.filter((g) => g.schedule?.days?.includes(selectedDay));
  }, [data.groups, selectedDay]);

  return (
    <div className="min-h-screen bg-base-200 p-4 font-sans">
      {/* ── HEADER ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          {hasGroups ? t('dash_title_schedule') : t('dash_title_panel')}
        </h1>
        <p className="text-sm text-base-content/50 mt-1">{t('dash_crm')}</p>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {hasStudents && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-base-content/50 uppercase leading-none mb-1">
                  {t('nav_students')}
                </p>
                <h4 className="text-lg font-bold">{data.students.length}</h4>
              </div>
            </div>
          </div>
        )}

        {hasTeachers && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4 flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <UserCheck className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-base-content/50 uppercase leading-none mb-1">
                  {t('nav_teachers')}
                </p>
                <h4 className="text-lg font-bold">{data.teachers.length}</h4>
              </div>
            </div>
          </div>
        )}

        {hasGroups && (
          <div
            className={`card shadow-sm cursor-pointer transition-colors ${
              activeSection === "absent"
                ? "bg-error/10 border-2 border-error"
                : "bg-base-100 border border-base-200 hover:bg-error/5"
            }`}
            onClick={handleShowAbsent}
          >
            <div className="card-body p-4 flex-row items-center gap-3">
              <div
                className={`p-2 rounded-lg ${activeSection === "absent" ? "bg-error" : "bg-error/10"}`}
              >
                <UserMinus
                  className={`w-5 h-5 ${activeSection === "absent" ? "text-white" : "text-error"}`}
                />
              </div>
              <div>
                <p className="text-[9px] font-bold text-base-content/50 uppercase leading-none mb-1">
                  {t('dash_absent')}
                </p>
                <h4 className="text-lg font-bold text-error">
                  {absentStudentsCount}
                </h4>
              </div>
            </div>
          </div>
        )}

        {hasReports && (
          <div
            className={`card shadow-sm cursor-pointer transition-colors ${
              activeSection === "rating"
                ? "bg-warning/10 border-2 border-warning"
                : "bg-base-100 border border-base-200 hover:bg-warning/5"
            }`}
            onClick={handleShowRating}
          >
            <div className="card-body p-4 flex-row items-center gap-3">
              <div
                className={`p-2 rounded-lg ${activeSection === "rating" ? "bg-warning" : "bg-warning/10"}`}
              >
                <Trophy
                  className={`w-5 h-5 ${activeSection === "rating" ? "text-white" : "text-warning"}`}
                />
              </div>
              <div>
                <p className="text-[9px] font-bold text-base-content/50 uppercase leading-none mb-1">
                  {t('dash_rating')}
                </p>
                <h4 className="text-lg font-bold text-warning">
                  {studentRatings.length}
                </h4>
              </div>
            </div>
          </div>
        )}

        {hasPayments && (
          <div
            className={`card shadow-sm cursor-pointer transition-colors ${
              activeSection === "payments"
                ? "bg-success/10 border-2 border-success"
                : "bg-base-100 border border-base-200 hover:bg-success/5"
            }`}
            onClick={handleShowPayments}
          >
            <div className="card-body p-4 flex-row items-center gap-3">
              <div
                className={`p-2 rounded-lg ${activeSection === "payments" ? "bg-success" : "bg-success/10"}`}
              >
                <Wallet
                  className={`w-5 h-5 ${activeSection === "payments" ? "text-white" : "text-success"}`}
                />
              </div>
              <div>
                <p className="text-[9px] font-bold text-base-content/50 uppercase leading-none mb-1">
                  {t('nav_payments')}
                </p>
                <h4 className="text-lg font-bold text-success">
                  {paymentsData.length}
                </h4>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BAHO QOYILMAGAN GURUHLAR ── */}
      {hasGroups && noPriceGroups.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-blue-100/60">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-sm font-bold text-blue-800">
                Baho belgilanmagan guruhlar —{" "}
                <span className="text-blue-600">{noPriceGroups.length} ta</span>
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/groups")}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              Guruhlar →
            </button>
          </div>
          <div className="divide-y divide-blue-100">
            {noPriceGroups.slice(0, 5).map((g) => {
              const teacher = data.teachers.find((t) => (t._id || t.id) === g.teacherId);
              return (
                <div
                  key={g._id || g.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-100/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/groups?groupId=${g._id || g.id}`)}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">
                    {g.name?.slice(0, 2).toUpperCase() || "G"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{g.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {teacher?.name || g.teacherName || "O'qituvchi belgilanmagan"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-bold rounded-lg">
                      0 UZS / oy
                    </span>
                    {g.schedule?.fromHour && (
                      <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                        {g.schedule.fromHour} – {g.schedule.toHour}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {noPriceGroups.length > 5 && (
              <div className="px-4 py-2 text-center text-xs text-blue-500 font-medium">
                + {noPriceGroups.length - 5} ta guruh yana
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DAVOMAT QILMAGAN TEACHERLAR ── */}
      {hasGroups && teachersWithoutAttendance.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 bg-amber-100/60">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-800">
              Davomat qilinmagan darslar —{" "}
              <span className="text-amber-600">{teachersWithoutAttendance.length} ta</span>
            </p>
          </div>
          <div className="divide-y divide-amber-100">
            {teachersWithoutAttendance.map((item) => (
              <div
                key={item.groupId}
                className="flex items-center gap-3 px-4 py-3 hover:bg-amber-100/40 transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black shrink-0">
                  {item.teacherName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "T"}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.teacherName}</p>
                  <p className="text-xs text-gray-500 font-mono">{item.teacherPhone || "—"}</p>
                </div>
                {/* Group + time */}
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-bold rounded-lg">
                    {item.groupName}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                    {item.fromHour} – {item.toHour}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTROLS (schedule section) ── */}
      {activeSection === "schedule" && hasGroups && (
        <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
          <div className="card-body p-3 flex-row justify-between items-center flex-wrap gap-2">
            {/* Kun pillalari */}
            <div className="flex gap-1 flex-wrap">
              {DAYS.map((d) => {
                const cnt     = data.groups.filter((g) => g.schedule?.days?.includes(d.key)).length;
                const isSel   = selectedDay === d.key;
                const isToday = todayDayKey === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDay(d.key)}
                    className={`relative btn btn-sm gap-1 ${
                      isSel
                        ? "btn-primary"
                        : isToday
                          ? "btn-ghost border border-primary/40 text-primary"
                          : "btn-ghost"
                    }`}
                  >
                    {d.label}
                    {cnt > 0 && (
                      <span className={`text-[10px] font-black tabular-nums ${isSel ? "opacity-70" : "opacity-40"}`}>
                        {cnt}
                      </span>
                    )}
                    {isToday && !isSel && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-2 border-base-100" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* View mode + guruhlar soni */}
            <div className="flex items-center gap-3">
              <div className="join">
                <button
                  onClick={() => setViewMode("room")}
                  className={`btn btn-sm join-item ${viewMode === "room" ? "btn-primary" : "btn-ghost"}`}
                >
                  {t('dash_room')}
                </button>
                <button
                  onClick={() => setViewMode("teacher")}
                  className={`btn btn-sm join-item ${viewMode === "teacher" ? "btn-primary" : "btn-ghost"}`}
                >
                  {t('dash_teacher')}
                </button>
              </div>
              <span className="text-xs font-bold text-base-content/40 border-l border-base-300 pl-3">
                {dayGroups.length} ta
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION HEADER ── */}
      {activeSection !== "schedule" &&
        ((activeSection === "absent" && hasGroups) ||
          (activeSection === "rating" && hasReports) ||
          (activeSection === "payments" && hasPayments)) && (
          <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
            <div className="card-body p-4 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToSchedule}
                  className="btn btn-ghost btn-sm btn-square"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-bold">
                    {activeSection === "absent"
                      ? t('dash_absent_students')
                      : activeSection === "rating"
                        ? t('dash_student_rating')
                        : t('dash_payments_info')}
                  </h2>
                  <p className="text-xs text-base-content/50">
                    {activeSection === "absent"
                      ? `${new Date().toLocaleDateString("uz-UZ")}`
                      : activeSection === "rating"
                        ? `So'nggi 6 oy reytingi (${studentRatings.length} ta)`
                        : `Bugungi va oylik to'lovlar (${paymentsData.length} ta)`}
                  </p>
                </div>
              </div>
              <div
                className={`badge badge-lg font-bold ${
                  activeSection === "absent"
                    ? "badge-error"
                    : activeSection === "rating"
                      ? "badge-warning"
                      : "badge-success"
                }`}
              >
                {activeSection === "absent"
                  ? `${absentStudents.length} ${t('dash_absent_short')}`
                  : activeSection === "rating"
                    ? `${studentRatings.length} ${t('nav_students')}`
                    : `${paymentsData.length} ${t('nav_payments')}`}
              </div>
            </div>
          </div>
        )}

      {/* ── SCHEDULE TABLE ── */}
      {activeSection === "schedule" && hasGroups && (
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead className="bg-base-200">
                <tr>
                  <th className="p-3 border-r border-b border-base-300 w-24 sticky left-0 bg-base-200 z-30 text-xs font-bold text-base-content/60 uppercase text-center">
                    {t('dash_time')}
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col._id || col.id}
                      className="p-3 border-r border-b border-base-300 min-w-[180px] text-center text-xs font-semibold text-base-content"
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, slotIdx) => (
                  <tr key={slot} className="hover:bg-base-200/30">
                    <td className="p-3 border-r border-b border-base-200 text-center text-xs font-semibold text-base-content/60 bg-base-100 sticky left-0 z-10">
                      {slot}
                    </td>
                    {columns.map((col) => {
                      const colId    = col._id || col.id;
                      const slotTime = slotStartMinutes(slot);

                      const group = dayGroups.find(
                        (g) =>
                          (viewMode === "room" ? g.roomId === colId : g.teacherId === colId) &&
                          g.schedule?.fromHour &&
                          slotTime === timeToMinutes(g.schedule.fromHour),
                      );

                      const isOccupied = dayGroups.some(
                        (g) =>
                          (viewMode === "room" ? g.roomId === colId : g.teacherId === colId) &&
                          g.schedule?.fromHour &&
                          g.schedule?.toHour &&
                          slotTime > timeToMinutes(g.schedule.fromHour) &&
                          slotTime < timeToMinutes(g.schedule.toHour),
                      );

                      if (isOccupied) return null;

                      if (group && group.schedule?.toHour) {
                        const fromMinutes = timeToMinutes(group.schedule.fromHour);
                        const toMinutes   = timeToMinutes(group.schedule.toHour);
                        const span        = Math.max(1, (toMinutes - fromMinutes) / 30);

                        const teacher     = data.teachers.find((t) => (t._id || t.id) === group.teacherId);
                        const teacherName = teacher?.name || group.teacherName || "Noma'lum";

                        const gStudents        = groupsStudentsData[group._id || group.id] || [];
                        const studentCount     = gStudents.length || group.currentStudents || 0;
                        const maxStudents      = group.maxStudents || 12;

                        const todayStr         = new Date().toISOString().split("T")[0];
                        const groupAttendance  = attendanceData.filter(
                          (a) => (a.groupId === group._id || a.groupId === group.id) && a.date === todayStr,
                        );
                        const presentCount = groupAttendance.filter((a) => a.status === "present").length;
                        const absentCount  = groupAttendance.filter((a) => a.status === "absent").length;

                        const curMonth      = new Date().toISOString().slice(0, 7);
                        const gStudentIds   = new Set(gStudents.map((s) => s._id || s.id));
                        const paidThisMonth = hasPayments
                          ? paymentsData
                              .filter((p) =>
                                p.month?.startsWith(curMonth) &&
                                getDk(p) === "credit" &&
                                gStudentIds.has(p.toWho?._id || p.toWho?.id || p.toWho)
                              )
                              .reduce((s, p) => s + (Number(p.amount) || 0), 0)
                          : 0;
                        const expectedThisMonth = (group.monthlyFeePerStudent || 0) * studentCount;
                        const fmtK = (n) => Math.round(n / 1000);

                        const colors = getRoomColor(group.roomId, data.rooms);
                        const status = getStatus(group.schedule.fromHour, group.schedule.toHour);
                        const isActive = status.label === "Darsda";

                        return (
                          <td
                            key={`${colId}-${slotIdx}`}
                            rowSpan={span}
                            className="p-1 align-top border border-base-200"
                            style={{ minWidth: "180px" }}
                            onClick={() => navigate(`/admin/groups?groupId=${group._id || group.id}`)}
                          >
                            <div className={`w-full h-full cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${colors.bg}`}>
                              <div className="p-2.5 flex flex-col gap-1 h-full">

                                {/* Line 1: Name + time + active dot */}
                                <div className="flex items-start justify-between gap-1">
                                  <span className={`font-extrabold text-[11px] leading-tight truncate ${colors.text}`}>
                                    {group.name} / {group.schedule.fromHour}-{group.schedule.toHour}
                                  </span>
                                  <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 bg-white/80 ${isActive ? "animate-pulse" : "opacity-40"}`} />
                                </div>

                                {/* Teacher */}
                                <p className={`text-[11px] truncate font-semibold ${colors.sub}`}>
                                  {teacherName}
                                </p>

                                {/* Room */}
                                <p className={`text-[10px] font-medium ${colors.sub}`}>
                                  Xona: {group.roomName || "—"}
                                </p>

                                {/* Stats row */}
                                <div className={`flex items-center gap-2.5 pt-1.5 mt-auto border-t border-white/20 text-[10px] font-bold ${colors.text}`}>
                                  <span className="flex items-center gap-0.5 opacity-90">
                                    <LayoutGrid className="w-2.5 h-2.5 shrink-0" />
                                    {fmtK(paidThisMonth)}/{fmtK(expectedThisMonth)}
                                  </span>
                                  <span className="flex items-center gap-0.5 opacity-90">
                                    <Users className="w-2.5 h-2.5 shrink-0" />
                                    {studentCount}/{maxStudents}
                                  </span>
                                  <span className="flex items-center gap-0.5 opacity-90">
                                    <UserMinus className="w-2.5 h-2.5 shrink-0" />
                                    {absentCount}
                                  </span>
                                </div>

                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Bo'sh katak
                      return (
                        <td
                          key={`${colId}-${slotIdx}`}
                          className="border-r border-b border-base-200 text-center text-base-content/30 text-xs"
                        >
                          —
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABSENT STUDENTS TABLE ── */}
      {activeSection === "absent" && hasGroups && (
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-error/10">
                  <th>#</th>
                  <th>{t('first_name')}</th>
                  <th>{t('phone')}</th>
                  <th>Ota-onasi tel</th>
                  <th>{t('group')}</th>
                  <th>{t('dash_teacher')}</th>
                  <th className="text-right">{t('balance')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingAttendance ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <span className="loading loading-spinner loading-lg text-error" />
                    </td>
                  </tr>
                ) : absentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-base-content/40">
                        <UserCheck className="w-16 h-16" />
                        <p className="text-sm font-medium">
                          {t('dash_all_came')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  absentStudents.map((student, idx) => (
                    <tr key={student._id || student.id || idx}>
                      <td className="text-sm text-base-content/50">
                        {idx + 1}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="w-8 h-8 rounded-full bg-error/20 text-error font-bold text-xs flex items-center justify-center">
                              {student.studentName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "??"}
                            </div>
                          </div>
                          <span className="font-medium">
                            {student.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm">{student.studentPhone}</td>
                      <td className="text-sm">{student.parentPhone}</td>
                      <td>
                        <span className="badge badge-error badge-sm font-bold">
                          {student.groupName}
                        </span>
                      </td>
                      <td className="text-sm">{student.teacherName}</td>
                      <td className="text-right">
                        <span
                          className={`badge font-bold ${student.balance >= 0 ? "badge-success" : "badge-error"}`}
                        >
                          {student.balance.toLocaleString()} UZS
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RATING TABLE ── */}
      {activeSection === "rating" && hasReports && (
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-warning/10">
                  <th className="text-center">#</th>
                  <th>{t('first_name')}</th>
                  <th>{t('phone')}</th>
                  <th>{t('group')}</th>
                  <th>{t('dash_teacher')}</th>
                  <th className="text-center">{t('dash_total')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingRatings ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <span className="loading loading-spinner loading-lg text-warning" />
                    </td>
                  </tr>
                ) : studentRatings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-base-content/40">
                        <Users className="w-16 h-16" />
                        <p className="text-sm">{t('dash_no_students')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  studentRatings.map((student, idx) => (
                    <tr key={student.studentId}>
                      <td className="text-center">
                        {idx < 3 ? (
                          <div
                            className={`badge badge-md font-bold ${
                              idx === 0
                                ? "badge-warning"
                                : idx === 1
                                  ? "badge-ghost"
                                  : "badge-error"
                            }`}
                          >
                            {idx + 1}
                          </div>
                        ) : (
                          <span className="text-sm text-base-content/50">
                            {idx + 1}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div
                              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${
                                idx < 3
                                  ? "bg-warning/20 text-warning"
                                  : "bg-base-200 text-base-content/60"
                              }`}
                            >
                              {student.studentName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "??"}
                            </div>
                          </div>
                          <span className="font-medium">
                            {student.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm">{student.studentPhone}</td>
                      <td>
                        <span className="badge badge-warning badge-sm font-bold">
                          {student.groupName}
                        </span>
                      </td>
                      <td className="text-sm">{student.teacherName}</td>
                      <td className="text-center">
                        <span
                          className={`badge font-bold ${
                            student.totalScore >= 8
                              ? "badge-success"
                              : student.totalScore >= 5
                                ? "badge-warning"
                                : "badge-error"
                          }`}
                        >
                          {student.totalScore}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAYMENTS SECTION ── */}
      {activeSection === "payments" && hasPayments && (
        <div className="space-y-6">
          {loadingPayments ? (
            <div className="flex justify-center py-20">
              <span className="loading loading-spinner loading-lg text-success" />
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card bg-base-100 border border-success/20 shadow-sm">
                  <div className="card-body p-5 flex-row items-center gap-3">
                    <div className="p-3 rounded-xl bg-success/10">
                      <ArrowUpCircle className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50 font-medium">
                        {t('dash_today_income')}
                      </p>
                      <p className="text-xl font-bold text-success">
                        +{paymentStats.todayIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 border border-error/20 shadow-sm">
                  <div className="card-body p-5 flex-row items-center gap-3">
                    <div className="p-3 rounded-xl bg-error/10">
                      <ArrowDownCircle className="w-6 h-6 text-error" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50 font-medium">
                        {t('dash_today_expense')}
                      </p>
                      <p className="text-xl font-bold text-error">
                        -{paymentStats.todayExpense.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 border border-info/20 shadow-sm">
                  <div className="card-body p-5 flex-row items-center gap-3">
                    <div className="p-3 rounded-xl bg-info/10">
                      <Calendar className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50 font-medium">
                        {t('dash_monthly_income')}
                      </p>
                      <p className="text-xl font-bold text-info">
                        +{paymentStats.monthIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 border border-secondary/20 shadow-sm">
                  <div className="card-body p-5 flex-row items-center gap-3">
                    <div className="p-3 rounded-xl bg-secondary/10">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50 font-medium">
                        {t('dash_monthly_expense')}
                      </p>
                      <p className="text-xl font-bold text-secondary">
                        -{paymentStats.monthExpense.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance card */}
              <div
                className={`card bg-base-100 shadow-sm ${paymentStats.netBalance >= 0 ? "border border-success/30" : "border border-error/30"}`}
              >
                <div className="card-body p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-base-content/50 font-medium">
                        {t('dash_net_balance')}
                      </p>
                      <p
                        className={`text-3xl font-bold ${paymentStats.netBalance >= 0 ? "text-success" : "text-error"}`}
                      >
                        {paymentStats.netBalance >= 0 ? "+" : ""}
                        {paymentStats.netBalance.toLocaleString()} UZS
                      </p>
                    </div>
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${paymentStats.netBalance >= 0 ? "bg-success" : "bg-error"}`}
                    >
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="divider my-2" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-base-content/50">
                        {t('dash_total_income')}
                      </p>
                      <p className="text-lg font-bold text-success">
                        +{paymentStats.totalIncome.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-base-content/50">
                        {t('dash_total_expense')}
                      </p>
                      <p className="text-lg font-bold text-error">
                        -{paymentStats.totalExpense.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payments table */}
              <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr className="bg-base-200">
                        <th>{t('date')}</th>
                        <th>{t('pay_type')}</th>
                        <th>{t('pay_for_whom')}</th>
                        <th>{t('month')}</th>
                        <th className="text-right">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-base-content/40">
                              <Wallet className="w-16 h-16" />
                              <p className="text-sm">{t('dash_no_payments')}</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paymentsData.slice(0, 20).map((payment) => (
                          <tr key={payment._id || payment.id}>
                            <td className="text-sm">
                              {payment.date
                                ? new Date(payment.date).toLocaleDateString(
                                    "uz-UZ",
                                  )
                                : "—"}
                            </td>
                            <td>
                              <span
                                className={`badge badge-sm gap-1 font-medium ${
                                  getDk(payment) === "credit"
                                    ? "badge-success"
                                    : "badge-error"
                                }`}
                              >
                                {getDk(payment) === "credit" ? (
                                  <ArrowUpCircle className="w-3 h-3" />
                                ) : (
                                  <ArrowDownCircle className="w-3 h-3" />
                                )}
                                {payment.type?.name ||
                                  payment.type?.code ||
                                  "—"}
                              </span>
                            </td>
                            <td className="text-sm">
                              {typeof payment.toWho === "object"
                                ? payment.toWho?.name || "—"
                                : payment.toWho || "—"}
                            </td>
                            <td className="text-sm">{payment.month || "—"}</td>
                            <td
                              className={`text-sm font-semibold text-right ${
                                getDk(payment) === "credit"
                                  ? "text-success"
                                  : "text-error"
                              }`}
                            >
                              {getDk(payment) === "credit" ? "+" : "-"}
                              {Number(payment.amount || 0).toLocaleString()} UZS
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {paymentsData.length > 20 && (
                  <div className="px-6 py-4 bg-base-200 border-t border-base-300 text-center text-sm text-base-content/50">
                    {t('dash_last20')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}