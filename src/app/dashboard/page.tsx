'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BalanceCards from '@/components/BalanceCards';
import TransactionList, { Transaction } from '@/components/TransactionList';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import MachineCard, { Machine as MachineCardData } from '@/components/MachineCard';
import {
  getCurrentMerchantBalance,
  getCurrentMerchantHistory,
  getCurrentUserProfile,
  getCurrentMerchantMachines,
  getCurrentMerchantRealtimeTransactions,
  getCurrentMerchantTransactions,
  getCurrentPartnerMachineTransactions,
  MerchantBalance,
  Transaction as MerchantTransaction,
  Machine as ApiMachine,
  normalizeApiError,
} from '@/lib/services';
import { resolveCommissionDetails } from '@/lib/commission';

function formatCurrency(value: number | undefined) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
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

function getMachineTypeValue(machine: ApiMachine) {
  return (
    machine.machine_type_code ||
    machine.mechine_type_code ||
    machine.machine_type ||
    machine.mechine_type ||
    machine.type
  );
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

type MachineTransactionMetrics = {
  amount: number;
  count: number;
};

async function getMachineTransactionMetrics(
  machine: ApiMachine
): Promise<MachineTransactionMetrics> {
  const machineId = getMachineRequestId(machine);

  if (!machineId) {
    console.warn('No machine ID found for machine:', machine);
    return { amount: 0, count: 0 };
  }

  console.log(`Fetching metrics for machine ${machineId}...`);

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
): MachineCardData {
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

function normalizeTransactionType(
  machineTypeCode: string | undefined
): Transaction['type'] {
  const normalizedType = machineTypeCode?.toLowerCase().replace(/[\s_-]/g, '');

  if (normalizedType === 'vmj' || normalizedType === 'venmachine' || normalizedType === 'vending') {
    return 'vending';
  }

  return 'locker';
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<MerchantBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [machines, setMachines] = useState<MachineCardData[]>([]);
  const [userName, setUserName] = useState('Partner');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch user profile
        try {
          const user = await getCurrentUserProfile();
          setUserName(user.full_name || user.username);
        } catch {
          console.log('Could not fetch user profile');
        }

        // Fetch balance
        const balanceData = await getCurrentMerchantBalance();
        setBalance(balanceData);

        // Fetch transaction history (last 10)
        const historyData = await getCurrentMerchantHistory({ limit: 10 });
        const historyItems = Array.isArray(historyData) ? historyData : [];
        
        // Map API data to Transaction format
        const mappedTransactions: Transaction[] = historyItems.map((tx: MerchantTransaction) => ({
          id: tx.id,
          type: normalizeTransactionType(tx.machine_type_code),
          name: tx.product_name || tx.order_id || tx.id,
          location: tx.machine_name || tx.order_id || tx.id,
          address: tx.machine_name || tx.order_id || tx.id,
          amount: formatCurrency(tx.amount),
          commission: '20%',
          status: tx.status === 'completed' ? 'Aktif' : 'Inactive',
          statusBg: tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700',
        }));
        
        setTransactions(mappedTransactions);

        // Fetch machines
        try {
          const machinesResponse = await getCurrentMerchantMachines({ limit: 100 });
          // Always fetch metrics for all machines to get real transaction data
          const metrics = await Promise.all(
            machinesResponse.data.map((machine) => getMachineTransactionMetrics(machine))
          );
          
          const mappedMachines = machinesResponse.data.map((machine, index) =>
            mapMachine(machine, index, metrics[index])
          );
          
          setMachines(mappedMachines);
        } catch (machineError) {
          console.error('Could not fetch machines:', machineError);
          // Don't fail the whole dashboard if machines fail
        }
      } catch (err) {
        const apiError = normalizeApiError(
          err,
          'Gagal memuat dashboard. Silakan coba lagi.'
        );
        setError(apiError.message);
        console.error(
          `Dashboard fetch error [${apiError.code}] ${apiError.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar active="home" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header userName={userName} userRole="Partner" />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {/* Error Message */}
          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <>
              {/* Balance Cards */}
              <BalanceCards
                digitalBalance={formatCurrency(balance?.balance)}
                commissionBalance={formatCurrency(balance?.available_balance)}
              />

              {/* Machines Section */}
              {machines.length > 0 && (
                <div className="px-4 md:px-6 py-4 md:py-6">
                  <div className="max-w-7xl mx-auto">
                    <h2 className="text-sm md:text-base font-semibold text-gray-700 mb-4">
                      Mesin Venjual
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {machines.map((machine) => (
                        <MachineCard
                          key={machine.id}
                          machine={machine}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction List */}
              <TransactionList transactions={transactions} />
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav active="home" />
    </div>
  );
}
