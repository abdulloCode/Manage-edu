import { useState, useEffect } from 'react'
import {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle
} from '../../../api/articles'

// ─── Admin Articles Hook ────────────────────────────────────────
export function useAdminBlogs() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadBlogs = async () => {
    setLoading(true)
    try {
      const res = await getAllArticles()
      setBlogs(res.data.data || res.data || [])
    } catch (err) {
      console.error('Maqolalar yuklanmadi:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBlogs()
  }, [search])

  return {
    blogs,
    loading,
    search,
    setSearch,
    loadBlogs
  }
}

// ─── Admin Article Form Hook ───────────────────────────────────
export function useAdminBlogForm() {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [blogToDelete, setBlogToDelete] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    coverImage: '',
    author: '',
    status: 'draft'
  })

  const openAddModal = () => {
    setEditingBlog(null)
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: '',
      coverImage: '',
      author: '',
      status: 'draft'
    })
    setShowModal(true)
  }

  const openEditModal = (blog) => {
    setEditingBlog(blog)
    setFormData({
      title: blog.title || '',
      content: blog.content || '',
      excerpt: blog.excerpt || '',
      category: blog.category || '',
      tags: blog.tags || '',
      coverImage: blog.coverImage || '',
      author: blog.author || '',
      status: blog.status || 'draft'
    })
    setShowModal(true)
  }

  const openDeleteModal = (blog) => {
    setBlogToDelete(blog)
    setShowDeleteModal(true)
  }

  const closeModals = () => {
    setShowModal(false)
    setShowDeleteModal(false)
    setEditingBlog(null)
    setBlogToDelete(null)
  }

  return {
    showModal,
    showDeleteModal,
    editingBlog,
    blogToDelete,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals
  }
}

// ─── Admin Article Actions ───────────────────────────────────────
export async function saveAdminBlog(blog, formData, loadBlogs) {
  if (!formData.title || !formData.content) {
    alert("Sarlavha va Mazmun kiritilishi shart!")
    return false
  }

  try {
    const dataToSend = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      excerpt: formData.excerpt.trim() || "",
      category: formData.category.trim() || "Umumiy",
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      coverImage: formData.coverImage.trim() || "",
      author: formData.author.trim() || "",
      status: formData.status || 'draft'
    }

    if (blog) {
      const id = blog._id || blog.id
      await updateArticle(id, dataToSend)
    } else {
      await createArticle(dataToSend)
    }

    return true
  } catch (err) {
    alert(err.response?.data?.message || "Server xatosi")
    return false
  }
}

export async function deleteAdminBlog(blog, loadBlogs) {
  if (!window.confirm('Maqolani o\'chirishni tasdiqlaysizmi?')) {
    return false
  }

  try {
    const id = blog._id || blog.id
    await deleteArticle(id)
    return true
  } catch (err) {
    alert("O'chirishda xatolik: " + (err.response?.data?.message || err.message))
    return false
  }
}

// ─── Legacy exports (for backward compatibility) ───────────────
export const useBlogs = useAdminBlogs
export const useBlogForm = useAdminBlogForm
export const saveBlog = saveAdminBlog
export const removeBlog = deleteAdminBlog
