import React from 'react';
import { CommandMenu } from './CommandMenu';
import { Header } from './Header';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function PageLayout({ children, title, subtitle }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <CommandMenu />
      <Header title={title} subtitle={subtitle} />
      <main className="pt-16 min-h-screen relative">
        {children}
      </main>
    </div>
  );
}
