'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Icon } from './Icon';

const ToastCtx = createContext(null);
const ICONS = { default: 'check', success: 'check', error: 'alert', warning: 'alert', info: 'info', upgrade: 'lock', notify: 'bell' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const next = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, { variant = 'default', title, duration = 5000, action } = {}) => {
    next.current += 1;
    const id = `${Date.now()}-${next.current}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, title, variant, duration, action }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.variant}`} role={t.variant === 'error' ? 'alert' : 'status'}>
            <Icon name={ICONS[t.variant] || 'check'} />
            <div className="toast__content">
              {t.title && <p className="toast__title">{t.title}</p>}
              <p className="toast__message">{t.message}</p>
            </div>
            {t.action && <button type="button" className="btn btn-quiet btn-sm toast__action" onClick={() => { t.action.onClick(); dismiss(t.id); }}>{t.action.label}</button>}
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Đóng thông báo"><Icon name="x" /></button>
            {t.duration > 0 && <span className="toast__timer" style={{ animationDuration: `${t.duration}ms` }} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
