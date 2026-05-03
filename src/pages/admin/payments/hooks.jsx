import { useState, useEffect, useCallback } from 'react'
import {
  getAllPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getAllPaymentTypes,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
} from '../../../api/payments'
import {
  getAllStaff,
} from '../../../api/staff'

// ─── Helpers ─────────────────────────────────────────────────
const getId = (item) => item?._id || item?.id || null

const handleError = (message, err) => {
  const status = err?.response?.status
  if (status === 404) {
    console.error(message, err)
    return
  }
  const serverMsg = err?.response?.data?.message
  const fullMsg = serverMsg || message
  console.error(fullMsg, err)
  alert(fullMsg)
}

export function usePayments() {
  const [payments, setPayments] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    typeId: '',
    dk: ''
  })

  // ✅ loadPayments qaytarildi
  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllPayments(filters)
      setPayments(res.data.payments || res.data.data || res.data || [])
    } catch (err) {
      handleError("To'lovlar yuklanmadi", err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadPaymentTypes = useCallback(async () => {
    try {
      const res = await getAllPaymentTypes({ activeOnly: false })
      setPaymentTypes(res.data.data || res.data || [])
    } catch (err) {
      if (err.response?.status === 403) {
        handleError("Sizda to'lovlarni boshqarish uchun ruxsat yo'q", err)
      } else {
        handleError("To'lov turlari yuklanmadi", err)
      }
    }
  }, [])

  // ✅ useEffect lar hammasi useCallback lardan keyin
  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  useEffect(() => {
    loadPaymentTypes()
  }, [loadPaymentTypes])

  const loadStaff = useCallback(async () => {
    try {
      const res = await getAllStaff()
      setStaff(res.data.data || res.data || [])
    } catch (err) {
      handleError("Xodimlarni yuklashda xatolik", err)
    }
  }, [])

  return {
    payments,
    paymentTypes,
    staff,
    loading,
    filters,
    setFilters,
    loadPayments,
    loadPaymentTypes,
    loadStaff,
  }
}
// ─── usePaymentForm ───────────────────────────────────────────────────────────

export function usePaymentForm() {
  const [showModal, setShowModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [editingType, setEditingType] = useState(null)

  const defaultFormData = {
    type: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7),
    toWho: '',
    date: new Date().toISOString().slice(0, 10),
    comment: ''
  }

  const defaultTypeFormData = {
    name: '',
    code: '',
    dk: 'credit',
    description: '',
    isActive: true
  }

  const [formData, setFormData] = useState(defaultFormData)
  const [typeFormData, setTypeFormData] = useState(defaultTypeFormData)

  const openAddPaymentModal = () => {
    setEditingPayment(null)
    setFormData(defaultFormData)
    setShowModal(true)
  }

  const openEditPaymentModal = (payment) => {
    setEditingPayment(payment)
    setFormData({
      type: payment.type || '',
      amount: payment.amount || '',
      month: payment.month || new Date().toISOString().slice(0, 7),
      toWho: payment.toWho || '',
      date: payment.date || new Date().toISOString().slice(0, 10),
      comment: payment.comment || ''
    })
    setShowModal(true)
  }

  const openAddTypeModal = () => {
    setEditingType(null)
    setTypeFormData(defaultTypeFormData)
    setShowTypeModal(true)
  }

  const openEditTypeModal = (type) => {
    setEditingType(type)
    setTypeFormData({
      name: type.name || '',
      code: type.code || '',
      dk: type.dk || 'credit',
      description: type.description || '',
      isActive: type.isActive ?? true
    })
    setShowTypeModal(true)
  }

  const closeModals = () => {
    setShowModal(false)
    setShowTypeModal(false)
    setEditingPayment(null)
    setEditingType(null)
  }

  return {
    showModal,
    showTypeModal,
    editingPayment,
    editingType,
    formData,
    setFormData,
    typeFormData,
    setTypeFormData,
    openAddPaymentModal,
    openEditPaymentModal,
    openAddTypeModal,
    openEditTypeModal,
    closeModals
  }
}

// ─── Payment CRUD ─────────────────────────────────────────────────────────────

export async function savePayment(editingPayment, formData) {
  try {
    const id = getId(editingPayment)
    if (id) {
      await updatePayment(id, formData)
    } else {
      await createPayment(formData)
    }
    return true
  } catch (err) {
    handleError("To'lovni saqlashda xatolik", err)
    return false
  }
}

export async function removePayment(item) {
  const id = getId(item)
  if (!id) {
    alert("To'lov ID topilmadi")
    return false
  }
  if (!window.confirm("To'lovni o'chirishni tasdiqlaysizmi?")) return false
  try {
    await deletePayment(id)
    return true
  } catch (err) {
    handleError("To'lovni o'chirishda xatolik", err)
    return false
  }
}

// ─── PaymentType CRUD ─────────────────────────────────────────────────────────

export async function savePaymentType(editingType, typeFormData) {
  try {
    const id = getId(editingType)
    if (id) {
      await updatePaymentType(id, typeFormData)
    } else {
      await createPaymentType(typeFormData)
    }
    return true
  } catch (err) {
    handleError("To'lov turini saqlashda xatolik", err)
    return false
  }
}

export async function removePaymentType(item) {
  const id = getId(item)
  if (!id) {
    alert("To'lov turi ID topilmadi")
    return false
  }
  if (!window.confirm("To'lov turini o'chirishni tasdiqlaysizmi?")) return false
  try {
    await deletePaymentType(id)
    return true
  } catch (err) {
    handleError("To'lov turini o'chirishda xatolik", err)
    return false
  }
}

// ─── Staff CRUD ───────────────────────────────────────────────────────────────

export async function saveStaff(editingStaff, staffData) {
  try {
    const id = getId(editingStaff)
    if (id) {
      await updateStaff(id, staffData)
    } else {
      await createStaff(staffData)
    }
    return true
  } catch (err) {
    handleError('Xodimni saqlashda xatolik', err)
    return false
  }
}

export async function removeStaff(item) {
  const id = getId(item)
  if (!id) {
    alert('Xodim ID topilmadi')
    return false
  }
  if (!window.confirm("Xodimni o'chirishni tasdiqlaysizmi?")) return false
  try {
    await deleteStaff(id)
    return true
  } catch (err) {
    handleError("Xodimni o'chirishda xatolik", err)
    return false
  }
}

// ─── Staff Salary ─────────────────────────────────────────────────────────────

export async function saveStaffSalary(staffItem, formData) {
  const staffId = getId(staffItem)
  if (!staffId) {
    alert('Xodim ID topilmadi')
    return false
  }
  try {
    const data = {
      month: formData.month,
      monthlySalary: Number(formData.monthlySalary),
      startDate: formData.startDate || undefined,
      comment: formData.comment || ''
    }
    await setStaffSalary(staffId, data)
    return true
  } catch (err) {
    handleError('Maosh belgilashda xatolik', err)
    return false
  }
}

export async function getStaffSalaryHistoryData(staffItem) {
  const staffId = getId(staffItem)
  if (!staffId) {
    alert('Xodim ID topilmadi')
    return []
  }
  try {
    const res = await getStaffSalaryHistory(staffId)
    return res.data.data || res.data || []
  } catch (err) {
    handleError('Maosh tarixini yuklashda xatolik', err)
    return []
  }
}