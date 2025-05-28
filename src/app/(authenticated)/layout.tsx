'use client';

import React from 'react';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // Use shadcn sidebar components
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthRedirect();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        {/* Or a more sophisticated loading skeleton for the whole layout */}
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // The useAuthRedirect hook handles redirection, so this is a fallback or can be removed
    // if redirection is consistently handled by the hook.
    // To prevent flash of content, ensure hook redirects before rendering.
    return null; 
  }

  return (
    <SidebarProvider defaultOpen={true}> {/* Manage sidebar state */}
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset> {/* Main content area that adjusts to sidebar */}
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
