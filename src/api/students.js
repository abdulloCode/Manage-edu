import api from "./axios";

// 1. O'quvchilarni olish (Barcha filtrlar qo'shildi: courseId, hasGroup, search)
export const getStudents = (params) => api.get("/students", { params });
/* 
   params ichida quyidagilar bo'ladi:
   - search: ism, tel yoki ota-ona teli bo'yicha qidiruv
   - courseId: ma'lum bir kursga yozilganlar
   - hasGroup: "true" yoki "false" (guruhga biriktirilganlik holati)
*/

export const getStudentById = (id) => api.get(`/students/${id}`);

// 2. O'quvchi yaratish (Endi parentPhone va courseId majburiy yuboriladi)
export const createStudent = (data) => api.post("/students", data);

// 3. O'quvchi ma'lumotlarini yangilash (Ota-ona telini ham o'zgartirish mumkin)
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);

export const deleteStudent = (id) => api.delete(`/students/${id}`);

// 4. O'quvchini guruhga biriktirish
export const assignStudentGroup = (id, groupId) =>
  api.post(`/students/${id}/assign-group`, { groupId });

export const getMyStudentData = () => api.get("/students/me/data");