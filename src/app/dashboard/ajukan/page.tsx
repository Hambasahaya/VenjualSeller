'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  FileText,
  Landmark,
  LayoutGrid,
  Loader2,
  MapPin,
  Wallet,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import {
  ApiError,
  createCurrentPartnerMachineSubmission,
  getCurrentMerchantBalance,
  MachineSubmission,
  MachineSubmissionCategory,
  MerchantBalance,
  requestCurrentWithdrawal,
} from '@/lib/services';

type SubmissionMode = 'machine' | 'withdrawal';

type MachineFormData = {
  kategori_mesin: MachineSubmissionCategory;
  lokasi: string;
  deskripsi: string;
};

type WithdrawalFormData = {
  amount: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  notes: string;
};

type SubmissionFeedback =
  | {
      type: 'machine';
      submission: MachineSubmission;
    }
  | {
      type: 'withdrawal';
      amount: number;
    }
  | null;

const CATEGORY_OPTIONS: Array<{
  value: MachineSubmissionCategory;
  label: string;
  description: string;
}> = [
  {
    value: 'vending_machine',
    label: 'Vending Machine',
    description: 'Untuk pengajuan mesin penjualan otomatis.',
  },
  {
    value: 'locker_laundry',
    label: 'Locker Laundry',
    description: 'Untuk pengajuan mesin locker laundry.',
  },
];

const INITIAL_MACHINE_FORM: MachineFormData = {
  kategori_mesin: 'vending_machine',
  lokasi: '',
  deskripsi: '',
};

const INITIAL_WITHDRAWAL_FORM: WithdrawalFormData = {
  amount: '',
  bank_name: '',
  bank_account_number: '',
  bank_account_name: '',
  notes: '',
};

