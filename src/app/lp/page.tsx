'use client';

import { useState } from 'react';
import { useLPDeals, useLPPortfolioSummary, useLPDistributions, useLPDocuments } from '@/hooks/useLPPortal';
import { format, parseISO } from 'date-fns';

export default function LPPortalPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [documentType, setDocumentType] = useState<string | undefined>(undefined);

  // Fetch LP data with React Query
  const { data: dealsData, isLoading: isDealsLoading, error: dealsError } = useLPDeals();
  const { data: portfolioData, isLoading: isPortfolioLoading, error: portfolioError } = useLPPortfolioSummary();
  const { data: distributionsData, isLoading: isDistributionsLoading, error: distributionsError } = useLPDistributions();
  const { data: documentsData, isLoading: isDocumentsLoading, error: documentsError } = useLPDocuments(documentType);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">LP Portal</h1>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-dark-card-hover text-text-secondary rounded-md hover:text-white transition-all duration-200"
            onClick={() => alert('This would export data in a real app')}
          >
            Export Data
          </button>
          <button
            className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200"
            onClick={() => alert('This would open a contact form in a real app')}
          >
            Contact Manager
          </button>
        </div>
      </div>

      <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden">
        <div className="flex border-b border-dark-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'investments'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Investments
          </button>
          <button
            onClick={() => setActiveTab('distributions')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'distributions'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Distributions
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'documents'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Documents
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {isPortfolioLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
                  <p className="mt-4 text-text-secondary">Loading portfolio data...</p>
                </div>
              ) : portfolioError ? (
                <div className="p-8 text-center text-error">
                  <p>Error loading portfolio data. Please try again.</p>
                </div>
              ) : !portfolioData ? (
                <div className="p-8 text-center text-text-secondary">
                  <p>No portfolio data available.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-dark-bg rounded-lg p-4">
                      <h3 className="text-sm font-medium text-text-secondary mb-1">Total Investment</h3>
                      <p className="text-2xl font-bold text-white">{formatCurrency(portfolioData.total_investment)}</p>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-4">
                      <h3 className="text-sm font-medium text-text-secondary mb-1">Current Value</h3>
                      <p className="text-2xl font-bold text-white">{formatCurrency(portfolioData.current_value)}</p>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-4">
                      <h3 className="text-sm font-medium text-text-secondary mb-1">Total Return</h3>
                      <p className="text-2xl font-bold text-accent">{formatPercentage(portfolioData.total_return_percentage)}</p>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-4">
                      <h3 className="text-sm font-medium text-text-secondary mb-1">Annualized Return</h3>
                      <p className="text-2xl font-bold text-accent">{formatPercentage(portfolioData.annualized_return_percentage)}</p>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-4">
                      <h3 className="text-sm font-medium text-text-secondary mb-1">Cash Distributed</h3>
                      <p className="text-2xl font-bold text-white">{formatCurrency(portfolioData.cash_distributed)}</p>
                    </div>
                    <div className="bg-dark-bg rounded-lg p-4">
                      <h3 className="text-sm font-medium text-text-secondary mb-1">Investment Count</h3>
                      <p className="text-2xl font-bold text-white">{portfolioData.investment_count}</p>
                    </div>
                  </div>

                  <div className="bg-dark-bg rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4">Portfolio Allocation</h3>
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-text-secondary">Portfolio allocation chart will be displayed here</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Recent Activity - This would come from a separate API endpoint in a real app */}
              <div className="bg-dark-bg rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                {isDistributionsLoading || isDocumentsLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
                    <p className="mt-2 text-text-secondary">Loading activity data...</p>
                  </div>
                ) : distributionsError || documentsError ? (
                  <div className="p-4 text-center text-error">
                    <p>Error loading activity data. Please try again.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show most recent distribution if available */}
                    {distributionsData?.distributions && distributionsData.distributions.length > 0 && (
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1.5 rounded-full bg-success/20 text-success">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">Distribution Paid</h4>
                          <p className="text-sm text-text-secondary">
                            {formatCurrency(distributionsData.distributions[0].amount)} distributed for {distributionsData.distributions[0].deal_name}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {format(parseISO(distributionsData.distributions[0].distribution_date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Show most recent document if available */}
                    {documentsData?.documents && documentsData.documents.length > 0 && (
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1.5 rounded-full bg-info/20 text-info">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">New Document Available</h4>
                          <p className="text-sm text-text-secondary">{documentsData.documents[0].name}</p>
                          <p className="text-xs text-text-secondary mt-1">
                            {format(parseISO(documentsData.documents[0].upload_date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Show a generic update if we have deals data */}
                    {dealsData?.deals && dealsData.deals.length > 0 && (
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1.5 rounded-full bg-warning/20 text-warning">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">Investment Update</h4>
                          <p className="text-sm text-text-secondary">{dealsData.deals[0].project_name} valuation has been updated</p>
                          <p className="text-xs text-text-secondary mt-1">
                            {format(new Date(), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Show a message if no activity data is available */}
                    {(!distributionsData?.distributions || distributionsData.distributions.length === 0) &&
                     (!documentsData?.documents || documentsData.documents.length === 0) &&
                     (!dealsData?.deals || dealsData.deals.length === 0) && (
                      <div className="text-center text-text-secondary p-4">
                        <p>No recent activity to display.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="space-y-6">
              {isDealsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
                  <p className="mt-4 text-text-secondary">Loading investments...</p>
                </div>
              ) : dealsError ? (
                <div className="p-8 text-center text-error">
                  <p>Error loading investments. Please try again.</p>
                </div>
              ) : !dealsData?.deals || dealsData.deals.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <p>No investments found.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-bg">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Investment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Current Value
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Return
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {dealsData.deals.map((deal) => (
                          <tr key={deal.id} className="hover:bg-dark-card-hover transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{deal.project_name}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-text-secondary">{deal.property_type}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-text-secondary">
                                {format(parseISO(deal.investment_date), 'MMM d, yyyy')}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-text-secondary">{formatCurrency(deal.investment_amount)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{formatCurrency(deal.current_value)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-accent">{formatPercentage(deal.return_percentage)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success">
                                {deal.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-dark-bg rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4">Investment Performance</h3>
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-text-secondary">Investment performance chart will be displayed here</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'distributions' && (
            <div className="space-y-6">
              {isDistributionsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
                  <p className="mt-4 text-text-secondary">Loading distributions...</p>
                </div>
              ) : distributionsError ? (
                <div className="p-8 text-center text-error">
                  <p>Error loading distributions. Please try again.</p>
                </div>
              ) : !distributionsData?.distributions || distributionsData.distributions.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <p>No distributions found.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-bg">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Deal
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {distributionsData.distributions.map((distribution) => (
                          <tr key={distribution.id} className="hover:bg-dark-card-hover transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-text-secondary">
                                {format(parseISO(distribution.distribution_date), 'MMM d, yyyy')}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-text-secondary">{distribution.deal_name}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{formatCurrency(distribution.amount)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-text-secondary">{distribution.distribution_type}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success">
                                {distribution.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                className="text-accent hover:text-white transition-colors"
                                onClick={() => alert(`This would download a receipt for distribution ID: ${distribution.id}`)}
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-dark-bg rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4">Distribution History</h3>
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-text-secondary">Distribution history chart will be displayed here</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Documents</h3>
                  <p className="text-sm text-text-secondary">Access your investment documents and reports</p>
                </div>
                <div className="flex space-x-2">
                  <select
                    className="bg-dark-bg text-text-secondary border border-dark-border rounded-md px-3 py-1 text-sm"
                    value={documentType || ''}
                    onChange={(e) => setDocumentType(e.target.value === 'all' ? undefined : e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="investor_report">Investor Reports</option>
                    <option value="tax_document">Tax Documents</option>
                    <option value="legal_document">Legal Documents</option>
                  </select>
                </div>
              </div>

              {isDocumentsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
                  <p className="mt-4 text-text-secondary">Loading documents...</p>
                </div>
              ) : documentsError ? (
                <div className="p-8 text-center text-error">
                  <p>Error loading documents. Please try again.</p>
                </div>
              ) : !documentsData?.documents || documentsData.documents.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <p>No documents found.</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-border">
                  {documentsData.documents.map((document) => (
                    <div key={document.id} className="py-4 hover:bg-dark-card-hover transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-dark-card-hover rounded-md">
                            <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white">{document.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-text-secondary">{document.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              <span className="text-xs text-text-secondary">•</span>
                              <span className="text-xs text-text-secondary">
                                {format(parseISO(document.upload_date), 'MMM d, yyyy')}
                              </span>
                              <span className="text-xs text-text-secondary">•</span>
                              <span className="text-xs text-text-secondary">{formatFileSize(document.size)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="p-1 text-text-secondary hover:text-accent transition-colors"
                            onClick={() => alert(`This would preview document: ${document.name}`)}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            className="p-1 text-text-secondary hover:text-accent transition-colors"
                            onClick={() => alert(`This would download document: ${document.name}`)}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
