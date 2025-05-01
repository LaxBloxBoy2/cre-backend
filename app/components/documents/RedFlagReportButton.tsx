'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { RedFlag } from '@/types/document';
import { useToast } from '@/hooks/useToast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface RedFlagReportButtonProps {
  documentName: string;
  redFlags: RedFlag[];
}

export default function RedFlagReportButton({ documentName, redFlags }: RedFlagReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Create a new PDF document
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text('Red Flag Analysis Report', 14, 22);

      // Add document name
      doc.setFontSize(12);
      doc.text(`Document: ${documentName}`, 14, 32);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

      // Add summary
      doc.setFontSize(14);
      doc.text('Summary', 14, 48);
      doc.setFontSize(10);
      doc.text(`This report identifies ${redFlags.length} potential risk clauses in the document.`, 14, 54);

      // Count critical and moderate risks
      const criticalRisks = redFlags.filter(flag => flag.severity === 'red').length;
      const moderateRisks = redFlags.filter(flag => flag.severity === 'yellow').length;

      doc.text(`Critical Risks: ${criticalRisks}`, 14, 60);
      doc.text(`Moderate Risks: ${moderateRisks}`, 14, 66);

      // Add red flags table
      doc.setFontSize(14);
      doc.text('Detailed Risk Analysis', 14, 76);

      // @ts-ignore - jspdf-autotable types are not included
      doc.autoTable({
        startY: 80,
        head: [['Severity', 'Risk Summary', 'Clause Text']],
        body: redFlags.map(flag => [
          flag.severity === 'red' ? 'Critical' : 'Moderate',
          flag.risk_summary,
          flag.text
        ]),
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255]
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 60 },
          2: { cellWidth: 110 }
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3
        }
      });

      // Save the PDF
      doc.save(`RedFlagReport_${documentName.replace(/\s+/g, '_')}.pdf`);

      toast({
        title: 'Report generated',
        description: 'Red flag report has been downloaded.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: 'Report generation failed',
        description: 'There was an error generating the PDF report.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating || redFlags.length === 0}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating report...</span>
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          <span>Download Report</span>
        </>
      )}
    </Button>
  );
}
