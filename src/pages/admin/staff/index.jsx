import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit3, Trash2, DollarSign, X, AlertCircle,
  Clock, Users, Shield, ChevronDown, Eye, EyeOff, Check,
} from "lucide-react";
import {
  getAllStaff, setStaffSalary, getStaffSalaryHistory,
  createStaff, updateStaff, deleteStaff, getStaffPages,
} from "../../../api/staff";
import PhoneInput from "../../../components/PhoneInput";
import { useToast } from "../../../components/Toast";
import { useIsAdmin } from "../../../utils/permissions";

const getId = (item) => item?._id || item?.id || null;
const thisMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

const ROLES = [
  { value: "staff",     label: "Staff",     color: "bg-slate-100 text-slate-700" },
  { value: "manager",   label: "Manager",   color: "bg-blue-100 text-blue-700"   },
  { value: "assistant", label: "Assistant", color: "bg-purple-100 text-purple-700" },
  { value: "supporter", label: "Supporter", color: "bg-green-100 text-green-700" },
];

const ALL_PAGES = [
  { value: "students",        label: "O'quvchilar",       icon: "👨‍🎓" },
  { value: "teachers",        label: "O'qituvchilar",      icon: "👨‍🏫" },
  { value: "payments",        label: "To'lovlar",          icon: "💰" },
  { value: "groups",          label: "Guruhlar",           icon: "👥" },
  { value: "courses",         label: "Kurslar",            icon: "📚" },
  { value: "inventory",       label: "Inventar",           icon: "📦" },
  { value: "reports",         label: "Hisobotlar",         icon: "📊" },
  { value: "payment-reports", label: "To'lov hisobotlari", icon: "📈" },
];

const emptyStaffForm = () => ({
  name: "",
  phone: "",
  password: "",
  adminPassword: "",
  role: "staff",
  monthlySalary: "",
  pagesToAccess: [],
});

const emptySalaryForm = () => ({
  month: thisMonth(),
  monthlySalary: "",
  startDate: today(),
  comment: "",
});

// ── Avatar helpers ─────────────────────────────────────────────
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];
const getAvatarColor = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};
const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

