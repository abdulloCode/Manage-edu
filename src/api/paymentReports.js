import api from './axios'

export const getPaymentTypeReport = (params) =>
  api.get('/payment-type-reports', { params })
  