function formatCurrency(value: number | undefined) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function AjukanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SubmissionMode>('machine');
  const [machineForm, setMachineForm] = useState<MachineFormData>(
    INITIAL_MACHINE_FORM
  );
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalFormData>(
    INITIAL_WITHDRAWAL_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmissionFeedback>(null);
  const [balance, setBalance] = useState<MerchantBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const fetchBalance = async () => {
      try {
        setBalanceLoading(true);
        setBalanceError('');
        const response = await getCurrentMerchantBalance();

        if (!isCancelled) {
          setBalance(response);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const apiError = error as ApiError;
        setBalance(null);
        setBalanceError(apiError.message || 'Gagal memuat saldo merchant.');
      } finally {
        if (!isCancelled) {
          setBalanceLoading(false);
        }
      }
    };

    fetchBalance();

    return () => {
      isCancelled = true;
    };
  }, []);

  const availableBalance = balance?.available_balance ?? balance?.balance ?? 0;
  const pendingWithdrawal = balance?.pending_withdrawal ?? 0;

  const selectedCategoryDescription = useMemo(
    () =>
      CATEGORY_OPTIONS.find(
        (option) => option.value === machineForm.kategori_mesin
      )?.description,
    [machineForm.kategori_mesin]
  );

  const handleModeChange = (nextMode: SubmissionMode) => {
    setMode(nextMode);
    setErrors({});
    setFeedback(null);
  };

  const handleMachineInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setMachineForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name] || errors.submit) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
        submit: '',
      }));
    }
  };

  const handleWithdrawalInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    const nextValue = name === 'amount' ? value.replace(/\D/g, '') : value;

    setWithdrawalForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name] || errors.submit) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
        submit: '',
      }));
    }
  };

  const validateMachineForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!CATEGORY_OPTIONS.some((option) => option.value === machineForm.kategori_mesin)) {
      nextErrors.kategori_mesin = 'Kategori mesin harus dipilih.';
    }

    if (!machineForm.lokasi.trim()) {
      nextErrors.lokasi = 'Lokasi pengajuan harus diisi.';
    }

    if (!machineForm.deskripsi.trim()) {
      nextErrors.deskripsi = 'Deskripsi pengajuan harus diisi.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateWithdrawalForm = () => {
    const nextErrors: Record<string, string> = {};
    const withdrawalAmount = Number(withdrawalForm.amount);

    if (!withdrawalForm.amount) {
      nextErrors.amount = 'Nominal pencairan harus diisi.';
    } else if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
      nextErrors.amount = 'Nominal pencairan harus lebih besar dari 0.';
    } else if (withdrawalAmount > availableBalance) {
      nextErrors.amount = 'Nominal pencairan melebihi saldo yang tersedia.';
    }

    if (!withdrawalForm.bank_name.trim()) {
      nextErrors.bank_name = 'Nama bank harus diisi.';
    }

    if (!withdrawalForm.bank_account_number.trim()) {
      nextErrors.bank_account_number = 'Nomor rekening harus diisi.';
    }

    if (!withdrawalForm.bank_account_name.trim()) {
      nextErrors.bank_account_name = 'Nama pemilik rekening harus diisi.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleMachineSubmit = async () => {
    if (!validateMachineForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setFeedback(null);

      const response = await createCurrentPartnerMachineSubmission({
        kategori_mesin: machineForm.kategori_mesin,
        lokasi: machineForm.lokasi.trim(),
        deskripsi: machineForm.deskripsi.trim(),
      });

      setFeedback({
        type: 'machine',
        submission: response,
      });
      setMachineForm(INITIAL_MACHINE_FORM);

      window.setTimeout(() => {
        router.push('/dashboard/account/pengajuan');
      }, 1400);
    } catch (error) {
      const apiError = error as ApiError;
      setErrors({
        submit: apiError.message || 'Gagal mengirim pengajuan mesin.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawalSubmit = async () => {
    if (!validateWithdrawalForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setFeedback(null);

      const withdrawalAmount = Number(withdrawalForm.amount);

      await requestCurrentWithdrawal({
        amount: withdrawalAmount,
        bank_name: withdrawalForm.bank_name.trim(),
        bank_account_number: withdrawalForm.bank_account_number.trim(),
        bank_account_name: withdrawalForm.bank_account_name.trim(),
        notes: withdrawalForm.notes.trim() || 'Pengajuan pencairan dana partner',
      });

      setFeedback({
        type: 'withdrawal',
        amount: withdrawalAmount,
      });
      setWithdrawalForm(INITIAL_WITHDRAWAL_FORM);

      setBalance((currentBalance) =>
        currentBalance
          ? {
              ...currentBalance,
              available_balance: Math.max(
                0,
                (currentBalance.available_balance ?? currentBalance.balance) -
                  withdrawalAmount
              ),
              pending_withdrawal:
                (currentBalance.pending_withdrawal ?? 0) + withdrawalAmount,
            }
          : currentBalance
      );
    } catch (error) {
      const apiError = error as ApiError;
      setErrors({
        submit: apiError.message || 'Gagal mengajukan pencairan dana.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'machine') {
      await handleMachineSubmit();
      return;
    }

    await handleWithdrawalSubmit();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="ajukan" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Partner" userRole="Partner" />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Ajukan Layanan
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Pilih pengajuan mesin baru atau pencairan dana sesuai kebutuhan
                    operasional partner Anda.
                  </p>
                </div>

                <Link
                  href="/dashboard/account/pengajuan"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  Riwayat Pengajuan & Withdrawal
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleModeChange('machine')}
                  className={`rounded-2xl border p-5 text-left shadow-sm transition-colors ${
                    mode === 'machine'
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900">
                      Pengajuan Mesin
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Ajukan vending machine atau locker laundry baru untuk lokasi
                    partner.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('withdrawal')}
                  className={`rounded-2xl border p-5 text-left shadow-sm transition-colors ${
                    mode === 'withdrawal'
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-semibold text-gray-900">
                      Pencairan Dana
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Ajukan pencairan saldo merchant ke rekening bank partner.
                  </p>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <LayoutGrid className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {mode === 'machine' ? 'Kategori Mesin' : 'Saldo Tersedia'}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {mode === 'machine'
                      ? 'Pilih antara vending machine atau locker laundry.'
                      : balanceLoading
                        ? 'Memuat saldo merchant...'
                        : formatCurrency(availableBalance)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  {mode === 'machine' ? (
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Landmark className="h-5 w-5 text-violet-600" />
                  )}
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {mode === 'machine' ? 'Lokasi Penempatan' : 'Pending Withdrawal'}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {mode === 'machine'
                      ? 'Cantumkan alamat atau area penempatan mesin secara spesifik.'
                      : balanceLoading
                        ? 'Memuat data pencairan...'
                        : formatCurrency(pendingWithdrawal)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-amber-600" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    Status Awal
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {mode === 'machine'
                      ? 'Pengajuan baru akan tercatat dengan status pending.'
                      : 'Permintaan pencairan akan diproses setelah diajukan.'}
                  </p>
                </div>
              </div>

              {balanceError && mode === 'withdrawal' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{balanceError}</p>
                </div>
              )}

              {feedback?.type === 'machine' && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-900">
                    Pengajuan mesin berhasil dikirim.
                  </p>
                  <p className="mt-1 text-sm text-green-800">
                    ID pengajuan: {feedback.submission.id}. Anda akan diarahkan ke
                    halaman riwayat pengajuan dan withdrawal.
                  </p>
                </div>
              )}

              {feedback?.type === 'withdrawal' && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-900">
                    Pengajuan pencairan dana berhasil dikirim.
                  </p>
                  <p className="mt-1 text-sm text-green-800">
                    Nominal yang diajukan: {formatCurrency(feedback.amount)}.
                    Tim akan memproses pencairan sesuai data rekening yang Anda kirim.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === 'machine' ? (
                    <>
                      <div>
                        <label
                          htmlFor="kategori_mesin"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Kategori Mesin
                        </label>
                        <select
                          id="kategori_mesin"
                          name="kategori_mesin"
                          value={machineForm.kategori_mesin}
                          onChange={handleMachineInputChange}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.kategori_mesin
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        >
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs text-gray-500">
                          {selectedCategoryDescription}
                        </p>
                        {errors.kategori_mesin && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.kategori_mesin}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="lokasi"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Lokasi
                        </label>
                        <input
                          id="lokasi"
                          type="text"
                          name="lokasi"
                          placeholder="Contoh: Jalan Sudirman No. 123, Jakarta"
                          value={machineForm.lokasi}
                          onChange={handleMachineInputChange}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.lokasi
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.lokasi && (
                          <p className="mt-1 text-sm text-red-500">{errors.lokasi}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="deskripsi"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Deskripsi
                        </label>
                        <textarea
                          id="deskripsi"
                          name="deskripsi"
                          rows={5}
                          placeholder="Jelaskan kebutuhan atau alasan pengajuan mesin."
                          value={machineForm.deskripsi}
                          onChange={handleMachineInputChange}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.deskripsi
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.deskripsi && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.deskripsi}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                          Saldo Merchant
                        </p>
                        <p className="mt-2 text-lg font-semibold text-blue-900">
                          {balanceLoading
                            ? 'Memuat saldo...'
                            : formatCurrency(availableBalance)}
                        </p>
                        <p className="mt-1 text-xs text-blue-700">
                          Pending withdrawal: {formatCurrency(pendingWithdrawal)}
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="amount"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Nominal Pencairan
                        </label>
                        <input
                          id="amount"
                          type="text"
                          name="amount"
                          inputMode="numeric"
                          placeholder="Contoh: 1000000"
                          value={withdrawalForm.amount}
                          onChange={handleWithdrawalInputChange}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.amount
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Maksimal pencairan saat ini {formatCurrency(availableBalance)}.
                        </p>
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="bank_name"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Nama Bank
                        </label>
                        <input
                          id="bank_name"
                          type="text"
                          name="bank_name"
                          placeholder="Contoh: BCA"
                          value={withdrawalForm.bank_name}
                          onChange={handleWithdrawalInputChange}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.bank_name
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.bank_name && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.bank_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="bank_account_number"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Nomor Rekening
                        </label>
                        <input
                          id="bank_account_number"
                          type="text"
                          name="bank_account_number"
                          placeholder="Contoh: 1234567890"
                          value={withdrawalForm.bank_account_number}
                          onChange={handleWithdrawalInputChange}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.bank_account_number
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.bank_account_number && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.bank_account_number}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="bank_account_name"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Nama Pemilik Rekening
                        </label>
                        <input
                          id="bank_account_name"
                          type="text"
                          name="bank_account_name"
                          placeholder="Contoh: PT Mitra Venjual"
                          value={withdrawalForm.bank_account_name}
                          onChange={handleWithdrawalInputChange}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.bank_account_name
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.bank_account_name && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.bank_account_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="notes"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Catatan
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          rows={4}
                          placeholder="Catatan tambahan untuk pencairan dana."
                          value={withdrawalForm.notes}
                          onChange={handleWithdrawalInputChange}
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {errors.submit && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{errors.submit}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (mode === 'withdrawal' && balanceLoading)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === 'machine'
                          ? 'Mengirim Pengajuan...'
                          : 'Mengajukan Pencairan...'}
                      </>
                    ) : mode === 'machine' ? (
                      'Kirim Pengajuan Mesin'
                    ) : (
                      'Ajukan Pencairan Dana'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="ajukan" />
    </div>
  );
}
