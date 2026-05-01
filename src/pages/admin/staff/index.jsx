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

const getId = (item) => item?._id || item?.id || null;

const handleError = (message, err) => {
  const status = err?.response?.status;
  if (status === 404) {
    console.error(message, err);
    return;
  }
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
  const fullMsg = serverMsg || message;
  console.error(fullMsg, err);
  alert(fullMsg);
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);

  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);

  const [staffFormErrors, setStaffFormErrors] = useState({});
  const [salaryFormErrors, setSalaryFormErrors] = useState({});

  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "staff",
    jobTitle: "",
    hireDate: new Date().toISOString().slice(0, 10),
    specialization: "",
    monthlySalary: "",
    salaryMonth: new Date().toISOString().slice(0, 7),
    salaryStartDate: new Date().toISOString().slice(0, 10),
    salaryComment: "",
  });

  const [salaryForm, setSalaryForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    monthlySalary: "",
    startDate: new Date().toISOString().slice(0, 10),
    comment: "",
  });

  const [staffPhoneDisplay, setStaffPhoneDisplay] = useState("");

  // ── Load staff ──
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

  useEffect(() => {
    loadStaff();
  }, []);

  // ── Phone display ──
  useEffect(() => {
    if (selectedStaff?.phone) {
      setStaffPhoneDisplay(formatPhoneNumber(selectedStaff.phone));
    } else if (showStaffModal && !selectedStaff) {
      setStaffPhoneDisplay("");
    }
  }, [selectedStaff, showStaffModal]);

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("998") && digits.length === 12) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
    }
    return phone;
  };

  const handlePhoneChange = (e) => {
    setStaffForm({ ...staffForm, phone: e.target.value.replace(/\D/g, "") });
  };

  // ── Filtered staff ──
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.jobTitle?.toLowerCase().includes(q),
    );
  }, [staff, searchQuery]);

  // ── Handlers ──
  const handleSaveStaff = async () => {
    const errors = {};
    if (!staffForm.name) errors.name = "Ism kiritilishi shart!";
    if (!staffForm.phone) errors.phone = "Telefon raqami kiritilishi shart!";
    if (staffForm.email && !/^\S+@\S+\.\S+$/.test(staffForm.email)) errors.email = "Email noto'g'ri!";
    if (!selectedStaff && !staffForm.password)
      errors.password = "Parol kiritilishi shart!";
    if (Object.keys(errors).length > 0) {
      setStaffFormErrors(errors);
      return;
    }
    setStaffFormErrors({});
    setIsSubmittingStaff(true);
    try {
      const id = getId(selectedStaff);
      if (id) {
        await updateStaff(id, staffForm);
      } else {
        await createStaff(staffForm);
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

  const handleSaveSalary = async () => {
    const errors = {};
    if (!salaryForm.monthlySalary || Number(salaryForm.monthlySalary) <= 0)
      errors.monthlySalary = "Oylik maoshni kiriting!";
    if (Object.keys(errors).length > 0) {
      setSalaryFormErrors(errors);
      return;
    }
    setSalaryFormErrors({});
    setIsSubmittingSalary(true);
    try {
      const staffId = getId(selectedStaff);
      if (!staffId) {
        alert("Xodim ID topilmadi");
        return;
      }
      await setStaffSalary(staffId, {
        month: salaryForm.month,
        monthlySalary: Number(salaryForm.monthlySalary),
        startDate: salaryForm.startDate || undefined,
        comment: salaryForm.comment || "",
      });
      setShowSalaryModal(false);
      setSalaryForm({
        month: new Date().toISOString().slice(0, 7),
        monthlySalary: "",
        startDate: new Date().toISOString().slice(0, 10),
        comment: "",
      });
      setSelectedStaff(null);
      loadStaff();
    } catch (err) {
      handleError("Maosh belgilashda xatolik", err);
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  const handleDeleteStaff = async (staffMember) => {
    const id = getId(staffMember);
    if (!id) {
      alert("Xodim ID topilmadi");
      return false;
    }
    if (!window.confirm("Xodimni o'chirishni tasdiqlaysizmi?")) return false;
    try {
      await deleteStaff(id);
      loadStaff();
      return true;
    } catch (err) {
      handleError("Xodimni o'chirishda xatolik", err);
      return false;
    }
  };

  const handleViewHistory = async (staffMember) => {
    const staffId = getId(staffMember);
    if (!staffId) {
      alert("Xodim ID topilmadi");
      return;
    }
    setSelectedStaff(staffMember);
    try {
      const res = await getStaffSalaryHistory(staffId);
      setSalaryHistory(res.data.data || res.data || []);
      setShowHistoryModal(true);
    } catch (err) {
      handleError("Maosh tarixini yuklashda xatolik", err);
    }
  };

  const openAddStaffModal = () => {
    setStaffForm({
      name: "",
      phone: "",
      email: "",
      password: "",
      role: "staff",
      jobTitle: "",
      hireDate: new Date().toISOString().slice(0, 10),
      specialization: "",
      monthlySalary: "",
      salaryMonth: new Date().toISOString().slice(0, 7),
      salaryStartDate: new Date().toISOString().slice(0, 10),
      salaryComment: "",
    });
    setSelectedStaff(null);
    setStaffPhoneDisplay("");
    setStaffFormErrors({});
    setShowStaffModal(true);
  };

  const openEditStaffModal = (staffMember) => {
    const activeSalary = staffMember.salary;
    setStaffForm({
      name: staffMember.name,
      phone: staffMember.phone,
      email: staffMember.email || "",
      password: "",
      role: staffMember.role,
      jobTitle: staffMember.jobTitle || "",
      hireDate: staffMember.hireDate?.split("T")[0] || new Date().toISOString().slice(0, 10),
      specialization: staffMember.specialization || "",
      monthlySalary: activeSalary?.monthlySalary || "",
      salaryMonth: activeSalary?.month || new Date().toISOString().slice(0, 7),
      salaryStartDate: activeSalary?.startDate?.split("T")[0] || new Date().toISOString().slice(0, 10),
      salaryComment: activeSalary?.comment || "",
    });
    setStaffPhoneDisplay(formatPhoneNumber(staffMember.phone));
    setSelectedStaff(staffMember);
    setStaffFormErrors({});
    setShowStaffModal(true);
  };

  const openSalaryModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setSalaryForm({
      month: new Date().toISOString().slice(0, 7),
      monthlySalary: "",
      startDate: new Date().toISOString().slice(0, 10),
      comment: "",
    });
    setSalaryFormErrors({});
    setShowSalaryModal(true);
  };

  return (
    <div className="min-h-screen bg-base-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2 bg-base-100 border border-base-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={openAddStaffModal}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" /> Xodim Qo'shish
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-base-content/60 font-medium">Yuklanmoqda...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-base-200 border-b border-base-300">
                    <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                      Xodim
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                      Lavozim
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                      Holat
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-base-content/70 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-12 h-12 text-base-content/20 mx-auto" />
                          <p className="text-sm font-medium text-base-content/50">
                            Xodimlar yo'q
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staffMember) => (
                      <tr
                        key={staffMember._id || staffMember.id}
                        className="hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                              {staffMember.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "??"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-base-content">
                                {staffMember.name}
                              </p>
                              {staffMember.specialization && (
                                <p className="text-xs font-medium text-base-content/50">
                                  {staffMember.specialization}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-base-content">
                          {staffMember.jobTitle || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700">
                            {staffMember.role || "staff"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-base-content/70 font-mono">
                          {staffMember.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              staffMember.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {staffMember.status || "active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openSalaryModal(staffMember)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Maosh"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewHistory(staffMember)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Tarix"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditStaffModal(staffMember)}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Tahrir"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staffMember)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="O'chir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStaffModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-base-100 rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-base-300 bg-base-200 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-base-content">
                    {selectedStaff ? "Xodimni Tahrirlash" : "Yangi Xodim"}
                  </h2>
                  <button
                    onClick={() => setShowStaffModal(false)}
                    className="p-2 hover:bg-base-300 rounded-lg"
                  >
                    <X className="w-5 h-5 text-base-content/60" />
                  </button>
                </div>
                {Object.keys(staffFormErrors).length > 0 && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Xatolarni to'g'irlang:
                      </span>
                    </div>
                    <ul className="mt-2 ml-7 text-sm text-red-600 list-disc space-y-1">
                      {Object.values(staffFormErrors).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {[
                    { label: "Ism *", field: "name", type: "text", placeholder: "Ali Karimov", required: true },
                    { label: "Telefon *", field: "phone", type: "tel", placeholder: "+998901234567", required: true },
                    { label: "Email", field: "email", type: "email", placeholder: "ali@example.com" },
                    { label: "Lavozim", field: "jobTitle", type: "text", placeholder: "Manager, Accountant" },
                    { label: "Ishga qabul qilingan sana", field: "hireDate", type: "date" },
                    { label: "Mutaxassislik", field: "specialization", type: "text", placeholder: "IT, Accounting" },
                  ].map(({ label, field, type, placeholder, required }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-base-content/80 mb-2">
                        {label}
                      </label>
                      {field === "phone" ? (
                        <PhoneInput
                          value={staffPhoneDisplay}
                          onChange={handlePhoneChange}
                          disabled={isSubmittingStaff}
                          placeholder={placeholder}
                          className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${required && staffFormErrors[field] ? "border-red-500 bg-red-50" : "border-base-300"}`}
                        />
                      ) : (
                        <input
                          type={type}
                          value={staffForm[field]}
                          onChange={(e) => setStaffForm({ ...staffForm, [field]: e.target.value })}
                          disabled={isSubmittingStaff}
                          className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${required && staffFormErrors[field] ? "border-red-500 bg-red-50" : "border-base-300"}`}
                          placeholder={placeholder}
                        />
                      )}
                      {required && staffFormErrors[field] && (
                        <p className="mt-1 text-xs text-red-600">{staffFormErrors[field]}</p>
                      )}
                    </div>
                  ))}
                  {!selectedStaff && (
                    <div>
                      <label className="block text-sm font-medium text-base-content/80 mb-2">
                        Parol *
                      </label>
                      <input
                        type="password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        disabled={isSubmittingStaff}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${staffFormErrors.password ? "border-red-500 bg-red-50" : "border-base-300"}`}
                        placeholder="•••••••••"
                      />
                      {staffFormErrors.password && (
                        <p className="mt-1 text-xs text-red-600">{staffFormErrors.password}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Role
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      disabled={isSubmittingStaff}
                      className="select select-bordered w-full"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="assistant">Assistant</option>
                      <option value="supporter">Supporter</option>
                    </select>
                  </div>

                  {/* Inline Salary */}
                  <div className="pt-4 border-t border-base-200">
                    <p className="text-sm font-semibold text-base-content/80 mb-3">Maosh (ixtiyoriy)</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-base-content/80 mb-2">
                          Oylik maosh (UZS)
                        </label>
                        <input
                          type="number"
                          value={staffForm.monthlySalary}
                          onChange={(e) => setStaffForm({ ...staffForm, monthlySalary: e.target.value })}
                          disabled={isSubmittingStaff}
                          className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none disabled:opacity-50"
                          placeholder="5000000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-base-content/80 mb-2">
                          Oy
                        </label>
                        <input
                          type="month"
                          value={staffForm.salaryMonth}
                          onChange={(e) => setStaffForm({ ...staffForm, salaryMonth: e.target.value })}
                          disabled={isSubmittingStaff}
                          className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-base-content/80 mb-2">
                          Boshlanish sanasi
                        </label>
                        <input
                          type="date"
                          value={staffForm.salaryStartDate}
                          onChange={(e) => setStaffForm({ ...staffForm, salaryStartDate: e.target.value })}
                          disabled={isSubmittingStaff}
                          className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-base-content/80 mb-2">
                          Izoh
                        </label>
                        <textarea
                          value={staffForm.salaryComment}
                          onChange={(e) => setStaffForm({ ...staffForm, salaryComment: e.target.value })}
                          disabled={isSubmittingStaff}
                          className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none resize-none disabled:opacity-50"
                          rows={2}
                          placeholder="Qo'shimcha izoh..."
                        />
                      </div>
                    </div>
                  </div>

                </div>
                <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowStaffModal(false)}
                    disabled={isSubmittingStaff}
                    className="flex-1 px-6 py-2.5 bg-base-100 border border-base-300 text-base-content rounded-xl hover:bg-base-200 disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSaveStaff}
                    disabled={isSubmittingStaff}
                    className="flex-1 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingStaff ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : selectedStaff ? (
                      "Yangilash"
                    ) : (
                      "Qo'shish"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Salary Modal */}
      <AnimatePresence>
        {showSalaryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSalaryModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-base-100 rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-base-300 bg-base-200 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-base-content">
                    {selectedStaff?.name} — Maosh Belgilash
                  </h2>
                  <button
                    onClick={() => setShowSalaryModal(false)}
                    className="p-2 hover:bg-base-300 rounded-lg"
                  >
                    <X className="w-5 h-5 text-base-content/60" />
                  </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Oy *
                    </label>
                    <input
                      type="month"
                      value={salaryForm.month}
                      onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                      disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Oylik Maosh (UZS) *
                    </label>
                    <input
                      type="number"
                      value={salaryForm.monthlySalary}
                      onChange={(e) => setSalaryForm({ ...salaryForm, monthlySalary: e.target.value })}
                      disabled={isSubmittingSalary}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${salaryFormErrors.monthlySalary ? "border-red-500 bg-red-50" : "border-base-300"}`}
                      placeholder="5000000"
                    />
                    {salaryFormErrors.monthlySalary && (
                      <p className="mt-1 text-xs text-red-600">{salaryFormErrors.monthlySalary}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Boshlanish sanasi
                    </label>
                    <input
                      type="date"
                      value={salaryForm.startDate}
                      onChange={(e) => setSalaryForm({ ...salaryForm, startDate: e.target.value })}
                      disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Izoh
                    </label>
                    <textarea
                      value={salaryForm.comment}
                      onChange={(e) => setSalaryForm({ ...salaryForm, comment: e.target.value })}
                      disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none resize-none disabled:opacity-50"
                      rows={2}
                      placeholder="Qo'shimcha izoh..."
                    />
                  </div>
                </div>
                <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowSalaryModal(false)}
                    disabled={isSubmittingSalary}
                    className="flex-1 px-6 py-2.5 bg-base-100 border border-base-300 text-base-content rounded-xl hover:bg-base-200 disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSaveSalary}
                    disabled={isSubmittingSalary}
                    className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingSalary ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : (
                      "Saqlash"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedStaff && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="px-6 py-4 border-b border-base-300 bg-base-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-base-content">
                    {selectedStaff.name} — Maosh Tarixi
                  </h2>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 hover:bg-base-300 rounded-lg"
                  >
                    <X className="w-5 h-5 text-base-content/60" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {salaryHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                      <Clock className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                      <p className="text-sm font-medium">Maosh tarixi yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {salaryHistory.map((record, idx) => (
                        <div key={idx} className="bg-base-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="font-medium text-base-content">
                                {record.month}
                              </p>
                              <p className="text-xs text-base-content/50">
                                {new Date(record.startDate || record.createdAt).toLocaleDateString("uz-UZ")}
                              </p>
                            </div>
                            <p className="text-lg font-semibold text-green-600">
                              {Number(record.monthlySalary).toLocaleString()} UZS
                            </p>
                          </div>
                          {record.comment && (
                            <p className="text-sm text-base-content/70">
                              {record.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex-shrink-0">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="w-full px-6 py-2.5 bg-base-100 border border-base-300 text-base-content rounded-xl hover:bg-base-200 font-medium"
                  >
                    Yopish
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
