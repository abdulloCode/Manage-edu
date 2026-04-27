import api from './axios'

export const getAllCourses    = (params) => api.get('/courses', { params })
// params: { search? }

export const getCourseById   = (id)     => api.get(`/courses/${id}`)

export const createCourse    = (body)   => api.post('/courses', body)
// body: { name, description, syllabus? }

export const updateCourse    = (id, body) => api.put(`/courses/${id}`, body)
// body: { name?, description?, syllabus? }

export const deleteCourse    = (id)     => api.delete(`/courses/${id}`)