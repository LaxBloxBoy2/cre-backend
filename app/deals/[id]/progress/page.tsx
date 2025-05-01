'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import DealStageProgress from '../../../components/DealStageProgress';
import DealTaskList from '../../../components/DealTaskList';
import DealAlertList from '../../../components/DealAlertList';

interface DealProgressPageProps {
  params: {
    id: string;
  };
}

export default function DealProgressPage({ params }: DealProgressPageProps) {
  const router = useRouter();
  // Unwrap params using React.use() to fix the warning
  const unwrappedParams = React.use(params);
  const dealId = unwrappedParams.id;

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 text-text-secondary hover:text-white transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-white">Deal Progress</h1>
        <div className="ml-auto flex space-x-4">
          <Link
            href={`/deals/${dealId}`}
            className="px-4 py-2 bg-dark-card-hover text-text-secondary rounded-md hover:text-white transition-all duration-200"
          >
            Deal Overview
          </Link>
          <Link
            href={`/deals/${dealId}/chat`}
            className="px-4 py-2 bg-gradient-to-r from-accent to-accent/80 text-white rounded-md hover:shadow-accent-glow transition-all duration-200"
          >
            AI Chat
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DealStageProgress dealId={dealId} />
        </div>
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <DealTaskList dealId={dealId} />
            <DealAlertList dealId={dealId} />
          </div>
        </div>
      </div>
    </div>
  );
}
