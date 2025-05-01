'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BarChartIcon, 
  FileTextIcon, 
  UsersIcon, 
  GearIcon, 
  ExitIcon 
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/api';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Deals',
      href: '/deals',
      icon: FileTextIcon,
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: BarChartIcon,
    },
    {
      name: 'LP Portal',
      href: '/lp',
      icon: UsersIcon,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: GearIcon,
    },
  ];

  if (!isClient) {
    return null;
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 border-r', className)}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900">CRE Platform</h2>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center px-4 py-3 text-sm font-medium rounded-md',
              pathname === item.href || pathname.startsWith(`${item.href}/`)
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900"
        >
          <ExitIcon className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
