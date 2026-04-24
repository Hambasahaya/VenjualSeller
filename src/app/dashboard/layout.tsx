'use client';

import React from 'react';
import { useRequireAuth } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const checkingSession = useRequireAuth();

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
