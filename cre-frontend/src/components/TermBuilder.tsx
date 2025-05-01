'use client';

import { useState } from 'react';
import { Deal } from '@/types/deal';

interface TermBuilderProps {
  deal: Deal;
  className?: string;
}

interface TermSheet {
  loanAmount: number;
  interestRate: number;
  amortizationYears: number;
  termYears: number;
  loanToValue: number;
  debtServiceCoverageRatio: number;
  prepaymentPenalty: string;
  recourse: string;
  specialConditions: string;
}

export function TermBuilder({ deal, className }: TermBuilderProps) {
  const [termSheet, setTermSheet] = useState<TermSheet>({
    loanAmount: Math.round((deal.acquisition_price + deal.construction_cost) * 0.65),
    interestRate: 5.5,
    amortizationYears: 30,
    termYears: 5,
    loanToValue: 65,
    debtServiceCoverageRatio: deal.dscr || 1.25,
    prepaymentPenalty: '5-4-3-2-1',
    recourse: 'Full recourse during construction, burns off at stabilization',
    specialConditions: 'Subject to final underwriting and approval',
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setTermSheet((prev) => ({
      ...prev,
      [name]: name === 'loanAmount' || name === 'interestRate' || name === 'amortizationYears' || name === 'termYears' || name === 'loanToValue' || name === 'debtServiceCoverageRatio'
        ? parseFloat(value)
        : value,
    }));
  };

  const calculateMonthlyPayment = () => {
    const principal = termSheet.loanAmount;
    const monthlyRate = termSheet.interestRate / 100 / 12;
    const numberOfPayments = termSheet.amortizationYears * 12;
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return isNaN(monthlyPayment) ? 0 : monthlyPayment;
  };

  const calculateAnnualDebtService = () => {
    return calculateMonthlyPayment() * 12;
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-50 border-b px-4 py-3">
        <h3 className="text-sm font-medium text-gray-900">Financing Term Sheet</h3>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Amount
            </label>
            <input
              type="number"
              name="loanAmount"
              value={termSheet.loanAmount}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formatCurrency(termSheet.loanAmount)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate (%)
            </label>
            <input
              type="number"
              name="interestRate"
              value={termSheet.interestRate}
              onChange={handleChange}
              step="0.125"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amortization (Years)
            </label>
            <select
              name="amortizationYears"
              value={termSheet.amortizationYears}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={30}>30</option>
              <option value={35}>35</option>
              <option value={40}>40</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term (Years)
            </label>
            <select
              name="termYears"
              value={termSheet.termYears}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={10}>10</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan to Value (%)
            </label>
            <input
              type="number"
              name="loanToValue"
              value={termSheet.loanToValue}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DSCR
            </label>
            <input
              type="number"
              name="debtServiceCoverageRatio"
              value={termSheet.debtServiceCoverageRatio}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prepayment Penalty
          </label>
          <input
            type="text"
            name="prepaymentPenalty"
            value={termSheet.prepaymentPenalty}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recourse
          </label>
          <input
            type="text"
            name="recourse"
            value={termSheet.recourse}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Conditions
          </label>
          <textarea
            name="specialConditions"
            value={termSheet.specialConditions}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Monthly Payment</p>
              <p className="text-sm font-medium">{formatCurrency(calculateMonthlyPayment())}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Annual Debt Service</p>
              <p className="text-sm font-medium">{formatCurrency(calculateAnnualDebtService())}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Project Cost</p>
              <p className="text-sm font-medium">{formatCurrency(deal.acquisition_price + deal.construction_cost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Equity Required</p>
              <p className="text-sm font-medium">{formatCurrency((deal.acquisition_price + deal.construction_cost) - termSheet.loanAmount)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
