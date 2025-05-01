'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import UnderwritingModal from './UnderwritingModal';
import { Deal } from '../types/deal';
import { UnderwritingResult } from '../types/underwriting';

interface UnderwritingButtonProps {
  deal: Deal;
  onUnderwritingComplete?: (result: UnderwritingResult) => void;
  className?: string;
  directLink?: boolean;
}

export default function UnderwritingButton({
  deal,
  onUnderwritingComplete,
  className,
  directLink = false
}: UnderwritingButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUnderwritingComplete = (result: UnderwritingResult) => {
    if (onUnderwritingComplete) {
      onUnderwritingComplete(result);
    }
  };

  const handleClick = () => {
    if (directLink) {
      router.push(`/deals/${deal.id}/underwriting`);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={`bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow ${className}`}
      >
        Underwrite
      </Button>

      {!directLink && (
        <UnderwritingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          deal={deal}
          onSuccess={handleUnderwritingComplete}
        />
      )}
    </>
  );
}
