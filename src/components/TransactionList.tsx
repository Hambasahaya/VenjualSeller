'use client';

import React, { useState } from 'react';
import { MapPin, TrendingUp, AlertCircle } from 'lucide-react';

export interface Transaction {
  id: string;
  type: 'vending' | 'locker';
  name: string;
  location: string;
  address: string;
  amount: string;
  commission: string;
  status: 'Aktif' | 'Maintenance' | 'Inactive';
  statusBg: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

type TransactionType = Transaction['type'];

export default function TransactionList({ transactions }: TransactionListProps) {
  const [selectedTab, setSelectedTab] = useState<'vending' | 'locker'>(
    'vending'
  );
  const vendingCount = transactions.filter((t) => t.type === 'vending').length;
  const lockerCount = transactions.filter((t) => t.type === 'locker').length;

  const tabs = [
    {
      id: 'vending',
      label: 'Vending',
      count: vendingCount,
    },
    {
      id: 'locker',
      label: 'Locker Laundry',
      count: lockerCount,
    },
  ];

  const selectedTabCount = selectedTab === 'vending' ? vendingCount : lockerCount;
  const activeTab =
    selectedTabCount > 0 || transactions.length === 0
      ? selectedTab
      : vendingCount > 0
        ? 'vending'
        : 'locker';
  const filtered = transactions.filter((t) => t.type === activeTab);

  return (
    <div className="px-4 md:px-6 py-4 md:py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-4">
          Daftar Transaksi
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 border-b border-gray-200 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as TransactionType)}
              className={`pb-2 px-2 md:px-4 text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} <span className="text-gray-500">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Transaction Items */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base text-gray-900">
                      {transaction.id}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-xs md:text-sm text-gray-600">
                        {transaction.address}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${transaction.statusBg}`}
                  >
                    {transaction.status}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Pendapatan Harian Ini</p>
                    <p className="font-bold text-sm md:text-base text-gray-900">
                      {transaction.amount}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Komisi</p>
                      <p className="font-semibold text-sm md:text-base text-green-600">
                        {transaction.commission}
                      </p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Tidak ada transaksi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
