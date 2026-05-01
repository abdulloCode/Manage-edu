import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  GraduationCap,
  Briefcase,
  Receipt,
  Scale,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { getPaymentTypeReport } from "../../../api/paymentReports";
import {
  getTeacherBalanceReport,
  getStudentBalanceReport,
  getStaffBalanceReport,
} from "../../../api/balanceReports";

const formatSum = (n) => `${Number(n || 0).toLocaleString()} UZS`;
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

/* ════════════════════════════════════════════════════════════
   Payment Type Tab
   ════════════════════════════════════════════════════════════ */

function PaymentTypeTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [dk, setDk] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setPage(1);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (dk) params.dk = dk;
      if (search.trim()) params.search = search.trim();
      const res = await getPaymentTypeReport(params);
      setData(res.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        console.error("Hisobot yuklanmadi", err);
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Hisobot yuklanmadi";
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, dk]);

  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const items = data?.items || [];
  const summary = data?.summary;
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, page]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative max-w-[180px]">
            <Calendar className="w-3.5 h-3.5 text-base-content/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-8 pr-2 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold outline-none focus:border-primary"
            />
          </div>
          <div className="relative max-w-[180px]">
            <Calendar className="w-3.5 h-3.5 text-base-content/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-8 pr-2 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold outline-none focus:border-primary"
            />
          </div>
          <select
            value={dk}
            onChange={(e) => setDk(e.target.value)}
            className="px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold outline-none focus:border-primary"
          >
            <option value="">Barcha D/K</option>
            <option value="credit">Kirim (K)</option>
            <option value="debit">Chiqim (D)</option>
          </select>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-base-content/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-base-content/60">Yuklanmoqda...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Jami Kirim (K)",
                  value: formatSum(summary.totalCredit),
                  icon: TrendingUp,
                  tone: "text-success",
                  bg: "bg-success/10",
                },
                {
                  label: "Jami Chiqim (D)",
                  value: formatSum(summary.totalDebit),
                  icon: TrendingDown,
                  tone: "text-error",
                  bg: "bg-error/10",
                },
                {
                  label: "Sof balans",
                  value: formatSum(summary.netBalance),
                  icon: Scale,
                  tone: "text-info",
                  bg: "bg-info/10",
                },
                {
                  label: "Tranzaksiyalar",
                  value: `${summary.totalTransactions || 0} ta`,
                  icon: Receipt,
                  tone: "text-primary",
                  bg: "bg-primary/10",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className={`${c.bg} rounded-xl p-3 border border-base-300`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <c.icon className={`w-3.5 h-3.5 ${c.tone}`} />
                    <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider">
                      {c.label}
                    </span>
                  </div>
                  <p className={`text-sm font-black ${c.tone}`}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto bg-base-100 rounded-xl border border-base-300 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-base-200 border-b border-base-300">
                <tr>
                  {[
                    "#",
                    "Nomi",
                    "Kodi",
                    "D/K",
                    "Tavsif",
                    "Summa",
                    "Tranzaksiya",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-12 text-center text-base-content/40 text-sm font-medium"
                    >
                      Ma'lumot yo'q
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, i) => (
                    <tr
                      key={item.id || i}
                      className="border-b border-base-200 last:border-0 hover:bg-base-200/50 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-xs font-bold text-base-content/50">
                        {(page - 1) * itemsPerPage + i + 1}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-bold text-base-content">
                        {item.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-base-content/60 font-mono">
                        {item.code}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.dk === "credit"
                              ? "bg-success/10 text-success"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {item.dk === "credit" ? "K" : "D"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-base-content/60 max-w-[200px] truncate">
                        {item.description || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-bold whitespace-nowrap">
                        <span
                          className={
                            item.dk === "credit"
                              ? "text-success"
                              : "text-error"
                          }
                        >
                          {formatSum(item.totalAmount)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-bold text-base-content/70">
                        {item.transactionCount || 0} ta
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 bg-base-100 border border-base-300 rounded-xl">
              <span className="text-[10px] font-bold text-base-content/40">
                {(page - 1) * itemsPerPage + 1}–
                {Math.min(page * itemsPerPage, items.length)} / {items.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-base-300 rounded-lg hover:bg-base-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => i + 1,
                ).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      page === n
                        ? "bg-primary text-primary-content border-primary"
                        : "border-base-300 hover:bg-base-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 border border-base-300 rounded-lg hover:bg-base-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Balance Tab (Teachers / Students / Staff)
   ════════════════════════════════════════════════════════════ */

function BalanceSummary({ summary }) {
  if (!summary) return null;
  const cards = [
    {
      label: "Boshlang'ich balans",
      value: formatSum(summary.totalStartingBalance),
      icon: Wallet,
      tone: "text-base-content",
      bg: "bg-base-200",
    },
    {
      label: "Jami Oldi",
      value: formatSum(summary.totalOldi),
      icon: ArrowUpCircle,
      tone: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Jami Berdi",
      value: formatSum(summary.totalBerdi),
      icon: ArrowDownCircle,
      tone: "text-error",
      bg: "bg-error/10",
    },
    {
      label: "Yakuniy balans",
      value: formatSum(summary.totalLastBalance),
      icon: BarChart3,
      tone: "text-info",
      bg: "bg-info/10",
    },
    {
      label: "Soni",
      value: `${summary.count || 0} ta`,
      icon: Users,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`${c.bg} rounded-xl p-3 border border-base-300`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <c.icon className={`w-3.5 h-3.5 ${c.tone}`} />
            <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider">
              {c.label}
            </span>
          </div>
          <p className={`text-sm font-black ${c.tone}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function BalanceTable({ items, role, page, setPage, itemsPerPage = 10 }) {
  const totalPages = Math.max(
    1,
    Math.ceil((items?.length || 0) / itemsPerPage),
  );
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return (items || []).slice(start, start + itemsPerPage);
  }, [items, page, itemsPerPage]);

  const headers = [
    { key: "index", label: "#" },
    { key: "name", label: "Ism" },
    { key: "phone", label: "Telefon" },
    { key: "startingBalance", label: "Bosh. balans" },
    { key: "totalOldi", label: "Oldi" },
    { key: "totalBerdi", label: "Berdi" },
    { key: "lastBalance", label: "Yakuniy" },
    ...(role === "teachers"
      ? [{ key: "salaryPercentage", label: "%" }]
      : role === "students"
        ? [{ key: "groupName", label: "Guruh" }]
        : [{ key: "jobTitle", label: "Lavozim" }]),
  ];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-base-100 rounded-xl border border-base-300 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-base-200 border-b border-base-300">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="px-3 py-2.5 text-left text-[10px] font-bold text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-3 py-12 text-center text-base-content/40 text-sm font-medium"
                >
                  Ma'lumot yo'q
                </td>
              </tr>
            ) : (
              paginated.map((item, i) => (
                <tr
                  key={item.id || i}
                  className="border-b border-base-200 last:border-0 hover:bg-base-200/50 transition-colors"
                >
                  <td className="px-3 py-2.5 text-xs font-bold text-base-content/50">
                    {(page - 1) * itemsPerPage + i + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                        {item.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "??"}
                      </div>
                      <span className="font-bold text-base-content text-xs truncate max-w-[140px]">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-base-content/60 font-mono whitespace-nowrap">
                    {item.phone || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-base-content/80 whitespace-nowrap">
                    {formatSum(item.startingBalance)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-success whitespace-nowrap">
                    {formatSum(item.totalOldi)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-error whitespace-nowrap">
                    {formatSum(item.totalBerdi)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold whitespace-nowrap">
                    <span
                      className={
                        (item.lastBalance || 0) >= 0
                          ? "text-info"
                          : "text-warning"
                      }
                    >
                      {formatSum(item.lastBalance)}
                    </span>
                  </td>
                  {role === "teachers" && (
                    <td className="px-3 py-2.5 text-xs font-bold text-primary whitespace-nowrap">
                      {item.salaryPercentage
                        ? `${item.salaryPercentage}%`
                        : "—"}
                    </td>
                  )}
                  {role === "students" && (
                    <td className="px-3 py-2.5 text-xs font-bold text-base-content/70 whitespace-nowrap max-w-[140px] truncate">
                      {item.groupName || "—"}
                    </td>
                  )}
                  {role === "staff" && (
                    <td className="px-3 py-2.5 text-xs font-bold text-base-content/70 whitespace-nowrap max-w-[140px] truncate">
                      {item.jobTitle || "—"}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 bg-base-100 border border-base-300 rounded-xl">
          <span className="text-[10px] font-bold text-base-content/40">
            {(page - 1) * itemsPerPage + 1}–
            {Math.min(page * itemsPerPage, items?.length || 0)} /{" "}
            {items?.length || 0}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-base-300 rounded-lg hover:bg-base-200 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from(
              { length: Math.min(totalPages, 5) },
              (_, i) => i + 1,
            ).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  page === n
                    ? "bg-primary text-primary-content border-primary"
                    : "border-base-300 hover:bg-base-200"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-base-300 rounded-lg hover:bg-base-200 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BalanceTab() {
  const [subTab, setSubTab] = useState("teachers");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());

  const load = async (type) => {
    setLoading(true);
    setPage(1);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search.trim()) params.search = search.trim();

      let res;
      if (type === "teachers") res = await getTeacherBalanceReport(params);
      else if (type === "students")
        res = await getStudentBalanceReport(params);
      else res = await getStaffBalanceReport(params);

      setData(res.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        console.error("Balans hisoboti yuklanmadi", err);
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Balans hisoboti yuklanmadi";
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(subTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(() => load(subTab), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const subTabs = [
    { key: "teachers", label: "O'qituvchilar", icon: GraduationCap },
    { key: "students", label: "O'quvchilar", icon: Users },
    { key: "staff", label: "Xodimlar", icon: Briefcase },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 bg-base-200 p-1 rounded-xl">
        {subTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setSubTab(key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === key
                ? "bg-primary text-primary-content shadow-sm"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2 flex-1">
          <div className="relative max-w-[180px]">
            <Calendar className="w-3.5 h-3.5 text-base-content/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-8 pr-2 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold outline-none focus:border-primary"
            />
          </div>
          <div className="relative max-w-[180px]">
            <Calendar className="w-3.5 h-3.5 text-base-content/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-8 pr-2 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-base-content/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-base-content/60">Yuklanmoqda...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {data.period && (
            <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
              {data.period.startDate} → {data.period.endDate}
            </p>
          )}
          <BalanceSummary summary={data.summary} />
          <BalanceTable
            items={data.items}
            role={subTab}
            page={page}
            setPage={setPage}
            itemsPerPage={10}
          />
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════════ */

export default function PaymentReportsPage() {
  const [activeTab, setActiveTab] = useState("paymentType");

  const tabs = [
    { key: "paymentType", label: "To'lov Turi", icon: Receipt },
    { key: "balance", label: "Balans", icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-base-content">
            To'lov Hisobotlari
          </h1>
          <div className="flex flex-wrap gap-1.5 bg-base-200 p-1 rounded-xl">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === key
                    ? "bg-primary text-primary-content shadow-sm"
                    : "text-base-content/60 hover:text-base-content"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "paymentType" && <PaymentTypeTab />}
        {activeTab === "balance" && <BalanceTab />}
      </div>
    </div>
  );
}
