'use client';

import { useEffect } from 'react';

interface HamburgerToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function HamburgerToggle({ collapsed, onToggle }: HamburgerToggleProps) {
  // Add keyboard shortcut (Ctrl+\ or Cmd+\)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+\ or Cmd+\
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggle]);

  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-md transition-all duration-200 hover:bg-dark-card-hover hover:shadow-accent-glow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 ${
        collapsed ? 'rotate-90' : ''
      }`}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+\\ or Cmd+\\)`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-text-secondary hover:text-accent transition-colors duration-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
