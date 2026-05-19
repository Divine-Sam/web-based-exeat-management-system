import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from '../types';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const styles: Record<ToastType, { bg: string; icon: ReactNode }> = {
    success: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /> },
    error: { bg: 'bg-red-50 border-red-200 text-red-800', icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> },
    warning: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" /> },
    info: { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" /> },
  };

  const { bg, icon } = styles[toast.type];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md animate-slide-in ${bg}`}>
      {icon}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
