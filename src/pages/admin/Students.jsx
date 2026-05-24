import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getStudents, createStudent, updateStudent,
  deleteStudent, assignStudentGroup,
} from "../../api/students";
import { getAllGroups } from "../../api/groups";
import { getAllCourses } from "../../api/courses";
import { useDebounce } from "../../hooks/useDebounce";
import PhoneInput from "../../components/PhoneInput";
import {
  Plus, Search, Eye, Edit3, Trash2, Users, X,
  AlertCircle, UserPlus, BookOpen, Phone,
} from "lucide-react";

const getId = (item) => item?._id || item?.id || null;
const fmt   = (n)    => Number(n ?? 0).toLocaleString("ru-RU");

const STATUS_LABEL = {
  active:    { label: "Faol",      cls: "bg-emerald-100 text-emerald-700" },
  inactive:  { label: "Nofaol",    cls: "bg-yellow-100 text-yellow-700"   },
  suspended: { label: "To'xtatilgan", cls: "bg-red-100 text-red-700"      },
  graduated: { label: "Bitirgan",  cls: "bg-blue-100 text-blue-700"       },
  deleted:   { label: "O'chirilgan", cls: "bg-gray-100 text-gray-500"     },
};
const STATUS_OPTIONS = ["active", "inactive", "suspended", "graduated"];

// ── helpers ───────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full px-4 py-2.5 bg-white border-2 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 ${
    err ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-indigo-400"
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
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

function Modal({ children, onClose, maxW = "max-w-lg" }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} pointer-events-auto flex flex-col max-h-[90vh] animate-[modalIn_0.2s_ease-out]`}
          style={{ animation: "modalIn 0.18s cubic-bezier(0.22,1,0.36,1)" }}
        >
          {children}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </>
  );
}

function ModalHead({ icon, title, sub, onClose, iconBg = "bg-indigo-100", iconColor = "text-indigo-600" }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

function ModalFoot({ children }) {
  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0 rounded-b-2xl">
      {children}
    </div>
  );
}

function Btn({ onClick, disabled, variant = "primary", children, type = "button" }) {
  const cls = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    ghost:   "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    danger:  "bg-red-600 hover:bg-red-700 text-white",
    green:   "bg-emerald-600 hover:bg-emerald-700 text-white",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${cls}`}
    >
      {children}
    </button>
  );
}

function Spinner({ color = "border-indigo-500" }) {
  return <div className={`w-4 h-4 border-2 ${color} border-t-transparent rounded-full animate-spin`} />;
}

