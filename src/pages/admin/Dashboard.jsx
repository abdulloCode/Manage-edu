import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";
import {
  Users,
  UserCheck,
  UserMinus,
  LayoutGrid,
  List,
  Maximize2,
  Calendar,
  AlertCircle,
  Trophy,
  TrendingUp,
  ArrowLeft,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Edit3,
  Plus,
} from "lucide-react";

import { getAllGroups, getAllRooms } from "../../api/groups";
import { getAllTeachers } from "../../api/teacher";
import { getStudents, getStudentById } from "../../api/students";
import { getAllAttendances } from "../../api/attendance";
import { getAllRatings } from "../../api/ratings";
import { getAllPayments, getMyPayments } from "../../api/payments";
import { createPayment, deletePayment, updatePayment } from "../../api/payments";

// ─── CONSTANTS ────────────────────────────────────────────────
const DAYS = [
  { key: "Yak", label: "Yak" },
  { key: "Du", label: "Du" },
  { key: "Se", label: "Se" },
  { key: "Chor", label: "Chor" },
  { key: "Pa", label: "Pa" },
  { key: "Ju", label: "Ju" },
  { key: "Sha", label: "Sha" },
];

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
  if (typeof payment.type === "object" && payment.type?.dk)
    return payment.type.dk;
  return "credit";
};

// ─── DaisyUI GROUP COLORS ─────────────────────────────────────
const GROUP_COLORS = {
  EKY: {
    badge: "badge-success",
    card: "border-l-4 border-success bg-success/10",
    dot: "bg-success",
  },
  EMU: {
    badge: "badge-neutral",
    card: "border-l-4 border-neutral bg-neutral/10",
    dot: "bg-neutral",
  },
  OON: {
    badge: "badge-info",
    card: "border-l-4 border-info bg-info/10",
    dot: "bg-info",
  },
  OSS: {
    badge: "badge-info",
    card: "border-l-4 border-info bg-info/10",
    dot: "bg-info",
  },
  TXA: {
    badge: "badge-error",
    card: "border-l-4 border-error bg-error/10",
    dot: "bg-error",
  },
  EMA: {
    badge: "badge-error",
    card: "border-l-4 border-error/70 bg-error/5",
    dot: "bg-error/70",
  },
};

