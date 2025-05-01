'use client';

import { Button } from '../ui/button';

interface TableViewProps {
  comps: any[];
  onAddToUnderwriting: (compId: string) => void;
}

export function TableView({ comps, onAddToUnderwriting }: TableViewProps) {
  return (
    <div className="space-y-4">
      <div className="w-full rounded-lg overflow-hidden border border-gray-300 p-4 bg-gray-100">
        <h2 className="text-xl font-bold mb-4">Table View Placeholder</h2>
        <p className="mb-4">This is a placeholder for the table view of market comps.</p>
        <p className="mb-4">Found {comps.length} properties</p>

        {comps.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">Sample Property:</h3>
            <ul className="list-disc pl-5 mb-4">
              <li>ID: {comps[0].id || 'sample-id'}</li>
              <li>Type: {comps[0].property_type || 'Multifamily'}</li>
              <li>Location: {comps[0].city || 'San Diego'}, {comps[0].state || 'CA'}</li>
              <li>Price: ${comps[0].price?.toLocaleString() || '5,000,000'}</li>
            </ul>

            <Button
              onClick={() => onAddToUnderwriting(comps[0].id || 'sample-id')}
            >
              Add to Underwriting
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
