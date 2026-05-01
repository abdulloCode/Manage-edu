import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

// API importlaringiz
import { getAllGroups, getAllRooms } from "../../api/groups";
import { getAllTeachers } from "../../api/teacher";
import { getStudents, getStudentById } from "../../api/students";
import { getAllAttendances } from "../../api/attendance";
import { getAllRatings } from "../../api/ratings";
import { getAllPayments } from "../../api/payments";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState("Sha");
  const [viewMode, setViewMode] = useState("room");
  const [activeSection, setActiveSection] = useState("schedule"); // schedule, absent, rating, payments
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
  const [groupsStudentsData, setGroupsStudentsData] = useState({}); // Har bir guruh uchun o'quvchilar
  const [loadingGroupsStudents, setLoadingGroupsStudents] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllGroups(),
      getAllTeachers(),
      getStudents(),
      getAllRooms(),
    ]).then(([gRes, tRes, sRes, rRes]) => {
      const gData = gRes.data?.data ?? gRes.data ?? [];
      const tData = tRes.data?.data ?? tRes.data ?? [];
      const sData = sRes.data?.data ?? sRes.data ?? [];
      const rData = rRes.data?.data ?? rRes.data ?? [];

      console.log("API Response - Groups:", gData);
      console.log("API Response - Teachers:", tData);
      console.log("API Response - Rooms:", rData);

      const mappedGroups = gData.map((g) => {
        const teacher = tData.find((t) => (t._id || t.id) === g.teacherId);
        const room = rData.find((r) => (r._id || r.id) === g.roomId);
        return {
          ...g,
          teacherName: teacher?.name ?? "",
          roomName: room?.name ?? "",
        };
      });

      console.log("Mapped Groups:", mappedGroups);

      setData({
        groups: mappedGroups,
        teachers: tData,
        students: sData,
        rooms: rData,
      });
    });
  }, []);

  // Bugungi attendance ma'lumotlarini yuklash
  useEffect(() => {
    loadTodayAttendance();
  }, []);

  // Attendance ma'lumotlarini avtomatik yangilash (har 5 daqiqada)
  useEffect(() => {
    const interval = setInterval(
      () => {
        loadTodayAttendance();
      },
      5 * 60 * 1000,
    ); // 5 daqiqa

    return () => clearInterval(interval);
  }, []);

  const loadTodayAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const res = await getAllAttendances({ limit: 1000 });
      const allAttendance = res.data?.data || res.data || [];

      // Bugungi sanadagi attendance ma'lumotlarini filter qilish
      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = allAttendance.filter((a) => a.date === today);

      setAttendanceData(todayAttendance);
      console.log("Bugungi attendance:", todayAttendance);
    } catch (err) {
      console.error("Attendance yuklashda xatolik:", err);
      setAttendanceData([]); // Xatolik bo'lsa bo'sh array qo'yish
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Kelmagan o'quvchilarni hisoblash
  const absentStudentsCount = useMemo(() => {
    const absentCount = attendanceData.filter(
      (a) => a.status === "absent",
    ).length;
    return absentCount;
  }, [attendanceData]);

  // Kelmagan o'quvchilar ro'yxatini olish
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
        studentPhone: student?.phone || "—",
        groupName: group?.name || "—",
        teacherName: teacher?.name || "Noma'lum",
        balance: student?.balance || 0,
      };
    });
  };

  // Kelmagan o'quvchilar sectioniga o'tish
  const handleShowAbsent = () => {
    const absent = getAbsentStudents();
    setAbsentStudents(absent);
    setActiveSection("absent");
  };

  // Reyting sectioniga o'tish
  const handleShowRating = () => {
    setActiveSection("rating");
  };

  // Payment sectioniga o'tish
  const handleShowPayments = () => {
    setActiveSection("payments");
  };

  // Asosiy jadval sectioniga qaytish
  const handleBackToSchedule = () => {
    setActiveSection("schedule");
  };

  // Payment statistikasini hisoblash
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

    // Bugungi to'lovlar
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = paymentsData.filter((p) => p.date === today);
    const todayIncome = todayPayments
      .filter((p) => p.type?.dk === "credit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const todayExpense = todayPayments
      .filter((p) => p.type?.dk === "debit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Oylik statistika
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

    console.log("Payment stats calculated:", {
      totalIncome,
      totalExpense,
      netBalance,
      todayIncome,
      todayExpense,
      monthIncome,
      monthExpense,
    });

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

  // Baho ma'lumotlarini yuklash
  useEffect(() => {
    loadRatings();
  }, []);

  // Baho ma'lumotlarini avtomatik yangilash (har 10 daqiqada)
  useEffect(() => {
    const interval = setInterval(
      () => {
        loadRatings();
      },
      10 * 60 * 1000,
    ); // 10 daqiqa

    return () => clearInterval(interval);
  }, []);

  const loadRatings = async () => {
    setLoadingRatings(true);
    try {
      const res = await getAllRatings();
      const allRatings = res.data?.data || res.data || [];
      setRatingsData(allRatings);
      console.log("Baho ma'lumotlari:", allRatings);
      console.log("Baho ma'lumotlari turi:", Array.isArray(allRatings) ? 'Array' : typeof allRatings);
    } catch (err) {
      console.error("Baho yuklashda xatolik:", err);
      setRatingsData([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  // Payment ma'lumotlarini yuklash
  useEffect(() => {
    loadPayments();
  }, []);

  // Guruhlar uchun o'quvchilar ma'lumotlarini yuklash
  const loadGroupsStudents = async () => {
    setLoadingGroupsStudents(true);
    try {
      const groupsStudentsMap = {};

      for (const group of data.groups) {
        if (group.studentIds && Array.isArray(group.studentIds)) {
          const students = await Promise.all(
            group.studentIds.map(studentId =>
              getStudentById(studentId)
                .then(res => res.data?.data || res.data)
                .catch(() => null)
            )
          );

          groupsStudentsMap[group._id || group.id] = students.filter(s => s !== null);
        } else {
          groupsStudentsMap[group._id || group.id] = [];
        }
      }

      setGroupsStudentsData(groupsStudentsMap);
      console.log('Guruhlar uchun o\'quvchilar yuklandi:', groupsStudentsMap);
    } catch (err) {
      console.error('Guruh o\'quvchilarini yuklashda xatolik:', err);
      setGroupsStudentsData({});
    } finally {
      setLoadingGroupsStudents(false);
    }
  };

  // Guruhlar yuklangandan keyin o'quvchilarni ham yuklash
  useEffect(() => {
    if (data.groups.length > 0) {
      loadGroupsStudents();
    }
  }, [data.groups]);

  // Kun o'zgarganda guruh o'quvchilarini yangilash
  useEffect(() => {
    if (data.groups.length > 0) {
      loadGroupsStudents();
    }
  }, [selectedDay]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await getAllPayments({ limit: 1000 });
      const allPayments =
        res.data?.payments || res.data?.data || res.data || [];
      setPaymentsData(Array.isArray(allPayments) ? allPayments : []);
      console.log("To'lov ma'lumotlari:", allPayments);
    } catch (err) {
      console.error("To'lovlar yuklashda xatolik:", err);
      setPaymentsData([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // O'quvchilarning baholarini gurhlash va hisoblash
  const studentRatings = useMemo(() => {
    if (!Array.isArray(ratingsData) || !Array.isArray(data.students)) {
      console.log("Rating data or students data is not array:", {
        ratingsData,
        students: data.students,
      });
      return [];
    }

    const studentScoreMap = {};

    // Barcha baholarni guruhlashingiz
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

    // BARCHA o'quvchilarni qo'shish
    const result = data.students.map((student) => {
      const studentId = student._id || student.id;
      const studentRatings = studentScoreMap[studentId];
      const group = data.groups.find(
        (g) => (g._id || g.id) === student?.groupId,
      );
      const teacherId =
        studentRatings && studentRatings.teacherIds.size > 0
          ? Array.from(studentRatings.teacherIds)[0]
          : group?.teacherId;
      const teacher = data.teachers.find((t) => (t._id || t.id) === teacherId);

      return {
        studentId,
        totalScore: studentRatings?.totalScore || 0,
        ratingCount: studentRatings?.ratingCount || 0,
        studentName: student?.name || "Noma'lum",
        studentSurname: student?.surname || "",
        studentPhone: student?.phone || "—",
        groupName: group?.name || "—",
        teacherName: teacher?.name || "Noma'lum",
        averageScore:
          studentRatings?.ratingCount > 0
            ? (studentRatings.totalScore / studentRatings.ratingCount).toFixed(
                2,
              )
            : "0",
      };
    });

    // Bahosiga bo'yicha saralash (yuqoridan pastga)
    const sortedResult = result.sort((a, b) => b.totalScore - a.totalScore);
    console.log('Student ratings calculated:', { total: sortedResult.length, top5: sortedResult.slice(0, 5) });
    return sortedResult;
  }, [ratingsData, data.students, data.groups, data.teachers]);

  const columns = useMemo(
    () => (viewMode === "room" ? data.rooms : data.teachers),
    [viewMode, data],
  );
  const dayGroups = useMemo(() => {
    const filtered = data.groups.filter((g) =>
      g.schedule?.days?.includes(selectedDay),
    );
    console.log("Selected Day:", selectedDay);
    console.log("All Groups:", data.groups);
    console.log("Filtered Groups for day:", filtered);
    console.log("Columns (rooms/teachers):", columns);
    console.log("View Mode:", viewMode);

    return filtered;
  }, [data.groups, selectedDay, columns, viewMode]);

  const getGroupStyles = (groupName) => {
    if (groupName?.startsWith("EKY")) return "bg-[#4ADE80] text-white";
    if (groupName?.startsWith("EMU")) return "bg-[#000000] text-white";
    if (groupName?.startsWith("OON") || groupName?.startsWith("OSS"))
      return "bg-[#2DD4BF] text-white";
    if (groupName?.startsWith("TXA")) return "bg-[#EF4444] text-white";
    if (groupName?.startsWith("EMA")) return "bg-[#7F1D1D] text-white";
    return "bg-[#FACC15] text-black";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      {/* ── HEADER (Soddalashtirilgan) ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dars jadvali</h1>
        <p className="text-sm text-gray-500 mt-1">CRM tizimi</p>
      </div>

      {/* ── STATS GRID (Faqat so'ralganlar) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-500 uppercase leading-none mb-1">
              O'quvchilar
            </p>
            <h4 className="text-lg font-bold text-gray-900">
              {data.students.length}
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-500 uppercase leading-none mb-1">
              O'qituvchilar
            </p>
            <h4 className="text-lg font-bold text-gray-900">
              {data.teachers.length}
            </h4>
          </div>
        </div>

        <div
          className={`bg-white p-4 border rounded-xl shadow-sm flex items-center gap-3 cursor-pointer transition-colors ${activeSection === "absent" ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-red-50"}`}
          onClick={handleShowAbsent}
        >
          <div
            className={`p-2 rounded-lg ${activeSection === "absent" ? "bg-red-600" : "bg-red-500/10"}`}
          >
            <UserMinus
              className={`w-5 h-5 ${activeSection === "absent" ? "text-white" : "text-red-600"}`}
            />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-500 uppercase leading-none mb-1">
              Kelmaganlar
            </p>
            <h4
              className={`text-lg font-bold ${activeSection === "absent" ? "text-red-700" : "text-red-600"}`}
            >
              {absentStudentsCount}
            </h4>
          </div>
        </div>

        <div
          className={`bg-white p-4 border rounded-xl shadow-sm flex items-center gap-3 cursor-pointer transition-colors ${activeSection === "rating" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:bg-amber-50"}`}
          onClick={handleShowRating}
        >
          <div
            className={`p-2 rounded-lg ${activeSection === "rating" ? "bg-amber-600" : "bg-amber-500/10"}`}
          >
            <Trophy
              className={`w-5 h-5 ${activeSection === "rating" ? "text-white" : "text-amber-600"}`}
            />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-500 uppercase leading-none mb-1">
              Reyting
            </p>
            <h4
              className={`text-lg font-bold ${activeSection === "rating" ? "text-amber-700" : "text-amber-600"}`}
            >
              {studentRatings.length}
            </h4>
          </div>
        </div>

        <div
          className={`bg-white p-4 border rounded-xl shadow-sm flex items-center gap-3 cursor-pointer transition-colors ${activeSection === "payments" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-emerald-50"}`}
          onClick={handleShowPayments}
        >
          <div
            className={`p-2 rounded-lg ${activeSection === "payments" ? "bg-emerald-600" : "bg-emerald-500/10"}`}
          >
            <Wallet
              className={`w-5 h-5 ${activeSection === "payments" ? "text-white" : "text-emerald-600"}`}
            />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-500 uppercase leading-none mb-1">
              To'lovlar
            </p>
            <h4
              className={`text-lg font-bold ${activeSection === "payments" ? "text-emerald-700" : "text-emerald-600"}`}
            >
              {paymentsData.length}
            </h4>
          </div>
        </div>
      </div>

      {/* ── CONTROLS (Faqat schedule section) ── */}
      {activeSection === "schedule" && (
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-center mb-4 shadow-sm">
          <div className="flex gap-1 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${selectedDay === d.key ? "bg-[#4F46E5] text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("room")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold ${viewMode === "room" ? "bg-[#4F46E5] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              >
                Xona
              </button>
              <button
                onClick={() => setViewMode("teacher")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold ${viewMode === "teacher" ? "bg-[#4F46E5] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              >
                Ustoz
              </button>
            </div>
            <div className="flex gap-2 border-l border-gray-300 pl-3">
              <LayoutGrid className="w-4 h-4 text-indigo-600" />
              <List className="w-4 h-4 text-gray-400" />
              <Maximize2 className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION HEADER ── */}
      {activeSection !== "schedule" && (
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToSchedule}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {activeSection === "absent"
                  ? "Kelmagan O'quvchilar"
                  : activeSection === "rating"
                    ? "O'quvchilar Reytingi"
                    : "To'lovlar Haqida"}
              </h2>
              <p className="text-xs text-gray-500">
                {activeSection === "absent"
                  ? `${new Date().toLocaleDateString("uz-UZ")}`
                  : activeSection === "rating"
                    ? `Baholangan o'quvchilar (${studentRatings.length} ta)`
                    : `Bugungi va oylik to'lovlar xulosasi (${paymentsData.length} ta)`}
              </p>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-xl font-bold ${
              activeSection === "absent"
                ? "bg-red-100 text-red-700"
                : activeSection === "rating"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {activeSection === "absent"
              ? `${absentStudents.length} ta kelmagan`
              : activeSection === "rating"
                ? `${studentRatings.length} ta o'quvchi`
                : `${paymentsData.length} ta to'lov`}
          </div>
        </div>
      )}

      {/* ── SCHEDULE TABLE (Faqat schedule section) ── */}
      {activeSection === "schedule" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border-r border-b border-gray-200 w-24 sticky left-0 bg-gray-100 z-30 text-xs font-bold text-gray-600 uppercase text-center">
                    Vaqt
                  </th>
                  {columns.map((col, idx) => (
                    <th
                      key={col._id || col.id}
                      className="p-3 border-r border-b border-gray-200 min-w-[150px] text-center text-xs font-bold text-gray-900"
                    >
                      {col.name || idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, slotIdx) => (
                  <tr key={slot} className="hover:bg-gray-50/50">
                    <td className="p-3 border-r border-b border-gray-200 text-center text-xs font-semibold text-gray-600 bg-white sticky left-0 z-10">
                      {slot}
                    </td>
                    {columns.map((col) => {
                      const colId = col._id || col.id;
                      const slotTime = slotStartMinutes(slot);

                      // Find group that starts at this slot
                      const group = dayGroups.find(
                        (g) =>
                          (viewMode === "room"
                            ? g.roomId === colId
                            : g.teacherId === colId) &&
                          g.schedule?.fromHour &&
                          slotTime === timeToMinutes(g.schedule.fromHour),
                      );

                      // Check if this slot is occupied by a group that started earlier
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

                      // Skip cell if occupied (it's part of a rowspan)
                      if (isOccupied) {
                        return null;
                      }

                      // If group found, render it with simple card design
                      if (group && group.schedule?.toHour) {
                        const fromMinutes = timeToMinutes(
                          group.schedule.fromHour,
                        );
                        const toMinutes = timeToMinutes(group.schedule.toHour);
                        const span = Math.max(
                          1,
                          (toMinutes - fromMinutes) / 30,
                        );

                        // API dan o'quvchilar ma'lumotlari
                        const groupStudents = groupsStudentsData[group._id || group.id] || [];
                        const currentStudentsCount = groupStudents.length || group.currentStudents || 0;
                        const maxStudents = group.maxStudents || 12;

                        // Guruh o'qituvchisi ma'lumotlari
                        const teacher = data.teachers.find(t => (t._id || t.id) === group.teacherId);
                        const teacherName = teacher?.name || group.teacherName || "Noma'lum";

                        // Bugungi attendance ma'lumotlari (agar guruh uchun bo'lsa)
                        const today = new Date().toISOString().split('T')[0];
                        const groupAttendance = attendanceData.filter(a =>
                          (a.groupId === group._id || a.groupId === group.id) && a.date === today
                        );
                        const presentCount = groupAttendance.filter(a => a.status === 'present').length;
                        const absentCount = groupAttendance.filter(a => a.status === 'absent').length;

                        // Hozirgi vaqtni hisoblash
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();
                        const currentTotalMinutes = currentHour * 60 + currentMinute;

                        const startMinutes = timeToMinutes(group.schedule.fromHour);
                        const endMinutes = timeToMinutes(group.schedule.toHour);

                        // Dars holati
                        let status = 'kutilmoqda'; // kutilmoqda, boshlandi, davom etmoqda, tugadi
                        let statusText = 'Kutilmoqda';
                        let statusColor = 'text-gray-500';

                        if (currentTotalMinutes < startMinutes) {
                          status = 'kutilmoqda';
                          statusText = 'Kutilmoqda';
                          statusColor = 'text-gray-500';
                        } else if (currentTotalMinutes >= startMinutes && currentTotalMinutes < endMinutes) {
                          status = 'davom etmoqda';
                          statusText = 'Darsda';
                          statusColor = 'text-green-500';
                        } else if (currentTotalMinutes >= endMinutes) {
                          status = 'tugadi';
                          statusText = 'Tugadi';
                          statusColor = 'text-red-500';
                        }

                        return (
                          <td
                            key={`${colId}-${slotIdx}`}
                            rowSpan={span}
                            className={`p-3 align-top border-[3px] border-white shadow-md z-10 rounded-[18px] transition-all hover:scale-[1.02] cursor-pointer ${getGroupStyles(group.name)}`}
                            style={{ minWidth: "160px" }}
                            onClick={() => navigate(`/admin/groups?groupId=${group._id || group.id}`)}
                          >
                            <div className="flex flex-col h-full justify-between">
                              {/* Yuqori qism: Guruh va Vaqt */}
                              <div>
                                <div className="text-[13px] font-black font-['Sora'] leading-tight mb-1 drop-shadow-sm">
                                  {group.name} {group.schedule.fromHour}-
                                  {group.schedule.toHour}
                                </div>

                                <div className="text-[12px] font-bold opacity-90 truncate mb-1">
                                  {teacherName}
                                </div>

                                <div className="text-[11px] font-medium opacity-85 mb-2">
                                  Xona: {group.roomName}
                                </div>

                                {/* Dars holati */}
                                <div className="text-[10px] font-bold mb-3">
                                  <span className={statusColor}>●</span> {statusText}
                                </div>
                              </div>

                              {/* Pastki qism: Statistika (API ma'lumotlari bilan) */}
                              <div className="flex items-center gap-3 pt-2 border-t border-black/5">
                                {/* Bugungi attendance */}
                                <div className="flex items-center gap-1 text-[11px] font-bold">
                                  <span className="opacity-70">✅</span>
                                  <span>{presentCount}/{currentStudentsCount}</span>
                                </div>

                                {/* O'quvchilar soni */}
                                <div className="flex items-center gap-1 text-[11px] font-bold">
                                  <span className="opacity-70">👥</span>
                                  <span>
                                    {currentStudentsCount}/{maxStudents}
                                  </span>
                                </div>

                                {/* Kelmaganlar */}
                                <div className="flex items-center gap-1 text-[11px] font-bold">
                                  <span className="opacity-70">❌</span>
                                  <span>{absentCount}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Empty cell
                      return (
                        <td
                          key={`${colId}-${slotIdx}`}
                          className="border-r border-b border-gray-200 text-center text-gray-400 text-xs"
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

      {/* ── ABSENT STUDENTS TABLE (Faqat absent section) ── */}
      {activeSection === "absent" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-red-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Ism
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Familiya
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Telefon
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Guruh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Ustoz
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                    Balans
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingAttendance ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : absentStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center">
                        <UserCheck className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium">
                          Bugun hamma keldi!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  absentStudents.map((student, idx) => (
                    <tr
                      key={student._id || student.id || idx}
                      className="border-b border-gray-100 hover:bg-red-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                            {student.studentName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "??"}
                          </div>
                          <span className="font-medium text-gray-900">
                            {student.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.studentSurname || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.studentPhone}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          {student.groupName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.teacherName}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${student.balance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
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

      {/* ── RATING TABLE (Faqat rating section) ── */}
      {activeSection === "rating" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Ism
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Familiya
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Telefon
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Guruh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Ustoz
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                    Baholar soni
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                    O'rtacha
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                    Jami
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingRatings ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : studentRatings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center">
                        <Users className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium">
                          O'quvchilar topilmadi
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  studentRatings.map((student, idx) => (
                    <tr
                      key={student.studentId}
                      className="border-b border-gray-100 hover:bg-amber-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center">
                        {idx < 3 ? (
                          <div
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              idx === 0
                                ? "bg-amber-500 text-white"
                                : idx === 1
                                  ? "bg-gray-400 text-white"
                                  : "bg-amber-700 text-white"
                            }`}
                          >
                            {idx + 1}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {idx + 1}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                              idx < 3
                                ? "bg-gradient-to-br from-amber-400 to-amber-600"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {student.studentName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "??"}
                          </div>
                          <span
                            className={`font-medium ${idx < 3 ? "text-gray-900" : "text-gray-700"}`}
                          >
                            {student.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.studentSurname || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.studentPhone}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          {student.groupName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.teacherName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          {student.ratingCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-amber-600">
                            {student.averageScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                            student.totalScore >= 50
                              ? "bg-green-100 text-green-700"
                              : student.totalScore >= 30
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
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

      {/* ── PAYMENTS SECTION (Faqat payments section) ── */}
      {activeSection === "payments" && (
        <div className="space-y-6">
          {loadingPayments ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Bugungi kirim */}
                <div className="bg-white p-5 border border-emerald-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-emerald-50">
                      <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Bugungi Kirim
                      </p>
                      <p className="text-xl font-bold text-emerald-600">
                        +{paymentStats.todayIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bugungi chiqim */}
                <div className="bg-white p-5 border border-red-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-red-50">
                      <ArrowDownCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Bugungi Chiqim
                      </p>
                      <p className="text-xl font-bold text-red-600">
                        -{paymentStats.todayExpense.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Oylik kirim */}
                <div className="bg-white p-5 border border-blue-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-blue-50">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Oylik Kirim
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        +{paymentStats.monthIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Oylik chiqim */}
                <div className="bg-white p-5 border border-purple-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-purple-50">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Oylik Chiqim
                      </p>
                      <p className="text-xl font-bold text-purple-600">
                        -{paymentStats.monthExpense.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Card */}
              <div
                className={`bg-white p-6 border rounded-2xl shadow-sm ${paymentStats.netBalance >= 0 ? "border-emerald-200" : "border-red-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Sof Balans
                    </p>
                    <p
                      className={`text-3xl font-bold ${paymentStats.netBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {paymentStats.netBalance >= 0 ? "+" : ""}
                      {paymentStats.netBalance.toLocaleString()} UZS
                    </p>
                  </div>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${paymentStats.netBalance >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                  >
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Jami Kirim</p>
                    <p className="text-lg font-bold text-emerald-600">
                      +{paymentStats.totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Jami Chiqim</p>
                    <p className="text-lg font-bold text-red-600">
                      -{paymentStats.totalExpense.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Payments Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Sana
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Turi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Kim uchun
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Oy
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                          Summa
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-12 text-center text-gray-400"
                          >
                            <div className="flex flex-col items-center">
                              <Wallet className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                              <p className="text-sm font-medium">
                                To'lovlar yo'q
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paymentsData.slice(0, 20).map((payment) => (
                          <tr
                            key={payment._id || payment.id}
                            className="border-b border-gray-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {payment.date
                                ? new Date(payment.date).toLocaleDateString(
                                    "uz-UZ",
                                  )
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                                  payment.type?.dk === "credit"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
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
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {typeof payment.toWho === "object"
                                ? payment.toWho?.name || "—"
                                : payment.toWho || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {payment.month || "—"}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm font-semibold text-right ${
                                payment.type?.dk === "credit"
                                  ? "text-emerald-600"
                                  : "text-red-600"
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
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-slate-500">
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
