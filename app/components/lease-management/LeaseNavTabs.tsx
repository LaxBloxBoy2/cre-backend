'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, FileText, Users, DollarSign, Settings } from 'lucide-react';

interface NavTab {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export default function LeaseNavTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs: NavTab[] = [
    {
      name: 'Dashboard',
      path: '/tools/lease-management',
      icon: <BarChart3 className="h-4 w-4 mr-2" />
    },
    {
      name: 'Leases',
      path: '/tools/lease-management/leases',
      icon: <FileText className="h-4 w-4 mr-2" />
    },
    {
      name: 'Tenants',
      path: '/tools/lease-management/tenants',
      icon: <Users className="h-4 w-4 mr-2" />
    },
    {
      name: 'Rent Roll',
      path: '/tools/lease-management/rent-roll',
      icon: <DollarSign className="h-4 w-4 mr-2" />
    },
    {
      name: 'Settings',
      path: '/tools/lease-management/settings',
      icon: <Settings className="h-4 w-4 mr-2" />
    }
  ];

  const isActive = (path: string) => {
    if (path === '/tools/lease-management') {
      return pathname === path || pathname === '/tools/lease-management/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="mb-6">
      <div className="inline-flex bg-gray-100 dark:bg-[#0F1117] rounded-lg p-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`relative flex items-center px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                active
                  ? 'bg-white dark:bg-[#1A1D23] text-black dark:text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.name}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F0B4]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
