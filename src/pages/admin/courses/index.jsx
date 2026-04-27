import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit3, Trash2, BookOpen,
  Clock, X, AlertTriangle, Sparkles, GraduationCap,
  TrendingUp, Users, ChevronRight, Zap
} from 'lucide-react';
import { useAdminCourses, useAdminCourseForm, saveAdminCourse, deleteAdminCourse } from './hooks';

const GRADIENTS = [
  'from-violet-600 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-purple-600 to-pink-600',
];

const BG_PATTERNS = [
  'bg-violet-50',
  'bg-rose-50',
  'bg-amber-50',
  'bg-emerald-50',
  'bg-sky-50',
  'bg-purple-50',
];

function CourseCard({ course, index, onEdit, onDelete }) {
  const grad = GRADIENTS[index % GRADIENTS.length];
  const bg = BG_PATTERNS[index % BG_PATTERNS.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-transparent hover:shadow-2xl transition-all duration-300"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Gradient Header */}
      <div className={`relative bg-gradient-to-br ${grad} p-6 overflow-hidden`}>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-2 w-16 h-16 bg-white/10 rounded-full" />
        <div className="relative flex justify-between items-start">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => onEdit(course)}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(course)}
              className="p-2 bg-white/20 hover:bg-red-400/60 backdrop-blur-sm rounded-xl text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-black text-white text-lg leading-tight line-clamp-1 uppercase tracking-tight">
            {course.name || course.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4 min-h-[2rem]">
          {course.description || "Tavsif yo'q"}
        </p>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${bg} rounded-lg`}>
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600">{course.duration || '—'}</span>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">Narxi</div>
            <div className="text-base font-black text-slate-900">
              {Number(course.price || 0).toLocaleString()}
              <span className="text-[10px] font-medium text-slate-400 ml-1">UZS</span>
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
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: "Jami kurslar", value: total, icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "O'rtacha narx", value: avgPrice.toLocaleString() + " UZS", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Faol", value: total, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
      ].map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className={`p-2.5 ${stat.bg} rounded-xl`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
            <div className="text-base font-black text-slate-800">{stat.value}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CourseModal({ show, onClose, editingCourse, formData, setFormData, onSave }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-black text-white text-lg">
                    {editingCourse ? 'Kursni Tahrirlash' : 'Yangi Kurs'}
                  </h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Kurs Nomi
                </label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="Masalan: Full-Stack Web Development"
                  value={formData.name || formData.title || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Narxi (UZS)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                    placeholder="800000"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Davomiyligi
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                    placeholder="6 oy"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Tavsif
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all resize-none h-24 placeholder:text-slate-300"
                  placeholder="Kurs haqida qisqacha..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Bekor
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition-opacity shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {editingCourse ? 'Saqlash' : 'Yaratish'}
                <ChevronRight className="w-4 h-4" />
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl z-10"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
            >
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </motion.div>
            <h3 className="text-xl font-black text-slate-900 mb-2">O'chirilsinmi?</h3>
            <p className="text-slate-400 text-sm mb-2 font-medium">
              <span className="font-black text-slate-700">"{course?.name || course?.title}"</span>
            </p>
            <p className="text-slate-400 text-xs mb-7">Bu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Yo'q
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-100 hover:opacity-90 transition-opacity"
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
  const { courses, loading, search, setSearch, loadCourses } = useAdminCourses();
  const {
    showModal, showDeleteModal, editingCourse, courseToDelete,
    formData, setFormData, openAddModal, openEditModal,
    openDeleteModal, closeModals
  } = useAdminCourseForm();

  const handleSave = async () => {
    const success = await saveAdminCourse(editingCourse, formData, loadCourses);
    if (success) { closeModals(); loadCourses(); }
  };

  const handleDelete = async () => {
    const success = await deleteAdminCourse(courseToDelete, loadCourses);
    if (success) { closeModals(); loadCourses(); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Kurslar Boshqaruvi
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-medium ml-1">Coding Club IT markazi</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all w-52 font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:opacity-90 transition-opacity"
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
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Kurslar yuklanmoqda...</p>
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="p-5 bg-indigo-50 rounded-3xl">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="text-slate-500 font-bold">Hech qanday kurs topilmadi</p>
            <button onClick={openAddModal} className="text-indigo-600 text-sm font-bold hover:underline">
              + Birinchi kursni yarating
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
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
      />

      <DeleteModal
        show={showDeleteModal}
        course={courseToDelete}
        onClose={closeModals}
        onConfirm={handleDelete}
      />
    </div>
  );
}