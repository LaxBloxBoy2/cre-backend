'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  runUnderwriting,
  getUnderwritingScenarios,
  createUnderwritingScenario,
  updateUnderwritingScenario,
  deleteUnderwritingScenario,
  compareUnderwritingScenarios,
  exportUnderwritingToExcel,
  exportUnderwritingToPDF,
  saveUnderwritingToDeal,
  getAISuggestions
} from '../lib/api';
import {
  UnderwritingInput,
  UnderwritingResult,
  UnderwritingScenario,
  ScenarioComparison,
  AnnualCashFlow,
  SensitivityAnalysis
} from '../types/underwriting';
import { useToast } from '../contexts/ToastContext';

// Hook for fetching underwriting scenarios
export const useUnderwritingScenarios = (dealId: string) => {
  return useQuery({
    queryKey: ['underwriting-scenarios', dealId],
    queryFn: () => getUnderwritingScenarios(dealId),
    enabled: !!dealId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for creating a new underwriting scenario
export const useCreateUnderwritingScenario = (dealId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: {
      label: string;
      description?: string;
      assumptions: UnderwritingInput;
      results?: UnderwritingResult
    }) => createUnderwritingScenario(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwriting-scenarios', dealId] });
      showToast('Scenario created successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error creating scenario:', error);
      showToast(error?.response?.data?.detail || 'Failed to create scenario', 'error');
    }
  });
};

// Hook for updating an existing underwriting scenario
export const useUpdateUnderwritingScenario = (dealId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      scenarioId,
      data
    }: {
      scenarioId: string;
      data: Partial<UnderwritingScenario>
    }) => updateUnderwritingScenario(dealId, scenarioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwriting-scenarios', dealId] });
      showToast('Scenario updated successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error updating scenario:', error);
      showToast(error?.response?.data?.detail || 'Failed to update scenario', 'error');
    }
  });
};

// Hook for deleting an underwriting scenario
export const useDeleteUnderwritingScenario = (dealId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (scenarioId: string) => deleteUnderwritingScenario(dealId, scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwriting-scenarios', dealId] });
      showToast('Scenario deleted successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error deleting scenario:', error);
      showToast(error?.response?.data?.detail || 'Failed to delete scenario', 'error');
    }
  });
};

// Hook for comparing two underwriting scenarios
export const useCompareUnderwritingScenarios = (dealId: string) => {
  return useMutation({
    mutationFn: ({
      baseScenarioId,
      compareScenarioId
    }: {
      baseScenarioId: string;
      compareScenarioId: string
    }) => compareUnderwritingScenarios(dealId, baseScenarioId, compareScenarioId)
  });
};

// Hook for exporting underwriting to Excel
export const useExportUnderwritingToExcel = (dealId: string) => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (scenarioId: string) => exportUnderwritingToExcel(dealId, scenarioId),
    onSuccess: () => {
      showToast('Exported to Excel successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error exporting to Excel:', error);
      showToast(error?.response?.data?.detail || 'Failed to export to Excel', 'error');
    }
  });
};

// Hook for exporting underwriting to PDF
export const useExportUnderwritingToPDF = (dealId: string) => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (scenarioId: string) => exportUnderwritingToPDF(dealId, scenarioId),
    onSuccess: () => {
      showToast('Exported to PDF successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error exporting to PDF:', error);
      showToast(error?.response?.data?.detail || 'Failed to export to PDF', 'error');
    }
  });
};

// Hook for saving underwriting to deal
export const useSaveUnderwritingToDeal = (dealId: string) => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (scenarioId: string) => saveUnderwritingToDeal(dealId, scenarioId),
    onSuccess: () => {
      showToast('Underwriting saved to deal successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error saving underwriting to deal:', error);
      showToast(error?.response?.data?.detail || 'Failed to save underwriting to deal', 'error');
    }
  });
};

// Hook for getting AI suggestions
export const useAISuggestions = (dealId: string) => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      propertyType,
      location
    }: {
      propertyType: string;
      location: string
    }) => getAISuggestions(dealId, propertyType, location),
    onSuccess: () => {
      showToast('AI suggestions generated successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error getting AI suggestions:', error);
      showToast(error?.response?.data?.detail || 'Failed to get AI suggestions', 'error');
    }
  });
};

