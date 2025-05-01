'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document } from '@/app/lib/services/document-service';

interface LeaseDocumentViewerModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (document: Document) => void;
}

export default function LeaseDocumentViewerModal({
  document,
  isOpen,
  onClose,
  onDownload
}: LeaseDocumentViewerModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // Mock total pages for demo

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-black dark:text-white">
            {document.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(document)}
              className="text-gray-700 dark:text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="text-gray-700 dark:text-gray-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto my-4 p-4 rounded bg-muted/20 dark:bg-muted/30">
          {/* Document content */}
          <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-8 min-h-[60vh] flex flex-col">
            {/* Mock document content */}
            <div className="text-center mb-4 text-muted-foreground text-sm">Page {currentPage} of {totalPages}</div>

            {currentPage === 1 && (
              <div className="flex-1 flex flex-col text-foreground">
                <h1 className="text-2xl font-bold text-center mb-6">LEASE AGREEMENT</h1>
                <p className="mb-4">THIS LEASE AGREEMENT (the "Agreement") is made and entered into on [Date], by and between [Landlord Name] ("Landlord") and [Tenant Name] ("Tenant").</p>

                <p className="mb-4">WHEREAS, Landlord is the owner of certain real property being, lying and situated in [County], [State], such real property having a street address of [Property Address] (the "Premises").</p>

                <p className="mb-4">WHEREAS, Landlord desires to lease the Premises to Tenant upon the terms and conditions as contained herein; and</p>

                <p className="mb-4">WHEREAS, Tenant desires to lease the Premises from Landlord on the terms and conditions as contained herein;</p>

                <p className="mb-4">NOW, THEREFORE, for and in consideration of the covenants and obligations contained herein and other good and valuable consideration, the receipt and sufficiency of which is hereby acknowledged, the parties hereto agree as follows:</p>

                <h2 className="text-xl font-bold mt-6 mb-3">1. TERM</h2>
                <p className="mb-4">The term of this Agreement shall commence on [Start Date] and shall continue as a lease for term of [Lease Term] months. The lease term shall be automatically renewed for successive one (1) month periods unless either party provides written notice of their intention not to renew at least 30 days before the expiration of any term.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">2. RENT</h2>
                <p className="mb-4">Tenant shall pay to Landlord the sum of $[Monthly Rent] per month as rent for the Premises. Rent increases are capped at 2% annually regardless of market conditions.</p>
              </div>
            )}

            {currentPage === 2 && (
              <div className="flex-1 flex flex-col text-foreground">
                <h2 className="text-xl font-bold mb-3">3. SECURITY DEPOSIT</h2>
                <p className="mb-4">Upon execution of this Agreement, Tenant shall deposit with Landlord the sum of $[Security Deposit] as a security deposit. The security deposit shall be held by Landlord without liability for interest as security for the performance of Tenant's obligations.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">4. USE OF PREMISES</h2>
                <p className="mb-4">The Premises shall be used and occupied by Tenant exclusively as a commercial office space. Tenant has exclusive right to operate certain business types within a 3-mile radius.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">5. MAINTENANCE AND REPAIR</h2>
                <p className="mb-4">Landlord is responsible for all maintenance and repairs, including those caused by tenant. Tenant shall maintain the Premises in a clean and sanitary manner.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">6. UTILITIES</h2>
                <p className="mb-4">Tenant shall be responsible for the payment of all utilities and services to the Premises, including but not limited to electricity, gas, water, sewer, trash collection, telephone, internet, and cable/satellite television.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">7. TERMINATION</h2>
                <p className="mb-4">Tenant may terminate this lease with 30 days notice without penalty. Landlord may terminate this Agreement for cause upon thirty (30) days written notice of a material breach that remains uncured.</p>
              </div>
            )}

            {currentPage === 3 && (
              <div className="flex-1 flex flex-col text-foreground">
                <h2 className="text-xl font-bold mb-3">8. ASSIGNMENT AND SUBLETTING</h2>
                <p className="mb-4">Tenant shall not assign this Agreement or sublet any portion of the Premises without prior written consent of the Landlord.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">9. ALTERATIONS AND IMPROVEMENTS</h2>
                <p className="mb-4">Tenant shall make no alterations to the Premises without the prior written consent of Landlord.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">10. INSURANCE</h2>
                <p className="mb-4">Tenant shall maintain property insurance and liability insurance throughout the term of this Agreement.</p>

                <h2 className="text-xl font-bold mt-6 mb-3">11. GOVERNING LAW</h2>
                <p className="mb-4">This Agreement shall be governed, construed and interpreted by, through and under the Laws of the State of [State].</p>

                <div className="mt-auto pt-8">
                  <p className="mb-4">IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the day and year first above written.</p>

                  <div className="flex justify-between mt-8">
                    <div>
                      <p className="mb-2">LANDLORD:</p>
                      <p>____________________</p>
                      <p>[Landlord Name]</p>
                    </div>

                    <div>
                      <p className="mb-2">TENANT:</p>
                      <p>____________________</p>
                      <p>[Tenant Name]</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex justify-between items-center mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`text-gray-700 dark:text-gray-300 ${currentPage === 1 ? "opacity-50" : ""}`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-gray-600 dark:text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`text-gray-700 dark:text-gray-300 ${currentPage === totalPages ? "opacity-50" : ""}`}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
