import api from './axios'

export const getAllTeachers     = (params)   => api.get('/teachers', { params })
// params: { page?, limit?, search? }

export const getTeacherById    = (id)        => api.get(`/teachers/${id}`)

export const createTeacher     = (data)      => api.post('/teachers', data)
// data: { name, phone, password, qualification, salaryPercentage, email? }

export const updateTeacher     = (id, data)  => api.put(`/teachers/${id}`, data)
// data: { name?, phone?, email?, password?, qualification?, salaryPercentage? }

export const deleteTeacher     = (id)        => api.delete(`/teachers/${id}`)

export const getAvailableTeachers = ({ days, time }) =>
  api.get('/teachers/hastime', { params: { days, time } })
