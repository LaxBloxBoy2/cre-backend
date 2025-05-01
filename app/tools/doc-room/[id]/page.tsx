'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-shadcn';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Document, RedFlag } from '@/types/document';
import RedFlagsList from '@/components/documents/RedFlagsList';
import DocumentWithRedFlags from '@/components/documents/DocumentWithRedFlags';

interface DocumentViewPageProps {
  params: {
    id: string;
  };
}

export default function DocumentViewPage({ params }: DocumentViewPageProps) {
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documentText, setDocumentText] = useState<string>('');
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<RedFlag | null>(null);
  const [activeTab, setActiveTab] = useState('document');

  // Initialize demo data and fetch document
  useEffect(() => {
    const initializeAndFetchDocument = async () => {
      try {
        setIsLoading(true);

        // Set demo token
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', 'demo_access_token');
          localStorage.setItem('refreshToken', 'demo_refresh_token');
        }

        // Create demo documents if they don't exist
        const createDemoDocuments = () => {
          const demoDocuments = [
            {
              id: '1',
              name: 'Lease Agreement.pdf',
              doc_type: 'Lease',
              type: 'Lease',
              size: 2457600,
              category: 'lease',
              description: 'Main lease agreement',
              deal_id: '1',
              deal_name: 'Office Tower A',
              upload_timestamp: '2023-12-01T00:00:00Z',
              uploaded_at: '2023-12-01T00:00:00Z',
              uploaded_by: 'John Doe',
              ai_summary: 'This lease agreement contains several clauses that may present risks. The tenant has early termination rights with minimal penalties, and the landlord bears significant maintenance responsibilities. There are also restrictive covenants regarding rent increases and exclusive use provisions.',
              red_flags: [
                {
                  text: "Tenant may terminate this lease with 30 days notice without penalty.",
                  risk_summary: "Early termination clause could reduce cash flow predictability.",
                  severity: "red"
                },
                {
                  text: "Landlord is responsible for all maintenance and repairs, including those caused by tenant.",
                  risk_summary: "Excessive landlord obligations could increase operating costs.",
                  severity: "yellow"
                },
                {
                  text: "Rent increases are capped at 2% annually regardless of market conditions.",
                  risk_summary: "Below-market rent escalations may lead to underperformance over time.",
                  severity: "yellow"
                },
                {
                  text: "Tenant has exclusive right to operate certain business types within a 3-mile radius.",
                  risk_summary: "Exclusivity clause limits leasing options for nearby properties in portfolio.",
                  severity: "red"
                }
              ]
            },
            {
              id: '2',
              name: 'Financial Model.xlsx',
              doc_type: 'Financial',
              type: 'Financial',
              size: 1843200,
              category: 'financial',
              description: 'Financial projections',
              deal_id: '1',
              deal_name: 'Office Tower A',
              upload_timestamp: '2023-12-02T00:00:00Z',
              uploaded_at: '2023-12-02T00:00:00Z',
              uploaded_by: 'Jane Smith'
            }
          ];

          localStorage.setItem('demo_documents', JSON.stringify(demoDocuments));
          return demoDocuments;
        };

        // Get documents from localStorage or create them
        let documents;
        try {
          const savedDocuments = localStorage.getItem('demo_documents');
          if (savedDocuments) {
            documents = JSON.parse(savedDocuments);
          } else {
            documents = createDemoDocuments();
          }
        } catch (error) {
          console.error('Error getting documents from localStorage:', error);
          documents = createDemoDocuments();
        }

        // Find the document with the matching ID
        const doc = documents.find((d: Document) => d.id === params.id);

        if (doc) {
          setDocument(doc);

          // Set document text
          setDocumentText(
            doc.ai_summary ||
            'This document text would be fetched from the server. For the demo, we are using placeholder text.\n\n' +
            'The document may contain various clauses that could be flagged as risks, such as:\n\n' +
            'Tenant may terminate this lease with 30 days notice without penalty.\n\n' +
            'Landlord is responsible for all maintenance and repairs, including those caused by tenant.\n\n' +
            'Rent increases are capped at 2% annually regardless of market conditions.\n\n' +
            'Tenant has exclusive right to operate certain business types within a 3-mile radius.'
          );

          // Set red flags
          if (doc.red_flags) {
            try {
              const parsedFlags = typeof doc.red_flags === 'string'
                ? JSON.parse(doc.red_flags)
                : doc.red_flags;

              // Normalize the flags
              const normalizedFlags = parsedFlags.map((flag: any) => ({
                text: flag.text || flag.clause || '',
                risk_summary: flag.risk_summary || flag.explanation || '',
                severity: flag.severity === 'high' ? 'red' :
                         flag.severity === 'medium' ? 'yellow' :
                         flag.severity
              }));

              setRedFlags(normalizedFlags);
            } catch (error) {
              console.error('Error parsing red flags:', error);
              setRedFlags([]);
            }
          }
        } else {
          console.error('Document not found:', params.id);
          // Create a default document if not found
          const defaultDoc = {
            id: params.id,
            name: 'Document ' + params.id,
            doc_type: 'Unknown',
            type: 'Unknown',
            upload_timestamp: new Date().toISOString(),
            uploaded_at: new Date().toISOString(),
            ai_summary: 'This is a placeholder document.'
          };
          setDocument(defaultDoc);
          setDocumentText('This is a placeholder document text.');
        }
      } catch (error) {
        console.error('Error initializing document page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndFetchDocument();
  }, [params.id]);

  // Handle document download
  const handleDownload = () => {
    if (!document) return;

    // Create a dummy file for download
    const dummyText = 'This is a simulated document download from the QAPT platform.';
    const blob = new Blob([dummyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = document.name || `document-${params.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle flag click in the list
  const handleFlagClick = (flag: RedFlag) => {
    setSelectedFlag(flag);
    setActiveTab('document');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
          <Button onClick={() => router.push('/tools/doc-room')}>
            Back to Document Room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/tools/doc-room')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{document.name}</h1>
            <p className="text-muted-foreground">
              {document.doc_type || document.type} • Uploaded on {new Date(document.upload_timestamp || document.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Document summary */}
      {document.ai_summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Document Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{document.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs for document and red flags */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="redFlags">
            Risk Analysis {redFlags.length > 0 && `(${redFlags.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="document" className="mt-0">
          <DocumentWithRedFlags
            documentText={documentText}
            redFlags={redFlags}
            selectedFlag={selectedFlag}
          />
        </TabsContent>

        <TabsContent value="redFlags" className="mt-0">
          <RedFlagsList
            redFlags={redFlags}
            onFlagClick={handleFlagClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
