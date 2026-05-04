import { useState, useEffect } from "react";
import { useToast } from "../../../components/Toast";
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getGroupById,
  addStudentToGroup,
} from "../../../api/groups";
import { getAllTeachers } from "../../../api/teacher";
import { getAllCourses } from "../../../api/courses";
import { getStudents, getStudentById } from "../../../api/students";

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("groups");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

const loadGroups = async () => {
  setLoading(true);
  try {
    const [groupsRes, coursesRes] = await Promise.all([
      getAllGroups({ search }),
      getAllCourses(),
    ]);

    const groupsData = groupsRes.data.data || groupsRes.data || [];
    const allCourses = coursesRes.data.data || coursesRes.data || [];

    const groupsWithCourse = groupsData.map((group) => {
      // courseId orqali kurs topish
      const course = allCourses.find(
        (c) => (c._id || c.id) === group.courseId
      );
      return {
        ...group,
        students: group.studentIds || [],
        course: course || group.course || null,
      };
    });

    setGroups(groupsWithCourse);
  } catch (err) {
    console.error("Guruhlar yuklanmadi:", err);
  } finally {
    setLoading(false);
  }
};

  const loadRooms = async () => {
    try {
      const res = await getAllRooms();
      setRooms(res.data.data || res.data || []);
    } catch (err) {
      console.error("Xonalar yuklanmadi:", err);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await getAllTeachers();
      setTeachers(res.data.data || res.data || []);
    } catch (err) {
      console.error("O'qituvchilar yuklanmadi:", err);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await getAllCourses();
      setCourses(res.data.data || res.data || []);
    } catch (err) {
      console.error("Kurslar yuklanmadi:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "groups") {
      loadGroups();
      loadTeachers();
      loadCourses();
      loadRooms();
    } else {
      loadRooms();
    }
  }, [activeTab, search]);

  const totalPages =
    activeTab === "groups"
      ? Math.ceil(groups.length / itemsPerPage)
      : Math.ceil(rooms.length / itemsPerPage);

  const paginatedGroups = groups.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const paginatedRooms = rooms.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  return {
    groups,
    rooms,
    teachers,
    courses,
    loading,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    page,
    setPage,
    itemsPerPage,
    totalPages,
    paginatedGroups,
    paginatedRooms,
    loadGroups,
    loadRooms,
    loadTeachers,
    loadCourses,
  };
}

