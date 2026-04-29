import api from './axios'

export const getAllAttendances  = (params) => api.get('/attendance', { params })


export const getAttendanceById = (id) => api.get(`/attendance/${id}`)

export const createAttendance  = (body) => api.post('/attendance', body)


export const updateAttendance  = (id, body) => api.put(`/attendance/${id}`, body)


export const deleteAttendance  = (id) => api.delete(`/attendance/${id}`)


export const getAttendanceByDate = (date) => api.get(`/attendance/date/${date}`)


export const getGroupAttendanceCalendar = (groupId, params) =>
  api.get(`/attendance/group/${groupId}/calendar`, { params })


export const updateGroupDayAttendance = (groupId, body) =>
  api.put(`/attendance/group/${groupId}/day`, body)
export const getMyAttendance = () => api.get('/attendance/me/attendance')
