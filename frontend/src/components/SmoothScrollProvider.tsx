'use client';

import React, { useEffect } from 'react';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // We only enable this for desktop/mousewheel. Touch devices handle their own physics natively.
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let isAnimating = false;

    // Tweakable physics parameters
    const ease = 0.08; // Lower = smoother and slower interpolation
    const scrollSpeed = 0.6; // Lower = travels less distance per wheel tick

    const animateScroll = () => {
      currentY += (targetY - currentY) * ease;
      
      if (Math.abs(targetY - currentY) > 0.5) {
        window.scrollTo(0, currentY);
        requestAnimationFrame(animateScroll);
      } else {
        window.scrollTo(0, targetY);
        isAnimating = false;
        currentY = targetY; // Ensure exact match at rest
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Don't intercept if scrolling horizontally or if zooming
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Smart check: if the event target is inside a scrollable div (like a modal or dropdown), let native scroll handle it.
      let target = e.target as HTMLElement | null;
      let isInsideScrollable = false;
      
      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        
        // If it's a modal, dropdown, or tab container with auto/scroll overflow and it actually has scrollable content
        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          isInsideScrollable = true;
          break;
        }
        if ((overflowX === 'auto' || overflowX === 'scroll') && target.scrollWidth > target.clientWidth) {
          isInsideScrollable = true;
          break;
        }
        
        target = target.parentElement;
      }

      if (isInsideScrollable) return;

      // Check if body is locked by a modal/popup
      if (document.body.style.overflow === 'hidden') return;

      e.preventDefault();
      
      // Calculate target bounds
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      targetY = Math.max(0, Math.min(targetY + e.deltaY * scrollSpeed, maxScroll));

      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(animateScroll);
      }
    };

    const handleNativeScroll = () => {
      // Sync internal state when native scroll happens (e.g., arrow keys, dragging scrollbar, routing)
      if (!isAnimating) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleNativeScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleNativeScroll);
    };
  }, []);

  return <>{children}</>;
}
