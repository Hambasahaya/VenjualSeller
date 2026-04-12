'use client';

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  logo,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          {logo && <div className="mb-4 flex justify-center">{logo}</div>}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-blue-200 text-sm md:text-base">{subtitle}</p>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8">{children}</div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <p className="text-blue-200 text-xs md:text-sm">
            © 2026 Venjual. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
