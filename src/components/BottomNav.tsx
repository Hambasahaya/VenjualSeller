'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  Users,
  Bell,
  User,
  BarChart3,
  Package,
  Send,
} from 'lucide-react';

interface BottomNavProps {
  active?:
    | 'home'
    | 'transactions'
    | 'mesin'
    | 'analisa'
    | 'ajukan'
    | 'account'
    | 'notifications'
    | 'partners';
}

export default function BottomNav({ active = 'home' }: BottomNavProps) {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/dashboard',
    },
    {
      id: 'transactions',
      label: 'Transaksi',
      icon: FileText,
      href: '/dashboard/transactions',
    },
    {
      id: 'mesin',
      label: 'Mesin',
      icon: Package,
      href: '/dashboard/mesin',
    },
    {
      id: 'analisa',
      label: 'Analisa',
      icon: BarChart3,
      href: '/dashboard/analisa',
    },
    {
      id: 'ajukan',
      label: 'Ajukan',
      icon: Send,
      href: '/dashboard/ajukan',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl md:hidden z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
