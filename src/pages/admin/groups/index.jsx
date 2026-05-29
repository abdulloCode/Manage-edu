import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../../components/Toast";
import {
  Users,
  Building2,
  Search,
  Edit3,
  Trash2,
  X,
  Calendar,
  Clock,
  UserPlus,
  GraduationCap,
  BookOpen,
  DoorOpen,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Wallet,
  Users2,
  CheckCircle,
  XCircle,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import {
  useGroups,
  useGroupForm,
  saveGroup,
  saveRoom,
  removeItem,
  addStudentToGroupApi,
  fetchAllStudents,
  fetchStudentsForCourse,
} from "./hooks";
import { getGroupById, getFreeRooms, removeStudentFromGroup } from "../../../api/groups";
import { getAvailableTeachers } from "../../../api/teachers";
import { getAllPayments } from "../../../api/payments";
import { getStudentById, updateStudent, deleteStudent } from "../../../api/students";
import { getGroupAttendanceCalendar } from "../../../api/attendance";
import { formatPhone } from "../../../utils/permissions";

// ── 24h Time Picker ───────────────────────────────────────────
function TimePicker24({ value, onChange, label }) {
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const minutes = ["00", "15", "30", "45"];
  const parts = (value || "09:00").split(":");
  const h = parts[0] || "09";
  const m = parts[1] || "00";

  return (
    <div>
      <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          value={h}
          onChange={(e) => onChange(`${e.target.value}:${m}`)}
          className="flex-1 px-2.5 py-2 bg-base-200 border-2 border-transparent rounded-xl text-sm font-bold text-base-content outline-none focus:border-primary focus:bg-base-100 transition-all cursor-pointer"
        >
          {hours.map((hr) => (
            <option key={hr} value={hr}>
              {hr}:00
            </option>
          ))}
        </select>
        <select
          value={m}
          onChange={(e) => onChange(`${h}:${e.target.value}`)}
          className="w-20 px-2.5 py-2 bg-base-200 border-2 border-transparent rounded-xl text-sm font-bold text-base-content outline-none focus:border-primary focus:bg-base-100 transition-all cursor-pointer"
        >
          {minutes.map((min) => (
            <option key={min} value={min}>
              :{min}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Card color palette ────────────────────────────────────────
const PALETTES = [
  { header: "from-violet-500 to-indigo-600",  soft: "bg-violet-50",  text: "text-violet-600",  ring: "ring-violet-200",  progress: "progress-primary",  pill: "bg-violet-100 text-violet-700"  },
  { header: "from-sky-500 to-blue-600",       soft: "bg-sky-50",     text: "text-sky-600",     ring: "ring-sky-200",     progress: "progress-info",     pill: "bg-sky-100 text-sky-700"        },
  { header: "from-emerald-500 to-teal-600",   soft: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200", progress: "progress-success",  pill: "bg-emerald-100 text-emerald-700"},
  { header: "from-orange-500 to-rose-500",    soft: "bg-orange-50",  text: "text-orange-600",  ring: "ring-orange-200",  progress: "progress-warning",  pill: "bg-orange-100 text-orange-700"  },
  { header: "from-pink-500 to-fuchsia-600",   soft: "bg-pink-50",    text: "text-pink-600",    ring: "ring-pink-200",    progress: "progress-secondary",pill: "bg-pink-100 text-pink-700"      },
  { header: "from-amber-400 to-orange-500",   soft: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-200",   progress: "progress-warning",  pill: "bg-amber-100 text-amber-700"    },
];

const findById = (list, id) =>
  list.find((item) => {
    const itemId = item._id || item.id;
    const targetId = typeof id === "object" ? id?._id || id?.id : id;
    return itemId === targetId;
  });

// ── Donut Chart ───────────────────────────────────────────────
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="16" stroke="var(--fallback-b2,oklch(var(--b2)))" />
      {segments.map((seg, i) => {
        const pct   = seg.value / total;
        const dash  = pct * circumference;
        const gap   = circumference - dash;
        const offset = circumference * cumulative;
        cumulative += pct;
        return (
          <circle
            key={i}
            cx="50" cy="50" r={radius}
            fill="none"
            strokeWidth="16"
            stroke={seg.color}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset + circumference * 0.25}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        );
      })}
      <text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="bold" fill="currentColor">{total}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5">guruh</text>
    </svg>
  );
}

// ── Group Card ────────────────────────────────────────────────
function GroupCard({ group, idx, teachers, courses, rooms, openEditGroupModal, openDeleteModal, onAddStudent, onViewStudents }) {
  const pal     = PALETTES[idx % PALETTES.length];
  const course  = findById(courses,  group.courseId)  || group.course;
  const teacher = findById(teachers, group.teacherId) || group.teacher;
  const room    = findById(rooms,    group.roomId)    || group.room;
  const filled  = group.currentStudents || group.students?.length || 0;
  const max     = group.maxStudents || 1;
  const pct     = Math.min(100, Math.round((filled / max) * 100));
  const isFull  = filled >= max;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ delay: idx * 0.04, type: "spring", stiffness: 280, damping: 22 }}
      className="card bg-base-100 shadow border border-base-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
      onClick={() => onViewStudents(group)}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${pal.header} p-4 relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-white font-extrabold text-base leading-tight truncate drop-shadow-sm">
              {group.name}
            </h2>
            {course && (
              <p className="text-white/75 text-xs font-medium truncate mt-0.5">
                {course.name || course.title}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {group.status === "active"
              ? <span className="badge badge-sm bg-white/20 text-white border-white/30 backdrop-blur-sm">● Faol</span>
              : <span className="badge badge-sm bg-black/20 text-white/70 border-white/20">○ Nofaol</span>
            }
          </div>
        </div>

        {/* Schedule pill */}
        {group.schedule?.days?.length > 0 && (
          <div className="relative mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-[11px] font-semibold">
            <Clock className="w-3 h-3" />
            {group.schedule.days.join(", ")}
            {group.schedule.fromHour && ` · ${group.schedule.fromHour}–${group.schedule.toHour}`}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Teacher & room row */}
        <div className="flex flex-col gap-1.5">
          {teacher && (
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <div className="w-5 h-5 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                <GraduationCap className="w-3 h-3" />
              </div>
              <span className="truncate font-semibold text-base-content/80">{teacher.name}</span>
            </div>
          )}
          {room && (
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <div className="w-5 h-5 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                <DoorOpen className="w-3 h-3" />
              </div>
              <span className="truncate font-semibold text-base-content/80">{room.name}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="divider my-0" />

        {/* Student progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-bold text-base-content/50 flex items-center gap-1">
              <Users2 className="w-3.5 h-3.5" /> O'quvchilar
            </span>
            <span className={`badge badge-sm font-bold ${isFull ? "badge-error" : "badge-ghost"}`}>
              {filled} / {max}
            </span>
          </div>
          <progress
            className={`progress w-full h-2 ${isFull ? "progress-error" : pal.progress}`}
            value={pct}
            max={100}
          />
        </div>

        {/* Fee */}
        <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${pal.soft} ring-1 ${pal.ring}`}>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${pal.text}`}>
            <Wallet className="w-3.5 h-3.5" /> Oylik to'lov
          </span>
          <span className={`text-sm font-extrabold ${pal.text}`}>
            {Number(group.monthlyFeePerStudent || 0).toLocaleString()}
            <span className="text-[10px] font-semibold opacity-60 ml-1">so'm</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openDeleteModal(group, "group")}
            className="btn btn-xs btn-ghost text-error hover:bg-error/10 px-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => openEditGroupModal(group)}
            className="btn btn-xs btn-ghost gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
          </button>
          <button
            onClick={() => onAddStudent(group)}
            className="btn btn-xs btn-primary gap-1 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" /> Qo'shish
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Room Card ─────────────────────────────────────────────────
function RoomCard({ room, idx, openEditRoomModal, openDeleteModal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, type: "spring", stiffness: 280, damping: 22 }}
      className="card bg-base-100 shadow border border-base-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-4 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 right-6 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-extrabold text-base truncate">{room.name}</h2>
            <span className="text-white/60 text-xs font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Xona #{room.number}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Capacity */}
        <div className="flex items-center justify-between bg-base-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-0.5">Sig'imi</p>
            <p className="text-2xl font-extrabold text-base-content">
              {room.capacity}
              <span className="text-sm font-semibold text-base-content/50 ml-1">kishi</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-base-300 flex items-center justify-center">
            <Users className="w-6 h-6 text-base-content/40" />
          </div>
        </div>

        {/* Equipment */}
        {room.equipment?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {room.equipment.slice(0, 5).map((eq, i) => (
              <span key={i} className="badge badge-ghost badge-sm font-semibold">{eq}</span>
            ))}
            {room.equipment.length > 5 && (
              <span className="badge badge-ghost badge-sm">+{room.equipment.length - 5}</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-base-content/30 italic">Jihozlar ko'rsatilmagan</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => openDeleteModal(room, "room")}
            className="btn btn-xs btn-ghost text-error hover:bg-error/10 px-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => openEditRoomModal(room)}
            className="btn btn-xs btn-ghost gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Group Modal ───────────────────────────────────────────────
function GroupModal({
  formData,
  setFormData,
  teachers,
  courses,
  rooms,
  editingGroup,
  handleSaveGroup,
  closeModals,
  isSubmittingGroup,
}) {
  const days = ["Du", "Se", "Chor", "Pa", "Ju", "Sha", "Yak"];
  const [errors, setErrors] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Fetch available rooms and teachers when both days and time are selected
  useEffect(() => {
    const fetchAvailability = async () => {
      const selectedDays = formData.schedule?.days || [];
      const fromHour = formData.schedule?.fromHour || "";

      // Only fetch if both days and time are selected
      if (selectedDays.length > 0 && fromHour) {
        setLoadingAvailability(true);
        try {
          const daysString = selectedDays.join(",");
          const timeString = fromHour;

          // Fetch available rooms and teachers in parallel
          const [roomsRes, teachersRes] = await Promise.all([
            getFreeRooms({ days: daysString, time: timeString }),
            getAvailableTeachers({ days: daysString, time: timeString }),
          ]);

          const availableRoomsData = roomsRes.data.data || roomsRes.data || [];
          const availableTeachersData = teachersRes.data.data || teachersRes.data || [];

          setAvailableRooms(Array.isArray(availableRoomsData) ? availableRoomsData : []);
          setAvailableTeachers(Array.isArray(availableTeachersData) ? availableTeachersData : []);

          // If currently selected room or teacher is not available, clear the selection
       if (editingGroup) {
  // Edit: mavjud teacher/room ni listga qo'sh (band bo'lsa ham)
  if (formData.teacherId) {
    const exists = availableTeachersData.some(t => (t._id || t.id) === formData.teacherId);
    if (!exists) {
      const full = teachers.find(t => (t._id || t.id) === formData.teacherId);
      if (full) availableTeachersData.unshift(full);
    }
  }
  if (formData.roomId) {
    const exists = availableRoomsData.some(r => (r._id || r.id) === formData.roomId);
    if (!exists) {
      const full = rooms.find(r => (r._id || r.id) === formData.roomId);
      if (full) availableRoomsData.unshift(full);
    }
  }
} else {
  // Yangi guruh: band bo'lsa tozala
  if (formData.teacherId && !availableTeachersData.some(t => (t._id || t.id) === formData.teacherId)) {
    setFormData(prev => ({ ...prev, teacherId: "" }));
  }
  if (formData.roomId && !availableRoomsData.some(r => (r._id || r.id) === formData.roomId)) {
    setFormData(prev => ({ ...prev, roomId: "" }));
  }
}
        } catch (err) {
          // On error, show all options
          setAvailableRooms(rooms);
          setAvailableTeachers(teachers);
        } finally {
          setLoadingAvailability(false);
        }
      } else {
        // Reset to all options if days or time not selected
        setAvailableRooms(rooms);
        setAvailableTeachers(teachers);
      }
    };

    fetchAvailability();
 }, [formData.schedule?.days, formData.schedule?.fromHour, editingGroup]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Guruh nomini kiriting";
    if (!formData.courseId) newErrors.courseId = "Kursni tanlang";
    if (!formData.teacherId) newErrors.teacherId = "O'qituvchini tanlang";
    if (!formData.roomId) newErrors.roomId = "Xonani tanlang";
    if (!formData.startDate)
      newErrors.startDate = "Boshlanish sanasini kiriting";
    if (!formData.endDate) newErrors.endDate = "Tugash sanasini kiriting";
    if (!formData.maxStudents)
      newErrors.maxStudents = "Maksimal talabalar sonini kiriting";
    if (!formData.monthlyFeePerStudent)
      newErrors.monthlyFeePerStudent = "Oylik to'lovni kiriting";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate() && !isSubmittingGroup) handleSaveGroup();
  };

  const toggleDay = (day) => {
    const cur = formData.schedule?.days || [];
    const next = cur.includes(day)
      ? cur.filter((d) => d !== day)
      : [...cur, day];
    setFormData({
      ...formData,
      schedule: { ...formData.schedule, days: next },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 top-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
        onClick={closeModals}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative bg-base-100 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
      >
        <div className="bg-primary px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-content/20 rounded-lg">
              <Users className="w-4.5 h-4.5 text-primary-content" />
            </div>
            <h2 className="font-black text-primary-content text-base">
              {editingGroup ? "Guruhni Tahrirlash" : "Yangi Guruh"}
            </h2>
          </div>
          <button
            onClick={closeModals}
            className="p-1.5 hover:bg-primary-content/20 rounded-lg transition-colors text-primary-content"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">
              Guruh nomi *
            </label>
            <input
              value={formData.name || ""}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: null });
              }}
              className={`w-full px-3.5 py-2.5 bg-base-200 border-2 rounded-2xl text-sm font-bold outline-none focus:bg-base-100 transition-all ${errors.name ? "border-error" : "border-transparent focus:border-primary"}`}
              placeholder="Guruh nomi"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">
              O'qituvchi *
            </label>
            <select
              value={formData.teacherId || ""}
              onChange={(e) => {
                setFormData({ ...formData, teacherId: e.target.value });
                setErrors({ ...errors, teacherId: null });
              }}
              disabled={loadingAvailability}
              className={`w-full px-3.5 py-2.5 bg-base-200 border-2 rounded-2xl text-sm font-bold text-base-content outline-none focus:bg-base-100 transition-all ${errors.teacherId ? "border-error" : "border-transparent focus:border-primary"} ${loadingAvailability ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">Tanlang</option>
              {loadingAvailability ? (
                <option disabled>Yuklanmoqda...</option>
              ) : availableTeachers.length === 0 ? (
                <option disabled>Mavjud emas</option>
              ) : (
                availableTeachers.map((i) => (
                  <option
                    key={i.id || i._id}
                    value={i.id || i._id}
                    className="text-base-content"
                  >
                    {i.name}
                  </option>
                ))
              )}
            </select>
            {errors.teacherId && (
              <p className="text-xs text-error mt-1 font-bold">
                {errors.teacherId}
              </p>
            )}
          </div>

          <div className="bg-primary/10 rounded-2xl p-3.5 space-y-3 border border-primary/20">
            <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Dars jadvali
            </p>
            <div>
              <p className="text-xs text-base-content/60 font-medium mb-1.5">
                Dars kunlari
              </p>
              <div className="flex flex-wrap gap-1.5">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      formData.schedule?.days?.includes(day)
                        ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                        : "bg-base-100 text-base-content/60 hover:bg-primary/10 border border-base-300"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TimePicker24
                label="Boshlanish vaqti"
                value={formData.schedule?.fromHour || "09:00"}
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, fromHour: v },
                  })
                }
              />
              <TimePicker24
                label="Tugash vaqti"
                value={formData.schedule?.toHour || "11:00"}
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, toHour: v },
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">
              Xona *
            </label>
            <select
              value={formData.roomId || ""}
              onChange={(e) => {
                setFormData({ ...formData, roomId: e.target.value });
                setErrors({ ...errors, roomId: null });
              }}
              disabled={loadingAvailability}
              className={`w-full px-3.5 py-2.5 bg-base-200 border-2 rounded-2xl text-sm font-bold outline-none focus:bg-base-100 transition-all ${errors.roomId ? "border-error" : "border-transparent focus:border-primary"} ${loadingAvailability ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">Tanlang</option>
              {loadingAvailability ? (
                <option disabled>Yuklanmoqda...</option>
              ) : availableRooms.length === 0 ? (
                <option disabled>Mavjud emas</option>
              ) : (
                availableRooms.map((r) => (
                  <option key={r.id || r._id} value={r.id || r._id}>
                    {r.name} (#{r.number})
                  </option>
                ))
              )}
            </select>
            {errors.roomId && (
              <p className="text-xs text-error mt-1 font-bold">
                {errors.roomId}
              </p>
            )}
          </div>

          <div className="border-t border-base-200 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">
                  Kurs *
                </label>
                <select
                  value={formData.courseId || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, courseId: e.target.value });
                    setErrors({ ...errors, courseId: null });
                  }}
                  className="w-full px-3.5 py-2.5 bg-black/10 border-2 border-black/30 rounded-2xl text-sm font-bold text-base-content outline-none focus:bg-black/20 focus:border-black transition-all"
                >
                  <option value="">Tanlang</option>
                  {courses.map((course) => (
                    <option
                      key={course.id || course._id}
                      value={course.id || course._id}
                    >
                    <span className="truncate font-medium">{course.title || course.name}</span>

                    </option>
                  ))}
                </select>
                {errors.courseId && (
                  <p className="text-xs text-error mt-1 font-bold">
                    {errors.courseId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">
                  Oylik to'lov *
                </label>
                <input
                  type="number"
                  value={formData.monthlyFeePerStudent || ""}
                  placeholder="500000"
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      monthlyFeePerStudent: e.target.value,
                    });
                    setErrors({ ...errors, monthlyFeePerStudent: null });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-base-200 border-2 rounded-2xl text-sm font-bold outline-none focus:bg-base-100 transition-all ${errors.monthlyFeePerStudent ? "border-error" : "border-transparent focus:border-primary"}`}
                />
                {errors.monthlyFeePerStudent && (
                  <p className="text-xs text-error mt-1 font-bold">
                    {errors.monthlyFeePerStudent}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { key: "startDate", label: "Boshlanish *", type: "date" },
                { key: "endDate", label: "Tugash *", type: "date" },
                {
                  key: "maxStudents",
                  label: "Max talaba *",
                  type: "number",
                  placeholder: "20",
                },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={formData[key] || ""}
                    placeholder={placeholder}
                    onChange={(e) => {
                      setFormData({ ...formData, [key]: e.target.value });
                      setErrors({ ...errors, [key]: null });
                    }}
                    className={`w-full px-2.5 py-2.5 bg-base-200 border-2 rounded-2xl text-sm font-bold outline-none focus:bg-base-100 transition-all ${errors[key] ? "border-error" : "border-transparent focus:border-primary"}`}
                  />
                  {errors[key] && (
                    <p className="text-xs text-error mt-1 font-bold">
                      {errors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
              
          

        {Object.keys(errors).length > 0 && (
          <div className="px-6 py-3 bg-error/10 border-t border-error/20">
            <p className="text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Iltimos, barcha maydonlarni
              to'ldiring
            </p>
          </div>
        )}

        <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 shrink-0">
          <button
            onClick={closeModals}
            disabled={isSubmittingGroup}
            className="flex-1 py-3 text-sm font-bold text-base-content/60 bg-base-100 border border-base-300 rounded-2xl hover:bg-base-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bekor
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmittingGroup}
            className="flex-1 py-3 text-sm font-bold text-primary-content bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmittingGroup ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-content border-t-transparent rounded-full animate-spin" />
                Saqlashmoqda...
              </>
            ) : editingGroup ? (
              "✓ Saqlash"
            ) : (
              "Davom etish →"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Room Modal ────────────────────────────────────────────────
function RoomModal({
  roomFormData,
  setRoomFormData,
  editingRoom,
  handleSaveRoom,
  closeModals,
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!roomFormData.name?.trim()) newErrors.name = "Xona nomini kiriting";
    if (!roomFormData.number?.trim()) newErrors.number = "Raqamni kiriting";
    if (!roomFormData.capacity) newErrors.capacity = "Sig'imni kiriting";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) handleSaveRoom();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
        onClick={closeModals}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative bg-base-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <div className="bg-secondary px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-content/20 rounded-xl">
              <Building2 className="w-5 h-5 text-secondary-content" />
            </div>
            <h2 className="font-black text-secondary-content text-lg">
              {editingRoom ? "Xonani Tahrirlash" : "Yangi Xona"}
            </h2>
          </div>
          <button
            onClick={closeModals}
            className="p-2 hover:bg-secondary-content/20 rounded-xl text-secondary-content transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {[
            {
              label: "Xona nomi *",
              key: "name",
              type: "text",
              placeholder: "Asosiy zal",
            },
            {
              label: "Raqami *",
              key: "number",
              type: "text",
              placeholder: "101",
            },
            {
              label: "Sig'imi (kishi) *",
              key: "capacity",
              type: "number",
              placeholder: "20",
            },
            {
              label: "Jihozlar (vergul bilan)",
              key: "equipment",
              type: "text",
              placeholder: "Proyektor, Doska, Kompyuter",
            },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
                {label}
              </label>
              <input
                type={type}
                value={roomFormData[key] || ""}
                placeholder={placeholder}
                onChange={(e) => {
                  setRoomFormData({ ...roomFormData, [key]: e.target.value });
                  setErrors({ ...errors, [key]: null });
                }}
                className={`w-full px-4 py-3 bg-base-200 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-base-100 transition-all ${errors[key] ? "border-error" : "border-transparent focus:border-secondary"}`}
              />
              {errors[key] && (
                <p className="text-xs text-error mt-1 font-medium">
                  {errors[key]}
                </p>
              )}
            </div>
          ))}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="px-6 py-3 bg-error/10 border-t border-error/20">
            <p className="text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Iltimos, barcha maydonlarni
              to'ldiring
            </p>
          </div>
        )}

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={closeModals}
            className="flex-1 py-3 text-sm font-bold text-base-content/60 bg-base-200 rounded-2xl hover:bg-base-300 transition-colors"
          >
            Bekor
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 text-sm font-bold text-secondary-content bg-secondary rounded-2xl shadow-lg shadow-secondary/20 hover:opacity-90 transition-opacity"
          >
            {editingRoom ? "✓ Saqlash" : "+ Yaratish"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────
function DeleteModal({ itemToDelete, deleteType, confirmDelete, closeModals }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
        onClick={closeModals}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative bg-base-100 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center z-10"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-5"
        >
          <AlertTriangle className="w-8 h-8 text-error" />
        </motion.div>
        <h3 className="text-xl font-black text-base-content mb-2">
          O'chirilsinmi?
        </h3>
        <p className="text-base-content/60 text-sm mb-1 font-medium">
          "{itemToDelete?.name}"
        </p>
        <p className="text-base-content/40 text-xs mb-7">
          {deleteType === "group" ? "Guruh" : "Xona"} o'chirilsa qaytarib
          bo'lmaydi.
        </p>
        <div className="flex gap-3">
          <button
            onClick={closeModals}
            className="flex-1 py-3 bg-base-200 rounded-2xl text-sm font-bold text-base-content/70 hover:bg-base-300 transition-colors"
          >
            Yo'q
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 py-3 bg-error text-error-content rounded-2xl text-sm font-bold shadow-lg shadow-error/20 hover:opacity-90 transition-opacity"
          >
            Ha, o'chir
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add Student Modal ─────────────────────────────────────────
function AddStudentModal({ group, onClose, onAdded, existingStudents = [] }) {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAllStudents()
      .then((all) => {
        const groupId = group._id || group.id;
        const filtered = all.filter((student) => {
          const studentId = student._id || student.id;
          // 1. existingStudents orqali tekshirish
          const existsInGroup = existingStudents.some(
            (s) => (s._id || s.id) === studentId,
          );
          if (existsInGroup) return false;

          // 2. student.group orqali tekshirish (agar berilgan bo'lsa)
          if (student.group) {
            const studentGroupId = student.group._id || student.group.id;
            if (studentGroupId === groupId) return false;
          }

          if (student.groupId === groupId) return false;

          if (student.groups && Array.isArray(student.groups)) {
            const inGroup = student.groups.some(
              (g) => (g._id || g.id) === groupId,
            );
            if (inGroup) return false;
          }

          return true;
        });
        setStudents(filtered);
        setFetching(false);
      })
      .catch(() => {
        setErrors({ submit: "Yuklanmadi" });
        setFetching(false);
      });
  }, [group, existingStudents]);

  const validate = () => {
    const newErrors = {};
    if (!selectedId) newErrors.selectedId = "Studentni tanlang";

    // Qo'shimcha: tanlangan o'quvchi allaqachon guruhda yo'qligini tekshirish
    const studentId = selectedId;
    const groupId = group._id || group.id;

    // existingStudents orqali tekshirish
    const alreadyInGroup = existingStudents.some(
      (s) => (s._id || s.id) === studentId,
    );

    if (alreadyInGroup) {
      newErrors.selectedId = "Bu o'quvchi allaqachon bu guruhda";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;

    // Qo'shimcha backend tekshiruvi
    const studentId = selectedId;
    const groupId = group._id || group.id;

    // Agar o'quvchi allaqachon guruhda bo'lsa, qo'shmaslik
    const alreadyInGroup = existingStudents.some(
      (s) => (s._id || s.id) === studentId,
    );

    if (alreadyInGroup) {
      setErrors({ submit: "Bu o'quvchi allaqachon bu guruhda qo'shilgan" });
      return;
    }

    setLoading(true);
    const ok = await addStudentToGroupApi(groupId, studentId);
    if (ok) {
      onAdded();
      onClose();
    } else {
      setErrors({ submit: "Qo'shishda xatolik" });
      setLoading(false);
    }
  };

  const sel = students.find((s) => s._id === selectedId || s.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative bg-base-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <div className="bg-info px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-content/20 rounded-xl">
              <UserPlus className="w-5 h-5 text-info-content" />
            </div>
            <h2 className="font-black text-info-content">Student Qo'shish</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-info-content/20 rounded-xl text-info-content transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-info/10 rounded-2xl px-4 py-3 border border-info/20">
            <p className="font-bold text-info text-sm">{group.name}</p>
            <p className="text-xs text-info/60">
              {group.currentStudents || 0}/{group.maxStudents} talaba
            </p>
          </div>

          {fetching ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-info border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
                  Studentni tanlang *
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setErrors({ ...errors, selectedId: null });
                  }}
                  className={`w-full px-4 py-3 bg-base-200 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-base-100 transition-all ${errors.selectedId ? "border-error" : "border-transparent focus:border-info"}`}
                >
                  <option value="">Tanlang...</option>
                  {students.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name || "Ism yo'q"}{" "}
                      {s.phone ? `— ${formatPhone(s.phone)}` : "(Telefon yo'q)"}
                    </option>
                  ))}
                </select>
                {errors.selectedId && (
                  <p className="text-xs text-error mt-1 font-medium">
                    {errors.selectedId}
                  </p>
                )}
              </div>
              {sel && (
                <div className="bg-base-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/40">Ism</span>
                    <span className="font-bold text-base-content">
                      {sel.name || "Ism yo'q"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/40">Telefon</span>
                    <span className="font-bold text-base-content">
                      {sel.phone ? formatPhone(sel.phone) : "Telefon yo'q"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/40">Balans</span>
                    <span className="font-bold text-base-content">
                      {Number(sel.balance || 0).toLocaleString()} UZS
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {errors.submit && (
          <div className="px-6 py-3 bg-error/10 border-t border-error/20">
            <p className="text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {errors.submit}
            </p>
          </div>
        )}

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-base-content/60 bg-base-200 rounded-2xl hover:bg-base-300 transition-colors"
          >
            Bekor
          </button>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="flex-1 py-3 text-sm font-bold text-info-content bg-info rounded-2xl shadow-lg shadow-info/20 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Qo'shilmoqda..." : "+ Qo'shish"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add Students to New Group Modal ─────────────────────────────
function AddStudentsToNewGroupModal({ group, onClose, onAdded }) {
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (group?.courseId) {
      setFetching(true);
      fetchStudentsForCourse(group.courseId)
        .then((courseStudents) => {
          setStudents(courseStudents);
          setFetching(false);
        })
        .catch(() => {
          setErrors({ fetch: "O'quvchilarni yuklashda xatolik" });
          setFetching(false);
        });
    }
  }, [group?.courseId]);

  const toggleStudentSelection = (studentId) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddAllSelected = async () => {
    if (selectedIds.length === 0) {
      setErrors({ submit: "Kamida bitta o'quvchi tanlang" });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const groupId = group._id || group.id;
      const results = await Promise.all(
        selectedIds.map((studentId) =>
          addStudentToGroupApi(groupId, studentId)
        )
      );

      const allSuccess = results.every((result) => result === true);

      if (allSuccess) {
        onAdded();
        onClose();
      } else {
        setErrors({ submit: "Ba'zi o'quvchilarni qo'shishda xatolik yuz berdi" });
        setLoading(false);
      }
    } catch {
      setErrors({ submit: "Xatolik yuz berdi" });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative bg-base-100 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        <div className="bg-success px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-content/20 rounded-xl">
              <UserPlus className="w-5 h-5 text-success-content" />
            </div>
            <div>
              <h2 className="font-black text-success-content">O'quvchilarni qo'shish</h2>
              <p className="text-xs text-success-content/70">{group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-success-content/20 rounded-xl transition-colors text-success-content"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-success border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-base-content/60">O'quvchilar yuklanmoqda...</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-base-content/20 mx-auto mb-3" />
              <p className="text-base-content/60 font-medium">Bu kursda guruhga biriktirilmagan o'quvchilar yo'q</p>
              <p className="text-xs text-base-content/40 mt-1">Birinchi o'quvchilarni kursga qo'shing</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 bg-base-200 border-b border-base-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-base-content/60">
                    {students.length} ta o'quvchi mavjud
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === students.length && students.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(students.map(s => s._id || s.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="checkbox checkbox-sm checkbox-success"
                    />
                    <span className="text-xs font-bold text-base-content/70">Barchasini tanlash</span>
                  </label>
                </div>
                <span className="text-xs font-bold text-success">
                  {selectedIds.length} ta tanlandi
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-2">
                {students.map((student) => {
                  const studentId = student._id || student.id;
                  const isSelected = selectedIds.includes(studentId);

                  return (
                    <motion.div
                      key={studentId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "bg-success/10 border-success"
                          : "bg-base-100 border-base-200 hover:border-base-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="checkbox checkbox-success">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(studentId)}
                            className="checkbox checkbox-success w-5 h-5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base-content text-sm truncate">
                            {student.name || "Ism yo'q"}
                          </div>
                          <div className="text-xs text-base-content/60 font-medium">
                            {student.phone ? formatPhone(student.phone) : "Telefon yo'q"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-base-content/60 font-medium">
                            Balans
                          </div>
                          <div className={`text-sm font-bold ${
                            Number(student.balance || 0) < 0 ? "text-error" : "text-success"
                          }`}>
                            {Number(student.balance || 0).toLocaleString()} UZS
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-base-200 border-t border-base-300 shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-bold text-base-content/60 bg-base-100 border border-base-300 rounded-2xl hover:bg-base-200 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddAllSelected}
                  disabled={loading || selectedIds.length === 0}
                  className="flex-1 py-3 text-sm font-bold text-success-content bg-success rounded-2xl shadow-lg shadow-success/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-success-content border-t-transparent rounded-full animate-spin" />
                      Qo'shilmoqda...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {selectedIds.length} ta o'quvchini qo'shish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="px-6 py-3 bg-error/10 border-t border-error/20">
            <p className="text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {errors.submit}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main GroupsPage ───────────────────────────────────────────
export default function GroupsPage() {
  const { showToast } = useToast();
  const {
    groups,
    rooms,
    teachers,
    courses,
    loading,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    page,
    setPage,
    itemsPerPage,
    totalPages,
    paginatedGroups,
    paginatedRooms,
    loadGroups,
    loadRooms,
  } = useGroups();

  const {
    showModal,
    showRoomModal,
    showDeleteModal,
    editingGroup,
    editingRoom,
    itemToDelete,
    deleteType,
    formData,
    setFormData,
    roomFormData,
    setRoomFormData,
    openAddGroupModal,
    openEditGroupModal,
    openAddRoomModal,
    openEditRoomModal,
    openDeleteModal,
    closeModals,
  } = useGroupForm(teachers, courses, rooms);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedGroupForStudent, setSelectedGroupForStudent] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentPayments, setStudentPayments] = useState({});
  const [studentAbsences, setStudentAbsences] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({ name: "", phone: "", parentPhone: "" });
  const [savingStudent, setSavingStudent] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [newlyCreatedGroup, setNewlyCreatedGroup] = useState(null);
  const [showNewGroupStudentModal, setShowNewGroupStudentModal] = useState(false);

  // ── Pagination state ──
  const [localPage, setLocalPage] = useState(1);
  const LOCAL_PER_PAGE = 9;

  // ── Computed ──
  const filteredGroups = useMemo(() => [...groups], [groups]);

  const groupStats = useMemo(() => ({
    total:         groups.length,
    active:        groups.filter(g => g.status === "active").length,
    totalStudents: groups.reduce((s, g) => s + (g.currentStudents || g.students?.length || 0), 0),
    totalRevenue:  groups.reduce((s, g) => s + ((g.currentStudents || g.students?.length || 0) * (Number(g.monthlyFeePerStudent) || 0)), 0),
  }), [groups]);

  const donutSegments = useMemo(() => {
    const active   = groups.filter(g => g.status === "active").length;
    const inactive = groups.filter(g => g.status === "inactive").length;
    const other    = groups.length - active - inactive;
    return [
      { label: "Faol",        value: active,   color: "#10b981" },
      { label: "Nofaol",      value: inactive, color: "#f59e0b" },
      { label: "Boshqa",      value: other,    color: "#94a3b8" },
    ].filter(s => s.value > 0);
  }, [groups]);

  const topGroups    = useMemo(() => [...groups].sort((a, b) => (b.currentStudents || b.students?.length || 0) - (a.currentStudents || a.students?.length || 0)).slice(0, 5), [groups]);
  const recentGroups = useMemo(() => [...groups].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5), [groups]);

  const totalLocalPages  = Math.ceil(filteredGroups.length / LOCAL_PER_PAGE);
  const paginatedFiltered = filteredGroups.slice((localPage - 1) * LOCAL_PER_PAGE, localPage * LOCAL_PER_PAGE);

  const handleSaveGroup = async () => {
    setIsSubmittingGroup(true);
    try {
      const result = await saveGroup(editingGroup, formData, showToast);
      if (result.success) {
        const message = editingGroup
          ? "Guruh muvaffaqiyatli yangilandi!"
          : "Guruh muvaffaqiyatli yaratildi!";
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 3000);

        closeModals();
        loadGroups();

        // Yangi guruh yaratilganda — o'quvchi qo'shish modalini oching
        if (!editingGroup) {
          const createdGroup = result.newGroup || { courseId: formData.courseId, name: formData.name };
          setNewlyCreatedGroup(createdGroup);
          setShowNewGroupStudentModal(true);
        }
      }
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleSaveRoom = async () => {
    const ok = await saveRoom(editingRoom, roomFormData);
    if (ok) {
      closeModals();
      loadRooms();
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const ok = await removeItem(itemToDelete, deleteType);
    if (ok) {
      closeModals();
      activeTab === "groups" ? loadGroups() : loadRooms();
    }
  };

  const handleGroupClick = async (group) => {
    if (selectedGroup?.id === group.id || selectedGroup?._id === group._id) {
      setSelectedGroup(null);
      setGroupStudents([]);
      setStudentPayments({});
    } else {
      setSelectedGroup(group);
      setLoadingStudents(true);
      try {
        const res = await getGroupById(group.id || group._id, {
          includeStudents: true,
        });
        const groupData = res.data.data || res.data;

        let students = [];

        // Turli xil ma'lumot formatlarini tekshirish
        if (groupData.students && Array.isArray(groupData.students)) {
          students = groupData.students;
        } else if (
          groupData.studentsData &&
          Array.isArray(groupData.studentsData)
        ) {
          students = groupData.studentsData;
        } else if (
          groupData.studentData &&
          Array.isArray(groupData.studentData)
        ) {
          students = groupData.studentData;
        } else if (
          groupData.studentIds &&
          Array.isArray(groupData.studentIds)
        ) {
          // Agar faqat IDlar bo'lsa, API dan to'liq ma'lumotlarni yuklash
          students = await Promise.all(
            groupData.studentIds.map((id) =>
              getStudentById(id)
                .then((res) => res.data.data || res.data)
                .catch(() => ({
                  id,
                  name: "Noma'lum",
                  phone: "—",
                  balance: 0,
                  role: "student",
                })),
            ),
          );
        } else if (
          groupData.students &&
          typeof groupData.students === "object"
        ) {
          // Agar students obyekt bo'lsa
          students = Object.values(groupData.students);
        }

        // Agar hech narsa topilmasa, local group'dan olishga urinish
        if (students.length === 0 && group.students) {
          students = Array.isArray(group.students)
            ? group.students
            : [group.students];
        }

        setGroupStudents(students);

        // O'quvchilarning to'lov va davomati ma'lumotlarini yuklash
        if (students.length > 0) {
          await Promise.all([
            loadStudentPayments(students),
            loadStudentAbsences(group.id || group._id),
          ]);
        }

      } catch {
        if (group.students) {
          const students = Array.isArray(group.students)
            ? group.students
            : [group.students];
          setGroupStudents(students);
        } else {
          setGroupStudents([]);
        }
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  // O'quvchilarning to'lov ma'lumotlarini yuklash
  const loadStudentPayments = async (students) => {
    try {
      const paymentsRes = await getAllPayments({ limit: 1000 });
      const allPayments =
        paymentsRes.data.payments ||
        paymentsRes.data.data ||
        paymentsRes.data ||
        [];

      // Har bir o'quvchi uchun to'lovlarini guruhlash
      const paymentsByStudent = {};

      students.forEach((student) => {
        const studentId = student._id || student.id;
        const studentPayments = allPayments.filter((payment) => {
          const toWhoId =
            typeof payment.toWho === "object"
              ? payment.toWho._id || payment.toWho.id
              : payment.toWho;
          return toWhoId === studentId;
        });

        // Oxirgi to'lovni topish
        const sortedPayments = studentPayments.sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
        const lastPayment =
          sortedPayments.length > 0 ? sortedPayments[0] : null;

        // Jami to'lovni hisoblash
        const totalPaid = studentPayments.reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0,
        );

        paymentsByStudent[studentId] = {
          lastPayment,
          totalPaid,
          paymentCount: studentPayments.length,
        };
      });

      setStudentPayments(paymentsByStudent);
    } catch {
      setStudentPayments({});
    }
  };

  // Joriy oy davomida qoldirgan darslarni hisoblash
  const loadStudentAbsences = async (groupId) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const res = await getGroupAttendanceCalendar(groupId, { year, month });
      const raw = res.data;
      const counts = {};

      // Format C: { days, students: [{id, attendance: {"6": true/false}}] }
      if (Array.isArray(raw?.students)) {
        raw.students.forEach((s) => {
          let absent = 0;
          Object.values(s.attendance || {}).forEach((v) => {
            if (v === false || v === 'absent') absent++;
          });
          counts[s.id] = absent;
        });
      }
      // Format A: { days: [{date, records:[{studentId, status}]}] }
      else if (Array.isArray(raw?.days) && raw.days[0]?.records) {
        raw.days.forEach((day) => {
          day.records?.forEach((r) => {
            if (r.status === 'absent') {
              counts[r.studentId] = (counts[r.studentId] || 0) + 1;
            }
          });
        });
      }
      // Format B: { calendar: { "date": { studentId: status } } }
      else {
        const calendar = raw?.calendar || raw?.data?.calendar;
        if (calendar) {
          Object.values(calendar).forEach((dayMap) => {
            Object.entries(dayMap).forEach(([sid, status]) => {
              if (status === 'absent' || status === false) {
                counts[sid] = (counts[sid] || 0) + 1;
              }
            });
          });
        }
      }
      setStudentAbsences(counts);
    } catch {
      setStudentAbsences({});
    }
  };

  const handleBack = () => {
    setSelectedGroup(null);
    setGroupStudents([]);
    setStudentPayments({});
    setStudentAbsences({});
  };

  const handleAddStudentSuccess = () => {
    setShowAddStudentModal(false);
    setSelectedGroupForStudent(null);
    loadGroups();
    if (selectedGroup) handleGroupClick(selectedGroup);
  };

  const stripPhone = (raw) => (raw ?? "").replace(/\D/g, "").replace(/^998/, "").slice(0, 9);

  const openEditStudent = (s) => {
    setEditingStudent(s);
    setEditStudentForm({
      name:        s.name || "",
      phone:       stripPhone(s.phone),
      parentPhone: stripPhone(s.parentPhone || s.parent?.phone || s.parentContact),
    });
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    setSavingStudent(true);
    try {
      const payload = {
        ...editStudentForm,
        phone:       stripPhone(editStudentForm.phone),
        parentPhone: stripPhone(editStudentForm.parentPhone),
      };
      await updateStudent(editingStudent._id || editingStudent.id, payload);
      setGroupStudents((prev) =>
        prev.map((s) =>
          (s._id || s.id) === (editingStudent._id || editingStudent.id)
            ? { ...s, ...editStudentForm }
            : s
        )
      );
      showToast("✅ O'quvchi ma'lumotlari yangilandi", "success", 3000);
      setEditingStudent(null);
    } catch (err) {
      showToast("❌ Xatolik yuz berdi", "error", 4000);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!deletingStudent) return;
    const sid = deletingStudent._id || deletingStudent.id;
    try {
      await deleteStudent(sid);
      setGroupStudents((prev) => prev.filter((s) => (s._id || s.id) !== sid));
      showToast("✅ O'quvchi o'chirildi", "success", 3000);
      setDeletingStudent(null);
    } catch {
      showToast("❌ Xatolik yuz berdi", "error", 4000);
    }
  };

  const openAddStudentModal = (group) => {
    setSelectedGroupForStudent(group);
    setShowAddStudentModal(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-base-content">Guruhlar</h1>
          <p className="text-sm text-base-content/50 mt-0.5">O'quv guruhlarini boshqarish</p>
        </div>
        {!selectedGroup && (
          <button
            onClick={activeTab === "groups" ? openAddGroupModal : openAddRoomModal}
            className="px-5 py-2.5 text-sm font-bold text-primary-content bg-primary rounded-2xl shadow-sm flex items-center gap-2 hover:opacity-90 whitespace-nowrap"
          >
            + {activeTab === "groups" ? "Yangi guruh" : "Yangi xona"}
          </button>
        )}
        {selectedGroup && (
          <button
            onClick={handleBack}
            className="px-4 py-2.5 text-sm font-bold text-base-content bg-base-100 border border-base-300 rounded-2xl hover:bg-base-200 flex items-center gap-2"
          >
            ← Barcha guruhlar
          </button>
        )}
      </div>

      {/* ── Stats Row ── */}
      {activeTab === "groups" && !selectedGroup && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Jami guruhlar",    value: groupStats.total,                                    Icon: Users,         color: "bg-violet-100 text-violet-600"  },
            { label: "Faol guruhlar",    value: groupStats.active,                                   Icon: CheckCircle,   color: "bg-emerald-100 text-emerald-600" },
            { label: "Jami o'quvchilar",value: groupStats.totalStudents,                             Icon: GraduationCap, color: "bg-sky-100 text-sky-600"         },
            { label: "Oylik daromad",    value: groupStats.totalRevenue.toLocaleString() + " so'm",  Icon: Wallet,        color: "bg-amber-100 text-amber-600", small: true },
          ].map(({ label, value, Icon, color, small }) => (
            <div key={label} className="bg-base-100 rounded-2xl p-4 shadow-sm border border-base-200 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 font-semibold">{label}</p>
                <p className={`font-black text-base-content truncate ${small ? "text-sm" : "text-xl"}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs + Filters ── */}
      {!selectedGroup && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
          <div className="flex bg-base-200 p-1 rounded-2xl">
            {[
              ["groups", "Guruhlar", Users],
              ["rooms",  "Xonalar",  Building2],
            ].map(([tab, label, Icon]) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); setLocalPage(1); setSelectedGroup(null); setStudentPayments({}); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === tab
                    ? "bg-primary text-primary-content shadow-sm"
                    : "text-base-content/60 hover:text-base-content"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setLocalPage(1); }}
                className="w-44 pl-10 pr-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-sm font-bold outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "groups" ? (
        <>
          {!selectedGroup && (
            <div className="flex gap-5 items-start">
              {/* Cards */}
              <div className="flex-1 min-w-0">
                {filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-8 h-8 text-primary/40" />
                    </div>
                    <p className="text-base-content/60 font-bold mt-3">Guruhlar yo'q</p>
                    <button onClick={openAddGroupModal} className="text-primary text-sm font-bold hover:underline mt-2">
                      + Birinchi guruhni yarating
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {paginatedFiltered.map((group, i) => (
                        <GroupCard
                          key={group.id || group._id}
                          group={group}
                          idx={i}
                          teachers={teachers}
                          courses={courses}
                          rooms={rooms}
                          openEditGroupModal={openEditGroupModal}
                          openDeleteModal={openDeleteModal}
                          onAddStudent={openAddStudentModal}
                          onViewStudents={handleGroupClick}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {totalLocalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-base-100 border border-base-300 rounded-2xl shadow-sm mt-4">
                    <span className="text-xs text-base-content/40">
                      {(localPage - 1) * LOCAL_PER_PAGE + 1}–{Math.min(localPage * LOCAL_PER_PAGE, filteredGroups.length)} / {filteredGroups.length}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setLocalPage(p => Math.max(1, p - 1))} disabled={localPage === 1} className="p-2 border border-base-300 rounded-xl hover:bg-base-200 disabled:opacity-40">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(totalLocalPages, 5) }, (_, i) => i + 1).map(n => (
                        <button key={n} onClick={() => setLocalPage(n)} className={`px-3 py-1.5 rounded-xl border ${localPage === n ? "bg-primary text-primary-content border-primary" : "border-base-300 hover:bg-base-200"}`}>{n}</button>
                      ))}
                      <button onClick={() => setLocalPage(p => Math.min(totalLocalPages, p + 1))} disabled={localPage === totalLocalPages} className="p-2 border border-base-300 rounded-xl hover:bg-base-200 disabled:opacity-40">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sidebar ── */}
              <div className="w-72 shrink-0 hidden xl:flex flex-col gap-4">
                {/* Donut */}
                <div className="bg-base-100 rounded-2xl border border-base-200 p-4 shadow-sm">
                  <h3 className="font-black text-sm text-base-content mb-3 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" /> Holat bo'yicha
                  </h3>
                  <div className="flex items-center gap-4">
                    <DonutChart segments={donutSegments} size={100} />
                    <div className="space-y-2 text-xs font-bold flex-1">
                      {donutSegments.map(s => (
                        <div key={s.label} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                          <span className="text-base-content/70 flex-1">{s.label}</span>
                          <span className="text-base-content font-black">{s.value}</span>
                        </div>
                      ))}
                      {donutSegments.length === 0 && <p className="text-base-content/30 italic">Ma'lumot yo'q</p>}
                    </div>
                  </div>
                </div>

                {/* Top groups */}
                <div className="bg-base-100 rounded-2xl border border-base-200 p-4 shadow-sm">
                  <h3 className="font-black text-sm text-base-content mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Top guruhlar
                  </h3>
                  <div className="space-y-2.5">
                    {topGroups.map((g, i) => {
                      const filled = g.currentStudents || g.students?.length || 0;
                      const max    = g.maxStudents || 1;
                      const pct    = Math.min(100, Math.round((filled / max) * 100));
                      return (
                        <div key={g._id || g.id}>
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] shrink-0">{i + 1}</span>
                            <span className="flex-1 font-bold text-base-content truncate">{g.name}</span>
                            <span className="text-base-content/50 font-semibold shrink-0">{filled}/{max}</span>
                          </div>
                          <div className="w-full h-1 bg-base-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {topGroups.length === 0 && <p className="text-xs text-base-content/30 italic">Guruhlar yo'q</p>}
                  </div>
                </div>

                {/* Recently added */}
                <div className="bg-base-100 rounded-2xl border border-base-200 p-4 shadow-sm">
                  <h3 className="font-black text-sm text-base-content mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Yangi qo'shilgan
                  </h3>
                  <div className="space-y-2">
                    {recentGroups.map(g => (
                      <div key={g._id || g.id} className="flex items-center gap-2.5 text-xs">
                        <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-base-content/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base-content truncate">{g.name}</p>
                          <p className="text-base-content/40 text-[10px]">{g.createdAt ? new Date(g.createdAt).toLocaleDateString("uz-UZ") : "—"}</p>
                        </div>
                      </div>
                    ))}
                    {recentGroups.length === 0 && <p className="text-xs text-base-content/30 italic">Guruhlar yo'q</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedRooms.map((room, i) => (
            <RoomCard
              key={room.id || room._id}
              room={room}
              idx={i}
              openEditRoomModal={openEditRoomModal}
              openDeleteModal={openDeleteModal}
            />
          ))}
        </div>
      )}

      {/* ── FULL-SCREEN STUDENT LIST OVERLAY ── */}
      <AnimatePresence>
        {selectedGroup && activeTab === "groups" && (
          <motion.div
            key="student-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-base-200/98 backdrop-blur-sm flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-2 bg-primary-content/20 hover:bg-primary-content/30 rounded-xl text-primary-content transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="p-2 bg-primary-content/20 rounded-xl">
                  <Users className="w-5 h-5 text-primary-content" />
                </div>
                <div>
                  <h2 className="font-black text-primary-content text-lg leading-tight">{selectedGroup.name}</h2>
                  <p className="text-xs text-primary-content/70 font-bold">{groupStudents.length} ta o'quvchi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddStudentModal(selectedGroup)}
                  className="px-4 py-2 bg-primary-content/20 hover:bg-primary-content/30 rounded-xl text-primary-content text-sm font-bold flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> O'quvchi qo'shish
                </button>
                <button onClick={handleBack} className="p-2 bg-primary-content/20 hover:bg-primary-content/30 rounded-xl text-primary-content">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="px-6 py-2.5 bg-base-100 border-b border-base-200 flex flex-wrap gap-5 text-xs font-bold shrink-0">
              <span className="text-base-content/60">Jami: <span className="text-base-content font-black">{groupStudents.length}</span> ta</span>
              <span className="text-success">✓ {Object.values(studentPayments).filter(p => p.paymentCount > 0).length} ta to'lov qilgan</span>
              <span className="text-error">✗ {Object.values(studentPayments).filter(p => p.paymentCount === 0).length} ta to'lov qilmagan</span>
              <span className="text-base-content/60 ml-auto">Jami to'lov: <span className="text-success font-black">{Object.values(studentPayments).reduce((s, p) => s + p.totalPaid, 0).toLocaleString("uz-UZ")} so'm</span></span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {loadingStudents ? (
                <div className="flex justify-center py-32">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : groupStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-base-content/40">
                  <Users className="w-20 h-20 text-base-content/20" />
                  <p className="font-bold mt-4 text-lg">Bu guruhda hali o'quvchilar yo'q</p>
                  <button
                    onClick={() => openAddStudentModal(selectedGroup)}
                    className="mt-4 px-6 py-3 bg-primary hover:opacity-90 text-primary-content rounded-2xl text-sm font-bold flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Birinchi o'quvchini qo'shing
                  </button>
                </div>
              ) : (
                <div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-base-200 border-b border-base-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/60">#</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/60">O'quvchi</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/60">Telefon</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/60">Ota-onasi</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-base-content/60">Balans</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-base-content/60">Dars qoldirgan</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/60">Oxirgi to'lov</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/60">Summa</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/60">Holat</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-base-content/60">Amallar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStudents.map((s, i) => {
                          const studentId = s._id || s.id;
                          const paymentData = studentPayments[studentId];
                          const lastPayment = paymentData?.lastPayment;
                          const paymentCount = paymentData?.paymentCount || 0;
                          const absent = studentAbsences[studentId] || 0;
                          return (
                            <tr key={studentId || i} className="border-b border-base-200 hover:bg-primary/5">
                              <td className="px-4 py-3.5 text-base-content/50 text-xs font-bold">{i + 1}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                    {s.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                                  </div>
                                  <div className="font-bold text-base-content">{s.name}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-xs font-bold text-base-content/70">{formatPhone(s.phone)}</td>
                              <td className="px-4 py-3.5 text-xs font-bold text-base-content/70">{formatPhone(s.parentPhone || s.parent?.phone || s.parentContact)}</td>
                              <td className="px-4 py-3.5 text-right text-xs font-bold">
                                <span className={Number(s.balance || 0) < 0 ? "text-error" : Number(s.balance || 0) > 0 ? "text-success" : "text-base-content/40"}>
                                  {Number(s.balance || 0).toLocaleString()} UZS
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {absent > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-bold">
                                    <XCircle className="w-3 h-3" />{absent} ta
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-bold">
                                    <CheckCircle className="w-3 h-3" />0
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-xs font-bold text-base-content/70">
                                {lastPayment ? (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-base-content/40" />
                                    {new Date(lastPayment.date).toLocaleDateString("uz-UZ")}
                                  </div>
                                ) : <span className="text-base-content/30">—</span>}
                              </td>
                              <td className="px-4 py-3.5">
                                {lastPayment ? (
                                  <div className="flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5 text-success" />
                                    <span className="font-bold text-success text-xs">{Number(lastPayment.amount).toLocaleString("uz-UZ")} <span className="text-base-content/50">so'm</span></span>
                                  </div>
                                ) : <span className="text-base-content/30 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3.5">
                                {paymentCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-success"><CheckCircle className="w-3.5 h-3.5" />{paymentCount} ta</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-error"><XCircle className="w-3.5 h-3.5" />Yo'q</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditStudent(s)}
                                    className="p-1.5 rounded-lg bg-info/10 hover:bg-info/20 text-info transition-colors"
                                    title="Tahrirlash"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingStudent(s)}
                                    className="p-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors"
                                    title="O'quvchini o'chirish"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EDIT STUDENT MODAL ── */}
      <AnimatePresence>
        {editingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditingStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-base-content">O'quvchini tahrirlash</h3>
                <button onClick={() => setEditingStudent(null)} className="btn btn-ghost btn-sm btn-square"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Ism", key: "name", placeholder: "To'liq ism" },
                  { label: "Telefon", key: "phone", placeholder: "+998 90 123 45 67" },
                  { label: "Ota-ona telefoni", key: "parentPhone", placeholder: "+998 90 123 45 67" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={editStudentForm[key]}
                      onChange={e => setEditStudentForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 bg-base-200 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:border-primary focus:bg-base-100 transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingStudent(null)} className="flex-1 btn btn-ghost rounded-xl border border-base-200">Bekor qilish</button>
                <button onClick={handleSaveStudent} disabled={savingStudent} className="flex-1 btn btn-primary rounded-xl">
                  {savingStudent ? <span className="loading loading-spinner loading-xs" /> : "Saqlash"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE STUDENT CONFIRM MODAL ── */}
      <AnimatePresence>
        {deletingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setDeletingStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center gap-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              <div className="text-center">
                <h3 className="font-black text-lg text-base-content mb-1">O'chirishni tasdiqlang</h3>
                <p className="text-sm text-base-content/60"><span className="font-bold text-base-content">{deletingStudent.name}</span> ni butunlay o'chirasizmi?</p>
                <p className="text-xs text-error/70 mt-1">Bu amal qaytarilmaydi.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeletingStudent(null)} className="flex-1 btn btn-ghost rounded-xl border border-base-200">Bekor qilish</button>
                <button onClick={handleRemoveStudent} className="flex-1 btn btn-error rounded-xl text-white">O'chirish</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showModal && (
          <GroupModal
            formData={formData}
            setFormData={setFormData}
            teachers={teachers}
            courses={courses}
            rooms={rooms}
            editingGroup={editingGroup}
            handleSaveGroup={handleSaveGroup}
            closeModals={closeModals}
            isSubmittingGroup={isSubmittingGroup}
          />
        )}
        {showRoomModal && (
          <RoomModal
            roomFormData={roomFormData}
            setRoomFormData={setRoomFormData}
            editingRoom={editingRoom}
            handleSaveRoom={handleSaveRoom}
            closeModals={closeModals}
          />
        )}
        {showDeleteModal && (
          <DeleteModal
            itemToDelete={itemToDelete}
            deleteType={deleteType}
            confirmDelete={confirmDelete}
            closeModals={closeModals}
          />
        )}
        {showAddStudentModal && selectedGroupForStudent && (
          <AddStudentModal
            group={selectedGroupForStudent}
            onClose={() => setShowAddStudentModal(false)}
            onAdded={handleAddStudentSuccess}
            existingStudents={groupStudents}
          />
        )}
        {showNewGroupStudentModal && newlyCreatedGroup && (
          <AddStudentsToNewGroupModal
            group={newlyCreatedGroup}
            onClose={() => {
              setShowNewGroupStudentModal(false);
              setNewlyCreatedGroup(null);
            }}
            onAdded={() => {
              loadGroups();
              setShowNewGroupStudentModal(false);
              setNewlyCreatedGroup(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Success Message Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-success text-success-content px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle className="w-6 h-6" />
            <span className="font-bold">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
