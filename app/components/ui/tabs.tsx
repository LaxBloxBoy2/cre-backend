"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'default',
}: TabsProps) {
  const getTabStyles = (tab: Tab) => {
    const isActive = tab.id === activeTab;
    const isDisabled = tab.disabled;

    const baseStyles = "flex items-center px-3 py-2 text-sm font-medium transition-all duration-200";

    if (isDisabled) {
      return cn(baseStyles, "cursor-not-allowed opacity-50");
    }

    switch (variant) {
      case 'pills':
        return cn(
          baseStyles,
          "rounded-md",
          isActive
            ? "shadow-accent-glow"
            : ""
        );
      case 'underline':
        return cn(
          baseStyles,
          "border-b-2",
          isActive
            ? "border-accent"
            : "border-transparent hover:border-gray-300 dark:hover:border-dark-card-hover"
        );
      default:
        return cn(
          baseStyles,
          "rounded-md",
          isActive
            ? "shadow-accent-glow"
            : ""
        );
    }
  };

  return (
    <div className={cn("flex space-x-1 overflow-x-auto", className)}>
      {tabs && tabs.length > 0 ? (
        tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={getTabStyles(tab)}
            style={{
              backgroundColor: tab.id === activeTab ? 'var(--bg-card-hover)' : 'transparent',
              color: tab.id === activeTab ? 'var(--accent)' : 'var(--text-muted)'
            }}
            onMouseEnter={(e) => {
              if (tab.id !== activeTab && !tab.disabled) {
                e.currentTarget.style.backgroundColor = 'var(--bg-card-hover-lighter)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab.id !== activeTab && !tab.disabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))
      ) : (
        <div className="text-sm py-2 px-3" style={{ color: 'var(--text-muted)' }}>No tabs available</div>
      )}
    </div>
  );
}

export default Tabs;
