'use client';

import { Button } from './ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ImportButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push('/import')}
      className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2"
      data-import-button="true"
    >
      <FileSpreadsheet className="h-4 w-4" />
      Import Deals
    </Button>
  );
}
