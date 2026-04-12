'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  User,
  ChevronDown,
  LogOut,
  Package,
  BarChart3,
  Send,
} from 'lucide-react';

interface SidebarProps {
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

export default function Sidebar({ active = 'home' }: SidebarProps) {
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
    {
      id: 'account',
      label: 'Akun Saya',
      icon: User,
      href: '/dashboard/account',
    },
  ];

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              PV
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Partner Venjual</h1>
              <p className="text-xs text-gray-500">Portal Mitra</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">John Doe</p>
                <p className="text-xs text-gray-500">Partner</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>

          <button className="w-full mt-2 flex items-center gap-2 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
