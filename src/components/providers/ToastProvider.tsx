"use client";

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2000,
        style: {
          background: '#363636',
          color: '#fff',
          fontFamily: 'var(--font-roboto)',
          fontSize: '0.875rem',
        },
        success: {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
            fontFamily: 'var(--font-roboto)',
            fontSize: '0.875rem',
          },
        },
        error: {
          duration: 2000,
          style: {
            background: '#EF4444',
            color: '#fff',
            fontFamily: 'var(--font-roboto)',
            fontSize: '0.875rem',
          },
        },
        loading: {
          style: {
            background: '#3B82F6',
            color: '#fff',
            fontFamily: 'var(--font-roboto)',
            fontSize: '0.875rem',
          },
        },
      }}
    />
  );
}