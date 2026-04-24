'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, User, Bell, LogOut } from 'lucide-react';
import { logoutUser } from '@/lib/services';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

export default function Header({
  userName = 'John Doe',
  userEmail = 'partner@venjual.com',
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logoutUser();
    } finally {
      window.location.replace('/auth/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 md:py-4 shadow-md">
      <div className="max-w-7xl mx-auto relative">
        {/* Logo and User Profile */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm md:text-base">PV</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold">Partner Venjual</h1>
              <p className="text-xs md:text-sm text-blue-100">Portal Mitra</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/notifications" className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
            <button
              type="button"
              ref={buttonRef}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="header-user-menu"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg transition-colors"
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
              <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari bisnis, transaksi, atau notifikasi..."
            className="w-full px-4 py-2 md:py-2.5 rounded-lg bg-blue-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm md:text-base"
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {menuOpen && (
          <div
            ref={menuRef}
            id="header-user-menu"
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-900 rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <Link
              href="/dashboard/account"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 text-gray-500" />
              Profil Saya
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
