import api from './axios'

export const getAllRatings   = ()          => api.get('/ratings')
export const getRatingById  = (id)        => api.get(`/ratings/${id}`)
export const createRating   = (data)      => api.post('/ratings', data)
// data: { studentId, score, comment?, teacherId }

export const updateRating   = (id, data)  => api.put(`/ratings/${id}`, data)
// data: { score?, comment? }

export const deleteRating   = (id)        => api.delete(`/ratings/${id}`)

// ── Student o'z baholarini ko'radi ───────────────────────────
export const getMyRatings   = ()          => api.get('/ratings/me/ratings')

// ── Guruh oylik baho kalendari ───────────────────────────────
export const getGroupRatingCalendar = (groupId, { year, month }) =>
  api.get(`/ratings/group/${groupId}/calendar`, { params: { year, month } })

// ── Kunlik baho qo'yish 
export const upsertDayRating = (groupId, { studentId, day, month, year, score, comments }) =>
  api.put(`/ratings/group/${groupId}/day`, { studentId, day, month, year, score, comments })