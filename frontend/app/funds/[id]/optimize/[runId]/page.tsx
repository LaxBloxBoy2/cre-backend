import { Metadata } from 'next';
import OptimizationResults from '@/components/FundOptimizer/OptimizationResults';

export const metadata: Metadata = {
  title: 'Fund Optimization Results | QAPT',
  description: 'View the results of your fund optimization',
};

interface OptimizationResultsPageProps {
  params: {
    id: string;
    runId: string;
  };
}

export default function OptimizationResultsPage({ params }: OptimizationResultsPageProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Fund Optimization Results</h1>
      <OptimizationResults fundId={params.id} runId={params.runId} />
    </div>
  );
}
