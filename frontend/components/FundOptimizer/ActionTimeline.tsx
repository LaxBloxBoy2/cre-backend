import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Home, RefreshCw, DollarSign, Hammer, Info } from 'lucide-react';

interface Action {
  id: string;
  asset_id: string;
  month: string;
  action_type: string;
  confidence_score: number;
  details?: any;
}

interface ActionTimelineProps {
  actions: Action[];
}

export default function ActionTimeline({ actions }: ActionTimelineProps) {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // Sort actions by month
  const sortedActions = [...actions].sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );
  
  // Get unique assets
  const uniqueAssets = Array.from(new Set(actions.map(action => action.asset_id)));
  
  // Filter actions by selected asset
  const filteredActions = selectedAsset 
    ? sortedActions.filter(action => action.asset_id === selectedAsset)
    : sortedActions;
  
  // Group actions by month
  const actionsByMonth: Record<string, Action[]> = {};
  
  filteredActions.forEach(action => {
    const monthKey = format(new Date(action.month), 'yyyy-MM');
    if (!actionsByMonth[monthKey]) {
      actionsByMonth[monthKey] = [];
    }
    actionsByMonth[monthKey].push(action);
  });
  
  // Get action icon based on action type
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'hold':
        return <Home className="h-4 w-4" />;
      case 'refinance':
        return <RefreshCw className="h-4 w-4" />;
      case 'sell':
        return <DollarSign className="h-4 w-4" />;
      case 'capex':
        return <Hammer className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Get action color based on action type
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'hold':
        return 'bg-blue-900/30 text-blue-400';
      case 'refinance':
        return 'bg-purple-900/30 text-purple-400';
      case 'sell':
        return 'bg-green-900/30 text-green-400';
      case 'capex':
        return 'bg-orange-900/30 text-orange-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };
  
  // Format confidence score as percentage
  const formatConfidence = (score: number) => {
    return `${(score * 100).toFixed(0)}%`;
  };
  
  // Format action details
  const formatDetails = (action: Action) => {
    if (!action.details) return '';
    
    switch (action.action_type) {
      case 'refinance':
        return `Refinance amount: $${action.details.refinance_amount?.toLocaleString()}`;
      case 'sell':
        return `Sale price: $${action.details.sale_price?.toLocaleString()}`;
      case 'capex':
        return `CapEx amount: $${action.details.capex_amount?.toLocaleString()}`;
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Asset filter */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={selectedAsset === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedAsset(null)}
        >
          All Assets
        </Badge>
        {uniqueAssets.map(assetId => (
          <Badge 
            key={assetId}
            variant={selectedAsset === assetId ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedAsset(assetId)}
          >
            Asset {assetId.substring(0, 8)}
          </Badge>
        ))}
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-border" />
        
        {/* Timeline items */}
        <div className="space-y-8 relative">
          {Object.entries(actionsByMonth).map(([month, monthActions]) => (
            <div key={month} className="relative pl-10">
              {/* Month marker */}
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-dark-card-hover border border-dark-border flex items-center justify-center z-10">
                <span className="text-xs font-medium text-text-secondary">
                  {format(new Date(month), 'MMM')}
                </span>
              </div>
              
              {/* Month label */}
              <div className="mb-4">
                <h3 className="text-white text-lg font-medium">
                  {format(new Date(month), 'MMMM yyyy')}
                </h3>
              </div>
              
              {/* Actions for this month */}
              <div className="space-y-4">
                {monthActions.map(action => (
                  <TooltipProvider key={action.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-dark-card-hover rounded-lg p-4 border border-dark-border hover:border-accent/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Badge className={`mr-3 ${getActionColor(action.action_type)}`}>
                                {getActionIcon(action.action_type)}
                                <span className="ml-1 capitalize">{action.action_type}</span>
                              </Badge>
                              <span className="text-text-secondary">
                                Asset {action.asset_id.substring(0, 8)}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`
                                ${action.confidence_score >= 0.8 ? 'border-green-500 text-green-400' : 
                                  action.confidence_score >= 0.6 ? 'border-yellow-500 text-yellow-400' : 
                                  'border-red-500 text-red-400'}
                              `}
                            >
                              {formatConfidence(action.confidence_score)} confidence
                            </Badge>
                          </div>
                          {action.details && (
                            <p className="mt-2 text-sm text-text-secondary">
                              {formatDetails(action)}
                            </p>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="space-y-2 p-2">
                          <p className="font-medium">Action Details</p>
                          <p className="text-sm">Type: {action.action_type}</p>
                          <p className="text-sm">Asset: {action.asset_id}</p>
                          <p className="text-sm">Confidence: {formatConfidence(action.confidence_score)}</p>
                          {action.details && <p className="text-sm">{formatDetails(action)}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
