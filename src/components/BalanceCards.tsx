'use client';

import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';

interface BalanceCardProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  bgGradient: string;
  trend?: string;
}

export function BalanceCard({
  title,
  amount,
  icon,
  bgGradient,
  trend,
}: BalanceCardProps) {
  return (
    <div className={`${bgGradient} rounded-2xl p-4 md:p-6 text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs md:text-sm opacity-90 font-medium">{title}</p>
          <p className="text-xl md:text-2xl font-bold mt-1">{amount}</p>
        </div>
        <div className="p-2 md:p-3 bg-white bg-opacity-20 rounded-lg">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs md:text-sm opacity-90">
          <TrendingUp className="w-4 h-4" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

interface BalanceCardsProps {
  digitalBalance?: string;
  commissionBalance?: string;
}

export default function BalanceCards({
  digitalBalance = 'Rp 3.750.000',
  commissionBalance = 'Rp 235.000',
}: BalanceCardsProps) {
  return (
    <div className="px-4 md:px-6 py-4 md:py-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-sm md:text-base font-semibold text-gray-700 mb-3">
          Beranda
        </h2>
        <p className="text-xs md:text-sm text-gray-500 mb-4">
          Selamat datang kembali!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BalanceCard
            title="Saldo Digital"
            amount={digitalBalance}
            icon={<DollarSign className="w-6 h-6 md:w-7 md:h-7" />}
            bgGradient="bg-gradient-to-br from-purple-500 to-purple-600"
            trend="Komisi baru tersedia"
          />
          <BalanceCard
            title="Komisi Hist Ini"
            amount={commissionBalance}
            icon={<TrendingUp className="w-6 h-6 md:w-7 md:h-7" />}
            bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
            trend="Belum ditarik"
          />
        </div>
      </div>
    </div>
  );
}
