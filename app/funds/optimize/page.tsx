'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-shadcn';
import { useToast } from '@/contexts/ToastContext';
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle, Calendar, ArrowRight, Download, Home, RotateCw, DollarSign, Hammer, Info } from 'lucide-react';

// Define types
interface OptimizationConstraints {
  min_dscr: number;
  max_leverage: number;
}

interface OptimizationRequest {
  fund_id: string;
  target_horizon_years: number;
  constraints: OptimizationConstraints;
}

interface OptimizationResponse {
  run_id: string;
  status: string;
  message: string;
}

interface ActionDetails {
  refinance_amount?: number;
  sale_price?: number;
  capex_amount?: number;
}

interface OptimizerAction {
  id: string;
  asset_id: string;
  month: string;
  action_type: string;
  confidence_score: number;
  details?: ActionDetails;
}

interface OptimizationRun {
  id: string;
  fund_id: string;
  start_timestamp: string;
  horizon_months: number;
  optimized_irr: number | null;
  baseline_irr: number | null;
  status: string;
  actions: OptimizerAction[];
  constraints: {
    min_dscr: number;
    max_leverage: number;
  };
}

interface RecentRun {
  id: string;
  status: string;
  timestamp: Date;
}

export default function FundOptimizePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Form state
  const [fundId, setFundId] = useState<string>('123e4567-e89b-12d3-a456-426614174000');
  const [horizonYears, setHorizonYears] = useState<number>(5);
  const [minDscr, setMinDscr] = useState<number>(1.25);
  const [maxLeverage, setMaxLeverage] = useState<number>(0.75);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('timeline');

  // Data state
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [optimizationRun, setOptimizationRun] = useState<OptimizationRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);

  // Polling
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Format helpers
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Helper functions
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'running': return 'secondary';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getConfidenceBadgeVariant = (score: number): "default" | "destructive" | "outline" | "secondary" => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'hold': return <Home className="h-4 w-4" />;
      case 'refinance': return <RotateCw className="h-4 w-4" />;
      case 'sell': return <DollarSign className="h-4 w-4" />;
      case 'capex': return <Hammer className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (actionType: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (actionType) {
      case 'hold': return 'secondary';
      case 'refinance': return 'outline';
      case 'sell': return 'default';
      case 'capex': return 'destructive';
      default: return 'secondary';
    }
  };

  // Start optimization
  const startOptimization = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!fundId || isNaN(horizonYears) || isNaN(minDscr) || isNaN(maxLeverage)) {
      showToast('Please fill in all fields with valid values', 'error');
      return;
    }

    setIsLoading(true);
    setProgress(10);
    setStatusText('Starting optimization...');

    try {
      // Call API to start optimization
      const response = await fetch('https://cre-backend-0pvq.onrender.com/fund/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fund_id: fundId,
          target_horizon_years: horizonYears,
          constraints: {
            min_dscr: minDscr,
            max_leverage: maxLeverage
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start optimization');
      }

      const data: OptimizationResponse = await response.json();
      setCurrentRunId(data.run_id);

      // Add to recent runs
      const newRun: RecentRun = {
        id: data.run_id,
        status: data.status,
        timestamp: new Date()
      };

      setRecentRuns(prev => [newRun, ...prev.slice(0, 4)]);

      // Start polling for results
      startPolling(data.run_id);

      showToast('Optimization started successfully', 'success');

    } catch (error) {
      console.error('Error starting optimization:', error);
      setStatusText('Error starting optimization');
      setProgress(0);
      showToast('Failed to start optimization', 'error');
      setIsLoading(false);
    }
  };

  // Start polling for results
  const startPolling = (runId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set up polling
    const interval = setInterval(async () => {
      try {
        await fetchOptimizationResults(runId);
      } catch (error) {
        console.error('Error polling for results:', error);
        setStatusText('Error polling for results');
        showToast('Failed to fetch optimization results', 'error');
      }
    }, 2000);

    setPollingInterval(interval);
  };

  // Fetch optimization results
  const fetchOptimizationResults = async (runId: string) => {
    const response = await fetch(`https://cre-backend-0pvq.onrender.com/fund/optimize/${runId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch optimization results');
    }

    const data: OptimizationRun = await response.json();

    // Update recent runs
    setRecentRuns(prev =>
      prev.map(run =>
        run.id === runId ? { ...run, status: data.status } : run
      )
    );

    // Update UI based on status
    updateUIWithResults(data);

    // Stop polling if optimization is complete or failed
    if (data.status === 'completed' || data.status === 'failed') {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setIsLoading(false);
    }
  };

  // Update UI with results
  const updateUIWithResults = (data: OptimizationRun) => {
    setOptimizationRun(data);

    // Update progress bar and status text
    switch (data.status) {
      case 'pending':
        setProgress(10);
        setStatusText('Waiting to start...');
        break;
      case 'running':
        setProgress(50);
        setStatusText('Optimizing fund...');
        break;
      case 'completed':
        setProgress(100);
        setStatusText('Optimization complete!');
        break;
      case 'failed':
        setProgress(100);
        setStatusText('Optimization failed!');
        break;
    }
  };

  // Load a specific run
  const loadRun = (runId: string) => {
    setCurrentRunId(runId);
    setIsLoading(true);
    setProgress(50);
    setStatusText('Loading optimization results...');

    // Start polling for results
    startPolling(runId);
  };

  // Download CSV
  const downloadCSV = () => {
    if (!optimizationRun) return;

    // Create CSV content
    let csvContent = 'Month,Asset ID,Action Type,Confidence Score\n';

    optimizationRun.actions.forEach(action => {
      const month = formatDate(action.month);
      csvContent += `${month},${action.asset_id},${action.action_type},${action.confidence_score}\n`;
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fund-optimization-${optimizationRun.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Calculate IRR improvement
  const calculateIrrImprovement = (): string => {
    if (!optimizationRun || !optimizationRun.baseline_irr || !optimizationRun.optimized_irr) {
      return '-';
    }

    const improvement = ((optimizationRun.optimized_irr - optimizationRun.baseline_irr) / optimizationRun.baseline_irr);
    return '+' + formatPercent(improvement);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Fund Optimization</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Start Optimization Form */}
        <div className="lg:col-span-1">
          <Card className="bg-dark-card border-dark-border mb-6">
            <CardHeader>
              <CardTitle className="text-white">Start Optimization</CardTitle>
              <CardDescription className="text-text-secondary">
                Configure optimization parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={startOptimization} className="space-y-4">
                <div>
                  <label className="block mb-1 text-text-secondary">Fund ID</label>
                  <Input
                    value={fundId}
                    onChange={(e) => setFundId(e.target.value)}
                    className="bg-dark-card-hover border-dark-border text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-text-secondary">Target Horizon (Years)</label>
                  <Input
                    type="number"
                    value={horizonYears}
                    onChange={(e) => setHorizonYears(parseInt(e.target.value))}
                    min={1}
                    max={10}
                    className="bg-dark-card-hover border-dark-border text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-text-secondary">Min DSCR</label>
                  <Input
                    type="number"
                    value={minDscr}
                    onChange={(e) => setMinDscr(parseFloat(e.target.value))}
                    step={0.01}
                    min={1}
                    className="bg-dark-card-hover border-dark-border text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-text-secondary">Max Leverage</label>
                  <Input
                    type="number"
                    value={maxLeverage}
                    onChange={(e) => setMaxLeverage(parseFloat(e.target.value))}
                    step={0.01}
                    max={1}
                    className="bg-dark-card-hover border-dark-border text-white"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Optimize Fund
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Recent Optimizations</CardTitle>
              <CardDescription className="text-text-secondary">
                View previous optimization runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRuns.length === 0 ? (
                  <p className="text-text-secondary">No recent optimizations</p>
                ) : (
                  recentRuns.map(run => (
                    <div
                      key={run.id}
                      onClick={() => loadRun(run.id)}
                      className="bg-dark-card-hover rounded-lg p-3 flex justify-between items-center cursor-pointer hover:border border-accent/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{run.id.substring(0, 8)}...</p>
                        <p className="text-xs text-text-secondary">{run.timestamp.toLocaleString()}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(run.status)}>
                        {run.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {isLoading && (
            <Card className="bg-dark-card border-dark-border mb-6">
              <CardHeader>
                <CardTitle className="text-white">Optimization in Progress</CardTitle>
                <CardDescription className="text-text-secondary">
                  {statusText}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <Progress value={progress} className="w-full mb-4" />
                <p className="text-text-secondary">
                  {progress < 50
                    ? 'Your optimization is in the queue and will start shortly.'
                    : 'We are running thousands of simulations to find the optimal strategy for your fund.'}
                </p>
              </CardContent>
            </Card>
          )}

          {optimizationRun && (
            <>
              <Card className="bg-dark-card border-dark-border mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">Optimization Results</CardTitle>
                      <CardDescription className="text-text-secondary">
                        {new Date(optimizationRun.start_timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(optimizationRun.status)}>
                      {optimizationRun.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {optimizationRun.status === 'failed' && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {optimizationRun.status.charAt(0).toUpperCase() + optimizationRun.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-dark-card-hover rounded-lg p-4">
                      <p className="text-text-secondary text-sm">Baseline IRR</p>
                      <p className="text-white text-2xl font-medium">
                        {optimizationRun.baseline_irr ? formatPercent(optimizationRun.baseline_irr) : '-'}
                      </p>
                    </div>
                    <div className="bg-dark-card-hover rounded-lg p-4">
                      <p className="text-text-secondary text-sm">Optimized IRR</p>
                      <p className="text-accent text-2xl font-medium">
                        {optimizationRun.optimized_irr ? formatPercent(optimizationRun.optimized_irr) : '-'}
                      </p>
                    </div>
                    <div className="bg-dark-card-hover rounded-lg p-4">
                      <p className="text-text-secondary text-sm">Improvement</p>
                      <p className="text-green-400 text-2xl font-medium">
                        {calculateIrrImprovement()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-card-hover rounded-lg p-4">
                      <p className="text-text-secondary text-sm">Optimization Horizon</p>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-text-secondary" />
                        <p className="text-white">
                          {optimizationRun.horizon_months / 12} years ({optimizationRun.horizon_months} months)
                        </p>
                      </div>
                    </div>
                    <div className="bg-dark-card-hover rounded-lg p-4">
                      <p className="text-text-secondary text-sm">Constraints</p>
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-text-secondary" />
                        <p className="text-white">
                          Min DSCR: {optimizationRun.constraints.min_dscr},
                          Max Leverage: {optimizationRun.constraints.max_leverage}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {optimizationRun.status === 'completed' && (
                <Tabs defaultValue="timeline" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-dark-card-hover">
                    <TabsTrigger value="timeline">Action Timeline</TabsTrigger>
                    <TabsTrigger value="chart">IRR Projection</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="mt-4">
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <CardTitle className="text-white">Recommended Actions</CardTitle>
                        <CardDescription className="text-text-secondary">
                          Timeline of optimal actions to maximize fund IRR
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {optimizationRun.actions.length > 0 ? (
                          <div className="relative pl-8">
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-dark-border"></div>

                            {/* Group actions by month */}
                            {Object.entries(
                              optimizationRun.actions.reduce((acc, action) => {
                                const month = formatDate(action.month);
                                if (!acc[month]) acc[month] = [];
                                acc[month].push(action);
                                return acc;
                              }, {} as Record<string, OptimizerAction[]>)
                            ).map(([month, actions], index) => (
                              <div key={month} className="mb-8">
                                <div className="absolute left-3 w-3 h-3 bg-accent rounded-full transform -translate-x-1/2"></div>
                                <h3 className="text-lg font-bold mb-4 text-white">{month}</h3>

                                <div className="space-y-3">
                                  {actions.map(action => (
                                    <div key={action.id} className="bg-dark-card-hover rounded-lg p-4 border border-dark-border hover:border-accent/50 transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <Badge variant={getActionBadgeVariant(action.action_type)} className="mr-3">
                                            {getActionIcon(action.action_type)}
                                            <span className="ml-1 capitalize">{action.action_type}</span>
                                          </Badge>
                                          <span className="text-text-secondary">
                                            Asset {action.asset_id.substring(0, 8)}
                                          </span>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={`
                                            ${action.confidence_score >= 0.8 ? 'border-green-500 text-green-400' :
                                              action.confidence_score >= 0.6 ? 'border-yellow-500 text-yellow-400' :
                                              'border-red-500 text-red-400'}
                                          `}
                                        >
                                          {Math.round(action.confidence_score * 100)}% confidence
                                        </Badge>
                                      </div>

                                      {action.details && (
                                        <p className="mt-2 text-sm text-text-secondary">
                                          {action.action_type === 'refinance' && action.details.refinance_amount &&
                                            `Refinance amount: ${formatCurrency(action.details.refinance_amount)}`}
                                          {action.action_type === 'sell' && action.details.sale_price &&
                                            `Sale price: ${formatCurrency(action.details.sale_price)}`}
                                          {action.action_type === 'capex' && action.details.capex_amount &&
                                            `CapEx amount: ${formatCurrency(action.details.capex_amount)}`}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-text-secondary text-center py-8">
                            No actions recommended. The current strategy is optimal.
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button onClick={downloadCSV} variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Download CSV
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>

                  <TabsContent value="chart" className="mt-4">
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <CardTitle className="text-white">IRR Projection</CardTitle>
                        <CardDescription className="text-text-secondary">
                          Comparison of baseline vs. optimized IRR over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80 flex items-center justify-center">
                          <p className="text-text-secondary">
                            IRR chart visualization would be displayed here
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}

          {!isLoading && !optimizationRun && (
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Fund Optimization</CardTitle>
                <CardDescription className="text-text-secondary">
                  Optimize your fund performance
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-16 w-16 text-text-secondary mb-4" />
                <p className="text-text-secondary text-center mb-6">
                  Use AI simulation and reinforcement learning to generate a multi-year action plan to maximize fund IRR while maintaining DSCR above 1.25x.
                </p>
                <Button
                  onClick={() => document.getElementById('optimizationForm')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
                >
                  Start Optimization
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