// ── CreateModal ───────────────────────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", phone: "", password: "", parentPhone: "", courseId: "", groupId: "",
  });
  const [courses, setCourses]         = useState([]);
  const [groups, setGroups]           = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [error, setError]             = useState("");

  const patch = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([getAllCourses(), getAllGroups()])
      .then(([cRes, gRes]) => {
        setCourses(cRes.data?.data || cRes.data || []);
        setGroups(gRes.data?.data  || gRes.data  || []);
      })
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik"))
      .finally(() => setFetching(false));
  }, []);

  // Course o'zgarganda guruhlarni filter qil
  useEffect(() => {
    if (!form.courseId) { setFilteredGroups([]); patch("groupId")(""); return; }
    const cid = form.courseId;
    const fg = groups.filter((g) =>
      g.courseId === cid ||
      (g.course && (g.course._id === cid || g.course.id === cid))
    );
    setFilteredGroups(fg);
    patch("groupId")(fg.length > 0 ? getId(fg[0]) : "");
  }, [form.courseId, groups]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())        return setError("Ism kiritilishi shart");
    if (!form.phone.trim())       return setError("Telefon kiritilishi shart");
    if (!form.password.trim())    return setError("Parol kiritilishi shart");
    if (!form.courseId)           return setError("Kurs tanlanishi shart");
    if (!form.parentPhone.trim()) return setError("Ota-ona telefoni kiritilishi shart");

    setLoading(true); setError("");
    try {
      const payload = {
        name:        form.name.trim(),
        phone:       form.phone.length === 9 ? "+998" + form.phone : form.phone,
        password:    form.password,
        parentPhone: form.parentPhone.length === 9 ? "+998" + form.parentPhone : form.parentPhone,
        courseId:    form.courseId,
      };
      const { data } = await createStudent(payload);
      const studentId = getId(data?.student || data);

      if (form.groupId && studentId) {
        await assignStudentGroup(studentId, form.groupId);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHead
        icon={<UserPlus className="w-5 h-5" />}
        title="Yangi o'quvchi"
        sub="Ma'lumotlarni to'ldiring"
        onClose={onClose}
      />

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
        <Field label="To'liq ism *">
          <input
            className={inputCls(false)}
            value={form.name}
            onChange={(e) => patch("name")(e.target.value)}
            placeholder="Ali Karimov"
            autoFocus
          />
        </Field>

        <Field label="Telefon *">
          <PhoneInput
            value={form.phone}
            onChange={(e) => patch("phone")(e.target.value)}
            className="border-gray-200 focus:border-indigo-400"
          />
        </Field>

        <Field label="Parol *">
          <input
            type="password"
            className={inputCls(false)}
            value={form.password}
            onChange={(e) => patch("password")(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Field label="Ota-ona telefoni *">
          <PhoneInput
            value={form.parentPhone}
            onChange={(e) => patch("parentPhone")(e.target.value)}
            className="border-gray-200 focus:border-indigo-400"
          />
        </Field>

        <Field label="Kurs *">
          {fetching ? (
            <div className="flex items-center gap-2 py-2">
              <Spinner /><span className="text-sm text-gray-400">Yuklanmoqda...</span>
            </div>
          ) : (
            <select
              className={inputCls(false)}
              value={form.courseId}
              onChange={(e) => patch("courseId")(e.target.value)}
            >
              <option value="">Kurs tanlang...</option>
              {courses.map((c) => (
                <option key={getId(c)} value={getId(c)}>
                  {c.name || c.title}
                </option>
              ))}
            </select>
          )}
        </Field>

        {filteredGroups.length > 0 && (
          <Field label="Guruh (ixtiyoriy)">
            <select
              className={inputCls(false)}
              value={form.groupId}
              onChange={(e) => patch("groupId")(e.target.value)}
            >
              <option value="">Guruh tanlang...</option>
              {filteredGroups.map((g) => {
                const cnt = g.currentStudents || g.students?.length || 0;
                const full = cnt >= g.maxStudents;
                return (
                  <option key={getId(g)} value={getId(g)} disabled={full}>
                    {g.name} — {g.teacher?.name || "Ustoz yo'q"} [{cnt}/{g.maxStudents}]{full ? " (To'la)" : ""}
                  </option>
                );
              })}
            </select>
          </Field>
        )}

        {form.courseId && !fetching && filteredGroups.length === 0 && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Bu kurs uchun mavjud guruh yo'q
          </div>
        )}
      </form>

      <ModalFoot>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Bekor qilish</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={loading || fetching} type="submit">
          {loading ? <><Spinner color="border-white" />Saqlanmoqda...</> : "Qo'shish"}
        </Btn>
      </ModalFoot>
    </Modal>
  );
}

// ── EditModal ─────────────────────────────────────────────────
function EditModal({ student, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name:   student.name   ?? "",
    phone:  (student.phone ?? "").replace(/^\+?998/, ""),
    status: student.status ?? "active",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const patch = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return setError("Ism kiritilishi shart");
    setLoading(true); setError("");
    try {
      const payload = {
        name:   form.name.trim(),
        phone:  form.phone.length === 9 ? "+998" + form.phone : form.phone,
        status: form.status,
      };
      const { data } = await updateStudent(getId(student), payload);
      onUpdated(data?.student || data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHead
        icon={<Edit3 className="w-5 h-5" />}
        title="O'quvchini tahrirlash"
        sub={student.name}
        onClose={onClose}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
      />

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="p-6 space-y-4 overflow-y-auto flex-1">
        <Field label="To'liq ism">
          <input
            className={inputCls(false)}
            value={form.name}
            onChange={(e) => patch("name")(e.target.value)}
            placeholder="Ali Karimov"
          />
        </Field>

        <Field label="Telefon">
          <PhoneInput
            value={form.phone}
            onChange={(e) => patch("phone")(e.target.value)}
            className="border-gray-200 focus:border-indigo-400"
          />
        </Field>

        <Field label="Holat">
          <select
            className={inputCls(false)}
            value={form.status}
            onChange={(e) => patch("status")(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]?.label || s}</option>
            ))}
          </select>
        </Field>

        {/* Guruh ma'lumotlari */}
        {student.group && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Hozirgi guruh</p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 space-y-1">
              <p><span className="text-gray-400 text-xs">Guruh:</span> {student.group?.name || "—"}</p>
              {student.group?.course && <p><span className="text-gray-400 text-xs">Kurs:</span> {student.group.course?.title || student.group.course?.name}</p>}
              {student.group?.teacher && <p><span className="text-gray-400 text-xs">Ustoz:</span> {student.group.teacher?.name}</p>}
            </div>
          </div>
        )}
      </div>

      <ModalFoot>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Bekor qilish</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <><Spinner color="border-white" />Saqlanmoqda...</> : "Saqlash"}
        </Btn>
      </ModalFoot>
    </Modal>
  );
}

