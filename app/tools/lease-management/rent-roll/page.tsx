'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, parseISO, differenceInMonths } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useToast } from '@/app/contexts/ToastContext';
import LeaseNavTabs from '@/app/components/lease-management/LeaseNavTabs';
import {
  BarChart2,
  FileText,
  DollarSign,
  Calendar,
  PieChart,
} from 'lucide-react';
import {
  getAllLeases,
  updateLeaseStatus,
  calculateRentForDate,
  Lease,
  mockLeases
} from '@/app/lib/mock-leases';
import { formatCurrency } from '@/app/lib/utils/format';
import NewLeaseForm from '@/app/components/lease-management/NewLeaseForm';
import {
  getRentRollSummary,
  getPropertyTypeDistribution,
  getLeaseExpirationTimeline,
  getTenantConcentration,
  RentRollSummary,
  PropertyTypeDistribution,
  LeaseExpirationTimeline,
  TenantConcentration
} from '@/app/lib/api/rent-roll';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// Helper function to prepare property type distribution data
const preparePropertyTypeData = (leases: Lease[], totalRent: number) => {
  const propertyTypes = ['Office', 'Retail', 'Industrial', 'Multifamily', 'Mixed-Use'];

  return propertyTypes.map(type => {
    const typeLeases = leases.filter(l => l.status === 'Active' && l.leaseType === type);
    const typeRent = typeLeases.reduce((sum, lease) => sum + lease.baseRent, 0);
    const percentage = totalRent > 0 ? (typeRent / totalRent) * 100 : 0;

    return {
      name: type,
      value: typeRent,
      percentage: percentage.toFixed(1),
      count: typeLeases.length
    };
  }).filter(item => item.value > 0);
};

// Helper function to prepare lease expiration data
const prepareExpirationData = (leases: Lease[]) => {
  const now = new Date();
  const activeLeases = leases.filter(lease => lease.status === 'Active');

  // Group leases by expiration year and quarter
  const expirationMap = new Map();

  activeLeases.forEach(lease => {
    const expirationDate = new Date(lease.endDate);
    const year = expirationDate.getFullYear();
    const quarter = Math.floor(expirationDate.getMonth() / 3) + 1;
    const period = `${year} Q${quarter}`;

    if (!expirationMap.has(period)) {
      expirationMap.set(period, {
        period,
        year,
        quarter,
        count: 0,
        rent: 0,
        area: 0,
        timestamp: expirationDate.getTime()
      });
    }

    const data = expirationMap.get(period);
    data.count += 1;
    data.rent += lease.baseRent;
    data.area += lease.leaseArea;
  });

  // Convert map to array and sort by date
  return Array.from(expirationMap.values())
    .sort((a, b) => a.timestamp - b.timestamp);
};

// Helper function to prepare tenant concentration data
const prepareTenantConcentrationData = (leases: Lease[], totalRent: number) => {
  const activeLeases = leases.filter(lease => lease.status === 'Active');

  // Group by tenant
  const tenantMap = new Map();

  activeLeases.forEach(lease => {
    if (!tenantMap.has(lease.tenantId)) {
      tenantMap.set(lease.tenantId, {
        id: lease.tenantId,
        name: lease.tenantName,
        rent: 0,
        percentage: 0
      });
    }

    const data = tenantMap.get(lease.tenantId);
    data.rent += lease.baseRent;
  });

  // Calculate percentages and sort by rent (descending)
  const tenants = Array.from(tenantMap.values())
    .map(tenant => ({
      ...tenant,
      percentage: totalRent > 0 ? (tenant.rent / totalRent) * 100 : 0
    }))
    .sort((a, b) => b.rent - a.rent);

  // Take top 5 tenants and group the rest as "Others"
  const topTenants = tenants.slice(0, 5);

  if (tenants.length > 5) {
    const otherTenants = tenants.slice(5);
    const otherRent = otherTenants.reduce((sum, tenant) => sum + tenant.rent, 0);
    const otherPercentage = totalRent > 0 ? (otherRent / totalRent) * 100 : 0;

    topTenants.push({
      id: 'others',
      name: 'Others',
      rent: otherRent,
      percentage: otherPercentage
    });
  }

  return topTenants;
};

