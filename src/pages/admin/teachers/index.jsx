import React, { useState, useEffect } from "react";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import { useAuth } from "../../../context/AuthContext";
import { useLang } from "../../../context/LangContext";
import { formatPhone } from "../../../utils/permissions";
import {
  useTeachers,
  useTeacherForm,
  saveTeacher,
  removeTeacher,
  getInitials,
  getAvatarColor,
} from "./hooks";
import PhoneInput from "../../../components/PhoneInput";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { getUserPayments } from "../../../api/payments";

/* ── Teacher detail modal ── */
function TeacherDetailModal({ teacher, onClose }) {
  const fmt = (n) => Number(n ?? 0).toLocaleString("uz-UZ");
  const balance = Number(teacher.paid ?? 0) - Number(teacher.salary ?? 0);
  const [payments, setPayments] = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    const tid = teacher._id || teacher.id;
    if (!tid) return;
    setLoadingPay(true);
    getUserPayments(tid)
      .then((res) => {
        const list = res.data?.payments || res.data?.data || res.data || [];
        setPayments(Array.isArray(list) ? list : []);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoadingPay(false));
  }, [teacher._id, teacher.id]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
          style={{ animation: "modalIn 0.18s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${getAvatarColor(teacher.name)}`}>
                {getInitials(teacher.name)}
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">{teacher.name}</h2>
                <p className="text-xs text-gray-400">{teacher.qualification || "Mutaxassislik kiritilmagan"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">

            {/* Asosiy ma'lumotlar */}
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Telefon",        formatPhone(teacher.phone) || "—"],
                ["Maosh foizi",    teacher.salaryPercentage ? `${teacher.salaryPercentage}%` : "—"],
                ["Qo'shilgan",     teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString("uz-UZ") : "—"],
                ["Holat",          teacher.isActive === false ? "Nofaol" : "Faol"],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            {/* Moliyaviy ma'lumotlar */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Moliyaviy holat</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Kutilgan maosh",  fmt(teacher.salary ?? 0) + " UZS", "text-gray-800"],
                  ["To'langan",       fmt(teacher.paid   ?? 0) + " UZS", "text-emerald-600"],
                  ["Ushlab qolindi",  fmt(teacher.debt   ?? 0) + " UZS", "text-rose-500"],
                  ["Balans",
                    (balance >= 0 ? "+" : "−") + fmt(Math.abs(balance)) + " UZS",
                    balance >= 0 ? "text-emerald-600" : "text-rose-500"],
                ].map(([l, v, color]) => (
                  <div key={l} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                    <p className={`text-sm font-bold tabular-nums ${color}`}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guruhlar */}
            {Array.isArray(teacher.groups) && teacher.groups.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Guruhlar ({teacher.groups.length} ta)
                </p>
                <div className="space-y-1.5">
                  {teacher.groups.map((g, i) => (
                    <div key={g._id || g.id || i} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold text-indigo-700">{g.name || "—"}</span>
                      <span className="text-xs text-indigo-400">{g.currentStudents ?? g.students?.length ?? 0} ta o'q.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* To'lovlar tarixi */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                To'lovlar tarixi {payments.length > 0 ? `(${payments.length} ta)` : ""}
              </p>
              {loadingPay ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-sm text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <div className="bg-gray-50 rounded-xl px-3 py-4 text-center text-xs text-gray-400 font-medium">
                  To'lovlar topilmadi
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {payments.slice(0, 20).map((p, i) => {
                    const isCredit = (p.dk || p.type?.dk) === "credit";
                    return (
                      <div key={p._id || p.id || i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-100" : "bg-rose-100"}`}>
                          {isCredit
                            ? <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
                            : <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">
                            {p.type?.name || p.type?.code || "—"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {p.date ? new Date(p.date).toLocaleDateString("uz-UZ") : "—"}
                            {p.month ? ` · ${p.month}` : ""}
                          </p>
                        </div>
                        <span className={`text-xs font-bold tabular-nums shrink-0 ${isCredit ? "text-emerald-600" : "text-rose-500"}`}>
                          {isCredit ? "+" : "−"}{fmt(p.amount)} UZS
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TeachersPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const canCreate = isAdmin || isManager;

  const {
    teachers,
    loading,
    search,
    setSearch,
    loadTeachers,
  } = useTeachers();

  const { visible: paginatedTeachers, sentinelRef, hasMore, shown } = useInfiniteScroll(teachers, 20);

  const {
    showModal,
    showDeleteModal,
    editingTeacher,
    teacherToDelete,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
  } = useTeacherForm();

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [phoneDisplay, setPhoneDisplay] = useState("");

  useEffect(() => {
    if (editingTeacher?.phone) {
      setPhoneDisplay(formatPhoneNumber(editingTeacher.phone));
    } else {
      setPhoneDisplay("");
    }
  }, [editingTeacher, showModal]);

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    let out = "";
    if (digits.length > 0) out += "(" + digits.slice(0, 2);
    if (digits.length > 2) out += ") " + digits.slice(2, 5);
    if (digits.length > 5) out += "-" + digits.slice(5, 7);
    if (digits.length > 7) out += "-" + digits.slice(7, 9);
    return out;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePhoneChange = (e) => {
    setPhoneDisplay(e.target.value);
    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
  };

  const handleSaveTeacher = async () => {
    const success = await saveTeacher(editingTeacher, formData);
    if (success) {
      closeModals();
      loadTeachers();
    }
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    const success = await removeTeacher(teacherToDelete);
    if (success) {
      closeModals();
      loadTeachers();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('nav_teachers')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('dash_total')}{" "}
            <span className="font-semibold text-gray-900">
              {teachers.length}
            </span>{" "}
            {t('teach_count')}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('teach_add')}
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <label className="relative flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg w-full max-w-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={t('search')}
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </label>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('nav_teachers')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('phone')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('teach_qual')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('teach_salary')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('teach_credit')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('teach_paid')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('balance')}
              </th>
              <th className="w-32 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">{t('loading')}</span>
                  </div>
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-12 h-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">
                      {t('teach_empty')}
                    </p>
                    {search && (
                      <p className="text-xs">"{search}" {t('not_found')}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTeachers.map((teacher, idx) => (
                <tr
                  key={teacher.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTeacher(teacher)}
                >
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${getAvatarColor(teacher.name)}`}
                      >
                        {getInitials(teacher.name)}
                      </div>
                      <span className="font-medium text-sm text-gray-900">
                        {teacher.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {formatPhone(teacher.phone)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {teacher.qualification || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {teacher.salaryPercentage ? (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        {teacher.salaryPercentage}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">
                    {teacher.paid ? formatCurrency(teacher.paid) : "0"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">
                    {teacher.salary ? formatCurrency(teacher.salary) : "0"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {teacher.debt > 0 ? (
                      <span className="text-red-600">
                        {formatCurrency(teacher.debt)}
                      </span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Tahrirlash"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteModal(teacher)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Infinite scroll sentinel */}
        {!loading && teachers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-400">{shown} / {teachers.length} ta</span>
            {hasMore && <span className="text-xs text-blue-400 animate-pulse">Yuklanmoqda…</span>}
          </div>
        )}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTeacher
                  ? t('teach_edit')
                  : t('teach_add')}
              </h2>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('teach_full_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ali Karimov"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('phone')} <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  required
                  className="w-full border-2 border-transparent bg-slate-50 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('teach_password')}{" "}
                  {editingTeacher && (
                    <span className="text-gray-400">(ixtiyoriy)</span>
                  )}
                  {!editingTeacher && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder={
                    editingTeacher
                      ? "O'zgartirmoqchi bo'lsangiz kiriting"
                      : "••••••••"
                  }
                  minLength={8}
                  title="Parol kamida 8 ta belgi bo'lishi kerak"
                  required={!editingTeacher}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('teach_qual')}
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Senior Frontend Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('teach_salary_pct')}
                </label>
                <input
                  type="number"
                  value={formData.salaryPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryPercentage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="50"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleSaveTeacher}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('save')}
              </button>
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher Detail Modal ── */}
      {selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && teacherToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                {t('teach_delete_title')}
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                <strong>{teacherToDelete.name}</strong> o'chirilsinmi? Bu amal
                qaytarib bo'lmaydi.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
