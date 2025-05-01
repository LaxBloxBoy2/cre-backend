'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { UnderwritingResult } from '../../types/underwriting';
import { formatCurrency, formatPercentage } from '../../lib/utils/format';

interface UnderwritingChartsProps {
  results: UnderwritingResult;
}

export default function UnderwritingCharts({ results }: UnderwritingChartsProps) {
  // Prepare data for cash flow chart
  const cashFlowData = results.annual_cash_flows.map(cf => ({
    year: `Year ${cf.year}`,
    'Net Operating Income': cf.net_operating_income,
    'Debt Service': cf.debt_service,
    'Cash Flow': cf.cash_flow,
  }));

  // Prepare data for equity vs debt chart
  const equityVsDebtData = [
    { name: 'Equity', value: results.exit_value * (1 - results.loan_to_value) },
    { name: 'Debt', value: results.exit_value * results.loan_to_value }
  ];

  // Prepare data for IRR vs time chart
  const irrVsTimeData = [
    { year: 'Year 3', irr: results.irr * 0.7 },
    { year: 'Year 5', irr: results.irr },
    { year: 'Year 7', irr: results.irr * 1.15 },
    { year: 'Year 10', irr: results.irr * 1.25 }
  ];

  // Colors for charts
  const COLORS = ['#36FFB0', '#3182CE', '#F56565', '#ED8936', '#ECC94B'];

  // Custom tooltip for cash flow chart
  const CashFlowTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card p-3 border border-dark-border rounded-md shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for equity vs debt chart
  const EquityDebtTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card p-3 border border-dark-border rounded-md shadow-lg">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p style={{ color: payload[0].color }}>
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            {(payload[0].payload.name === 'Equity' ?
              (1 - results.loan_to_value) :
              results.loan_to_value) * 100}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for IRR chart
  const IrrTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card p-3 border border-dark-border rounded-md shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p style={{ color: payload[0].color }}>
            IRR: {formatPercentage(payload[0].value)}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            Based on projected exit value of {formatCurrency(results.exit_value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cash Flow Chart */}
      <div className="p-4 rounded-lg border" style={{
        backgroundColor: 'var(--bg-card-hover)',
        borderColor: 'var(--border-dark)'
      }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Annual Cash Flow</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashFlowData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
              <XAxis dataKey="year" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CashFlowTooltip />} />
              <Legend />
              <Bar dataKey="Net Operating Income" fill="#36FFB0" />
              <Bar dataKey="Debt Service" fill="#3182CE" />
              <Bar dataKey="Cash Flow" fill="#F56565" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equity vs Debt Chart */}
        <div className="p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card-hover)',
          borderColor: 'var(--border-dark)'
        }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Equity vs Debt</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={equityVsDebtData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {equityVsDebtData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<EquityDebtTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* IRR vs Time Chart */}
        <div className="p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card-hover)',
          borderColor: 'var(--border-dark)'
        }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>IRR vs Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={irrVsTimeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dark)" />
                <XAxis dataKey="year" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip content={<IrrTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="irr"
                  stroke="#36FFB0"
                  activeDot={{ r: 8 }}
                  name="IRR"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
