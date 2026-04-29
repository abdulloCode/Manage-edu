import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Building2, Search, Edit3, Trash2, X, Calendar,
  Clock, UserPlus, GraduationCap, BookOpen, DoorOpen, AlertTriangle,
  ChevronRight, ChevronLeft, MapPin, Wallet, Users2, CheckCircle, XCircle
} from 'lucide-react'
import {
  useGroups, useGroupForm, saveGroup, saveRoom, removeItem,
  addStudentToGroupApi, fetchAllStudents
} from './hooks'
import { getGroupById } from '../../../api/groups'
import { getAllPayments } from '../../../api/payments'
import { getStudentById } from '../../../api/students'

// ── 24h Time Picker ───────────────────────────────────────────
function TimePicker24({ value, onChange, label }) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']
  const parts = (value || '09:00').split(':') 
  const h = parts[0] || '09'
  const m = parts[1] || '00'

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex gap-2">
        <select value={h} onChange={e => onChange(`${e.target.value}:${m}`)}
          className="flex-1 px-3 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition-all cursor-pointer">
          {hours.map(hr => <option key={hr} value={hr}>{hr}:00</option>)}
        </select>
        <select value={m} onChange={e => onChange(`${h}:${e.target.value}`)}
          className="w-24 px-3 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition-all cursor-pointer">
          {minutes.map(min => <option key={min} value={min}>:{min}</option>)}
        </select>
      </div>
      <p className="text-[11px] text-slate-400 mt-1 ml-1">Tanlangan: {h}:{m}</p>
    </div>
  )
}

// ── Group Card ────────────────────────────────────────────────
const COLORS = [
  { from: 'from-violet-500', to: 'to-purple-600', light: 'bg-violet-50', text: 'text-violet-600' },
  { from: 'from-blue-500', to: 'to-indigo-600', light: 'bg-blue-50', text: 'text-blue-600' },
  { from: 'from-emerald-500', to: 'to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-600' },
  { from: 'from-rose-500', to: 'to-pink-600', light: 'bg-rose-50', text: 'text-rose-600' },
  { from: 'from-amber-500', to: 'to-orange-500', light: 'bg-amber-50', text: 'text-amber-600' },
  { from: 'from-sky-500', to: 'to-cyan-600', light: 'bg-sky-50', text: 'text-sky-600' },
]

