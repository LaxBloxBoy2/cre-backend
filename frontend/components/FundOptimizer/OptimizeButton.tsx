import { useState } from 'react';
import { Button } from '../ui/button';
import { Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface OptimizeButtonProps {
  fundId: string;
}

export default function OptimizeButton({ fundId }: OptimizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleOptimize = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to start optimization
      const response = await api.post('/fund/optimize', {
        fund_id: fundId,
        target_horizon_years: 5,
        constraints: {
          min_dscr: 1.25,
          max_leverage: 0.75
        }
      });
      
      // Show success toast
      toast({
        title: 'Optimization Started',
        description: 'Fund optimization has been started. You will be redirected to the results page.',
        variant: 'default',
      });
      
      // Redirect to results page
      router.push(`/funds/${fundId}/optimize/${response.data.run_id}`);
      
    } catch (error) {
      console.error('Error starting optimization:', error);
      
      // Show error toast
      toast({
        title: 'Optimization Failed',
        description: 'There was an error starting the fund optimization. Please try again.',
        variant: 'destructive',
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleOptimize}
      disabled={isLoading}
      className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Optimizing...
        </>
      ) : (
        <>
          <TrendingUp className="mr-2 h-4 w-4" />
          Optimize Fund
        </>
      )}
    </Button>
  );
}
