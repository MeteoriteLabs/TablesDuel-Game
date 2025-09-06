import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  id: string;
  type: "success" | "error" | "streak";
  message: string;
  duration?: number;
}

interface ToastNotificationsProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

export function ToastNotifications({ toasts, onRemove }: ToastNotificationsProps) {
  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 2000);

      return () => clearTimeout(timer);
    });
  }, [toasts, onRemove]);

  const getToastStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-success text-success-foreground";
      case "error":
        return "bg-destructive text-destructive-foreground";
      case "streak":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "streak":
        return "🔥";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`px-6 py-3 rounded-lg shadow-lg ${getToastStyles(toast.type)}`}
            data-testid={`toast-${toast.type}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{getIcon(toast.type)}</span>
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing toasts
export function useToastManager() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (type: "success" | "error" | "streak", message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}
