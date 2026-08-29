import React, { useEffect } from 'react';

let lockCount = 0;
let originalStyle: string | null = null;

export function useLockBodyScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (lockCount === 0) {
      originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      if (typeof window === 'undefined') return;
      lockCount--;
      if (lockCount === 0 && originalStyle !== null) {
        document.body.style.overflow = originalStyle;
      }
    };
  }, []);
}

export function LockScroll() {
  useLockBodyScroll();
  return null;
}