function GroupCard({ group, idx, teachers, courses, rooms, openEditGroupModal, openDeleteModal, onAddStudent, onViewStudents, page, itemsPerPage }) {
  const col = COLORS[idx % COLORS.length]
  const course = courses.find(c => c.id === group.courseId)
  const teacher = teachers.find(t => t.id === group.teacherId)
  const room = rooms.find(r => r.id === group.roomId)
  const students = group.students || []
  const filled = group.currentStudents || students.length || 0
  const max = group.maxStudents || 1
  const pct = Math.min(100, Math.round((filled / max) * 100))

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.04, type: 'spring', stiffness: 280, damping: 26 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-transparent transition-all duration-300 cursor-pointer"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      onClick={() => onViewStudents(group)}>

      <div className={`h-1.5 bg-gradient-to-r ${col.from} ${col.to}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${col.light} flex items-center justify-center`}>
              <Users className={`w-5 h-5 ${col.text}`} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">{group.name}</h3>
              <span className="text-[10px] text-slate-400 font-mono">#{(page - 1) * itemsPerPage + idx + 1}</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${group.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {group.status === 'active' ? '● Faol' : '○ Nofaol'}
          </span>
        </div>

        <div className="space-y-1.5 mb-4 text-xs text-slate-500">
          {course && <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /><span className="truncate font-medium">{course.name}</span></div>}
          {teacher && <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /><span className="truncate">{teacher.name}</span></div>}
          {room && <div className="flex items-center gap-2"><DoorOpen className="w-3.5 h-3.5" /><span className="truncate">{room.name}</span></div>}
          {group.schedule?.days?.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>{group.schedule.days.slice(0, 3).join(', ')} · {group.schedule.fromHour}–{group.schedule.toHour}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><Users2 className="w-3 h-3" /> Talabalar</span>
            <span className="text-[11px] font-black text-slate-700">{filled}/{max}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${col.from} ${col.to} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={`${col.light} rounded-xl px-3 py-2 mb-4`}>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1"><Wallet className="w-3 h-3" /> Oylik to'lov</p>
          <p className={`text-sm font-black ${col.text}`}>{Number(group.monthlyFeePerStudent).toLocaleString()} <span className="text-xs font-medium text-slate-400">so'm</span></p>
        </div>

        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => openEditGroupModal(group)} className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-colors flex items-center justify-center gap-1">
            <Edit3 className="w-3 h-3" /> Tahrirlash
          </button>
          <button onClick={() => onAddStudent(group)} className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors flex items-center justify-center gap-1">
            <UserPlus className="w-3 h-3" /> Qo'shish
          </button>
          <button onClick={() => openDeleteModal(group, 'group')} className="px-3 py-2 text-xs text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Room Card ─────────────────────────────────────────────────
function RoomCard({ room, idx, openEditRoomModal, openDeleteModal }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-black text-slate-800">{room.name}</h3>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1"><MapPin className="w-3 h-3" /> #{room.number}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-indigo-50 rounded-xl">
        <Users className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-bold text-indigo-700">{room.capacity} kishi</span>
      </div>
      {room.equipment?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {room.equipment.slice(0, 4).map((eq, i) => (
            <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">{eq}</span>
          ))}
          {room.equipment.length > 4 && <span className="text-[11px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg">+{room.equipment.length - 4}</span>}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => openEditRoomModal(room)} className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center justify-center gap-1">
          <Edit3 className="w-3 h-3" /> Tahrirlash
        </button>
        <button onClick={() => openDeleteModal(room, 'room')} className="px-3 py-2 text-xs text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Group Modal ───────────────────────────────────────────────
function GroupModal({ formData, setFormData, teachers, courses, rooms, editingGroup, handleSaveGroup, closeModals }) {
  const days = ['Du', 'Se', 'Chor', 'Pa', 'Ju', 'Sha', 'Yak']
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.name?.trim()) newErrors.name = 'Guruh nomini kiriting'
    if (!formData.courseId) newErrors.courseId = 'Kursni tanlang'
    if (!formData.teacherId) newErrors.teacherId = "O'qituvchini tanlang"
    if (!formData.roomId) newErrors.roomId = 'Xonani tanlang'
    if (!formData.startDate) newErrors.startDate = 'Boshlanish sanasini kiriting'
    if (!formData.endDate) newErrors.endDate = 'Tugash sanasini kiriting'
    if (!formData.maxStudents) newErrors.maxStudents = 'Maksimal talabalar sonini kiriting'
    if (!formData.monthlyFeePerStudent) newErrors.monthlyFeePerStudent = "Oylik to'lovni kiriting"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) handleSaveGroup()
  }

  const toggleDay = (day) => {
    const cur = formData.schedule?.days || []
    const next = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day]
    setFormData({ ...formData, schedule: { ...formData.schedule, days: next } })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModals} />
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">

        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users className="w-5 h-5 text-white" /></div>
            <h2 className="font-black text-white text-lg">{editingGroup ? 'Guruhni Tahrirlash' : 'Yangi Guruh'}</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Guruh nomi *</label>
            <input value={formData.name || ''} onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: null }) }}
              className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all ${errors.name ? 'border-red-400' : 'border-transparent focus:border-violet-500'}`}
              placeholder="Masalan: Frontend Guruh A" />
            {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'courseId', label: 'Kurs *', list: courses, nameKey: 'name' },
              { key: 'teacherId', label: "O'qituvchi *", list: teachers, nameKey: 'name' }
            ].map(({ key, label, list, nameKey }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                <select value={formData[key] || ''} onChange={e => { setFormData({ ...formData, [key]: e.target.value }); setErrors({ ...errors, [key]: null }) }}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all ${errors[key] ? 'border-red-400' : 'border-transparent focus:border-violet-500'}`}>
                  <option value="">Tanlang</option>
                  {list.map(i => <option key={i.id} value={i.id}>{i[nameKey]}</option>)}
                </select>
                {errors[key] && <p className="text-xs text-red-500 mt-1 font-medium">{errors[key]}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Xona *</label>
              <select value={formData.roomId || ''} onChange={e => { setFormData({ ...formData, roomId: e.target.value }); setErrors({ ...errors, roomId: null }) }}
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all ${errors.roomId ? 'border-red-400' : 'border-transparent focus:border-violet-500'}`}>
                <option value="">Tanlang</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (#{r.number})</option>)}
              </select>
              {errors.roomId && <p className="text-xs text-red-500 mt-1 font-medium">{errors.roomId}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Oylik to'lov *</label>
              <input type="number" value={formData.monthlyFeePerStudent || ''} placeholder="500000"
                onChange={e => { setFormData({ ...formData, monthlyFeePerStudent: e.target.value }); setErrors({ ...errors, monthlyFeePerStudent: null }) }}
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all ${errors.monthlyFeePerStudent ? 'border-red-400' : 'border-transparent focus:border-violet-500'}`} />
              {errors.monthlyFeePerStudent && <p className="text-xs text-red-500 mt-1 font-medium">{errors.monthlyFeePerStudent}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'startDate', label: 'Boshlanish *', type: 'date' },
              { key: 'endDate', label: 'Tugash *', type: 'date' },
              { key: 'maxStudents', label: 'Max talaba *', type: 'number', placeholder: '20' }
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                <input type={type} value={formData[key] || ''} placeholder={placeholder}
                  onChange={e => { setFormData({ ...formData, [key]: e.target.value }); setErrors({ ...errors, [key]: null }) }}
                  className={`w-full px-3 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all ${errors[key] ? 'border-red-400' : 'border-transparent focus:border-violet-500'}`} />
                {errors[key] && <p className="text-xs text-red-500 mt-1 font-medium">{errors[key]}</p>}
              </div>
            ))}
          </div>

          <div className="bg-violet-50 rounded-2xl p-4 space-y-4 border border-violet-100">
            <p className="text-xs font-black text-violet-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Dars jadvali
            </p>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">Dars kunlari</p>
              <div className="flex flex-wrap gap-2">
                {days.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                      formData.schedule?.days?.includes(day)
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                        : 'bg-white text-slate-500 hover:bg-violet-100 border border-slate-200'
                    }`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TimePicker24 label="Boshlanish vaqti" value={formData.schedule?.fromHour || '09:00'}
                onChange={v => setFormData({ ...formData, schedule: { ...formData.schedule, fromHour: v } })} />
              <TimePicker24 label="Tugash vaqti" value={formData.schedule?.toHour || '11:00'}
                onChange={v => setFormData({ ...formData, schedule: { ...formData.schedule, toHour: v } })} />
            </div>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Iltimos, barcha maydonlarni to'ldiring
            </p>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={closeModals} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors">Bekor</button>
          <button onClick={handleSubmit} className="flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl shadow-lg shadow-violet-200 hover:opacity-90 transition-opacity">
            {editingGroup ? '✓ Saqlash' : '+ Yaratish'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Room Modal ────────────────────────────────────────────────
function RoomModal({ roomFormData, setRoomFormData, editingRoom, handleSaveRoom, closeModals }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!roomFormData.name?.trim()) newErrors.name = 'Xona nomini kiriting'
    if (!roomFormData.number?.trim()) newErrors.number = 'Raqamni kiriting'
    if (!roomFormData.capacity) newErrors.capacity = "Sig'imni kiriting"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) handleSaveRoom()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModals} />
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Building2 className="w-5 h-5 text-white" /></div>
            <h2 className="font-black text-white text-lg">{editingRoom ? 'Xonani Tahrirlash' : 'Yangi Xona'}</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Xona nomi *', key: 'name', type: 'text', placeholder: 'Asosiy zal' },
            { label: 'Raqami *', key: 'number', type: 'text', placeholder: '101' },
            { label: "Sig'imi (kishi) *", key: 'capacity', type: 'number', placeholder: '20' },
            { label: 'Jihozlar (vergul bilan)', key: 'equipment', type: 'text', placeholder: 'Proyektor, Doska, Kompyuter' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
              <input type={type} value={roomFormData[key] || ''} placeholder={placeholder}
                onChange={e => { setRoomFormData({ ...roomFormData, [key]: e.target.value }); setErrors({ ...errors, [key]: null }) }}
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all ${errors[key] ? 'border-red-400' : 'border-transparent focus:border-indigo-500'}`} />
              {errors[key] && <p className="text-xs text-red-500 mt-1 font-medium">{errors[key]}</p>}
            </div>
          ))}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Iltimos, barcha maydonlarni to'ldiring
            </p>
          </div>
        )}

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={closeModals} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">Bekor</button>
          <button onClick={handleSubmit} className="flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg shadow-indigo-200 hover:opacity-90 transition-opacity">
            {editingRoom ? '✓ Saqlash' : '+ Yaratish'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────
function DeleteModal({ itemToDelete, deleteType, confirmDelete, closeModals }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModals} />
      <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center z-10">
        <motion.div animate={{ rotate: [0, -8, 8, -4, 0] }} transition={{ delay: 0.2, duration: 0.5 }}
          className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </motion.div>
        <h3 className="text-xl font-black text-slate-900 mb-2">O'chirilsinmi?</h3>
        <p className="text-slate-500 text-sm mb-1 font-medium">"{itemToDelete?.name}"</p>
        <p className="text-slate-400 text-xs mb-7">{deleteType === 'group' ? 'Guruh' : 'Xona'} o'chirilsa qaytarib bo'lmaydi.</p>
        <div className="flex gap-3">
          <button onClick={closeModals} className="flex-1 py-3 bg-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Yo'q</button>
          <button onClick={confirmDelete} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-100 hover:opacity-90 transition-opacity">Ha, o'chir</button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Add Student Modal ─────────────────────────────────────────
function AddStudentModal({ group, onClose, onAdded, existingStudents = [] }) {
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchAllStudents()
      .then(all => {
        console.log('Barcha o\'quvchilar:', all)

        // Guruh ID ni aniqlash
        const groupId = group._id || group.id

        // Allaqachon bu guruhga qo'shilgan o'quvchilarni exclude qilish
        const filtered = all.filter(student => {
          const studentId = student._id || student.id

          console.log('Studentni tekshirish:', student.name, studentId)

          // 1. existingStudents orqali tekshirish (agar berilgan bo'lsa)
          const existsInGroup = existingStudents.some(s =>
            (s._id || s.id) === studentId
          )
          if (existsInGroup) return false

          // 2. student.group orqali tekshirish
          if (student.group) {
            const studentGroupId = student.group._id || student.group.id
            if (studentGroupId === groupId) return false
          }

          // 3. student.groupId orqali tekshirish
          if (student.groupId === groupId) return false

          // 4. student.groups orqali tekshirish (agar o'quvchi bir nechta guruhda bo'lishi mumkin bo'lsa)
          if (student.groups && Array.isArray(student.groups)) {
            const inGroup = student.groups.some(g =>
              (g._id || g.id) === groupId
            )
            if (inGroup) return false
          }

          return true
        })

        console.log('Guruhga qo\'shish mumkin bo\'lgan o\'quvchilar:', filtered.length)
        console.log('Filter qilingan o\'quvchilar:', filtered)
        setStudents(filtered)
        setFetching(false)
      })
      .catch((err) => {
        console.error('O\'quvchilarni yuklash xatolik:', err)
        setErrors({ submit: 'Yuklanmadi' })
        setFetching(false)
      })
  }, [group, existingStudents])

  const validate = () => {
    const newErrors = {}
    if (!selectedId) newErrors.selectedId = 'Studentni tanlang'

    // Qo'shimcha: tanlangan o'quvchi allaqachon guruhda yo'qligini tekshirish
    const studentId = selectedId
    const groupId = group._id || group.id

    // existingStudents orqali tekshirish
    const alreadyInGroup = existingStudents.some(s =>
      (s._id || s.id) === studentId
    )

    if (alreadyInGroup) {
      newErrors.selectedId = 'Bu o\'quvchi allaqachon bu guruhda'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return

    // Qo'shimcha backend tekshiruvi
    const studentId = selectedId
    const groupId = group._id || group.id

    // Agar o'quvchi allaqachon guruhda bo'lsa, qo'shmaslik
    const alreadyInGroup = existingStudents.some(s =>
      (s._id || s.id) === studentId
    )

    if (alreadyInGroup) {
      setErrors({ submit: 'Bu o\'quvchi allaqachon bu guruhda qo\'shilgan' })
      return
    }

    setLoading(true)
    const ok = await addStudentToGroupApi(groupId, studentId)
    if (ok) { onAdded(); onClose() } else { setErrors({ submit: "Qo'shishda xatolik" }); setLoading(false) }
  }

  const sel = students.find(s => s._id === selectedId || s.id === selectedId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><UserPlus className="w-5 h-5 text-white" /></div>
            <h2 className="font-black text-white">Student Qo'shish</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-100">
            <p className="font-bold text-blue-800 text-sm">{group.name}</p>
            <p className="text-xs text-blue-400">{group.currentStudents || 0}/{group.maxStudents} talaba</p>
          </div>

          {fetching ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Studentni tanlang *</label>
                <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setErrors({ ...errors, selectedId: null }) }}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all ${errors.selectedId ? 'border-red-400' : 'border-transparent focus:border-blue-500'}`}>
                  <option value="">Tanlang...</option>
                  {students.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name || 'Ism yo\'q'} {s.phone ? `— ${s.phone}` : '(Telefon yo\'q)'}
                    </option>
                  ))}
                </select>
                {errors.selectedId && <p className="text-xs text-red-500 mt-1 font-medium">{errors.selectedId}</p>}
              </div>
              {sel && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Ism</span>
                    <span className="font-bold text-slate-700">{sel.name || 'Ism yo\'q'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Telefon</span>
                    <span className="font-bold text-slate-700">{sel.phone || 'Telefon yo\'q'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Balans</span>
                    <span className="font-bold text-slate-700">{Number(sel.balance || 0).toLocaleString()} UZS</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {errors.submit && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {errors.submit}
            </p>
          </div>
        )}

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">Bekor</button>
          <button onClick={handleAdd} disabled={loading}
            className="flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 rounded-2xl shadow-lg shadow-blue-200 hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Qo'shilmoqda..." : "+ Qo'shish"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main GroupsPage ───────────────────────────────────────────
export default function GroupsPage() {
  const {
    groups, rooms, teachers, courses, loading, activeTab, setActiveTab,
    search, setSearch, page, setPage, itemsPerPage, totalPages,
    paginatedGroups, paginatedRooms, loadGroups, loadRooms
  } = useGroups()

  const {
    showModal, showRoomModal, showDeleteModal, editingGroup, editingRoom,
    itemToDelete, deleteType, formData, setFormData, roomFormData, setRoomFormData,
    openAddGroupModal, openEditGroupModal, openAddRoomModal, openEditRoomModal,
    openDeleteModal, closeModals
  } = useGroupForm(teachers, courses, rooms)

  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [selectedGroupForStudent, setSelectedGroupForStudent] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupStudents, setGroupStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentPayments, setStudentPayments] = useState({})

  const handleSaveGroup = async () => {
    const ok = await saveGroup(editingGroup, formData)
    if (ok) {
      closeModals()
      loadGroups()
    }
  }

  const handleSaveRoom = async () => {
    const ok = await saveRoom(editingRoom, roomFormData)
    if (ok) {
      closeModals()
      loadRooms()
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    const ok = await removeItem(itemToDelete, deleteType)
    if (ok) {
      closeModals()
      activeTab === 'groups' ? loadGroups() : loadRooms()
    }
  }

  const handleGroupClick = async (group) => {
    if (selectedGroup?.id === group.id || selectedGroup?._id === group._id) {
      setSelectedGroup(null)
      setGroupStudents([])
      setStudentPayments({})
    } else {
      setSelectedGroup(group)
      setLoadingStudents(true)
      try {
        console.log('Guruh ID:', group.id || group._id)
        console.log('Guruhdan o\'quvchilarni yuklash...')

        const res = await getGroupById(group.id || group._id, { includeStudents: true })
        console.log('Backend response:', res.data)

        const groupData = res.data.data || res.data
        console.log('Group data:', groupData)

        let students = []

        // Turli xil ma'lumot formatlarini tekshirish
        if (groupData.students && Array.isArray(groupData.students)) {
          students = groupData.students
        } else if (groupData.studentsData && Array.isArray(groupData.studentsData)) {
          students = groupData.studentsData
        } else if (groupData.studentData && Array.isArray(groupData.studentData)) {
          students = groupData.studentData
        } else if (groupData.studentIds && Array.isArray(groupData.studentIds)) {
          // Agar faqat IDlar bo'lsa, API dan to'liq ma'lumotlarni yuklash
          students = await Promise.all(
            groupData.studentIds.map(id =>
              getStudentById(id)
                .then(res => res.data.data || res.data)
                .catch(() => ({ id, name: "Noma'lum", phone: '—', balance: 0, role: 'student' }))
            )
          )
        } else if (groupData.students && typeof groupData.students === 'object') {
          // Agar students obyekt bo'lsa
          students = Object.values(groupData.students)
        }

        // Agar hech narsa topilmasa, local group'dan olishga urinish
        if (students.length === 0 && group.students) {
          students = Array.isArray(group.students) ? group.students : [group.students]
        }

        console.log('Yuklangan o\'quvchilar:', students)
        setGroupStudents(students)

        // O'quvchilarning to'lov ma'lumotlarini yuklash
        if (students.length > 0) {
          await loadStudentPayments(students)
        }

        if (students.length === 0) {
          console.warn('O\'quvchilar topilmadi. Group data:', groupData)
        }
      } catch (err) {
        console.error('O\'quvchilarni yuklashda xatolik:', err)
        console.error('Error response:', err.response?.data)

        // Xatolik bo'lsa, local data'dan olishga urinish
        if (group.students) {
          const students = Array.isArray(group.students) ? group.students : [group.students]
          setGroupStudents(students)
        } else {
          setGroupStudents([])
        }
      } finally {
        setLoadingStudents(false)
      }
    }
  }

  // O'quvchilarning to'lov ma'lumotlarini yuklash
  const loadStudentPayments = async (students) => {
    try {
      const paymentsRes = await getAllPayments({ limit: 1000 })
      const allPayments = paymentsRes.data.payments || paymentsRes.data.data || paymentsRes.data || []

      // Har bir o'quvchi uchun to'lovlarini guruhlash
      const paymentsByStudent = {}

      students.forEach(student => {
        const studentId = student._id || student.id
        const studentPayments = allPayments.filter(payment => {
          const toWhoId = typeof payment.toWho === 'object'
            ? (payment.toWho._id || payment.toWho.id)
            : payment.toWho
          return toWhoId === studentId
        })

        // Oxirgi to'lovni topish
        const sortedPayments = studentPayments.sort((a, b) => new Date(b.date) - new Date(a.date))
        const lastPayment = sortedPayments.length > 0 ? sortedPayments[0] : null

        // Jami to'lovni hisoblash
        const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

        paymentsByStudent[studentId] = {
          lastPayment,
          totalPaid,
          paymentCount: studentPayments.length
        }
      })

      setStudentPayments(paymentsByStudent)
    } catch (err) {
      console.error('To\'lovlarni yuklashda xatolik:', err)
      setStudentPayments({})
    }
  }

  const handleBack = () => {
    setSelectedGroup(null)
    setGroupStudents([])
    setStudentPayments({})
  }

  const handleAddStudentSuccess = () => {
    setShowAddStudentModal(false)
    setSelectedGroupForStudent(null)
    loadGroups()
    if (selectedGroup) handleGroupClick(selectedGroup)
  }

  const openAddStudentModal = (group) => {
    setSelectedGroupForStudent(group)
    setShowAddStudentModal(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Tablar va Qidiruv */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {[['groups', 'Guruhlar', Users], ['rooms', 'Xonalar', Building2]].map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setPage(1)
                setSelectedGroup(null)
                setStudentPayments({})
              }}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === tab
                  ? tab === 'groups' ? 'bg-violet-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {!selectedGroup && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-violet-400 w-56"
              />
            </div>
            <button
              onClick={activeTab === 'groups' ? openAddGroupModal : openAddRoomModal}
              className={`px-4 py-2.5 text-sm font-bold text-white rounded-2xl shadow-md flex items-center gap-2 ${
                activeTab === 'groups'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600'
              }`}
            >
              + {activeTab === 'groups' ? 'Guruh' : 'Xona'}
            </button>
          </div>
        )}

        {selectedGroup && (
          <button onClick={handleBack} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 flex items-center gap-2">
            ← Barcha guruhlar
          </button>
        )}
      </div>

      {/* ASOSIY KONTENT */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'groups' ? (
        <>
          {!selectedGroup ? (
            <>
              {paginatedGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <Users className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-slate-500 font-bold mt-3">Guruhlar yo'q</p>
                  <button onClick={openAddGroupModal} className="text-violet-600 text-sm font-bold hover:underline mt-2">
                    + Birinchi guruhni yarating
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {paginatedGroups.map((group, i) => (
                      <div key={group.id || group._id} onClick={() => handleGroupClick(group)} className="cursor-pointer">
                        <GroupCard
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
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400">{(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, groups.length)} / {groups.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded-xl hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPage(n)} className={`px-3 py-1.5 rounded-xl border ${page === n ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 hover:bg-slate-100'}`}>{n}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border rounded-xl hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Users className="w-6 h-6 text-white" /></div>
                    <div>
                      <h3 className="font-black text-white text-xl">{selectedGroup.name}</h3>
                      <p className="text-sm text-white/70">{groupStudents.length} ta o'quvchi</p>
                    </div>
                  </div>
                  <button onClick={() => openAddStudentModal(selectedGroup)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-bold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> O'quvchi qo'shish
                  </button>
                </div>
              </div>
              {loadingStudents ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : groupStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Users className="w-16 h-16 text-slate-200" />
                  <p className="font-medium mt-3">Bu guruhda hali o'quvchilar yo'q</p>
                  <button onClick={() => openAddStudentModal(selectedGroup)} className="mt-3 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Birinchi o'quvchini qo'shing
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">O'quvchi</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Telefon</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Qo'shilgan sana</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Oxirgi to'lov sanasi</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Oxirgi to'lov summasi</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">To'lov holati</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupStudents.map((s, i) => {
                        const studentId = s._id || s.id
                        const paymentData = studentPayments[studentId]
                        const lastPayment = paymentData?.lastPayment
                        const totalPaid = paymentData?.totalPaid || 0
                        const paymentCount = paymentData?.paymentCount || 0

                        return (
                          <tr key={studentId || i} className="border-b hover:bg-violet-50/40">
                            <td className="px-4 py-3.5 text-slate-400 text-xs font-medium">{i+1}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                                  {s.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{s.name}</div>
                                  <div className="text-xs text-slate-400">{s.role || 'student'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 text-xs font-medium">{s.phone || '—'}</td>
                            <td className="px-4 py-3.5 text-slate-500 text-xs">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString('uz-UZ') : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 text-xs">
                              {lastPayment ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{new Date(lastPayment.date).toLocaleDateString('uz-UZ')}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {lastPayment ? (
                                <div className="flex items-center gap-2">
                                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="font-bold text-emerald-600">
                                    {Number(lastPayment.amount).toLocaleString('uz-UZ')} <span className="text-xs font-medium text-slate-400">so'm</span>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {paymentCount > 0 ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  <span className="text-xs font-medium text-emerald-600">
                                    {paymentCount} ta to'lov
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-4 h-4 text-red-400" />
                                  <span className="text-xs font-medium text-red-400">
                                    To'lov yo'q
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 bg-slate-50 border-t">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-wrap gap-4">
                        <span className="text-xs text-slate-500 font-medium">Jami: <span className="text-slate-800 font-bold">{groupStudents.length}</span> ta o'quvchi</span>
                        <span className="text-xs text-emerald-600 font-medium">✓ {Object.values(studentPayments).filter(p => p.paymentCount > 0).length} ta to'lov qilgan</span>
                        <span className="text-xs text-red-500 font-medium">✗ {Object.values(studentPayments).filter(p => p.paymentCount === 0).length} ta to'lov qilmagan</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Jami to'lov: <span className="font-bold text-emerald-600">
                          {Object.values(studentPayments).reduce((sum, p) => sum + p.totalPaid, 0).toLocaleString('uz-UZ')} so'm
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
            <RoomCard key={room.id || room._id} room={room} idx={i} openEditRoomModal={openEditRoomModal} openDeleteModal={openDeleteModal} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && <GroupModal formData={formData} setFormData={setFormData} teachers={teachers} courses={courses} rooms={rooms} editingGroup={editingGroup} handleSaveGroup={handleSaveGroup} closeModals={closeModals} />}
        {showRoomModal && <RoomModal roomFormData={roomFormData} setRoomFormData={setRoomFormData} editingRoom={editingRoom} handleSaveRoom={handleSaveRoom} closeModals={closeModals} />}
        {showDeleteModal && <DeleteModal itemToDelete={itemToDelete} deleteType={deleteType} confirmDelete={confirmDelete} closeModals={closeModals} />}
        {showAddStudentModal && selectedGroupForStudent && <AddStudentModal group={selectedGroupForStudent} onClose={() => setShowAddStudentModal(false)} onAdded={handleAddStudentSuccess} existingStudents={groupStudents} />}
      </AnimatePresence>
    </div>
  )
}