// ── AssignGroupModal ──────────────────────────────────────────
function AssignGroupModal({ student, courses, onClose, onAssigned }) {
  const [courseId,  setCourseId]  = useState(
    student.courseId || getId(student.group?.course) || ""
  );
  const [groupId,   setGroupId]   = useState(
    getId(student.group) || ""
  );
  const [allGroups,      setAllGroups]      = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading,  setLoading]    = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [error,    setError]      = useState("");

  useEffect(() => {
    getAllGroups()
      .then((res) => {
        const g = res.data?.data || res.data || [];
        setAllGroups(g);
      })
      .catch(() => setError("Guruhlarni yuklashda xatolik"))
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (!courseId) { setFilteredGroups(allGroups); return; }
    setFilteredGroups(
      allGroups.filter((g) =>
        g.courseId === courseId ||
        (g.course && (g.course._id === courseId || g.course.id === courseId))
      )
    );
    setGroupId("");
  }, [courseId, allGroups]);

  const selectedGroup = allGroups.find((g) => getId(g) === groupId);

  const handleSubmit = async () => {
    if (!groupId) return setError("Guruh tanlanishi shart");
    setLoading(true); setError("");
    try {
      await assignStudentGroup(getId(student), groupId);
      onAssigned();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHead
        icon={<Users className="w-5 h-5" />}
        title="Guruhga biriktirish"
        sub={student.name}
        onClose={onClose}
        iconBg="bg-green-100"
        iconColor="text-green-600"
      />

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Kurs filter */}
          <Field label="Kurs bo'yicha filter">
            <select
              className={inputCls(false)}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Barcha kurslar</option>
              {courses.map((c) => (
                <option key={getId(c)} value={getId(c)}>{c.name || c.title}</option>
              ))}
            </select>
          </Field>

          {/* Guruh tanlash */}
          <Field label="Guruh *">
            <select
              className={inputCls(false)}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">Guruh tanlang...</option>
              {filteredGroups.map((g) => {
                const cnt  = g.currentStudents || g.students?.length || 0;
                const full = cnt >= g.maxStudents;
                return (
                  <option key={getId(g)} value={getId(g)} disabled={full}>
                    {g.name} — {g.teacher?.name || "Ustoz yo'q"} [{cnt}/{g.maxStudents}]{full ? " ✗ To'la" : ""}
                  </option>
                );
              })}
            </select>
          </Field>

          {/* Tanlangan guruh haqida */}
          {selectedGroup && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Guruh ma'lumotlari</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Nomi",        selectedGroup.name],
                  ["Ustoz",       selectedGroup.teacher?.name || "—"],
                  ["Kurs",        selectedGroup.course?.title || selectedGroup.course?.name || "—"],
                  ["O'quvchilar", `${selectedGroup.currentStudents || 0}/${selectedGroup.maxStudents}`],
                  ["Kunlar",      selectedGroup.schedule?.days?.join(", ") || "—"],
                  ["Vaqt",        selectedGroup.schedule?.fromHour ? `${selectedGroup.schedule.fromHour}–${selectedGroup.schedule.toHour}` : "—"],
                  ["Oylik to'lov", `${Number(selectedGroup.monthlyFeePerStudent || 0).toLocaleString()} UZS`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-white rounded-lg px-3 py-2">
                    <p className="text-gray-400 mb-0.5">{l}</p>
                    <p className="font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ModalFoot>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Bekor qilish</Btn>
        <Btn variant="green" onClick={handleSubmit} disabled={loading || !groupId}>
          {loading ? <><Spinner color="border-white" />Biriktirilmoqda...</> : "Biriktirish"}
        </Btn>
      </ModalFoot>
    </Modal>
  );
}

// ── DetailModal ───────────────────────────────────────────────
function DetailModal({ student, courses, onClose }) {
  const course = courses.find((c) => getId(c) === student.courseId);
  const balance = Number(student.balance ?? 0);

  return (
    <Modal onClose={onClose}>
      <ModalHead
        icon={<Eye className="w-5 h-5" />}
        title="O'quvchi ma'lumotlari"
        sub={student.name}
        onClose={onClose}
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
      />

      <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
            {student.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">{student.name}</p>
            <p className="text-gray-500 text-xs font-mono">{student.phone}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABEL[student.status]?.cls || "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[student.status]?.label || student.status}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Balans", <span className={`font-bold ${balance < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(balance)} UZS</span>],
            ["Ota-ona tel.", student.parentPhone || "—"],
            ["Kurs", course?.name || student.courseName || "—"],
            ["Qo'shilgan", student.createdAt ? new Date(student.createdAt).toLocaleDateString("uz-UZ") : "—"],
          ].map(([l, v]) => (
            <div key={l} className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-0.5">{l}</p>
              <div className="text-sm font-medium text-gray-800">{v}</div>
            </div>
          ))}
        </div>

        {/* Guruh */}
        {student.group && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Guruh</p>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1.5 text-xs">
              {[
                ["Guruh", student.group.name],
                ["Kurs",  student.group.course?.title || student.group.course?.name || "—"],
                ["Ustoz", student.group.teacher?.name || "—"],
                ["O'quvchilar", `${student.group.currentStudents || 0}/${student.group.maxStudents}`],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-gray-500">{l}:</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* To'lanmagan oylar */}
        {student.unpaidMonths?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">To'lanmagan oylar</p>
            <div className="flex flex-wrap gap-1.5">
              {student.unpaidMonths.map((m) => (
                <span key={m} className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-lg">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <ModalFoot>
        <Btn variant="ghost" onClick={onClose}>Yopish</Btn>
      </ModalFoot>
    </Modal>
  );
}

// ── DeleteModal ───────────────────────────────────────────────
function DeleteModal({ student, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteStudent(getId(student));
      onDeleted(getId(student));
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} maxW="max-w-sm">
      <ModalHead
        icon={<Trash2 className="w-5 h-5" />}
        title="O'chirishni tasdiqlang"
        onClose={onClose}
        iconBg="bg-red-100"
        iconColor="text-red-600"
      />
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>
        )}
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{student.name}</span>ni o'chirishni tasdiqlaysizmi?
        </p>
        <p className="text-xs text-gray-400 mt-1">Bu amal qaytarilmaydi.</p>
      </div>
      <ModalFoot>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Bekor</Btn>
        <Btn variant="danger" onClick={handleDelete} disabled={loading}>
          {loading ? <><Spinner color="border-white" />O'chirilmoqda...</> : "O'chirish"}
        </Btn>
      </ModalFoot>
    </Modal>
  );
}

// ── Pagination ─────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(page - 1)} disabled={page === 1}
        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      >←</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
        <button
          key={p} onClick={() => onChange(p)}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${p === page ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 hover:bg-gray-50"}`}
        >{p}</button>
      ))}
      <button
        onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      >→</button>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function StudentsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const [students,   setStudents]   = useState([]);
  const [courses,    setCourses]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [hasGroup,   setHasGroup]   = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    getAllCourses()
      .then((res) => setCourses(res.data?.data || res.data || []))
      .catch(() => {});
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (debouncedSearch) params.search    = debouncedSearch;
      if (hasGroup !== "all") params.hasGroup = hasGroup === "true";
      if (courseFilter !== "all") params.courseId = courseFilter;

      const { data } = await getStudents(params);
      const list = data?.data || data?.students || data || [];
      setStudents(list);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: list.length });
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, hasGroup, courseFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const open  = (type, student = null) => setModal({ type, student });
  const close = () => setModal(null);

  const handleDeleted = (id) => setStudents((prev) => prev.filter((s) => getId(s) !== id));
  const handleUpdated = (updated) => {
    const uid = getId(updated);
    setStudents((prev) => prev.map((s) => getId(s) === uid ? { ...s, ...updated } : s));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">O'quvchilar</h1>
            <p className="text-sm text-gray-500 mt-0.5">{pagination.total} ta o'quvchi</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm w-52"
              />
            </div>

            {/* Guruh filter */}
            <select
              value={hasGroup}
              onChange={(e) => { setHasGroup(e.target.value); setPage(1); }}
              className="py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 shadow-sm"
            >
              <option value="all">Barcha</option>
              <option value="true">Guruhda</option>
              <option value="false">Guruhsiz</option>
            </select>

            {/* Kurs filter */}
            <select
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
              className="py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 shadow-sm"
            >
              <option value="all">Barcha kurslar</option>
              {courses.map((c) => (
                <option key={getId(c)} value={getId(c)}>{c.name || c.title}</option>
              ))}
            </select>

            {canEdit && (
              <button
                onClick={() => open("create")}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />O'quvchi qo'shish
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Spinner /><p className="text-sm text-gray-400">Yuklanmoqda...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Users className="w-14 h-14 text-gray-200" />
              <p className="text-sm text-gray-400">O'quvchilar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "O'quvchi", "Telefon", "Balans", "Kurs", "Guruh", "Holat", "Amallar"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide ${i === 7 ? "text-right" : "text-left"}`}
                      >{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, idx) => {
                    const balance = Number(s.balance ?? 0);
                    const status  = STATUS_LABEL[s.status] || { label: s.status, cls: "bg-gray-100 text-gray-600" };
                    // Course: from courses list (has color), fallback to s.courseName
                    const course  = courses.find((c) => getId(c) === s.courseId);
                    const courseName = course?.name || s.courseName || s.course?.name || s.course?.title || "";
                    const courseColor = course?.color || "#6366f1";

                    return (
                      <tr key={getId(s)} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">
                          {(page - 1) * 50 + idx + 1}
                        </td>

                        {/* O'quvchi */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {s.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                          </div>
                        </td>

                        {/* Telefon */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500 font-mono">{s.phone || "—"}</span>
                        </td>

                        {/* Balans */}
                        <td className="px-4 py-3.5">
                          <span className={`text-sm font-bold ${balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {fmt(balance)}
                          </span>
                        </td>

                        {/* Kurs */}
                        <td className="px-4 py-3.5">
                          {courseName ? (
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                background: courseColor + "18",
                                color: courseColor,
                                border: `1px solid ${courseColor}40`,
                              }}
                            >
                              {courseName}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>

                        {/* Guruh */}
                        <td className="px-4 py-3.5">
                          {s.group?.name || s.groupName ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                              {s.group?.name || s.groupName}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">Guruhsiz</span>
                          )}
                        </td>

                        {/* Holat */}
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>

                        {/* Amallar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <ActionBtn title="Ko'rish" color="blue" onClick={() => open("detail", s)}>
                              <Eye className="w-3.5 h-3.5" />
                            </ActionBtn>
                            {canEdit && (
                              <>
                                <ActionBtn title="Tahrirlash" color="amber" onClick={() => open("edit", s)}>
                                  <Edit3 className="w-3.5 h-3.5" />
                                </ActionBtn>
                                <ActionBtn title="Guruhga biriktirish" color="green" onClick={() => open("assign", s)}>
                                  <Users className="w-3.5 h-3.5" />
                                </ActionBtn>
                                <ActionBtn title="O'chirish" color="red" onClick={() => open("delete", s)}>
                                  <Trash2 className="w-3.5 h-3.5" />
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

          {/* Pagination */}
          {!loading && students.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {pagination.total} ta dan {students.length} ta ko'rsatilmoqda
              </span>
              <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <CreateModal onClose={close} onCreated={() => { fetchStudents(); close(); }} />
      )}
      {modal?.type === "detail" && (
        <DetailModal student={modal.student} courses={courses} onClose={close} />
      )}
      {modal?.type === "edit" && (
        <EditModal student={modal.student} onClose={close} onUpdated={(u) => { handleUpdated(u); close(); }} />
      )}
      {modal?.type === "assign" && (
        <AssignGroupModal student={modal.student} courses={courses} onClose={close} onAssigned={() => { fetchStudents(); close(); }} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal student={modal.student} onClose={close} onDeleted={(id) => { handleDeleted(id); close(); }} />
      )}
    </div>
  );
}

function ActionBtn({ title, color, onClick, children }) {
  const cls = {
    blue:  "text-blue-600 hover:bg-blue-50",
    amber: "text-amber-600 hover:bg-amber-50",
    green: "text-emerald-600 hover:bg-emerald-50",
    red:   "text-red-600 hover:bg-red-50",
  }[color];
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${cls}`}>
      {children}
    </button>
  );
}
