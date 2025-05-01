'use client';

import { Lease } from '@/app/lib/mock-leases';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/app/lib/utils/format';

interface LeaseFinancialSummaryProps {
  lease: Lease;
}

export function LeaseFinancialSummary({ lease }: LeaseFinancialSummaryProps) {
  // Calculate annual rent
  const annualRent = lease.baseRent * 12;

  // Calculate total lease value
  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const leaseYears = (endDate.getFullYear() - startDate.getFullYear()) +
                     (endDate.getMonth() - startDate.getMonth()) / 12;

  // Calculate total lease value with escalation
  let totalLeaseValue = 0;
  let currentRent = lease.baseRent;

  for (let year = 0; year < Math.ceil(leaseYears); year++) {
    // For the first year
    if (year === 0) {
      const monthsInFirstYear = 12 - startDate.getMonth();
      totalLeaseValue += currentRent * monthsInFirstYear;
    }
    // For the last year if it's a partial year
    else if (year === Math.floor(leaseYears) && leaseYears % 1 !== 0) {
      const monthsInLastYear = endDate.getMonth() + 1;
      totalLeaseValue += currentRent * monthsInLastYear;
    }
    // For full years
    else {
      totalLeaseValue += currentRent * 12;
    }

    // Apply rent escalation for next year
    currentRent *= (1 + lease.rentEscalation / 100);
  }

  // Calculate rent per square foot
  const rentPerSqFt = lease.baseRent / lease.leaseArea;
  const annualRentPerSqFt = annualRent / lease.leaseArea;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="mr-2 h-5 w-5" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center p-3 bg-white dark:bg-muted/30 rounded-lg border border-border shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Rent</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(lease.baseRent)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-white dark:bg-muted/30 rounded-lg border border-border shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Rent</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(annualRent)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-white dark:bg-muted/30 rounded-lg border border-border shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Lease Value</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalLeaseValue)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">With {lease.rentEscalation}% annual escalation</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2 p-3 bg-white dark:bg-muted/20 rounded-lg border border-border shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price per SqFt (Monthly)</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{formatCurrency(rentPerSqFt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price per SqFt (Annual)</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{formatCurrency(annualRentPerSqFt)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
