'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocRoomIdIndexPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual page
    router.push(`/tools/doc-room/${params.id}`);
  }, [router, params.id]);

  return (
    <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading document...</p>
      </div>
    </div>
  );
}