export function useGroupForm(teachers, courses, rooms) {
  const [showModal, setShowModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStudentsView, setShowStudentsView] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("group");

  const [formData, setFormData] = useState({
    name: "",
    courseId: "",
    teacherId: "",
    roomId: "",
    startDate: "",
    endDate: "",
    maxStudents: "",
    monthlyFeePerStudent: "",
    schedule: {
      days: [],
      fromHour: "",
      toHour: "",
    },
  });

  // ← BU YO'Q EDI
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    number: "",
    capacity: "",
    equipment: "",
  });

  const openAddGroupModal = () => {
    setEditingGroup(null);
    setFormData({
      name: "",
      courseId: "",
      teacherId: "",
      roomId: "",
      startDate: "",
      endDate: "",
      maxStudents: "",
      monthlyFeePerStudent: "",
      schedule: {
        days: [],
        fromHour: "",
        toHour: "",
      },
    });
    setShowModal(true);
  };

  const openEditGroupModal = (group) => {
  setEditingGroup(group);
  // openEditGroupModal ichida, setFormData dan oldin
console.log("group:", group);
console.log("courses:", courses);
console.log("resolved courseId:", 
  (typeof group.courseId === 'object' 
    ? group.courseId?._id || group.courseId?.id 
    : group.courseId) 
  || group.course?._id || group.course?.id
);
  setFormData({
    name: group.name || "",
    // courseId yo'q bo'lsa, course obyektidan olish
    courseId: group.courseId || group.course?._id || group.course?.id || "",
    teacherId: group.teacherId || group.teacher?._id || group.teacher?.id || "",
    roomId: group.roomId || group.room?._id || group.room?.id || "",
    startDate: group.startDate ? group.startDate.slice(0, 10) : "",
    endDate: group.endDate ? group.endDate.slice(0, 10) : "",
    maxStudents: group.maxStudents || "",
    monthlyFeePerStudent: group.monthlyFeePerStudent || "",
    schedule: group.schedule || {
      days: [],
      fromHour: "",
      toHour: "",
    },
  });
  setShowModal(true);
};

  // ← BU HAM YO'Q EDI
  const openAddRoomModal = () => {
    setEditingRoom(null);
    setRoomFormData({
      name: "",
      number: "",
      capacity: "",
      equipment: "",
    });
    setShowRoomModal(true);
  };

  const openEditRoomModal = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      name: room.name || "",
      number: room.number || "",
      capacity: room.capacity || "",
      equipment: room.equipment ? room.equipment.join(", ") : "",
    });
    setShowRoomModal(true);
  };

  const openDeleteModal = (item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowModal(false);
    setShowRoomModal(false);
    setShowDeleteModal(false);
    setEditingGroup(null);
    setEditingRoom(null);
    setItemToDelete(null);
  };

  return {
    showModal,
    showRoomModal,
    showDeleteModal,
    showStudentsView,
    selectedGroup,
    groupStudents,
    loadingStudents,
    editingGroup,
    editingRoom,
    itemToDelete,
    deleteType,
    formData,
    setFormData,
    roomFormData,
    setRoomFormData,
    openAddGroupModal,
    openEditGroupModal,
    openAddRoomModal,
    openEditRoomModal,
    openDeleteModal,
    closeModals,
    setShowStudentsView,
    setSelectedGroup,
    setGroupStudents,
    setLoadingStudents,
  };
}
export async function saveGroup(group, formData, showToast = null) {
  try {
    const dataToSend = {
      name: formData.name,
    };

    if (formData.courseId) dataToSend.courseId = formData.courseId;
    if (formData.teacherId) dataToSend.teacherId = formData.teacherId;
    if (formData.roomId) dataToSend.roomId = formData.roomId;
    if (formData.startDate) dataToSend.startDate = formData.startDate;
    if (formData.endDate) dataToSend.endDate = formData.endDate;
    if (formData.maxStudents) dataToSend.maxStudents = formData.maxStudents;
    if (formData.monthlyFeePerStudent)
      dataToSend.monthlyFeePerStudent = formData.monthlyFeePerStudent;

    if (formData.schedule.days.length > 0) {
      dataToSend.schedule = {
        days: formData.schedule.days,
        fromHour: formData.schedule.fromHour,
        toHour: formData.schedule.toHour,
      };
    }

    if (group) {
      await updateGroup(group.id, dataToSend);
    } else {
      await createGroup(dataToSend);
    }

    return true;
  } catch (err) {
    console.error("Saqlash xatolik:", err);
    if (err?.response?.status !== 404) {
      const message = "Xatolik yuz berdi: " + (err.response?.data?.error ?? err.message ?? "Noma'lum xatolik");
      showToast(message, "error", 5000);
    }
    return false;
  }
}

export async function saveRoom(room, roomFormData, showToast = null) {
  try {
    const data = {
      ...roomFormData,
      equipment: roomFormData.equipment
        ? roomFormData.equipment.split(",").map((e) => e.trim())
        : [],
    };

    if (room) {
      await updateRoom(room.id, data);
    } else {
      await createRoom(data);
    }

    return true;
  } catch (err) {
    console.error("Saqlash xatolik:", err);
    if (err?.response?.status !== 404) {
      if (showToast) {
        showToast("Xatolik yuz berdi", "error", 5000);
      } else {
        alert("Xatolik yuz berdi");
      }
    }
    return false;
  }
}

