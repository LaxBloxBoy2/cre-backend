'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardCards from '../../components/DashboardCards';
import IrrMarketComparisonChart from '../../components/IrrMarketComparisonChart';
import RiskGauge from '../../components/RiskGauge';
import DealStatusPanel from '../../components/DealStatusPanel';
import DealLifecyclePanel from '../../components/DealLifecyclePanel';
import EnhancedQuickActions from '../../components/EnhancedQuickActions';

export default function NewDashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="bg-card-dark shadow-lg border-b border-dark-card-hover">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex space-x-4">
            <Link
              href="/deals"
              className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
            >
              View All Deals
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                router.push('/login');
              }}
              className="px-4 py-2 bg-dark-card-hover text-text-secondary rounded-md hover:text-white transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Top row - Summary cards */}
        <div className="mb-8">
          <DashboardCards />
        </div>

        {/* Middle row - Charts and metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <IrrMarketComparisonChart />
          </div>
          <div>
            <RiskGauge />
          </div>
        </div>

        {/* Bottom row - Status panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      </main>
    </div>
  );
}
