'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Calendar, TrendingUp, MapPin, Package, Loader2 } from 'lucide-react';
import { getCurrentMerchantTransactionSummary, TransactionSummary } from '@/lib/services/merchant';
import { ApiError } from '@/lib/services/api';
import {
  getCurrentMerchantDailySales,
  getCurrentMerchantTopLocations,
  getCurrentMerchantTopProducts,
  DailySale,
  TopLocation,
  TopProduct,
} from '@/lib/services';

function emptySummary(): TransactionSummary {
  return {
    merchant_id: '',
    total_transactions: 0,
    total_amount: 0,
    completed_transactions: 0,
    completed_amount: 0,
    pending_transactions: 0,
    pending_amount: 0,
    failed_transactions: 0,
    failed_amount: 0,
    average_transaction: 0,
    period: '',
  };
}

async function safeFetch<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

interface LocationData {
  rank: number;
  name: string;
  transactions: number;
  amount: number;
  growth: string;
}

interface ProductData {
  rank: number;
  name: string;
  sold: number;
  amount: number;
  growth: string;
}

function formatCompactCurrency(value: number) {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })} Jt`;
  }

  return `Rp ${value.toLocaleString('id-ID')}`;
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function mapLocation(location: TopLocation, index: number): LocationData {
  return {
    rank: location.rank ?? index + 1,
    name: location.location_name || location.name || location.address || '-',
    transactions: toNumber(location.total_transactions ?? location.transactions),
    amount: toNumber(location.total_amount ?? location.amount),
    growth:
      location.growth !== undefined && location.growth !== ''
        ? String(location.growth)
        : '-',
  };
}

function mapProduct(product: TopProduct, index: number): ProductData {
  return {
    rank: product.rank ?? index + 1,
    name: product.product_name || product.name || '-',
    sold: toNumber(product.total_sold ?? product.sold ?? product.transactions),
    amount: toNumber(product.total_amount ?? product.amount),
    growth:
      product.growth !== undefined && product.growth !== ''
        ? String(product.growth)
        : '-',
  };
}

export default function AnalisisPage() {
  type CategoryId = 'vending' | 'locker' | 'pelanggan';
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2026-04-21');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('vending');
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [topLocations, setTopLocations] = useState<LocationData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);
  const [dailySalesData, setDailySalesData] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const machineTypeCode =
    activeCategory === 'vending'
      ? 'VMJ'
      : activeCategory === 'locker'
          ? 'LOCKERLOUNDRY'
          : undefined;

  const analyticsParams = useMemo(
    () => ({
      date_from: startDate,
      date_to: endDate,
      ...(machineTypeCode ? { machine_type_code: machineTypeCode } : {}),
    }),
    [endDate, machineTypeCode, startDate]
  );

  // Fetch analytics data whenever filters change.
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const [summaryData, locationData, productData, salesData] =
          await Promise.all([
            safeFetch(
              getCurrentMerchantTransactionSummary(analyticsParams),
              emptySummary()
            ),
            safeFetch(
              getCurrentMerchantTopLocations({ ...analyticsParams, limit: 10 }),
              []
            ),
            safeFetch(
              getCurrentMerchantTopProducts({ ...analyticsParams, limit: 10 }),
              []
            ),
            safeFetch(getCurrentMerchantDailySales(analyticsParams), []),
          ]);

        setSummary(summaryData);
        setTopLocations(locationData.map(mapLocation));
        setTopProducts(productData.map(mapProduct));
        setDailySalesData(salesData);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Gagal memuat data analisa');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [analyticsParams]);

  const maxAmount = Math.max(
    1,
    ...dailySalesData.map((d) => toNumber(d.total_amount ?? d.amount))
  );

  const categories: Array<{ id: CategoryId; label: string }> = [
    { id: 'vending', label: 'Vending Machine' },
    { id: 'locker', label: 'Locker Laundry' },
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

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-gray-600">Memuat data analisa...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Summary Stats */}
              {!loading && summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.total_transactions}</p>
                    <p className="text-xs text-gray-500 mt-2">Transaksi berhasil</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-green-600">Rp {summary.total_amount.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 mt-2">Dari semua transaksi</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xs text-gray-500 mb-1">Transaksi Berhasil</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.completed_transactions}</p>
                    <p className="text-xs text-gray-500 mt-2">Status completed</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xs text-gray-500 mb-1">Rata-rata Transaksi</p>
                    <p className="text-2xl font-bold text-purple-600">Rp {Math.round(summary.average_transaction).toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 mt-2">Per transaksi</p>
                  </div>
                </div>
              )}

              {!loading && !error && (
                <>
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
                        onClick={() => setActiveCategory(cat.id)}
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
                  {topLocations.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Belum ada data lokasi untuk periode ini.
                    </p>
                  )}
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
                          {formatCompactCurrency(location.amount)}
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
                  {topProducts.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Belum ada data produk untuk periode ini.
                    </p>
                  )}
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
                          {formatCompactCurrency(product.amount)}
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
                  {dailySalesData.length === 0 && (
                    <p className="self-center text-sm text-gray-500">
                      Belum ada data penjualan harian.
                    </p>
                  )}
                  {dailySalesData.map((data, idx) => {
                    const amount = toNumber(data.total_amount ?? data.amount);

                    return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2 flex-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all hover:from-purple-600 hover:to-purple-500 cursor-pointer"
                        style={{
                          height: `${(amount / maxAmount) * 100}%`,
                          minHeight: '20px',
                        }}
                        title={formatCompactCurrency(amount)}
                      />
                      <p className="text-xs text-gray-600 text-center">
                        {data.date}
                      </p>
                    </div>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="font-bold text-blue-600">
                      {formatCompactCurrency(
                        dailySalesData.reduce(
                          (sum, d) => sum + toNumber(d.total_amount ?? d.amount),
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Rata-rata</p>
                    <p className="font-bold text-green-600">
                      {formatCompactCurrency(
                        dailySalesData.length > 0
                          ? dailySalesData.reduce(
                              (sum, d) =>
                                sum + toNumber(d.total_amount ?? d.amount),
                              0
                            ) / dailySalesData.length
                          : 0
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Tertinggi</p>
                    <p className="font-bold text-purple-600">
                      {formatCompactCurrency(maxAmount)}
                    </p>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="analisa" />
    </div>
  );
}
