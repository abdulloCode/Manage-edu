import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Wallet,
  Calendar,
  DollarSign,
  X,
  AlertCircle,
  Tag,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  UserPlus,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import {
  usePayments,
  usePaymentForm,
  savePayment,
  removePayment,
  savePaymentType,
  removePaymentType,
} from "./hooks";
import { getAllTeachers } from "../../../api/teacher";
import { getStudents } from "../../../api/students";
import { getAllGroups } from "../../../api/groups";


export default function PaymentsPage() {
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
  const [recipientDebt, setRecipientDebt] = useState(0);
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
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    toWho: "",
    date: new Date().toISOString().slice(0, 10),
    comment: "",
  });

  const [typeForm, setTypeForm] = useState({
    name: "",
    code: "",
    dk: "credit",
    description: "",
  });



  // ── Load teachers/students/groups/staff for recipient selection ──
  useEffect(() => {
    if (showPaymentModal) {
      const loadData = async () => {
        try {
          const [teachersRes, studentsRes, groupsRes] = await Promise.all([
            getAllTeachers(),
            getStudents({ limit: 1000 }),
            getAllGroups(),
          ]);
          setTeachers(teachersRes.data.data || teachersRes.data || []);
          setStudents(studentsRes.data.data || studentsRes.data || []);
          setGroups(groupsRes.data.data || groupsRes.data || []);
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
    if (payment.type?.dk) return payment.type.dk;
    const typeId = payment.type?._id || payment.type?.id || payment.type;
    return typeMap[typeId] || null;
  };

  const totalIncome = payments
    .filter((p) => getDk(p) === "credit")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalExpense = payments
    .filter((p) => getDk(p) === "debit")
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
    if (recipientCategory === "student")
      return filteredStudents.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchLower) ||
          s.phone?.includes(searchLower),
      );
    return [];
  };

  const resetPaymentModal = () => {
    setPaymentForm({
      type: "",
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
    setRecipientDebt(0);
    setRecipientDebtInfo({ debt: 0, salary: 0, paid: 0, lastPayment: 0 });
  };

  // ── Click outside to close recipient dropdown ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(e.target)) {
        setShowRecipientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Handlers ──
  const handleSavePayment = async () => {
    const errors = {};
    if (!paymentForm.type) errors.type = "To'lov turini tanlang!";
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0)
      errors.amount = "Summani kiriting!";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);
    try {
      // Type ID bo'lishi kerak, agar string bo'lsa, ID ga o'tkazish
      let typeId = paymentForm.type;
      if (typeof typeId === "string" && typeId.length > 20) {
        // Bu ID bo'lishi kerak
      } else if (typeof typeId === "string") {
        // Bu name bo'lishi mumkin, ID topish kerak
        let typeObj = paymentTypes.find(
          (t) => t._id === typeId || t.id === typeId,
        );
        if (!typeObj) {
          typeObj = paymentTypes.find((t) => t.name === typeId);
        }
        if (typeObj) {
          typeId = typeObj._id || typeObj.id;
        }
      }

      const success = await savePayment(editingPayment, {
        type: paymentForm.type,
        amount: Number(paymentForm.amount),
        month: paymentForm.month,
        toWho: paymentForm.toWho,
        date: paymentForm.date,
        comment: paymentForm.comment,
      });
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
    if (!typeForm.name) errors.name = "Nomi kiritilishi shart!";
    if (Object.keys(errors).length > 0) {
      setTypeFormErrors(errors);
      return;
    }
    setTypeFormErrors({});
    setIsSubmittingType(true);
    try {
      const success = await savePaymentType(editingType, typeForm);
      if (success) {
        setShowTypeModal(false);
        setTypeForm({ name: "", code: "", dk: "credit", description: "" });
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
    if (!typeForm.name) errors.name = "Nomi kiritilishi shart!";
    if (Object.keys(errors).length > 0) {
      setTypeFormErrors(errors);
      return;
    }
    setTypeFormErrors({});
    setIsSubmittingType(true);
    try {
      const success = await savePaymentType(null, typeForm);
      if (success) {
        // Yangi turi qo'shilgandan so'ng, to'lov turlarini yangilash
        await loadPaymentTypes();
        // Yangi qo'shilgan turini avtomatik tanlash (oxirgi qo'shilganini)
        setTimeout(() => {
          const currentPaymentTypes = paymentTypes || [];
          const newestType =
            currentPaymentTypes[currentPaymentTypes.length - 1];
          if (newestType) {
            setPaymentForm((prev) => ({
              ...prev,
              type: newestType._id || newestType.id,
            }));
          }
          // Nested modalni yopish va formni tozalash
          setShowNestedTypeModal(false);
          setTypeForm({ name: "", code: "", dk: "credit", description: "" });
        }, 300);
      }
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleDeleteType = async (id) => {
    if (await removePaymentType(id)) loadPaymentTypes();
  };

  // ── Recipient type detection ──

  // ── Recipient type detection ──
  const getRecipientType = (payment) => {
    const recipientId =
      payment.toWho?._id || payment.toWho?.id || payment.toWho;
    if (!recipientId) return "unknown";

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
    const matchesSearch =
      (p.type?.name || p.type?.code || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (typeof p.toWho === "object" ? p.toWho?.name : p.toWho || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (p.comment || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      paymentCategory === "all" || getRecipientType(p) === paymentCategory;

    return matchesSearch && matchesCategory;
  });

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidirish..."
                className="w-64 pl-10 pr-4 py-2 bg-base-100 border border-base-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={paymentCategory}
              onChange={(e) => setPaymentCategory(e.target.value)}
              className="select select-bordered select-sm w-44"
            >
              <option value="all">Barcha</option>
              <option value="student">
                O'quvchilar ({payments.filter((p) => getRecipientType(p) === "student").length})
              </option>
              <option value="teacher">
                O'qituvchilar ({payments.filter((p) => getRecipientType(p) === "teacher").length})
              </option>
              <option value="staff">
                Xodimlar ({payments.filter((p) => getRecipientType(p) === "staff").length})
              </option>
            </select>
          </div>
          <button
            onClick={() => {
              resetPaymentModal();
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-content rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all font-bold"
          >
            <Plus className="w-4 h-4" /> Yangi To'lov
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
                  Jami to'lovlar
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
                  Kirim (UZS)
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
                  Chiqim (UZS)
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
                  Sof Balans (UZS)
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
                    <p className="text-base-content/50 font-medium">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-base-200 border-b border-base-300">
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                Sana
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                Turi
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                Kim uchun
                              </th>
                              {paymentCategory === "all" && (
                                <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                  Tur
                                </th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                Oy
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                Summa
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                Izoh
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-base-content/70 uppercase tracking-wider">
                                Amallar
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
                                      {paymentCategory === "all"
                                        ? "To'lovlar yo'q"
                                        : paymentCategory === "student"
                                          ? "O'quvchi to'lovlari yo'q"
                                          : paymentCategory === "teacher"
                                            ? "O'qituvchi to'lovlari yo'q"
                                            : "Xodim to'lovlari yo'q"}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredPayments.map((payment) => {
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
                                          payment.type?.dk === "credit"
                                            ? "bg-success/20 text-success"
                                            : "bg-error/20 text-error"
                                        }`}
                                      >
                                        {payment.type?.dk === "credit" ? (
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
                                                  : "bg-neutral/20 text-neutral"
                                          }`}
                                        >
                                          {recipientType === "student"
                                            ? "O'quvchi"
                                            : recipientType === "teacher"
                                              ? "O'qituvchi"
                                              : recipientType === "staff"
                                                ? "Xodim"
                                                : "Noma'lum"}
                                        </span>
                                      </td>
                                    )}
                                    <td className="px-4 py-3 text-sm font-medium text-base-content/70">
                                      {payment.month || "—"}
                                    </td>
                                    <td
                                      className={`px-4 py-3 text-sm font-bold text-right ${
                                        payment.type?.dk === "credit"
                                          ? "text-success"
                                          : "text-error"
                                      }`}
                                    >
                                      {payment.type?.dk === "credit"
                                        ? "+"
                                        : "-"}
                                      {Number(
                                        payment.amount || 0,
                                      ).toLocaleString()}{" "}
                                      UZS
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-base-content/70 max-w-xs truncate">
                                      {payment.comment || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingPayment(payment);
                                            const amount = payment.amount || "";
                                            setPaymentForm({
                                              type:
                                                payment.type?._id ||
                                                payment.type?.id ||
                                                payment.type ||
                                                "",
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
                                            setRecipientDebt(0);
                                            setRecipientDebtInfo({
                                              debt: 0,
                                              salary: 0,
                                              paid: 0,
                                              lastPayment: 0,
                                            });
                                            setShowPaymentModal(true);
                                          }}
                                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                          title="Tahrirlash"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (await removePayment(payment))
                                              loadPayments();
                                          }}
                                          className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                                          title="O'chirish"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>

                        </table>
                      </div>
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
                    {editingPayment ? "To'lovni Tahrirlash" : "Yangi To'lov"}
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
                        Xatolarni to'g'irlang:
                      </span>
                    </div>
                    <ul className="mt-2 ml-7 text-sm font-medium text-error list-disc space-y-1">
                      {Object.values(formErrors).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm font-bold text-base-content/80 mb-2">
                      Turi *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={paymentForm.type}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            type: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className={`select select-bordered flex-1 ${formErrors.type ? "select-error" : ""}`}
                      >
                        <option value="">Tanlang</option>
                        {paymentTypes.filter((t) => t.dk === "credit")
                          .length > 0 && (
                          <optgroup label="📈 Kirim">
                            {paymentTypes
                              .filter((t) => t.dk === "credit")
                              .map((t) => (
                                <option
                                  key={t._id || t.id}
                                  value={t._id || t.id}
                                >
                                  {t.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {paymentTypes.filter((t) => t.dk === "debit").length >
                          0 && (
                          <optgroup label="📉 Chiqim">
                            {paymentTypes
                              .filter((t) => t.dk === "debit")
                              .map((t) => (
                                <option
                                  key={t._id || t.id}
                                  value={t._id || t.id}
                                >
                                  {t.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNestedTypeModal(true)}
                        disabled={isSubmitting}
                        className="btn btn-success btn-square"
                        title="Yangi tolov turi qo'shish"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {formErrors.type && (
                      <p className="mt-1 text-xs font-bold text-error">
                        {formErrors.type}
                      </p>
                    )}

                      {/* Tanlangan tur bo'yicha kirim/chiqim ko'rsatkichi */}
                      {paymentForm.type &&
                        (() => {
                          const selectedType = paymentTypes.find(
                            (t) => (t._id || t.id) === paymentForm.type,
                          );
                          if (selectedType) {
                            const isCredit = selectedType.dk === "credit";
                            return (
                              <div
                                className={`mt-2 p-2 rounded-lg ${isCredit ? "bg-success/10 text-success" : "bg-error/10 text-error"} flex items-center gap-2 text-xs`}
                              >
                                {isCredit ? (
                                  <ArrowUpCircle className="w-4 h-4" />
                                ) : (
                                  <ArrowDownCircle className="w-4 h-4" />
                                )}
                                <span className="font-medium">
                                  {isCredit
                                    ? "Kirim: Kassa + "
                                    : "Chiqim: Kassa - "}
                                </span>
                                <span>{selectedType.name}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                  </div>

                  {/* Summa - full width */}
                  <div>
                    <label className="block text-sm font-bold text-base-content/80 mb-2">
                      Summa (UZS) *
                      </label>
                      <input
                        type="text"
                        value={amountInput}
                        onChange={handleAmountChange}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 font-medium ${formErrors.amount ? "border-error bg-error/10" : "border-base-300"}`}
                        placeholder="1,000,000"
                      />
                      {formErrors.amount && (
                        <p className="mt-1 text-xs font-bold text-error">
                          {formErrors.amount}
                        </p>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-base-content/80 mb-2">
                        Oy *
                      </label>
                      <input
                        type="month"
                        value={paymentForm.month}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            month: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-base-content/80 mb-2">
                        Sana *
                      </label>
                      <input
                        type="date"
                        value={paymentForm.date}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            date: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 font-medium"
                      />
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="block text-sm font-bold text-base-content/80 mb-2">
                      Kim uchun to'lov
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        {
                          value: "teacher",
                          label: "O'qituvchi",
                          icon: GraduationCap,
                        },
                        { value: "staff", label: "Xodim", icon: Building2 },
                        { value: "student", label: "O'quvchi", icon: UserPlus },
                      ].map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setRecipientCategory(cat.value);
                            setSelectedGroup(null);
                            setRecipientSearch("");
                            setPaymentForm({ ...paymentForm, toWho: "" });
                            setSelectedRecipient(null);
                            setRecipientDebt(0);
                            setRecipientDebtInfo({
                              debt: 0,
                              salary: 0,
                              paid: 0,
                              lastPayment: 0,
                            });
                          }}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all disabled:opacity-50 font-bold ${recipientCategory === cat.value ? "border-primary bg-primary/10 text-primary" : "border-base-300 text-base-content/50 hover:bg-base-200"}`}
                        >
                          <cat.icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {recipientCategory === "student" && (
                      <div className="mb-3">
                        <select
                          value={selectedGroup?.id || selectedGroup?._id || ""}
                          onChange={(e) => {
                            const g = groups.find(
                              (gr) =>
                                gr.id === e.target.value ||
                                gr._id === e.target.value,
                            );
                            setSelectedGroup(g || null);
                          }}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                        >
                          <option value="">Barcha guruhlar</option>
                          {groups.map((g) => (
                            <option key={g.id || g._id} value={g.id || g._id}>
                              {g.name} (
                              {g.currentStudents || g.students?.length || 0} ta)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {recipientCategory && (
                      <div ref={recipientDropdownRef} className="relative">
                        <div className="relative mb-2">
                          <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Qidirish..."
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
                            className="w-full pl-10 pr-10 py-2.5 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                          />
                          {selectedRecipient && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecipient(null);
                                setPaymentForm({ ...paymentForm, toWho: "" });
                                setRecipientSearch("");
                                setShowRecipientDropdown(true);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {showRecipientDropdown && (
                          <div className="absolute z-50 left-0 right-0 bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {getFilteredRecipients().length === 0 ? (
                              <div className="p-4 text-center text-base-content/40 text-sm">
                                Topilmadi
                              </div>
                            ) : (
                              getFilteredRecipients().map((person) => {
                                const personId = person._id || person.id;
                                return (
                                  <button
                                    key={personId}
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                      setPaymentForm({
                                        ...paymentForm,
                                        toWho: personId,
                                        amount: "",
                                      });
                                      setAmountInput("");
                                      setSelectedRecipient(person);
                                      setRecipientSearch("");
                                      setShowRecipientDropdown(false);
                                      const di = calculateRecipientDebt(person);
                                      setRecipientDebt(di.debt);
                                      setRecipientDebtInfo(di);
                                      setFormErrors({
                                        ...formErrors,
                                        toWho: null,
                                      });
                                    }}
                                    className="w-full text-left px-4 py-2.5 border-b border-base-200 last:border-0 transition-colors disabled:opacity-50 hover:bg-base-200 text-base-content/80"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-semibold text-base-content/70">
                                          {person.name
                                            ?.split(" ")
                                            .slice(0, 2)
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase() || "?"}
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm truncate">{person.name}</p>
                                        {person.phone && (
                                          <p className="text-xs text-base-content/40">
                                            {person.phone}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}

                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-base-content/80 mb-2">
                      Izoh
                    </label>
                    <textarea
                      value={paymentForm.comment}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          comment: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none disabled:opacity-50 font-medium"
                      rows={3}
                      placeholder="Qo'shimcha izoh..."
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-base-100 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200 transition-all font-bold disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2.5 bg-primary text-primary-content rounded-xl hover:bg-primary/90 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : editingPayment ? (
                      "Yangilash"
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
                    <Plus className="w-5 h-5 text-success" /> Yangi To'lov
                    Turi
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
                      Turi *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setTypeForm({ ...typeForm, dk: "credit" })
                        }
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${typeForm.dk === "credit" ? "border-success bg-success/10 text-success" : "border-base-300 text-base-content/50"}`}
                      >
                        <ArrowUpCircle className="w-5 h-5" /> Kirim
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTypeForm({ ...typeForm, dk: "debit" })
                        }
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${typeForm.dk === "debit" ? "border-error bg-error/10 text-error" : "border-base-300 text-base-content/50"}`}
                      >
                        <ArrowDownCircle className="w-5 h-5" /> Chiqim
                      </button>
                    </div>
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
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSaveNestedType}
                    disabled={isSubmittingType}
                    className="flex-1 px-6 py-2.5 bg-success text-success-content rounded-xl hover:bg-success/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingType ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saqlashmoqda...
                      </>
                    ) : (
                      "Qo'shish va Tanlash"
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
