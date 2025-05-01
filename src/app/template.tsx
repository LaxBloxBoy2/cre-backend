'use client';

import MainLayout from '@/components/MainLayout';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip the layout for login page
  if (pathname === '/login') {
    return <>{children}</>;
  }
  
  return <MainLayout>{children}</MainLayout>;
}
