import api from './axios'

// Teacher: guruh o'quvchilari screen time summary (oylik)
export const getGroupScreenTimeSummary = (month, groupId) =>
  api.get(`/screen-time/summary/${month}`, {
    params: groupId ? { groupId } : {},
  })

// Teacher: bitta o'quvchi kunlik records
export const getStudentScreenTime = (studentId, month) =>
  api.get(`/screen-time/student/${studentId}`, { params: { month } })

// Teacher: bitta o'quvchi oylik summary + top apps + kunlik breakdown
export const getStudentMonthlyScreenTime = (studentId, month) =>
  api.get(`/screen-time/student/${studentId}/monthly/${month}`)
