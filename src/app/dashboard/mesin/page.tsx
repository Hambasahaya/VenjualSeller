'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import MachineCard, { Machine } from '@/components/MachineCard';
import { Filter, Search, Plus } from 'lucide-react';

export default function MesinPage() {
  const [activeFilter, setActiveFilter] = useState<'semua' | 'vending' | 'laundry' | 'space'>('semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock machine data
  const machines: Machine[] = [
    {
      id: 'VM-JKT-001',
      type: 'vending',
      name: 'Reguler Vending Machine',
      location: 'Mall Central Park Lt. 1',
      address: 'Latien S. Parman, Jakarta Barat',
      dailyEarning: 'Rp 450.000',
      commission: '20%',
      commissionAmount: 'Rp 90.000',
      transactions: 32,
      capacity: 60,
      utilities: 73,
      status: 'Aktif',
    },
    {
      id: 'VM-JKT-002',
      type: 'vending',
      name: 'Premium Vending Machine',
      location: 'Gedung Perkantoran Sudirman',
      address: 'Jl. Sudirman, Jakarta Pusat',
      dailyEarning: 'Rp 380.000',
      commission: '10%',
      commissionAmount: 'Rp 38.000',
      transactions: 28,
      capacity: 60,
      utilities: 65,
      status: 'Aktif',
    },
    {
      id: 'LM-JKT-003',
      type: 'laundry',
      name: 'Mesin Laundry Otomatis',
      location: 'Universitas Indonesia',
      address: 'Depok, Jawa Barat',
      dailyEarning: 'Rp 520.000',
      commission: '15%',
      commissionAmount: 'Rp 78.000',
      transactions: 24,
      capacity: 8,
      utilities: 82,
      status: 'Aktif',
    },
    {
      id: 'SP-JKT-004',
      type: 'space',
      name: 'Locker Space Premium',
      location: 'Mall Grand Indonesia',
      address: 'Jl. M.H Thamrin, Jakarta Pusat',
      dailyEarning: 'Rp 650.000',
      commission: '18%',
      commissionAmount: 'Rp 117.000',
      transactions: 42,
      capacity: 20,
      utilities: 78,
      status: 'Maintenance',
    },
    {
      id: 'VM-JKT-005',
      type: 'vending',
      name: 'Vending Minuman',
      location: 'Universitas Gadjah Mada',
      address: 'Bulaksumur, Yogyakarta',
      dailyEarning: 'Rp 410.000',
      commission: '20%',
      commissionAmount: 'Rp 82.000',
      transactions: 31,
      capacity: 60,
      utilities: 71,
      status: 'Aktif',
    },
    {
      id: 'LM-JKT-006',
      type: 'laundry',
      name: 'Laundry Koin Express',
      location: 'Mall Taman Anggrek',
      address: 'Jl. Letjen S. Parman, Jakarta Barat',
      dailyEarning: 'Rp 480.000',
      commission: '15%',
      commissionAmount: 'Rp 72.000',
      transactions: 20,
      capacity: 6,
      utilities: 68,
      status: 'Aktif',
    },
  ];

  // Filter machines
  const filteredMachines = machines.filter((machine) => {
    const matchesFilter =
      activeFilter === 'semua' || machine.type === activeFilter;
    const matchesSearch =
      machine.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => m.status === 'Aktif').length;
  const totalDailyEarning = machines.reduce((sum, m) => {
    const amount = parseInt(m.dailyEarning.replace(/\D/g, ''));
    return sum + amount;
  }, 0);

  const filterTabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'vending', label: 'Vending' },
    { id: 'laundry', label: 'Laundry' },
    { id: 'space', label: 'Space' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="home" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Pemilik Mesin" userRole="Partner" />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Daftar Mesin
                </h1>
                <p className="text-gray-600">
                  Kelola dan monitor semua mesin bisnis Anda
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Mesin</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-900">
                      {totalMachines}
                    </h3>
                    <span className="text-sm text-green-600 font-medium">
                      {activeMachines} aktif
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <p className="text-sm text-gray-600 mb-2">Pendapatan Hari Ini</p>
                  <h3 className="text-3xl font-bold text-blue-600">
                    Rp {(totalDailyEarning / 1000000).toFixed(1)}M
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Dari {machines.length} mesin aktif
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Komisi</p>
                  <h3 className="text-3xl font-bold text-green-600">
                    Rp {Math.round(totalDailyEarning * 0.18 / 1000)}K
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Belum ditarik
                  </p>
                </div>
              </div>

              {/* Filter Section */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari mesin, lokasi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    />
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-2 overflow-x-auto md:overflow-visible">
                    {filterTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setActiveFilter(
                            tab.id as 'semua' | 'vending' | 'laundry' | 'space'
                          )
                        }
                        className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                          activeFilter === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Machines Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMachines.length > 0 ? (
                  filteredMachines.map((machine) => (
                    <MachineCard key={machine.id} machine={machine} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg">
                      Tidak ada mesin ditemukan
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Silakan ubah filter atau cari istilah lain
                    </p>
                  </div>
                )}
              </div>

              {/* Add Machine Button */}
              <div className="flex justify-center mt-8">
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md">
                  <Plus className="w-5 h-5" />
                  Tambah Mesin Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
