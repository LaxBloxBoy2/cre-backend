'use client';

import { useToast as useToastUI } from '@/components/ui/use-toast';

export function useToast() {
  const { toast } = useToastUI();

  return {
    toast: ({ title, description, variant = 'default' }: { 
      title: string; 
      description?: string; 
      variant?: 'default' | 'destructive' | 'success' | 'warning';
    }) => {
      toast({
        title,
        description,
        variant: variant === 'success' ? 'default' : variant,
        className: variant === 'success' ? 'bg-green-500 text-white border-green-600' : undefined,
      });
    }
  };
}
