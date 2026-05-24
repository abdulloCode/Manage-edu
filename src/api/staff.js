import api from './axios'

export const getAllStaff   = (params)    => api.get('/staff', { params })
// params: { role?, status?, search? }
// role: 'supporter' | 'staff' | 'manager' | 'assistant'

export const getStaffById = (id)        => api.get(`/staff/${id}`)

export const createStaff  = (data)      => api.post('/staff', data)
// data: { name, phone, password, role, jobTitle?, hireDate?, specialization? }

export const updateStaff  = (id, data)  => api.put(`/staff/${id}`, data)
// data: { name?, phone?, email?, password?, jobTitle?, hireDate?, specialization?, status? }

export const deleteStaff  = (id)        => api.delete(`/staff/${id}`)

// ── Maosh ─────────────────────────────────────────────────────
export const setStaffSalary        = (id, data)  => api.post(`/staff/${id}/salary`, data)
// data: { month, monthlySalary, startDate?, comment? }

export const getStaffSalary        = (id, params) => api.get(`/staff/${id}/salary`, { params })
// params: { month? }  — month: "2026-04"

export const getStaffSalaryHistory = (id)         => api.get(`/staff/${id}/salary-history`)

export const getStaffDailySalaries = (date)       => api.get(`/staff/daily-salaries/${date}`)
export const getStaffPages   = ()         => api.get('/staff/pages');
export const getStaffBalance = (id)        => api.get(`/staff/${id}/balance`);