// ══════════════════════════════════════════════════════════════
export default function StaffPage() {
  const { showToast } = useToast();
  const isAdmin = useIsAdmin();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showStaffModal,   setShowStaffModal]   = useState(false);
  const [showSalaryModal,  setShowSalaryModal]  = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);

  const [isSubmittingStaff,  setIsSubmittingStaff]  = useState(false);
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);

  const [staffFormErrors,  setStaffFormErrors]  = useState({});
  const [salaryFormErrors, setSalaryFormErrors] = useState({});

  const [staffForm,  setStaffForm]  = useState(emptyStaffForm());
  const [salaryForm, setSalaryForm] = useState(emptySalaryForm());

  const [availablePageNames, setAvailablePageNames] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  // ── Load ──────────────────────────────────────────────────
  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await getAllStaff();
      setStaff(res.data?.data || res.data || []);
    } catch {
      showToast("Xodimlarni yuklashda xatolik", "error", 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  useEffect(() => {
    getStaffPages()
      .then((res) => {
        const pages = res.data?.pages || res.data?.data?.pages || [];
        setAvailablePageNames(pages.map((p) => p.name));
      })
      .catch(() => {
        setAvailablePageNames(ALL_PAGES.map((p) => p.value));
      });
  }, []);

  // ── Derived ───────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.role?.toLowerCase().includes(q),
    );
  }, [staff, searchQuery]);

  const displayPages = useMemo(() => {
    const known = ALL_PAGES.filter((p) => availablePageNames.includes(p.value));
    const unknown = availablePageNames
      .filter((name) => !ALL_PAGES.find((p) => p.value === name))
      .map((name) => ({ value: name, label: name, icon: "📄" }));
    return [...known, ...unknown];
  }, [availablePageNames]);

  const patchStaff  = (patch) => setStaffForm((f) => ({ ...f, ...patch }));
  const patchSalary = (patch) => setSalaryForm((f) => ({ ...f, ...patch }));

  const togglePage = (val) => {
    const pages = staffForm.pagesToAccess || [];
    patchStaff({
      pagesToAccess: pages.includes(val)
        ? pages.filter((p) => p !== val)
        : [...pages, val],
    });
  };

  // ── Validate ──────────────────────────────────────────────
  const validateStaff = () => {
    const e = {};
    if (!staffForm.name.trim())  e.name  = "Ism kiritilishi shart";
    if (!staffForm.phone.trim()) e.phone = "Telefon raqami kiritilishi shart";
    if (!selectedStaff && !staffForm.password) e.password = "Parol kiritilishi shart";
    return e;
  };

  // ── Save staff ────────────────────────────────────────────
  const handleSaveStaff = async () => {
    const errors = validateStaff();
    if (Object.keys(errors).length) { setStaffFormErrors(errors); return; }
    setStaffFormErrors({});
    setIsSubmittingStaff(true);
    try {
      const id = getId(selectedStaff);
      const payload = {
        name:          staffForm.name.trim(),
        phone:         staffForm.phone.length === 9 ? "+998" + staffForm.phone : staffForm.phone,
        role:          staffForm.role,
        pagesToAccess: staffForm.pagesToAccess,
      };
      if (staffForm.password) payload.password = staffForm.password;
      if (staffForm.adminPassword) payload.adminPassword = staffForm.adminPassword;

      if (id) {
        await updateStaff(id, payload);
      } else {
        // POST /api/staff maosh fieldlarini ham qabul qiladi
        if (staffForm.monthlySalary && Number(staffForm.monthlySalary) > 0) {
          payload.monthlySalary   = Number(staffForm.monthlySalary);
          payload.salaryMonth     = thisMonth();
          payload.salaryStartDate = today();
        }
        await createStaff(payload);
      }

      // Yangi xodim uchun maosh to'g'ridan-to'g'ri POST /staff ga yuboriladi
      // Tahrirlashda esa alohida salary endpoint
      if (id && staffForm.monthlySalary && Number(staffForm.monthlySalary) > 0) {
        await setStaffSalary(id, {
          month:         thisMonth(),
          monthlySalary: Number(staffForm.monthlySalary),
        });
      }

      showToast(id ? "Xodim yangilandi ✓" : "Xodim qo'shildi ✓", "success", 3000);
      setShowStaffModal(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (err) {
      const msg = err?.response?.data?.message || "Xodimni saqlashda xatolik";
      showToast(msg, "error", 5000);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // ── Save salary ───────────────────────────────────────────
  const handleSaveSalary = async () => {
    const errors = {};
    if (!salaryForm.monthlySalary || Number(salaryForm.monthlySalary) <= 0)
      errors.monthlySalary = "Oylik maoshni kiriting";
    if (Object.keys(errors).length) { setSalaryFormErrors(errors); return; }
    setSalaryFormErrors({});
    setIsSubmittingSalary(true);
    try {
      const staffId = getId(selectedStaff);
      if (!staffId) { showToast("Xodim ID topilmadi", "error", 3000); return; }
      await setStaffSalary(staffId, {
        month:         salaryForm.month,
        monthlySalary: Number(salaryForm.monthlySalary),
        startDate:     salaryForm.startDate || undefined,
        comment:       salaryForm.comment   || "",
      });
      showToast("Maosh belgilandi ✓", "success", 3000);
      setShowSalaryModal(false);
      setSalaryForm(emptySalaryForm());
      setSelectedStaff(null);
      loadStaff();
    } catch (err) {
      const msg = err?.response?.data?.message || "Maosh belgilashda xatolik";
      showToast(msg, "error", 5000);
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDeleteStaff = async (s) => {
    const id = getId(s);
    if (!id) return;
    if (!window.confirm(`"${s.name}"ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await deleteStaff(id);
      showToast("Xodim o'chirildi", "success", 3000);
      loadStaff();
    } catch (err) {
      showToast(err?.response?.data?.message || "Xatolik yuz berdi", "error", 5000);
    }
  };

  // ── History ───────────────────────────────────────────────
  const handleViewHistory = async (s) => {
    const id = getId(s);
    if (!id) return;
    setSelectedStaff(s);
    try {
      const res = await getStaffSalaryHistory(id);
      // API array qaytaradi (data.data emas)
      setSalaryHistory(Array.isArray(res.data) ? res.data : res.data?.data || []);
      setShowHistoryModal(true);
    } catch {
      showToast("Maosh tarixini yuklashda xatolik", "error", 5000);
    }
  };

  // ── Open modals ───────────────────────────────────────────
  const openAddModal = () => {
    setStaffForm(emptyStaffForm());
    setSelectedStaff(null);
    setStaffFormErrors({});
    setShowPassword(false);
    setPagesOpen(false);
    setShowStaffModal(true);
  };

  const openEditModal = (s) => {
    setStaffForm({
      name:          s.name || "",
      phone:         s.phone?.replace(/^\+?998/, "") || "",
      password:      "",
      adminPassword: "",
      role:          s.role || "staff",
      monthlySalary: s.currentMonthSalary || "",
      pagesToAccess: s.pagesToAccess || [],
    });
    setSelectedStaff(s);
    setStaffFormErrors({});
    setShowPassword(false);
    setPagesOpen(false);
    setShowStaffModal(true);
  };

  const openSalaryModal = (s) => {
    setSelectedStaff(s);
    setSalaryForm(emptySalaryForm());
    setSalaryFormErrors({});
    setShowSalaryModal(true);
  };

  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Xodimlar</h1>
            <p className="text-sm text-gray-500 mt-0.5">{staff.length} ta xodim</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm"
              />
            </div>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Xodim qo'shish
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Yuklanmoqda...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Users className="w-14 h-14 text-gray-200" />
              <p className="text-sm text-gray-400 font-medium">Xodimlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Xodim", "Role", "Telefon", "Ruxsatlar", "Maosh", "Holat", "Amallar"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide ${i === 6 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStaff.map((s) => {
                    const role = ROLES.find((r) => r.value === s.role);
                    return (
                      <tr key={getId(s)} className="hover:bg-gray-50/70 transition-colors">

                        {/* Xodim */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(s.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {getInitials(s.name)}
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${role?.color || "bg-gray-100 text-gray-600"}`}>
                            {role?.label || s.role || "staff"}
                          </span>
                        </td>

                        {/* Telefon */}
                        <td className="px-4 py-3.5 text-sm text-gray-600 font-mono">
                          {s.phone || "—"}
                        </td>

                        {/* Ruxsatlar */}
                        <td className="px-4 py-3.5">
                          {s.pagesToAccess?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {s.pagesToAccess.slice(0, 3).map((page) => {
                                const p = ALL_PAGES.find((ap) => ap.value === page);
                                return (
                                  <span key={page} className="px-1.5 py-0.5 rounded-md text-xs bg-indigo-50 text-indigo-600 font-medium">
                                    {p?.icon} {p?.label || page}
                                  </span>
                                );
                              })}
                              {s.pagesToAccess.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-500 font-medium">
                                  +{s.pagesToAccess.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Ruxsat yo'q</span>
                          )}
                        </td>

                        {/* Maosh */}
                        <td className="px-4 py-3.5">
                          {s.currentMonthSalary ? (
                            <span className="text-sm font-semibold text-emerald-600">
                              {Number(s.currentMonthSalary).toLocaleString()} UZS
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Belgilanmagan</span>
                          )}
                        </td>

                        {/* Holat */}
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            s.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {s.status === "active" ? "Faol" : s.status || "Faol"}
                          </span>
                        </td>

                        {/* Amallar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <ActionBtn color="emerald" title="Maosh belgilash" onClick={() => openSalaryModal(s)}>
                              <DollarSign className="w-4 h-4" />
                            </ActionBtn>
                            <ActionBtn color="blue" title="Maosh tarixi" onClick={() => handleViewHistory(s)}>
                              <Clock className="w-4 h-4" />
                            </ActionBtn>
                            {isAdmin && (
                              <>
                                <ActionBtn color="amber" title="Tahrirlash" onClick={() => openEditModal(s)}>
                                  <Edit3 className="w-4 h-4" />
                                </ActionBtn>
                                <ActionBtn color="red" title="O'chirish" onClick={() => handleDeleteStaff(s)}>
                                  <Trash2 className="w-4 h-4" />
                                </ActionBtn>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ Staff Modal ══════════ */}
      <AnimatePresence>
        {showStaffModal && (
          <Modal onClose={() => setShowStaffModal(false)}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {selectedStaff ? "Xodimni tahrirlash" : "Yangi xodim"}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {selectedStaff ? "Ma'lumotlarni yangilang" : "Xodim ma'lumotlarini kiriting"}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Error banner */}
            {Object.keys(staffFormErrors).length > 0 && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <ul className="text-xs text-red-600 space-y-0.5">
                  {Object.values(staffFormErrors).map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Ism */}
              <Field label="Ism *" error={staffFormErrors.name}>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => patchStaff({ name: e.target.value })}
                  disabled={isSubmittingStaff}
                  className={inputCls(!!staffFormErrors.name)}
                  placeholder="Ali Karimov"
                  autoFocus
                />
              </Field>

              {/* Telefon */}
              <Field label="Telefon *" error={staffFormErrors.phone}>
                <PhoneInput
                  value={staffForm.phone}
                  onChange={(e) => patchStaff({ phone: e.target.value })}
                  disabled={isSubmittingStaff}
                  className={staffFormErrors.phone ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-indigo-400"}
                />
              </Field>

              {/* Parol */}
              <Field
                label={selectedStaff ? "Yangi parol (ixtiyoriy)" : "Parol *"}
                error={staffFormErrors.password}
              >
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={staffForm.password}
                    onChange={(e) => patchStaff({ password: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={`${inputCls(!!staffFormErrors.password)} pr-11`}
                    placeholder={selectedStaff ? "O'zgartirmaslik uchun bo'sh qoldiring" : "••••••••"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {/* Role */}
              <Field label="Role">
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => patchStaff({ role: r.value })}
                      disabled={isSubmittingStaff}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        staffForm.role === r.value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        staffForm.role === r.value ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                      }`}>
                        {staffForm.role === r.value && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Admin paroli (faqat manager uchun) */}
              {staffForm.role === "manager" && (
                <Field label="Admin paroli" error={staffFormErrors.adminPassword}>
                  <input
                    type="password"
                    value={staffForm.adminPassword}
                    onChange={(e) => patchStaff({ adminPassword: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={inputCls(!!staffFormErrors.adminPassword)}
                    placeholder="Admin kirish paroli"
                  />
                </Field>
              )}

              {/* Oylik maosh */}
              <Field label="Oylik maosh (UZS)">
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={staffForm.monthlySalary}
                    onChange={(e) => patchStaff({ monthlySalary: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={`${inputCls(false)} pl-10`}
                    placeholder="5 000 000"
                    min={0}
                  />
                </div>
              </Field>

              {/* Kirish huquqlari */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-700">Kirish huquqlari</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-600">
                      {staffForm.pagesToAccess?.length || 0}/{displayPages.length}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <button type="button" onClick={() => patchStaff({ pagesToAccess: displayPages.map(p => p.value) })} className="text-indigo-600 hover:underline font-medium">
                      Hammasini
                    </button>
                    <button type="button" onClick={() => patchStaff({ pagesToAccess: [] })} className="text-red-500 hover:underline font-medium">
                      Tozalash
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {displayPages.map((page) => {
                    const checked = staffForm.pagesToAccess?.includes(page.value);
                    return (
                      <label
                        key={page.value}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          checked
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                        }`}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={checked} onChange={() => togglePage(page.value)} />
                        <span className={`text-xs font-medium ${checked ? "text-indigo-700" : "text-gray-600"}`}>
                          {page.icon} {page.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowStaffModal(false)}
                disabled={isSubmittingStaff}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveStaff}
                disabled={isSubmittingStaff}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmittingStaff
                  ? <><Spinner /> Saqlanmoqda...</>
                  : selectedStaff ? "Yangilash" : "Qo'shish"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══════════ Salary Modal ══════════ */}
      <AnimatePresence>
        {showSalaryModal && (
          <Modal onClose={() => setShowSalaryModal(false)} maxW="max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Maosh belgilash</h2>
                  <p className="text-xs text-gray-400">{selectedStaff?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowSalaryModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <Field label="Oy">
                <input
                  type="month"
                  value={salaryForm.month}
                  onChange={(e) => patchSalary({ month: e.target.value })}
                  disabled={isSubmittingSalary}
                  className={inputCls(false)}
                />
              </Field>

              <Field label="Oylik maosh (UZS) *" error={salaryFormErrors.monthlySalary}>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={salaryForm.monthlySalary}
                    onChange={(e) => patchSalary({ monthlySalary: e.target.value })}
                    disabled={isSubmittingSalary}
                    className={`${inputCls(!!salaryFormErrors.monthlySalary)} pl-10`}
                    placeholder="5 000 000"
                    min={0}
                    autoFocus
                  />
                </div>
              </Field>

              <Field label="Izoh">
                <textarea
                  value={salaryForm.comment}
                  onChange={(e) => patchSalary({ comment: e.target.value })}
                  disabled={isSubmittingSalary}
                  className={`${inputCls(false)} resize-none`}
                  rows={2}
                  placeholder="Qo'shimcha izoh..."
                />
              </Field>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowSalaryModal(false)}
                disabled={isSubmittingSalary}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveSalary}
                disabled={isSubmittingSalary}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmittingSalary ? <><Spinner /> Saqlanmoqda...</> : "Saqlash"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══════════ History Modal ══════════ */}
      <AnimatePresence>
        {showHistoryModal && selectedStaff && (
          <Modal onClose={() => setShowHistoryModal(false)} maxW="max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Maosh tarixi</h2>
                  <p className="text-xs text-gray-400">{selectedStaff.name}</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {salaryHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Clock className="w-12 h-12 text-gray-200" />
                  <p className="text-sm text-gray-400 font-medium">Maosh tarixi yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salaryHistory.map((rec) => (
                    <div key={rec.id || rec._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm">{rec.month}</p>
                            {rec.isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600">Faol</span>
                            )}
                          </div>
                          {rec.startDate && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(rec.startDate).toLocaleDateString("uz-UZ")}
                              {rec.endDate ? ` – ${new Date(rec.endDate).toLocaleDateString("uz-UZ")}` : ""}
                            </p>
                          )}
                          {rec.comment && (
                            <p className="text-xs text-gray-500 mt-1 italic">{rec.comment}</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                          {Number(rec.monthlySalary).toLocaleString()} UZS
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Yopish
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Reusable components ────────────────────────────────────────

const inputCls = (hasError) =>
  `w-full px-4 py-2.5 bg-white border-2 rounded-xl text-sm font-medium outline-none focus:ring-0 transition-all disabled:opacity-50 ${
    hasError
      ? "border-red-400 focus:border-red-400 bg-red-50"
      : "border-gray-200 focus:border-indigo-400"
  }`;

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function Modal({ children, onClose, maxW = "max-w-md" }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} pointer-events-auto flex flex-col max-h-[90vh]`}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

function ActionBtn({ color, title, onClick, children }) {
  const colors = {
    emerald: "text-emerald-600 hover:bg-emerald-50",
    blue:    "text-blue-600 hover:bg-blue-50",
    amber:   "text-amber-600 hover:bg-amber-50",
    red:     "text-red-600 hover:bg-red-50",
  };
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}>
      {children}
    </button>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
