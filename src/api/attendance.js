import api from "./axios";

export const getMyAttendance = () => api.get("/attendance/me/attendance");
export const getGroupAttendance = (groupId, date) =>
  api.get(`/attendance/group/${groupId}?date=${date}`);
export const getGroupAttendanceCalendar = (groupId, { year, month }) =>
  api.get(`/attendance/group/${groupId}`, { params: { year, month } });
export const updateDayAttendance = (groupId, data) =>
  api.put(`/attendance/group/${groupId}/day`, data);
