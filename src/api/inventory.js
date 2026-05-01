import api from './axios'

export const getInventoryItems = (params) =>
  api.get('/inventory', { params })

export const getInventoryItem = (id) =>
  api.get(`/inventory/${id}`)

export const createInventoryItem = (data) =>
  api.post('/inventory', data)

export const updateInventoryItem = (id, data) =>
  api.put(`/inventory/${id}`, data)

export const deleteInventoryItem = (id) =>
  api.delete(`/inventory/${id}`)

export const getInventoryCategories = () =>
  api.get('/inventory/categories')
