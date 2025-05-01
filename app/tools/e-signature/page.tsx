'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs-shadcn';
import { Badge } from '../../components/ui/badge';

export default function ESignaturePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for envelopes
  const envelopes = [
    {
      id: '1',
      name: 'Lease Agreement',
      status: 'pending',
      created: '2023-12-01',
      recipients: ['john.doe@example.com', 'jane.smith@example.com'],
      deal: 'Office Tower A'
    },
    {
      id: '2',
      name: 'Purchase Agreement',
      status: 'sent',
      created: '2023-12-02',
      recipients: ['investor@example.com'],
      deal: 'Office Tower A'
    },
    {
      id: '3',
      name: 'Disclosure Document',
      status: 'signed',
      created: '2023-12-03',
      recipients: ['partner@example.com'],
      deal: 'Retail Center B'
    },
    {
      id: '4',
      name: 'Term Sheet',
      status: 'declined',
      created: '2023-12-04',
      recipients: ['lender@example.com'],
      deal: 'Industrial Park C'
    },
    {
      id: '5',
      name: 'Investor Agreement',
      status: 'signed',
      created: '2023-12-05',
      recipients: ['investor2@example.com', 'legal@example.com'],
      deal: 'Office Tower A'
    },
  ];

  // Filter envelopes based on search query
  const filteredEnvelopes = envelopes.filter(env =>
    env.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    env.deal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    env.recipients.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-text-secondary text-text-secondary">Pending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Sent</Badge>;
      case 'signed':
        return <Badge variant="outline" className="border-green-500 text-green-500">Signed</Badge>;
      case 'declined':
        return <Badge variant="outline" className="border-red-500 text-red-500">Declined</Badge>;
      default:
        return <Badge variant="outline" className="border-text-secondary text-text-secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>e-Signature</h1>
        <Button
          onClick={() => {}}
          style={{
            background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
            color: 'white',
            boxShadow: 'var(--shadow-neon)'
          }}
        >
          Send for Signature
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search envelopes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            borderColor: 'var(--border-dark)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-dark-card-hover mb-4">
          <TabsTrigger value="all">All Envelopes</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="signed">Signed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>All Envelopes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Created</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Recipients</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Deal</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnvelopes.map((env) => (
                      <tr
                        key={env.id}
                        style={{
                          borderBottom: '1px solid var(--border-dark)',
                          transition: 'background-color 0.2s ease'
                        }}
                        className="hover:bg-opacity-50"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                        }}
                      >
                        <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{env.name}</td>
                        <td className="py-3 px-4">{getStatusBadge(env.status)}</td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{env.created}</td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                          {env.recipients.map((r, i) => (
                            <div key={i}>{r}</div>
                          ))}
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{env.deal}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              style={{
                                borderColor: 'var(--border-dark)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              View
                            </Button>
                            {env.status === 'signed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                Download
                              </Button>
                            )}
                            {(env.status === 'pending' || env.status === 'sent') && (
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                Remind
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Pending Envelopes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Created</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Recipients</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Deal</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnvelopes.filter(env => env.status === 'pending').map((env) => (
                      <tr key={env.id} className="border-b border-dark-border hover:bg-dark-card-hover">
                        <td className="py-3 px-4 text-white">{env.name}</td>
                        <td className="py-3 px-4 text-text-secondary">{env.created}</td>
                        <td className="py-3 px-4 text-text-secondary">
                          {env.recipients.map((r, i) => (
                            <div key={i}>{r}</div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{env.deal}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-dark-border text-text-secondary">
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="border-dark-border text-text-secondary">
                              Send
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-0">
          <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Sent Envelopes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Created</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Recipients</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Deal</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnvelopes.filter(env => env.status === 'sent').map((env) => (
                      <tr key={env.id} className="border-b border-dark-border hover:bg-dark-card-hover">
                        <td className="py-3 px-4 text-white">{env.name}</td>
                        <td className="py-3 px-4 text-text-secondary">{env.created}</td>
                        <td className="py-3 px-4 text-text-secondary">
                          {env.recipients.map((r, i) => (
                            <div key={i}>{r}</div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{env.deal}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-dark-border text-text-secondary">
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="border-dark-border text-text-secondary">
                              Remind
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signed" className="mt-0">
          <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Signed Envelopes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Created</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Recipients</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Deal</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnvelopes.filter(env => env.status === 'signed').map((env) => (
                      <tr key={env.id} className="border-b border-dark-border hover:bg-dark-card-hover">
                        <td className="py-3 px-4 text-white">{env.name}</td>
                        <td className="py-3 px-4 text-text-secondary">{env.created}</td>
                        <td className="py-3 px-4 text-text-secondary">
                          {env.recipients.map((r, i) => (
                            <div key={i}>{r}</div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{env.deal}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-dark-border text-text-secondary">
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="border-dark-border text-text-secondary">
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
