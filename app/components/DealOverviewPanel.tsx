'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '../lib/utils';

interface DealContact {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface DealTag {
  id: string;
  name: string;
  color: string;
}

interface DealOverviewProps {
  dealId: string;
  dealName: string;
  clientName: string;
  dealValue: number;
  tags: DealTag[];
  contact: DealContact;
  createdAt: string;
}

export default function DealOverviewPanel({
  dealId,
  dealName,
  clientName,
  dealValue,
  tags,
  contact,
  createdAt,
}: DealOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="dark-card overflow-hidden transition-all duration-300 hover:shadow-accent-glow">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-1"></div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{dealName}</h2>
            <p className="text-text-secondary mb-4">{clientName}</p>
            
            <div className="flex items-center mb-4">
              <span className="text-xl font-semibold text-accent mr-2">
                {formatCurrency(dealValue)}
              </span>
              <span className="text-sm text-text-secondary">Deal Value</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color,
                    border: `1px solid ${tag.color}40`
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            
            <div className="text-sm text-text-secondary">
              Created on {formattedDate}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center bg-dark-card-hover p-2 rounded-lg mb-4">
              <div className="relative w-10 h-10 mr-3">
                <Image
                  src={contact.avatar || '/placeholder-avatar.png'}
                  alt={contact.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{contact.name}</p>
                <p className="text-xs text-text-secondary">{contact.role}</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-dark-card-hover/50 animate-fadeIn">
            <h3 className="text-sm font-medium text-white mb-2">Deal Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Deal ID</p>
                <p className="text-white">{dealId}</p>
              </div>
              <div>
                <p className="text-text-secondary">Status</p>
                <p className="text-accent">Active</p>
              </div>
              <div>
                <p className="text-text-secondary">Type</p>
                <p className="text-white">Acquisition</p>
              </div>
              <div>
                <p className="text-text-secondary">Expected Close</p>
                <p className="text-white">In 24 days</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
