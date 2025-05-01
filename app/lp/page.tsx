'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LPPortalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to LP deals page
    router.push('/lp/deals');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}
