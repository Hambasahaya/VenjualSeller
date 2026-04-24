'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, FileText, Loader2, RefreshCw, Wallet } from 'lucide-react';
import {
  ApiError,
  getCurrentMerchantWithdrawals,
  getCurrentMerchantWithdrawalHistory,
  getCurrentPartnerMachineSubmissions,
  MachineSubmission,
  MachineSubmissionCategory,
  MachineSubmissionStatus,
  Withdrawal,
} from '@/lib/services';

const PAGE_LIMIT = 20;

type HistoryTab = 'machine' | 'withdrawal';
type CategoryFilter = 'all' | MachineSubmissionCategory;
type MachineStatusFilter = 'all' | MachineSubmissionStatus;

const CATEGORY_OPTIONS: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'Semua kategori' },
  { value: 'vending_machine', label: 'Vending Machine' },
  { value: 'locker_laundry', label: 'Locker Laundry' },
];

const MACHINE_STATUS_OPTIONS: Array<{ value: MachineStatusFilter; label: string }> =
  [
    { value: 'all', label: 'Semua status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

function formatCategoryLabel(category?: string): string {
  if (category === 'vending_machine') {
    return 'Vending Machine';
  }

  if (category === 'locker_laundry') {
    return 'Locker Laundry';
  }

  return category ? category.replace(/_/g, ' ') : 'Kategori belum tersedia';
}

function formatStatusLabel(status?: string): string {
  if (!status) {
    return 'Unknown';
  }

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getStatusStyles(status?: string): string {
  switch (status) {
    case 'approved':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected':
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

function formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function formatCurrency(value: number | undefined): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatWithdrawalBankLabel(withdrawal: Withdrawal): string {
  const bankName = withdrawal.bank_name?.trim();
  const accountNumber = withdrawal.bank_account_number?.trim();

  if (bankName && accountNumber) {
    return `${bankName} • ${accountNumber}`;
  }

  if (bankName) {
    return bankName;
  }

  if (accountNumber) {
    return accountNumber;
  }

  return 'Rekening belum tersedia';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="max-w-xs text-right text-sm text-gray-900">{value}</p>
    </div>
  );
}

export default function PengajuanPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('machine');
  const [submissions, setSubmissions] = useState<MachineSubmission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<CategoryFilter>('all');
  const [machineStatusFilter, setMachineStatusFilter] =
    useState<MachineStatusFilter>('all');
  const [machineOffset, setMachineOffset] = useState(0);
  const [withdrawalOffset, setWithdrawalOffset] = useState(0);
  const [machineTotal, setMachineTotal] = useState<number | null>(null);
  const [withdrawalTotal, setWithdrawalTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');

        if (activeTab === 'machine') {
          const response = await getCurrentPartnerMachineSubmissions({
            limit: PAGE_LIMIT,
            offset: machineOffset,
            ...(kategoriFilter !== 'all'
              ? { kategori_mesin: kategoriFilter }
              : {}),
            ...(machineStatusFilter !== 'all'
              ? { status_pengajuan: machineStatusFilter }
              : {}),
          });

          if (isCancelled) {
            return;
          }

          setSubmissions(response.data);
          setMachineTotal(response.pagination?.total ?? null);
          setSelectedMachineId((currentSelectedId) =>
            response.data.some((item) => item.id === currentSelectedId)
              ? currentSelectedId
              : (response.data[0]?.id ?? '')
          );

          return;
        }

        console.log('[Pengajuan Page] Fetching withdrawal history...');
        const response = await getCurrentMerchantWithdrawalHistory({
          limit: PAGE_LIMIT,
          offset: withdrawalOffset,
        });

        console.log('[Pengajuan Page] Withdrawal response:', response);

        if (isCancelled) {
          return;
        }

        console.log('[Pengajuan Page] Setting withdrawals:', response.data);
        setWithdrawals(response.data);
        setWithdrawalTotal(response.pagination?.total ?? null);
        setSelectedWithdrawalId((currentSelectedId) =>
          response.data.some((item) => item.id === currentSelectedId)
            ? currentSelectedId
            : (response.data[0]?.id ?? '')
        );
      } catch (fetchError) {
        if (isCancelled) {
          return;
        }

        console.error('[Pengajuan Page] Error:', fetchError);
        const apiError = fetchError as ApiError;

        if (activeTab === 'machine') {
          setSubmissions([]);
          setSelectedMachineId('');
          setMachineTotal(null);
          setError(apiError.message || 'Gagal memuat data pengajuan mesin.');
        } else {
          setWithdrawals([]);
          setSelectedWithdrawalId('');
          setWithdrawalTotal(null);
          setError(
            apiError.message || 'Gagal memuat history withdrawal: ' + JSON.stringify(fetchError)
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isCancelled = true;
    };
  }, [
    activeTab,
    kategoriFilter,
    machineOffset,
    machineStatusFilter,
    reloadKey,
    withdrawalOffset,
  ]);

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.id === selectedMachineId) ?? null,
    [selectedMachineId, submissions]
  );

  const selectedWithdrawal = useMemo(
    () => withdrawals.find((item) => item.id === selectedWithdrawalId) ?? null,
    [selectedWithdrawalId, withdrawals]
  );

  const currentItemsCount =
    activeTab === 'machine' ? submissions.length : withdrawals.length;
  const currentOffset = activeTab === 'machine' ? machineOffset : withdrawalOffset;
  const currentTotal = activeTab === 'machine' ? machineTotal : withdrawalTotal;
  const canGoPrevious = currentOffset > 0;
  const canGoNext =
    currentTotal !== null
      ? currentOffset + PAGE_LIMIT < currentTotal
      : currentItemsCount === PAGE_LIMIT;
  const visibleFrom = currentItemsCount === 0 ? 0 : currentOffset + 1;
  const visibleTo = currentOffset + currentItemsCount;
  const withdrawalPageTotal = withdrawals.reduce(
    (totalAmount, item) => totalAmount + (item.amount ?? 0),
    0
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="account" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Partner" userRole="Partner" />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="mx-auto max-w-5xl space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Link
                  href="/dashboard/account"
                  className="inline-flex items-center gap-2 text-sm transition-colors hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Link>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                    Riwayat Pengajuan & Withdrawal
                  </h1>
                  <p className="text-sm text-gray-600">
                    Lihat pengajuan mesin dan history pencairan dana partner dalam
                    satu halaman.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReloadKey((currentValue) => currentValue + 1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Muat Ulang
                  </button>

                  <Link
                    href="/dashboard/ajukan"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4" />
                    Buat Pengajuan
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('machine')}
                  className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                    activeTab === 'machine'
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">Pengajuan Mesin</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Riwayat permintaan vending machine dan locker laundry.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('withdrawal')}
                  className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                    activeTab === 'withdrawal'
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-gray-900">
                      History Withdrawal
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Riwayat pencairan dana merchant ke rekening partner.
                  </p>
                </button>
              </div>

              {activeTab === 'machine' ? (
                <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="kategori-filter"
                      className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Kategori
                    </label>
                    <select
                      id="kategori-filter"
                      value={kategoriFilter}
                      onChange={(event) => {
                        setKategoriFilter(event.target.value as CategoryFilter);
                        setMachineOffset(0);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="machine-status-filter"
                      className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Status
                    </label>
                    <select
                      id="machine-status-filter"
                      value={machineStatusFilter}
                      onChange={(event) => {
                        setMachineStatusFilter(
                          event.target.value as MachineStatusFilter
                        );
                        setMachineOffset(0);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {MACHINE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Menampilkan
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {visibleFrom}-{visibleTo}
                      {currentTotal !== null ? ` dari ${currentTotal}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2">
                  <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                      Status Filter
                    </p>
                    <p className="mt-1 text-sm font-semibold text-blue-900">
                      Withdrawal Requested
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Menampilkan permintaan pencairan dana yang sedang pending
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Menampilkan
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {visibleFrom}-{visibleTo}
                        {currentTotal !== null ? ` dari ${currentTotal}` : ''}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Total Halaman Ini
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(withdrawalPageTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex min-h-60 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                        <p className="mt-3 text-sm text-gray-600">
                          {activeTab === 'machine'
                            ? 'Memuat pengajuan mesin...'
                            : 'Memuat history withdrawal...'}
                        </p>
                      </div>
                    </div>
                  ) : activeTab === 'machine' ? (
                    submissions.length > 0 ? (
                      submissions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedMachineId(item.id)}
                          className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                            selectedMachineId === item.id
                              ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-gray-500">
                                {formatDateTime(item.created_at)}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {formatCategoryLabel(item.kategori_mesin)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.lokasi || 'Lokasi belum tersedia'}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(
                                item.status_pengajuan
                              )}`}
                            >
                              {formatStatusLabel(item.status_pengajuan)}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                            {item.deskripsi || 'Tidak ada deskripsi pengajuan.'}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
                        <p className="text-sm font-medium text-gray-900">
                          Belum ada pengajuan mesin
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Kirim pengajuan baru untuk mulai melihat riwayat di halaman
                          ini.
                        </p>
                      </div>
                    )
                  ) : withdrawals.length > 0 ? (
                    withdrawals.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedWithdrawalId(item.id)}
                        className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                          selectedWithdrawalId === item.id
                            ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-200'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(item.created_at)}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {formatCurrency(item.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatWithdrawalBankLabel(item)}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(
                              item.status
                            )}`}
                          >
                            {formatStatusLabel(item.status)}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                          {item.notes || item.reference || 'Tidak ada catatan withdrawal.'}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
                      <p className="text-sm font-medium text-gray-900">
                        Belum ada history withdrawal
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Ajukan pencairan dana untuk mulai melihat riwayat withdrawal di
                        halaman ini.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'machine') {
                          setMachineOffset((currentValue) =>
                            Math.max(currentValue - PAGE_LIMIT, 0)
                          );
                          return;
                        }

                        setWithdrawalOffset((currentValue) =>
                          Math.max(currentValue - PAGE_LIMIT, 0)
                        );
                      }}
                      disabled={!canGoPrevious || loading}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      Sebelumnya
                    </button>

                    <p className="text-xs text-gray-500">Offset {currentOffset}</p>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'machine') {
                          setMachineOffset(
                            (currentValue) => currentValue + PAGE_LIMIT
                          );
                          return;
                        }

                        setWithdrawalOffset(
                          (currentValue) => currentValue + PAGE_LIMIT
                        );
                      }}
                      disabled={!canGoNext || loading}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  {activeTab === 'machine' ? (
                    selectedSubmission ? (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500">ID Pengajuan</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedSubmission.id}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Dibuat {formatDateTime(selectedSubmission.created_at)}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(
                              selectedSubmission.status_pengajuan
                            )}`}
                          >
                            {formatStatusLabel(selectedSubmission.status_pengajuan)}
                          </span>
                        </div>

                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCategoryLabel(selectedSubmission.kategori_mesin)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {selectedSubmission.lokasi || 'Lokasi belum tersedia'}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-gray-700">
                            {selectedSubmission.deskripsi ||
                              'Tidak ada deskripsi pengajuan.'}
                          </p>
                        </div>

                        <div className="divide-y divide-gray-100 border-t border-gray-100">
                          <DetailRow
                            label="Kategori"
                            value={formatCategoryLabel(selectedSubmission.kategori_mesin)}
                          />
                          <DetailRow
                            label="Status"
                            value={formatStatusLabel(selectedSubmission.status_pengajuan)}
                          />
                          <DetailRow
                            label="Lokasi"
                            value={selectedSubmission.lokasi || '-'}
                          />
                          <DetailRow
                            label="Partner ID"
                            value={
                              selectedSubmission.partner_id !== undefined
                                ? String(selectedSubmission.partner_id)
                                : '-'
                            }
                          />
                          <DetailRow
                            label="Dibuat pada"
                            value={formatDateTime(selectedSubmission.created_at)}
                          />
                          <DetailRow
                            label="Diperbarui pada"
                            value={formatDateTime(selectedSubmission.updated_at)}
                          />
                          {selectedSubmission.catatan_admin && (
                            <DetailRow
                              label="Catatan Admin"
                              value={selectedSubmission.catatan_admin}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Pilih pengajuan mesin untuk melihat detail.
                      </p>
                    )
                  ) : selectedWithdrawal ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">ID Withdrawal</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedWithdrawal.id}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Dibuat {formatDateTime(selectedWithdrawal.created_at)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(
                            selectedWithdrawal.status
                          )}`}
                        >
                          {formatStatusLabel(selectedWithdrawal.status)}
                        </span>
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(selectedWithdrawal.amount)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatWithdrawalBankLabel(selectedWithdrawal)}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-gray-700">
                          {selectedWithdrawal.notes ||
                            'Tidak ada catatan tambahan untuk withdrawal ini.'}
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100 border-t border-gray-100">
                        <DetailRow
                          label="Status"
                          value={formatStatusLabel(selectedWithdrawal.status)}
                        />
                        <DetailRow
                          label="Nominal"
                          value={formatCurrency(selectedWithdrawal.amount)}
                        />
                        <DetailRow
                          label="Referensi"
                          value={selectedWithdrawal.reference || '-'}
                        />
                        <DetailRow
                          label="Nama Bank"
                          value={selectedWithdrawal.bank_name || '-'}
                        />
                        <DetailRow
                          label="Nomor Rekening"
                          value={selectedWithdrawal.bank_account_number || '-'}
                        />
                        <DetailRow
                          label="Nama Pemilik"
                          value={selectedWithdrawal.bank_account_name || '-'}
                        />
                        <DetailRow
                          label="Merchant ID"
                          value={selectedWithdrawal.merchant_id || '-'}
                        />
                        <DetailRow
                          label="Dibuat pada"
                          value={formatDateTime(selectedWithdrawal.created_at)}
                        />
                        <DetailRow
                          label="Diperbarui pada"
                          value={formatDateTime(selectedWithdrawal.updated_at)}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Pilih withdrawal untuk melihat detail.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="account" />
    </div>
  );
}
