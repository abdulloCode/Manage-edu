import api from './axios'

export const getTeacherBalanceReport = (params) =>
  api.get('/balance-reports/teachers', { params })

export const getStudentBalanceReport = (params) =>
  api.get('/balance-reports/students', { params })

export const getStaffBalanceReport = (params) =>
  api.get('/balance-reports/staff', { params })
