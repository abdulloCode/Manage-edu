import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { createContext, useContext, useState, useCallback } from "react";

// ── Toast Types ───────────────────────────────────────────────────────
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bg: "bg-success",
    text: "text-success-content",
    border: "border-success/30",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-error",
    text: "text-error-content",
    border: "border-error/30",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning",
    text: "text-warning-content",
    border: "border-warning/30",
  },
  info: {
    icon: Info,
    bg: "bg-info",
    text: "text-info-content",
    border: "border-info/30",
  },
};

// ── Toast Context ───────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => showToast(message, "success", duration), [showToast]);
  const error = useCallback((message, duration) => showToast(message, "error", duration), [showToast]);
  const warning = useCallback((message, duration) => showToast(message, "warning", duration), [showToast]);
  const info = useCallback((message, duration) => showToast(message, "info", duration), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// ── Toast Container ───────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const { icon: Icon, bg, text, border } = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`pointer-events-auto ${bg} ${text} rounded-xl shadow-2xl border ${border} p-4 min-w-[300px] max-w-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-relaxed break-words">
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Helper Functions ─────────────────────────────────────────────────
export function showError(message, duration = 5000) {
  const { error } = useToast();
  return error(message, duration);
}

export function showSuccess(message, duration = 3000) {
  const { success } = useToast();
  return success(message, duration);
}

export function showWarning(message, duration = 4000) {
  const { warning } = useToast();
  return warning(message, duration);
}

export function showInfo(message, duration = 3000) {
  const { info } = useToast();
  return info(message, duration);
}

// ── Alert Replacement Helper ─────────────────────────────────────────
export function showAlert(message, type = "error") {
  const { showToast } = useToast();
  const duration = type === "error" ? 5000 : 3000;
  return showToast(message, type, duration);
}
