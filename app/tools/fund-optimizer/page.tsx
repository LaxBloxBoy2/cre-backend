'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs-shadcn';
import { useToast } from '../../contexts/ToastContext';
import {
  TrendingUp, RefreshCw, AlertTriangle, CheckCircle, Calendar, ArrowRight,
  Download, Home, RotateCw, DollarSign, Hammer, Info, MapPin, Building,
  BarChart3, PieChart, LineChart
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { mockFunds, getFundById, getAllFunds, Fund, FundAsset } from '../../lib/mock-funds';

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

export default function FundOptimizerPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);

  // Form state
  const [selectedFundId, setSelectedFundId] = useState<string>(mockFunds[0].id);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(mockFunds[0]);
  const [horizonYears, setHorizonYears] = useState<number>(5);
  const [minDscr, setMinDscr] = useState<number>(1.25);
  const [maxLeverage, setMaxLeverage] = useState<number>(0.75);

  // Check for fundId in URL query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fundId = params.get('fundId');

      if (fundId) {
        const fund = getFundById(fundId);
        if (fund) {
          setSelectedFundId(fundId);
          setSelectedFund(fund);
        }
      }
    }
  }, []);

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

  // Update selected fund when fund ID changes
  useEffect(() => {
    const fund = getFundById(selectedFundId);
    setSelectedFund(fund || null);
  }, [selectedFundId]);

  // Initialize Google Maps when component mounts and when optimization results change
  useEffect(() => {
    if (mapRef.current && selectedFund && !isLoading && !optimizationRun) {
      // This would normally load a Google Map with the fund's assets
      // For this demo, we're just setting up a placeholder
      const mapElement = mapRef.current;
      mapElement.innerHTML = '<div class="flex items-center justify-center h-full bg-card-hover rounded-lg"><p class="text-muted-foreground">Map would display here with fund assets</p></div>';
    }
  }, [selectedFund, isLoading, optimizationRun]);

  // Start optimization
  const startOptimization = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!selectedFundId || isNaN(horizonYears) || isNaN(minDscr) || isNaN(maxLeverage)) {
      showToast('Please select a fund and fill in all fields with valid values', 'error');
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
          fund_id: selectedFundId,
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp className="inline-block mr-2 h-6 w-6" style={{ color: 'var(--accent)' }} />
          Fund Optimizer
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Start Optimization Form */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Start Optimization</CardTitle>
              <CardDescription>
                Configure optimization parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={startOptimization} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Select Fund</label>
                  <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a fund" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllFunds().map(fund => (
                        <SelectItem key={fund.id} value={fund.id}>
                          {fund.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFund && (
                  <div className="bg-card-hover rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Assets:</span>
                      <span className="font-medium">{selectedFund.totalAssets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current IRR:</span>
                      <span className="font-medium">{(selectedFund.currentIRR * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Target IRR:</span>
                      <span className="font-medium">{(selectedFund.targetIRR * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Value:</span>
                      <span className="font-medium">${(selectedFund.totalValue).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block mb-1 text-sm font-medium">Target Horizon (Years)</label>
                  <Input
                    type="number"
                    value={horizonYears}
                    onChange={(e) => setHorizonYears(parseInt(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Min DSCR</label>
                  <Input
                    type="number"
                    value={minDscr}
                    onChange={(e) => setMinDscr(parseFloat(e.target.value))}
                    step={0.01}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Max Leverage</label>
                  <Input
                    type="number"
                    value={maxLeverage}
                    onChange={(e) => setMaxLeverage(parseFloat(e.target.value))}
                    step={0.01}
                    max={1}
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Optimizations</CardTitle>
              <CardDescription>
                View previous optimization runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRuns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent optimizations</p>
                ) : (
                  recentRuns.map(run => (
                    <div
                      key={run.id}
                      onClick={() => loadRun(run.id)}
                      className="bg-card-hover rounded-lg p-3 flex justify-between items-center cursor-pointer hover:border border-accent/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{run.id.substring(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">{run.timestamp.toLocaleString()}</p>
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
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Optimization in Progress</CardTitle>
                <CardDescription>
                  {statusText}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <Progress value={progress} className="w-full mb-4" />
                <p className="text-sm text-muted-foreground">
                  {progress < 50
                    ? 'Your optimization is in the queue and will start shortly.'
                    : 'We are running thousands of simulations to find the optimal strategy for your fund.'}
                </p>
              </CardContent>
            </Card>
          )}

          {optimizationRun && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Optimization Results</CardTitle>
                      <CardDescription>
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
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Baseline IRR</p>
                      <p className="text-2xl font-medium">
                        {optimizationRun.baseline_irr ? formatPercent(optimizationRun.baseline_irr) : '-'}
                      </p>
                    </div>
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Optimized IRR</p>
                      <p className="text-2xl font-medium text-accent">
                        {optimizationRun.optimized_irr ? formatPercent(optimizationRun.optimized_irr) : '-'}
                      </p>
                    </div>
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Improvement</p>
                      <p className="text-2xl font-medium text-green-400">
                        {calculateIrrImprovement()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Optimization Horizon</p>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                        <p>
                          {optimizationRun.horizon_months / 12} years ({optimizationRun.horizon_months} months)
                        </p>
                      </div>
                    </div>
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Constraints</p>
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-muted-foreground" />
                        <p>
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
                  <TabsList>
                    <TabsTrigger value="timeline">Action Timeline</TabsTrigger>
                    <TabsTrigger value="chart">IRR Projection</TabsTrigger>
                    <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                    <TabsTrigger value="map">Geographic View</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Actions</CardTitle>
                        <CardDescription>
                          Timeline of optimal actions to maximize fund IRR
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {optimizationRun.actions.length > 0 ? (
                          <div className="relative pl-8">
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border"></div>

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
                                <h3 className="text-lg font-bold mb-4">{month}</h3>

                                <div className="space-y-3">
                                  {actions.map(action => (
                                    <div key={action.id} className="bg-card-hover rounded-lg p-4 border border-border hover:border-accent/50 transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <Badge variant={getActionBadgeVariant(action.action_type)} className="mr-3">
                                            {getActionIcon(action.action_type)}
                                            <span className="ml-1 capitalize">{action.action_type}</span>
                                          </Badge>
                                          {/* Find the actual asset name from the fund */}
                                          {selectedFund && selectedFund.assets.find(asset => asset.id === action.asset_id) ? (
                                            <div>
                                              <span className="font-medium">
                                                {selectedFund.assets.find(asset => asset.id === action.asset_id)?.name}
                                              </span>
                                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                <span>{selectedFund.assets.find(asset => asset.id === action.asset_id)?.location}</span>
                                              </div>
                                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <Building className="h-3 w-3 mr-1" />
                                                <span>{selectedFund.assets.find(asset => asset.id === action.asset_id)?.propertyType}</span>
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">
                                              Asset {action.asset_id.substring(0, 8)}
                                            </span>
                                          )}
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
                                        <div className="mt-2 space-y-1">
                                          {action.action_type === 'refinance' && action.details.refinance_amount && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Refinance amount:</span>
                                              <span className="font-medium">{formatCurrency(action.details.refinance_amount)}</span>
                                            </div>
                                          )}
                                          {action.action_type === 'sell' && action.details.sale_price && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Sale price:</span>
                                              <span className="font-medium">{formatCurrency(action.details.sale_price)}</span>
                                            </div>
                                          )}
                                          {action.action_type === 'capex' && action.details.capex_amount && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">CapEx amount:</span>
                                              <span className="font-medium">{formatCurrency(action.details.capex_amount)}</span>
                                            </div>
                                          )}

                                          {/* Add current value for context */}
                                          {selectedFund && selectedFund.assets.find(asset => asset.id === action.asset_id) && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Current value:</span>
                                              <span className="font-medium">
                                                ${selectedFund.assets.find(asset => asset.id === action.asset_id)?.value.toLocaleString()}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-8 text-muted-foreground">
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
                    <Card>
                      <CardHeader>
                        <CardTitle>IRR Projection</CardTitle>
                        <CardDescription>
                          Comparison of baseline vs. optimized IRR over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80 bg-card-hover rounded-lg p-4 flex flex-col">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="font-medium">Fund IRR Projection</h3>
                              <p className="text-sm text-muted-foreground">5-year horizon</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                                <span className="text-sm">Baseline</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                                <span className="text-sm">Optimized</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex items-center justify-center">
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-muted-foreground">
                                IRR chart visualization would be displayed here
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="cashflow" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Cash Flow Projection</CardTitle>
                        <CardDescription>
                          Comparison of baseline vs. optimized cash flows
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80 bg-card-hover rounded-lg p-4 flex flex-col">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="font-medium">Monthly Cash Flow</h3>
                              <p className="text-sm text-muted-foreground">5-year projection</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                                <span className="text-sm">Baseline</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                                <span className="text-sm">Optimized</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex items-center justify-center">
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-muted-foreground">
                                Cash flow chart visualization would be displayed here
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-card rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Cumulative Cash Flow (Baseline)</p>
                              <p className="text-xl font-medium">$12,450,000</p>
                            </div>
                            <div className="bg-card rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Cumulative Cash Flow (Optimized)</p>
                              <p className="text-xl font-medium text-green-400">$14,820,000</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="map" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Geographic Distribution</CardTitle>
                        <CardDescription>
                          Map view of fund assets and recommended actions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80 bg-card-hover rounded-lg border border-border flex items-center justify-center">
                          <p className="text-muted-foreground">
                            Geographic map visualization would be displayed here
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          {selectedFund && selectedFund.assets.map(asset => (
                            <div key={asset.id} className="bg-card rounded-lg p-3 border border-border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{asset.name}</h4>
                                  <p className="text-xs text-muted-foreground">{asset.location}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {asset.propertyType}
                                </Badge>
                              </div>

                              {/* Show recommended action if any */}
                              {optimizationRun.actions.find(action => action.asset_id === asset.id) && (
                                <div className="mt-2 pt-2 border-t border-border">
                                  <p className="text-xs text-muted-foreground">Recommended Action:</p>
                                  <div className="flex items-center mt-1">
                                    <Badge variant={getActionBadgeVariant(
                                      optimizationRun.actions.find(action => action.asset_id === asset.id)?.action_type || 'hold'
                                    )} className="text-xs">
                                      {getActionIcon(optimizationRun.actions.find(action => action.asset_id === asset.id)?.action_type || 'hold')}
                                      <span className="ml-1 capitalize">
                                        {optimizationRun.actions.find(action => action.asset_id === asset.id)?.action_type || 'hold'}
                                      </span>
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}

          {!isLoading && !optimizationRun && selectedFund && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Fund Overview</CardTitle>
                  <CardDescription>
                    {selectedFund.name} - {selectedFund.totalAssets} assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Fund Performance</h3>
                      <div className="space-y-4">
                        <div className="bg-card-hover rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Current IRR</span>
                            <span className="text-lg font-medium">{(selectedFund.currentIRR * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className="bg-accent h-2.5 rounded-full"
                              style={{ width: `${(selectedFund.currentIRR / selectedFund.targetIRR) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">0%</span>
                            <span className="text-xs text-muted-foreground">Target: {(selectedFund.targetIRR * 100).toFixed(2)}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-card-hover rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Total Value</p>
                            <p className="text-xl font-medium">${selectedFund.totalValue.toLocaleString()}</p>
                          </div>
                          <div className="bg-card-hover rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Assets</p>
                            <p className="text-xl font-medium">{selectedFund.totalAssets}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Geographic Distribution</h3>
                      <div
                        ref={mapRef}
                        className="h-[200px] rounded-lg border border-border"
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fund Assets</CardTitle>
                  <CardDescription>
                    Properties in {selectedFund.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedFund.assets.map(asset => (
                      <div key={asset.id} className="bg-card-hover rounded-lg p-4 border border-border hover:border-accent/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{asset.name}</h4>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{asset.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Building className="h-3 w-3 mr-1" />
                              <span>{asset.propertyType}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${asset.value.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Cap Rate: {(asset.capRate * 100).toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">NOI: ${asset.noi.toLocaleString()}/yr</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
