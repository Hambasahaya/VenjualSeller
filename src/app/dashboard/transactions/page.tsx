'use client';

import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Calendar, Filter } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TransactionsPage() {
  const [selectedDate, setSelectedDate] = useState('2026-04-12');
  type FilterKey = 'semua' | 'vending' | 'laundry' | 'space';
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    semua: true,
    vending: false,
    laundry: false,
    space: false,
  });

  // Dummy data untuk chart
  const chartData = {
    labels: ['14 Jan', '15 Jan', '16 Jan', '17 Jan', '18 Jan', '19 Jan', '20 Jan'],
    datasets: [
      {
        label: 'Transaksi',
        data: [12000, 19000, 15000, 22000, 18000, 25000, 20000],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Komisi',
        data: [2400, 3800, 3000, 4400, 3600, 5000, 4000],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
            weight: 'normal' as const,
          },
          color: '#6b7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 30000,
        ticks: {
          callback: function (value: any) {
            return 'Rp ' + (value / 1000).toLocaleString('id-ID') + 'k';
          },
          font: {
            size: 11,
          },
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
          color: '#9ca3af',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const handleFilterChange = (key: FilterKey) => {
    if (key === 'semua') {
      setFilters({
        semua: !filters.semua,
        vending: false,
        laundry: false,
        space: false,
      });
    } else {
      setFilters({
        ...filters,
        [key]: !filters[key],
        semua: false,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="transactions" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Transsaksi
              </h1>

              {/* Date Picker */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{formatDate(selectedDate)}</p>
              </div>

              {/* Filter Jenis Mesin */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">Filter Jenis Mesin</h3>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.semua}
                      onChange={() => handleFilterChange('semua')}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Semua</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.vending}
                      onChange={() => handleFilterChange('vending')}
                      disabled={filters.semua}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">Mesin Venjual</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.laundry}
                      onChange={() => handleFilterChange('laundry')}
                      disabled={filters.semua}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">Locker Laundry</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.space}
                      onChange={() => handleFilterChange('space')}
                      disabled={filters.semua}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">Locker Space</span>
                  </label>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Total Transsaksi */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-xs text-gray-500 mb-2">Total Transsaksi</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Rp {chartData.datasets[0].data.reduce((a, b) => a + (b as number), 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">{chartData.datasets[0].data.length} transaksi</p>
                </div>

                {/* Total Komisi */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-xs text-gray-500 mb-2">Total Komisi</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                    Rp {chartData.datasets[1].data.reduce((a, b) => a + (b as number), 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">{chartData.datasets[1].data.length} transaksi</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-6">
                  Grafik Transsaksi 7 Hari Terakhir
                </h3>

                <div className="w-full h-80">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Daftar Transaksi */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Daftar Transsaksi
                  </h3>
                  <span className="text-xs text-blue-600 font-semibold">0 transsaksi</span>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm text-gray-500">Tidak ada transaksi</p>
                  <p className="text-xs text-gray-400 mt-1">Belum ada data transaksi untuk tanggal yang dipilih</p>
                </div>

                {/* Print Button */}
                <button className="w-full mt-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2h-2m-4-4V9m0 4v8m0-8h4m-4 0H9" />
                  </svg>
                  Cetak Laporan Transsaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="transactions" />
    </div>
  );
}
