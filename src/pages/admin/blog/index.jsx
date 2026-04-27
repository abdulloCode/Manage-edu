import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit3, Trash2, FileText,
  Clock, Calendar, Eye, EyeOff, Tag, User,
  X, AlertCircle, Image as ImageIcon
} from 'lucide-react'
import { useAdminBlogs, useAdminBlogForm, saveAdminBlog, deleteAdminBlog } from './hooks'

export default function BlogsPage() {
  const { blogs, loading, search, setSearch, loadBlogs } = useAdminBlogs()
  const {
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
  } = useAdminBlogForm()

  const handleSaveBlog = async () => {
    const success = await saveAdminBlog(editingBlog, formData, loadBlogs)
    if (success) {
      closeModals()
      loadBlogs()
    }
  }



// Keyin:
const confirmDelete = async () => {
  const success = await deleteAdminBlog(blogToDelete, loadBlogs)
  if (success) {
    closeModals()  // ← closeModals ishlatilsin
    loadBlogs()
  }
}
  const getCategoryColor = (category) => {
    const colors = {
      'Texnologiya': 'bg-blue-100 text-blue-700',
      'Dasturlash': 'bg-green-100 text-green-700',
      'Dizayn': 'bg-purple-100 text-purple-700',
      'Marketing': 'bg-orange-100 text-orange-700',
      'Biznes': 'bg-red-100 text-red-700',
      'Umumiy': 'bg-gray-100 text-gray-700'
    }
    return colors[category] || colors['Umumiy']
  }

  const getStatusBadge = (status) => {
    return status === 'published'
      ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <Eye className="w-3 h-3" />
          Published
        </span>
      : <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          <EyeOff className="w-3 h-3" />
          Draft
        </span>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">

      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Maqolalar Boshqaruvi
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Coding Club IT markazi maqolalari</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Maqolalarni qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Yangi Maqola
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{blogs.length}</p>
              <p className="text-sm text-slate-500">Jami Maqolalar</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{blogs.filter(b => b.status === 'published').length}</p>
              <p className="text-sm text-slate-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <EyeOff className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{blogs.filter(b => b.status === 'draft').length}</p>
              <p className="text-sm text-slate-500">Draft</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {new Set(blogs.flatMap(b => b.tags || [])).size}
              </p>
              <p className="text-sm text-slate-500">Kategoriyalar</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOGS GRID ── */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Maqolalar yo'q</h3>
            <p className="text-slate-500 mb-6">Birinchi maqolangizni yozing</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              Maqola Yaratish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <motion.div
                key={blog._id || blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Cover Image */}
                {blog.coverImage ? (
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      {getCategoryColor(blog.category) && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(blog.category)}`}>
                          {blog.category}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(blog.status)}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white/50" />
                    <div className="absolute top-3 left-3">
                      {getCategoryColor(blog.category) && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(blog.category)}`}>
                          {blog.category}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(blog.status)}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {blog.excerpt || blog.content?.substring(0, 150) + '...'}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {blog.author || 'Noma\'lum'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(blog.createdAt).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>

                  {/* Tags */}
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                      {blog.tags.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                          +{blog.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(blog)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => openDeleteModal(blog)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      O'chirish
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD/EDIT MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModals}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editingBlog ? 'Maqolani Tahrirlash' : 'Yangi Maqola Yaratish'}
                  </h2>
                  <button
                    onClick={closeModals}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Sarlavha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Misol: React 19 yangiliklari"
                      required
                    />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Qisqacha mazmun
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                      placeholder="Maqolaning qisqacha mazmuni..."
                      rows={3}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Mazmun <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-mono text-sm"
                      placeholder="Maqolaning to'liq mazmunini yozing..."
                      rows={10}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Kategoriya
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                      >
                        <option value="">Tanlang</option>
                        <option value="Texnologiya">Texnologiya</option>
                        <option value="Dasturlash">Dasturlash</option>
                        <option value="Dizayn">Dizayn</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Biznes">Biznes</option>
                        <option value="Umumiy">Umumiy</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Holat
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Teglar (vergul bilan ajrating)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="react, javascript, web-development"
                    />
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Rasm URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                        title="Rasm yuklash"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Muallif
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Ism Familiya"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                  <button
                    onClick={handleSaveBlog}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
                  >
                    {editingBlog ? 'Yangilash' : 'Yaratish'}
                  </button>
                  <button
                    onClick={closeModals}
                    className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    Bekor qilish
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showDeleteModal && blogToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModals} 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto"
              >
                <div className="p-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                    Maqolani o'chirish
                  </h3>
                  <p className="text-center text-slate-600 mb-6">
                    <strong>"{blogToDelete.title}"</strong> maqolasini o'chirishni tasdiqlaysizmi?
                    <br />
                    <span className="text-sm text-slate-500">Bu amal qaytarib bo'lmaydi.</span>
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
