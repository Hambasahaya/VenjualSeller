'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  TooltipItem,
} from 'chart.js';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Calendar, Filter } from 'lucide-react';
import { DEFAULT_COMMISSION_PERCENTAGE } from '@/lib/commission';
import {
  getCurrentMerchantHistory,
  getCurrentMerchantTransactionSummary,
  ApiError,
  Transaction as MerchantTransaction,
  TransactionSummary,
} from '@/lib/services';

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

const COMMISSION_RATE = DEFAULT_COMMISSION_PERCENTAGE / 100;

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function getTransactionAmount(transaction: MerchantTransaction) {
  const rawTransaction = transaction as MerchantTransaction & {
    total_amount?: number | string;
    paid_amount?: number | string;
    gross_amount?: number | string;
    transaction_amount?: number | string;
    payment_amount?: number | string;
    nominal?: number | string;
    price?: number | string;
    product_price?: number | string;
    quantity?: number | string;
    qty?: number | string;
    payment?: {
      amount?: number | string;
      total_amount?: number | string;
      gross_amount?: number | string;
    };
    payload?: {
      amount?: number | string;
      status?: string;
      machine_type?: string;
      machine_type_code?: string;
    };
    product?: {
      price?: number | string;
      default_price?: number | string;
    };
  };
  const quantity = toNumber(rawTransaction.quantity ?? rawTransaction.qty) || 1;
  const productPrice = toNumber(
    rawTransaction.product_price ??
      rawTransaction.price ??
      rawTransaction.product?.price ??
      rawTransaction.product?.default_price
  );

  return (
    toNumber(
      rawTransaction.amount ??
        rawTransaction.total_amount ??
        rawTransaction.paid_amount ??
        rawTransaction.gross_amount ??
        rawTransaction.transaction_amount ??
        rawTransaction.payment_amount ??
        rawTransaction.nominal ??
        rawTransaction.payload?.amount ??
        rawTransaction.payment?.amount ??
        rawTransaction.payment?.total_amount ??
        rawTransaction.payment?.gross_amount
    ) || productPrice * quantity
  );
}

type MachineFilter = 'semua' | 'vending' | 'locker';

function getTransactionMachineType(transaction: MerchantTransaction) {
  const rawTransaction = transaction as MerchantTransaction & {
    machine_type?: string;
    mechine_type?: string;
    mechine_type_code?: string;
    jenis_mesin?: string;
    payload?: {
      machine_type?: string;
      machine_type_code?: string;
      mechine_type?: string;
      mechine_type_code?: string;
    };
  };

  return String(
    rawTransaction.machine_type_code ??
      rawTransaction.mechine_type_code ??
      rawTransaction.machine_type ??
      rawTransaction.mechine_type ??
      rawTransaction.jenis_mesin ??
      rawTransaction.payload?.machine_type_code ??
      rawTransaction.payload?.mechine_type_code ??
      rawTransaction.payload?.machine_type ??
      rawTransaction.payload?.mechine_type ??
      ''
  )
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}

function matchesMachineFilter(
  transaction: MerchantTransaction,
  filter: MachineFilter
) {
  if (filter === 'semua') {
    return true;
  }

  const machineType = getTransactionMachineType(transaction);

  if (!machineType) {
    return false;
  }

  if (filter === 'vending') {
    return ['vmj', 'vending', 'vendingmachine', 'mesinvenjual'].includes(
      machineType
    );
  }

  return ['locker', 'lockerlaundry', 'lockerlaunndry', 'lockerloundry', 'sls'].includes(
    machineType
  );
}

function filterTransactionsByMachine(
  transactions: MerchantTransaction[],
  filter: MachineFilter,
  summaryTransactionCount?: number
) {
  if (filter === 'semua') {
    return transactions;
  }

  const hasMachineType = transactions.some((tx) => getTransactionMachineType(tx));
  if (!hasMachineType) {
    return filter === 'locker' && summaryTransactionCount && summaryTransactionCount > 0
      ? transactions
      : [];
  }

  return transactions.filter((tx) => matchesMachineFilter(tx, filter));
}

function isCompletedTransaction(status: MerchantTransaction['status']) {
  return status === 'completed';
}

