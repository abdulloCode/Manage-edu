import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit3, Trash2, Wallet,
  Calendar, Filter, Users, DollarSign,
  X, AlertCircle, TrendingUp, Clock,
  Settings, Tag, FileText, GraduationCap,
  UserPlus, Building2, ChevronDown
} from 'lucide-react'
import {
  usePayments,
  usePaymentForm,
  savePayment,
  removePayment,
  savePaymentType,
  removePaymentType,
  saveStaffSalary,
  getStaffSalaryHistoryData,
  removeStaff
} from './hooks'
import { getAllTeachers } from '../../../api/teacher'
import { getStudents } from '../../../api/students'
import { getAllGroups } from '../../../api/groups'

export default function PaymentsPage() {
  const {
    payments: rawPayments,
    paymentTypes: rawTypes,
    staff: rawStaff,
    loading,
    activeTab,
    setActiveTab,
    report,
    filters,
    setFilters,
    loadPayments,
    loadPaymentTypes,
    loadReport,
    loadStaff
  } = usePayments()

  const payments = Array.isArray(rawPayments) ? rawPayments : []
  const paymentTypes = Array.isArray(rawTypes) ? rawTypes : []
  const staff = Array.isArray(rawStaff) ? rawStaff : []

  const [searchQuery, setSearchQuery] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [salaryHistory, setSalaryHistory] = useState([])

  // Recipient selection states
  const [recipientCategory, setRecipientCategory] = useState('') // 'teacher' | 'staff' | 'student'
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [groups, setGroups] = useState([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState(null)
  const [recipientDebt, setRecipientDebt] = useState(0)
  const [recipientDebtInfo, setRecipientDebtInfo] = useState({ debt: 0, salary: 0, paid: 0, lastPayment: 0 })
  const [amountInput, setAmountInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingType, setIsSubmittingType] = useState(false)
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false)
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [typeFormErrors, setTypeFormErrors] = useState({})
  const [staffFormErrors, setStaffFormErrors] = useState({})
  const [salaryFormErrors, setSalaryFormErrors] = useState({})

  // Format number with Uzbek thousand separators
  const formatNumber = (value) => {
    if (!value) return ''
    const numStr = value.toString().replace(/\D/g, '')
    const num = parseInt(numStr, 10)

    if (isNaN(num)) return numStr

    return num.toLocaleString('uz-UZ')
  }

  // Parse formatted number back to plain number
  const parseFormattedNumber = (value) => {
    if (!value) return ''
    return value.replace(/\s/g, '').replace(/,/g, '')
  }

  // Handle amount input change with formatting
  const handleAmountChange = (e) => {
    const rawValue = e.target.value
    const plainNumber = parseFormattedNumber(rawValue)
    setAmountInput(rawValue) // Store the formatted input
    setPaymentForm({ ...paymentForm, amount: plainNumber }) // Store the plain number
  }

  const [paymentForm, setPaymentForm] = useState({
    type: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7),
    toWho: '',
    date: new Date().toISOString().slice(0, 10),
    comment: ''
  })

  const [typeForm, setTypeForm] = useState({
    name: '',
    code: '',
    dk: 'credit',
    description: ''
  })

  const [salaryForm, setSalaryForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    monthlySalary: '',
    startDate: new Date().toISOString().slice(0, 10),
    comment: ''
  })

  const [staffForm, setStaffForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'staff',
    jobTitle: '',
    hireDate: new Date().toISOString().slice(0, 10),
    specialization: ''
  })

  // Load data for recipient selection
  useEffect(() => {
    if (showPaymentModal) {
      const loadData = async () => {
        try {
          const [teachersRes, studentsRes, groupsRes] = await Promise.all([
            getAllTeachers(),
            getStudents({ limit: 1000 }),
            getAllGroups()
          ])

          setTeachers(teachersRes.data.data || teachersRes.data || [])
          const allStudents = studentsRes.data.data || studentsRes.data || []
          setStudents(allStudents)
          setGroups(groupsRes.data.data || groupsRes.data || [])
        } catch (err) {
          console.error('Ma\'lumotlarni yuklashda xatolik:', err)
        }
      }
      loadData()
    }
  }, [showPaymentModal])

  // Filter students when group is selected
  useEffect(() => {
    if (selectedGroup) {
      const groupStudents = students.filter(s => {
        const studentGroupId = s.group?._id || s.group?.id
        return studentGroupId === selectedGroup.id || studentGroupId === selectedGroup._id
      })
      setFilteredStudents(groupStudents)
    } else {
      setFilteredStudents(students)
    }
  }, [selectedGroup, students])

  // Reset form state when modals close
  useEffect(() => {
    if (!showPaymentModal) {
      setFormErrors({})
      setIsSubmitting(false)
    }
    if (!showTypeModal) {
      setTypeFormErrors({})
      setIsSubmittingType(false)
    }
    if (!showStaffModal) {
      setStaffFormErrors({})
      setIsSubmittingStaff(false)
    }
    if (!showSalaryModal) {
      setSalaryFormErrors({})
      setIsSubmittingSalary(false)
    }
  }, [showPaymentModal, showTypeModal, showStaffModal, showSalaryModal])

  // Load staff data when switching to staff tab
  useEffect(() => {
    if (activeTab === 'staff') {
      console.log("Staff tabiga o'tildi, xodimlarni yuklashmoqda...")
      loadStaff()
    }
  }, [activeTab])

  // Calculate debt for staff or teacher
  const calculateRecipientDebt = (person) => {
    if (!person) return { debt: 0, salary: 0, paid: 0, lastPayment: 0 }

    let monthlySalary = 0
    let totalPaid = 0

    // Get monthly salary for staff
    if (recipientCategory === 'staff' && person.salaries) {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const salaryRecord = person.salaries.find(s => s.month?.startsWith(currentMonth))
      if (salaryRecord) {
        monthlySalary = Number(salaryRecord.monthlySalary) || 0
      }
    }

    // Calculate total payments made to this person in the current month
    const currentMonth = new Date().toISOString().slice(0, 7)
    const personPayments = payments.filter(p =>
      p.toWho === person.name &&
      p.month?.startsWith(currentMonth)
    )
    totalPaid = personPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    // Get the last payment amount
    const sortedPayments = [...personPayments].sort((a, b) => new Date(b.date) - new Date(a.date))
    const lastPayment = sortedPayments.length > 0 ? sortedPayments[0].amount : 0

    const debt = Math.max(0, monthlySalary - totalPaid)

    // For teachers, we might need to get their salary from a different source
    // For now, we'll return what we have
    return { debt, salary: monthlySalary, paid: totalPaid, lastPayment }
  }

  // Filter recipients based on search
  const getFilteredRecipients = () => {
    const searchLower = recipientSearch.toLowerCase()

    if (recipientCategory === 'teacher') {
      return teachers.filter(t =>
        t.name?.toLowerCase().includes(searchLower)
      )
    } else if (recipientCategory === 'staff') {
      return staff.filter(s =>
        s.name?.toLowerCase().includes(searchLower)
      )
    } else if (recipientCategory === 'student') {
      return filteredStudents.filter(s =>
        s.name?.toLowerCase().includes(searchLower) ||
        s.phone?.includes(searchLower)
      )
    }
    return []
  }

  const handleSavePayment = async () => {
    const errors = {}
    if (!paymentForm.type) errors.type = "To'lov turini tanlang!"
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) errors.amount = "Summani kiriting!"
    if (!paymentForm.toWho) errors.toWho = "Kimga ekanligini tanlang!"

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setIsSubmitting(true)

    try {
      // Type ID bo'lishi kerak, agar string bo'lsa, ID ga o'tkazish
      let typeId = paymentForm.type
      if (typeof typeId === 'string' && typeId.length > 20) {
        // Bu ID bo'lishi kerak
      } else if (typeof typeId === 'string') {
        // Bu name bo'lishi mumkin, ID topish kerak
        let typeObj = paymentTypes.find(t => t._id === typeId || t.id === typeId)
        if (!typeObj) {
          typeObj = paymentTypes.find(t => t.name === typeId)
        }
        if (typeObj) {
          typeId = typeObj._id || typeObj.id
        }
      }

      const success = await savePayment(editingPayment, {
        typeId: typeId,
        type: paymentForm.type, // Asosiy turi
        amount: Number(paymentForm.amount),
        month: paymentForm.month,
        toWho: paymentForm.toWho,
        date: paymentForm.date,
        comment: paymentForm.comment
      })

      if (success) {
        setShowPaymentModal(false)
        setPaymentForm({
          type: '',
          amount: '',
          month: new Date().toISOString().slice(0, 7),
          toWho: '',
          date: new Date().toISOString().slice(0, 10),
          comment: ''
        })
        setAmountInput('')
        setEditingPayment(null)
        setRecipientCategory('')
        setSelectedGroup(null)
        setRecipientSearch('')
        setSelectedRecipient(null)
        setRecipientDebt(0)
        setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 })
        loadPayments()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveType = async () => {
    const errors = {}
    if (!typeForm.name) errors.name = "Nomi kiritilishi shart!"

    if (Object.keys(errors).length > 0) {
      setTypeFormErrors(errors)
      return
    }

    setTypeFormErrors({})
    setIsSubmittingType(true)

    try {
      const success = await savePaymentType(editingType, typeForm)
      if (success) {
        setShowTypeModal(false)
        setTypeForm({ name: '', code: '', dk: 'credit', description: '' })
        setEditingType(null)
        loadPaymentTypes()
      }
    } finally {
      setIsSubmittingType(false)
    }
  }

  const handleDeleteType = async (id) => {
    const success = await removePaymentType(id)
    if (success) {
      loadPaymentTypes()
    }
  }

  const handleSaveStaff = async () => {
    const errors = {}
    if (!staffForm.name) errors.name = "Ism kiritilishi shart!"
    if (!staffForm.phone) errors.phone = "Telefon raqami kiritilishi shart!"
    if (!selectedStaff && !staffForm.password) errors.password = "Parol kiritilishi shart!"

    if (Object.keys(errors).length > 0) {
      setStaffFormErrors(errors)
      return
    }

    setStaffFormErrors({})
    setIsSubmittingStaff(true)

    try {
      const success = await saveStaff(selectedStaff || null, staffForm)
      if (success) {
        setShowStaffModal(false)
        setSelectedStaff(null)
        setStaffForm({ name: '', phone: '', password: '', role: 'staff', jobTitle: '', hireDate: new Date().toISOString().slice(0, 10), specialization: '' })
        loadStaff()
      }
    } finally {
      setIsSubmittingStaff(false)
    }
  }

  const handleSaveSalary = async () => {
    const errors = {}
    if (!salaryForm.monthlySalary) errors.monthlySalary = "Oylik maosh kiritilishi shart!"

    if (Object.keys(errors).length > 0) {
      setSalaryFormErrors(errors)
      return
    }

    setSalaryFormErrors({})
    setIsSubmittingSalary(true)

    try {
      const success = await saveStaffSalary(selectedStaff, salaryForm)
      if (success) {
        setShowSalaryModal(false)
        setSalaryForm({
          month: new Date().toISOString().slice(0, 7),
          monthlySalary: '',
          startDate: new Date().toISOString().slice(0, 10),
          comment: ''
        })
        setSelectedStaff(null)
        loadStaff()
      }
    } finally {
      setIsSubmittingSalary(false)
    }
  }
  const handleDeleteStaff = async (staffMember) => {
  const success = await removeStaff(staffMember)
  if (success) loadStaff()
}

  const handleViewHistory = async (staffMember) => {
    setSelectedStaff(staffMember)
    const history = await getStaffSalaryHistoryData(staffMember._id || staffMember.id)
    setSalaryHistory(history)
    setShowHistoryModal(true)
  }

  const filteredPayments = payments.filter(p =>
    p.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.toWho?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTypes = paymentTypes.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStaff = staff.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery) ||
    s.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">

      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              To'lovlar Boshqaruvi
            </h1>
            <p className="text-slate-500 mt-2 ml-15">Moliyaviy operatsiyalar va hisobotlar</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidirish..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{payments.length}</p>
                <p className="text-sm text-slate-500">Jami to'lovlar</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{Number(totalAmount).toLocaleString()} UZS</p>
                <p className="text-sm text-slate-500">Jami summa</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{paymentTypes.length}</p>
                <p className="text-sm text-slate-500">To'lov turlari</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{staff.length}</p>
                <p className="text-sm text-slate-500">Xodimlar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-200">
            {[
              { id: 'payments', label: 'To\'lovlar', icon: Wallet },
              { id: 'types', label: 'To\'lov Turlari', icon: Tag },
              { id: 'staff', label: 'Xodimlar', icon: Users },
              { id: 'reports', label: 'Hisobotlar', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <>
                    {/* Add Payment Button */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => {
                          setEditingPayment(null)
                          setPaymentForm({
                            type: '',
                            amount: '',
                            month: new Date().toISOString().slice(0, 7),
                            toWho: '',
                            date: new Date().toISOString().slice(0, 10),
                            comment: ''
                          })
                          setAmountInput('')
                          setRecipientCategory('')
                          setSelectedGroup(null)
                          setRecipientSearch('')
                          setSelectedRecipient(null)
                          setRecipientDebt(0)
                          setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 })
                          setShowPaymentModal(true)
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        Yangi To'lov
                      </button>
                    </div>

                    {/* Payments Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sana</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Turi</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Kim uchun</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Oy</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Summa</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Izoh</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amallar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPayments.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                                  <div className="flex flex-col items-center gap-3">
                                    <Wallet className="w-12 h-12 text-slate-300 mx-auto" />
                                    <p className="text-sm font-medium text-slate-500">To'lovlar yo'q</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredPayments.map((payment) => (
                                <tr key={payment._id || payment.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {new Date(payment.date).toLocaleDateString('uz-UZ')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                      paymentTypes.find(t => t._id === payment.typeId)?.dk === 'credit'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {paymentTypes.find(t => t._id === payment.typeId)?.name || payment.type || '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-700">{payment.toWho || '—'}</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">{payment.month || '—'}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-right text-slate-900">
                                    {Number(payment.amount || 0).toLocaleString()} UZS
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{payment.comment || '—'}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingPayment(payment)
                                          const amount = payment.amount || ''
                                          setPaymentForm({
                                            type: payment.type || '',
                                            amount: amount,
                                            month: payment.month || new Date().toISOString().slice(0, 7),
                                            toWho: payment.toWho || '',
                                            date: payment.date || new Date().toISOString().slice(0, 10),
                                            comment: payment.comment || ''
                                          })
                                          setAmountInput(formatNumber(amount))
                                          // Reset debt calculation states when editing
                                          setRecipientCategory('')
                                          setSelectedGroup(null)
                                          setRecipientSearch('')
                                          setSelectedRecipient(null)
                                          setRecipientDebt(0)
                                          setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 })
                                          setShowPaymentModal(true)
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Tahrirlash"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => removePayment(payment._id || payment.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="O'chirish"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Types Tab */}
            {activeTab === 'types' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <>
                    {/* Add Type Button */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => {
                          setEditingType(null)
                          setTypeForm({ name: '', code: '', dk: 'credit', description: '' })
                          setShowTypeModal(true)
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-lg shadow-green-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        Yangi Tur
                      </button>
                    </div>

                    {/* Types Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTypes.map((type) => (
                        <div
                          key={type._id || type.id}
                          className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                type.dk === 'credit' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                <DollarSign className={`w-5 h-5 ${
                                  type.dk === 'credit' ? 'text-green-600' : 'text-red-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900">{type.name}</h3>
                                <p className="text-xs text-slate-500 font-mono">{type.code}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              type.dk === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {type.dk === 'credit' ? 'Kirim' : 'Chiqim'}
                            </span>
                          </div>
                          {type.description && (
                            <p className="text-sm text-slate-600 mb-3">{type.description}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingType(type)
                                setTypeForm({
                                  name: type.name,
                                  code: type.code,
                                  dk: type.dk,
                                  description: type.description || ''
                                })
                                setShowTypeModal(true)
                              }}
                              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              Tahrirlash
                            </button>
                            <button
                              onClick={() => handleDeleteType(type._id || type.id)}
                              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              O'chirish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <>
                    {/* Add Staff Button */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => {
                          setStaffForm({
                            name: '',
                            phone: '',
                            password: '',
                            role: 'staff',
                            jobTitle: '',
                            hireDate: new Date().toISOString().slice(0, 10),
                            specialization: ''
                          })
                          setShowStaffModal(true)
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium shadow-lg shadow-purple-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        Xodim Qo'shish
                      </button>
                    </div>

                    {/* Staff Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Xodim</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lavozim</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Telefon</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Holat</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amallar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStaff.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                                  <div className="flex flex-col items-center gap-3">
                                    <Users className="w-12 h-12 text-slate-300 mx-auto" />
                                    <p className="text-sm font-medium text-slate-500">Xodimlar yo'q</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredStaff.map((staffMember) => (
                                <tr key={staffMember._id || staffMember.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-normal">
                                        {staffMember.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                                      </div>
                                      <div>
                                        <p className="text-sm font-normal text-slate-900">{staffMember.name}</p>
                                        {staffMember.specialization && (
                                          <p className="text-xs text-slate-500">{staffMember.specialization}</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-700">{staffMember.jobTitle || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                                      {staffMember.role || 'staff'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">{staffMember.phone || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                      staffMember.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {staffMember.status || 'active'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => {
                                          setSelectedStaff(staffMember)
                                          setShowSalaryModal(true)
                                        }}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Maosh"
                                      >
                                        <DollarSign className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleViewHistory(staffMember)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Tarix"
                                      >
                                        <Clock className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setStaffForm({
                                            name: staffMember.name,
                                            phone: staffMember.phone,
                                            password: '',
                                            role: staffMember.role,
                                            jobTitle: staffMember.jobTitle,
                                            hireDate: staffMember.hireDate?.split('T')[0] || new Date().toISOString().slice(0, 10),
                                            specialization: staffMember.specialization || ''
                                          })
                                          setSelectedStaff(staffMember)
                                          setShowStaffModal(true)
                                        }}
                                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                        title="Tahrir"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteStaff(staffMember)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="O'chir"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => loadReport('daily')}
                    className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left"
                  >
                    <Calendar className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">Kunlik Hisobot</h3>
                    <p className="text-sm text-slate-500">Bugungi to'lovlar xulosasi</p>
                  </button>
                  <button
                    onClick={() => loadReport('monthly')}
                    className="p-6 bg-white rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-all text-left"
                  >
                    <FileText className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">Oylik Hisobot</h3>
                    <p className="text-sm text-slate-500">Bu oyning to'lovlar xulosasi</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-slate-900">
                    {editingPayment ? 'To\'lovni Tahrirlash' : 'Yangi To\'lov'}
                  </h2>
                  <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {Object.keys(formErrors).length > 0 && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Iltimos, quyidagi xatolarni to'g'irlang:</span>
                    </div>
                    <ul className="mt-2 ml-7 text-sm text-red-600 list-disc space-y-1">
                      {Object.values(formErrors).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Turi *</label>
                      <select
                        value={paymentForm.type}
                        onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          formErrors.type ? 'border-red-500 bg-red-50' : 'border-slate-200'
                        }`}
                        required
                      >
                        <option value="">Tanlang</option>
                        {paymentTypes.map((t) => (
                          <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                        ))}
                      </select>
                      {formErrors.type && <p className="mt-1 text-xs text-red-600">{formErrors.type}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Summa (UZS) *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={amountInput}
                          onChange={handleAmountChange}
                          disabled={isSubmitting}
                          className={`flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            formErrors.amount ? 'border-red-500 bg-red-50' : 'border-slate-200'
                          }`}
                          placeholder="1,000,000"
                          required
                        />
                        {selectedRecipient && recipientDebtInfo.lastPayment > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const lastPayment = recipientDebtInfo.lastPayment.toString()
                              setAmountInput(formatNumber(lastPayment))
                              setPaymentForm({ ...paymentForm, amount: lastPayment })
                            }}
                            disabled={isSubmitting}
                            className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Oldingi summa"
                          >
                            <Clock className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {formErrors.amount && <p className="mt-1 text-xs text-red-600">{formErrors.amount}</p>}
                      {selectedRecipient && recipientDebtInfo.lastPayment > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-slate-500">Oldingi:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const lastPayment = recipientDebtInfo.lastPayment.toString()
                              setAmountInput(formatNumber(lastPayment))
                              setPaymentForm({ ...paymentForm, amount: lastPayment })
                            }}
                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                            title="Oldingi summa bilan to'ldirish"
                          >
                            {formatNumber(recipientDebtInfo.lastPayment)} UZS
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Oy *</label>
                      <input
                        type="month"
                        value={paymentForm.month}
                        onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sana *</label>
                      <input
                        type="date"
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                  </div>

                  {/* Recipient Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kim uchun to'lov *</label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { value: 'teacher', label: "O'qituvchi", icon: GraduationCap, color: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100' },
                        { value: 'staff', label: 'Xodim', icon: Building2, color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
                        { value: 'student', label: "O'quvchi", icon: UserPlus, color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
                      ].map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => {
                            setRecipientCategory(cat.value)
                            setSelectedGroup(null)
                            setRecipientSearch('')
                            setPaymentForm({ ...paymentForm, toWho: '' })
                            setSelectedRecipient(null)
                            setRecipientDebt(0)
                            setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 })
                          }}
                          disabled={isSubmitting}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            recipientCategory === cat.value
                              ? cat.color + ' ring-2 ring-offset-1'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <cat.icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Group Selection for Students */}
                    {recipientCategory === 'student' && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Guruhni tanlang (ixtiyoriy)</label>
                        <select
                          value={selectedGroup?.id || selectedGroup?._id || ''}
                          onChange={(e) => {
                            const group = groups.find(g => (g.id === e.target.value || g._id === e.target.value))
                            setSelectedGroup(group || null)
                          }}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Barcha guruhlar</option>
                          {groups.map((g) => (
                            <option key={g.id || g._id} value={g.id || g._id}>
                              {g.name} ({g.currentStudents || g.students?.length || 0} ta o'quvchi)
                            </option>
                          ))}
                        </select>
                        {selectedGroup && (
                          <p className="text-xs text-slate-500 mt-1">
                            Tanlangan: {selectedGroup.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recipient Search and Selection */}
                    {recipientCategory && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {recipientCategory === 'teacher' && "O'qituvchini"}
                          {recipientCategory === 'staff' && 'Xodimni'}
                          {recipientCategory === 'student' && "O'quvchini"}
                          {' '}tanlang *
                        </label>
                        <div className="relative mb-2">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Qidirish..."
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className={`max-h-48 overflow-y-auto border rounded-xl ${
                          formErrors.toWho ? 'border-red-500 bg-red-50' : 'border-slate-200'
                        }`}>
                          {getFilteredRecipients().length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">
                              Topilmadi
                            </div>
                          ) : (
                          getFilteredRecipients().map((person) => {
  const personId = person._id || person.id
  const isSelected = paymentForm.toWho === personId  // ← ID bilan solishtir

  return (
    <button
      key={personId}
      type="button"
      onClick={() => {
        setPaymentForm({ ...paymentForm, toWho: personId, amount: '' })
        setAmountInput('')
        setSelectedRecipient(person)
        const debtInfo = calculateRecipientDebt(person)
        setRecipientDebt(debtInfo.debt)
        setRecipientDebtInfo(debtInfo)
        setFormErrors({ ...formErrors, toWho: null })
      }}
      disabled={isSubmitting}
      className={`w-full text-left px-4 py-2.5 border-b border-slate-100 last:border-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isSelected
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'hover:bg-slate-50 text-slate-700'
      }`}

                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-slate-600">
                                          {person.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-normal">{person.name}</p>
                                        {person.phone && <p className="text-xs text-slate-400">{person.phone}</p>}
                                        {person.jobTitle && <p className="text-xs text-slate-400">{person.jobTitle}</p>}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                        <X className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                        {formErrors.toWho && <p className="mt-1 text-xs text-red-600">{formErrors.toWho}</p>}

                        {paymentForm.toWho && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-blue-700">
                                    {paymentForm.toWho?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-normal text-blue-900">{paymentForm.toWho}</p>
                                  <p className="text-xs text-blue-600">Tanlangan</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setRecipientSearch('')
                                  setPaymentForm({ ...paymentForm, toWho: '' })
                                  setSelectedRecipient(null)
                                  setRecipientDebt(0)
                                  setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 })
                                }}
                                disabled={isSubmitting}
                                className="p-1 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <X className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>

                            {/* Debt Display */}
                            {(recipientCategory === 'staff' || recipientCategory === 'teacher') && selectedRecipient && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      <div className="bg-white rounded-lg p-2">
                                        <p className="text-xs text-slate-500">Oylik maosh</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                          {Number(recipientDebtInfo.salary).toLocaleString()} UZS
                                        </p>
                                      </div>
                                      <div className="bg-white rounded-lg p-2">
                                        <p className="text-xs text-slate-500">To'langan</p>
                                        <p className="text-sm font-semibold text-green-600">
                                          {Number(recipientDebtInfo.paid).toLocaleString()} UZS
                                        </p>
                                      </div>
                                      <div className="bg-blue-600 rounded-lg p-2">
                                        <p className="text-xs text-blue-100">Qarzdorlik</p>
                                        <p className="text-sm font-semibold text-white">
                                          {Number(recipientDebt).toLocaleString()} UZS
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    {recipientDebt > 0 ? (
                                      <p className="text-xs text-blue-700">
                                        💳 Yana <span className="font-semibold">{Number(recipientDebt).toLocaleString()} UZS</span> to'lash kerak
                                      </p>
                                    ) : (
                                      <p className="text-xs text-green-700">
                                        ✓ Barcha maosh to'langan
                                      </p>
                                    )}
                                  </div>
                                  {recipientDebt > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPaymentForm({ ...paymentForm, amount: recipientDebt.toString() })
                                        setAmountInput(formatNumber(recipientDebt.toString()))
                                      }}
                                      disabled={isSubmitting}
                                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      Summani to'ldirish
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Izoh</label>
                    <textarea
                      value={paymentForm.comment}
                      onChange={(e) => setPaymentForm({ ...paymentForm, comment: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      rows={3}
                      placeholder="Qo'shimcha izoh..."
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : (
                      editingPayment ? 'Yangilash' : 'Saqlash'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Type Modal */}
      <AnimatePresence>
        {showTypeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTypeModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-slate-900">
                    {editingType ? 'To\'lov Turini Tahrirlash' : 'Yangi To\'lov Turi'}
                  </h2>
                  <button onClick={() => setShowTypeModal(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {Object.keys(typeFormErrors).length > 0 && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Iltimos, quyidagi xatolarni to'g'irlang:</span>
                    </div>
                    <ul className="mt-2 ml-7 text-sm text-red-600 list-disc space-y-1">
                      {Object.values(typeFormErrors).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nomi *</label>
                    <input
                      type="text"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      disabled={isSubmittingType}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        typeFormErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="Oylik to'lov"
                      required
                    />
                    {typeFormErrors.name && <p className="mt-1 text-xs text-red-600">{typeFormErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kod</label>
                    <input
                      type="text"
                      value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                      disabled={isSubmittingType}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="salary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Turi *</label>
                    <select
                      value={typeForm.dk}
                      onChange={(e) => setTypeForm({ ...typeForm, dk: e.target.value })}
                      disabled={isSubmittingType}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="credit">Kredit (Kirim)</option>
                      <option value="debit">Debit (Chiqim)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Izoh</label>
                    <textarea
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                      disabled={isSubmittingType}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      rows={3}
                      placeholder="Tavsif..."
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowTypeModal(false)}
                    disabled={isSubmittingType}
                    className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSaveType}
                    disabled={isSubmittingType}
                    className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingType ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : (
                      editingType ? 'Yangilash' : 'Saqlash'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStaffModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-slate-900">
                    {selectedStaff ? 'Xodimni Tahrirlash' : 'Yangi Xodim'}
                  </h2>
                  <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {Object.keys(staffFormErrors).length > 0 && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Iltimos, quyidagi xatolarni to'g'irlang:</span>
                    </div>
                    <ul className="mt-2 ml-7 text-sm text-red-600 list-disc space-y-1">
                      {Object.values(staffFormErrors).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ism *</label>
                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      disabled={isSubmittingStaff}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        staffFormErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="Ali Karimov"
                      required
                    />
                    {staffFormErrors.name && <p className="mt-1 text-xs text-red-600">{staffFormErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefon *</label>
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      disabled={isSubmittingStaff}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        staffFormErrors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="+998901234567"
                      required
                    />
                    {staffFormErrors.phone && <p className="mt-1 text-xs text-red-600">{staffFormErrors.phone}</p>}
                  </div>

                  {!selectedStaff && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Parol *</label>
                      <input
                        type="password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        disabled={isSubmittingStaff}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          staffFormErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-200'
                        }`}
                        placeholder="•••••••••"
                        required
                      />
                      {staffFormErrors.password && <p className="mt-1 text-xs text-red-600">{staffFormErrors.password}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Lavozim</label>
                    <input
                      type="text"
                      value={staffForm.jobTitle}
                      onChange={(e) => setStaffForm({ ...staffForm, jobTitle: e.target.value })}
                      disabled={isSubmittingStaff}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Manager, Accountant"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      disabled={isSubmittingStaff}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="assistant">Assistant</option>
                      <option value="supporter">Supporter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ishga qabul qilingan sana</label>
                    <input
                      type="date"
                      value={staffForm.hireDate}
                      onChange={(e) => setStaffForm({ ...staffForm, hireDate: e.target.value })}
                      disabled={isSubmittingStaff}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mutaxassislik</label>
                    <input
                      type="text"
                      value={staffForm.specialization}
                      onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                      disabled={isSubmittingStaff}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="IT, Accounting"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowStaffModal(false)}
                    disabled={isSubmittingStaff}
                    className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSaveStaff}
                    disabled={isSubmittingStaff}
                    className="flex-1 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingStaff ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : (
                      selectedStaff ? 'Yangilash' : 'Qo\'shish'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Salary Modal */}
      <AnimatePresence>
        {showSalaryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSalaryModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-slate-900">
                    {selectedStaff?.name} - Maosh Belgilash
                  </h2>
                  <button onClick={() => setShowSalaryModal(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {Object.keys(salaryFormErrors).length > 0 && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Iltimos, quyidagi xatolarni to'g'irlang:</span>
                    </div>
                    <ul className="mt-2 ml-7 text-sm text-red-600 list-disc space-y-1">
                      {Object.values(salaryFormErrors).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Oy *</label>
                    <input
                      type="month"
                      value={salaryForm.month}
                      onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                      disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Oylik Maosh (UZS) *</label>
                    <input
                      type="number"
                      value={salaryForm.monthlySalary}
                      onChange={(e) => setSalaryForm({ ...salaryForm, monthlySalary: e.target.value })}
                      disabled={isSubmittingSalary}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        salaryFormErrors.monthlySalary ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="5000000"
                      required
                    />
                    {salaryFormErrors.monthlySalary && <p className="mt-1 text-xs text-red-600">{salaryFormErrors.monthlySalary}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Boshlanish sanasi</label>
                    <input
                      type="date"
                      value={salaryForm.startDate}
                      onChange={(e) => setSalaryForm({ ...salaryForm, startDate: e.target.value })}
                      disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Izoh</label>
                    <textarea
                      value={salaryForm.comment}
                      onChange={(e) => setSalaryForm({ ...salaryForm, comment: e.target.value })}
                      disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      rows={2}
                      placeholder="Qo'shimcha izoh..."
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowSalaryModal(false)}
                    disabled={isSubmittingSalary}
                    className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSaveSalary}
                    disabled={isSubmittingSalary}
                    className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingSalary ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : (
                      'Saqlash'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Salary History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedStaff && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-slate-900">
                    {selectedStaff.name} - Maosh Tarixi
                  </h2>
                  <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-200 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {salaryHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium">Maosh tarixi yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {salaryHistory.map((record, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">{record.month}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(record.startDate || record.createdAt).toLocaleDateString('uz-UZ')}
                              </p>
                            </div>
                            <p className="text-lg font-semibold text-green-600">
                              {Number(record.monthlySalary).toLocaleString()} UZS
                            </p>
                          </div>
                          {record.comment && (
                            <p className="text-sm text-slate-600">{record.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="w-full px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    Yopish
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
