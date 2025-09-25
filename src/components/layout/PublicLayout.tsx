import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { Footer } from '@/components/layout/Footer';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavigation />
      
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      
      <Footer />
    </div>
  );
};