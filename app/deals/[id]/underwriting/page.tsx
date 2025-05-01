'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDeal } from '../../../lib/api';
import { Deal } from '../../../types/deal';
import {
  UnderwritingResult,
  UnderwritingScenario,
  ScenarioComparison as ScenarioComparisonType,
  AuditTrailEntry,
  DEMO_SCENARIOS
} from '../../../types/underwriting';
import { useToast } from '../../../contexts/ToastContext';
import { formatCurrency, formatPercentage } from '../../../lib/utils/format';
import { formatDate } from '../../../lib/utils/date';
import {
  useUnderwritingScenarios,
  useCreateUnderwritingScenario,
  useUpdateUnderwritingScenario,
  useDeleteUnderwritingScenario,
  useCompareUnderwritingScenarios,
  useExportUnderwritingToExcel,
  useExportUnderwritingToPDF,
  useSaveUnderwritingToDeal,
  useAISuggestions
} from '../../../hooks/useUnderwriting';
import UnderwritingModal from '../../../components/UnderwritingModal';
import ScenarioSelector from '../../../components/underwriting/ScenarioSelector';
import ScenarioComparison from '../../../components/underwriting/ScenarioComparison';
import UnderwritingCharts from '../../../components/underwriting/UnderwritingCharts';
import AuditTrail from '../../../components/underwriting/AuditTrail';
import AISuggestions from '../../../components/underwriting/AISuggestions';
import DebtSizer from '../../../components/underwriting/DebtSizer';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs-shadcn';

