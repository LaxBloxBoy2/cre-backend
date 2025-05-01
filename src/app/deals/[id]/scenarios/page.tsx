'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useScenarios, useCreateScenario, useDeleteScenario } from '@/hooks/useScenarios';
import { useToast } from '@/contexts/ToastContext';
import { Scenario, ScenarioCreate, CashflowData } from '@/types/scenario';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartCard } from '@/components/ui/ChartCard';
import { DarkCard } from '@/components/ui/DarkCard';

export default function ScenariosPage() {
  const params = useParams();
  const dealId = params.id as string;
  const { showToast } = useToast();
  
  // State for form
  const [varChanged, setVarChanged] = useState<string>('interest');
  const [delta, setDelta] = useState<string>('0.5');
  const [name, setName] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  
  // Queries and mutations
  const { 
    data: scenariosData, 
    isLoading: scenariosLoading, 
    error: scenariosError 
  } = useScenarios(dealId);
  
  const createScenarioMutation = useCreateScenario(dealId);
  const deleteScenarioMutation = useDeleteScenario(dealId);
  
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
      if (savedScenario && scenariosData?.scenarios.some(s => s.id === savedScenario)) {
        setSelectedScenario(savedScenario);
      } else if (scenariosData?.scenarios.length > 0) {
        // Default to first scenario if none selected
        setSelectedScenario(scenariosData.scenarios[0].id);
      }
    }
  }, [dealId, scenariosData]);
  
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
    if (!varChanged || !delta || !name) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    // Create scenario
    const scenarioData: ScenarioCreate = {
      var_changed: varChanged,
      delta: parseFloat(delta),
      name,
    };
    
    try {
      const result = await createScenarioMutation.mutateAsync(scenarioData);
      showToast('Scenario created successfully', 'success');
      setSelectedScenario(result.id);
    } catch (error) {
      console.error('Error creating scenario:', error);
      showToast('Failed to create scenario', 'error');
    }
  };
  
  // Handle scenario deletion
  const handleDeleteScenario = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) {
      return;
    }
    
    try {
      await deleteScenarioMutation.mutateAsync(scenarioId);
      showToast('Scenario deleted successfully', 'success');
      
      // If the deleted scenario was selected, select another one
      if (selectedScenario === scenarioId) {
        const remainingScenarios = scenariosData?.scenarios.filter(s => s.id !== scenarioId);
        if (remainingScenarios && remainingScenarios.length > 0) {
          setSelectedScenario(remainingScenarios[0].id);
        } else {
          setSelectedScenario(null);
        }
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      showToast('Failed to delete scenario', 'error');
    }
  };
  
  // Get selected scenario data
  const selectedScenarioData = selectedScenario 
    ? scenariosData?.scenarios.find(s => s.id === selectedScenario) 
    : null;
  
  // Parse cashflow data
  const cashflowData: CashflowData | null = selectedScenarioData?.cashflow_json 
    ? (typeof selectedScenarioData.cashflow_json === 'string' 
        ? JSON.parse(selectedScenarioData.cashflow_json) 
        : selectedScenarioData.cashflow_json)
    : null;
  
  // Prepare chart data
  const chartData = scenariosData?.scenarios.map(scenario => {
    return {
      name: scenario.name,
      irr: scenario.irr || 0,
      id: scenario.id,
      isSelected: scenario.id === selectedScenario,
    };
  });
  
  // Prepare metrics table data
  const getMetricsTableData = () => {
    if (!scenariosData?.scenarios.length) return [];
    
    return scenariosData.scenarios.map(scenario => {
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
        dscr: cashflow?.yearly[0]?.noi / cashflow?.yearly[0]?.debt_service || 0,
        equityMultiple: cashflow?.final_cash / Math.abs(cashflow?.yearly[0]?.cumulative) || 0,
      };
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Scenarios & Sensitivity</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Scenario Form */}
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
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
                disabled={createScenarioMutation.isPending}
              >
                {createScenarioMutation.isPending ? 'Running...' : 'Run Scenario'}
              </Button>
            </form>
          </DarkCard>
        </div>
        
        {/* Results Section */}
        <div className="lg:col-span-2">
          {scenariosLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : scenariosError ? (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-900/30">
              Error loading scenarios. Please try again.
            </div>
          ) : !scenariosData?.scenarios.length ? (
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
              <ChartCard title="IRR Comparison" chart={
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
                        onClick={(data) => setSelectedScenario(data.id)}
                        className="cursor-pointer"
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              } />
              
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
                        <th className="text-center py-2 px-4 text-text-secondary font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMetricsTableData().map((metric) => (
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
