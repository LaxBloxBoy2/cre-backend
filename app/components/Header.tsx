'use client';

import { usePathname } from 'next/navigation';
import { TrendingUp } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  
  return (
    <div className="bg-dark-card border-b border-dark-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center">
          {pathname.includes('/funds/optimize') ? (
            <TrendingUp className="h-6 w-6 mr-2 text-accent" />
          ) : null}
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
      </div>
    </div>
  );
}
