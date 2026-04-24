'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, DollarSign, TrendingUp, Zap, Package } from 'lucide-react';

export interface Machine {
  id: string;
  routeId?: string;
  type: 'vending' | 'locker';
  machineTypeLabel?: string;
  name: string;
  location: string;
  address: string;
  dailyEarning: string;
  commission: string;
  commissionAmount: string;
  transactions: number;
  capacity: number;
  utilities: number;
  status: 'Aktif' | 'Maintenance' | 'Inactive';
  image?: string;
}

interface MachineCardProps {
  machine: Machine;
}

export default function MachineCard({ machine }: MachineCardProps) {
  const router = useRouter();
  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-700';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'vending':
        return '🤖';
      case 'locker':
        return '🏢';
      default:
        return '📦';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
      {/* Image Placeholder */}
      <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden flex items-center justify-center border-b border-gray-200">
        <div className="text-6xl">{getMachineIcon(machine.type)}</div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              📦 {machine.machineTypeLabel || machine.id}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{machine.name}</p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getStatusBg(
              machine.status
            )}`}
          >
            {machine.status}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600">{machine.location}</p>
            <p className="text-xs text-gray-500">Jl. {machine.address}</p>
          </div>
        </div>

        <hr className="my-3" />

        {/* Earnings Section */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Pendapatan</p>
            <p className="font-bold text-gray-900">{machine.dailyEarning}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Transaksi</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className="font-bold text-gray-900">{machine.transactions} kali</p>
            </div>
          </div>
        </div>

        {/* Commission */}
        <div className="bg-green-50 rounded-lg p-2 mb-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">Komisi Hari Ini</p>
            <p className="text-xs font-semibold text-green-700">{machine.commission}</p>
          </div>
          <p className="text-sm font-bold text-green-700">+ {machine.commissionAmount}</p>
        </div>

        {/* Capacity & Utilities */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Kapasitas</p>
              <p className="font-semibold text-gray-900">{machine.capacity} Item</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Utilitas</p>
              <p className="font-semibold text-gray-900">{machine.utilities}%</p>
            </div>
          </div>
        </div>

        {/* Detail Button */}
        <button 
          onClick={() => router.push(`/dashboard/mesin/${machine.routeId || machine.id}`)}
          className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          ⓘ Lihat Detail
        </button>
      </div>
    </div>
  );
}
