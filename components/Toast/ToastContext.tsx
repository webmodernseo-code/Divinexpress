'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showToast = (msg: string) => {
    setMessage(msg);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className={styles.toastContainer}>
          <div className={styles.toast}>{message}</div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
