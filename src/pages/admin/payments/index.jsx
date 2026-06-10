import { useState, useEffect, useMemo, useRef } from "react";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Wallet,
  DollarSign,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  UserPlus,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
} from "lucide-react";
import {
  usePayments,
  savePayment,
  removePayment,
  savePaymentType,
  removePaymentType,
} from "./hooks";
import { createExpense } from "../../../api/payments";
import { getAllTeachers } from "../../../api/teacher";
import { getStudents } from "../../../api/students";
import { getAllGroups, getGroupById } from "../../../api/groups";
import { useAuth } from "../../../context/AuthContext";
import { useIsAdmin, formatPhone } from "../../../utils/permissions";
import { useLang } from "../../../context/LangContext";


export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { t } = useLang();

  const {
    payments: rawPayments,
    paymentTypes: rawTypes,
    loading,
    staff: rawStaff,
    filters,
    setFilters,
    loadPayments,
    loadPaymentTypes,
    loadStaff,
  } = usePayments();

  const staff = Array.isArray(rawStaff) ? rawStaff : [];

  const payments = Array.isArray(rawPayments) ? rawPayments : [];
  const paymentTypes = Array.isArray(rawTypes) ? rawTypes : [];

  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showNestedTypeModal, setShowNestedTypeModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const [paymentCategory, setPaymentCategory] = useState("all");

  const [recipientCategory, setRecipientCategory] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const recipientDropdownRef = useRef(null);

  const [typeSearch, setTypeSearch] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef(null);
  const [recipientDebtInfo, setRecipientDebtInfo] = useState({
    debt: 0,
    salary: 0,
    paid: 0,
    lastPayment: 0,
  });
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingType, setIsSubmittingType] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [typeFormErrors, setTypeFormErrors] = useState({});


  // ── Number formatting ──
  const formatNumber = (value) => {
    if (!value) return "";
    const numStr = value.toString().replace(/\D/g, "");
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("fr-FR").replace(/\./g, " ");
  };

  const parseFormattedNumber = (value) => {
    if (!value) return "";
    return value.replace(/\s/g, "").replace(/,/g, "").replace(/\./g, "");
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const plainNumber = parseFormattedNumber(rawValue);
    setAmountInput(formatNumber(plainNumber));
    setPaymentForm({ ...paymentForm, amount: plainNumber });
  };

  const [paymentForm, setPaymentForm] = useState({
    type: "",
    dk: "debit",
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    toWho: "",
    date: new Date().toISOString().slice(0, 10),
    comment: "",
  });

  const [typeForm, setTypeForm] = useState({
    name: "",
    code: "",
    description: "",
  });



  // ── Load teachers/students/groups/staff on mount (needed for getRecipientType in filter) ──
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teachersRes, studentsRes, groupsRes] = await Promise.all([
          getAllTeachers(),
          getStudents({ limit: 1000 }).catch(() => ({ data: { data: [] } })),
          getAllGroups(),
        ]);
        setTeachers(
          Array.isArray(teachersRes.data?.data) ? teachersRes.data.data :
          Array.isArray(teachersRes.data) ? teachersRes.data : []
        );
        setStudents(
          Array.isArray(studentsRes.data?.data) ? studentsRes.data.data :
          Array.isArray(studentsRes.data) ? studentsRes.data : []
        );
        setGroups(
          Array.isArray(groupsRes.data?.data) ? groupsRes.data.data :
          Array.isArray(groupsRes.data) ? groupsRes.data : []
        );
        loadStaff();
      } catch {}
    };
    loadData();
  }, [loadStaff]);

  useEffect(() => {
    if (selectedGroup) {
      const gid = selectedGroup._id || selectedGroup.id;
      // Fetch group students directly from API — most reliable
      getGroupById(gid)
        .then((res) => {
          const groupData = res.data?.data || res.data || {};
          // API may return students as array of objects or IDs
          const raw = groupData.students || [];
          // If API returns only IDs, fall back to client-side filter from loaded students
          if (raw.length > 0 && typeof raw[0] === "object" && raw[0].name) {
            setFilteredStudents(raw);
          } else if (raw.length > 0) {
            // raw = array of IDs — match against already-loaded students
            const idSet = new Set(raw.map((r) => r._id || r.id || r));
            setFilteredStudents(students.filter((s) => idSet.has(s._id || s.id)));
          } else {
            // Fallback: client-side filter using all possible fields
            setFilteredStudents(
              students.filter((s) => {
                if (s.groupId === gid) return true;
                if (s.group?._id === gid || s.group?.id === gid) return true;
                if (Array.isArray(s.groups) && s.groups.some((g) => (g._id || g.id || g) === gid)) return true;
                return false;
              }),
            );
          }
        })
        .catch(() => {
          // On error: fall back to client-side filter
          setFilteredStudents(
            students.filter((s) => {
              if (s.groupId === gid) return true;
              if (s.group?._id === gid || s.group?.id === gid) return true;
              if (Array.isArray(s.groups) && s.groups.some((g) => (g._id || g.id || g) === gid)) return true;
              return false;
            }),
          );
        });
    } else {
      setFilteredStudents(students);
    }
  }, [selectedGroup, students]);

  useEffect(() => {
    if (!showPaymentModal) {
      setFormErrors({});
      setIsSubmitting(false);
    }
    if (!showTypeModal) {
      setTypeFormErrors({});
      setIsSubmittingType(false);
    }
  }, [showPaymentModal, showTypeModal]);



  // Staff phone display yangilash


  // ── Kirim / Chiqim hisoblash ──
  const typeMap = useMemo(() => {
    const map = {};
    paymentTypes.forEach((t) => {
      map[t._id || t.id] = t.dk;
    });
    return map;
  }, [paymentTypes]);

  const getDk = (payment) => {
    // First check if payment has its own dk field (preferred)
    if (payment.dk) return payment.dk;
    // Then check if payment type has dk field (legacy support)
    if (payment.type?.dk) return payment.type.dk;
    // Finally check the typeMap
    const typeId = payment.type?._id || payment.type?.id || payment.type;
    return typeMap[typeId] || null;
  };

  const totalIncome = payments
    .filter((p) => getDk(p) === "debit")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalExpense = payments
    .filter((p) => getDk(p) === "credit")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // ── Recipient helpers ──
  const calculateRecipientDebt = (person) => {
    if (!person) return { debt: 0, salary: 0, paid: 0, lastPayment: 0 };
    let monthlySalary = 0;
    if (recipientCategory === "staff" && person.salaries) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const salaryRecord = person.salaries.find((s) =>
        s.month?.startsWith(currentMonth),
      );
      if (salaryRecord) monthlySalary = Number(salaryRecord.monthlySalary) || 0;
    }
    const currentMonth = new Date().toISOString().slice(0, 7);
    const personPayments = payments.filter(
      (p) =>
        (p.toWho?._id || p.toWho?.id || p.toWho) ===
          (person._id || person.id) && p.month?.startsWith(currentMonth),
    );
    const totalPaid = personPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    const sorted = [...personPayments].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    const lastPayment = sorted.length > 0 ? sorted[0].amount : 0;
    const debt = Math.max(0, monthlySalary - totalPaid);
    return { debt, salary: monthlySalary, paid: totalPaid, lastPayment };
  };

  const getFilteredRecipients = () => {
    const searchLower = recipientSearch.toLowerCase();

    if (recipientCategory === "teacher")
      return teachers.filter((t) =>
        t.name?.toLowerCase().includes(searchLower),
      );
    if (recipientCategory === "staff")
      return staff.filter((s) => s.name?.toLowerCase().includes(searchLower));
    if (recipientCategory === "student") {
      return filteredStudents.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchLower) ||
          s.phone?.includes(searchLower),
      );
    }
    return [];
  };

  const resetPaymentModal = () => {
    setPaymentForm({
      type: "",
      dk: "debit",
      amount: "",
      month: new Date().toISOString().slice(0, 7),
      toWho: "",
      date: new Date().toISOString().slice(0, 10),
      comment: "",
    });
    setAmountInput("");
    setEditingPayment(null);
    setRecipientCategory("");
    setSelectedGroup(null);
    setRecipientSearch("");
    setSelectedRecipient(null);
    setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 });
    setTypeSearch("");
    setShowTypeDropdown(false);
  };

  // ── Click outside to close dropdowns ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(e.target)) {
        setShowRecipientDropdown(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Handlers ──
  const handleSavePayment = async () => {
    const errors = {};
    if (!paymentForm.type) errors.type = t('pay_select_type_err');
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0)
      errors.amount = t('pay_amount_err');
    if (!paymentForm.toWho && recipientCategory !== "expense")
      errors.toWho = "Kim uchun to'lov qilinishini tanlang";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);
    try {
      let success = false;
      if (!editingPayment && recipientCategory === "expense") {
        // New expense — no toWho, use /expenses endpoint
        try {
          await createExpense({
            type: paymentForm.type,
            amount: Number(paymentForm.amount),
            dk: paymentForm.dk,
            date: paymentForm.date || undefined,
            comment: paymentForm.comment || undefined,
          });
          success = true;
        } catch {}
      } else {
        success = await savePayment(editingPayment, {
          type: paymentForm.type,
          amount: Number(paymentForm.amount),
          month: paymentForm.month,
          toWho: paymentForm.toWho,
          date: paymentForm.date,
          comment: paymentForm.comment,
          dk: paymentForm.dk,
        });
      }
      if (success) {
        setShowPaymentModal(false);
        resetPaymentModal();
        loadPayments();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveType = async () => {
    const errors = {};
    if (!typeForm.name) errors.name = t('pay_name_err');
    if (Object.keys(errors).length > 0) {
      setTypeFormErrors(errors);
      return;
    }
    setTypeFormErrors({});
    setIsSubmittingType(true);
    try {
      const result = await savePaymentType(editingType, typeForm);
      if (result.success) {
        setShowTypeModal(false);
        setTypeForm({ name: "", code: "", description: "" });
        setEditingType(null);
        loadPaymentTypes();
      }
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Nested modal ichida to'lov turini qo'shish (payment modal ichida)
  const handleSaveNestedType = async () => {
    const errors = {};
    if (!typeForm.name) errors.name = t('pay_name_err');
    if (Object.keys(errors).length > 0) {
      setTypeFormErrors(errors);
      return;
    }
    setTypeFormErrors({});
    setIsSubmittingType(true);
    try {
      const result = await savePaymentType(null, typeForm);
      if (result.success) {
        await loadPaymentTypes();
        if (result.newType) {
          const newId = result.newType._id || result.newType.id;
          if (newId) setPaymentForm((prev) => ({ ...prev, type: newId }));
        }
        setTypeSearch("");
        setShowTypeDropdown(false);
        setShowNestedTypeModal(false);
        setTypeForm({ name: "", code: "", description: "" });
      }
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleDeleteType = async (id) => {
    if (await removePaymentType(id)) loadPaymentTypes();
  };

  // ── Recipient type detection ──
  const getRecipientType = (payment) => {
    const recipientId =
      payment.toWho?._id || payment.toWho?.id || payment.toWho;
    if (!recipientId) return "expense";

    // Check if it's a teacher
    if (teachers.some((t) => (t._id || t.id) === recipientId)) return "teacher";
    // Check if it's a staff member
    if (staff.some((s) => (s._id || s.id) === recipientId)) return "staff";
    // Check if it's a student
    if (students.some((s) => (s._id || s.id) === recipientId)) return "student";

    return "unknown";
  };

  // ── Filtered lists ──
  const filteredPayments = payments.filter((p) => {
    if (Number(p.amount) <= 0) return false;

    const matchesSearch =
      (p.type?.name || p.type?.code || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (typeof p.toWho === "object" ? p.toWho?.name ?? "" : p.toWho || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (p.comment || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      paymentCategory === "all" || getRecipientType(p) === paymentCategory;

    return matchesSearch && matchesCategory;
  });

  const {
    visible: visiblePayments,
    sentinelRef: paymentSentinelRef,
    hasMore: paymentHasMore,
    shown: paymentShown,
  } = useInfiniteScroll(filteredPayments, 20);

  const filteredTypes = paymentTypes.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredStaff = staff.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-base-200 p-6 font-sans">
      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search')}
                className="w-full sm:w-56 pl-10 pr-4 py-2 bg-base-100 border border-base-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={paymentCategory}
              onChange={(e) => setPaymentCategory(e.target.value)}
              className="select select-bordered select-sm w-full sm:w-44"
            >
              <option value="all">{t('pay_all')}</option>
              <option value="student">
                {t('pay_students_label')} ({payments.filter((p) => getRecipientType(p) === "student").length})
              </option>
              <option value="teacher">
                {t('pay_teachers_label')} ({payments.filter((p) => getRecipientType(p) === "teacher").length})
              </option>
              <option value="staff">
                {t('pay_staff_label')} ({payments.filter((p) => getRecipientType(p) === "staff").length})
              </option>
              <option value="expense">
                Xarajatlar ({payments.filter((p) => getRecipientType(p) === "expense").length})
              </option>
            </select>
          </div>
          <button
            onClick={() => {
              resetPaymentModal();
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-content rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> {t('pay_new')}
          </button>
        </div>

        {/* ── STATS CARDS — Kirim / Chiqim / Balans alohida ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Jami to'lovlar */}
          <div className="bg-base-100 rounded-xl p-3 border border-base-300 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary-content" />
              </div>
              <div>
                <p className="text-lg font-bold text-base-content">
                  {payments.length}
                </p>
                <p className="text-xs font-medium text-base-content/50">
                  {t('pay_total')}
                </p>
              </div>
            </div>
          </div>

          {/* Kirim */}
          <div className="bg-base-100 rounded-xl p-3 border border-success/20 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-success flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success-content" />
              </div>
              <div>
                <p className="text-lg font-bold text-success">
                  +{Number(totalIncome).toLocaleString()}
                </p>
                <p className="text-xs font-medium text-base-content/50">
                  {t('pay_income_uzs')}
                </p>
              </div>
            </div>
          </div>

          {/* Chiqim */}
          <div className="bg-base-100 rounded-xl p-3 border border-error/20 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-error flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-error-content" />
              </div>
              <div>
                <p className="text-lg font-bold text-error">
                  -{Number(totalExpense).toLocaleString()}
                </p>
                <p className="text-xs font-medium text-base-content/50">
                  {t('pay_expense_uzs')}
                </p>
              </div>
            </div>
          </div>

          {/* Sof balans */}
          <div
            className={`rounded-xl p-3 border shadow-sm ${netBalance >= 0 ? "bg-success/10 border-success/30" : "bg-error/10 border-error/30"}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${netBalance >= 0 ? "bg-success" : "bg-error"}`}
              >
                <BarChart3 className={`w-4 h-4 ${netBalance >= 0 ? "text-success-content" : "text-error-content"}`} />
              </div>
              <div>
                <p
                  className={`text-lg font-bold ${netBalance >= 0 ? "text-success" : "text-error"}`}
                >
                  {netBalance >= 0 ? "+" : ""}
                  {Number(netBalance).toLocaleString()}
                </p>
                <p className="text-xs font-medium text-base-content/50">
                  {t('pay_net_balance')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-base-content/50 font-medium">{t('loading')}</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="bg-base-200 border-b border-base-300">
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                {t('date')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                {t('pay_type')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                {t('pay_for_whom')}
                              </th>
                              {paymentCategory === "all" && (
                                <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                  {t('pay_for_whom')}
                                </th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                {t('month')}
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                {t('amount')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                {t('comment')}
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                {t('actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPayments.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={paymentCategory === "all" ? 8 : 7}
                                  className="px-6 py-16 text-center"
                                >
                                  <div className="flex flex-col items-center gap-3">
                                    <Wallet className="w-12 h-12 text-base-content/30 mx-auto" />
                                    <p className="text-sm font-medium text-base-content/50">
                                      {t('dash_no_payments')}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              visiblePayments.map((payment) => {
                                const recipientType = getRecipientType(payment);
                                return (
                                  <tr
                                    key={payment._id || payment.id}
                                    className="hover:bg-base-200 transition-colors border-b border-base-200 last:border-0"
                                  >
                                    <td className="px-4 py-3 text-sm font-medium text-base-content/70">
                                      {new Date(
                                        payment.date,
                                      ).toLocaleDateString("uz-UZ")}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${
                                          getDk(payment) === "debit"
                                            ? "bg-success/20 text-success"
                                            : "bg-error/20 text-error"
                                        }`}
                                      >
                                        {getDk(payment) === "debit" ? (
                                          <ArrowUpCircle className="w-3 h-3" />
                                        ) : (
                                          <ArrowDownCircle className="w-3 h-3" />
                                        )}
                                        {payment.type?.name ||
                                          payment.type?.code ||
                                          "—"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-base-content/80">
                                      {typeof payment.toWho === "object"
                                        ? payment.toWho?.name || "—"
                                        : payment.toWho || "—"}
                                    </td>
                                    {paymentCategory === "all" && (
                                      <td className="px-4 py-3">
                                        <span
                                          className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                            recipientType === "student"
                                              ? "bg-primary/20 text-primary"
                                              : recipientType === "teacher"
                                                ? "bg-secondary/20 text-secondary"
                                                : recipientType === "staff"
                                                  ? "bg-warning/20 text-warning"
                                                  : recipientType === "expense"
                                                    ? "bg-error/20 text-error"
                                                    : "bg-neutral/20 text-neutral"
                                          }`}
                                        >
                                          {recipientType === "student"
                                            ? t('pay_for_student')
                                            : recipientType === "teacher"
                                              ? t('pay_for_teacher')
                                              : recipientType === "staff"
                                                ? t('pay_for_staff')
                                                : recipientType === "expense"
                                                  ? "Xarajat"
                                                  : t('not_found')}
                                        </span>
                                      </td>
                                    )}
                                    <td className="px-4 py-3 text-sm font-medium text-base-content/70">
                                      {payment.month || "—"}
                                    </td>
                                    <td
                                      className={`px-4 py-3 text-sm font-bold text-right ${
                                        getDk(payment) === "debit"
                                          ? "text-success"
                                          : "text-error"
                                      }`}
                                    >
                                      {getDk(payment) === "debit" ? "+" : "-"}
                                      {Number(payment.amount || 0).toLocaleString()}{" "}
                                      UZS
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-base-content/70 max-w-xs truncate">
                                      {payment.comment || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {isAdmin && <button
                                          onClick={() => {
                                            setEditingPayment(payment);
                                            const amount = payment.amount || "";
                                            setPaymentForm({
                                              type:
                                                payment.type?._id ||
                                                payment.type?.id ||
                                                payment.type ||
                                                "",
                                              dk: payment.dk || "debit",
                                              amount: amount,
                                              month:
                                                payment.month ||
                                                new Date()
                                                  .toISOString()
                                                  .slice(0, 7),
                                              toWho:
                                                payment.toWho?._id ||
                                                payment.toWho?.id ||
                                                payment.toWho ||
                                                "",
                                              date:
                                                payment.date?.slice(0, 10) ||
                                                new Date()
                                                  .toISOString()
                                                  .slice(0, 10),
                                              comment: payment.comment || "",
                                            });
                                            setAmountInput(
                                              formatNumber(amount),
                                            );
                                            setRecipientCategory(recipientType);
                                            setSelectedGroup(null);
                                            setRecipientSearch("");
                                            setSelectedRecipient(null);
                                            setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 });
                                            setTypeSearch("");
                                            setShowTypeDropdown(false);
                                            setShowPaymentModal(true);
                                          }}
                                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                          title="Tahrirlash"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>}
                                        {isAdmin && <button
                                          onClick={async () => {
                                            if (await removePayment(payment))
                                              loadPayments();
                                          }}
                                          className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                                          title="O'chirish"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* Infinite scroll sentinel */}
                      {filteredPayments.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 border-t border-base-200">
                          <span className="text-xs text-base-content/40">{paymentShown} / {filteredPayments.length} ta</span>
                          {paymentHasMore && <span className="text-xs text-primary animate-pulse">Yuklanmoqda…</span>}
                        </div>
                      )}
                      <div ref={paymentSentinelRef} className="h-1" />
                    </div>
                  </>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-base-300 bg-base-200 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-bold text-base-content">
                    {editingPayment ? t('pay_edit_title') : t('pay_add_title')}
                  </h2>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-2 hover:bg-base-300 rounded-lg"
                  >
                    <X className="w-5 h-5 text-base-content/50" />
                  </button>
                </div>

                {Object.keys(formErrors).length > 0 && (
                  <div className="px-6 py-3 bg-error/10 border-b border-error/30">
                    <div className="flex items-center gap-2 text-error">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">
                        {t('pay_fix_errors')}
                      </span>
                    </div>
                    <ul className="mt-2 ml-7 text-sm font-medium text-error list-disc space-y-1">
                      {Object.values(formErrors).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-5 space-y-4 overflow-y-auto flex-1">

                  {/* 1. To'lov kimga? */}
                  <div>
                    <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">
                      To'lov kimga? <span className="text-error">*</span>
                    </label>
                    {formErrors.toWho && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-error font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formErrors.toWho}
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { value: "teacher", label: t('pay_for_teacher'), Icon: GraduationCap },
                        { value: "staff",   label: t('pay_for_staff'),   Icon: Building2 },
                        { value: "student", label: t('pay_for_student'), Icon: UserPlus },
                        { value: "expense", label: "Xarajat",            Icon: Wallet },
                      ].map(({ value, label, Icon }) => (
                        <button key={value} type="button" disabled={isSubmitting}
                          onClick={() => {
                            setRecipientCategory(value);
                            setSelectedGroup(null);
                            setRecipientSearch("");
                            setSelectedRecipient(null);
                            setPaymentForm({ ...paymentForm, toWho: "" });
                            setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 });
                            setTimeout(() => setShowRecipientDropdown(true), 50);
                          }}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-bold disabled:opacity-50 ${
                            recipientCategory === value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-base-300 text-base-content/40 hover:bg-base-200"
                          }`}>
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Guruh filter (faqat student uchun) */}
                    {recipientCategory !== "expense" && recipientCategory === "student" && (
                      <select value={selectedGroup?._id || selectedGroup?.id || ""}
                        onChange={(e) => setSelectedGroup(groups.find(g => (g._id || g.id) === e.target.value) || null)}
                        disabled={isSubmitting}
                        className="w-full select select-bordered select-sm mb-2">
                        <option value="">{t('pay_all_groups')}</option>
                        {groups.map((g) => (
                          <option key={g._id || g.id} value={g._id || g.id}>
                            {g.name} ({g.currentStudents ?? g.students?.length ?? 0} ta)
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Recipient qidiruv */}
                    {recipientCategory && recipientCategory !== "expense" && (
                      <div ref={recipientDropdownRef} className="relative">
                        <div className="relative">
                          <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input type="text"
                            placeholder={recipientCategory === "teacher" ? t('pay_search_teacher') : recipientCategory === "staff" ? t('pay_search_staff') : t('pay_search_student')}
                            value={selectedRecipient ? selectedRecipient.name : recipientSearch}
                            onChange={(e) => {
                              setRecipientSearch(e.target.value);
                              setShowRecipientDropdown(true);
                              if (selectedRecipient) {
                                setSelectedRecipient(null);
                                setPaymentForm({ ...paymentForm, toWho: "" });
                              }
                            }}
                            onFocus={() => setShowRecipientDropdown(true)}
                            disabled={isSubmitting}
                            className="w-full pl-9 pr-9 py-2.5 border border-base-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50" />
                        </div>

                        {/* Dropdown */}
                        {showRecipientDropdown && !selectedRecipient && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                            {(() => {
                              const filtered = getFilteredRecipients();
                              if (filtered.length === 0)
                                return <p className="p-3 text-center text-xs text-base-content/40">{t('not_found')}</p>;
                              return filtered.map((person) => {
                                const pid = person._id || person.id;
                                return (
                                  <button key={pid} type="button" disabled={isSubmitting}
                                    onClick={() => {
                                      setSelectedRecipient(person);
                                      setPaymentForm({ ...paymentForm, toWho: pid });
                                      setAmountInput("");
                                      setRecipientSearch("");
                                      setShowRecipientDropdown(false);
                                      const di = calculateRecipientDebt(person);
                                      setRecipientDebtInfo(di);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-base-200 transition-colors border-b border-base-200 last:border-0">
                                    <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                      {person.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                                    </div>
                                    <div className="min-w-0 text-left">
                                      <p className="text-sm font-medium text-base-content truncate">{person.name}</p>
                                      {person.phone && <p className="text-xs text-base-content/40">{formatPhone(person.phone)}</p>}
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tanlangan recipient — to'liq ma'lumotlar */}
                    {selectedRecipient && recipientCategory !== "expense" && (
                      <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                        {/* Avatar + ism */}
                        <div className="flex items-center gap-3 px-3 py-3 border-b border-primary/10">
                          <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-black shrink-0">
                            {selectedRecipient.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-base-content truncate">{selectedRecipient.name}</p>
                            {selectedRecipient.phone && (
                              <p className="text-xs text-base-content/50">{formatPhone(selectedRecipient.phone)}</p>
                            )}
                          </div>
                          <button type="button"
                            onClick={() => {
                              setSelectedRecipient(null);
                              setPaymentForm({ ...paymentForm, toWho: "" });
                              setRecipientSearch("");
                            }}
                            className="p-1 hover:bg-base-200 rounded-lg transition-colors text-base-content/40 hover:text-base-content/70">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Ma'lumotlar grid */}
                        <div className="grid grid-cols-2 gap-px bg-primary/10">
                          {/* Balans */}
                          {selectedRecipient.balance != null && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Balans</p>
                              <p className={`text-sm font-black ${Number(selectedRecipient.balance) < 0 ? "text-error" : "text-success"}`}>
                                {Number(selectedRecipient.balance).toLocaleString()} UZS
                              </p>
                            </div>
                          )}

                          {/* Bu oy to'langan */}
                          {recipientDebtInfo.paid > 0 && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Bu oy to'langan</p>
                              <p className="text-sm font-black text-success">{Number(recipientDebtInfo.paid).toLocaleString()} UZS</p>
                            </div>
                          )}

                          {/* Guruh (student uchun) */}
                          {recipientCategory === "student" && (selectedRecipient.group?.name || selectedRecipient.groupName) && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Guruh</p>
                              <p className="text-xs font-bold text-base-content truncate">
                                {selectedRecipient.group?.name || selectedRecipient.groupName}
                              </p>
                            </div>
                          )}

                          {/* Ustoz (student uchun) */}
                          {recipientCategory === "student" && selectedRecipient.group?.teacher?.name && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Ustoz</p>
                              <p className="text-xs font-bold text-base-content truncate">
                                {selectedRecipient.group.teacher.name}
                              </p>
                            </div>
                          )}

                          {/* Kurs (student uchun) */}
                          {recipientCategory === "student" && (selectedRecipient.course?.name || selectedRecipient.course?.title || selectedRecipient.courseName) && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Kurs</p>
                              <p className="text-xs font-bold text-base-content truncate">
                                {selectedRecipient.course?.name || selectedRecipient.course?.title || selectedRecipient.courseName}
                              </p>
                            </div>
                          )}

                          {/* Oylik maosh (staff / teacher uchun) */}
                          {(recipientCategory === "staff" || recipientCategory === "teacher") && recipientDebtInfo.salary > 0 && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Oylik maosh</p>
                              <p className="text-sm font-black text-base-content">{Number(recipientDebtInfo.salary).toLocaleString()} UZS</p>
                            </div>
                          )}

                          {/* Qoldiq qarz (staff uchun) */}
                          {recipientCategory === "staff" && recipientDebtInfo.debt > 0 && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Qoldiq</p>
                              <p className="text-sm font-black text-error">−{Number(recipientDebtInfo.debt).toLocaleString()} UZS</p>
                            </div>
                          )}

                          {/* Lavozim (staff uchun) */}
                          {recipientCategory === "staff" && selectedRecipient.jobTitle && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Lavozim</p>
                              <p className="text-xs font-bold text-base-content">{selectedRecipient.jobTitle}</p>
                            </div>
                          )}

                          {/* Mutaxassislik (teacher uchun) */}
                          {recipientCategory === "teacher" && selectedRecipient.specialization && (
                            <div className="bg-base-100/80 px-3 py-2">
                              <p className="text-[10px] text-base-content/40 uppercase tracking-wide mb-0.5">Mutaxassislik</p>
                              <p className="text-xs font-bold text-base-content">{selectedRecipient.specialization}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Kirim / Chiqim */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "debit",  label: t('pay_credit'),  Icon: ArrowUpCircle,   on: "border-success bg-success/10 text-success",  off: "border-base-300 text-base-content/40 hover:bg-base-200" },
                      { val: "credit", label: t('pay_debit'), Icon: ArrowDownCircle, on: "border-error bg-error/10 text-error",         off: "border-base-300 text-base-content/40 hover:bg-base-200" },
                    ].map(({ val, label, Icon, on, off }) => (
                      <button key={val} type="button" disabled={isSubmitting}
                        onClick={() => setPaymentForm({ ...paymentForm, dk: val })}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all text-sm ${paymentForm.dk === val ? on : off}`}>
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>

                  {/* 3. To'lov turi */}
                  <div>
                    <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">{t('pay_type')} *</label>
                    <div className="flex gap-2">
                      <div ref={typeDropdownRef} className="relative flex-1">
                        <div className="relative">
                          <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder={t('pay_select_type')}
                            value={
                              paymentForm.type
                                ? (typeSearch || paymentTypes.find(pt => (pt._id || pt.id) === paymentForm.type)?.name || "")
                                : typeSearch
                            }
                            onChange={(e) => {
                              setTypeSearch(e.target.value);
                              setShowTypeDropdown(true);
                              if (paymentForm.type) setPaymentForm({ ...paymentForm, type: "" });
                            }}
                            onFocus={() => setShowTypeDropdown(true)}
                            disabled={isSubmitting}
                            className={`w-full pl-9 pr-8 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 ${formErrors.type ? "border-error bg-error/10" : "border-base-300"}`}
                          />
                          {paymentForm.type && (
                            <button type="button"
                              onClick={() => { setPaymentForm({ ...paymentForm, type: "" }); setTypeSearch(""); }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content/70">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {showTypeDropdown && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                            {(() => {
                              const filtered = paymentTypes.filter(pt =>
                                pt.name?.toLowerCase().includes(typeSearch.toLowerCase()) ||
                                pt.code?.toLowerCase().includes(typeSearch.toLowerCase())
                              );
                              if (filtered.length === 0)
                                return <p className="p-3 text-center text-xs text-base-content/40">{t('not_found')}</p>;
                              return filtered.map((pt) => {
                                const pid = pt._id || pt.id;
                                return (
                                  <button key={pid} type="button" disabled={isSubmitting}
                                    onClick={() => {
                                      setPaymentForm({ ...paymentForm, type: pid });
                                      setTypeSearch("");
                                      setShowTypeDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-base-200 transition-colors border-b border-base-200 last:border-0 text-left ${paymentForm.type === pid ? "bg-primary/10" : ""}`}>
                                    <span className="text-sm font-medium text-base-content">{pt.name}</span>
                                    {pt.code && <span className="text-xs text-base-content/40 ml-auto">{pt.code}</span>}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => setShowNestedTypeModal(true)} disabled={isSubmitting}
                        className="btn btn-success btn-sm btn-square h-10 w-10 shrink-0" title="Yangi tur qo'shish">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {formErrors.type && <p className="mt-1 text-xs text-error font-medium">{formErrors.type}</p>}
                  </div>

                  {/* 4. Summa */}
                  <div>
                    <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">Summa (UZS) *</label>
                    <input type="text" value={amountInput} onChange={handleAmountChange}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 ${formErrors.amount ? "border-error bg-error/10" : "border-base-300"}`}
                      placeholder="1 000 000" />
                    {formErrors.amount && <p className="mt-1 text-xs text-error font-medium">{formErrors.amount}</p>}
                  </div>

                  {/* 5. Oy + Sana */}
                  <div className={`grid gap-3 ${recipientCategory === "expense" ? "grid-cols-1" : "grid-cols-2"}`}>
                    {recipientCategory !== "expense" && (
                      <div>
                        <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">Oy</label>
                        <input type="month" value={paymentForm.month}
                          onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2.5 border border-base-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">Sana</label>
                      <input type="date" value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2.5 border border-base-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50" />
                    </div>
                  </div>

                  {/* 6. Izoh */}
                  <div>
                    <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wide mb-1.5">{t('comment')}</label>
                    <textarea value={paymentForm.comment}
                      onChange={(e) => setPaymentForm({ ...paymentForm, comment: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-base-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none disabled:opacity-50"
                      rows={2} placeholder={t('pay_extra_comment')} />
                  </div>
                </div>

                <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-base-100 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200 transition-all font-bold disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-primary text-primary-content rounded-xl hover:bg-primary/90 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('saving')}
                      </>
                    ) : editingPayment ? (
                      t('update')
                    ) : (
                      t('save')
                    )}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNestedTypeModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-base-300 bg-success/10 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-base-content flex items-center gap-2">
                    <Plus className="w-5 h-5 text-success" /> {t('pay_add_type')}
                  </h2>
                  <button
                    onClick={() => setShowNestedTypeModal(false)}
                    className="p-2 hover:bg-success/20 rounded-lg"
                  >
                    <X className="w-5 h-5 text-base-content/50" />
                  </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Nomi *
                    </label>
                    <input
                      type="text"
                      value={typeForm.name}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, name: e.target.value })
                      }
                      disabled={isSubmittingType}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none disabled:opacity-50 ${typeFormErrors.name ? "border-error bg-error/10" : "border-base-300"}`}
                      placeholder="Masalan: Maosh to'lovi"
                    />
                    {typeFormErrors.name && (
                      <p className="mt-1 text-xs text-error">
                        {typeFormErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Kod
                    </label>
                    <input
                      type="text"
                      value={typeForm.code}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, code: e.target.value })
                      }
                      disabled={isSubmittingType}
                      className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none disabled:opacity-50"
                      placeholder="salary_payment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/80 mb-2">
                      Izoh
                    </label>
                    <textarea
                      value={typeForm.description}
                      onChange={(e) =>
                        setTypeForm({
                          ...typeForm,
                          description: e.target.value,
                        })
                      }
                      disabled={isSubmittingType}
                      className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none resize-none disabled:opacity-50"
                      rows={3}
                      placeholder="Qo'shimcha izoh..."
                    />
                  </div>
                </div>
                <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowNestedTypeModal(false)}
                    disabled={isSubmittingType}
                    className="flex-1 px-6 py-2.5 bg-base-100 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200 disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSaveNestedType}
                    disabled={isSubmittingType}
                    className="flex-1 px-6 py-2.5 bg-success text-success-content rounded-xl hover:bg-success/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingType ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('saving')}
                      </>
                    ) : (
                      t('pay_add_select')
                    )}
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