export default function UnderwritingPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const dealId = params?.id as string;

  // State
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('results');
  const [comparisonData, setComparisonData] = useState<ScenarioComparisonType | null>(null);
  const [compareWithScenarioId, setCompareWithScenarioId] = useState<string>('');
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // Hooks
  const {
    data: scenarios = [],
    isLoading: isScenariosLoading,
    refetch: refetchScenarios
  } = useUnderwritingScenarios(dealId);

  const { mutate: createScenario, isPending: isCreatingScenario } = useCreateUnderwritingScenario(dealId);
  const { mutate: updateScenario, isPending: isUpdatingScenario } = useUpdateUnderwritingScenario(dealId);
  const { mutate: deleteScenario, isPending: isDeletingScenario } = useDeleteUnderwritingScenario(dealId);
  const {
    mutate: compareScenarios,
    data: comparisonResult,
    isPending: isComparing
  } = useCompareUnderwritingScenarios(dealId);
  const { mutate: exportToExcel, isPending: isExporting } = useExportUnderwritingToExcel(dealId);
  const { mutate: exportToPDF, isPending: isExportingPDF } = useExportUnderwritingToPDF(dealId);
  const { mutate: saveToDeal, isPending: isSavingToDeal } = useSaveUnderwritingToDeal(dealId);

  // Fetch deal data
  useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true);
        const dealData = await getDeal(dealId);
        setDeal(dealData);
      } catch (error) {
        console.error('Error fetching deal:', error);
        showToast('Failed to load deal data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (dealId) {
      fetchDeal();
    }
  }, [dealId, showToast]);

  // Set the first scenario as selected when scenarios are loaded
  useEffect(() => {
    if (scenarios.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(scenarios[0].id);
    }
  }, [scenarios, selectedScenarioId]);

  // Update comparison data when comparison result changes
  useEffect(() => {
    if (comparisonResult) {
      setComparisonData(comparisonResult);
      setActiveTab('comparison');
    }
  }, [comparisonResult]);

  // Get the selected scenario
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);
  const compareScenario = scenarios.find(s => s.id === compareWithScenarioId);

  // Handle underwriting completion
  const handleUnderwritingComplete = (result: UnderwritingResult, inputs: any) => {
    // Create a new scenario with the result
    const newScenario = {
      label: `Scenario ${scenarios.length + 1}`,
      description: `Created on ${formatDate(new Date().toISOString())}`,
      assumptions: inputs,
      results: result
    };

    createScenario(newScenario, {
      onSuccess: (data) => {
        setSelectedScenarioId(data.id);
        setIsModalOpen(false);

        // Add to audit trail
        const newEntry: AuditTrailEntry = {
          timestamp: new Date().toISOString(),
          user_id: 'current-user',
          user_name: 'Current User',
          field_changed: 'new_scenario',
          old_value: null,
          new_value: data.label
        };
        setAuditTrail(prev => [newEntry, ...prev]);
      }
    });
  };

  // Handle scenario selection
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setComparisonData(null);
  };

  // Handle scenario creation
  const handleCreateScenario = (name: string, description: string) => {
    if (!selectedScenario) return;

    const newScenario = {
      label: name,
      description,
      assumptions: selectedScenario.assumptions,
      results: selectedScenario.results
    };

    createScenario(newScenario, {
      onSuccess: (data) => {
        setSelectedScenarioId(data.id);

        // Add to audit trail
        const newEntry: AuditTrailEntry = {
          timestamp: new Date().toISOString(),
          user_id: 'current-user',
          user_name: 'Current User',
          field_changed: 'new_scenario',
          old_value: null,
          new_value: data.label
        };
        setAuditTrail(prev => [newEntry, ...prev]);
      }
    });
  };

  // Handle scenario deletion
  const handleDeleteScenario = (scenarioId: string) => {
    deleteScenario(scenarioId, {
      onSuccess: () => {
        // If the deleted scenario was selected, select another one
        if (scenarioId === selectedScenarioId && scenarios.length > 1) {
          const newSelectedId = scenarios.find(s => s.id !== scenarioId)?.id;
          if (newSelectedId) {
            setSelectedScenarioId(newSelectedId);
          }
        }

        // Add to audit trail
        const deletedScenario = scenarios.find(s => s.id === scenarioId);
        const newEntry: AuditTrailEntry = {
          timestamp: new Date().toISOString(),
          user_id: 'current-user',
          user_name: 'Current User',
          field_changed: 'delete_scenario',
          old_value: deletedScenario?.label,
          new_value: null
        };
        setAuditTrail(prev => [newEntry, ...prev]);
      }
    });
  };

  // Handle scenario update (rename)
  const handleUpdateScenario = (scenarioId: string, data: Partial<UnderwritingScenario>) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    updateScenario({
      scenarioId,
      data
    }, {
      onSuccess: () => {
        // Add to audit trail if label was changed
        if (data.label && data.label !== scenario.label) {
          const newEntry: AuditTrailEntry = {
            timestamp: new Date().toISOString(),
            user_id: 'current-user',
            user_name: 'Current User',
            field_changed: 'rename_scenario',
            old_value: scenario.label,
            new_value: data.label
          };
          setAuditTrail(prev => [newEntry, ...prev]);
        }

        showToast('Scenario updated successfully', 'success');
      }
    });
  };

  // Handle scenario comparison
  const handleCompareScenarios = (baseScenarioId: string, compareScenarioId: string) => {
    setCompareWithScenarioId(compareScenarioId);
    compareScenarios({ baseScenarioId, compareScenarioId });
  };

  // Handle export to Excel
  const handleExportToExcel = (scenarioId: string) => {
    exportToExcel(scenarioId);
  };

  // Handle export to PDF
  const handleExportToPDF = (scenarioId: string) => {
    exportToPDF(scenarioId);
  };

  // Handle save to deal
  const handleSaveToDeal = (scenarioId: string) => {
    saveToDeal(scenarioId);
  };

  // Handle AI suggestions
  const handleApplySuggestions = (suggestions: Record<string, number>) => {
    if (!selectedScenario) return;

    // Update the selected scenario with the suggestions
    const updatedAssumptions = {
      ...selectedScenario.assumptions,
      ...suggestions
    };

    updateScenario({
      scenarioId: selectedScenarioId,
      data: {
        assumptions: updatedAssumptions
      }
    }, {
      onSuccess: () => {
        // Add to audit trail
        const newEntries: AuditTrailEntry[] = Object.entries(suggestions).map(([key, value]) => ({
          timestamp: new Date().toISOString(),
          user_id: 'current-user',
          user_name: 'Current User',
          field_changed: key,
          old_value: selectedScenario.assumptions[key as keyof typeof selectedScenario.assumptions],
          new_value: value
        }));
        setAuditTrail(prev => [...newEntries, ...prev]);
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-card-hover rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-dark-card-hover rounded mb-4"></div>
          <div className="h-32 bg-dark-card-hover rounded"></div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Deal not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{deal?.project_name}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{deal?.location}</p>
        </div>
        <div className="flex space-x-2">
          {deal?.property_type && deal?.location && (
            <AISuggestions
              dealId={dealId}
              propertyType={deal.property_type}
              location={deal.location}
              onApplySuggestions={handleApplySuggestions}
            />
          )}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
            style={{ color: 'var(--button-text)' }}
          >
            Run New Underwriting
          </Button>
        </div>
      </div>

      {isScenariosLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded w-full mb-4" style={{ backgroundColor: 'var(--bg-card-hover)' }}></div>
          <div className="h-64 rounded mb-4" style={{ backgroundColor: 'var(--bg-card-hover)' }}></div>
          <div className="h-32 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}></div>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="rounded-lg p-6 border flex flex-col items-center justify-center h-96" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)'
        }}>
          <h3 className="text-xl font-medium mb-4" style={{ color: 'var(--text-primary)' }}>No Underwriting Scenarios</h3>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Run an underwriting analysis to create your first scenario.</p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
            style={{ color: 'var(--button-text)' }}
          >
            Run Underwriting
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scenario Selector */}
          <ScenarioSelector
            scenarios={scenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={handleSelectScenario}
            onCreateScenario={handleCreateScenario}
            onDeleteScenario={handleDeleteScenario}
            onUpdateScenario={handleUpdateScenario}
            onExportToExcel={handleExportToExcel}
            onExportToPDF={handleExportToPDF}
            onSaveToDeal={handleSaveToDeal}
            onCompareScenarios={handleCompareScenarios}
            isLoading={isCreatingScenario || isDeletingScenario || isUpdatingScenario || isExporting || isExportingPDF || isSavingToDeal || isComparing}
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full" style={{ backgroundColor: 'var(--bg-card-hover-darker)' }}>
              <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
              <TabsTrigger value="charts" className="flex-1">Charts</TabsTrigger>
              <TabsTrigger value="comparison" className="flex-1" disabled={!comparisonData}>Comparison</TabsTrigger>
              <TabsTrigger value="debt-sizing" className="flex-1">Debt Sizing</TabsTrigger>
              <TabsTrigger value="audit" className="flex-1">Audit Trail</TabsTrigger>
            </TabsList>

            {selectedScenario && (
              <>
                {/* Results Tab */}
                <TabsContent value="results" className="mt-6">
                  <div className="rounded-lg p-6 border" style={{
                    backgroundColor: 'var(--bg-card-hover)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Underwriting Results</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Financial KPIs */}
                      <div className="col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Projected NOI</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(selectedScenario.results.projected_noi)}</p>
                        </div>
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cap Rate</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedScenario.results.cap_rate * 100)}</p>
                        </div>
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>DSCR</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedScenario.results.dscr.toFixed(2)}</p>
                        </div>
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>IRR</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedScenario.results.irr)}</p>
                        </div>
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cash-on-Cash Return</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedScenario.results.cash_on_cash_return)}</p>
                        </div>
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Equity Multiple</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedScenario.results.equity_multiple.toFixed(2)}x</p>
                        </div>
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Exit Value</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(selectedScenario.results.exit_value)}</p>
                        </div>
                        <div className="p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-dark)'
                        }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loan to Value</p>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedScenario.results.loan_to_value * 100)}</p>
                        </div>
                      </div>

                      {/* Key Assumptions */}
                      <div className="col-span-3 p-6 rounded-lg border" style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-dark)'
                      }}>
                        <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Key Assumptions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Purchase Price</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(selectedScenario.assumptions.purchase_price)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Exit Cap Rate</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedScenario.assumptions.exit_cap_rate * 100)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Rent per SF</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>${selectedScenario.assumptions.rent_per_sf.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Vacancy Rate</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedScenario.assumptions.vacancy_rate * 100)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Square Footage</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>{selectedScenario.assumptions.square_footage.toLocaleString()} SF</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>OpEx per SF</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>${selectedScenario.assumptions.operating_expenses_per_sf.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loan Amount</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(selectedScenario.assumptions.loan_amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Interest Rate</p>
                            <p className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedScenario.assumptions.interest_rate * 100)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Annual Cash Flows */}
                      <div className="col-span-3 p-6 rounded-lg border" style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-dark)'
                      }}>
                        <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Annual Cash Flows</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Year</th>
                                <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: 'var(--text-muted)' }}>NOI</th>
                                <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Debt Service</th>
                                <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Cash Flow</th>
                                <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Cumulative</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-dark)' }}>
                              {selectedScenario.results.annual_cash_flows.map((cf) => (
                                <tr key={cf.year} className="hover:bg-opacity-50" style={{
                                  ':hover': { backgroundColor: 'var(--bg-card-hover)' }
                                }}>
                                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>Year {cf.year}</td>
                                  <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(cf.net_operating_income)}</td>
                                  <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(cf.debt_service)}</td>
                                  <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(cf.cash_flow)}</td>
                                  <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(cf.cumulative_cash_flow)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="mt-6">
                  <UnderwritingCharts results={selectedScenario.results} />
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="mt-6">
                  {comparisonData && compareScenario ? (
                    <ScenarioComparison
                      comparison={comparisonData}
                      baseScenarioName={selectedScenario.label}
                      compareScenarioName={compareScenario.label}
                    />
                  ) : (
                    <div className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-card-hover)',
                        borderColor: 'var(--border-dark)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Select "Compare" from the scenario toolbar to compare scenarios.
                    </div>
                  )}
                </TabsContent>

                {/* Debt Sizing Tab */}
                <TabsContent value="debt-sizing" className="mt-6">
                  <DebtSizer dealId={dealId} deal={deal} />
                </TabsContent>

                {/* Audit Trail Tab */}
                <TabsContent value="audit" className="mt-6">
                  <AuditTrail entries={auditTrail} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      )}

      <UnderwritingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deal={deal}
        onSuccess={handleUnderwritingComplete}
      />
    </div>
  );
}
