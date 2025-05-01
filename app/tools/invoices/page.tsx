'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { getDeals } from '../../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { InvoicesTab } from '../../components/InvoicesTab';
import { Loader2 } from 'lucide-react';

export default function InvoicesToolPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [deals, setDeals] = useState<any[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load deals on mount
  useEffect(() => {
    const loadDeals = async () => {
      try {
        setIsLoading(true);
        const data = await getDeals();
        setDeals(data.deals || []);

        // Select the first deal by default if available
        if (data.deals && data.deals.length > 0) {
          setSelectedDealId(data.deals[0].id);
        }
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeals();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Invoice Management
      </h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Select Deal
        </label>
        <Select
          value={selectedDealId}
          onValueChange={setSelectedDealId}
          disabled={isLoading || deals.length === 0}
        >
          <SelectTrigger className="w-full md:w-80" style={{
            backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
            borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="Select a deal" />
          </SelectTrigger>
          <SelectContent style={{
            backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
            borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
            color: 'var(--text-primary)'
          }}>
            {deals.map(deal => (
              <SelectItem key={deal.id} value={deal.id}>
                {deal.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : selectedDealId ? (
        <InvoicesTab dealId={selectedDealId} />
      ) : (
        <div className="flex items-center justify-center p-12 rounded-lg" style={{
          backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
          borderWidth: '1px',
          borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
        }}>
          <div className="text-center">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No Deal Selected
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Please select a deal to manage its invoices.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
