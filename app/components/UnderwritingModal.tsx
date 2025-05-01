'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { UnderwritingInput, UnderwritingResult, DEMO_UNDERWRITING_RESULT } from '../types/underwriting';
import { runUnderwriting } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, formatPercentage } from '../lib/utils/format';
import { Deal } from '../types/deal';

interface UnderwritingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onSuccess?: (result: UnderwritingResult, inputs: UnderwritingInput) => void;
}

export default function UnderwritingModal({ isOpen, onClose, deal, onSuccess }: UnderwritingModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<UnderwritingResult | null>(null);

  // State for save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Import necessary functions
  const { createUnderwritingScenario, exportUnderwritingToPDF, saveUnderwritingToDeal } = require('../lib/api');

  // Initialize form with deal data
  const [formData, setFormData] = useState<UnderwritingInput>({
    purchase_price: deal?.acquisition_price || 0,
    exit_cap_rate: deal?.exit_cap_rate || 0.065,
    noi_growth_rate: 0.03,
    holding_period_years: 5,
    rent_per_sf: deal?.projected_rent_per_sf || 0,
    vacancy_rate: deal?.vacancy_rate || 0,
    square_footage: deal?.square_footage || 0,
    operating_expenses_per_sf: deal?.operating_expenses_per_sf || 0,
    loan_amount: (deal?.acquisition_price || 0) * 0.65, // Default to 65% LTV
    interest_rate: 0.065,
    amortization_years: 30,
    loan_term_years: 5
  });

  // Reset form when deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        purchase_price: deal.acquisition_price || 0,
        exit_cap_rate: deal.exit_cap_rate || 0.065,
        noi_growth_rate: 0.03,
        holding_period_years: 5,
        rent_per_sf: deal.projected_rent_per_sf || 0,
        vacancy_rate: deal.vacancy_rate || 0,
        square_footage: deal.square_footage || 0,
        operating_expenses_per_sf: deal.operating_expenses_per_sf || 0,
        loan_amount: (deal.acquisition_price || 0) * 0.65, // Default to 65% LTV
        interest_rate: 0.065,
        amortization_years: 30,
        loan_term_years: 5
      });
    }
  }, [deal]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowResults(false);
      setResult(null);
    }
  }, [isOpen]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsedValue: number;

    // Handle percentage inputs
    if (['exit_cap_rate', 'noi_growth_rate', 'vacancy_rate', 'interest_rate'].includes(name)) {
      parsedValue = parseFloat(value) / 100; // Convert from percentage to decimal
    } else {
      parsedValue = parseFloat(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  // Calculate preliminary metrics for real-time display
  const calculatePreliminaryMetrics = (): Partial<UnderwritingResult> => {
    try {
      // Validate inputs to prevent division by zero or negative values
      if (formData.purchase_price <= 0 || formData.square_footage <= 0 ||
          formData.exit_cap_rate <= 0 || formData.amortization_years <= 0) {
        console.log('Invalid input values detected');
        return {};
      }

      // Basic calculations
      const grossPotentialIncome = Math.max(0, formData.square_footage * formData.rent_per_sf);
      const effectiveGrossIncome = Math.max(0, grossPotentialIncome * (1 - formData.vacancy_rate));
      const operatingExpenses = Math.max(0, formData.square_footage * formData.operating_expenses_per_sf);
      const noi = Math.max(0, effectiveGrossIncome - operatingExpenses);
      const capRate = formData.purchase_price > 0 ? noi / formData.purchase_price : 0;

      // Debt service calculation
      const monthlyRate = formData.interest_rate / 12;
      const totalPayments = formData.amortization_years * 12;
      let annualDebtService = 0;

      if (formData.loan_amount > 0 && monthlyRate > 0) {
        const monthlyPayment = formData.loan_amount *
          (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1);
        annualDebtService = monthlyPayment * 12;
      }

      // DSCR calculation
      const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

      // Exit value calculation
      const exitNoi = noi * Math.pow(1 + Math.max(0, formData.noi_growth_rate), formData.holding_period_years);
      const exitValue = formData.exit_cap_rate > 0 ? exitNoi / formData.exit_cap_rate : 0;

      // Cash flow calculation
      const annualCashFlow = noi - annualDebtService;
      const equityInvestment = Math.max(1, formData.purchase_price - formData.loan_amount); // Avoid division by zero
      const cashOnCash = annualCashFlow / equityInvestment;

      // Simplified IRR calculation (not accurate, just for display)
      const irr = Math.max(0, cashOnCash * 1.5); // Simplified approximation, ensure non-negative

      // Equity multiple calculation
      const totalCashFlow = annualCashFlow * formData.holding_period_years;
      const equityMultiple = Math.max(0, (totalCashFlow + (exitValue - formData.loan_amount)) / equityInvestment);

      console.log('Calculated metrics:', {
        noi,
        capRate,
        dscr,
        irr,
        cashOnCash,
        equityMultiple,
        exitValue
      });

      return {
        projected_noi: noi,
        cap_rate: capRate,
        dscr: dscr,
        irr: irr * 100, // Convert to percentage
        cash_on_cash_return: cashOnCash * 100, // Convert to percentage
        equity_multiple: equityMultiple,
        exit_value: exitValue,
        loan_to_value: formData.purchase_price > 0 ? formData.loan_amount / formData.purchase_price : 0
      };
    } catch (error) {
      console.error('Error calculating preliminary metrics:', error);
      return {};
    }
  };

  // Get preliminary metrics
  const preliminaryMetrics = calculatePreliminaryMetrics();

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Check if we're using demo token
      const token = localStorage.getItem('accessToken');
      let underwritingResult: UnderwritingResult;

      if (token === 'demo_access_token' || !deal) {
        console.log('Using demo token or no deal - returning demo underwriting result');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create a more realistic result based on the form data
        const preliminaryMetrics = calculatePreliminaryMetrics();

        // Generate annual cash flows
        const annualCashFlows = [];
        let cumulativeCashFlow = 0;

        for (let year = 1; year <= formData.holding_period_years; year++) {
          const yearlyRentGrowth = Math.pow(1 + formData.noi_growth_rate, year - 1);
          const grossPotentialIncome = formData.square_footage * formData.rent_per_sf * yearlyRentGrowth;
          const vacancyLoss = grossPotentialIncome * formData.vacancy_rate;
          const effectiveGrossIncome = grossPotentialIncome - vacancyLoss;

          const yearlyExpenseGrowth = Math.pow(1 + 0.025, year - 1); // Assume 2.5% expense growth
          const operatingExpenses = formData.square_footage * formData.operating_expenses_per_sf * yearlyExpenseGrowth;

          const noi = effectiveGrossIncome - operatingExpenses;

          // Calculate debt service
          const monthlyRate = formData.interest_rate / 12;
          const totalPayments = formData.amortization_years * 12;
          const monthlyPayment = formData.loan_amount *
            (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
            (Math.pow(1 + monthlyRate, totalPayments) - 1);
          const annualDebtService = monthlyPayment * 12;

          const cashFlow = noi - annualDebtService;
          cumulativeCashFlow += cashFlow;

          annualCashFlows.push({
            year,
            gross_potential_income: grossPotentialIncome,
            vacancy_loss: vacancyLoss,
            effective_gross_income: effectiveGrossIncome,
            operating_expenses: operatingExpenses,
            net_operating_income: noi,
            debt_service: annualDebtService,
            cash_flow: cashFlow,
            cumulative_cash_flow: cumulativeCashFlow
          });
        }

        // Create sensitivity analysis
        const sensitivity = {
          exit_cap_rate: {},
          rent_growth: {},
          vacancy_rate: {},
          interest_rate: {}
        };

        // Exit cap rate sensitivity
        [-0.01, -0.005, 0, 0.005, 0.01].forEach(delta => {
          const newCapRate = formData.exit_cap_rate + delta;
          const exitNoi = preliminaryMetrics.projected_noi as number *
            Math.pow(1 + formData.noi_growth_rate, formData.holding_period_years);
          const newExitValue = exitNoi / newCapRate;
          const newExitProceeds = newExitValue - formData.loan_amount;

          const equityInvestment = formData.purchase_price - formData.loan_amount;
          const totalCashFlow = cumulativeCashFlow;
          const newTotalReturn = totalCashFlow + newExitProceeds;
          const newApproxIrr = (newTotalReturn / formData.holding_period_years / equityInvestment) * 100;

          sensitivity.exit_cap_rate[`${(newCapRate * 100).toFixed(1)}%`] = newApproxIrr;
        });

        underwritingResult = {
          projected_noi: preliminaryMetrics.projected_noi as number,
          effective_gross_income: formData.square_footage * formData.rent_per_sf * (1 - formData.vacancy_rate),
          operating_expenses: formData.square_footage * formData.operating_expenses_per_sf,
          cap_rate: preliminaryMetrics.cap_rate as number,
          dscr: preliminaryMetrics.dscr as number,
          irr: preliminaryMetrics.irr as number,
          cash_on_cash_return: preliminaryMetrics.cash_on_cash_return as number,
          equity_multiple: preliminaryMetrics.equity_multiple as number,
          exit_value: preliminaryMetrics.exit_value as number,
          loan_to_value: formData.loan_amount / formData.purchase_price,
          annual_cash_flows: annualCashFlows,
          sensitivity: sensitivity
        };
      } else {
        // Call the API
        underwritingResult = await runUnderwriting(deal.id, formData);
      }

      setResult(underwritingResult);
      setShowResults(true);
      showToast('Underwriting completed successfully', 'success');

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(underwritingResult, formData);
      }
    } catch (error) {
      console.error('Error submitting underwriting:', error);
      showToast('Failed to complete underwriting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save scenario
  const handleSaveScenario = async () => {
    if (!scenarioName) {
      showToast('Please enter a scenario name', 'error');
      return;
    }

    try {
      setIsSaving(true);

      if (!result) {
        showToast('No results to save', 'error');
        setIsSaving(false);
        return;
      }

      const scenarioData = {
        label: scenarioName,
        description: scenarioDescription,
        assumptions: formData,
        results: result
      };

      // Show saving toast
      showToast('Saving scenario...', 'info');

      const savedResult = await createUnderwritingScenario(deal?.id, scenarioData);
      console.log('Scenario saved:', savedResult);

      if (savedResult && savedResult.id) {
        showToast('Scenario saved successfully', 'success');

        // Invalidate queries to refresh the data
        if (typeof window !== 'undefined' && window.queryClient) {
          window.queryClient.invalidateQueries({ queryKey: ['underwriting-scenarios', deal?.id] });
        }

        // Close the save dialog
        setShowSaveDialog(false);

        // Reset the form
        setScenarioName('');
        setScenarioDescription('');

        // Call onSuccess if provided
        if (onSuccess) {
          onSuccess(result, formData);
        }

        // Close the modal
        onClose();
      } else {
        throw new Error('Failed to save scenario - no ID returned');
      }
    } catch (error) {
      console.error('Error saving scenario:', error);
      showToast('Failed to save scenario', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to bg-clip-text text-transparent">
                Underwriting
              </span>
              <span className="ml-2" style={{ color: 'var(--text-primary)' }}>- {deal?.project_name}</span>
            </DialogTitle>
          </DialogHeader>

        {!showResults ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Sections */}
            <div className="md:col-span-2 space-y-6">
              <Accordion type="single" collapsible defaultValue="acquisition" className="w-full">
                {/* Acquisition & Exit Section */}
                <AccordionItem value="acquisition" style={{ borderColor: 'var(--border-dark)' }}>
                  <AccordionTrigger style={{ color: 'var(--text-primary)' }} className="hover:text-accent">
                    Acquisition & Exit
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                        <Input
                          id="purchase_price"
                          name="purchase_price"
                          type="number"
                          value={formData.purchase_price}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exit_cap_rate">Exit Cap Rate (%)</Label>
                        <Input
                          id="exit_cap_rate"
                          name="exit_cap_rate"
                          type="number"
                          step="0.1"
                          value={formData.exit_cap_rate * 100}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="noi_growth_rate">NOI Growth Rate (%/year)</Label>
                        <Input
                          id="noi_growth_rate"
                          name="noi_growth_rate"
                          type="number"
                          step="0.1"
                          value={formData.noi_growth_rate * 100}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="holding_period_years">Holding Period (years)</Label>
                        <Input
                          id="holding_period_years"
                          name="holding_period_years"
                          type="number"
                          value={formData.holding_period_years}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Income Assumptions Section */}
                <AccordionItem value="income" style={{ borderColor: 'var(--border-dark)' }}>
                  <AccordionTrigger style={{ color: 'var(--text-primary)' }} className="hover:text-accent">
                    Income Assumptions
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="rent_per_sf">Rent per SF ($)</Label>
                        <Input
                          id="rent_per_sf"
                          name="rent_per_sf"
                          type="number"
                          step="0.01"
                          value={formData.rent_per_sf}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vacancy_rate">Vacancy Rate (%)</Label>
                        <Input
                          id="vacancy_rate"
                          name="vacancy_rate"
                          type="number"
                          step="0.1"
                          value={formData.vacancy_rate * 100}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="square_footage">Square Footage</Label>
                        <Input
                          id="square_footage"
                          name="square_footage"
                          type="number"
                          value={formData.square_footage}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Operating Expenses Section */}
                <AccordionItem value="expenses" style={{ borderColor: 'var(--border-dark)' }}>
                  <AccordionTrigger style={{ color: 'var(--text-primary)' }} className="hover:text-accent">
                    Operating Expenses
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="operating_expenses_per_sf">Operating Expenses per SF ($)</Label>
                        <Input
                          id="operating_expenses_per_sf"
                          name="operating_expenses_per_sf"
                          type="number"
                          step="0.01"
                          value={formData.operating_expenses_per_sf}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Financing Structure Section */}
                <AccordionItem value="financing" style={{ borderColor: 'var(--border-dark)' }}>
                  <AccordionTrigger style={{ color: 'var(--text-primary)' }} className="hover:text-accent">
                    Financing Structure
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="loan_amount">Loan Amount ($)</Label>
                        <Input
                          id="loan_amount"
                          name="loan_amount"
                          type="number"
                          value={formData.loan_amount}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                        <Input
                          id="interest_rate"
                          name="interest_rate"
                          type="number"
                          step="0.01"
                          value={formData.interest_rate * 100}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amortization_years">Amortization (years)</Label>
                        <Input
                          id="amortization_years"
                          name="amortization_years"
                          type="number"
                          value={formData.amortization_years}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loan_term_years">Loan Term (years)</Label>
                        <Input
                          id="loan_term_years"
                          name="loan_term_years"
                          type="number"
                          value={formData.loan_term_years}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
                  style={{ color: 'var(--button-text)' }}
                >
                  {isSubmitting ? 'Processing...' : 'Underwrite Now'}
                </Button>
              </div>
            </div>

            {/* Real-time Summary Sidebar */}
            <div className="md:col-span-1">
              <div className="rounded-lg p-4 border sticky top-4" style={{
                backgroundColor: 'var(--bg-card-hover)',
                borderColor: 'var(--border-dark)'
              }}>
                <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Real-time Summary</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Projected NOI</p>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preliminaryMetrics.projected_noi
                        ? formatCurrency(preliminaryMetrics.projected_noi)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cap Rate</p>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preliminaryMetrics.cap_rate
                        ? formatPercentage(preliminaryMetrics.cap_rate * 100)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>DSCR</p>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preliminaryMetrics.dscr
                        ? preliminaryMetrics.dscr.toFixed(2)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>IRR</p>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preliminaryMetrics.irr
                        ? formatPercentage(preliminaryMetrics.irr)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cash-on-Cash Return</p>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preliminaryMetrics.cash_on_cash_return
                        ? formatPercentage(preliminaryMetrics.cash_on_cash_return)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Equity Multiple</p>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preliminaryMetrics.equity_multiple
                        ? preliminaryMetrics.equity_multiple.toFixed(2) + 'x'
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Exit Value</p>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preliminaryMetrics.exit_value
                        ? formatCurrency(preliminaryMetrics.exit_value)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Results View
          <div className="space-y-6">
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
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(result?.projected_noi || 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cap Rate</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(result?.cap_rate ? result.cap_rate * 100 : 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>DSCR</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{result?.dscr?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>IRR</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(result?.irr || 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cash-on-Cash Return</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(result?.cash_on_cash_return || 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Equity Multiple</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{result?.equity_multiple?.toFixed(2) || 'N/A'}x</p>
                  </div>
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Exit Value</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(result?.exit_value || 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-dark)'
                  }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Leverage Impact</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>+{formatPercentage(result?.irr ? result.irr * 0.3 : 0)}</p>
                  </div>
                </div>

                {/* Visualization */}
                <div className="col-span-3 p-6 rounded-lg border" style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-dark)'
                }}>
                  <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Performance Visualization</h4>
                  <div className="h-64 flex items-center justify-center">
                    <p style={{ color: 'var(--text-muted)' }}>Visualization charts will be displayed here</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-3 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowResults(false)}
                  >
                    Back to Form
                  </Button>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Open save scenario dialog
                        setShowSaveDialog(true);
                      }}
                    >
                      Save Scenario
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Save to deal
                        try {
                          saveUnderwritingToDeal(dealId, 'current');
                          showToast('Underwriting summary saved to deal', 'success');
                        } catch (error) {
                          console.error('Error saving to deal:', error);
                          showToast('Failed to save to deal', 'error');
                        }
                      }}
                    >
                      Save to Deal
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
                      style={{ color: 'var(--button-text)' }}
                      onClick={() => {
                        // Export to PDF
                        try {
                          showToast('Generating PDF report...', 'info');
                          exportUnderwritingToPDF(dealId, 'current')
                            .then(() => {
                              showToast('PDF report generated successfully', 'success');
                            })
                            .catch((error) => {
                              console.error('Error exporting to PDF:', error);
                              showToast('Failed to export to PDF', 'error');
                            });
                        } catch (error) {
                          console.error('Error exporting to PDF:', error);
                          showToast('Failed to export to PDF', 'error');
                        }
                      }}
                    >
                      Export to PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

      {/* Save Scenario Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Save Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., Base Case"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-description">Description (Optional)</Label>
              <Input
                id="scenario-description"
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder="Brief description of this scenario"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveScenario}
              disabled={isSaving || !scenarioName}
              className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
              style={{ color: 'var(--button-text)' }}
            >
              {isSaving ? 'Saving...' : 'Save Scenario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
