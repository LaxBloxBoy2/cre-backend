'use client';

import { useState, useEffect, useRef } from 'react';
import { RedFlag } from '@/types/document';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface DocumentWithRedFlagsProps {
  documentText: string;
  redFlags: RedFlag[];
  selectedFlag?: RedFlag | null;
}

export default function DocumentWithRedFlags({
  documentText,
  redFlags,
  selectedFlag,
}: DocumentWithRedFlagsProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [highlightedText, setHighlightedText] = useState<React.ReactNode[]>([]);
  const flagRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Function to highlight red flags in the document text
  useEffect(() => {
    if (!documentText || !redFlags || redFlags.length === 0) {
      setHighlightedText([documentText]);
      return;
    }

    // Normalize flags to ensure they have the expected properties
    const normalizedFlags = redFlags.map(flag => ({
      text: flag.text || flag.clause || '',
      risk_summary: flag.risk_summary || flag.explanation || '',
      severity: flag.severity === 'high' ? 'red' :
               flag.severity === 'medium' ? 'yellow' :
               flag.severity
    }));

    // Sort red flags by their position in the text to avoid highlighting issues
    const sortedFlags = [...normalizedFlags].sort((a, b) => {
      const posA = documentText.indexOf(a.text);
      const posB = documentText.indexOf(b.text);
      return posA - posB;
    });

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedFlags.forEach((flag, index) => {
      // Skip if flag text is empty
      if (!flag.text) return;

      const flagText = flag.text;
      const startIndex = documentText.indexOf(flagText, lastIndex);

      if (startIndex === -1) {
        // Flag text not found, skip this flag
        return;
      }

      // Add text before the flag
      if (startIndex > lastIndex) {
        result.push(documentText.substring(lastIndex, startIndex));
      }

      // Add the highlighted flag
      result.push(
        <span
          key={`flag-${index}`}
          ref={(el) => (flagRefs.current[index] = el)}
          className={`px-1 py-0.5 rounded ${
            flag.severity === 'red'
              ? isDarkTheme
                ? 'bg-red-950/30'
                : 'bg-red-100'
              : isDarkTheme
              ? 'bg-amber-950/30'
              : 'bg-amber-100'
          } relative group cursor-pointer`}
          style={{
            boxShadow: isDarkTheme
              ? flag.severity === 'red'
                ? '0 0 3px rgba(239, 68, 68, 0.5)'
                : '0 0 3px rgba(245, 158, 11, 0.5)'
              : 'none',
          }}
        >
          {flagText}
          <span
            className={`absolute -top-1 -right-1 flex h-3 w-3 ${
              flag.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'
            } rounded-full`}
          ></span>
          <div
            className={`absolute z-10 left-0 top-full mt-2 p-2 rounded-md shadow-md w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${
              isDarkTheme ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <Badge
              variant={flag.severity === 'red' ? 'destructive' : 'outline'}
              className={`mb-1 ${
                flag.severity === 'red'
                  ? 'bg-red-500'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {flag.severity === 'red' ? 'Critical Risk' : 'Moderate Risk'}
            </Badge>
            <p className="text-xs">{flag.risk_summary}</p>
          </div>
        </span>
      );

      lastIndex = startIndex + flagText.length;
    });

    // Add any remaining text
    if (lastIndex < documentText.length) {
      result.push(documentText.substring(lastIndex));
    }

    setHighlightedText(result);
  }, [documentText, redFlags, isDarkTheme]);

  // Scroll to selected flag
  useEffect(() => {
    if (selectedFlag) {
      const index = redFlags.findIndex(
        (flag) => {
          // Get the text from either text or clause property
          const flagText = flag.text || flag.clause || '';
          const selectedText = selectedFlag.text || selectedFlag.clause || '';

          // Get the risk summary from either risk_summary or explanation property
          const flagSummary = flag.risk_summary || flag.explanation || '';
          const selectedSummary = selectedFlag.risk_summary || selectedFlag.explanation || '';

          return flagText === selectedText && flagSummary === selectedSummary;
        }
      );
      if (index !== -1 && flagRefs.current[index]) {
        flagRefs.current[index]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [selectedFlag, redFlags]);

  return (
    <Card>
      <CardContent className="p-4">
        <ScrollArea className="h-[600px] w-full">
          <div className="whitespace-pre-wrap font-mono text-sm p-4">
            {highlightedText}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
