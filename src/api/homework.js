import api from './axios'

export const getAllHomework   = ()         => api.get('/homework')
export const getMyHomework   = ()         => api.get('/homework')          // /me ObjectId xatosi bor
export const getHomeworkById = (id)       => api.get(`/homework/${id}`)
export const submitHomework  = (id, data) => api.post(`/homework/${id}/submit`, data)
export const getMySubmissions = ()        => api.get('/homework/submissions')