// Hook for calculating underwriting metrics in real-time
export const useUnderwritingCalculator = (initialInputs: Partial<UnderwritingInput>) => {
  const [inputs, setInputs] = useState<Partial<UnderwritingInput>>(initialInputs);
  const [results, setResults] = useState<Partial<UnderwritingResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate inputs
  const validateInputs = (inputs: Partial<UnderwritingInput>): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Cap rate validation
    if (inputs.exit_cap_rate !== undefined && (inputs.exit_cap_rate <= 0 || inputs.exit_cap_rate > 0.15)) {
      errors.exit_cap_rate = 'Exit cap rate must be between 0 and 15%';
    }

    // Vacancy rate validation
    if (inputs.vacancy_rate !== undefined && (inputs.vacancy_rate < 0 || inputs.vacancy_rate > 1)) {
      errors.vacancy_rate = 'Vacancy rate must be between 0 and 100%';
    }

    // Loan amount validation
    if (inputs.loan_amount !== undefined && inputs.purchase_price !== undefined) {
      const ltv = inputs.loan_amount / inputs.purchase_price;
      if (ltv > 0.9) {
        errors.loan_amount = 'Loan amount cannot exceed 90% of purchase price';
      }
    }

    return errors;
  };

  // Update inputs and recalculate
  const updateInputs = (newInputs: Partial<UnderwritingInput>) => {
    const updatedInputs = { ...inputs, ...newInputs };
    const validationErrors = validateInputs(updatedInputs);

    setInputs(updatedInputs);
    setErrors(validationErrors);

    // Only recalculate if there are no validation errors
    if (Object.keys(validationErrors).length === 0) {
      calculateResults(updatedInputs);
    }
  };

  // Calculate results based on inputs
  const calculateResults = (data: Partial<UnderwritingInput>) => {
    try {
      // Skip calculation if essential inputs are missing
      if (!data.purchase_price || !data.rent_per_sf || !data.square_footage) {
        return;
      }

      // Default values for optional inputs
      const inputs = {
        purchase_price: data.purchase_price,
        exit_cap_rate: data.exit_cap_rate || 0.065,
        noi_growth_rate: data.noi_growth_rate || 0.03,
        holding_period_years: data.holding_period_years || 5,
        rent_per_sf: data.rent_per_sf,
        vacancy_rate: data.vacancy_rate || 0.05,
        square_footage: data.square_footage,
        other_income: data.other_income || 0,
        rent_growth_rate: data.rent_growth_rate || data.noi_growth_rate || 0.03,
        operating_expenses_per_sf: data.operating_expenses_per_sf || 8,
        property_tax_rate: data.property_tax_rate || 0.01,
        insurance_cost: data.insurance_cost || (data.square_footage * 0.15),
        management_fee_percent: data.management_fee_percent || 0.03,
        maintenance_reserve_per_sf: data.maintenance_reserve_per_sf || 0.25,
        expense_growth_rate: data.expense_growth_rate || 0.025,
        loan_amount: data.loan_amount || (data.purchase_price * 0.65),
        interest_rate: data.interest_rate || 0.065,
        amortization_years: data.amortization_years || 30,
        loan_term_years: data.loan_term_years || 5,
        loan_fees_percent: data.loan_fees_percent || 0.01
      };

      // Calculate income metrics
      const grossPotentialIncome = inputs.rent_per_sf * inputs.square_footage + (inputs.other_income || 0);
      const vacancyLoss = grossPotentialIncome * inputs.vacancy_rate;
      const effectiveGrossIncome = grossPotentialIncome - vacancyLoss;

      // Calculate expense metrics
      const propertyTaxes = inputs.purchase_price * (inputs.property_tax_rate || 0.01);
      const insurance = inputs.insurance_cost || (inputs.square_footage * 0.15);
      const managementFee = effectiveGrossIncome * (inputs.management_fee_percent || 0.03);
      const maintenanceReserve = inputs.square_footage * (inputs.maintenance_reserve_per_sf || 0.25);
      const otherExpenses = inputs.operating_expenses_per_sf * inputs.square_footage;

      const totalOperatingExpenses = propertyTaxes + insurance + managementFee + maintenanceReserve + otherExpenses;
      const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;

      // Calculate debt service
      const monthlyRate = inputs.interest_rate / 12;
      const totalPayments = inputs.amortization_years * 12;
      const monthlyPayment = inputs.loan_amount *
        (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
      const annualDebtService = monthlyPayment * 12;

      // Calculate return metrics
      const capRate = netOperatingIncome / inputs.purchase_price;
      const dscr = netOperatingIncome / annualDebtService;
      const cashFlow = netOperatingIncome - annualDebtService;
      const equityInvestment = inputs.purchase_price - inputs.loan_amount + (inputs.loan_amount * (inputs.loan_fees_percent || 0.01));
      const cashOnCashReturn = cashFlow / equityInvestment;

      // Calculate exit value
      const exitNoi = netOperatingIncome * Math.pow(1 + inputs.noi_growth_rate, inputs.holding_period_years);
      const exitValue = exitNoi / inputs.exit_cap_rate;

      // Calculate equity multiple and IRR
      const annualCashFlows: AnnualCashFlow[] = [];
      let cumulativeCashFlow = 0;

      for (let year = 1; year <= inputs.holding_period_years; year++) {
        const yearlyRentGrowth = Math.pow(1 + (inputs.rent_growth_rate || 0.03), year - 1);
        const yearlyExpenseGrowth = Math.pow(1 + (inputs.expense_growth_rate || 0.025), year - 1);

        const yearlyGpi = grossPotentialIncome * yearlyRentGrowth;
        const yearlyVacancyLoss = yearlyGpi * inputs.vacancy_rate;
        const yearlyEgi = yearlyGpi - yearlyVacancyLoss;
        const yearlyOpex = totalOperatingExpenses * yearlyExpenseGrowth;
        const yearlyNoi = yearlyEgi - yearlyOpex;
        const yearlyCashFlow = yearlyNoi - annualDebtService;

        cumulativeCashFlow += yearlyCashFlow;

        annualCashFlows.push({
          year,
          gross_potential_income: yearlyGpi,
          vacancy_loss: yearlyVacancyLoss,
          effective_gross_income: yearlyEgi,
          operating_expenses: yearlyOpex,
          net_operating_income: yearlyNoi,
          debt_service: annualDebtService,
          cash_flow: yearlyCashFlow,
          cumulative_cash_flow: cumulativeCashFlow
        });
      }

      // Calculate IRR
      const cashFlowsForIrr = [-equityInvestment];
      annualCashFlows.forEach(cf => cashFlowsForIrr.push(cf.cash_flow));
      cashFlowsForIrr[cashFlowsForIrr.length - 1] += exitValue - inputs.loan_amount; // Add exit proceeds

      // Simplified IRR calculation (not accurate, just for display)
      const totalReturn = cashFlowsForIrr.reduce((sum, cf) => sum + cf, 0);
      const averageAnnualReturn = totalReturn / inputs.holding_period_years;
      const approximateIrr = (averageAnnualReturn / equityInvestment) * 100;

      // Calculate equity multiple
      const totalCashFlow = annualCashFlows.reduce((sum, cf) => sum + cf.cash_flow, 0);
      const exitProceeds = exitValue - inputs.loan_amount;
      const equityMultiple = (totalCashFlow + exitProceeds) / equityInvestment;

      // Calculate loan to value
      const loanToValue = inputs.loan_amount / inputs.purchase_price;

      // Create sensitivity analysis
      const sensitivity: SensitivityAnalysis = {
        exit_cap_rate: {},
        rent_growth: {},
        vacancy_rate: {},
        interest_rate: {}
      };

      // Exit cap rate sensitivity
      [-0.01, -0.005, 0, 0.005, 0.01].forEach(delta => {
        const newCapRate = inputs.exit_cap_rate + delta;
        const newExitValue = exitNoi / newCapRate;
        const newExitProceeds = newExitValue - inputs.loan_amount;
        const newTotalReturn = totalCashFlow + newExitProceeds;
        const newApproxIrr = (newTotalReturn / inputs.holding_period_years / equityInvestment) * 100;
        sensitivity.exit_cap_rate[`${(newCapRate * 100).toFixed(1)}%`] = newApproxIrr;
      });

      // Set the results
      setResults({
        projected_noi: netOperatingIncome,
        effective_gross_income: effectiveGrossIncome,
        operating_expenses: totalOperatingExpenses,
        cap_rate: capRate,
        dscr: dscr,
        irr: approximateIrr,
        cash_on_cash_return: cashOnCashReturn * 100,
        equity_multiple: equityMultiple,
        exit_value: exitValue,
        loan_to_value: loanToValue,
        annual_cash_flows: annualCashFlows,
        sensitivity: sensitivity
      });
    } catch (error) {
      console.error('Error calculating underwriting results:', error);
    }
  };

  // Initialize calculation on mount
  useEffect(() => {
    const validationErrors = validateInputs(inputs);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      calculateResults(inputs);
    }
  }, []);

  return {
    inputs,
    results,
    errors,
    updateInputs,
    calculateResults
  };
};

// Hook for running underwriting
export const useRunUnderwriting = (dealId: string) => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: UnderwritingInput) => runUnderwriting(dealId, data),
    onSuccess: () => {
      showToast('Underwriting completed successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error running underwriting:', error);
      showToast(error?.response?.data?.detail || 'Failed to run underwriting', 'error');
    }
  });
};
