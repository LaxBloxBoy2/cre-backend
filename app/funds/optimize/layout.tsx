import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fund Optimizer | QAPT',
  description: 'Optimize your fund performance using AI simulation and reinforcement learning',
};

export default function FundOptimizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {children}
    </div>
  );
}
