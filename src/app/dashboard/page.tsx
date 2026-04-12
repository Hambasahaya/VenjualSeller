'use client';

import React from 'react';
import Header from '@/components/Header';
import BalanceCards from '@/components/BalanceCards';
import TransactionList, { Transaction } from '@/components/TransactionList';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  // Mock transaction data
  const transactions: Transaction[] = [
    {
      id: 'VM-JKT-001',
      type: 'vending',
      name: 'Vending Kopi',
      location: 'Mall Central Park Lt. 1',
      address: 'Mall Central Park Lt. 1',
      amount: 'Rp 450.000',
      commission: '20%',
      status: 'Aktif',
      statusBg: 'bg-green-100 text-green-700',
    },
    {
      id: 'VM-JKT-002',
      type: 'vending',
      name: 'Vending Snack',
      location: 'Gedung Perkantoran Sudirman',
      address: 'Gedung Perkantoran Sudirman',
      amount: 'Rp 380.000',
      commission: '10%',
      status: 'Aktif',
      statusBg: 'bg-green-100 text-green-700',
    },
    {
      id: 'VM-JKT-003',
      type: 'vending',
      name: 'Vending Minuman',
      location: 'Universitas Indonesia',
      address: 'Universitas Indonesia',
      amount: 'Rp 0',
      commission: '20%',
      status: 'Maintenance',
      statusBg: 'bg-yellow-100 text-yellow-700',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar active="home" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header userName="Pemilik Meja Pintar" userRole="Partner" />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {/* Balance Cards */}
          <BalanceCards
            digitalBalance="Rp 3.750.000"
            commissionBalance="Rp 235.000"
          />

          {/* Transaction List */}
          <TransactionList transactions={transactions} />
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav active="home" />
    </div>
  );
}
