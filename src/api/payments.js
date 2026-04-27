import api from './axios'

export const getAllPayments   = (params)     => api.get('/payments', { params })
// params: { page?, limit?, startDate?, endDate?, typeId?, dk?, toWhoId?, month? }

export const getPaymentById  = (id)         => api.get(`/payments/${id}`)

export const createPayment   = (data)       => api.post('/payments', data)
// data: { type, amount, month, toWho, date?, comment? }

export const updatePayment   = (id, data)   => api.put(`/payments/${id}`, data)
// data: { type?, amount?, date?, month?, toWho?, comment? }

export const deletePayment   = (id)         => api.delete(`/payments/${id}`)

export const getUserPayments = (id, params) => api.get(`/payments/user/${id}`, { params })
// params: { dk?: 'credit' | 'debit' }

export const getMonthlyReport = (month)     => api.get(`/payments/report/${month}`)
// month: "2026-04"

export const getMyPayments   = ()           => api.get('/payments/me/payments')


// ── Payment Types ─────────────────────────────────────────────
export const getAllPaymentTypes   = (params)   => api.get('/payment-types', { params })
// params: { activeOnly? }

export const getPaymentTypeById  = (id)        => api.get(`/payment-types/${id}`)

export const createPaymentType   = (data)      => api.post('/payment-types', data)
// data: { name, code, dk: 'credit' | 'debit', description? }

export const updatePaymentType   = (id, data)  => api.put(`/payment-types/${id}`, data)
// data: { name?, code?, dk?, description?, isActive? }

export const deletePaymentType   = (id)        => api.delete(`/payment-types/${id}`)

export const initializePaymentTypes = ()       => api.post('/payment-types/initialize')


// ── Payment Calculations ──────────────────────────────────────
export const getStudentDailyPayment    = (studentId, date)  => api.get(`/payment-calculations/student/${studentId}/daily/${date}`)
export const getStudentMonthlyPayment  = (studentId, month) => api.get(`/payment-calculations/student/${studentId}/monthly/${month}`)

export const getTeacherDailySalary     = (teacherId, date)  => api.get(`/payment-calculations/teacher/${teacherId}/daily/${date}`)
export const getTeacherMonthlySalary   = (teacherId, month) => api.get(`/payment-calculations/teacher/${teacherId}/monthly/${month}`)

export const getAllStudentsDailyPayments  = (date) => api.get(`/payment-calculations/students/daily/${date}`)
export const getAllTeachersDailySalaries  = (date) => api.get(`/payment-calculations/teachers/daily/${date}`)
export const getDailyFinancialSummary    = (date) => api.get(`/payment-calculations/summary/daily/${date}`)


// ── Payment Reports ───────────────────────────────────────────
export const getPaymentReport      = (params)  => api.get('/payment-reports', { params })
// params: { startDate?, endDate?, groupingBy?: 'type'|'month'|'toWho', typeId? }

export const getDailyPaymentReport   = (date)  => api.get(`/payment-reports/daily/${date}`)
export const getMonthlyPaymentReport = (month) => api.get(`/payment-reports/monthly/${month}`)
export const getUserPaymentReport    = (userId, params) => api.get(`/payment-reports/user/${userId}`, { params })
// params: { startDate?, endDate? }