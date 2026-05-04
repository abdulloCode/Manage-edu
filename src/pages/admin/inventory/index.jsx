import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryCategories,
} from "../../../api/inventory";
import { useToast } from "../../../components/Toast";

const CONDITIONS = ["new", "good", "fair", "poor"];

const COLORS = [
  { bg: "bg-primary/10", text: "text-primary", bar: "bg-primary" },
  { bg: "bg-secondary/10", text: "text-secondary", bar: "bg-secondary" },
  { bg: "bg-accent/10", text: "text-accent", bar: "bg-accent" },
  { bg: "bg-info/10", text: "text-info", bar: "bg-info" },
  { bg: "bg-success/10", text: "text-success", bar: "bg-success" },
  { bg: "bg-warning/10", text: "text-warning", bar: "bg-warning" },
];

function ConditionBadge({ condition }) {
  const map = {
    new: "bg-success/10 text-success",
    good: "bg-info/10 text-info",
    fair: "bg-warning/10 text-warning",
    poor: "bg-error/10 text-error",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        map[condition] || "bg-base-200 text-base-content/50"
      }`}
    >
      {condition || "—"}
    </span>
  );
}

function InventoryCard({ item, index, onEdit, onDelete }) {
  const col = COLORS[index % COLORS.length];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 300, damping: 24 }}
      className="bg-base-100 rounded-xl border border-base-300 overflow-hidden hover:shadow-md transition-all duration-200"
    >
      <div className={`${col.bg} p-3`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-base-100/60 rounded-lg">
              <Package className={`w-4 h-4 ${col.text}`} />
            </div>
            <h3 className="font-bold text-base-content text-sm truncate">
              {item.name}
            </h3>
          </div>
          <ConditionBadge condition={item.condition} />
        </div>
      </div>

      <div className="p-3 space-y-1.5 text-xs text-base-content/70">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3 h-3 shrink-0" />
          <span className="truncate font-medium">{item.category}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Boxes className="w-3 h-3 shrink-0" />
          <span className="font-medium">Miqdor: {item.quantity}</span>
        </div>
        {item.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate font-medium">{item.location}</span>
          </div>
        )}
        {item.purchaseDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="font-medium">
              {new Date(item.purchaseDate).toLocaleDateString("uz-UZ")}
            </span>
          </div>
        )}
        {item.purchasePrice && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 shrink-0" />
            <span className="font-medium">
              {Number(item.purchasePrice).toLocaleString()} so'm
            </span>
          </div>
        )}
        {item.notes && (
          <p className="text-[10px] text-base-content/50 line-clamp-2 pt-1">
            {item.notes}
          </p>
        )}
      </div>

      <div className="px-3 pb-3 flex gap-1.5">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 py-1.5 text-[10px] font-bold text-base-content/70 bg-base-200 hover:bg-base-300 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Edit3 className="w-3 h-3" /> Tahrirlash
        </button>
        <button
          onClick={() => onDelete(item)}
          className="px-2.5 py-1.5 text-base-content/40 bg-base-200 hover:bg-error/10 hover:text-error rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function InventoryModal({
  show,
  onClose,
  editingItem,
  categories,
  formData,
  setFormData,
  onSave,
  isSubmitting,
}) {
  if (!show) return null;

  const isEdit = !!editingItem;
  const fields = [
    { key: "name", label: "Nomi *", type: "text", placeholder: "Masalan: Student Desk", required: true },
    { key: "category", label: "Kategoriya *", type: "select", options: categories, required: true },
    { key: "quantity", label: "Miqdor *", type: "number", placeholder: "25", required: true },
    { key: "condition", label: "Holat", type: "select", options: CONDITIONS },
    { key: "location", label: "Joylashuv", type: "text", placeholder: "Masalan: Room 101" },
    { key: "purchaseDate", label: "Sotib olish sanasi", type: "date" },
    { key: "purchasePrice", label: "Sotib olish narxi (so'm)", type: "number", placeholder: "450000" },
    { key: "notes", label: "Izoh", type: "textarea", placeholder: "Qo'shimcha izoh...", rows: 2 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative bg-base-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          <div className="bg-primary px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-content/20 rounded-xl">
                <Package className="w-5 h-5 text-primary-content" />
              </div>
              <h2 className="font-black text-primary-content text-lg">
                {isEdit ? "Tahrirlash" : "Yangi Inventar"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary-content/20 rounded-xl text-primary-content transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {fields.map(({ key, label, type, placeholder, required, options, rows }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
                  {label}
                </label>
                {type === "select" ? (
                  <select
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-2xl text-sm font-bold text-base-content outline-none focus:bg-base-100 focus:border-primary transition-all"
                  >
                    <option value="">Tanlang...</option>
                    {options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : type === "textarea" ? (
                  <textarea
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    rows={rows || 3}
                    className="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-base-100 focus:border-primary transition-all resize-none placeholder:text-base-content/40"
                  />
                ) : (
                  <input
                    type={type}
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-base-100 focus:border-primary transition-all placeholder:text-base-content/40"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-base-200 border-t border-base-300 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold text-base-content/60 bg-base-100 border border-base-300 rounded-2xl hover:bg-base-200 transition-colors disabled:opacity-50"
            >
              Bekor
            </button>
            <button
              onClick={onSave}
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold text-primary-content bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-content border-t-transparent rounded-full animate-spin" />
                  Saqlashmoqda...
                </>
              ) : isEdit ? (
                "Saqlash"
              ) : (
                "Qo'shish"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DeleteModal({ show, item, onClose, onConfirm, isSubmitting }) {
  if (!show) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-base-300/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          className="relative bg-base-100 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl z-10"
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-5"
          >
            <AlertTriangle className="w-8 h-8 text-error" />
          </motion.div>
          <h3 className="text-xl font-black text-base-content mb-2">
            O'chirilsinmi?
          </h3>
          <p className="text-base-content/40 text-sm mb-2 font-medium">
            <span className="font-bold text-base-content">
              "{item?.name}"
            </span>
          </p>
          <p className="text-base-content/40 text-xs mb-7">
            Bu amalni ortga qaytarib bo'lmaydi.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-base-200 rounded-2xl text-sm font-bold text-base-content/70 hover:bg-base-300 transition-colors"
            >
              Yo'q
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-error text-error-content rounded-2xl text-sm font-bold shadow-lg shadow-error/20 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "O'chirilmoqda..." : "Ha, o'chir"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function InventoryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    condition: "",
    location: "",
    purchaseDate: "",
    purchasePrice: "",
    notes: "",
  });

  const loadItems = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      const res = await getInventoryItems(params);
      const d = res.data;
      setItems(d.items || []);
      setTotal(d.total || 0);
      setPage(d.page || p);
    } catch (err) {
      if (err?.response?.status === 404) {
        console.error("Inventarni yuklashda xatolik", err);
      } else {
        const msg = err?.response?.data?.message || err?.response?.data?.error || "Inventarni yuklashda xatolik";
        showToast(msg, "error", 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getInventoryCategories();
      setCategories(res.data || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadItems(1);
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadItems(1);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openAddModal = () => {
    setFormData({
      name: "",
      category: "",
      quantity: "",
      condition: "",
      location: "",
      purchaseDate: "",
      purchasePrice: "",
      notes: "",
    });
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setFormData({
      name: item.name || "",
      category: item.category || "",
      quantity: item.quantity ?? "",
      condition: item.condition || "",
      location: item.location || "",
      purchaseDate: item.purchaseDate?.split("T")[0] || "",
      purchasePrice: item.purchasePrice ?? "",
      notes: item.notes || "",
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category || formData.quantity === "") {
      showToast("Nomi, kategoriya va miqdor kiritilishi shart!", "error", 5000);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : undefined,
      };
      if (editingItem) {
        await updateInventoryItem(editingItem.id, payload);
      } else {
        await createInventoryItem(payload);
      }
      setShowModal(false);
      loadItems(page);
      loadCategories();
    } catch (err) {
      if (err?.response?.status === 404) {
        console.error("Saqlashda xatolik", err);
      } else {
        const msg = err?.response?.data?.message || err?.response?.data?.error || "Saqlashda xatolik";
        showToast(msg, "error", 5000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteInventoryItem(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadItems(page);
    } catch (err) {
      if (err?.response?.status === 404) {
        console.error("O'chirishda xatolik", err);
      } else {
        const msg = err?.response?.data?.message || err?.response?.data?.error || "O'chirishda xatolik";
        showToast(msg, "error", 5000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-xl">
              <Package className="w-5 h-5 text-primary-content" />
            </div>
            <h1 className="text-xl font-bold text-base-content">Inventar</h1>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 text-sm font-bold text-primary-content bg-primary rounded-2xl shadow-sm flex items-center gap-2 hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Yangi Inventar
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-sm font-bold outline-none focus:border-primary"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-sm font-bold outline-none focus:border-primary"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-base-content/40 text-sm font-medium">
              Yuklanmoqda...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="p-5 bg-primary/10 rounded-3xl">
              <Package className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-base-content/60 font-bold">
              Inventar topilmadi
            </p>
            <button
              onClick={openAddModal}
              className="text-primary text-sm font-bold hover:underline"
            >
              + Birinchi inventarni qo'shing
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => (
                  <InventoryCard
                    key={item.id}
                    item={item}
                    index={i}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-base-100 border border-base-300 rounded-2xl">
                <span className="text-xs text-base-content/40">
                  {(page - 1) * limit + 1}–
                  {Math.min(page * limit, total)} / {total}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const p = Math.max(1, page - 1);
                      setPage(p);
                      loadItems(p);
                    }}
                    disabled={page === 1}
                    className="p-2 border border-base-300 rounded-xl hover:bg-base-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setPage(n);
                        loadItems(n);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        page === n
                          ? "bg-primary text-primary-content border-primary"
                          : "border-base-300 hover:bg-base-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const p = Math.min(totalPages, page + 1);
                      setPage(p);
                      loadItems(p);
                    }}
                    disabled={page === totalPages}
                    className="p-2 border border-base-300 rounded-xl hover:bg-base-200 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <InventoryModal
        show={showModal}
        onClose={() => setShowModal(false)}
        editingItem={editingItem}
        categories={categories}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      <DeleteModal
        show={showDeleteModal}
        item={itemToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
