'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
}

export default function SidebarLink({ href, icon, label, disabled = false }: SidebarLinkProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  if (disabled) {
    return (
      <div className="flex items-center px-4 py-2 rounded-md text-text-secondary opacity-50 cursor-not-allowed">
        <span className="mr-3">{icon}</span>
        <span className="link-label">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <Link
        href={href}
        className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
          isActive(href)
            ? 'bg-dark-card-hover text-accent shadow-accent-glow'
            : 'hover:bg-dark-card-hover hover:text-white text-text-secondary'
        }`}
      >
        <span className="mr-3">{icon}</span>
        <span className="link-label">{label}</span>
      </Link>

      {/* Tooltip for collapsed state */}
      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
        <div className="bg-dark-card-hover text-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {label}
        </div>
      </div>
    </div>
  );
}