const getGroupColor = (groupName = "") => {
  const prefix = Object.keys(GROUP_COLORS).find((k) =>
    groupName.startsWith(k),
  );
  return (
    GROUP_COLORS[prefix] ?? {
      badge: "badge-warning",
      card: "border-l-4 border-warning bg-warning/10",
      dot: "bg-warning",
    }
  );
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
import { useHasPage } from "../../utils/permissions";

export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isManager = user?.role?.toLowerCase()?.trim() === "manager";
  const hasStudents = useHasPage("students");
  const hasTeachers = useHasPage("teachers");
  const hasGroups = useHasPage("groups");
  const hasPayments = useHasPage("payments");
  const hasReports = useHasPage("reports");

  const [selectedDay, setSelectedDay] = useState("Sha");
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
  const [absentStudents, setAbsentStudents] = useState([]);
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
    if (hasGroups) loadTodayAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasGroups) return;
    const interval = setInterval(() => {
      loadTodayAttendance();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTodayAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const res = await getAllAttendances({ limit: 1000 });
      const allAttendance = res.data?.data || res.data || [];
      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = allAttendance.filter((a) => a.date === today);
      setAttendanceData(todayAttendance);
    } catch (err) {
      console.error("Attendance yuklashda xatolik:", err);
      setAttendanceData([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const absentStudentsCount = useMemo(() => {
    return attendanceData.filter((a) => a.status === "absent").length;
  }, [attendanceData]);

  const getAbsentStudents = () => {
    const absent = attendanceData.filter((a) => a.status === "absent");
    return absent.map((a) => {
      const student = data.students.find(
        (s) => (s._id || s.id) === a.studentId,
      );
      const group = data.groups.find((g) => (g._id || g.id) === a.groupId);
      const teacher = data.teachers.find(
        (t) => (t._id || t.id) === group?.teacherId,
      );
      return {
        ...a,
        studentName: student?.name || "Noma'lum",
        studentSurname: student?.surname || "",
        studentPhone: student?.phone || student?.parentPhone || "—",
        groupName: group?.name || "—",
        teacherName: teacher?.name || "Noma'lum",
        balance: student?.balance || 0,
      };
    });
  };

  const handleShowAbsent = () => {
    const absent = getAbsentStudents();
    setAbsentStudents(absent);
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
      .filter((p) => p.type?.dk === "credit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExpense = paymentsData
      .filter((p) => p.type?.dk === "debit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const netBalance = totalIncome - totalExpense;

    const today = new Date().toISOString().split("T")[0];
    const todayPayments = paymentsData.filter((p) => p.date === today);
    const todayIncome = todayPayments
      .filter((p) => p.type?.dk === "credit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const todayExpense = todayPayments
      .filter((p) => p.type?.dk === "debit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthPayments = paymentsData.filter((p) =>
      p.month?.startsWith(currentMonth),
    );
    const monthIncome = monthPayments
      .filter((p) => p.type?.dk === "credit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const monthExpense = monthPayments
      .filter((p) => p.type?.dk === "debit")
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
    if (hasReports) loadRatings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasReports) return;
    const interval = setInterval(() => {
      loadRatings();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRatings = async () => {
    setLoadingRatings(true);
    try {
      const res = await getAllRatings();
      const allRatings = res.data?.data || res.data || [];
      setRatingsData(allRatings);
    } catch (err) {
      console.error("Baho yuklashda xatolik:", err);
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
    } catch (err) {
      console.error("Guruh o'quvchilarini yuklashda xatolik:", err);
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
      console.error("Payment action failed:", err);
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
  }, [hasGroups, data.groups]);

  useEffect(() => {
    if (hasGroups && data.groups.length > 0) {
      loadGroupsStudents();
    }
  }, [hasGroups, selectedDay]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = isManager
        ? await getMyPayments()
        : await getAllPayments({ limit: 1000 });
      const allPayments =
        res.data?.payments || res.data?.data || res.data || [];
      setPaymentsData(Array.isArray(allPayments) ? allPayments : []);
    } catch (err) {
      console.error("To'lovlar yuklashda xatolik:", err);
      setPaymentsData([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const studentRatings = useMemo(() => {
    if (!Array.isArray(ratingsData) || !Array.isArray(data.students)) return [];

    const studentScoreMap = {};
    ratingsData.forEach((rating) => {
      const studentId = rating.studentId || rating._id;
      if (!studentId) return;
      if (!studentScoreMap[studentId]) {
        studentScoreMap[studentId] = {
          studentId,
          totalScore: 0,
          ratingCount: 0,
          teacherIds: new Set(),
        };
      }
      studentScoreMap[studentId].totalScore += Number(rating.score) || 0;
      studentScoreMap[studentId].ratingCount += 1;
      if (rating.teacherId) {
        studentScoreMap[studentId].teacherIds.add(rating.teacherId);
      }
    });

    const result = data.students.map((student) => {
      const studentId = student._id || student.id;
      const sr = studentScoreMap[studentId];
      const group = data.groups.find(
        (g) => (g._id || g.id) === student?.groupId,
      );
      const teacherId =
        sr && sr.teacherIds.size > 0
          ? Array.from(sr.teacherIds)[0]
          : group?.teacherId;
      const teacher = data.teachers.find((t) => (t._id || t.id) === teacherId);
      return {
        studentId,
        totalScore: sr?.totalScore || 0,
        ratingCount: sr?.ratingCount || 0,
        studentName: student?.name || "Noma'lum",
        studentSurname: student?.surname || "",
        studentPhone: student?.phone || "—",
        groupName: group?.name || "—",
        teacherName: teacher?.name || "Noma'lum",
        averageScore:
          sr?.ratingCount > 0
            ? (sr.totalScore / sr.ratingCount).toFixed(2)
            : "0",
      };
    });

    return result.sort((a, b) => b.totalScore - a.totalScore);
  }, [ratingsData, data.students, data.groups, data.teachers]);

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
          {hasGroups ? "Dars jadvali" : "Boshqaruv paneli"}
        </h1>
        <p className="text-sm text-base-content/50 mt-1">CRM tizimi</p>
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
                  O'quvchilar
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
                  O'qituvchilar
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
                  Kelmaganlar
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
                  Reyting
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
                  To'lovlar
                </p>
                <h4 className="text-lg font-bold text-success">
                  {paymentsData.length}
                </h4>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTROLS (schedule section) ── */}
      {activeSection === "schedule" && hasGroups && (
        <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
          <div className="card-body p-3 flex-row justify-between items-center flex-wrap gap-2">
            <div className="flex gap-1 flex-wrap">
              {DAYS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  className={`btn btn-sm ${selectedDay === d.key ? "btn-primary" : "btn-ghost"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="join">
                <button
                  onClick={() => setViewMode("room")}
                  className={`btn btn-sm join-item ${viewMode === "room" ? "btn-primary" : "btn-ghost"}`}
                >
                  Xona
                </button>
                <button
                  onClick={() => setViewMode("teacher")}
                  className={`btn btn-sm join-item ${viewMode === "teacher" ? "btn-primary" : "btn-ghost"}`}
                >
                  Ustoz
                </button>
              </div>
              <div className="flex gap-2 border-l border-base-300 pl-3">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <List className="w-4 h-4 text-base-content/40" />
                <Maximize2 className="w-4 h-4 text-primary" />
              </div>
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
                      ? "Kelmagan O'quvchilar"
                      : activeSection === "rating"
                        ? "O'quvchilar Reytingi"
                        : "To'lovlar Haqida"}
                  </h2>
                  <p className="text-xs text-base-content/50">
                    {activeSection === "absent"
                      ? `${new Date().toLocaleDateString("uz-UZ")}`
                      : activeSection === "rating"
                        ? `Baholangan o'quvchilar (${studentRatings.length} ta)`
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
                  ? `${absentStudents.length} ta kelmagan`
                  : activeSection === "rating"
                    ? `${studentRatings.length} ta o'quvchi`
                    : `${paymentsData.length} ta to'lov`}
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
                    Vaqt
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
                      const colId = col._id || col.id;
                      const slotTime = slotStartMinutes(slot);

                      const group = dayGroups.find(
                        (g) =>
                          (viewMode === "room"
                            ? g.roomId === colId
                            : g.teacherId === colId) &&
                          g.schedule?.fromHour &&
                          slotTime === timeToMinutes(g.schedule.fromHour),
                      );

                      const isOccupied = dayGroups.some(
                        (g) =>
                          (viewMode === "room"
                            ? g.roomId === colId
                            : g.teacherId === colId) &&
                          g.schedule?.fromHour &&
                          g.schedule?.toHour &&
                          slotTime > timeToMinutes(g.schedule.fromHour) &&
                          slotTime < timeToMinutes(g.schedule.toHour),
                      );

                      if (isOccupied) return null;

                      if (group && group.schedule?.toHour) {
                        const fromMinutes = timeToMinutes(
                          group.schedule.fromHour,
                        );
                        const toMinutes = timeToMinutes(group.schedule.toHour);
                        const span = Math.max(
                          1,
                          (toMinutes - fromMinutes) / 30,
                        );

                        const groupStudents =
                          groupsStudentsData[group._id || group.id] || [];
                        const currentStudentsCount =
                          groupStudents.length || group.currentStudents || 0;
                        const maxStudents = group.maxStudents || 12;

                        const teacher = data.teachers.find(
                          (t) => (t._id || t.id) === group.teacherId,
                        );
                        const teacherName =
                          teacher?.name || group.teacherName || "Noma'lum";

                        const today = new Date().toISOString().split("T")[0];
                        const groupAttendance = attendanceData.filter(
                          (a) =>
                            (a.groupId === group._id ||
                              a.groupId === group.id) &&
                            a.date === today,
                        );
                        const presentCount = groupAttendance.filter(
                          (a) => a.status === "present",
                        ).length;
                        const absentCount = groupAttendance.filter(
                          (a) => a.status === "absent",
                        ).length;

                        const colors = getGroupColor(group.name);
                        const status = getStatus(
                          group.schedule.fromHour,
                          group.schedule.toHour,
                        );

                        return (
                          <td
                            key={`${colId}-${slotIdx}`}
                            rowSpan={span}
                            className="p-1.5 align-top border border-base-200"
                            style={{ minWidth: "180px" }}
                            onClick={() =>
                              navigate(
                                `/admin/groups?groupId=${group._id || group.id}`,
                              )
                            }
                          >
                            {/* ── DaisyUI Card ── */}
                            <div
                              className={`card card-compact w-full h-full cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 rounded-xl bg-base-100 ${colors.card}`}
                            >
                              <div className="card-body gap-1.5 p-3">
                                {/* Header: nom + status */}
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-black text-sm leading-tight text-base-content">
                                    {group.name}
                                  </span>
                                  <span
                                    className={`badge badge-sm ${status.cls} shrink-0`}
                                  >
                                    <span
                                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${status.dot}`}
                                    />
                                    {status.label}
                                  </span>
                                </div>

                                {/* Vaqt */}
                                <div className="flex items-center gap-1 text-xs text-base-content/60 font-semibold">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-3.5 h-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  {group.schedule.fromHour} –{" "}
                                  {group.schedule.toHour}
                                </div>

                                <div className="divider my-0 h-px" />

                                {/* O'qituvchi */}
                                <div className="flex items-center gap-1.5 text-xs text-base-content/80">
                                  <div className="avatar placeholder">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">
                                      {teacherName?.charAt(0)?.toUpperCase() ||
                                        "?"}
                                    </div>
                                  </div>
                                  <span className="truncate font-medium">
                                    {teacherName}
                                  </span>
                                </div>

                                {/* Xona */}
                                <div className="flex items-center gap-1 text-xs text-base-content/50">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-3.5 h-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                  </svg>
                                  {group.roomName}
                                </div>

                                {/* Stats badges */}
                                <div className="flex items-center gap-1.5 pt-1 mt-auto flex-wrap">
                                  <div
                                    className="tooltip tooltip-bottom"
                                    data-tip="Kelganlar / Jami"
                                  >
                                    <div className="badge badge-sm badge-success gap-1 font-bold">
                                      ✅ {presentCount}/{currentStudentsCount}
                                    </div>
                                  </div>
                                  <div
                                    className="tooltip tooltip-bottom"
                                    data-tip="O'quvchi / Sig'im"
                                  >
                                    <div className="badge badge-sm badge-info gap-1 font-bold">
                                      👥 {currentStudentsCount}/{maxStudents}
                                    </div>
                                  </div>
                                  <div
                                    className="tooltip tooltip-bottom"
                                    data-tip="Kelmaganlar"
                                  >
                                    <div
                                      className={`badge badge-sm gap-1 font-bold ${absentCount > 0 ? "badge-error" : "badge-ghost"}`}
                                    >
                                      ❌ {absentCount}
                                    </div>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div
                                  className="tooltip tooltip-bottom w-full"
                                  data-tip={`${currentStudentsCount} / ${maxStudents} o'quvchi`}
                                >
                                  <progress
                                    className="progress progress-primary w-full h-1.5"
                                    value={currentStudentsCount}
                                    max={maxStudents}
                                  />
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
                  <th>Ism</th>
                  <th>Familiya</th>
                  <th>Telefon</th>
                  <th>Guruh</th>
                  <th>Ustoz</th>
                  <th className="text-right">Balans</th>
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
                          Bugun hamma keldi!
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
                      <td className="text-sm">
                        {student.studentSurname || "—"}
                      </td>
                      <td className="text-sm">{student.studentPhone}</td>
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
                  <th>Ism</th>
                  <th>Familiya</th>
                  <th>Telefon</th>
                  <th>Guruh</th>
                  <th>Ustoz</th>
                  <th className="text-center">Baholar soni</th>
                  <th className="text-center">O'rtacha</th>
                  <th className="text-center">Jami</th>
                </tr>
              </thead>
              <tbody>
                {loadingRatings ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <span className="loading loading-spinner loading-lg text-warning" />
                    </td>
                  </tr>
                ) : studentRatings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-base-content/40">
                        <Users className="w-16 h-16" />
                        <p className="text-sm">O'quvchilar topilmadi</p>
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
                      <td className="text-sm">
                        {student.studentSurname || "—"}
                      </td>
                      <td className="text-sm">{student.studentPhone}</td>
                      <td>
                        <span className="badge badge-warning badge-sm font-bold">
                          {student.groupName}
                        </span>
                      </td>
                      <td className="text-sm">{student.teacherName}</td>
                      <td className="text-center">
                        <span className="badge badge-info badge-sm font-bold">
                          {student.ratingCount}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4 text-warning" />
                          <span className="font-bold text-warning">
                            {student.averageScore}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge font-bold ${
                            student.totalScore >= 50
                              ? "badge-success"
                              : student.totalScore >= 30
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
                        Bugungi Kirim
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
                        Bugungi Chiqim
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
                        Oylik Kirim
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
                        Oylik Chiqim
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
                        Sof Balans
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
                        Jami Kirim
                      </p>
                      <p className="text-lg font-bold text-success">
                        +{paymentStats.totalIncome.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-base-content/50">
                        Jami Chiqim
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
                        <th>Sana</th>
                        <th>Turi</th>
                        <th>Kim uchun</th>
                        <th>Oy</th>
                        <th className="text-right">Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-base-content/40">
                              <Wallet className="w-16 h-16" />
                              <p className="text-sm">To'lovlar yo'q</p>
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
                                  payment.type?.dk === "credit"
                                    ? "badge-success"
                                    : "badge-error"
                                }`}
                              >
                                {payment.type?.dk === "credit" ? (
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
                                payment.type?.dk === "credit"
                                  ? "text-success"
                                  : "text-error"
                              }`}
                            >
                              {payment.type?.dk === "credit" ? "+" : "-"}
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
                    Oxirgi 20 ta to'lov ko'rsatilgan. Barchasi uchun To'lovlar
                    sahifasiga o'ting.
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