export default function RentRollPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // State for leases and metrics
  const [leases, setLeases] = useState<Lease[]>([]);
  const [totalMonthlyRent, setTotalMonthlyRent] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isNewLeaseModalOpen, setIsNewLeaseModalOpen] = useState(false);

  // State for chart data
  const [propertyTypeData, setPropertyTypeData] = useState<any[]>([]);
  const [expirationData, setExpirationData] = useState<any[]>([]);
  const [tenantConcentrationData, setTenantConcentrationData] = useState<any[]>([]);

  // Mock assets for demo
  const [assets, setAssets] = useState([
    { id: 'asset1', name: 'Office Building A' },
    { id: 'asset2', name: 'Retail Center B' },
    { id: 'asset3', name: 'Industrial Park C' }
  ]);

  // Load leases and calculate metrics on component mount
  useEffect(() => {
    loadLeases();
  }, []);

  // Load all leases and update their status
  const loadLeases = async () => {
    try {
      setLoading(true);
      console.log('Loading rent roll data...');

      // Fetch data from API or use mock data
      console.log('Fetching data...');
      const [
        summary,
        propertyTypes,
        expirations,
        tenantConcentration,
      ] = await Promise.all([
        getRentRollSummary(),
        getPropertyTypeDistribution(),
        getLeaseExpirationTimeline(),
        getTenantConcentration(),
      ]);

      console.log('Data received:');
      console.log('Summary:', summary);
      console.log('Property Types:', propertyTypes);
      console.log('Expirations:', expirations);
      console.log('Tenant Concentration:', tenantConcentration);

      // Use the mock data directly from the imported mockLeases for the table
      const allLeases = mockLeases;
      const updatedLeases = allLeases.map(lease => updateLeaseStatus(lease));

      // Update state with data
      setLeases(updatedLeases);
      setTotalMonthlyRent(summary.total_monthly_rent);
      setPropertyTypeData(propertyTypes);
      setExpirationData(expirations);
      setTenantConcentrationData(tenantConcentration);

      console.log('State updated with data');

      // Only show success toast if we're not in development mode
      if (process.env.NODE_ENV !== 'development') {
        showToast({
          title: 'Success',
          description: 'Data loaded successfully.',
          variant: 'success'
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);

      // Fallback to mock data if something goes wrong
      console.log('Falling back to mock data...');
      const allLeases = mockLeases;
      const updatedLeases = allLeases.map(lease => updateLeaseStatus(lease));

      // Calculate total monthly rent
      const now = new Date();
      const activeLeases = updatedLeases.filter(lease => lease.status === 'Active');
      const totalRent = activeLeases.reduce((sum, lease) => sum + calculateRentForDate(lease, now), 0);

      // Prepare data for charts
      const propertyTypes = preparePropertyTypeData(updatedLeases, totalRent);
      const expirations = prepareExpirationData(updatedLeases);
      const tenantConcentration = prepareTenantConcentrationData(updatedLeases, totalRent);

      // Update state with mock data
      setLeases(updatedLeases);
      setTotalMonthlyRent(totalRent);
      setPropertyTypeData(propertyTypes);
      setExpirationData(expirations);
      setTenantConcentrationData(tenantConcentration);

      console.log('State updated with mock data');
      showToast({
        title: 'Warning',
        description: 'Using mock data. An error occurred while loading data.',
        variant: 'warning'
      });

      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get days until expiration
  const getDaysUntilExpiration = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get badge variant based on days until expiration
  const getExpirationBadgeVariant = (days: number): "default" | "destructive" | "outline" | "secondary" => {
    if (days <= 30) return 'destructive';
    if (days <= 90) return 'secondary';
    return 'outline';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Rent Roll</h1>
        <Button
          className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
          onClick={() => setIsNewLeaseModalOpen(true)}
        >
          Add New Lease
        </Button>
      </div>

      <LeaseNavTabs />

      {/* New Lease Modal */}
      <NewLeaseForm
        isOpen={isNewLeaseModalOpen}
        onClose={() => setIsNewLeaseModalOpen(false)}
        onSuccess={loadLeases}
        assets={assets}
      />

      <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-black dark:text-white">Rent Roll</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Visualize your rental income</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300">
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : leases.filter(l => l.status === 'Active').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BarChart2 className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No active leases to display</p>
              <Button className="mt-2 bg-[#00F0B4] hover:bg-[#00D0A0] text-black" onClick={() => router.push('/tools/lease-management')}>
                Add Leases
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Monthly Rent by Property Type */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-black dark:text-white">Monthly Rent by Property Type</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={propertyTypeData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis
                        dataKey="name"
                        className="text-xs fill-gray-700 dark:fill-gray-300"
                      />
                      <YAxis
                        className="text-xs fill-gray-700 dark:fill-gray-300"
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${formatCurrency(value)}`, 'Monthly Rent']}
                        labelFormatter={(label) => `${label} Properties`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          color: '#333',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Monthly Rent"
                        fill="#00F0B4"
                        radius={[4, 4, 0, 0]}
                        label={{
                          position: 'top',
                          formatter: (entry: any) => `${typeof entry.percentage === 'number' ? entry.percentage.toFixed(1) : '0'}%`,
                          className: 'text-xs fill-gray-600 dark:fill-gray-400',
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Property Type Stats */}
                <div className="grid grid-cols-5 gap-4 mt-4">
                  {propertyTypeData.map((item, index) => (
                    <div key={item.name} className="bg-gray-50 dark:bg-[#22272E] p-3 rounded-md">
                      <div className="flex items-center mb-1">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <div className="text-sm font-bold text-black dark:text-white">{formatCurrency(item.value)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.count} leases ({item.percentage}%)</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lease Expiration Timeline */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-black dark:text-white">Lease Expiration Timeline</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={expirationData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis
                        dataKey="period"
                        className="text-xs fill-gray-700 dark:fill-gray-300"
                      />
                      <YAxis
                        yAxisId="left"
                        className="text-xs fill-gray-700 dark:fill-gray-300"
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-xs fill-gray-700 dark:fill-gray-300"
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'rent') return [`${formatCurrency(value)}`, 'Monthly Rent'];
                          if (name === 'count') return [`${value}`, 'Number of Leases'];
                          if (name === 'area') return [`${value.toLocaleString()} sq ft`, 'Total Area'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Expiring in ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          color: '#333',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="rent"
                        name="Monthly Rent"
                        stroke="#00F0B4"
                        fill="#00F0B4"
                        fillOpacity={0.3}
                        yAxisId="left"
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Number of Leases"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        yAxisId="right"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Expiration Summary */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-[#22272E] p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upcoming Expirations (Next 12 Months)</h4>
                    <div className="space-y-2">
                      {expirationData
                        .filter(item => {
                          const expirationDate = new Date();
                          expirationDate.setFullYear(item.year);
                          expirationDate.setMonth((item.quarter - 1) * 3);
                          const oneYearFromNow = new Date();
                          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                          return expirationDate <= oneYearFromNow;
                        })
                        .map(item => (
                          <div key={item.period} className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-medium text-black dark:text-white">{item.period}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.count} leases)</span>
                            </div>
                            <div className="text-sm font-bold text-black dark:text-white">{formatCurrency(item.rent)}</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#22272E] p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expiration Risk Analysis</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">High Risk (Next 90 Days)</span>
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(
                              expirationData
                                .filter(item => {
                                  const expirationDate = new Date();
                                  expirationDate.setFullYear(item.year);
                                  expirationDate.setMonth((item.quarter - 1) * 3);
                                  const ninetyDaysFromNow = new Date();
                                  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
                                  return expirationDate <= ninetyDaysFromNow;
                                })
                                .reduce((sum, item) => sum + item.rent, 0)
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Medium Risk (3-6 Months)</span>
                          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            {formatCurrency(
                              expirationData
                                .filter(item => {
                                  const expirationDate = new Date();
                                  expirationDate.setFullYear(item.year);
                                  expirationDate.setMonth((item.quarter - 1) * 3);
                                  const ninetyDaysFromNow = new Date();
                                  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
                                  const sixMonthsFromNow = new Date();
                                  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
                                  return expirationDate > ninetyDaysFromNow && expirationDate <= sixMonthsFromNow;
                                })
                                .reduce((sum, item) => sum + item.rent, 0)
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Low Risk (6-12 Months)</span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(
                              expirationData
                                .filter(item => {
                                  const expirationDate = new Date();
                                  expirationDate.setFullYear(item.year);
                                  expirationDate.setMonth((item.quarter - 1) * 3);
                                  const sixMonthsFromNow = new Date();
                                  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
                                  const oneYearFromNow = new Date();
                                  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                                  return expirationDate > sixMonthsFromNow && expirationDate <= oneYearFromNow;
                                })
                                .reduce((sum, item) => sum + item.rent, 0)
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Concentration Chart */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-black dark:text-white">Tenant Concentration</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={tenantConcentrationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="rent"
                          nameKey="name"
                          label={(entry) => `${entry.name}: ${typeof entry.percentage === 'number' ? entry.percentage.toFixed(1) : '0'}%`}
                        >
                          {tenantConcentrationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`${formatCurrency(value)}`, 'Monthly Rent']}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            color: '#333',
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col justify-center">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Top Tenants by Monthly Rent</h4>
                    <div className="space-y-3">
                      {tenantConcentrationData.map((tenant, index) => (
                        <div key={tenant.id} className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-black dark:text-white">
                                {tenant.name}
                              </span>
                              <span className="text-sm font-bold text-black dark:text-white">
                                {formatCurrency(tenant.rent)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${tenant.percentage}%`,
                                  backgroundColor: COLORS[index % COLORS.length]
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                              {typeof tenant.percentage === 'number' ? tenant.percentage.toFixed(1) : '0'}% of total rent
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 dark:bg-[#22272E] rounded-md">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Concentration Risk</h5>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Top tenant</span>
                        <span className="font-medium text-black dark:text-white">
                          {tenantConcentrationData.length > 0 ?
                            `${typeof tenantConcentrationData[0].percentage === 'number' ? tenantConcentrationData[0].percentage.toFixed(1) : '0'}%` :
                            '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600 dark:text-gray-400">Top 3 tenants</span>
                        <span className="font-medium text-black dark:text-white">
                          {tenantConcentrationData.length > 0 ?
                            `${tenantConcentrationData.slice(0, 3)
                              .reduce((sum, t) => sum + (typeof t.percentage === 'number' ? t.percentage : 0), 0)
                              .toFixed(1)}%` :
                            '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rent Roll Table */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-black dark:text-white">Detailed Rent Roll</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-[#2F374A]">
                        <th className="text-left py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Property</th>
                        <th className="text-left py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Tenant</th>
                        <th className="text-left py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Type</th>
                        <th className="text-right py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Area (sq ft)</th>
                        <th className="text-right py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Base Rent</th>
                        <th className="text-right py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">$/sq ft/yr</th>
                        <th className="text-right py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Escalation</th>
                        <th className="text-right py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Expiration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leases
                        .filter(l => l.status === 'Active')
                        .sort((a, b) => a.assetName.localeCompare(b.assetName))
                        .map(lease => (
                          <tr
                            key={lease.id}
                            className="border-b border-gray-200 dark:border-[#2F374A] hover:bg-gray-50 dark:hover:bg-[#22272E] cursor-pointer"
                            onClick={() => router.push(`/tools/lease-management/${lease.id}`)}
                          >
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{lease.assetName}</td>
                            <td
                              className="py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const tenant = getAllLeases().find(t => t.id === lease.tenantId);
                                if (tenant) {
                                  router.push(`/tools/lease-management/tenants/${tenant.id}`);
                                }
                              }}
                            >
                              {lease.tenantName}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-gray-100 dark:bg-[#22272E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2F374A]">
                                {lease.leaseType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{lease.leaseArea.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-medium text-black dark:text-white">{formatCurrency(lease.baseRent)}</td>
                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{formatCurrency((lease.baseRent * 12) / lease.leaseArea)}</td>
                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{lease.rentEscalation}%</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end">
                                <span className="mr-2 text-gray-700 dark:text-gray-300">{formatDate(lease.endDate)}</span>
                                <Badge
                                  variant={getExpirationBadgeVariant(getDaysUntilExpiration(lease.endDate))}
                                  className={
                                    getDaysUntilExpiration(lease.endDate) <= 30 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                                    getDaysUntilExpiration(lease.endDate) <= 90 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                    'bg-gray-100 dark:bg-[#22272E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2F374A]'
                                  }
                                >
                                  {getDaysUntilExpiration(lease.endDate)}d
                                </Badge>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-[#22272E]">
                        <td className="py-3 px-4 font-medium text-black dark:text-white" colSpan={4}>Total</td>
                        <td className="py-3 px-4 text-right font-medium text-black dark:text-white">{formatCurrency(totalMonthlyRent)}</td>
                        <td className="py-3 px-4 text-right font-medium text-black dark:text-white">
                          {formatCurrency(
                            (leases.filter(l => l.status === 'Active').reduce((sum, lease) => sum + ((lease.baseRent * 12) / lease.leaseArea), 0)) /
                            (leases.filter(l => l.status === 'Active').length || 1)
                          )}
                        </td>
                        <td className="py-3 px-4" colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
