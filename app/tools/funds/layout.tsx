import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fund Management | QAPT',
  description: 'Create and manage your investment funds',
};

export default function FundsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-8">
        {children}
      </main>
    </div>
  );
}
