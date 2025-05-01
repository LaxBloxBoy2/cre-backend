'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

interface SidebarResizerProps {
  onResize: (width: number) => void;
}

export default function SidebarResizer({ onResize }: SidebarResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // If Ctrl key is pressed, toggle between collapsed and expanded
    if (e.ctrlKey) {
      const currentWidth = resizerRef.current?.parentElement?.clientWidth;
      if (currentWidth) {
        // If width is less than 96px, expand to 240px, otherwise collapse to 72px
        const newWidth = currentWidth < 96 ? 240 : 72;
        onResize(newWidth);
        localStorage.setItem('sidebarWidth', newWidth.toString());
        showToast(`Sidebar ${newWidth < 96 ? 'collapsed' : 'expanded'}`, 'success');
      }
      return;
    }

    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate new width based on mouse position
      const newWidth = e.clientX;

      // Apply constraints (min: 72px, max: 360px)
      const constrainedWidth = Math.max(72, Math.min(360, newWidth));

      // Call the onResize callback with the new width
      onResize(constrainedWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);

        // Save the current width to localStorage
        const currentWidth = resizerRef.current?.parentElement?.clientWidth;
        if (currentWidth) {
          localStorage.setItem('sidebarWidth', currentWidth.toString());
          showToast('Sidebar width saved', 'success');
        }
      }
    };

    // Add event listeners when dragging starts
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize]);

  return (
    <div
      ref={resizerRef}
      className={`absolute top-0 right-0 h-full w-2 cursor-col-resize bg-accent/20 hover:bg-accent/50 transition-colors z-50 ${
        isDragging ? 'bg-accent' : ''
      }`}
      onMouseDown={handleMouseDown}
      title="Drag to resize sidebar (Ctrl+Click to collapse)"
      aria-label="Resize sidebar"
    />
  );
}
