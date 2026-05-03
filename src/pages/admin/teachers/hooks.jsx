import { useState, useEffect } from 'react'
import {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../../../api/teacher'

export function useTeachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const loadTeachers = async () => {
    setLoading(true)
    try {
      const res = await getAllTeachers({ search })
      setTeachers(res.data.data || res.data || [])
    } catch (err) {
      console.error('O\'qituvchilar yuklanmadi:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [search])

  const totalPages = Math.ceil(teachers.length / itemsPerPage)
  const paginatedTeachers = teachers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return {
    teachers,
    loading,
    search,
    setSearch,
    page,
    setPage,
    itemsPerPage,
    totalPages,
    paginatedTeachers,
    loadTeachers
  }
}

export function useTeacherForm() {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [teacherToDelete, setTeacherToDelete] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    qualification: '',
    salaryPercentage: ''
  })

  const openAddModal = () => {
    setEditingTeacher(null)
    setFormData({
      name: '',
      phone: '',
      password: '',
      qualification: '',
      salaryPercentage: ''
    })
    setShowModal(true)
  }

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      name: teacher.name || '',
      phone: teacher.phone || '',
      password: '',
      qualification: teacher.qualification || '',
      salaryPercentage: teacher.salaryPercentage || ''
    })
    setShowModal(true)
  }

  const openDeleteModal = (teacher) => {
    setTeacherToDelete(teacher)
    setShowDeleteModal(true)
  }

  const closeModals = () => {
    setShowModal(false)
    setShowDeleteModal(false)
    setEditingTeacher(null)
    setTeacherToDelete(null)
  }

  return {
    showModal,
    showDeleteModal,
    editingTeacher,
    teacherToDelete,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals
  }
}

export async function saveTeacher(teacher, formData, loadTeachers) {
  try {
    const dataToSave = {
      name: formData.name,
      phone: formData.phone,
      qualification: formData.qualification,
      salaryPercentage: formData.salaryPercentage,
    }

    if (teacher) {
      if (formData.password) {
        dataToSave.password = formData.password
      }
      await updateTeacher(teacher.id, dataToSave)
    } else {
      dataToSave.password = formData.password
      await createTeacher(dataToSave)
    }

    return true
  } catch (err) {
    console.error('Saqlash xatolik:', err)
    if (err?.response?.status !== 404) {
      alert('Xatolik yuz berdi')
    }
    return false
  }
}

export async function removeTeacher(teacher, loadTeachers) {
  try {
    await deleteTeacher(teacher.id)
    return true
  } catch (err) {
    console.error('O\'chirish xatolik:', err)
    return false
  }
}

export function getInitials(name) {
  return name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'
}

export function getAvatarColor(name) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ]
  return colors[name?.charCodeAt(0) % colors.length] ?? colors[0]
}
