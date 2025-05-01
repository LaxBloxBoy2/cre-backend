'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ClientRedirectProps {
  to: string;
  checkAuth?: boolean;
}

export function ClientRedirect({ to, checkAuth = false }: ClientRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (checkAuth) {
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (token) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } else {
      router.push(to);
    }
  }, [router, to, checkAuth]);

  return null;
}
