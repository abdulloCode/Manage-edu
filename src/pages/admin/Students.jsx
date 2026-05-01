import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  assignStudentGroup,
} from "../../api/students";
import { getAllGroups } from "../../api/groups";
import { useDebounce } from "../../hooks/useDebounce";
import PhoneInput from "../../components/PhoneInput";

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n ?? 0).toLocaleString("ru-RU");
const getId = (item) => item?._id || item?.id || null;
const STATUS_BADGE = {
  active: "badge-success",
  inactive: "badge-warning",
  suspended: "badge-error",
  graduated: "badge-info",
  deleted: "badge-ghost",
};

const STATUS_OPTIONS = ["active", "inactive", "suspended", "graduated"];

function BalanceCell({ value }) {
  const n = Number(value ?? 0);
  return (
    <span
      className={`font-semibold text-sm ${n < 0 ? "text-error" : "text-success"}`}
    >
      {fmt(n)}
    </span>
  );
}

// ─── modals ─────────────────────────────────────────────────────────────────

function Modal({ onClose, title, children, wide }) {
  return (
    <div className="modal modal-open">
      <div className={`modal-box ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

function DetailModal({ student, onClose }) {
  return (
    <Modal onClose={onClose} title="Student Details" wide>
      <div className="grid grid-cols-2 gap-3">
        <InfoRow label="Name" value={student.name} />
        <InfoRow label="Phone" value={student.phone} />
        <InfoRow label="Role" value={student.role} />
        <InfoRow
          label="Status"
          value={
            <span
              className={`badge badge-sm ${STATUS_BADGE[student.status] ?? "badge-ghost"} capitalize`}
            >
              {student.status}
            </span>
          }
        />
        <InfoRow
          label="Balance"
          value={
            <span
              className={
                Number(student.balance) < 0
                  ? "text-error font-semibold"
                  : "text-success font-semibold"
              }
            >
              {fmt(student.balance)} UZS
            </span>
          }
        />
        <InfoRow
          label="Expected Payments"
          value={`${fmt(student.expectedPayments)} UZS`}
        />
        <InfoRow
          label="Actual Payments"
          value={`${fmt(student.actualPayments)} UZS`}
        />
      </div>

      {/* Group Information */}
      {student.group && (
        <div className="mt-4">
          <p className="text-xs text-base-content/50 uppercase tracking-wider mb-2">
            Group Information
          </p>
          <div className="bg-base-200 rounded-lg p-3 space-y-2">
            <InfoRow label="Group" value={student.group.name} />
            {student.group.course && (
              <InfoRow label="Course" value={student.group.course.title} />
            )}
            {student.group.teacher && (
              <InfoRow label="Teacher" value={student.group.teacher.name} />
            )}
            <InfoRow
              label="Students"
              value={`${student.group.currentStudents}/${student.group.maxStudents}`}
            />
          </div>
        </div>
      )}

      {student.unpaidMonths?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-base-content/50 uppercase tracking-wider mb-2">
            Unpaid Months
          </p>
          <div className="flex flex-wrap gap-1">
            {student.unpaidMonths.map((m) => (
              <span
                key={m}
                className="badge badge-error badge-outline badge-sm"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="bg-base-200 rounded-lg px-3 py-2">
      <p className="text-xs text-base-content/50 mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    courseId: "",
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [phoneDisplay, setPhoneDisplay] = useState("");

  const handlePhoneChange = (e) => {
    setPhoneDisplay(e.target.value);
    setForm({ ...form, phone: e.target.value.replace(/\D/g, "") });
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { getAllCourses } = await import("../../api/courses");
        const res = await getAllCourses();
        setCourses(res.data.data || res.data || []);
      } catch (err) {
        console.error("Kurslarni yuklashda xatolik:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchCourses();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await createStudent(form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Yangi o'quvchi qo'shish" wide>
      {error && (
        <div className="alert alert-error py-2 text-sm mb-3">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="To'liq ismi *" required>
          <input
            className="input input-bordered w-full"
            value={form.name}
            onChange={set("name")}
            required
            placeholder="Ali Karimov"
          />
        </FormField>
        <FormField label="Telefon *" required>
          <PhoneInput
            value={phoneDisplay}
            onChange={handlePhoneChange}
            required
            className="w-full border-2 border-transparent bg-slate-50 outline-none focus:border-violet-500 focus:bg-white"
          />
        </FormField>
        <FormField label="Parol *" required>
          <input
            type="password"
            className="input input-bordered w-full"
            value={form.password}
            onChange={set("password")}
            required
            placeholder="••••••••"
          />
        </FormField>
        <FormField label="Kurs (ixtiyoriy)">
          {fetching ? (
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="text-sm text-base-content/50">
                Kurslar yuklanmoqda...
              </span>
            </div>
          ) : (
            <select
              className="select select-bordered w-full"
              value={form.courseId}
              onChange={set("courseId")}
            >
              <option value="">Kursni tanlang...</option>
              {courses.map((course) => (
                <option
                  key={course._id || course.id}
                  value={course._id || course.id}
                >
                  {course.name || course.title}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <div className="modal-action mt-1">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className={`btn btn-primary btn-sm ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            Qo'shish
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditModal({ student, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: student.name ?? "",
    phone: student.phone ?? "",
    status: student.status ?? "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneDisplay, setPhoneDisplay] = useState("");

  useEffect(() => {
    setPhoneDisplay(formatPhoneNumber(student.phone) || "");
  }, [student.phone]);

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

  const handlePhoneChange = (e) => {
    setPhoneDisplay(e.target.value);
    setForm({ ...form, phone: e.target.value.replace(/\D/g, "") });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await updateStudent(getId(student), form);
      onUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="O'quvchini tahrirlash" wide>
      {error && (
        <div className="alert alert-error py-2 text-sm mb-3">
          <span>{error}</span>
        </div>
      )}

      {/* Student Info */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-base-content/70 mb-3">
          Asosiy ma'lumotlar
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FormField label="To'liq ismi">
            <input
              className="input input-bordered w-full"
              value={form.name}
              onChange={set("name")}
              placeholder="Ali Karimov"
            />
          </FormField>
          <FormField label="Telefon">
            <PhoneInput
              value={phoneDisplay}
              onChange={handlePhoneChange}
              className="w-full border-2 border-transparent bg-slate-50 outline-none focus:border-violet-500 focus:bg-white"
            />
          </FormField>
          <FormField label="Holati">
            <select
              className="select select-bordered w-full"
              value={form.status}
              onChange={set("status")}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </FormField>

          <div className="modal-action mt-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className={`btn btn-primary btn-sm ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>

      {/* Group & Course Info - Shows assignment button */}
      <div className="mt-4 pt-4 border-t border-base-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-base-content/70">
            Guruh va kurs ma'lumotlari
          </h3>
        </div>

        {student.group ? (
          <div className="bg-base-200 rounded-lg p-3 space-y-2">
            <InfoRow label="Guruh" value={student.group.name} />
            {student.group.course && (
              <InfoRow label="Kurs" value={student.group.course.title} />
            )}
            {student.group.teacher && (
              <InfoRow label="O'qituvchi" value={student.group.teacher.name} />
            )}
            <InfoRow
              label="O'quvchilar"
              value={`${student.group.currentStudents || 0}/${student.group.maxStudents}`}
            />
          </div>
        ) : (
          <div className="alert alert-info py-2 text-sm">
            <span>O'quvchi hech qaysi guruhga biriktirilmagan</span>
          </div>
        )}

        <p className="text-xs text-base-content/50 mt-2">
          Guruhni o'zgartirish uchun quyidagi "Guruh" tugmasini bosing
        </p>
      </div>
    </Modal>
  );
}

function AssignGroupModal({ student, onClose, onAssigned }) {
  const [groupId, setGroupId] = useState(
    student.group?.id || student.group?._id || "",
  );
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setFetching(true);
      try {
        const { data } = await getAllGroups();
        setGroups(data.data || data || []);
      } catch (err) {
        console.error("Failed to load groups:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchGroups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await assignStudentGroup(getId(student), groupId);
      // Include the selected group info in the response
      const selectedGroup = groups.find((g) => (g._id || g.id) === groupId);
      onAssigned({
        ...data,
        group: selectedGroup,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to assign group");
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = groups.find((g) => (g._id || g.id) === groupId);

  return (
    <Modal
      onClose={onClose}
      title={`Guruhga biriktirish — ${student.name}`}
      wide
    >
      {error && (
        <div className="alert alert-error py-2 text-sm mb-3">
          <span>{error}</span>
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FormField label="Guruhni tanlang *" required>
            <select
              className="select select-bordered w-full"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
            >
              <option value="">Guruhni tanlang...</option>
              {groups.map((g) => {
                const studentCount =
                  g.currentStudents || g.students?.length || 0;
                const isFull = studentCount >= g.maxStudents;
                return (
                  <option
                    key={g._id || g.id}
                    value={g._id || g.id}
                    disabled={isFull}
                  >
                    {g.name}{" "}
                    {g.course ? `(${g.course.title || g.course.name})` : ""}{" "}
                    {g.teacher ? `- ${g.teacher.name}` : ""} [{studentCount}/
                    {g.maxStudents} ta]
                    {isFull && " - TO'LA"}
                  </option>
                );
              })}
            </select>
          </FormField>

          {selectedGroup && (
            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-base-content/70">
                Guruh haqida ma'lumot:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Guruh nomi" value={selectedGroup.name} />
                <InfoRow
                  label="O'quvchilar"
                  value={`${selectedGroup.currentStudents || selectedGroup.students?.length || 0}/${selectedGroup.maxStudents}`}
                />
                {selectedGroup.course && (
                  <InfoRow
                    label="Kurs"
                    value={
                      selectedGroup.course.title || selectedGroup.course.name
                    }
                  />
                )}
                {selectedGroup.teacher && (
                  <InfoRow
                    label="O'qituvchi"
                    value={selectedGroup.teacher.name}
                  />
                )}
                {selectedGroup.schedule?.days?.length > 0 && (
                  <InfoRow
                    label="Dars kunlari"
                    value={`${selectedGroup.schedule.days.slice(0, 3).join(", ")}${selectedGroup.schedule.days.length > 3 ? "..." : ""}`}
                  />
                )}
                {selectedGroup.schedule?.fromHour && (
                  <InfoRow
                    label="Vaqt"
                    value={`${selectedGroup.schedule.fromHour} - ${selectedGroup.schedule.toHour}`}
                  />
                )}
                <InfoRow
                  label="Oylik to'lov"
                  value={`${Number(selectedGroup.monthlyFeePerStudent || 0).toLocaleString()} UZS`}
                />
              </div>

              {/* Show students in this group */}
              {selectedGroup.students && selectedGroup.students.length > 0 && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <p className="text-xs font-semibold text-base-content/70 mb-2">
                    Guruhdagi o'quvchilar:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedGroup.students.map((s, i) => (
                      <div
                        key={s.id || s._id || i}
                        className="text-xs py-1 px-2 bg-base-300 rounded"
                      >
                        {s.name} {s.phone ? `(${s.phone})` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-action mt-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className={`btn btn-primary btn-sm ${loading ? "loading" : ""}`}
              disabled={loading || !groupId}
            >
              Biriktirish
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function DeleteConfirmModal({ student, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteStudent(getId(student));
      onDeleted(getId(student));
      onClose();
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to delete student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Delete Student">
      {error && (
        <div className="alert alert-error py-2 text-sm mb-3">
          <span>{error}</span>
        </div>
      )}
      <p className="text-sm text-base-content/70 mb-1">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-base-content">{student.name}</span>?
      </p>
      <p className="text-xs text-base-content/40 mb-4">
        This is a soft delete — the student will be excluded from all future
        queries.
      </p>
      <div className="modal-action">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          className={`btn btn-error btn-sm ${loading ? "loading" : ""}`}
          onClick={handleDelete}
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

function FormField({ label, children, required }) {
  return (
    <div className="form-control">
      <label className="label pb-1">
        <span className="label-text font-medium">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </span>
      </label>
      {children}
    </div>
  );
}

// ─── pagination ──────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="join">
      <button
        className="join-item btn btn-sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        «
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`join-item btn btn-sm ${p === page ? "btn-active" : ""}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="join-item btn btn-sm"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        »
      </button>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasGroup, setHasGroup] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // { type, student? }

  const debouncedSearch = useDebounce(search, 400);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (hasGroup !== "all") params.hasGroup = hasGroup === "true";
      const { data } = await getStudents(params);
      setStudents(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, hasGroup]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, hasGroup]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleCreated = (newStudent) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleUpdated = (updated) => {
    const updatedId = getId(updated);
    setStudents((prev) =>
      prev.map((s) => (getId(s) === updatedId ? { ...s, ...updated } : s)),
    );
  };

  const handleDeleted = (id) => {
    setStudents((prev) => prev.filter((s) => getId(s) !== id));
  };
  const handleAssigned = (updated) => {
    const updatedId = getId(updated);
    setStudents((prev) =>
      prev.map((s) =>
        getId(s) === updatedId
          ? { ...s, ...updated, group: updated.group || s.group }
          : s,
      ),
    );
  };

  const open = (type, student = null) => setModal({ type, student });
  const closeModal = () => setModal(null);

  return (
    <div className=" p-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Students</h1>
          <p className="text-sm text-base-content/50 mt-0.5">
            {pagination.total} total students
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => open("create")}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Student
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <label className="input input-bordered input-sm flex items-center gap-2 w-full max-w-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 text-base-content/40 shrink-0"
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
            placeholder="Qidirish..."
            className="grow bg-transparent outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-base-content/30 hover:text-base-content text-xs"
            >
              ✕
            </button>
          )}
        </label>
        <select
          value={hasGroup}
          onChange={(e) => setHasGroup(e.target.value)}
          className="select select-bordered select-sm w-44"
        >
          <option value="all">Barcha</option>
          <option value="true">Guruhda</option>
          <option value="false">Guruhsiz</option>
        </select>
      </div>

      {/* Table card */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          {error && (
            <div className="alert alert-error m-4 py-2 text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs text-base-content/50 uppercase bg-base-200/50">
                  <th>Name</th>
                  <th>Phone</th>
                  <th className="text-right">Balance</th>
                  <th>Course</th>
                  <th>Created At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <span className="loading loading-spinner loading-md text-primary" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-base-content/30"
                    >
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover">
                      <td>
                        <div className="font-medium text-sm">{s.name}</div>
                      </td>
                      <td className="text-base-content/60 text-xs font-mono">
                        {s.phone}
                      </td>
                      <td className="text-right">
                        <BalanceCell value={s.balance} />
                      </td>
                      <td>
                        {s.group?.course ? (
                          <span className="text-xs text-base-content">
                            {s.group.course.title}
                          </span>
                        ) : (
                          <span className="text-base-content/20 text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs text-base-content/70">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString(
                                "uz-UZ",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => open("detail", s)}
                          >
                            View
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => open("edit", s)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => open("assign", s)}
                              >
                                Group
                              </button>
                              <button
                                className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                                onClick={() => open("delete", s)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && students.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-base-200">
              <span className="text-xs text-base-content/40">
                Page {pagination.page} of {pagination.totalPages} —{" "}
                {pagination.total} records
              </span>
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <CreateModal onClose={closeModal} onCreated={handleCreated} />
      )}
      {modal?.type === "detail" && (
        <DetailModal student={modal.student} onClose={closeModal} />
      )}
      {modal?.type === "edit" && (
        <EditModal
          student={modal.student}
          onClose={closeModal}
          onUpdated={handleUpdated}
        />
      )}
      {modal?.type === "assign" && (
        <AssignGroupModal
          student={modal.student}
          onClose={closeModal}
          onAssigned={handleAssigned}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirmModal
          student={modal.student}
          onClose={closeModal}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
