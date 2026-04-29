
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit3, Trash2, Wallet, Calendar, Users,
  DollarSign, X, AlertCircle, TrendingUp, TrendingDown,
  Clock, Tag, FileText, GraduationCap, UserPlus, Building2,
  ArrowUpCircle, ArrowDownCircle, BarChart3, RefreshCw, CheckCircle,
} from "lucide-react";
import {
  usePayments, usePaymentForm, savePayment, removePayment,
  savePaymentType, removePaymentType, saveStaffSalary,
  getStaffSalaryHistoryData, removeStaff, saveStaff,
} from "./hooks";
import { getAllTeachers } from "../../../api/teacher";
import { getStudents } from "../../../api/students";
import { getAllGroups } from "../../../api/groups";
import PhoneInput from "../../../components/PhoneInput";

export default function PaymentsPage() {
  const {
    payments: rawPayments, paymentTypes: rawTypes, staff: rawStaff,
    loading, activeTab, setActiveTab, report, filters, setFilters,
    loadPayments, loadPaymentTypes, loadReport, loadStaff,
  } = usePayments();

  const payments = Array.isArray(rawPayments) ? rawPayments : [];
  const paymentTypes = Array.isArray(rawTypes) ? rawTypes : [];
  const staff = Array.isArray(rawStaff) ? rawStaff : [];

  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNestedTypeModal, setShowNestedTypeModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [paymentCategory, setPaymentCategory] = useState("all");

  const [recipientCategory, setRecipientCategory] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [recipientDebt, setRecipientDebt] = useState(0);
  const [recipientDebtInfo, setRecipientDebtInfo] = useState({ debt: 0, salary: 0, paid: 0, lastPayment: 0 });
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [typeFormErrors, setTypeFormErrors] = useState({});
  const [staffFormErrors, setStaffFormErrors] = useState({});
  const [salaryFormErrors, setSalaryFormErrors] = useState({});

  // ── Number formatting ──
  const formatNumber = (value) => {
    if (!value) return "";
    const numStr = value.toString().replace(/\D/g, "");
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return numStr;
    return num.toLocaleString("uz-UZ");
  };

  const parseFormattedNumber = (value) => {
    if (!value) return "";
    return value.replace(/\s/g, "").replace(/,/g, "");
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const plainNumber = parseFormattedNumber(rawValue);
    setAmountInput(rawValue);
    setPaymentForm({ ...paymentForm, amount: plainNumber });
  };

  const [paymentForm, setPaymentForm] = useState({
    type: "", amount: "", month: new Date().toISOString().slice(0, 7),
    toWho: "", date: new Date().toISOString().slice(0, 10), comment: "",
  });

  const [typeForm, setTypeForm] = useState({ name: "", code: "", dk: "credit", description: "" });

  const [salaryForm, setSalaryForm] = useState({
    month: new Date().toISOString().slice(0, 7), monthlySalary: "",
    startDate: new Date().toISOString().slice(0, 10), comment: "",
  });

  const [staffForm, setStaffForm] = useState({
    name: "", phone: "", password: "", role: "staff",
    jobTitle: "", hireDate: new Date().toISOString().slice(0, 10), specialization: "",
  });
  const [staffPhoneDisplay, setStaffPhoneDisplay] = useState('');

  // ── Load teachers/students/groups/staff for recipient selection ──
  useEffect(() => {
    if (showPaymentModal) {
      const loadData = async () => {
        try {
          const [teachersRes, studentsRes, groupsRes] = await Promise.all([
            getAllTeachers(), getStudents({ limit: 1000 }), getAllGroups(),
          ]);
          setTeachers(teachersRes.data.data || teachersRes.data || []);
          setStudents(studentsRes.data.data || studentsRes.data || []);
          setGroups(groupsRes.data.data || groupsRes.data || []);
          // Load staff data for payment modal
          loadStaff();
        } catch (err) {
          console.error("Ma'lumotlarni yuklashda xatolik:", err);
        }
      };
      loadData();
    }
  }, [showPaymentModal, loadStaff]);

  useEffect(() => {
    if (selectedGroup) {
      const groupStudents = students.filter((s) => {
        const sgId = s.group?._id || s.group?.id;
        return sgId === selectedGroup.id || sgId === selectedGroup._id;
      });
      setFilteredStudents(groupStudents);
    } else {
      setFilteredStudents(students);
    }
  }, [selectedGroup, students]);

  useEffect(() => {
    if (!showPaymentModal) { setFormErrors({}); setIsSubmitting(false); }
    if (!showTypeModal) { setTypeFormErrors({}); setIsSubmittingType(false); }
    if (!showStaffModal) {
      setStaffFormErrors({}); setIsSubmittingStaff(false);
      setStaffPhoneDisplay('');
    }
    if (!showSalaryModal) { setSalaryFormErrors({}); setIsSubmittingSalary(false); }
  }, [showPaymentModal, showTypeModal, showStaffModal, showSalaryModal]);

  useEffect(() => {
    if (activeTab === "staff") loadStaff();
  }, [activeTab]);

  // Staff phone display yangilash
  useEffect(() => {
    if (selectedStaff?.phone) {
      setStaffPhoneDisplay(formatPhoneNumber(selectedStaff.phone));
    } else if (showStaffModal && !selectedStaff) {
      setStaffPhoneDisplay('');
    }
  }, [selectedStaff, showStaffModal]);

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    let out = '';
    if (digits.length > 0) out += '(' + digits.slice(0, 2);
    if (digits.length > 2) out += ') ' + digits.slice(2, 5);
    if (digits.length > 5) out += '-' + digits.slice(5, 7);
    if (digits.length > 7) out += '-' + digits.slice(7, 9);
    return out;
  };

  const handleStaffPhoneChange = (e) => {
    setStaffPhoneDisplay(e.target.value);
    setStaffForm({ ...staffForm, phone: e.target.value.replace(/\D/g, '') });
  };

  // ── Kirim / Chiqim hisoblash ──
