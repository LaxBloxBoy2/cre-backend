'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setupMockData } from './setup-mock-data';

export default function DemoLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Set demo tokens in localStorage
    localStorage.setItem('accessToken', 'demo_access_token');
    localStorage.setItem('refreshToken', 'demo_refresh_token');

    // Set up mock user data
    setupMockData();

    // Redirect to comps page after a short delay
    const timer = setTimeout(() => {
      router.push('/comps');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)' }}>QAPT</span> Demo Login
        </h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4 mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Setting up demo account...</p>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>You will be redirected to the dashboard automatically.</p>
      </div>
    </div>
  );
}