function buildSummaryFromTransactions(
  transactions: MerchantTransaction[],
  selectedDate: string
): TransactionSummary {
  const completedTransactions = transactions.filter((tx) =>
    isCompletedTransaction(tx.status)
  );
  const pendingTransactions = transactions.filter((tx) => tx.status === 'pending');
  const failedTransactions = transactions.filter((tx) => tx.status === 'failed');
  const totalAmount = transactions.reduce(
    (sum, tx) => sum + getTransactionAmount(tx),
    0
  );
  const completedAmount = completedTransactions.reduce(
    (sum, tx) => sum + getTransactionAmount(tx),
    0
  );
  const pendingAmount = pendingTransactions.reduce(
    (sum, tx) => sum + getTransactionAmount(tx),
    0
  );
  const failedAmount = failedTransactions.reduce(
    (sum, tx) => sum + getTransactionAmount(tx),
    0
  );

  return {
    merchant_id: '',
    total_transactions: transactions.length,
    total_amount: totalAmount,
    completed_transactions: completedTransactions.length,
    completed_amount: completedAmount,
    pending_transactions: pendingTransactions.length,
    pending_amount: pendingAmount,
    failed_transactions: failedTransactions.length,
    failed_amount: failedAmount,
    average_transaction:
      transactions.length > 0 ? Math.round(totalAmount / transactions.length) : 0,
    period: selectedDate,
  };
}

function shouldUseTransactionSummaryFallback(
  summary: TransactionSummary | null,
  transactions: MerchantTransaction[]
) {
  return transactions.length > 0 && (!summary || summary.total_transactions === 0);
}

function getSummaryTransactionCount(summary: TransactionSummary | null) {
  return summary?.total_transactions ?? 0;
}

function formatDateKey(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateInputValue() {
  return formatDateKey(new Date());
}

function addDaysToDateKey(dateKey: string, dayOffset: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);

  return formatDateKey(date);
}

function getTransactionDateKey(transaction: MerchantTransaction) {
  const rawDate = transaction.paid_at || transaction.created_at;

  if (!rawDate) {
    return '';
  }

  const dateMatch = String(rawDate).match(/^(\d{4}-\d{2}-\d{2})/);

  if (dateMatch) {
    return dateMatch[1];
  }

  return formatDateKey(new Date(rawDate));
}

function getChartSuggestedMax(maxValue: number) {
  if (maxValue <= 1000) {
    return 1000;
  }

  if (maxValue <= 10000) {
    return Math.ceil((maxValue * 1.2) / 1000) * 1000;
  }

  if (maxValue <= 100000) {
    return Math.ceil((maxValue * 1.2) / 5000) * 5000;
  }

  return Math.ceil((maxValue * 1.2) / 10000) * 10000;
}