const typeMap = useMemo(() => {
  const map = {};
  paymentTypes.forEach(t => { map[t._id || t.id] = t.dk; });
  return map;
}, [paymentTypes]);

const getDk = (payment) => {
  if (payment.type?.dk) return payment.type.dk;
  const typeId = payment.type?._id || payment.type?.id || payment.type;
  return typeMap[typeId] || null;
};

const totalIncome = payments
  .filter(p => getDk(p) === "credit")
  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

const totalExpense = payments
  .filter(p => getDk(p) === "debit")
  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

const netBalance = totalIncome - totalExpense;


  // ── Recipient helpers ──
  const calculateRecipientDebt = (person) => {
    if (!person) return { debt: 0, salary: 0, paid: 0, lastPayment: 0 };
    let monthlySalary = 0;
    if (recipientCategory === "staff" && person.salaries) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const salaryRecord = person.salaries.find(s => s.month?.startsWith(currentMonth));
      if (salaryRecord) monthlySalary = Number(salaryRecord.monthlySalary) || 0;
    }
    const currentMonth = new Date().toISOString().slice(0, 7);
    const personPayments = payments.filter(
      p => (p.toWho?._id || p.toWho?.id || p.toWho) === (person._id || person.id) && p.month?.startsWith(currentMonth)
    );
    const totalPaid = personPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const sorted = [...personPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastPayment = sorted.length > 0 ? sorted[0].amount : 0;
    const debt = Math.max(0, monthlySalary - totalPaid);
    return { debt, salary: monthlySalary, paid: totalPaid, lastPayment };
  };

  const getFilteredRecipients = () => {
    const searchLower = recipientSearch.toLowerCase();
    if (recipientCategory === "teacher") return teachers.filter(t => t.name?.toLowerCase().includes(searchLower));
    if (recipientCategory === "staff") return staff.filter(s => s.name?.toLowerCase().includes(searchLower));
    if (recipientCategory === "student") return filteredStudents.filter(s =>
      s.name?.toLowerCase().includes(searchLower) || s.phone?.includes(searchLower)
    );
    return [];
  };

  const resetPaymentModal = () => {
    setPaymentForm({ type: "", amount: "", month: new Date().toISOString().slice(0, 7), toWho: "", date: new Date().toISOString().slice(0, 10), comment: "" });
    setAmountInput("");
    setEditingPayment(null);
    setRecipientCategory(""); setSelectedGroup(null); setRecipientSearch("");
    setSelectedRecipient(null); setRecipientDebt(0);
    setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 });
  };

  // ── Handlers ──
  const handleSavePayment = async () => {
    const errors = {};
    if (!paymentForm.type) errors.type = "To'lov turini tanlang!";
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) errors.amount = "Summani kiriting!";
    if (!paymentForm.toWho) errors.toWho = "Kimga ekanligini tanlang!";
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({}); setIsSubmitting(true);
    try {
      const success = await savePayment(editingPayment, {
        type: paymentForm.type, amount: Number(paymentForm.amount),
        month: paymentForm.month, toWho: paymentForm.toWho,
        date: paymentForm.date, comment: paymentForm.comment,
      });
      if (success) { setShowPaymentModal(false); resetPaymentModal(); loadPayments(); }
    } finally { setIsSubmitting(false); }
  };

  const handleSaveType = async () => {
    const errors = {};
    if (!typeForm.name) errors.name = "Nomi kiritilishi shart!";
    if (Object.keys(errors).length > 0) { setTypeFormErrors(errors); return; }
    setTypeFormErrors({}); setIsSubmittingType(true);
    try {
      const success = await savePaymentType(editingType, typeForm);
      if (success) { setShowTypeModal(false); setTypeForm({ name: "", code: "", dk: "credit", description: "" }); setEditingType(null); loadPaymentTypes(); }
    } finally { setIsSubmittingType(false); }
  };

  // Nested modal ichida to'lov turini qo'shish (payment modal ichida)
  const handleSaveNestedType = async () => {
    const errors = {};
    if (!typeForm.name) errors.name = "Nomi kiritilishi shart!";
    if (Object.keys(errors).length > 0) { setTypeFormErrors(errors); return; }
    setTypeFormErrors({}); setIsSubmittingType(true);
    try {
      const success = await savePaymentType(null, typeForm);
      if (success) {
        // Yangi turi qo'shilgandan so'ng, to'lov turlarini yangilash
        await loadPaymentTypes();
        // Yangi qo'shilgan turini avtomatik tanlash (oxirgi qo'shilganini)
        setTimeout(() => {
          const currentPaymentTypes = paymentTypes || [];
          const newestType = currentPaymentTypes[currentPaymentTypes.length - 1];
          if (newestType) {
            setPaymentForm(prev => ({ ...prev, type: newestType._id || newestType.id }));
          }
          // Nested modalni yopish va formni tozalash
          setShowNestedTypeModal(false);
          setTypeForm({ name: "", code: "", dk: "credit", description: "" });
        }, 300);
      }
    } finally { setIsSubmittingType(false); }
  };

  const handleDeleteType = async (id) => { if (await removePaymentType(id)) loadPaymentTypes(); };

  // ✅ FIX: saveStaff import qilingan va ishlatilmoqda
  const handleSaveStaff = async () => {
    const errors = {};
    if (!staffForm.name) errors.name = "Ism kiritilishi shart!";
    if (!staffForm.phone) errors.phone = "Telefon raqami kiritilishi shart!";
    if (!selectedStaff && !staffForm.password) errors.password = "Parol kiritilishi shart!";
    if (Object.keys(errors).length > 0) { setStaffFormErrors(errors); return; }
    setStaffFormErrors({}); setIsSubmittingStaff(true);
    try {
      const success = await saveStaff(selectedStaff || null, staffForm);
      if (success) {
        setShowStaffModal(false); setSelectedStaff(null);
        setStaffForm({ name: "", phone: "", password: "", role: "staff", jobTitle: "", hireDate: new Date().toISOString().slice(0, 10), specialization: "" });
        loadStaff();
      }
    } finally { setIsSubmittingStaff(false); }
  };

  const handleSaveSalary = async () => {
    const errors = {};
    if (!salaryForm.monthlySalary) errors.monthlySalary = "Oylik maosh kiritilishi shart!";
    if (Object.keys(errors).length > 0) { setSalaryFormErrors(errors); return; }
    setSalaryFormErrors({}); setIsSubmittingSalary(true);
    try {
      const success = await saveStaffSalary(selectedStaff, salaryForm);
      if (success) {
        setShowSalaryModal(false);
        setSalaryForm({ month: new Date().toISOString().slice(0, 7), monthlySalary: "", startDate: new Date().toISOString().slice(0, 10), comment: "" });
        setSelectedStaff(null); loadStaff();
      }
    } finally { setIsSubmittingSalary(false); }
  };

  const handleDeleteStaff = async (staffMember) => { if (await removeStaff(staffMember)) loadStaff(); };

  const handleViewHistory = async (staffMember) => {
    setSelectedStaff(staffMember);
    const history = await getStaffSalaryHistoryData(staffMember._id || staffMember.id);
    setSalaryHistory(history);
    setShowHistoryModal(true);
  };

  // ── Recipient type detection ──
  const getRecipientType = (payment) => {
    const recipientId = payment.toWho?._id || payment.toWho?.id || payment.toWho;
    if (!recipientId) return "unknown";

    // Check if it's a teacher
    if (teachers.some(t => (t._id || t.id) === recipientId)) return "teacher";
    // Check if it's a staff member
    if (staff.some(s => (s._id || s.id) === recipientId)) return "staff";
    // Check if it's a student
    if (students.some(s => (s._id || s.id) === recipientId)) return "student";

    return "unknown";
  };

  // ── Filtered lists ──
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      (p.type?.name || p.type?.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof p.toWho === "object" ? p.toWho?.name : p.toWho || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.comment || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = paymentCategory === "all" || getRecipientType(p) === paymentCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredTypes = paymentTypes.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staff.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery) ||
    s.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              To'lovlar Boshqaruvi
            </h1>
            <p className="text-slate-500 mt-2 ml-15 font-medium">Moliyaviy operatsiyalar va hisobotlar</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" placeholder="Qidirish..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── STATS CARDS — Kirim / Chiqim / Balans alohida ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Jami to'lovlar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
                <p className="text-sm font-medium text-slate-500">Jami to'lovlar</p>
              </div>
            </div>
          </div>

          {/* Kirim */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ArrowUpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  +{Number(totalIncome).toLocaleString()}
                </p>
                <p className="text-sm font-medium text-slate-500">Kirim (UZS)</p>
              </div>
            </div>
          </div>

          {/* Chiqim */}
          <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <ArrowDownCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  -{Number(totalExpense).toLocaleString()}
                </p>
                <p className="text-sm font-medium text-slate-500">Chiqim (UZS)</p>
              </div>
            </div>
          </div>

          {/* Sof balans */}
          <div className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow ${netBalance >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${netBalance >= 0 ? "bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20" : "bg-gradient-to-br from-red-600 to-rose-700 shadow-red-500/20"}`}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {netBalance >= 0 ? "+" : ""}{Number(netBalance).toLocaleString()}
                </p>
                <p className="text-sm font-medium text-slate-500">Sof Balans (UZS)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Payment Category Tabs */}
          <div className="border-b border-slate-200">
            <div className="px-4 py-3 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">To'lovlar Bo'limi</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "all", label: "Barcha", icon: Wallet },
                  { id: "student", label: "O'quvchilar", icon: UserPlus },
                  { id: "teacher", label: "O'qituvchilar", icon: GraduationCap },
                  { id: "staff", label: "Xodimlar", icon: Building2 },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setPaymentCategory(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                      paymentCategory === tab.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id !== "all" && (
                      <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-white/20">
                        {payments.filter(p => getRecipientType(p) === tab.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="flex border-b border-slate-200">
            {[
              { id: "payments", label: "To'lovlar", icon: Wallet },
              { id: "staff", label: "Xodimlar Boshqaruvi", icon: Users },
              { id: "reports", label: "Hisobotlar", icon: FileText },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action bar - Yuqorida yangi to'lov tugmasi */}
          {activeTab === "payments" && (
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {paymentCategory === "all" ? "Barcha To'lovlar" :
                   paymentCategory === "student" ? "O'quvchilar To'lovi" :
                   paymentCategory === "teacher" ? "O'qituvchilar To'lovi" :
                   "Xodimlar To'lovi"}
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {filteredPayments.length} ta to'lov {paymentCategory !== "all" && `• ${paymentCategory === "student" ? "O'quvchilar" : paymentCategory === "teacher" ? "O'qituvchilar" : "Xodimlar"}`}
                </p>
              </div>
              <button onClick={() => { resetPaymentModal(); setShowPaymentModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all font-bold">
                <Plus className="w-4 h-4" /> Yangi To'lov
              </button>
            </div>
          )}

          <div className="p-6">
            {/* ── Payments Tab ── */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <>
                    {/* Category specific stats */}
                    {paymentCategory !== "all" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Total payments for this category */}
                        <div className={`rounded-xl p-4 border ${
                          paymentCategory === "student" ? "bg-blue-50 border-blue-200" :
                          paymentCategory === "teacher" ? "bg-violet-50 border-violet-200" :
                          "bg-orange-50 border-orange-200"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {paymentCategory === "student" && <UserPlus className="w-5 h-5 text-blue-600" />}
                            {paymentCategory === "teacher" && <GraduationCap className="w-5 h-5 text-violet-600" />}
                            {paymentCategory === "staff" && <Building2 className="w-5 h-5 text-orange-600" />}
                            <span className="text-sm font-medium text-slate-700">
                              {paymentCategory === "student" ? "O'quvchilar" :
                               paymentCategory === "teacher" ? "O'qituvchilar" : "Xodimlar"}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">
                            {filteredPayments.length} ta to'lov
                          </p>
                        </div>

                        {/* Income for this category */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">Kirim</span>
                          </div>
                          <p className="text-2xl font-bold text-emerald-700">
                            +{Number(filteredPayments.filter(p => getDk(p) === "credit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()} UZS
                          </p>
                        </div>

                        {/* Expense for this category */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowDownCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Chiqim</span>
                          </div>
                          <p className="text-2xl font-bold text-red-700">
                            -{Number(filteredPayments.filter(p => getDk(p) === "debit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()} UZS
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Kirim/Chiqim breakdown mini bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">Kirimlar</span>
<span className="text-xs text-emerald-500">({filteredPayments.filter(p => getDk(p) === "credit").length} ta)</span>
                        </div>
                        <span className="font-bold text-emerald-700">+{Number(filteredPayments.filter(p => getDk(p) === "credit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()} UZS</span>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Chiqimlar</span>
<span className="text-xs text-red-500">({filteredPayments.filter(p => getDk(p) === "debit").length} ta)</span>
                        </div>
                        <span className="font-bold text-red-700">-{Number(filteredPayments.filter(p => getDk(p) === "debit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()} UZS</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Sana</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Turi</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Kim uchun</th>
                              {paymentCategory === "all" && (
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tur</th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Oy</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Summa</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Izoh</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Amallar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPayments.length === 0 ? (
                              <tr>
                                <td colSpan={paymentCategory === "all" ? 8 : 7} className="px-6 py-16 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <Wallet className="w-12 h-12 text-slate-300 mx-auto" />
                                    <p className="text-sm font-medium text-slate-500">
                                      {paymentCategory === "all" ? "To'lovlar yo'q" :
                                       paymentCategory === "student" ? "O'quvchi to'lovlari yo'q" :
                                       paymentCategory === "teacher" ? "O'qituvchi to'lovlari yo'q" :
                                       "Xodim to'lovlari yo'q"}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredPayments.map((payment) => {
                                const recipientType = getRecipientType(payment);
                                return (
                                <tr key={payment._id || payment.id}
                                  className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                  <td className="px-4 py-3 text-sm font-medium text-slate-600">
                                    {new Date(payment.date).toLocaleDateString("uz-UZ")}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${
                                      payment.type?.dk === "credit"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-700"
                                    }`}>
                                      {payment.type?.dk === "credit"
                                        ? <ArrowUpCircle className="w-3 h-3" />
                                        : <ArrowDownCircle className="w-3 h-3" />}
                                      {payment.type?.name || payment.type?.code || "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                    {typeof payment.toWho === "object"
                                      ? payment.toWho?.name || "—"
                                      : payment.toWho || "—"}
                                  </td>
                                  {paymentCategory === "all" && (
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                        recipientType === "student" ? "bg-blue-100 text-blue-700" :
                                        recipientType === "teacher" ? "bg-violet-100 text-violet-700" :
                                        recipientType === "staff" ? "bg-orange-100 text-orange-700" :
                                        "bg-gray-100 text-gray-700"
                                      }`}>
                                        {recipientType === "student" ? "O'quvchi" :
                                         recipientType === "teacher" ? "O'qituvchi" :
                                         recipientType === "staff" ? "Xodim" : "Noma'lum"}
                                      </span>
                                    </td>
                                  )}
                                  <td className="px-4 py-3 text-sm font-medium text-slate-600">{payment.month || "—"}</td>
                                  <td className={`px-4 py-3 text-sm font-bold text-right ${
                                    payment.type?.dk === "credit" ? "text-emerald-600" : "text-red-600"
                                  }`}>
                                    {payment.type?.dk === "credit" ? "+" : "-"}
                                    {Number(payment.amount || 0).toLocaleString()} UZS
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-600 max-w-xs truncate">
                                    {payment.comment || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => {
                                        setEditingPayment(payment);
                                        const amount = payment.amount || "";
                                        setPaymentForm({
                                          type: payment.type?._id || payment.type?.id || payment.type || "",
                                          amount: amount, month: payment.month || new Date().toISOString().slice(0, 7),
                                          toWho: payment.toWho?._id || payment.toWho?.id || payment.toWho || "",
                                          date: payment.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                                          comment: payment.comment || "",
                                        });
                                        setAmountInput(formatNumber(amount));
                                        setRecipientCategory(recipientType); setSelectedGroup(null); setRecipientSearch("");
                                        setSelectedRecipient(null); setRecipientDebt(0);
                                        setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 });
                                        setShowPaymentModal(true);
                                      }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Tahrirlash">
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button onClick={async () => { if (await removePayment(payment)) loadPayments(); }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="O'chirish">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )})
                            )}
                          </tbody>
                          {filteredPayments.length > 0 && (
                            <tfoot>
                              <tr className="bg-slate-50 border-t-2 border-slate-200">
                                <td colSpan={paymentCategory === "all" ? 5 : 4} className="px-4 py-3 text-sm font-semibold text-slate-600">Jami</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-xs text-emerald-600 font-medium">+{Number(filteredPayments.filter(p => getDk(p) === "credit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()} UZS</span>
                                    <span className="text-xs text-red-600 font-medium">-{Number(filteredPayments.filter(p => getDk(p) === "debit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()} UZS</span>
                                    <span className={`text-sm font-bold ${filteredPayments.filter(p => getDk(p) === "credit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) - filteredPayments.filter(p => getDk(p) === "debit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                                      = {filteredPayments.filter(p => getDk(p) === "credit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) - filteredPayments.filter(p => getDk(p) === "debit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) >= 0 ? "+" : ""}{Number(filteredPayments.filter(p => getDk(p) === "credit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) - filteredPayments.filter(p => getDk(p) === "debit").reduce((sum, p) => sum + (Number(p.amount) || 0), 0)).toLocaleString()} UZS
                                    </span>
                                  </div>
                                </td>
                                <td colSpan={2}></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Staff Tab ── */}
            {activeTab === "staff" && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-4">
                      <button onClick={() => {
                        setStaffForm({ name: "", phone: "", password: "", role: "staff", jobTitle: "", hireDate: new Date().toISOString().slice(0, 10), specialization: "" });
                        setSelectedStaff(null);
                        setStaffPhoneDisplay('');
                        setShowStaffModal(true);
                      }} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold shadow-lg shadow-purple-500/20">
                        <Plus className="w-4 h-4" /> Xodim Qo'shish
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Xodim</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Lavozim</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Telefon</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Holat</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Amallar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStaff.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <Users className="w-12 h-12 text-slate-300 mx-auto" />
                                    <p className="text-sm font-medium text-slate-500">Xodimlar yo'q</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredStaff.map((staffMember) => (
                                <tr key={staffMember._id || staffMember.id}
                                  className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                        {staffMember.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-slate-900">{staffMember.name}</p>
                                        {staffMember.specialization && <p className="text-xs font-medium text-slate-500">{staffMember.specialization}</p>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{staffMember.jobTitle || "—"}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700">{staffMember.role || "staff"}</span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-600 font-mono">{staffMember.phone || "—"}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${staffMember.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                      {staffMember.status || "active"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => { setSelectedStaff(staffMember); setShowSalaryModal(true); }}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Maosh">
                                        <DollarSign className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleViewHistory(staffMember)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Tarix">
                                        <Clock className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => {
                                        setStaffForm({ name: staffMember.name, phone: staffMember.phone, password: "", role: staffMember.role, jobTitle: staffMember.jobTitle || "", hireDate: staffMember.hireDate?.split("T")[0] || new Date().toISOString().slice(0, 10), specialization: staffMember.specialization || "" });
                                        setStaffPhoneDisplay(formatPhoneNumber(staffMember.phone));
                                        setSelectedStaff(staffMember); setShowStaffModal(true);
                                      }} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Tahrir">
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDeleteStaff(staffMember)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="O'chir">
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
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Reports Tab — TO'LIQ ISHLAYDI ── */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => loadReport("daily")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold">
                    <RefreshCw className="w-4 h-4" /> Kunlik
                  </button>
                  <button onClick={() => loadReport("monthly")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-bold">
                    <RefreshCw className="w-4 h-4" /> Oylik
                  </button>
                </div>

                {!report ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => loadReport("daily")}
                      className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left">
                      <Calendar className="w-8 h-8 text-blue-600 mb-3" />
                      <h3 className="font-bold text-lg text-slate-900 mb-2">Kunlik Hisobot</h3>
                      <p className="text-sm font-medium text-slate-500">Bugungi to'lovlar xulosasi</p>
                    </button>
                    <button onClick={() => loadReport("monthly")}
                      className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left">
                      <FileText className="w-8 h-8 text-green-600 mb-3" />
                      <h3 className="font-bold text-lg text-slate-900 mb-2">Oylik Hisobot</h3>
                      <p className="text-sm font-medium text-slate-500">Bu oyning to'lovlar xulosasi</p>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Jami kirim */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-700">Jami Kirim</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-700">
                          {Number(
                            report.totalIncome ?? report.totalDailyCollection ?? report.income ?? 0
                          ).toLocaleString()} UZS
                        </p>
                      </div>

                      {/* Jami chiqim */}
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <ArrowDownCircle className="w-6 h-6 text-red-600" />
                          <span className="text-sm font-bold text-red-700">Jami Chiqim</span>
                        </div>
                        <p className="text-2xl font-black text-red-700">
                          {Number(
                            report.totalExpense ?? report.totalDailySalaries ?? report.expense ?? 0
                          ).toLocaleString()} UZS
                        </p>
                      </div>

                      {/* Sof daromad */}
                      <div className={`border rounded-2xl p-5 ${
                        (report.netIncome ?? report.dailyNetIncome ?? 0) >= 0
                          ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <BarChart3 className={`w-6 h-6 ${(report.netIncome ?? report.dailyNetIncome ?? 0) >= 0 ? "text-blue-600" : "text-orange-600"}`} />
                          <span className={`text-sm font-bold ${(report.netIncome ?? report.dailyNetIncome ?? 0) >= 0 ? "text-blue-700" : "text-orange-700"}`}>Sof Daromad</span>
                        </div>
                        <p className={`text-2xl font-black ${(report.netIncome ?? report.dailyNetIncome ?? 0) >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                          {Number(report.netIncome ?? report.dailyNetIncome ?? 0).toLocaleString()} UZS
                        </p>
                      </div>
                    </div>

                    {/* Detail cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {report.studentPayments && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <UserPlus className="w-5 h-5 text-blue-500" />
                            <span className="font-bold text-slate-700">O'quvchilar To'lovi</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">{report.studentPayments.count || 0} ta</p>
                          <p className="text-sm font-medium text-slate-500 mt-1">
                            Kutilgan: {Number(report.studentPayments.totalMonthlyExpected || 0).toLocaleString()} UZS
                          </p>
                        </div>
                      )}
                      {report.teacherSalaries && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <GraduationCap className="w-5 h-5 text-violet-500" />
                            <span className="font-bold text-slate-700">O'qituvchi Maoshi</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">{report.teacherSalaries.count || 0} ta</p>
                          <p className="text-sm font-medium text-slate-500 mt-1">
                            Kutilgan: {Number(report.teacherSalaries.totalMonthlyExpected || 0).toLocaleString()} UZS
                          </p>
                        </div>
                      )}
                      {report.staffSalaries && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-5 h-5 text-orange-500" />
                            <span className="font-bold text-slate-700">Xodimlar Maoshi</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">{report.staffSalaries.count || 0} ta</p>
                          <p className="text-sm font-medium text-slate-500 mt-1">
                            Kutilgan: {Number(report.staffSalaries.totalMonthlyExpected || 0).toLocaleString()} UZS
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Raw data for any extra fields */}
                    {report.date && (
                      <p className="text-xs font-bold text-slate-400 text-center">Sana: {report.date}</p>
                    )}

                    <button onClick={() => setReport && window.location.reload()} className="text-sm font-medium text-slate-500 hover:text-slate-700 underline">
                      Hisobotni yopish
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-bold text-slate-900">{editingPayment ? "To'lovni Tahrirlash" : "Yangi To'lov"}</h2>
                  <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                {Object.keys(formErrors).length > 0 && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" /><span className="text-sm font-bold">Xatolarni to'g'irlang:</span></div>
                    <ul className="mt-2 ml-7 text-sm font-medium text-red-600 list-disc space-y-1">{Object.values(formErrors).map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Turi *</label>
                      <div className="flex gap-2">
                        <select value={paymentForm.type} onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })} disabled={isSubmitting}
                          className={`flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-medium ${formErrors.type ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                          <option value="">Tanlang</option>
                          {paymentTypes.filter(t => t.dk === "credit").length > 0 && (
                            <optgroup label="📈 Kirim">
                              {paymentTypes.filter(t => t.dk === "credit").map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
                            </optgroup>
                          )}
                          {paymentTypes.filter(t => t.dk === "debit").length > 0 && (
                            <optgroup label="📉 Chiqim">
                              {paymentTypes.filter(t => t.dk === "debit").map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
                            </optgroup>
                          )}
                        </select>
                        <button type="button" onClick={() => setShowNestedTypeModal(true)} disabled={isSubmitting}
                          className="px-3 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center font-bold"
                          title="Yangi tolov turi qo'shish">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {formErrors.type && <p className="mt-1 text-xs font-bold text-red-600">{formErrors.type}</p>}

                      {/* Tanlangan tur bo'yicha kirim/chiqim ko'rsatkichi */}
                      {paymentForm.type && (() => {
                        const selectedType = paymentTypes.find(t => (t._id || t.id) === paymentForm.type);
                        if (selectedType) {
                          const isCredit = selectedType.dk === "credit";
                          return (
                            <div className={`mt-2 p-2 rounded-lg ${isCredit ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"} flex items-center gap-2 text-xs`}>
                              {isCredit ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                              <span className="font-medium">{isCredit ? "Kirim: Kassa + " : "Chiqim: Kassa - "}</span>
                              <span>{selectedType.name}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Summa (UZS) *</label>
                      <input type="text" value={amountInput} onChange={handleAmountChange} disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-medium ${formErrors.amount ? "border-red-500 bg-red-50" : "border-slate-200"}`}
                        placeholder="1,000,000" />
                      {formErrors.amount && <p className="mt-1 text-xs font-bold text-red-600">{formErrors.amount}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Oy *</label>
                      <input type="month" value={paymentForm.month} onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })} disabled={isSubmitting}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sana *</label>
                      <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} disabled={isSubmitting}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-medium" />
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Kim uchun to'lov *</label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { value: "teacher", label: "O'qituvchi", icon: GraduationCap },
                        { value: "staff", label: "Xodim", icon: Building2 },
                        { value: "student", label: "O'quvchi", icon: UserPlus },
                      ].map((cat) => (
                        <button key={cat.value} type="button" disabled={isSubmitting}
                          onClick={() => { setRecipientCategory(cat.value); setSelectedGroup(null); setRecipientSearch(""); setPaymentForm({ ...paymentForm, toWho: "" }); setSelectedRecipient(null); setRecipientDebt(0); setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 }); }}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all disabled:opacity-50 font-bold ${recipientCategory === cat.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                          <cat.icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {recipientCategory === "student" && (
                      <div className="mb-3">
                        <select value={selectedGroup?.id || selectedGroup?._id || ""} onChange={(e) => { const g = groups.find(gr => gr.id === e.target.value || gr._id === e.target.value); setSelectedGroup(g || null); }} disabled={isSubmitting}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50">
                          <option value="">Barcha guruhlar</option>
                          {groups.map(g => <option key={g.id || g._id} value={g.id || g._id}>{g.name} ({g.currentStudents || g.students?.length || 0} ta)</option>)}
                        </select>
                      </div>
                    )}

                    {recipientCategory && (
                      <div>
                        <div className="relative mb-2">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input type="text" placeholder="Qidirish..." value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} disabled={isSubmitting}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50" />
                        </div>
                        <div className={`max-h-48 overflow-y-auto border rounded-xl ${formErrors.toWho ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                          {getFilteredRecipients().length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">Topilmadi</div>
                          ) : getFilteredRecipients().map((person) => {
                            const personId = person._id || person.id;
                            const isSelected = paymentForm.toWho === personId;
                            return (
                              <button key={personId} type="button" disabled={isSubmitting}
                                onClick={() => {
                                  setPaymentForm({ ...paymentForm, toWho: personId, amount: "" });
                                  setAmountInput(""); setSelectedRecipient(person);
                                  const di = calculateRecipientDebt(person);
                                  setRecipientDebt(di.debt); setRecipientDebtInfo(di);
                                  setFormErrors({ ...formErrors, toWho: null });
                                }}
                                className={`w-full text-left px-4 py-2.5 border-b border-slate-100 last:border-0 transition-colors disabled:opacity-50 ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-slate-50 text-slate-700"}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                      <span className="text-xs font-semibold text-slate-600">
                                        {person.name?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?"}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm">{person.name}</p>
                                      {person.phone && <p className="text-xs text-slate-400">{person.phone}</p>}
                                    </div>
                                  </div>
                                  {isSelected && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {formErrors.toWho && <p className="mt-1 text-xs text-red-600">{formErrors.toWho}</p>}

                        {/* ✅ FIX: selectedRecipient.name ko'rsatilmoqda, ID emas */}
                        {selectedRecipient && (
                          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                  <span className="text-sm font-bold text-white">
                                    {selectedRecipient.name?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "??"}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-base font-bold text-slate-900">{selectedRecipient.name}</p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <UserPlus className="w-3 h-3" /> {recipientCategory === "student" ? "O'quvchi" : recipientCategory === "teacher" ? "O'qituvchi" : "Xodim"}
                                  </p>
                                </div>
                              </div>
                              <button type="button" onClick={() => { setRecipientSearch(""); setPaymentForm({ ...paymentForm, toWho: "" }); setSelectedRecipient(null); setRecipientDebt(0); setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 }); }} disabled={isSubmitting}
                                className="p-2 hover:bg-white rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                                <X className="w-4 h-4 text-slate-500" />
                              </button>
                            </div>

                            {/* Student balansi uchun */}
                            {recipientCategory === "student" && (
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white rounded-xl p-3 shadow-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Wallet className="w-4 h-4 text-emerald-500" />
                                    <p className="text-xs text-slate-500">Balans</p>
                                  </div>
                                  <p className={`text-lg font-bold ${selectedRecipient.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {Number(selectedRecipient.balance || 0).toLocaleString()} UZS
                                  </p>
                                </div>
                                {selectedRecipient.group && (
                                  <div className="bg-white rounded-xl p-3 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <GraduationCap className="w-4 h-4 text-violet-500" />
                                      <p className="text-xs text-slate-500">Guruh</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 truncate">
                                      {typeof selectedRecipient.group === 'object' ? selectedRecipient.group.name : selectedRecipient.group}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Staff/Teacher maoshi uchun */}
                            {(recipientCategory === "staff" || recipientCategory === "teacher") && (
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-white rounded-xl p-3 shadow-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-4 h-4 text-slate-500" />
                                    <p className="text-xs text-slate-500">Oylik maosh</p>
                                  </div>
                                  <p className="text-base font-bold text-slate-700">{Number(recipientDebtInfo.salary).toLocaleString()}</p>
                                </div>
                                <div className="bg-white rounded-xl p-3 shadow-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <p className="text-xs text-slate-500">To'langan</p>
                                  </div>
                                  <p className="text-base font-bold text-emerald-600">{Number(recipientDebtInfo.paid).toLocaleString()}</p>
                                </div>
                                <div className={`rounded-xl p-3 shadow-sm ${recipientDebt > 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-emerald-500'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Wallet className="w-4 h-4 text-white" />
                                    <p className="text-xs text-white/90">Qarzdorlik</p>
                                  </div>
                                  <p className="text-base font-bold text-white">{Number(recipientDebt).toLocaleString()}</p>
                                </div>
                              </div>
                            )}

                            {/* Qo'shimcha ma'lumotlar */}
                            {selectedRecipient.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/50 rounded-lg px-3 py-2">
                                <Calendar className="w-4 h-4" />
                                <span>{selectedRecipient.phone}</span>
                              </div>
                            )}

                            {/* To'lov tugmasi */}
                            {recipientDebt > 0 && (recipientCategory === "staff" || recipientCategory === "teacher") && (
                              <div className="mt-4 pt-4 border-t border-blue-200">
                                <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Wallet className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500">To'lash kerak</p>
                                      <p className="text-sm font-bold text-blue-700">{Number(recipientDebt).toLocaleString()} UZS</p>
                                    </div>
                                  </div>
                                  <button type="button" onClick={() => { setPaymentForm({ ...paymentForm, amount: recipientDebt.toString() }); setAmountInput(formatNumber(recipientDebt.toString())); }} disabled={isSubmitting}
                                    className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50">
                                    <DollarSign className="w-4 h-4" /> Summani to'ldirish
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Student uchun balans info */}
                            {recipientCategory === "student" && selectedRecipient.balance < 0 && (
                              <div className="mt-4 pt-4 border-t border-blue-200">
                                <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 rounded-lg px-3 py-2">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Qarz: {Number(selectedRecipient.balance).toLocaleString()} UZS</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Izoh</label>
                    <textarea value={paymentForm.comment} onChange={(e) => setPaymentForm({ ...paymentForm, comment: e.target.value })} disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none disabled:opacity-50 font-medium"
                      rows={3} placeholder="Qo'shimcha izoh..." />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button onClick={() => setShowPaymentModal(false)} disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold disabled:opacity-50">Bekor qilish</button>
                  <button onClick={handleSavePayment} disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saqlashmoqda...</> : editingPayment ? "Yangilash" : "Saqlash"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Nested Type Modal - Payment modal ichida ochiladi */}
      <AnimatePresence>
        {showNestedTypeModal && showPaymentModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNestedTypeModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-green-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-600" /> Yangi To'lov Turi
                  </h2>
                  <button onClick={() => setShowNestedTypeModal(false)} className="p-2 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nomi *</label>
                    <input type="text" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} disabled={isSubmittingType}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${typeFormErrors.name ? "border-red-500 bg-red-50" : "border-slate-200"}`} placeholder="Masalan: Maosh to'lovi" />
                    {typeFormErrors.name && <p className="mt-1 text-xs text-red-600">{typeFormErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kod</label>
                    <input type="text" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} disabled={isSubmittingType}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none disabled:opacity-50" placeholder="salary_payment" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Turi *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setTypeForm({ ...typeForm, dk: "credit" })}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${typeForm.dk === "credit" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>
                        <ArrowUpCircle className="w-5 h-5" /> Kirim
                      </button>
                      <button type="button" onClick={() => setTypeForm({ ...typeForm, dk: "debit" })}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${typeForm.dk === "debit" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>
                        <ArrowDownCircle className="w-5 h-5" /> Chiqim
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Izoh</label>
                    <textarea value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} disabled={isSubmittingType}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none resize-none disabled:opacity-50" rows={3} placeholder="Qo'shimcha izoh..." />
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button onClick={() => setShowNestedTypeModal(false)} disabled={isSubmittingType} className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50">Bekor qilish</button>
                  <button onClick={handleSaveNestedType} disabled={isSubmittingType} className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmittingType ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saqlashmoqda...</> : "Qo'shish va Tanlash"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStaffModal(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-slate-900">{selectedStaff ? "Xodimni Tahrirlash" : "Yangi Xodim"}</h2>
                  <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                {Object.keys(staffFormErrors).length > 0 && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" /><span className="text-sm font-medium">Xatolarni to'g'irlang:</span></div>
                    <ul className="mt-2 ml-7 text-sm text-red-600 list-disc space-y-1">{Object.values(staffFormErrors).map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {[
                    { label: "Ism *", field: "name", type: "text", placeholder: "Ali Karimov", required: true },
                    { label: "Telefon *", field: "phone", type: "tel", placeholder: "+998901234567", required: true },
                    { label: "Lavozim", field: "jobTitle", type: "text", placeholder: "Manager, Accountant" },
                    { label: "Ishga qabul qilingan sana", field: "hireDate", type: "date" },
                    { label: "Mutaxassislik", field: "specialization", type: "text", placeholder: "IT, Accounting" },
                  ].map(({ label, field, type, placeholder, required }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
                      <input type={type} value={staffForm[field]} onChange={(e) => setStaffForm({ ...staffForm, [field]: e.target.value })} disabled={isSubmittingStaff}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${required && staffFormErrors[field] ? "border-red-500 bg-red-50" : "border-slate-200"}`}
                        placeholder={placeholder} />
                      {required && staffFormErrors[field] && <p className="mt-1 text-xs text-red-600">{staffFormErrors[field]}</p>}
                    </div>
                  ))}
                  {!selectedStaff && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Parol *</label>
                      <input type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} disabled={isSubmittingStaff}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${staffFormErrors.password ? "border-red-500 bg-red-50" : "border-slate-200"}`} placeholder="•••••••••" />
                      {staffFormErrors.password && <p className="mt-1 text-xs text-red-600">{staffFormErrors.password}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                    <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} disabled={isSubmittingStaff}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none disabled:opacity-50">
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="assistant">Assistant</option>
                      <option value="supporter">Supporter</option>
                    </select>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button onClick={() => setShowStaffModal(false)} disabled={isSubmittingStaff} className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50">Bekor qilish</button>
                  <button onClick={handleSaveStaff} disabled={isSubmittingStaff} className="flex-1 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmittingStaff ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saqlashmoqda...</> : selectedStaff ? "Yangilash" : "Qo'shish"}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSalaryModal(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-slate-900">{selectedStaff?.name} — Maosh Belgilash</h2>
                  <button onClick={() => setShowSalaryModal(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Oy *</label>
                    <input type="month" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })} disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Oylik Maosh (UZS) *</label>
                    <input type="number" value={salaryForm.monthlySalary} onChange={(e) => setSalaryForm({ ...salaryForm, monthlySalary: e.target.value })} disabled={isSubmittingSalary}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${salaryFormErrors.monthlySalary ? "border-red-500 bg-red-50" : "border-slate-200"}`} placeholder="5000000" />
                    {salaryFormErrors.monthlySalary && <p className="mt-1 text-xs text-red-600">{salaryFormErrors.monthlySalary}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Boshlanish sanasi</label>
                    <input type="date" value={salaryForm.startDate} onChange={(e) => setSalaryForm({ ...salaryForm, startDate: e.target.value })} disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Izoh</label>
                    <textarea value={salaryForm.comment} onChange={(e) => setSalaryForm({ ...salaryForm, comment: e.target.value })} disabled={isSubmittingSalary}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none resize-none disabled:opacity-50" rows={2} placeholder="Qo'shimcha izoh..." />
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 flex-shrink-0">
                  <button onClick={() => setShowSalaryModal(false)} disabled={isSubmittingSalary} className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50">Bekor qilish</button>
                  <button onClick={handleSaveSalary} disabled={isSubmittingSalary} className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmittingSalary ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saqlashmoqda...</> : "Saqlash"}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryModal(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-slate-900">{selectedStaff.name} — Maosh Tarixi</h2>
                  <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {salaryHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium">Maosh tarixi yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {salaryHistory.map((record, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="font-medium text-slate-900">{record.month}</p>
                              <p className="text-xs text-slate-500">{new Date(record.startDate || record.createdAt).toLocaleDateString("uz-UZ")}</p>
                            </div>
                            <p className="text-lg font-semibold text-emerald-600">{Number(record.monthlySalary).toLocaleString()} UZS</p>
                          </div>
                          {record.comment && <p className="text-sm text-slate-600">{record.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                  <button onClick={() => setShowHistoryModal(false)} className="w-full px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Yopish</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}