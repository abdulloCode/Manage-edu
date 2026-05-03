import api from './axios'

export const getMyTeacherData = () => api.get('/teachers/me/data')
export const getMyTeacherGroups = () => api.get('/teachers/me/groups')
export const getAvailableTeachers = ({ days, time }) =>
  api.get('/teachers/hastime', { params: { days, time } })