export async function removeItem(item, type) {
  try {
    if (type === "group") {
      await deleteGroup(item.id);
    } else {
      await deleteRoom(item.id);
    }
    return true;
  } catch (err) {
    console.error("O'chirish xatolik:", err);
    return false;
  }
}

export async function addStudentToGroupApi(groupId, studentId, showToast = null) {
  try {
    await addStudentToGroup(groupId, studentId);
    return true;
  } catch (err) {
    console.error("Student qo'shish xatolik:", err);
    if (err?.response?.status !== 404) {
      const message = "Xatolik yuz berdi: " + (err.response?.data?.error ?? err.message ?? "Noma'lum xatolik");
      showToast(message, "error", 5000);
    }
    return false;
  }
}
export async function fetchAllStudents(excludeIds = []) {
  try {
    const { data } = await getStudents({ limit: 200 })
    const all = data.data || data || []
    if (excludeIds.length === 0) return all
    return all.filter(s => !excludeIds.includes(s.id || s._id))
  } catch (err) {
    console.error('Studentlarni yuklash xatolik:', err)
    return []
  }
}

export async function fetchStudentsForCourse(courseId) {
  try {
    const { data } = await getStudents({
      courseId,
      hasGroup: 'false',
      limit: 100
    })
    return data.data || data || []
  } catch (err) {
    console.error('Kurs uchun studentlarni yuklash xatolik:', err)
    return []
  }
}

export async function loadGroupStudents(group, setGroupStudents, setLoadingStudents) {
  setLoadingStudents(true)
  try {
    const res = await getGroupById(group.id || group._id, { includeStudents: true })
    const groupData = res.data.data || res.data

    let students = []

    if (groupData.students && Array.isArray(groupData.students)) {
      students = groupData.students
    } else if (groupData.studentsData && Array.isArray(groupData.studentsData)) {
      students = groupData.studentsData
    } else if (groupData.studentData && Array.isArray(groupData.studentData)) {
      students = groupData.studentData
    } else if (groupData.studentIds && Array.isArray(groupData.studentIds)) {
      students = await Promise.all(
        groupData.studentIds.map(id =>
          getStudentById(id)
            .then(res => res.data.data || res.data)
            .catch(() => ({ id, name: "Noma'lum", phone: '—' }))
        )
      )
    }

    setGroupStudents(students)
  } catch (err) {
    console.error('Xatolik:', err)
    setGroupStudents([])
  } finally {
    setLoadingStudents(false)
  }
}
export function getGroupIcon(name) {
  const icons = [
    { emoji: "👥", bg: "bg-purple-100", color: "text-purple-600" },
    { emoji: "🎓", bg: "bg-blue-100", color: "text-blue-600" },
    { emoji: "💼", bg: "bg-green-100", color: "text-green-600" },
    { emoji: "🏫", bg: "bg-orange-100", color: "text-orange-600" },
    { emoji: "📚", bg: "bg-pink-100", color: "text-pink-600" },
    { emoji: "⭐", bg: "bg-yellow-100", color: "text-yellow-600" },
  ];
  return icons[name?.charCodeAt(0) % icons.length] ?? icons[0];
}

export function getRoomIcon(name) {


  const icons = [
    { emoji: "🚪", bg: "bg-indigo-100", color: "text-indigo-600" },
    { emoji: "🏠", bg: "bg-cyan-100", color: "text-cyan-600" },
    { emoji: "🏢", bg: "bg-teal-100", color: "text-teal-600" },
    { emoji: "🏛️", bg: "bg-amber-100", color: "text-amber-600" },
  ];
  return icons[name?.charCodeAt(0) % icons.length] ?? icons[0];
}

export function handleDayToggle(formData, setFormData, day) {
  const newDays = formData.schedule.days.includes(day)
    ? formData.schedule.days.filter((d) => d !== day)
    : [...formData.schedule.days, day];
  setFormData({
    ...formData,
    schedule: { ...formData.schedule, days: newDays },
  });
}
