'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getScenarios, createScenario, deleteScenario } from '../../../lib/api';
import { useToast } from '../../../contexts/ToastContext';
import { formatCurrency, formatPercentage } from '../../../lib/utils';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  DarkCard
} from '../../../components/ui';

// Types
interface Scenario {
  id: string;
  deal_id: string;
  name: string;
  var_changed: string;
  delta: number;
  irr: number | null;
  cashflow_json: any;
  created_at: string;
}

interface ScenarioCreate {
  var: string;
  delta: number;
  name?: string;
}

interface CashflowYear {
  year: number;
  noi: number;
  debt_service: number;
  free_cash: number;
  cumulative: number;
}

interface CashflowData {
  yearly: CashflowYear[];
  exit_value: number;
  exit_proceeds: number;
  final_cash: number;
}

export default function ScenariosPage() {
  const params = useParams();
  const dealId = params.id as string;
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // State for form
  const [varChanged, setVarChanged] = useState<string>('interest');
  const [delta, setDelta] = useState<string>('0.5');
  const [name, setName] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Analyst');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch user role
  useEffect(() => {
    // In a real app, we would get the user role from the JWT token
    // For now, we'll just use a mock role
    setUserRole('Analyst');
  }, []);

  // Fetch scenarios
  const {
    data: scenariosData,
    isLoading: scenariosLoading,
    error: scenariosError
  } = useQuery({
    queryKey: ['scenarios', dealId],
    queryFn: async () => {
      try {
        // Use the dedicated API function
        return await getScenarios(dealId);
      } catch (error) {
        console.error('Error fetching scenarios:', error);
        // Throw the error to be handled by React Query
        throw error;
      }
    },
    enabled: !!dealId,
    retry: 2, // Retry twice to handle temporary network issues
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
  });

  // Ensure scenariosData is in the correct format
  const scenarios = Array.isArray(scenariosData) ? scenariosData :
                   (scenariosData?.scenarios || []);

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (scenario: ScenarioCreate) => {
      try {
        // Use the dedicated API function
        return await createScenario(dealId, scenario);
      } catch (error) {
        console.error('Error creating scenario:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] });
      showToast('Scenario created successfully', 'success');

      // Auto-select the newly created scenario
      if (data && data.id) {
        setSelectedScenario(data.id);
      }
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      showToast(error?.response?.data?.detail || 'Failed to create scenario', 'error');
    }
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      try {
        // Use the dedicated API function
        return await deleteScenario(dealId, scenarioId);
      } catch (error) {
        console.error('Error deleting scenario:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] });
      showToast('Scenario deleted successfully', 'success');

      // Reset selected scenario if it was deleted
      if (selectedScenario === deleteScenarioMutation.variables) {
        setSelectedScenario(null);
      }
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      showToast(error?.response?.data?.detail || 'Failed to delete scenario', 'error');
    }
  });

  // Set default scenario name based on selected variable and delta
  useEffect(() => {
    let prefix = '';
    let suffix = '';

    if (parseFloat(delta) > 0) {
      prefix = '+';
    }

    if (varChanged === 'interest') {
      suffix = ' bp interest';
    } else if (varChanged === 'exit_cap') {
      suffix = '% exit cap';
    } else if (varChanged === 'rent') {
      suffix = '% rent';
    } else if (varChanged === 'vacancy') {
      suffix = '% vacancy';
    }

    setName(`${prefix}${delta}${suffix}`);
  }, [varChanged, delta]);

  // Load selected scenario from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && dealId) {
      const savedScenario = localStorage.getItem(`selectedScenario_${dealId}`);
      if (savedScenario && scenarios.some((s: any) => s.id === savedScenario)) {
        setSelectedScenario(savedScenario);
      } else if (scenarios.length > 0) {
        // Default to first scenario if none selected
        setSelectedScenario(scenarios[0].id);
      }
    }
  }, [dealId, scenarios]);

  // Save selected scenario to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && dealId && selectedScenario) {
      localStorage.setItem(`selectedScenario_${dealId}`, selectedScenario);
    }
  }, [dealId, selectedScenario]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!varChanged || !delta) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    // Create scenario
    const scenarioData: ScenarioCreate = {
      var: varChanged,
      delta: parseFloat(delta),
      name: name || undefined, // Only send name if it's not empty
    };

    try {
      console.log('Submitting scenario data:', scenarioData);
      const result = await createScenarioMutation.mutateAsync(scenarioData);
      showToast('Scenario created successfully', 'success');
      setSelectedScenario(result.id);
    } catch (error) {
      console.error('Error creating scenario:', error);
      showToast('Failed to create scenario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add keyboard shortcut for form submission
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(new Event('submit') as any);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [varChanged, delta, name]);

  // Handle scenario deletion
  const handleDeleteScenario = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) {
      return;
    }

    try {
      await deleteScenarioMutation.mutateAsync(scenarioId);

      // If the deleted scenario was selected, select another one
      if (selectedScenario === scenarioId) {
        const remainingScenarios = scenarios.filter((s: any) => s.id !== scenarioId);
        if (remainingScenarios && remainingScenarios.length > 0) {
          setSelectedScenario(remainingScenarios[0].id);
        } else {
          setSelectedScenario(null);
        }
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
    }
  };

  // Get selected scenario data
  const selectedScenarioData = selectedScenario
    ? scenarios.find((s: any) => s.id === selectedScenario)
    : null;

  // Parse cashflow data
  const cashflowData: CashflowData | null = selectedScenarioData?.cashflow_json
    ? (typeof selectedScenarioData.cashflow_json === 'string'
        ? JSON.parse(selectedScenarioData.cashflow_json)
        : selectedScenarioData.cashflow_json)
    : null;



  // Prepare chart data
  const chartData = scenarios.map((scenario: Scenario) => {
    return {
      name: scenario.name,
      irr: scenario.irr || 0,
      id: scenario.id,
      isSelected: scenario.id === selectedScenario,
    };
  });

  // Prepare metrics table data
  const getMetricsTableData = () => {
    if (!scenarios.length) return [];

    return scenarios.map((scenario: Scenario) => {
      const cashflow = scenario.cashflow_json
        ? (typeof scenario.cashflow_json === 'string'
            ? JSON.parse(scenario.cashflow_json)
            : scenario.cashflow_json)
        : null;

      return {
        id: scenario.id,
        name: scenario.name,
        irr: scenario.irr || 0,
        exitValue: cashflow?.exit_value || 0,
        finalCash: cashflow?.final_cash || 0,
        dscr: cashflow?.yearly?.[0]?.noi / cashflow?.yearly?.[0]?.debt_service || 0,
        equityMultiple: cashflow?.final_cash / Math.abs(cashflow?.yearly?.[0]?.cumulative) || 0,
      };
    });
  };

  // Debug tools for development mode
  const isDevMode = process.env.NODE_ENV === 'development';

  // Function to seed sample scenarios
  const seedSampleScenarios = async () => {
    try {
      // Create 3 sample scenarios
      const scenarios = [
        { name: 'Base Case', var: 'interest', delta: 0 },
        { name: 'Interest +50bp', var: 'interest', delta: 0.5 },
        { name: 'Exit Cap +1%', var: 'exit_cap', delta: 1 }
      ];

      for (const scenario of scenarios) {
        await createScenarioMutation.mutateAsync(scenario);
      }

      showToast('Sample scenarios created', 'success');
    } catch (error) {
      console.error('Error seeding scenarios:', error);
      showToast('Failed to seed scenarios', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Scenarios & Sensitivity</h1>

        {/* Debug tools in development mode */}
        {isDevMode && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={seedSampleScenarios}
              className="border-amber-600/30 text-amber-400 hover:bg-amber-900/30"
              size="sm"
              disabled={createScenarioMutation.isPending}
            >
              Seed Sample Scenarios
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Scenario Form */}
        {userRole !== 'LP' && (
          <div className="lg:col-span-1">
            <DarkCard title="Create Scenario">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="var-changed">Variable to Change</Label>
                  <Select value={varChanged} onValueChange={setVarChanged}>
                    <SelectTrigger className="bg-dark-card-hover border-dark-border text-white">
                      <SelectValue placeholder="Select variable" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-border text-white">
                      <SelectItem value="interest">Interest Rate</SelectItem>
                      <SelectItem value="exit_cap">Exit Cap Rate</SelectItem>
                      <SelectItem value="rent">Rental Income</SelectItem>
                      <SelectItem value="vacancy">Vacancy Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delta">
                    Delta Value
                    {varChanged === 'interest' ? ' (basis points)' : ' (%)'}
                  </Label>
                  <Input
                    id="delta"
                    type="number"
                    step="0.1"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    className="bg-dark-card-hover border-dark-border text-white"
                    placeholder={varChanged === 'interest' ? "e.g., 50" : "e.g., 10"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-dark-card-hover border-dark-border text-white"
                    placeholder="e.g., Stress +50bp"
                  />
                </div>

                <div className="relative group">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
                    disabled={!varChanged || !delta || createScenarioMutation.isPending}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                  >
                    {createScenarioMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Running...
                      </div>
                    ) : (
                      'Run Scenario'
                    )}
                  </Button>
                  <div className="absolute right-0 top-0 -mt-8 hidden group-hover:block">
                    <div className="bg-dark-card-hover text-text-secondary text-xs px-2 py-1 rounded">
                      ⌘+Enter
                    </div>
                  </div>
                </div>
              </form>
            </DarkCard>
          </div>
        )}

        {/* Results Section */}
        <div className={userRole === 'LP' ? "lg:col-span-3" : "lg:col-span-2"}>
          {scenariosLoading ? (
            <div className="space-y-6">
              <DarkCard title="IRR Comparison">
                <Skeleton className="h-64 w-full" />
              </DarkCard>
              <DarkCard title="Key Metrics">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </DarkCard>
            </div>
          ) : scenariosError ? (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-900/30">
              <div className="flex justify-between items-center">
                <div>Error loading scenarios. Please try again.</div>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] })}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/30"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : !scenarios.length ? (
            <div className="bg-dark-card p-8 rounded-lg text-center">
              <p className="text-text-secondary">No scenarios yet. Create your first scenario to see results.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chart Toggle */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-white">Results</h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] })}
                    className="border-dark-border text-white mr-2"
                    size="sm"
                    title="Refresh scenarios"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                  <Button
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    onClick={() => setChartType('bar')}
                    className={chartType === 'bar' ? 'bg-accent text-white' : 'border-dark-border text-white'}
                    size="sm"
                  >
                    Bar
                  </Button>
                  <Button
                    variant={chartType === 'line' ? 'default' : 'outline'}
                    onClick={() => setChartType('line')}
                    className={chartType === 'line' ? 'bg-accent text-white' : 'border-dark-border text-white'}
                    size="sm"
                  >
                    Line
                  </Button>
                </div>
              </div>

              {/* IRR Chart */}
              <DarkCard title="IRR Comparison">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
                        <XAxis dataKey="name" tick={{ fill: '#A0A4AE' }} />
                        <YAxis
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: '#A0A4AE' }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}%`, 'IRR']}
                          contentStyle={{ backgroundColor: '#1E222A', borderColor: '#2A2D35' }}
                          labelStyle={{ color: '#FFFFFF' }}
                        />
                        <Bar
                          dataKey="irr"
                          fill="#36FFB0"
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => setSelectedScenario(data.id)}
                          className="cursor-pointer"
                        />
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
                        <XAxis dataKey="name" tick={{ fill: '#A0A4AE' }} />
                        <YAxis
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: '#A0A4AE' }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}%`, 'IRR']}
                          contentStyle={{ backgroundColor: '#1E222A', borderColor: '#2A2D35' }}
                          labelStyle={{ color: '#FFFFFF' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="irr"
                          stroke="#36FFB0"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#36FFB0', stroke: '#36FFB0' }}
                          activeDot={{ r: 6, fill: '#36FFB0', stroke: '#FFFFFF' }}
                          onClick={(data: any) => data && data.id && setSelectedScenario(data.id)}
                          className="cursor-pointer"
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </DarkCard>

              {/* Metrics Table */}
              <DarkCard title="Key Metrics">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-left py-2 px-4 text-text-secondary font-medium">Scenario</th>
                        <th className="text-right py-2 px-4 text-text-secondary font-medium">IRR</th>
                        <th className="text-right py-2 px-4 text-text-secondary font-medium">Equity Multiple</th>
                        <th className="text-right py-2 px-4 text-text-secondary font-medium">DSCR</th>
                        <th className="text-right py-2 px-4 text-text-secondary font-medium">Exit Value</th>
                        {userRole !== 'LP' && (
                          <th className="text-center py-2 px-4 text-text-secondary font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {getMetricsTableData().map((metric: any) => (
                        <tr
                          key={metric.id}
                          className={`border-b border-dark-border hover:bg-dark-card-hover transition-colors cursor-pointer ${
                            metric.id === selectedScenario ? 'bg-dark-card-hover' : ''
                          }`}
                          onClick={() => setSelectedScenario(metric.id)}
                        >
                          <td className="py-2 px-4 text-white">{metric.name}</td>
                          <td className="py-2 px-4 text-right text-accent font-medium">
                            {formatPercentage(metric.irr)}
                          </td>
                          <td className="py-2 px-4 text-right text-white">
                            {metric.equityMultiple.toFixed(2)}x
                          </td>
                          <td className="py-2 px-4 text-right text-white">
                            {metric.dscr.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-right text-white">
                            {formatCurrency(metric.exitValue)}
                          </td>
                          {userRole !== 'LP' && (
                            <td className="py-2 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteScenario(metric.id);
                                }}
                                className="text-text-secondary hover:text-red-400 transition-colors"
                                title="Delete scenario"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DarkCard>

              {/* Selected Scenario Details */}
              {selectedScenarioData && cashflowData && (
                <DarkCard title={`Cashflow Details: ${selectedScenarioData.name}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left py-2 px-4 text-text-secondary font-medium">Year</th>
                          <th className="text-right py-2 px-4 text-text-secondary font-medium">NOI</th>
                          <th className="text-right py-2 px-4 text-text-secondary font-medium">Debt Service</th>
                          <th className="text-right py-2 px-4 text-text-secondary font-medium">Free Cash Flow</th>
                          <th className="text-right py-2 px-4 text-text-secondary font-medium">Cumulative</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashflowData.yearly.map((year) => (
                          <tr key={year.year} className="border-b border-dark-border">
                            <td className="py-2 px-4 text-white">Year {year.year}</td>
                            <td className="py-2 px-4 text-right text-white">
                              {formatCurrency(year.noi)}
                            </td>
                            <td className="py-2 px-4 text-right text-white">
                              {formatCurrency(year.debt_service)}
                            </td>
                            <td className="py-2 px-4 text-right text-white">
                              {formatCurrency(year.free_cash)}
                            </td>
                            <td className="py-2 px-4 text-right text-white">
                              {formatCurrency(year.cumulative)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-dark-card-hover">
                          <td className="py-2 px-4 text-white font-medium">Exit (Year 5)</td>
                          <td className="py-2 px-4 text-right text-white">-</td>
                          <td className="py-2 px-4 text-right text-white">-</td>
                          <td className="py-2 px-4 text-right text-accent font-medium">
                            {formatCurrency(cashflowData.exit_proceeds)}
                          </td>
                          <td className="py-2 px-4 text-right text-accent font-medium">
                            {formatCurrency(cashflowData.final_cash)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-4 bg-dark-card-hover rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-text-secondary text-sm">Exit Value</p>
                        <p className="text-white font-medium">{formatCurrency(cashflowData.exit_value)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary text-sm">Exit Proceeds</p>
                        <p className="text-white font-medium">{formatCurrency(cashflowData.exit_proceeds)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary text-sm">IRR</p>
                        <p className="text-accent font-medium">{formatPercentage(selectedScenarioData.irr || 0)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary text-sm">Equity Multiple</p>
                        <p className="text-white font-medium">
                          {(cashflowData.final_cash / Math.abs(cashflowData.yearly[0].cumulative)).toFixed(2)}x
                        </p>
                      </div>
                    </div>
                  </div>
                </DarkCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
