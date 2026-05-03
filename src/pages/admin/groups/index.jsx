import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { getGroupById, getFreeRooms } from "../../../api/groups";
import { getAvailableTeachers } from "../../../api/teachers";
import { getAllPayments } from "../../../api/payments";
import { getStudentById } from "../../../api/students";

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

// ── Group Card ────────────────────────────────────────────────
const COLORS = [
  { bg: "bg-primary/10", text: "text-primary", bar: "bg-primary" },
  { bg: "bg-secondary/10", text: "text-secondary", bar: "bg-secondary" },
  { bg: "bg-accent/10", text: "text-accent", bar: "bg-accent" },
  { bg: "bg-info/10", text: "text-info", bar: "bg-info" },
  { bg: "bg-success/10", text: "text-success", bar: "bg-success" },
  { bg: "bg-warning/10", text: "text-warning", bar: "bg-warning" },
];

function GroupCard({
  group,
  idx,
  teachers,
  courses,
  rooms,
  openEditGroupModal,
  openDeleteModal,
  onAddStudent,
  onViewStudents,
  page,
  itemsPerPage,
}) {
  const col = COLORS[idx % COLORS.length];
  const course = courses.find((c) => c.id === group.courseId);
  const teacher = teachers.find((t) => t.id === group.teacherId);
  const room = rooms.find((r) => r.id === group.roomId);
  const students = group.students || [];
  const filled = group.currentStudents || students.length || 0;
  const max = group.maxStudents || 1;
  const pct = Math.min(100, Math.round((filled / max) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        delay: idx * 0.03,
        type: "spring",
        stiffness: 300,
        damping: 24,
      }}
      className="bg-base-100 rounded-xl border border-base-300 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onViewStudents(group)}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg ${col.bg} flex items-center justify-center shrink-0`}
            >
              <Users className={`w-4 h-4 ${col.text}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base-content text-sm truncate">
                {group.name}
              </h3>
              <span className="text-[10px] font-medium text-base-content/40 font-mono">
                #{(page - 1) * itemsPerPage + idx + 1}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${group.status === "active" ? "bg-success/10 text-success" : "bg-base-200 text-base-content/40"}`}
          >
            {group.status === "active" ? "● Faol" : "○ Nofaol"}
          </span>
        </div>

        <div className="space-y-0.5 mb-2 text-xs text-base-content/70">
          {course && (
            <div className="flex items-center gap-1.5 truncate">
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="truncate font-medium">{course.title || course.name}</span>


            </div>
          )}
          {teacher && (
            <div className="flex items-center gap-1.5 truncate">
              <GraduationCap className="w-3 h-3 shrink-0" />
              <span className="truncate font-medium">{teacher.name}</span>
            </div>
          )}
          {room && (
            <div className="flex items-center gap-1.5 truncate">
              <DoorOpen className="w-3 h-3 shrink-0" />
              <span className="truncate font-medium">{room.name}</span>
            </div>
          )}
          {group.schedule?.days?.length > 0 && (
            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="font-medium">
                {group.schedule.days.slice(0, 3).join(", ")} ·{" "}
                {group.schedule.fromHour}–{group.schedule.toHour}
              </span>
            </div>
          )}
        </div>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-bold text-base-content/50 flex items-center gap-1">
              <Users2 className="w-3 h-3" /> Talabalar
            </span>
            <span className="text-[10px] font-black text-base-content">
              {filled}/{max}
            </span>
          </div>
          <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${col.bar} transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div
          className={`${col.bg} rounded-lg px-2.5 py-1.5 mb-2 flex items-center justify-between`}
        >
          <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider flex items-center gap-1">
            <Wallet className="w-3 h-3" /> To'lov
          </span>
          <span className={`text-xs font-bold ${col.text}`}>
            {Number(group.monthlyFeePerStudent).toLocaleString()}{" "}
            <span className="text-[10px] text-base-content/50">so'm</span>
          </span>
        </div>

        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditGroupModal(group)}
            className="flex-1 py-1.5 text-[10px] font-bold text-base-content/70 bg-base-200 hover:bg-base-300 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Edit3 className="w-3 h-3" /> Tahrirlash
          </button>
          <button
            onClick={() => onAddStudent(group)}
            className="flex-1 py-1.5 text-[10px] font-bold text-base-content/70 bg-base-200 hover:bg-base-300 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <UserPlus className="w-3 h-3" /> Qo'shish
          </button>
          <button
            onClick={() => openDeleteModal(group, "group")}
            className="px-2.5 py-1.5 text-base-content/40 bg-base-200 hover:bg-error/10 hover:text-error rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
      transition={{ delay: idx * 0.04 }}
      className="bg-base-100 rounded-2xl border border-base-300 p-5 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h3 className="font-bold text-base-content">{room.name}</h3>
          <span className="text-xs font-bold text-base-content/50 font-mono flex items-center gap-1">
            <MapPin className="w-3 h-3" /> #{room.number}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-secondary/10 rounded-xl">
        <Users className="w-4 h-4 text-secondary" />
        <span className="text-sm font-bold text-secondary">
          {room.capacity} kishi
        </span>
      </div>
      {room.equipment?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {room.equipment.slice(0, 4).map((eq, i) => (
            <span
              key={i}
              className="text-[11px] bg-base-200 text-base-content/70 px-2 py-0.5 rounded-lg font-bold"
            >
              {eq}
            </span>
          ))}
          {room.equipment.length > 4 && (
            <span className="text-[11px] bg-base-200 text-base-content/50 px-2 py-0.5 rounded-lg font-bold">
              +{room.equipment.length - 4}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => openEditRoomModal(room)}
          className="flex-1 py-2 text-xs font-bold text-base-content/70 bg-base-200 hover:bg-base-300 rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          <Edit3 className="w-3 h-3" /> Tahrirlash
        </button>
        <button
          onClick={() => openDeleteModal(room, "room")}
          className="px-3 py-2 text-xs font-bold text-base-content/40 bg-base-200 hover:bg-error/10 hover:text-error rounded-xl transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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
          console.error("Availability check failed:", err);
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
              "+ Yaratish"
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
        console.log("Barcha o'quvchilar:", all);

        // Guruh ID ni aniqlash
        const groupId = group._id || group.id;

        // Allaqachon bu guruhga qo'shilgan o'quvchilarni exclude qilish
        const filtered = all.filter((student) => {
          const studentId = student._id || student.id;

          console.log("Studentni tekshirish:", student.name, studentId);

          // 1. existingStudents orqali tekshirish (agar berilgan bo'lsa)
          const existsInGroup = existingStudents.some(
            (s) => (s._id || s.id) === studentId,
          );
          if (existsInGroup) return false;

          // 2. student.group orqali tekshirish
          if (student.group) {
            const studentGroupId = student.group._id || student.group.id;
            if (studentGroupId === groupId) return false;
          }

          // 3. student.groupId orqali tekshirish
          if (student.groupId === groupId) return false;

          // 4. student.groups orqali tekshirish (agar o'quvchi bir nechta guruhda bo'lishi mumkin bo'lsa)
          if (student.groups && Array.isArray(student.groups)) {
            const inGroup = student.groups.some(
              (g) => (g._id || g.id) === groupId,
            );
            if (inGroup) return false;
          }

          return true;
        });

        console.log(
          "Guruhga qo'shish mumkin bo'lgan o'quvchilar:",
          filtered.length,
        );
        console.log("Filter qilingan o'quvchilar:", filtered);
        setStudents(filtered);
        setFetching(false);
      })
      .catch((err) => {
        console.error("O'quvchilarni yuklash xatolik:", err);
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
                      {s.phone ? `— ${s.phone}` : "(Telefon yo'q)"}
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
                      {sel.phone || "Telefon yo'q"}
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
          console.log("Kursga yozilgan o'quvchilar:", courseStudents);
          setStudents(courseStudents);
          setFetching(false);
        })
        .catch((err) => {
          console.error("Kurs uchun studentlarni yuklash xatolik:", err);
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
    } catch (err) {
      console.error("O'quvchilarni qo'shish xatolik:", err);
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
              <div className="flex items-center justify-between text-xs font-bold text-base-content/60">
                <span>
                  {students.length} ta o'quvchi mavjud
                </span>
                <span>
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
                    <motion.button
                      key={studentId}
                      type="button"
                      onClick={() => toggleStudentSelection(studentId)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "bg-success/10 border-success"
                          : "bg-base-100 border-base-200 hover:border-base-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "bg-success border-success text-white" : "border-base-300"
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base-content text-sm truncate">
                            {student.name || "Ism yo'q"}
                          </div>
                          <div className="text-xs text-base-content/60 font-medium">
                            {student.phone || "Telefon yo'q"}
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
                    </motion.button>
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
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [newlyCreatedGroup, setNewlyCreatedGroup] = useState(null);
  const [showNewGroupStudentModal, setShowNewGroupStudentModal] = useState(false);

  const handleSaveGroup = async () => {
    setIsSubmittingGroup(true);
    try {
      const ok = await saveGroup(editingGroup, formData);
      if (ok) {
        const message = editingGroup
          ? "Guruh muvaffaqiyatli yangilandi!"
          : "Guruh muvaffaqiyatli yaratildi!";
        setSuccessMessage(message);

        // Success message ni 3 sekund ko'rsatish
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);

        closeModals();
        loadGroups();

        // If creating a new group, open modal to add students
        if (!editingGroup && formData.courseId) {
          // Find the newly created group
          setTimeout(async () => {
            const updatedGroups = await loadGroups();
            const newGroup = groups.find(g => g.courseId === formData.courseId && g.name === formData.name);
            if (newGroup) {
              setNewlyCreatedGroup(newGroup);
              setShowNewGroupStudentModal(true);
            }
          }, 500);
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
        console.log("Guruh ID:", group.id || group._id);
        console.log("Guruhdan o'quvchilarni yuklash...");

        const res = await getGroupById(group.id || group._id, {
          includeStudents: true,
        });
        console.log("Backend response:", res.data);

        const groupData = res.data.data || res.data;
        console.log("Group data:", groupData);

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

        console.log("Yuklangan o'quvchilar:", students);
        setGroupStudents(students);

        // O'quvchilarning to'lov ma'lumotlarini yuklash
        if (students.length > 0) {
          await loadStudentPayments(students);
        }

        if (students.length === 0) {
          console.warn("O'quvchilar topilmadi. Group data:", groupData);
        }
      } catch (err) {
        console.error("O'quvchilarni yuklashda xatolik:", err);
        console.error("Error response:", err.response?.data);

        // Xatolik bo'lsa, local data'dan olishga urinish
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
    } catch (err) {
      console.error("To'lovlarni yuklashda xatolik:", err);
      setStudentPayments({});
    }
  };

  const handleBack = () => {
    setSelectedGroup(null);
    setGroupStudents([]);
    setStudentPayments({});
  };

  const handleAddStudentSuccess = () => {
    setShowAddStudentModal(false);
    setSelectedGroupForStudent(null);
    loadGroups();
    if (selectedGroup) handleGroupClick(selectedGroup);
  };

  const openAddStudentModal = (group) => {
    setSelectedGroupForStudent(group);
    setShowAddStudentModal(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Tablar va Qidiruv */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex bg-base-200 p-1 rounded-2xl">
          {[
            ["groups", "Guruhlar", Users],
            ["rooms", "Xonalar", Building2],
          ].map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
                setSelectedGroup(null);
                setStudentPayments({});
              }}
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

        {!selectedGroup && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-sm font-bold outline-none focus:border-primary w-56"
              />
            </div>
            <button
              onClick={
                activeTab === "groups" ? openAddGroupModal : openAddRoomModal
              }
              className="px-4 py-2.5 text-sm font-bold text-primary-content bg-primary rounded-2xl shadow-sm flex items-center gap-2 hover:opacity-90"
            >
              + {activeTab === "groups" ? "Guruh" : "Xona"}
            </button>
          </div>
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

      {/* ASOSIY KONTENT */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "groups" ? (
        <>
          {!selectedGroup ? (
            <>
              {paginatedGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary/40" />
                  </div>
                  <p className="text-base-content/60 font-bold mt-3">
                    Guruhlar yo'q
                  </p>
                  <button
                    onClick={openAddGroupModal}
                    className="text-primary text-sm font-bold hover:underline mt-2"
                  >
                    + Birinchi guruhni yarating
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {paginatedGroups.map((group, i) => (
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
                        page={page}
                        itemsPerPage={itemsPerPage}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-base-100 border border-base-300 rounded-2xl shadow-sm">
                  <span className="text-xs text-base-content/40">
                    {(page - 1) * itemsPerPage + 1}–
                    {Math.min(page * itemsPerPage, groups.length)} /{" "}
                    {groups.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 border border-base-300 rounded-xl hover:bg-base-200 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from(
                      { length: Math.min(totalPages, 5) },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`px-3 py-1.5 rounded-xl border ${page === n ? "bg-primary text-primary-content border-primary" : "border-base-300 hover:bg-base-200"}`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="p-2 border border-base-300 rounded-xl hover:bg-base-200 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-lg"
            >
              <div className="bg-primary px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary-content/20 rounded-xl">
                      <Users className="w-6 h-6 text-primary-content" />
                    </div>
                    <div>
                      <h3 className="font-black text-primary-content text-xl">
                        {selectedGroup.name}
                      </h3>
                      <p className="text-sm text-primary-content/70 font-bold">
                        {groupStudents.length} ta o'quvchi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openAddStudentModal(selectedGroup)}
                    className="px-4 py-2 bg-primary-content/20 hover:bg-primary-content/30 rounded-xl text-primary-content text-sm font-bold flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> O'quvchi qo'shish
                  </button>
                </div>
              </div>
              {loadingStudents ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : groupStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-base-content/40">
                  <Users className="w-16 h-16 text-base-content/20" />
                  <p className="font-bold mt-3">
                    Bu guruhda hali o'quvchilar yo'q
                  </p>
                  <button
                    onClick={() => openAddStudentModal(selectedGroup)}
                    className="mt-3 px-5 py-2.5 bg-primary hover:opacity-90 text-primary-content rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Birinchi o'quvchini
                    qo'shing
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-base-200 border-b border-base-300">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/70">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/70">
                          O'quvchi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/70">
                          Telefon
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/70">
                          Qo'shilgan sana
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/70">
                          Oxirgi to'lov sanasi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/70">
                          Oxirgi to'lov summasi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-base-content/70">
                          To'lov holati
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupStudents.map((s, i) => {
                        const studentId = s._id || s.id;
                        const paymentData = studentPayments[studentId];
                        const lastPayment = paymentData?.lastPayment;
                        const totalPaid = paymentData?.totalPaid || 0;
                        const paymentCount = paymentData?.paymentCount || 0;

                        return (
                          <tr
                            key={studentId || i}
                            className="border-b border-base-200 hover:bg-primary/5"
                          >
                            <td className="px-4 py-3.5 text-base-content/50 text-xs font-bold">
                              {i + 1}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                  {s.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2) || "??"}
                                </div>
                                <div>
                                  <div className="font-bold text-base-content">
                                    {s.name}
                                  </div>
                                  <div className="text-xs font-bold text-base-content/50">
                                    {s.role || "student"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-base-content/70 text-xs font-bold">
                              {s.phone || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-base-content/50 text-xs font-bold">
                              {s.createdAt
                                ? new Date(s.createdAt).toLocaleDateString(
                                    "uz-UZ",
                                  )
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-base-content/70 text-xs font-bold">
                              {lastPayment ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-base-content/40" />
                                  <span className="font-bold">
                                    {new Date(
                                      lastPayment.date,
                                    ).toLocaleDateString("uz-UZ")}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-base-content/30 font-bold">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {lastPayment ? (
                                <div className="flex items-center gap-2">
                                  <Wallet className="w-3.5 h-3.5 text-success" />
                                  <span className="font-bold text-success">
                                    {Number(lastPayment.amount).toLocaleString(
                                      "uz-UZ",
                                    )}{" "}
                                    <span className="text-xs font-bold text-base-content/50">
                                      so'm
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-base-content/30 font-bold">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {paymentCount > 0 ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-success" />
                                  <span className="text-xs font-bold text-success">
                                    {paymentCount} ta to'lov
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-4 h-4 text-error" />
                                  <span className="text-xs font-bold text-error">
                                    To'lov yo'q
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 bg-base-200 border-t border-base-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-wrap gap-4">
                        <span className="text-xs font-bold text-base-content/60">
                          Jami:{" "}
                          <span className="text-base-content font-black">
                            {groupStudents.length}
                          </span>{" "}
                          ta o'quvchi
                        </span>
                        <span className="text-xs font-bold text-success">
                          ✓{" "}
                          {
                            Object.values(studentPayments).filter(
                              (p) => p.paymentCount > 0,
                            ).length
                          }{" "}
                          ta to'lov qilgan
                        </span>
                        <span className="text-xs font-bold text-error">
                          ✗{" "}
                          {
                            Object.values(studentPayments).filter(
                              (p) => p.paymentCount === 0,
                            ).length
                          }{" "}
                          ta to'lov qilmagan
                        </span>
                      </div>
                      <div className="text-xs font-bold text-base-content/60">
                        Jami to'lov:{" "}
                        <span className="font-black text-success">
                          {Object.values(studentPayments)
                            .reduce((sum, p) => sum + p.totalPaid, 0)
                            .toLocaleString("uz-UZ")}{" "}
                          so'm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
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
