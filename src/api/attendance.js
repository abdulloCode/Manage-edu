import api from "./axios";

export const getMyAttendance = () => api.get("/attendance/me/attendance");
export const getGroupAttendance = (groupId, date) =>
  api.get(`/attendance/group/${groupId}?date=${date}`);
export const getGroupAttendanceCalendar = (groupId, { year, month }) =>
  api.get(`/attendance/group/${groupId}`, { params: { year, month } });
export const updateDayAttendance = (groupId, data) =>
  api.put(`/attendance/group/${groupId}/day`, data);
export const getAllAttendances = (params) => api.get("/attendance", { params });

export const getAttendanceById = (id) => api.get(`/attendance/${id}`);

export const createAttendance = (body) => api.post("/attendance", body);

export const updateAttendance = (id, body) =>
  api.put(`/attendance/${id}`, body);

export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);

export const getAttendanceByDate = (date) =>
  api.get(`/attendance/date/${date}`);

export const updateGroupDayAttendance = (groupId, body) =>
  api.put(`/attendance/group/${groupId}/day`, body);
