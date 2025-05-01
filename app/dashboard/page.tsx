'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardCards from '../components/DashboardCards';
import IrrMarketComparisonChart from '../components/IrrMarketComparisonChart';
import RiskGauge from '../components/RiskGauge';
import DealStatusPanel from '../components/DealStatusPanel';
import DealLifecyclePanel from '../components/DealLifecyclePanel';
import EnhancedQuickActions from '../components/EnhancedQuickActions';
import DealSelector from '../components/DealSelector';
import GlobalAlertList from '../components/GlobalAlertList';
import DealTaskList from '../components/DealTaskList';
import ProtectedRoute from '../components/ProtectedRoute';
import ImportButton from '../components/ImportButton';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <div className="flex items-center gap-3">
          <ImportButton />
          <DealSelector />
        </div>
      </div>

      {/* Top row - Summary cards */}
      <div className="mb-6">
        <DashboardCards />
      </div>

      {/* Middle row - Charts and metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <IrrMarketComparisonChart />
        </div>
        <div>
          <RiskGauge />
        </div>
      </div>

      {/* Pipeline Link */}
      <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Deal Pipeline</h2>
          <Link
            href="/pipeline"
            className="px-4 py-2 rounded-md transition-all duration-200"
            style={{
              background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
              color: 'white'
            }}
          >
            View Pipeline
          </Link>
        </div>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
          Manage your deals through their lifecycle stages with our Kanban-style pipeline view.
        </p>
      </div>

      {/* Status panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div>
          <DealStatusPanel />
        </div>
        <div>
          <DealLifecyclePanel />
        </div>
        <div>
          <EnhancedQuickActions />
        </div>
      </div>

      {/* Tasks and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DealTaskList />
        <GlobalAlertList />
      </div>
    </div>
  );
}
