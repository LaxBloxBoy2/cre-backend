'use client';

import { RedFlag } from '@/types/document';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';

interface RedFlagsListProps {
  redFlags: RedFlag[];
  onFlagClick?: (flag: RedFlag) => void;
}

export default function RedFlagsList({ redFlags, onFlagClick }: RedFlagsListProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  // Normalize flags to ensure they have the expected properties
  const normalizedFlags = redFlags.map(flag => ({
    text: flag.text || flag.clause || '',
    risk_summary: flag.risk_summary || flag.explanation || '',
    severity: flag.severity === 'high' ? 'red' :
             flag.severity === 'medium' ? 'yellow' :
             flag.severity
  }));

  if (!normalizedFlags || normalizedFlags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No risk clauses found in this document.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Risk Analysis</span>
          <Badge variant="outline" className="ml-2">
            {redFlags.length} {redFlags.length === 1 ? 'clause' : 'clauses'} found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {normalizedFlags.map((flag, index) => (
              <div
                key={index}
                className={`p-4 rounded-md cursor-pointer transition-all ${
                  isDarkTheme
                    ? flag.severity === 'red'
                      ? 'bg-red-950/30 hover:bg-red-950/50'
                      : 'bg-amber-950/30 hover:bg-amber-950/50'
                    : flag.severity === 'red'
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'bg-amber-50 hover:bg-amber-100'
                }`}
                onClick={() => onFlagClick && onFlagClick(flag)}
                style={{
                  boxShadow: isDarkTheme
                    ? flag.severity === 'red'
                      ? '0 0 5px rgba(239, 68, 68, 0.5)'
                      : '0 0 5px rgba(245, 158, 11, 0.5)'
                    : 'none',
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <Badge
                    variant={flag.severity === 'red' ? 'destructive' : 'outline'}
                    className={`${
                      flag.severity === 'red'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {flag.severity === 'red' ? 'Critical Risk' : 'Moderate Risk'}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-2">{flag.risk_summary}</p>
                <div
                  className={`text-xs p-2 rounded ${
                    isDarkTheme ? 'bg-background/50' : 'bg-background'
                  }`}
                >
                  <p className="italic">"{flag.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
