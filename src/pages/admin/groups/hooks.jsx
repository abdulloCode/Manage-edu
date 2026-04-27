import { useState, useEffect } from 'react'
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
  addStudentToGroup
} from '../../../api/groups'
import { getAllTeachers } from '../../../api/teacher'
import { getAllCourses } from '../../../api/courses'
import { getStudents } from '../../../api/students'

export function useGroups() {
  const [groups, setGroups] = useState([])
  const [rooms, setRooms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('groups')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 9

  const loadGroups = async () => {
    setLoading(true)
    try {
      console.log("Guruhlarni yuklashmoqda...")
      const res = await getAllGroups({ search })
      const groupsData = res.data.data || res.data || []
      console.log("Guruhlar ma'lumotlari:", groupsData)

      // Har bir guruh uchun o'quvchilarni yuklash
      const groupsWithStudents = await Promise.all(
        groupsData.map(async (group) => {
          try {
            const groupRes = await getGroupById(group.id || group._id, { includeStudents: true })
            const groupData = groupRes.data.data || groupRes.data
            let students = []

            if (groupData.students && Array.isArray(groupData.students)) {
              students = groupData.students
            } else if (groupData.studentsData && Array.isArray(groupData.studentsData)) {
              students = groupData.studentsData
            } else if (groupData.studentData && Array.isArray(groupData.studentData)) {
              students = groupData.studentData
            }

            return { ...group, students: students || [] }
          } catch (err) {
            console.error(`Guruh ${group.name} uchun o'quvchilarni yuklashda xatolik:`, err)
            return { ...group, students: group.students || [] }
          }
        })
      )

      console.log("O'quvchilar bilan guruhlar:", groupsWithStudents)
      setGroups(groupsWithStudents)
    } catch (err) {
      console.error('Guruhlar yuklanmadi:', err)
      console.error('Xatolik tafsilotlari:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const loadRooms = async () => {
    try {
      const res = await getAllRooms()
      setRooms(res.data.data || res.data || [])
    } catch (err) {
      console.error('Xonalar yuklanmadi:', err)
    }
  }

  const loadTeachers = async () => {
    try {
      const res = await getAllTeachers()
      setTeachers(res.data.data || res.data || [])
    } catch (err) {
      console.error('O\'qituvchilar yuklanmadi:', err)
    }
  }

  const loadCourses = async () => {
    try {
      const res = await getAllCourses()
      setCourses(res.data.data || res.data || [])
    } catch (err) {
      console.error('Kurslar yuklanmadi:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'groups') {
      loadGroups()
      loadTeachers()
      loadCourses()
      loadRooms()
    } else {
      loadRooms()
    }
  }, [activeTab, search])

  const totalPages = activeTab === 'groups'
    ? Math.ceil(groups.length / itemsPerPage)
    : Math.ceil(rooms.length / itemsPerPage)

  const paginatedGroups = groups.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const paginatedRooms = rooms.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

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
    loadCourses
  }
}

export function useGroupForm(teachers, courses, rooms) {
  const [showModal, setShowModal] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStudentsView, setShowStudentsView] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupStudents, setGroupStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingRoom, setEditingRoom] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState('group')

  const [formData, setFormData] = useState({
    name: '',
    courseId: null,
    teacherId: null,
    roomId: null,
    startDate: '',
    endDate: '',
    maxStudents: '',
    monthlyFeePerStudent: '',
    schedule: {
      days: [],
      fromHour: '',
      toHour: ''
    }
  })

  const [roomFormData, setRoomFormData] = useState({
    name: '',
    number: '',
    capacity: '',
    equipment: ''
  })

  const openAddGroupModal = () => {
    setEditingGroup(null)
    setFormData({
      name: '',
      courseId: null,
      teacherId: null,
      roomId: null,
      startDate: '',
      endDate: '',
      maxStudents: '',
      monthlyFeePerStudent: '',
      schedule: {
        days: [],
        fromHour: '',
        toHour: ''
      }
    })
    setShowModal(true)
  }

  const openEditGroupModal = (group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name || '',
      courseId: group.courseId || '',
      teacherId: group.teacherId || '',
      roomId: group.roomId || '',
      startDate: group.startDate || '',
      endDate: group.endDate || '',
      maxStudents: group.maxStudents || '',
      monthlyFeePerStudent: group.monthlyFeePerStudent || '',
      schedule: group.schedule || {
        days: [],
        fromHour: '',
        toHour: ''
      }
    })
    setShowModal(true)
  }

  const openAddRoomModal = () => {
    setEditingRoom(null)
    setRoomFormData({
      name: '',
      number: '',
      capacity: '',
      equipment: ''
    })
    setShowRoomModal(true)
  }

  const openEditRoomModal = (room) => {
    setEditingRoom(room)
    setRoomFormData({
      name: room.name || '',
      number: room.number || '',
      capacity: room.capacity || '',
      equipment: room.equipment ? room.equipment.join(', ') : ''
    })
    setShowRoomModal(true)
  }

  const openDeleteModal = (item, type) => {
    setItemToDelete(item)
    setDeleteType(type)
    setShowDeleteModal(true)
  }

  const closeModals = () => {
    setShowModal(false)
    setShowRoomModal(false)
    setShowDeleteModal(false)
    setEditingGroup(null)
    setEditingRoom(null)
    setItemToDelete(null)
  }

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
    setLoadingStudents
  }
}

