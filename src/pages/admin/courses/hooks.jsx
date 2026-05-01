import { useState, useEffect } from "react";
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../../api/courses";

// ─── Admin Courses Hook ────────────────────────────────────────
export function useAdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await getAllCourses({ search });
      setCourses(res.data.data || res.data || []);
    } catch (err) {
      console.error("Kurslar yuklanmadi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [search]);

  return {
    courses,
    loading,
    search,
    setSearch,
    loadCourses,
  };
}

// ─── Admin Course Form Hook ───────────────────────────────────
export function useAdminCourseForm() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    syllabus: "",
  });

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      syllabus: "",
    });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name || course.title || "",
      description: course.description || "",
      price: course.price?.toString() || "",
      duration: course.duration || "",
      syllabus: course.syllabus || "",
    });
    setShowModal(true);
  };

  const openDeleteModal = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowModal(false);
    setShowDeleteModal(false);
    setEditingCourse(null);
    setCourseToDelete(null);
  };

  return {
    showModal,
    showDeleteModal,
    editingCourse,
    courseToDelete,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
  };
}

// ─── Admin Course Actions ───────────────────────────────────────
export async function saveAdminCourse(course, formData, loadCourses) {
  if (!formData.name || !formData.price || !formData.duration) {
    alert("Nomi, Narx va Davomiylik kiritilishi shart!");
    return false;
  }

  try {
    const dataToSend = {
      title: formData.name.trim(),
      description: formData.description.trim() || "",
      price: Number(formData.price),
      duration: formData.duration.trim(),
      syllabus: formData.syllabus.trim() || "",
    };

    if (course) {
      const id = course._id || course.id;
      await updateCourse(id, dataToSend);
    } else {
      await createCourse(dataToSend);
    }

    return true;
  } catch (err) {
    if (err?.response?.status !== 404) {
      alert(err.response?.data?.message || "Server xatosi");
    }
    return false;
  }
}

export async function deleteAdminCourse(course, loadCourses) {
  if (!window.confirm("Kursni o'chirishni tasdiqlaysizmi?")) {
    return false;
  }

  try {
    const id = course._id || course.id;
    await deleteCourse(id);
    return true;
  } catch (err) {
    if (err?.response?.status !== 404) {
      alert(
        "O'chirishda xatolik: " + (err.response?.data?.message || err.message),
      );
    }
    return false;
  }
}

// ─── Legacy exports (for backward compatibility) ───────────────
export const useCourses = useAdminCourses;
export const useCourseForm = useAdminCourseForm;
export const saveCourse = saveAdminCourse;
export const removeCourse = deleteAdminCourse;
