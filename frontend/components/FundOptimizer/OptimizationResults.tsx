import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Download, RefreshCw, AlertTriangle, CheckCircle, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '../ui/use-toast';
import ActionTimeline from './ActionTimeline';
import IRRChart from './IRRChart';
import { format } from 'date-fns';

interface OptimizationResultsProps {
  fundId: string;
  runId: string;
}

interface OptimizationRun {
  id: string;
  fund_id: string;
  start_timestamp: string;
  horizon_months: number;
  optimized_irr: number | null;
  baseline_irr: number | null;
  status: string;
  actions: OptimizationAction[];
  constraints: {
    min_dscr: number;
    max_leverage: number;
  };
}

interface OptimizationAction {
  id: string;
  asset_id: string;
  month: string;
  action_type: string;
  confidence_score: number;
  details?: any;
}

export default function OptimizationResults({ fundId, runId }: OptimizationResultsProps) {
  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const { toast } = useToast();
  const router = useRouter();

  // Polling interval in milliseconds
  const POLLING_INTERVAL = 5000;

  // Fetch optimization run data
  const fetchRunData = async () => {
    try {
      const response = await api.get(`/fund/optimize/${runId}`);
      setRun(response.data);
      setError(null);
      
      // If the run is still in progress, continue polling
      if (response.data.status === 'pending' || response.data.status === 'running') {
        setTimeout(fetchRunData, POLLING_INTERVAL);
      }
    } catch (err) {
      console.error('Error fetching optimization run:', err);
      setError('Failed to load optimization results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRunData();
  }, [runId]);

  // Handle refresh button click
  const handleRefresh = () => {
    setLoading(true);
    fetchRunData();
  };

  // Handle download CSV
  const handleDownloadCSV = () => {
    if (!run) return;
    
    // Create CSV content
    let csvContent = 'Month,Asset ID,Action Type,Confidence Score\n';
    
    run.actions.forEach(action => {
      const month = format(new Date(action.month), 'yyyy-MM');
      csvContent += `${month},${action.asset_id},${action.action_type},${action.confidence_score}\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fund-optimization-${runId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render loading state
  if (loading && !run) {
    return (
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Fund Optimization</CardTitle>
          <CardDescription className="text-text-secondary">
            Loading optimization results...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Progress value={100} className="w-full max-w-md mb-4" />
          <p className="text-text-secondary">Please wait while we load the optimization results...</p>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Fund Optimization</CardTitle>
          <CardDescription className="text-text-secondary">
            Error loading results
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render pending or running state
  if (run && (run.status === 'pending' || run.status === 'running')) {
    return (
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Fund Optimization in Progress</CardTitle>
          <CardDescription className="text-text-secondary">
            {run.status === 'pending' ? 'Waiting to start...' : 'Optimizing your fund...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Progress value={run.status === 'running' ? 50 : 10} className="w-full max-w-md mb-4" />
          <p className="text-text-secondary mb-6">
            {run.status === 'pending' 
              ? 'Your optimization is in the queue and will start shortly.' 
              : 'We are running thousands of simulations to find the optimal strategy for your fund.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
            <div className="bg-dark-card-hover rounded-lg p-4">
              <p className="text-text-secondary text-sm">Target Horizon</p>
              <p className="text-white text-lg font-medium">{run.horizon_months / 12} years</p>
            </div>
            <div className="bg-dark-card-hover rounded-lg p-4">
              <p className="text-text-secondary text-sm">Min DSCR</p>
              <p className="text-white text-lg font-medium">{run.constraints.min_dscr}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render failed state
  if (run && run.status === 'failed') {
    return (
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Fund Optimization Failed</CardTitle>
          <CardDescription className="text-text-secondary">
            The optimization process encountered an error
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-text-secondary mb-4">
            We were unable to complete the optimization process. This could be due to a server error or invalid fund data.
          </p>
          <Button 
            onClick={() => router.push(`/funds/${fundId}`)}
            className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Return to Fund
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render completed state
  if (run && run.status === 'completed') {
    // Calculate IRR improvement
    const irrImprovement = run.optimized_irr && run.baseline_irr
      ? ((run.optimized_irr - run.baseline_irr) / run.baseline_irr) * 100
      : 0;
    
    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="bg-dark-card border-dark-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Fund Optimization Results</CardTitle>
                <CardDescription className="text-text-secondary">
                  {format(new Date(run.start_timestamp), 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              <Badge 
                variant="default" 
                className="bg-green-900/30 text-green-400 px-3 py-1"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-dark-card-hover rounded-lg p-4">
                <p className="text-text-secondary text-sm">Baseline IRR</p>
                <p className="text-white text-2xl font-medium">
                  {run.baseline_irr ? (run.baseline_irr * 100).toFixed(2) : '0.00'}%
                </p>
              </div>
              <div className="bg-dark-card-hover rounded-lg p-4">
                <p className="text-text-secondary text-sm">Optimized IRR</p>
                <p className="text-accent text-2xl font-medium">
                  {run.optimized_irr ? (run.optimized_irr * 100).toFixed(2) : '0.00'}%
                </p>
              </div>
              <div className="bg-dark-card-hover rounded-lg p-4">
                <p className="text-text-secondary text-sm">Improvement</p>
                <p className="text-green-400 text-2xl font-medium">
                  +{irrImprovement.toFixed(2)}%
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-dark-card-hover rounded-lg p-4">
                <p className="text-text-secondary text-sm">Optimization Horizon</p>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-text-secondary" />
                  <p className="text-white">{run.horizon_months / 12} years ({run.horizon_months} months)</p>
                </div>
              </div>
              <div className="bg-dark-card-hover rounded-lg p-4">
                <p className="text-text-secondary text-sm">Constraints</p>
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-text-secondary" />
                  <p className="text-white">Min DSCR: {run.constraints.min_dscr}, Max Leverage: {run.constraints.max_leverage}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for Timeline and Chart */}
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
                {run.actions.length > 0 ? (
                  <ActionTimeline actions={run.actions} />
                ) : (
                  <p className="text-text-secondary text-center py-8">No actions recommended. The current strategy is optimal.</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleDownloadCSV} variant="outline">
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
                <div className="h-80">
                  <IRRChart 
                    baselineIRR={run.baseline_irr || 0} 
                    optimizedIRR={run.optimized_irr || 0} 
                    horizonMonths={run.horizon_months} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Fallback
  return null;
}
