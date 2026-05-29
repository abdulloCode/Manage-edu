import api from './axios'

export const getMyTeacherData     = ()       => api.get('/teachers/me/data')
export const getMyTeacherGroups   = ()       => api.get('/teachers/me/groups')
export const getMyTeacherPayments = ()       => api.get('/teachers/me/payments')
export const getTeacherPayments   = (id)     => api.get(`/teachers/${id}/payments`)
export const getAvailableTeachers = ({ days, time }) =>
  api.get('/teachers/hastime', { params: { days, time } })