export async function saveGroup(group, formData) {
  try {
    const dataToSend = {
      name: formData.name,
    }

    if (formData.courseId) dataToSend.courseId = formData.courseId
    if (formData.teacherId) dataToSend.teacherId = formData.teacherId
    if (formData.roomId) dataToSend.roomId = formData.roomId
    if (formData.startDate) dataToSend.startDate = formData.startDate
    if (formData.endDate) dataToSend.endDate = formData.endDate
    if (formData.maxStudents) dataToSend.maxStudents = formData.maxStudents
    if (formData.monthlyFeePerStudent) dataToSend.monthlyFeePerStudent = formData.monthlyFeePerStudent

    if (formData.schedule.days.length > 0) {
      dataToSend.schedule = {
        days: formData.schedule.days,
        fromHour: formData.schedule.fromHour,
        toHour: formData.schedule.toHour
      }
    }

    if (group) {
      await updateGroup(group.id, dataToSend)
    } else {
      await createGroup(dataToSend)
    }

    return true
  } catch (err) {
    console.error('Saqlash xatolik:', err)
    alert('Xatolik yuz berdi: ' + (err.response?.data?.error ?? err.message ?? "Noma'lum xatolik"))
    return false
  }
}

export async function saveRoom(room, roomFormData) {
  try {
    const data = {
      ...roomFormData,
      equipment: roomFormData.equipment ? roomFormData.equipment.split(',').map(e => e.trim()) : []
    }

    if (room) {
      await updateRoom(room.id, data)
    } else {
      await createRoom(data)
    }

    return true
  } catch (err) {
    console.error('Saqlash xatolik:', err)
    alert('Xatolik yuz berdi')
    return false
  }
}

export async function removeItem(item, type) {
  try {
    if (type === 'group') {
      await deleteGroup(item.id)
    } else {
      await deleteRoom(item.id)
    }
    return true
  } catch (err) {
    console.error('O\'chirish xatolik:', err)
    return false
  }
}

export async function addStudentToGroupApi(groupId, studentId) {
  try {
    await addStudentToGroup(groupId, studentId)
    return true
  } catch (err) {
    console.error('Student qo\'shish xatolik:', err)
    alert('Xatolik yuz berdi: ' + (err.response?.data?.error ?? err.message ?? "Noma'lum xatolik"))
    return false
  }
}

export async function fetchAllStudents() {
  try {
    const { data } = await getStudents({ limit: 1000 })
    return data.data || data || []
  } catch (err) {
    console.error('Studentlarni yuklash xatolik:', err)
    return []
  }
}

export async function loadGroupStudents(group, setGroupStudents, setLoadingStudents) {
  setLoadingStudents(true)
  try {
    const res = await getGroupById(group.id, { includeStudents: true })
    const groupData = res.data.data || res.data

    let students = []

    if (groupData.students && Array.isArray(groupData.students)) {
      students = groupData.students
    } else if (groupData.studentsData && Array.isArray(groupData.studentsData)) {
      students = groupData.studentsData
    } else if (groupData.studentIds && Array.isArray(groupData.studentIds)) {
      students = groupData.studentIds.map(id => ({ id, name: 'O\'quvchi', phone: '—', balance: 0 }))
    } else if (groupData.students && typeof groupData.students === 'object') {
      students = Object.values(groupData.students)
    }

    if (students.length === 0 && group.students) {
      students = Array.isArray(group.students) ? group.students : [group.students]
    }

    setGroupStudents(students)
  } catch (err) {
    console.error('O\'quvchilarni yuklashda xatolik:', err)
    if (group.students) {
      const students = Array.isArray(group.students) ? group.students : [group.students]
      setGroupStudents(students)
    } else {
      setGroupStudents([])
    }
  } finally {
    setLoadingStudents(false)
  }
}

export function getGroupIcon(name) {
  const icons = [
    { emoji: '👥', bg: 'bg-purple-100', color: 'text-purple-600' },
    { emoji: '🎓', bg: 'bg-blue-100', color: 'text-blue-600' },
    { emoji: '💼', bg: 'bg-green-100', color: 'text-green-600' },
    { emoji: '🏫', bg: 'bg-orange-100', color: 'text-orange-600' },
    { emoji: '📚', bg: 'bg-pink-100', color: 'text-pink-600' },
    { emoji: '⭐', bg: 'bg-yellow-100', color: 'text-yellow-600' },
  ]
  return icons[name?.charCodeAt(0) % icons.length] ?? icons[0]
}

export function getRoomIcon(name) {
  const icons = [
    { emoji: '🚪', bg: 'bg-indigo-100', color: 'text-indigo-600' },
    { emoji: '🏠', bg: 'bg-cyan-100', color: 'text-cyan-600' },
    { emoji: '🏢', bg: 'bg-teal-100', color: 'text-teal-600' },
    { emoji: '🏛️', bg: 'bg-amber-100', color: 'text-amber-600' },
  ]
  return icons[name?.charCodeAt(0) % icons.length] ?? icons[0]
}

export function handleDayToggle(formData, setFormData, day) {
  const newDays = formData.schedule.days.includes(day)
    ? formData.schedule.days.filter(d => d !== day)
    : [...formData.schedule.days, day]
  setFormData({
    ...formData,
    schedule: { ...formData.schedule, days: newDays }
  })
}
