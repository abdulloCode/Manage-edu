import api from './axios'

export const getAllGroups   = (params)     => api.get('/groups', { params })
// params: { search?, includePaymentInfo? }

export const getGroupById  = (id, params) => api.get(`/groups/${id}`, { params })
// params: { includePaymentInfo?, month? }

export const getMyGroups    = ()           => api.get('/groups/me')

export const createGroup  = (data)       => api.post('/groups', data)
// data: {
//   name, courseId, teacherId, roomId?,
//   startDate, endDate?,
//   maxStudents, monthlyFeePerStudent,
//   schedule?: { days: ["Du","Chor","Ju"], fromHour: "16:00", toHour: "18:00" }
// }

export const updateGroup   = (id, data)   => api.put(`/groups/${id}`, data)
// data: { name?, courseId?, teacherId?, roomId?, startDate?, endDate?,
//         maxStudents?, monthlyFeePerStudent?, status?,
//         schedule?: { days?, fromHour?, toHour? } }

export const deleteGroup   = (id)         => api.delete(`/groups/${id}`)

export const addStudentToGroup      = (groupId, studentId) => api.post(`/groups/${groupId}/students`, { studentId })
export const removeStudentFromGroup = (groupId, studentId) => api.delete(`/groups/${groupId}/students/${studentId}`)

export const enrollInGroup = (groupId) => api.post(`/groups/${groupId}/enroll`)


// ─── ROOMS ───────────────────────────────────────────────────

export const getAllRooms  = (params)    => api.get('/rooms', { params })
export const getRoomById = (id)        => api.get(`/rooms/${id}`)

export const createRoom  = (data)      => api.post('/rooms', data)
// data: { name, number, capacity, equipment?: [] }

export const updateRoom  = (id, data)  => api.put(`/rooms/${id}`, data)
// data: { name?, number?, capacity?, equipment?, status? }

export const deleteRoom  = (id)        => api.delete(`/rooms/${id}`)

export const getFreeRooms = ({ days, time }) => api.get('/rooms/free', { params: { days, time } })
