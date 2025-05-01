import { Metadata } from 'next';
import Header from '../components/Header';

export const metadata: Metadata = {
  title: 'Funds | QAPT',
  description: 'Manage and optimize your funds',
};

export default function FundsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Funds" />
      <main className="flex-1 pb-8">
        {children}
      </main>
    </div>
  );
}
