import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  DollarSign,
  X,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react";
import {
  getAllStaff,
  setStaffSalary,
  getStaffSalaryHistory,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../../../api/staff";
import PhoneInput from "../../../components/PhoneInput";

// ── Helpers ──────────────────────────────────────────────────────────────────
const getId = (item) => item?._id || item?.id || null;

const handleError = (message, err) => {
  const status = err?.response?.status;
  if (status === 404) { console.error(message, err); return; }
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
  alert(serverMsg || message);
};

const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("998") && d.length === 12)
    return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10,12)}`;
  return phone;
};

const today      = () => new Date().toISOString().slice(0, 10);
const thisMonth  = () => new Date().toISOString().slice(0, 7);

// Role options — single source of truth
const ROLES = [
  { value: "staff",     label: "Staff"     },
  { value: "manager",   label: "Manager"   },
  { value: "assistant", label: "Assistant" },
  { value: "supporter", label: "Supporter" },
];

const emptyStaffForm = () => ({
  name:            "",
  phone:           "",
  password:        "",
  adminPassword:   "",
  role:            "staff",
  jobTitle:        "",          // free-text, not role
  hireDate:        today(),
  specialization:  "",
  monthlySalary:   "",
  salaryMonth:     thisMonth(),
  salaryStartDate: today(),
  salaryComment:   "",
});

const emptySalaryForm = () => ({
  month:         thisMonth(),
  monthlySalary: "",
  startDate:     today(),
  comment:       "",
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [staff,        setStaff]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");

  const [showStaffModal,   setShowStaffModal]   = useState(false);
  const [showSalaryModal,  setShowSalaryModal]  = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedStaff,  setSelectedStaff]  = useState(null);
  const [salaryHistory,  setSalaryHistory]  = useState([]);

  const [isSubmittingStaff,  setIsSubmittingStaff]  = useState(false);
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);

  const [staffFormErrors,  setStaffFormErrors]  = useState({});
  const [salaryFormErrors, setSalaryFormErrors] = useState({});

  const [staffForm,        setStaffForm]        = useState(emptyStaffForm());
  const [salaryForm,       setSalaryForm]       = useState(emptySalaryForm());
  const [staffPhoneDisplay, setStaffPhoneDisplay] = useState("");

  // ── Load ──
  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await getAllStaff();
      setStaff(res.data.data || res.data || []);
    } catch (err) {
      handleError("Xodimlarni yuklashda xatolik", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  // ── Phone display sync ──
  useEffect(() => {
    if (showStaffModal) {
      setStaffPhoneDisplay(selectedStaff?.phone ? formatPhoneNumber(selectedStaff.phone) : "");
    }
  }, [selectedStaff, showStaffModal]);

  // ── Filter ──
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.jobTitle?.toLowerCase().includes(q),
    );
  }, [staff, searchQuery]);

  // ── Patch helpers ──
  const patchStaff   = (patch) => setStaffForm((f) => ({ ...f, ...patch }));
  const patchSalary  = (patch) => setSalaryForm((f) => ({ ...f, ...patch }));

  // ── Validate staff form ──
  const validateStaffForm = () => {
    const errors = {};
    if (!staffForm.name.trim())  errors.name  = "Ism kiritilishi shart!";
    if (!staffForm.phone.trim()) errors.phone = "Telefon raqami kiritilishi shart!";
    if (!selectedStaff && !staffForm.password) errors.password = "Parol kiritilishi shart!";
    // Admin password requirement removed - managers and supporters can create staff without admin password
    return errors;
  };

  // ── Save staff ──
  const handleSaveStaff = async () => {
    const errors = validateStaffForm();
    if (Object.keys(errors).length) { setStaffFormErrors(errors); return; }
    setStaffFormErrors({});
    setIsSubmittingStaff(true);
    try {
      const id = getId(selectedStaff);
      const payload = { ...staffForm };
      // Don't send empty password on edit
      if (id && !payload.password) delete payload.password;
      if (id) {
        await updateStaff(id, payload);
      } else {
        await createStaff(payload);
      }
      setShowStaffModal(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (err) {
      handleError("Xodimni saqlashda xatolik", err);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // ── Save salary ──
  const handleSaveSalary = async () => {
    const errors = {};
    if (!salaryForm.monthlySalary || Number(salaryForm.monthlySalary) <= 0)
      errors.monthlySalary = "Oylik maoshni kiriting!";
    if (Object.keys(errors).length) { setSalaryFormErrors(errors); return; }
    setSalaryFormErrors({});
    setIsSubmittingSalary(true);
    try {
      const staffId = getId(selectedStaff);
      if (!staffId) { alert("Xodim ID topilmadi"); return; }
      await setStaffSalary(staffId, {
        month:         salaryForm.month,
        monthlySalary: Number(salaryForm.monthlySalary),
        startDate:     salaryForm.startDate || undefined,
        comment:       salaryForm.comment || "",
      });
      setShowSalaryModal(false);
      setSalaryForm(emptySalaryForm());
      setSelectedStaff(null);
      loadStaff();
    } catch (err) {
      handleError("Maosh belgilashda xatolik", err);
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  // ── Delete ──
  const handleDeleteStaff = async (staffMember) => {
    const id = getId(staffMember);
    if (!id) { alert("Xodim ID topilmadi"); return; }
    if (!window.confirm(`"${staffMember.name}"ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await deleteStaff(id);
      loadStaff();
    } catch (err) {
      handleError("Xodimni o'chirishda xatolik", err);
    }
  };

  // ── View history ──
  const handleViewHistory = async (staffMember) => {
    const staffId = getId(staffMember);
    if (!staffId) { alert("Xodim ID topilmadi"); return; }
    setSelectedStaff(staffMember);
    try {
      const res = await getStaffSalaryHistory(staffId);
      setSalaryHistory(res.data.data || res.data || []);
      setShowHistoryModal(true);
    } catch (err) {
      handleError("Maosh tarixini yuklashda xatolik", err);
    }
  };

  // ── Open modals ──
  const openAddStaffModal = () => {
    setStaffForm(emptyStaffForm());
    setSelectedStaff(null);
    setStaffFormErrors({});
    setShowStaffModal(true);
  };

  const openEditStaffModal = (staffMember) => {
    const s = staffMember.salary;
    setStaffForm({
      name:            staffMember.name,
      phone:           staffMember.phone,
      password:        "",
      adminPassword:   "",
      role:            staffMember.role || "staff",
      jobTitle:        staffMember.jobTitle || "",
      hireDate:        staffMember.hireDate?.split("T")[0] || today(),
      specialization:  staffMember.specialization || "",
      monthlySalary:   s?.monthlySalary || "",
      salaryMonth:     s?.month         || thisMonth(),
      salaryStartDate: s?.startDate?.split("T")[0] || today(),
      salaryComment:   s?.comment       || "",
    });
    setSelectedStaff(staffMember);
    setStaffFormErrors({});
    setShowStaffModal(true);
  };

  const openSalaryModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setSalaryForm(emptySalaryForm());
    setSalaryFormErrors({});
    setShowSalaryModal(true);
  };

  // ── Field component ──
  const Field = ({ label, error, children }) => (
    <div>
      <label className="block text-sm font-medium text-base-content/80 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );

  const inputCls = (hasError) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 ${
      hasError ? "border-red-400 bg-red-50" : "border-base-300 bg-base-100"
    }`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2 bg-base-100 border border-base-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={openAddStaffModal} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Xodim Qo'shish
          </button>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-base-content/60 font-medium">Yuklanmoqda...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-base-200 border-b border-base-300">
                    {["Xodim", "Lavozim", "Role", "Telefon", "Holat", "Amallar"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-bold text-base-content/70 uppercase tracking-wider ${i === 5 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-12 h-12 text-base-content/20" />
                          <p className="text-sm font-medium text-base-content/50">Xodimlar yo'q</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((s) => (
                      <tr
                        key={getId(s)}
                        className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {s.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-base-content">{s.name}</p>
                              {s.specialization && (
                                <p className="text-xs text-base-content/50">{s.specialization}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-base-content">{s.jobTitle || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700">
                            {s.role || "staff"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-base-content/70 font-mono">{s.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            s.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {s.status || "active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <ActionBtn color="green"  title="Maosh"   onClick={() => openSalaryModal(s)}>
                              <DollarSign className="w-4 h-4" />
                            </ActionBtn>
                            <ActionBtn color="blue"   title="Tarix"   onClick={() => handleViewHistory(s)}>
                              <Clock className="w-4 h-4" />
                            </ActionBtn>
                            <ActionBtn color="yellow" title="Tahrir"  onClick={() => openEditStaffModal(s)}>
                              <Edit3 className="w-4 h-4" />
                            </ActionBtn>
                            <ActionBtn color="red"    title="O'chir"  onClick={() => handleDeleteStaff(s)}>
                              <Trash2 className="w-4 h-4" />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Staff Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showStaffModal && (
          <Modal onClose={() => setShowStaffModal(false)}>
            {/* Header */}
            <ModalHeader
              title={selectedStaff ? "Xodimni Tahrirlash" : "Yangi Xodim"}
              onClose={() => setShowStaffModal(false)}
            />

            {/* Error summary */}
            {Object.keys(staffFormErrors).length > 0 && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-2 text-red-700 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Xatolarni to'g'irlang:</span>
                </div>
                <ul className="ml-6 text-xs text-red-600 list-disc space-y-0.5">
                  {Object.values(staffFormErrors).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">

              {/* Name */}
              <Field label="Ism *" error={staffFormErrors.name}>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => patchStaff({ name: e.target.value })}
                  disabled={isSubmittingStaff}
                  className={inputCls(staffFormErrors.name)}
                  placeholder="Ali Karimov"
                />
              </Field>

              {/* Phone */}
              <Field label="Telefon *" error={staffFormErrors.phone}>
                <PhoneInput
                  value={staffPhoneDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setStaffPhoneDisplay(e.target.value);
                    patchStaff({ phone: raw });
                  }}
                  disabled={isSubmittingStaff}
                  placeholder="+998 90 123 45 67"
                  className={inputCls(staffFormErrors.phone)}
                />
              </Field>

              {/* Password (add only) */}
              {!selectedStaff && (
                <Field label="Parol *" error={staffFormErrors.password}>
                  <input
                    type="password"
                    value={staffForm.password}
                    onChange={(e) => patchStaff({ password: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={inputCls(staffFormErrors.password)}
                    placeholder="•••••••••"
                  />
                </Field>
              )}

              {/* Role */}
              <Field label="Role">
                <select
                  value={staffForm.role}
                  onChange={(e) => patchStaff({ role: e.target.value, adminPassword: "" })}
                  disabled={isSubmittingStaff}
                  className="select select-bordered w-full text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>

              {/* Admin password — only for manager */}
              {staffForm.role === "manager" && (
                <Field label="Admin Paroli *" error={staffFormErrors.adminPassword}>
                  <input
                    type="password"
                    value={staffForm.adminPassword}
                    onChange={(e) => patchStaff({ adminPassword: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={inputCls(staffFormErrors.adminPassword)}
                    placeholder="Admin panelga kirish paroli"
                  />
                </Field>
              )}

              {/* Job title (free text — separate from role) */}
              <Field label="Lavozim (sarlavha)">
                <input
                  type="text"
                  value={staffForm.jobTitle}
                  onChange={(e) => patchStaff({ jobTitle: e.target.value })}
                  disabled={isSubmittingStaff}
                  className={inputCls(false)}
                  placeholder="Bosh hisobchi, IT mutaxassisi…"
                />
              </Field>

              {/* Hire date */}
              <Field label="Ishga qabul sanasi">
                <input
                  type="date"
                  value={staffForm.hireDate}
                  onChange={(e) => patchStaff({ hireDate: e.target.value })}
                  disabled={isSubmittingStaff}
                  className={inputCls(false)}
                />
              </Field>

              {/* Specialization */}
              <Field label="Mutaxassislik">
                <input
                  type="text"
                  value={staffForm.specialization}
                  onChange={(e) => patchStaff({ specialization: e.target.value })}
                  disabled={isSubmittingStaff}
                  className={inputCls(false)}
                  placeholder="IT, Buxgalteriya…"
                />
              </Field>

              {/* Salary section */}
              <div className="pt-4 border-t border-base-200 space-y-4">
                <p className="text-sm font-semibold text-base-content/70">Maosh (ixtiyoriy)</p>

                <Field label="Oylik maosh (UZS)">
                  <input
                    type="number"
                    value={staffForm.monthlySalary}
                    onChange={(e) => patchStaff({ monthlySalary: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={inputCls(false)}
                    placeholder="5 000 000"
                    min={0}
                  />
                </Field>

                <Field label="Oy">
                  <input
                    type="month"
                    value={staffForm.salaryMonth}
                    onChange={(e) => patchStaff({ salaryMonth: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={inputCls(false)}
                  />
                </Field>

                <Field label="Boshlanish sanasi">
                  <input
                    type="date"
                    value={staffForm.salaryStartDate}
                    onChange={(e) => patchStaff({ salaryStartDate: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={inputCls(false)}
                  />
                </Field>

                <Field label="Izoh">
                  <textarea
                    value={staffForm.salaryComment}
                    onChange={(e) => patchStaff({ salaryComment: e.target.value })}
                    disabled={isSubmittingStaff}
                    className={`${inputCls(false)} resize-none`}
                    rows={2}
                    placeholder="Qo'shimcha izoh…"
                  />
                </Field>
              </div>
            </div>

            {/* Footer */}
            <ModalFooter>
              <button
                onClick={() => setShowStaffModal(false)}
                disabled={isSubmittingStaff}
                className="flex-1 px-6 py-2.5 bg-base-100 border border-base-300 text-base-content rounded-xl hover:bg-base-200 disabled:opacity-50 text-sm"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveStaff}
                disabled={isSubmittingStaff}
                className="flex-1 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmittingStaff ? <Spinner /> : selectedStaff ? "Yangilash" : "Qo'shish"}
              </button>
            </ModalFooter>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Salary Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSalaryModal && (
          <Modal onClose={() => setShowSalaryModal(false)}>
            <ModalHeader
              title={`${selectedStaff?.name} — Maosh Belgilash`}
              onClose={() => setShowSalaryModal(false)}
            />
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <Field label="Oy *">
                <input
                  type="month"
                  value={salaryForm.month}
                  onChange={(e) => patchSalary({ month: e.target.value })}
                  disabled={isSubmittingSalary}
                  className={inputCls(false)}
                />
              </Field>

              <Field label="Oylik Maosh (UZS) *" error={salaryFormErrors.monthlySalary}>
                <input
                  type="number"
                  value={salaryForm.monthlySalary}
                  onChange={(e) => patchSalary({ monthlySalary: e.target.value })}
                  disabled={isSubmittingSalary}
                  className={inputCls(salaryFormErrors.monthlySalary)}
                  placeholder="5 000 000"
                  min={0}
                />
              </Field>

              <Field label="Boshlanish sanasi">
                <input
                  type="date"
                  value={salaryForm.startDate}
                  onChange={(e) => patchSalary({ startDate: e.target.value })}
                  disabled={isSubmittingSalary}
                  className={inputCls(false)}
                />
              </Field>

              <Field label="Izoh">
                <textarea
                  value={salaryForm.comment}
                  onChange={(e) => patchSalary({ comment: e.target.value })}
                  disabled={isSubmittingSalary}
                  className={`${inputCls(false)} resize-none`}
                  rows={2}
                  placeholder="Qo'shimcha izoh…"
                />
              </Field>
            </div>
            <ModalFooter>
              <button
                onClick={() => setShowSalaryModal(false)}
                disabled={isSubmittingSalary}
                className="flex-1 px-6 py-2.5 bg-base-100 border border-base-300 text-base-content rounded-xl hover:bg-base-200 disabled:opacity-50 text-sm"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveSalary}
                disabled={isSubmittingSalary}
                className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmittingSalary ? <Spinner /> : "Saqlash"}
              </button>
            </ModalFooter>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── History Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && selectedStaff && (
          <Modal onClose={() => setShowHistoryModal(false)} maxW="max-w-lg">
            <ModalHeader
              title={`${selectedStaff.name} — Maosh Tarixi`}
              onClose={() => setShowHistoryModal(false)}
            />
            <div className="flex-1 overflow-y-auto p-6">
              {salaryHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-base-content/40 gap-3">
                  <Clock className="w-12 h-12 text-base-content/20" />
                  <p className="text-sm font-medium">Maosh tarixi yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salaryHistory.map((record, idx) => (
                    <div key={idx} className="bg-base-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-base-content text-sm">{record.month}</p>
                          <p className="text-xs text-base-content/50 mt-0.5">
                            {new Date(record.startDate || record.createdAt).toLocaleDateString("uz-UZ")}
                          </p>
                          {record.comment && (
                            <p className="text-xs text-base-content/70 mt-1">{record.comment}</p>
                          )}
                        </div>
                        <p className="text-base font-bold text-green-600 whitespace-nowrap">
                          {Number(record.monthlySalary).toLocaleString()} UZS
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ModalFooter>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-6 py-2.5 bg-base-100 border border-base-300 text-base-content rounded-xl hover:bg-base-200 text-sm"
              >
                Yopish
              </button>
            </ModalFooter>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Modal({ children, onClose, maxW = "max-w-md" }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-base-100 rounded-2xl shadow-xl w-full ${maxW} pointer-events-auto flex flex-col max-h-[90vh]`}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="px-6 py-4 border-b border-base-300 bg-base-200 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
      <h2 className="text-base font-semibold text-base-content">{title}</h2>
      <button onClick={onClose} className="p-2 hover:bg-base-300 rounded-lg transition-colors">
        <X className="w-5 h-5 text-base-content/60" />
      </button>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 flex-shrink-0 rounded-b-2xl">
      {children}
    </div>
  );
}

function ActionBtn({ color, title, onClick, children }) {
  const colors = {
    green:  "text-green-600 hover:bg-green-50",
    blue:   "text-blue-600 hover:bg-blue-50",
    yellow: "text-yellow-600 hover:bg-yellow-50",
    red:    "text-red-600 hover:bg-red-50",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}