'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import MachineCard, { Machine as MachineCardData } from '@/components/MachineCard';
import { Search, Plus } from 'lucide-react';
import { resolveCommissionDetails } from '@/lib/commission';
import {
  getCurrentMerchantBalance,
  getCurrentMerchantMachines,
  getCurrentMerchantRealtimeTransactions,
  getCurrentMerchantTransactions,
  getCurrentPartnerMachineTransactions,
  getCurrentPartnerTransactionSummaryPerMachine,
  Machine as ApiMachine,
  MerchantBalance,
  MachineTransactionSummary,
  normalizeApiError,
} from '@/lib/services';

type MachineListItem = MachineCardData & {
  listKey: string;
};

type MachineTransactionMetrics = {
  amount: number;
  count: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })}M`;
  }

  if (value >= 1000) {
    return `Rp ${(value / 1000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })}K`;
  }

  return formatCurrency(value);
}

function parseCurrency(value: string) {
  return Number(value.replace(/\D/g, '')) || 0;
}

function normalizeMachineType(type: string | undefined): MachineCardData['type'] {
  const normalizedType = type?.toLowerCase().replace(/[\s_-]/g, '');

  if (normalizedType === 'vmj' || normalizedType === 'vending') {
    return 'vending';
  }

  if (
    normalizedType === 'sls' ||
    normalizedType === 'laundry' ||
    normalizedType === 'loundry' ||
    normalizedType === 'space' ||
    normalizedType === 'locker' ||
    normalizedType === 'lockerlaundry' ||
    normalizedType === 'lockerloundry'
  ) {
    return 'locker';
  }

  return 'vending';
}

function getMachineTypeValue(machine: ApiMachine) {
  return (
    machine.machine_type_code ||
    machine.mechine_type_code ||
    machine.machine_type ||
    machine.mechine_type ||
    machine.type
  );
}

function formatMachineTypeLabel(type: string | undefined) {
  const normalizedType = type?.toLowerCase().replace(/[\s_-]/g, '');

  if (normalizedType === 'vmj' || normalizedType === 'vending') {
    return 'Vending Machine';
  }

  if (
    normalizedType === 'sls' ||
    normalizedType === 'laundry' ||
    normalizedType === 'loundry' ||
    normalizedType === 'space' ||
    normalizedType === 'locker' ||
    normalizedType === 'lockerlaundry' ||
    normalizedType === 'lockerloundry'
  ) {
    return 'Locker Laundry';
  }

  return type || 'Mesin Venjual';
}

function normalizeStatus(status: string | undefined): MachineCardData['status'] {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'maintenance') {
    return 'Maintenance';
  }

  if (normalizedStatus === 'inactive' || normalizedStatus === 'nonactive') {
    return 'Inactive';
  }

  return 'Aktif';
}

function normalizeMachineId(machine: ApiMachine) {
  return String(machine.machine_id ?? machine.id ?? '');
}

function normalizeMachineRouteId(machine: ApiMachine) {
  return String(machine.id ?? machine.machine_id ?? '');
}

function getMachineRequestId(machine: ApiMachine) {
  const candidates: Array<unknown> = [machine.id, machine.machine_id];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (/^\d+$/.test(trimmed)) {
        return Number(trimmed);
      }
    }
  }

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }

    const trimmed = String(candidate).trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return '';
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

function getMachineDailyEarningValue(machine: ApiMachine): number | null {
  const candidate =
    machine.daily_earning ??
    (machine as { dailyEarning?: unknown }).dailyEarning ??
    (machine as { dailyEarningToday?: unknown }).dailyEarningToday ??
    (machine as { today_earning?: unknown }).today_earning ??
    (machine as { todayEarning?: unknown }).todayEarning;

  if (candidate === undefined || candidate === null) {
    return null;
  }

  return toNumber(candidate);
}

function getMachineTransactionCountValue(machine: ApiMachine): number | null {
  const candidate =
    machine.transaction_count ??
    (machine as { transactionCount?: unknown }).transactionCount ??
    (machine as { transaction_count_today?: unknown }).transaction_count_today ??
    (machine as { transactionCountToday?: unknown }).transactionCountToday;

  if (candidate === undefined || candidate === null) {
    return null;
  }

  return Math.max(0, Math.round(toNumber(candidate)));
}

function getMachineCommissionPercentageValue(machine: ApiMachine): unknown {
  return (
    machine.commission_percentage ??
    (machine as { commissionPercentage?: unknown }).commissionPercentage
  );
}

function getMachineCommissionAmountValue(machine: ApiMachine): unknown {
  return (
    machine.commission_amount ??
    (machine as { commissionAmount?: unknown }).commissionAmount
  );
}

async function getMachineTransactionMetrics(
  machine: ApiMachine,
  summaryMap?: Map<string | number, MachineTransactionSummary>
): Promise<MachineTransactionMetrics> {
  const machineId = getMachineRequestId(machine);

  if (!machineId) {
    console.warn('No machine ID found for machine:', machine);
    return { amount: 0, count: 0 };
  }

  // Try to use summary data if available
  if (summaryMap) {
    const summary = summaryMap.get(machineId) || summaryMap.get(String(machineId)) || summaryMap.get(Number(machineId));
    if (summary) {
      console.log(`Using summary data for machine ${machineId}:`, summary);
      return {
        amount: summary.total_amount,
        count: summary.transaction_count,
      };
    }
  }

  console.log(`Fetching metrics for machine ${machineId}...`);

  try {
    const summaryData = await getCurrentPartnerTransactionSummaryPerMachine();
    if (summaryData && summaryData.length > 0) {
      const summaryMap = new Map(summaryData.map((s) => [s.machine_id, s]));
      const summary = summaryMap.get(Number(machineId));
      if (summary) {
        console.log(`Summary endpoint for machine ${machineId}:`, summary);
        return {
          amount: summary.total_amount,
          count: summary.transaction_count,
        };
      }
    }
  } catch (error) {
    console.log(`Summary endpoint failed for machine ${machineId}:`, error);
    // Fallback to realtime transactions below
  }

  try {
    const summary = await getCurrentMerchantRealtimeTransactions({
      machine_id: machineId,
      status: 'PAID',
    });

    console.log(`Realtime summary for machine ${machineId}:`, summary);

    return {
      amount: summary.total_amount,
      count: summary.total_transactions,
    };
  } catch (error) {
    console.log(`Realtime endpoint failed for machine ${machineId}:`, error);
    // Fallback to listing when realtime summary is unavailable.
  }

  try {
    const response = await getCurrentMerchantTransactions({
      machine_id: machineId,
      status: 'PAID',
      limit: 100,
      offset: 0,
    });

    const amount = response.data.reduce((sum, tx) => sum + toNumber(tx.amount), 0);
    console.log(`Transaction list for machine ${machineId}:`, { count: response.data.length, amount });

    return {
      amount,
      count: response.data.length,
    };
  } catch (error) {
    console.log(`Transaction list failed for machine ${machineId}:`, error);
    // Fallback to partner machine transaction endpoint below.
  }

  try {
    const response = await getCurrentPartnerMachineTransactions(machineId, {
      status: 'PAID',
      limit: 100,
      offset: 0,
    });

    const amount = response.data.reduce((sum, tx) => sum + toNumber(tx.amount), 0);
    console.log(`Partner machine transactions for machine ${machineId}:`, { count: response.data.length, amount });

    return {
      amount,
      count: response.data.length,
    };
  } catch (error) {
    console.log(`Partner machine transactions failed for machine ${machineId}:`, error);
    return { amount: 0, count: 0 };
  }
}

function mapMachine(
  machine: ApiMachine,
  index: number,
  metrics?: MachineTransactionMetrics
): MachineListItem {
  const dailyEarning = getMachineDailyEarningValue(machine) ?? metrics?.amount ?? 0;
  const { percentage: commissionPercentage, amount: commissionAmount } =
    resolveCommissionDetails(
      dailyEarning,
      getMachineCommissionPercentageValue(machine),
      getMachineCommissionAmountValue(machine)
    );
  const id = normalizeMachineId(machine);
  const machineTypeValue = getMachineTypeValue(machine);
  const transactionCount =
    getMachineTransactionCountValue(machine) ?? metrics?.count ?? 0;

  return {
    listKey: `${id}-${index}`,
    id,
    routeId: normalizeMachineRouteId(machine),
    type: normalizeMachineType(machineTypeValue),
    machineTypeLabel: formatMachineTypeLabel(machineTypeValue),
    name: machine.name || 'Mesin Venjual',
    location: machine.location_name || machine.location || '-',
    address: machine.address || '-',
    dailyEarning: formatCurrency(dailyEarning),
    commission: `${commissionPercentage}%`,
    commissionAmount: formatCurrency(commissionAmount),
    transactions: transactionCount,
    capacity: machine.capacity ?? 0,
    utilities: machine.utilities ?? 0,
    status: normalizeStatus(machine.status),
    image: machine.image_url,
  };
}

export default function MesinPage() {
  const [activeFilter, setActiveFilter] = useState<'semua' | 'vending' | 'locker'>('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [machines, setMachines] = useState<MachineListItem[]>([]);
  const [balance, setBalance] = useState<MerchantBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        setError('');
        const [response, balanceResponse] = await Promise.all([
          getCurrentMerchantMachines({ limit: 100 }),
          getCurrentMerchantBalance().catch(() => null),
        ]);

        // Extract machine IDs for transaction summary
        const machineIds = response.data.map((machine) => machine.id);
        
        // Fetch transaction summary for all machines
        const summaryData = await getCurrentPartnerTransactionSummaryPerMachine(machineIds).catch(() => []);

        // Create a map for quick lookup of transaction summaries
        const summaryMap = new Map(
          (summaryData || []).map((s) => [s.machine_id, s])
        );

        // Always fetch metrics for all machines to get real transaction data
        const metrics = await Promise.all(
          response.data.map((machine) =>
            getMachineTransactionMetrics(machine, summaryMap)
          )
        );
        setBalance(balanceResponse);
        setMachines(
          response.data.map((machine, index) =>
            mapMachine(machine, index, metrics[index])
          )
        );
      } catch (err) {
        const apiError = normalizeApiError(
          err,
          'Gagal memuat daftar mesin. Silakan coba lagi.'
        );
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Filter machines
  const filteredMachines = useMemo(() => machines.filter((machine) => {
    const matchesFilter =
      activeFilter === 'semua' || machine.type === activeFilter;
    const matchesSearch =
      machine.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [activeFilter, machines, searchTerm]);

  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => m.status === 'Aktif').length;
  const totalDailyEarning = machines.reduce((sum, m) => {
    return sum + parseCurrency(m.dailyEarning);
  }, 0);
  const totalCommission =
    balance?.available_balance ??
    machines.reduce((sum, m) => {
      return sum + parseCurrency(m.commissionAmount);
    }, 0);
  const displayedBalance = balance?.balance ?? totalDailyEarning;

  const filterTabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'vending', label: 'Vending Machine' },
    { id: 'locker', label: 'Locker Laundry' },
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
                    {formatCompactCurrency(displayedBalance)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Dari saldo balance merchant
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Komisi</p>
                  <h3 className="text-3xl font-bold text-green-600">
                    {formatCompactCurrency(totalCommission)}
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
                            tab.id as 'semua' | 'vending' | 'locker'
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
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="mt-4 text-gray-600">Memuat daftar mesin...</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {!loading && filteredMachines.length > 0 ? (
                  filteredMachines.map((machine) => (
                    <MachineCard key={machine.listKey} machine={machine} />
                  ))
                ) : !loading ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg">
                      Tidak ada mesin ditemukan
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Silakan ubah filter atau cari istilah lain
                    </p>
                  </div>
                ) : null}
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
