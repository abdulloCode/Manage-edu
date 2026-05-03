import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  BookOpen,
  Clock,
  X,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Users,
  ChevronRight,
  Zap,
  CheckCircle,
} from "lucide-react";
import {
  useAdminCourses,
  useAdminCourseForm,
  saveAdminCourse,
  deleteAdminCourse,
} from "./hooks";

const COLORS = [
  { bg: "bg-primary", light: "bg-primary/10", text: "text-primary" },
  { bg: "bg-secondary", light: "bg-secondary/10", text: "text-secondary" },
  { bg: "bg-accent", light: "bg-accent/10", text: "text-accent" },
  { bg: "bg-info", light: "bg-info/10", text: "text-info" },
  { bg: "bg-success", light: "bg-success/10", text: "text-success" },
  { bg: "bg-warning", light: "bg-warning/10", text: "text-warning" },
];

function CourseCard({ course, index, onEdit, onDelete }) {
  const col = COLORS[index % COLORS.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{
        delay: index * 0.03,
        type: "spring",
        stiffness: 300,
        damping: 24,
      }}
      className="group relative bg-base-100 rounded-xl overflow-hidden border border-base-300 hover:shadow-lg transition-all duration-200"
    >
      {/* Header */}
      <div className={`relative ${col.bg} p-3 overflow-hidden`}>
        <div className="relative flex justify-between items-start">
          <div className="p-1.5 bg-primary-content/20 rounded-lg">
            <BookOpen className="w-4 h-4 text-primary-content" />
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => onEdit(course)}
              className="p-1.5 bg-primary-content/20 hover:bg-primary-content/30 rounded-lg text-primary-content transition-colors font-bold"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(course)}
              className="p-1.5 bg-error text-error-content hover:bg-red-50 rounded-lg text-error-content transition-colors font-bold"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="mt-2">
          <h3 className="font-bold text-primary-content text-sm leading-tight line-clamp-1 uppercase tracking-tight">
            {course.name || course.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-base-content/60 text-xs font-medium leading-relaxed line-clamp-2 mb-2 min-h-[2rem]">
          {course.description || "Tavsif yo'q"}
        </p>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 px-2 py-1 ${col.light} rounded-lg`}>
            <Clock className={`w-3 h-3 ${col.text}`} />
            <span className="text-[10px] font-bold text-base-content">
              {course.duration || "—"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-base-content/50">Narxi</div>
            <div className="text-sm font-bold text-base-content">
              {Number(course.price || 0).toLocaleString()}
              <span className="text-[10px] font-bold text-base-content/50 ml-1">UZS</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatsBar({ courses }) {
  const total = courses.length;
  const avgPrice = total
    ? Math.round(courses.reduce((s, c) => s + Number(c.price || 0), 0) / total)
    : 0;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        {
          label: "Jami kurslar",
          value: total,
          icon: GraduationCap,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: "O'rtacha narx",
          value: avgPrice.toLocaleString() + " UZS",
          icon: TrendingUp,
          color: "text-success",
          bg: "bg-success/10",
        },
        {
          label: "Faol",
          value: total,
          icon: Zap,
          color: "text-warning",
          bg: "bg-warning/10",
        },
      ].map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-base-100 rounded-2xl p-4 border border-base-300 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className={`p-2.5 ${stat.bg} rounded-xl`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">
              {stat.label}
            </div>
            <div className="text-base font-bold text-base-content">
              {stat.value}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CourseModal({
  show,
  onClose,
  editingCourse,
  formData,
  setFormData,
  onSave,
  isSubmitting,
}) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative bg-base-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Modal Header */}
            <div className="bg-primary px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-content/20 rounded-xl">
                    <Sparkles className="w-4 h-4 text-primary-content" />
                  </div>
                  <h2 className="font-black text-primary-content text-lg">
                    {editingCourse ? "Kursni Tahrirlash" : "Yangi Kurs"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-primary-content/20 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-primary-content" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
                  Kurs Nomi
                </label>
                <input
                  className="w-full px-4 py-3 bg-base-200 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-primary focus:bg-base-100 transition-all placeholder:text-base-content/40"
                  placeholder="Masalan: Full-Stack Web Development"
                  value={formData.name || formData.title || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
                    Narxi (UZS)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-base-200 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-primary focus:bg-base-100 transition-all placeholder:text-base-content/40"
                    placeholder="800000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
                    Davomiyligi
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-base-200 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-primary focus:bg-base-100 transition-all placeholder:text-base-content/40"
                    placeholder="6 oy"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
                  Tavsif
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-base-200 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-primary focus:bg-base-100 transition-all resize-none h-24 placeholder:text-base-content/40"
                  placeholder="Kurs haqida qisqacha..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-base-content/60 bg-base-200 hover:bg-base-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bekor
              </button>
              <button
                onClick={onSave}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-primary-content bg-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-content border-t-transparent rounded-full animate-spin" />
                    Saqlashmoqda...
                  </>
                ) : (
                  <>
                    {editingCourse ? "Saqlash" : "Yaratish"}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DeleteModal({ show, course, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative bg-base-100 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl z-10"
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
            <p className="text-base-content/40 text-sm mb-2 font-medium">
              <span className="font-bold text-base-content">
                "{course?.name || course?.title}"
              </span>
            </p>
            <p className="text-base-content/40 text-xs mb-7">
              Bu amalni ortga qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-base-200 rounded-2xl text-sm font-bold text-base-content/70 hover:bg-base-300 transition-colors"
              >
                Yo'q
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-error text-error-content rounded-2xl text-sm font-bold shadow-lg shadow-error/20 hover:opacity-90 transition-opacity"
              >
                Ha, o'chir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function CoursesPage() {
  const { courses, loading, search, setSearch, loadCourses } =
    useAdminCourses();
  const {
    showModal,
    showDeleteModal,
    editingCourse,
    courseToDelete,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
  } = useAdminCourseForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const success = await saveAdminCourse(
        editingCourse,
        formData,
        loadCourses,
      );
      if (success) {
        const message = editingCourse
          ? "Kurs muvaffaqiyatli yangilandi!"
          : "Kurs muvaffaqiyatli yaratildi!";
        setSuccessMessage(message);

        // Success message ni 3 sekund ko'rsatish
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);

        closeModals();
        loadCourses();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const success = await deleteAdminCourse(courseToDelete, loadCourses);
    if (success) {
      closeModals();
      loadCourses();
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary rounded-xl">
              <GraduationCap className="w-5 h-5 text-primary-content" />
            </div>
            <h1 className="text-2xl font-black text-base-content tracking-tight">
              Kurslar Boshqaruvi
            </h1>
          </div>
          <p className="text-base-content/60 text-sm font-bold ml-1">
            Coding Club IT markazi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="pl-10 pr-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all w-52 font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-content rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Yangi Kurs
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <StatsBar courses={courses} />

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-base-content/40 text-sm font-medium">
              Kurslar yuklanmoqda...
            </p>
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="p-5 bg-primary/10 rounded-3xl">
              <BookOpen className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-base-content/60 font-bold">
              Hech qanday kurs topilmadi
            </p>
            <button
              onClick={openAddModal}
              className="text-primary text-sm font-bold hover:underline"
            >
              + Birinchi kursni yarating
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {courses.map((course, i) => (
                <CourseCard
                  key={course._id || course.id}
                  course={course}
                  index={i}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CourseModal
        show={showModal}
        onClose={closeModals}
        editingCourse={editingCourse}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      <DeleteModal
        show={showDeleteModal}
        course={courseToDelete}
        onClose={closeModals}
        onConfirm={handleDelete}
      />

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
