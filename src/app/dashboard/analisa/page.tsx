'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Calendar, TrendingUp, MapPin, Package } from 'lucide-react';

interface LocationData {
  rank: number;
  name: string;
  transactions: number;
  amount: string;
  growth: string;
}

interface ProductData {
  rank: number;
  name: string;
  sold: number;
  amount: string;
  growth: string;
}

export default function AnalisisPage() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [activeCategory, setActiveCategory] = useState<'vending' | 'laundry' | 'space' | 'pelanggan'>('vending');

  // Mock data for top locations
  const topLocations: LocationData[] = [
    {
      rank: 1,
      name: 'Bandara Soekarno-Hatta T3',
      transactions: 155,
      amount: 'Rp 4,2 Jt',
      growth: '+12%',
    },
    {
      rank: 2,
      name: 'Plaza Indonesia Lt. 2',
      transactions: 142,
      amount: 'Rp 3,8 Jt',
      growth: '+12%',
    },
    {
      rank: 3,
      name: 'Stadion MRT Bundaran HI',
      transactions: 128,
      amount: 'Rp 3,5 Jt',
      growth: '+12%',
    },
    {
      rank: 4,
      name: 'Grand Indonesia Lt. I',
      transactions: 104,
      amount: 'Rp 2,9 Jt',
      growth: '+12%',
    },
    {
      rank: 5,
      name: 'Mall Taman Anggrek Lt. 3',
      transactions: 87,
      amount: 'Rp 2,4 Jt',
      growth: '+12%',
    },
  ];

  // Mock data for top products
  const topProducts: ProductData[] = [
    {
      rank: 1,
      name: 'Minuman Energi',
      sold: 342,
      amount: 'Rp 5,1 Jt',
      growth: '+18%',
    },
    {
      rank: 2,
      name: 'Snack Ringan',
      sold: 298,
      amount: 'Rp 4,2 Jt',
      growth: '+14%',
    },
    {
      rank: 3,
      name: 'Kopi Instan',
      sold: 267,
      amount: 'Rp 3,8 Jt',
      growth: '+10%',
    },
    {
      rank: 4,
      name: 'Roti & Pastry',
      sold: 156,
      amount: 'Rp 2,8 Jt',
      growth: '+8%',
    },
    {
      rank: 5,
      name: 'Permen & Coklat',
      sold: 142,
      amount: 'Rp 2,1 Jt',
      growth: '+5%',
    },
  ];

  // Mock data for daily sales
  const dailySalesData = [
    { date: '1 Jan', amount: 1200000 },
    { date: '5 Jan', amount: 1800000 },
    { date: '10 Jan', amount: 2100000 },
    { date: '15 Jan', amount: 1900000 },
    { date: '20 Jan', amount: 2400000 },
    { date: '25 Jan', amount: 2200000 },
    { date: '31 Jan', amount: 2800000 },
  ];

  const maxAmount = Math.max(...dailySalesData.map((d) => d.amount));

  const categories = [
    { id: 'vending', label: 'Venjual' },
    { id: 'laundry', label: 'Laundry' },
    { id: 'space', label: 'Space' },
    { id: 'pelanggan', label: 'Pelanggan' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="analisa" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Pemilik Mesin" userRole="Partner" />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Analisa Terlaris
                </h1>
                <p className="text-gray-600">
                  Data transaksi tertinggi periode terpilih
                </p>
              </div>

              {/* Filter Periode */}
              <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Filter Periode
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-blue-700 font-medium">
                    {startDate} - {endDate}
                  </p>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors text-sm ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Top Locations */}
              <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Lokasi Terlaris
                  </h2>
                </div>

                <div className="space-y-3">
                  {topLocations.map((location) => (
                    <div
                      key={location.rank}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {location.rank}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          {location.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">
                          {location.transactions} transaksi
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm md:text-base">
                          {location.amount}
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          {location.growth}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Produk Dagangan Terlaris
                  </h2>
                </div>

                <div className="space-y-3">
                  {topProducts.map((product) => (
                    <div
                      key={product.rank}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">
                            {product.rank}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          {product.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">
                          {product.sold} terjual
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm md:text-base">
                          {product.amount}
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          {product.growth}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales Chart */}
              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Grafik Penjualan Harian
                  </h2>
                </div>

                <div className="h-64 flex items-end justify-around gap-2 p-4 bg-gray-50 rounded-lg">
                  {dailySalesData.map((data, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2 flex-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all hover:from-purple-600 hover:to-purple-500 cursor-pointer"
                        style={{
                          height: `${(data.amount / maxAmount) * 100}%`,
                          minHeight: '20px',
                        }}
                        title={`Rp ${(data.amount / 1000000).toFixed(1)}Jt`}
                      />
                      <p className="text-xs text-gray-600 text-center">
                        {data.date}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="font-bold text-blue-600">
                      Rp {(dailySalesData.reduce((sum, d) => sum + d.amount, 0) / 1000000).toFixed(1)}Jt
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Rata-rata</p>
                    <p className="font-bold text-green-600">
                      Rp {(dailySalesData.reduce((sum, d) => sum + d.amount, 0) / dailySalesData.length / 1000000).toFixed(1)}Jt
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Tertinggi</p>
                    <p className="font-bold text-purple-600">
                      Rp {(maxAmount / 1000000).toFixed(1)}Jt
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="analisa" />
    </div>
  );
}
