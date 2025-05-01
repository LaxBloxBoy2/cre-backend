'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Slider } from '../../components/ui/slider';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { formatCurrency } from '../../lib/utils/format';
import { useToast } from '../../contexts/ToastContext';
import { Deal } from '../../types/deal';

interface DebtSizingResult {
  max_loan_amount: number;
  monthly_payment: number;
  annual_payment: number;
}

interface DebtSizerProps {
  dealId: string;
  deal: Deal | null;
}

export default function DebtSizer({ dealId, deal }: DebtSizerProps) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebtSizingResult | null>(null);
  const isDark = theme === 'dark';

  // Calculate NOI from deal data
  const calculateNOI = (dealData: Deal | null) => {
    if (!dealData) return 0;

    const grossPotentialIncome = dealData.square_footage * dealData.projected_rent_per_sf;
    const effectiveGrossIncome = grossPotentialIncome * (1 - dealData.vacancy_rate / 100);
    const operatingExpenses = dealData.square_footage * dealData.operating_expenses_per_sf;
    return effectiveGrossIncome - operatingExpenses;
  };

  // Form state
  const [formData, setFormData] = useState({
    noi: calculateNOI(deal) || 150000, // Default to 150,000 if calculation returns 0
    interest_rate: 6.5,
    dscr_target: 1.25,
    amortization_years: 30
  });

  // Update NOI when deal changes
  useEffect(() => {
    const calculatedNOI = calculateNOI(deal);
    if (calculatedNOI > 0) {
      setFormData(prev => ({
        ...prev,
        noi: calculatedNOI
      }));
    }
  }, [deal]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = parseFloat(value);

    if (!isNaN(parsedValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue
      }));
    }
  };

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setFormData(prev => ({
      ...prev,
      dscr_target: value[0]
    }));
  };

  // Calculate debt sizing
  const calculateDebtSizing = () => {
    try {
      const noi = formData.noi;
      const dscr = formData.dscr_target;
      const interestRate = formData.interest_rate / 100; // Convert to decimal
      const amortizationYears = formData.amortization_years;

      // Calculate max annual debt service
      const maxAnnualDebtService = noi / dscr;

      // Calculate mortgage constant
      const monthlyRate = interestRate / 12;
      const numPayments = amortizationYears * 12;
      const mortgageConstant = (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                              (Math.pow(1 + monthlyRate, numPayments) - 1) * 12;

      // Calculate max loan amount
      const maxLoanAmount = maxAnnualDebtService / mortgageConstant;

      // Calculate monthly payment
      const monthlyPayment = maxLoanAmount * mortgageConstant / 12;

      return {
        max_loan_amount: Math.round(maxLoanAmount),
        monthly_payment: Math.round(monthlyPayment),
        annual_payment: Math.round(monthlyPayment * 12)
      };
    } catch (error) {
      console.error('Error in calculation:', error);
      return {
        max_loan_amount: 0,
        monthly_payment: 0,
        annual_payment: 0
      };
    }
  };

  // Handle calculate button click
  const handleCalculateClick = () => {
    setIsLoading(true);

    setTimeout(() => {
      try {
        const calculationResult = calculateDebtSizing();
        setResult(calculationResult);
      } catch (error) {
        console.error('Error calculating debt sizing:', error);
        showToast('Failed to calculate debt sizing', 'error');
      } finally {
        setIsLoading(false);
      }
    }, 500); // Add a small delay to show loading state
  };

  // Calculate on mount
  useEffect(() => {
    // Initial calculation
    const initialResult = calculateDebtSizing();
    setResult(initialResult);
  }, []);

  return (
    <div className="w-full">
      <Card className={`border ${isDark ? 'border-gray-700 bg-[#1A1D23]' : 'border-gray-200 bg-white'}`}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-800'}>
            Automated Debt Sizing
          </CardTitle>
          <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            Calculate the maximum loan amount based on NOI and DSCR requirements
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="noi" className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Net Operating Income (NOI)
                </label>
                <Input
                  id="noi"
                  name="noi"
                  type="number"
                  value={formData.noi}
                  onChange={handleInputChange}
                  className={`${
                    isDark
                      ? 'bg-[#0F1117] text-white border-gray-700'
                      : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="interest_rate" className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Interest Rate (%)
                </label>
                <Input
                  id="interest_rate"
                  name="interest_rate"
                  type="number"
                  step="0.1"
                  value={formData.interest_rate}
                  onChange={handleInputChange}
                  className={`${
                    isDark
                      ? 'bg-[#0F1117] text-white border-gray-700'
                      : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="dscr_target" className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    DSCR Target: {formData.dscr_target.toFixed(2)}x
                  </label>
                </div>
                <Slider
                  id="dscr_target"
                  min={1.0}
                  max={2.0}
                  step={0.01}
                  value={[formData.dscr_target]}
                  onValueChange={handleSliderChange}
                  className="py-4"
                />
                <div className="flex justify-between text-xs">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>1.0x</span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>1.5x</span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>2.0x</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="amortization_years" className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Amortization (Years)
                </label>
                <Input
                  id="amortization_years"
                  name="amortization_years"
                  type="number"
                  value={formData.amortization_years}
                  onChange={handleInputChange}
                  className={`${
                    isDark
                      ? 'bg-[#0F1117] text-white border-gray-700'
                      : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="flex flex-col justify-center">
              <div className={`rounded-lg p-6 ${
                isDark
                  ? 'bg-[#0F1117] text-white border border-gray-700'
                  : 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Results
                </h3>

                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <div>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Maximum Loan Amount</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {formatCurrency(result.max_loan_amount)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Monthly Payment</p>
                        <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {formatCurrency(result.monthly_payment)}
                        </p>
                      </div>

                      <div>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Annual Payment</p>
                        <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {formatCurrency(result.annual_payment)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-center h-32 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Enter values to calculate debt sizing
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className={isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}>
          <Button
            onClick={handleCalculateClick}
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/90 text-white"
          >
            {isLoading ? 'Calculating...' : 'Calculate Debt Size'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
