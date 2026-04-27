import api from './axios'

export const getStudents         = (params)       => api.get('/students', { params })
export const getStudentById      = (id)           => api.get(`/students/${id}`)
export const createStudent       = (data)         => api.post('/students', data)
export const updateStudent       = (id, data)     => api.put(`/students/${id}`, data)
export const deleteStudent       = (id)           => api.delete(`/students/${id}`)
export const getMyStudentData = () => api.get('/auth/me')
export const assignStudentGroup  = (studentId, groupId) => api.post(`/groups/${groupId}/students`, { studentId })