export default function TransactionsPage() {
  const [selectedDate, setSelectedDate] = useState(() => getDateInputValue());
  const [activeFilter, setActiveFilter] = useState<MachineFilter>('semua');
  
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [chartTransactions, setChartTransactions] = useState<MerchantTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch transaction data
  useEffect(() => {
    let isCurrentRequest = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        setTransactions([]);
        setChartTransactions([]);
        setSummary(null);
        const chartStartDate = addDaysToDateKey(selectedDate, -6);
        
        const [histData, summaryData, chartHistData] = await Promise.all([
          getCurrentMerchantHistory({
            date_from: selectedDate,
            date_to: selectedDate,
            limit: 100,
            offset: 0,
            status: 'PAID',
          }),
          getCurrentMerchantTransactionSummary({
            date_from: selectedDate,
            date_to: selectedDate,
          }),
          getCurrentMerchantHistory({
            date_from: chartStartDate,
            date_to: selectedDate,
            limit: 100,
            offset: 0,
            status: 'PAID',
          }),
        ]);

        if (!isCurrentRequest) {
          return;
        }
        
        const filteredTransactions = filterTransactionsByMachine(
          histData,
          activeFilter,
          getSummaryTransactionCount(summaryData)
        );
        const filteredChartTransactions = filterTransactionsByMachine(
          chartHistData,
          activeFilter,
          activeFilter === 'locker'
            ? chartHistData.length
            : getSummaryTransactionCount(summaryData)
        );

        setTransactions(filteredTransactions);
        setChartTransactions(
          filteredChartTransactions.length > 0
            ? filteredChartTransactions
            : filteredTransactions
        );
        setSummary(summaryData);
      } catch (err) {
        if (!isCurrentRequest) {
          return;
        }

        const apiError = err as ApiError;
        setError(apiError.message);
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCurrentRequest = false;
    };
  }, [activeFilter, selectedDate]);

  const displaySummary = useMemo(() => {
    if (shouldUseTransactionSummaryFallback(summary, transactions)) {
      return buildSummaryFromTransactions(transactions, selectedDate);
    }

    return summary;
  }, [selectedDate, summary, transactions]);

  const transactionListSummary = useMemo(
    () => buildSummaryFromTransactions(transactions, selectedDate),
    [selectedDate, transactions]
  );
  const shouldUseFilteredRowsForTotals =
    activeFilter !== 'semua' || transactions.length > 0;
  const totalTransactionCount =
    shouldUseFilteredRowsForTotals
      ? transactionListSummary.total_transactions
      : displaySummary?.total_transactions ?? 0;
  const totalTransactionAmount =
    shouldUseFilteredRowsForTotals
      ? transactionListSummary.total_amount
      : displaySummary?.total_amount ?? 0;
  const commissionTransactionCount =
    shouldUseFilteredRowsForTotals
      ? transactionListSummary.completed_transactions
      : displaySummary?.completed_transactions ?? 0;
  const commissionAmount =
    shouldUseFilteredRowsForTotals
      ? Math.round(transactionListSummary.completed_amount * COMMISSION_RATE)
      : Math.round(
          (displaySummary?.completed_amount ?? displaySummary?.total_amount ?? 0) *
            COMMISSION_RATE
        );

  const chartDateKeys = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      addDaysToDateKey(selectedDate, index - 6)
    );
  }, [selectedDate]);

  const chartLabels = useMemo(() => {
    return chartDateKeys.map((dateKey) =>
      new Date(`${dateKey}T00:00:00`).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      })
    );
  }, [chartDateKeys]);

  const chartAmounts = useMemo(() => {
    const totalsByDate = new Map<string, number>();

    for (const transaction of chartTransactions) {
      const dateKey = getTransactionDateKey(transaction);

      if (!dateKey) {
        continue;
      }

      totalsByDate.set(
        dateKey,
        (totalsByDate.get(dateKey) ?? 0) + getTransactionAmount(transaction)
      );
    }

    return chartDateKeys.map((dateKey) => totalsByDate.get(dateKey) ?? 0);
  }, [chartDateKeys, chartTransactions]);

  const chartSuggestedMax = getChartSuggestedMax(Math.max(...chartAmounts, 0));

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Transaksi',
        data: chartAmounts,
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
        data: chartAmounts.map((amount) => Math.round(amount * COMMISSION_RATE)),
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
    maintainAspectRatio: false,
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
          label: function (context: TooltipItem<'line'>) {
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
        suggestedMax: chartSuggestedMax,
        ticks: {
          callback: function (value: string | number) {
            const numericValue =
              typeof value === 'number' ? value : Number(value);

            if (numericValue >= 1000000) {
              return `Rp ${(numericValue / 1000000).toLocaleString('id-ID')}M`;
            }

            if (numericValue >= 1000) {
              return `Rp ${(numericValue / 1000).toLocaleString('id-ID')}k`;
            }

            return `Rp ${numericValue.toLocaleString('id-ID')}`;
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

  const handleFilterChange = (filter: MachineFilter) => {
    if (filter === activeFilter || filter === 'semua') {
      setActiveFilter('semua');
      return;
    }

    setActiveFilter(filter);
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
                Transaksi
              </h1>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="mt-4 text-gray-600">Memuat data transaksi...</p>
                  </div>
                </div>
              )}

              {/* Date Picker */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                      }
                    }}
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
                      checked={activeFilter === 'semua'}
                      onChange={() => handleFilterChange('semua')}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Semua</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeFilter === 'vending'}
                      onChange={() => handleFilterChange('vending')}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">Mesin Venjual</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeFilter === 'locker'}
                      onChange={() => handleFilterChange('locker')}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">Locker Laundry</span>
                  </label>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Total Transsaksi */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-xs text-gray-500 mb-2">Total Transsaksi</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Rp {totalTransactionAmount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">{totalTransactionCount} transaksi</p>
                </div>

                {/* Total Komisi */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-xs text-gray-500 mb-2">Total Komisi</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                    Rp {commissionAmount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">{commissionTransactionCount} transaksi</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-6">
                  Grafik Transaksi 7 Hari Terakhir
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
                  <span className="text-xs text-blue-600 font-semibold">{transactions.length} transsaksi</span>
                </div>

                {/* Transaction Table */}
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">ID Transaksi</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Waktu</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Nominal</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900 font-medium">{tx.id}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(tx.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4 text-gray-900 font-semibold">
                              Rp {getTransactionAmount(tx).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                tx.status === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : tx.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {tx.status === 'completed' ? 'Berhasil' : tx.status === 'pending' ? 'Pending' : 'Gagal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-sm text-gray-500">Tidak ada transaksi</p>
                    <p className="text-xs text-gray-400 mt-1">Belum ada data transaksi untuk tanggal yang dipilih</p>
                  </div>
                )}

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
