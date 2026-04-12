'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, FileText } from 'lucide-react';

type SubmissionStatus = 'Menunggu' | 'Diproses' | 'Disetujui' | 'Ditolak';

interface Submission {
  id: string;
  type: string;
  status: SubmissionStatus;
  date: string;
  title: string;
  description: string;
  details: Array<{ label: string; value: string }>;
}

const submissions: Submission[] = [
  {
    id: 'PG-2026-001',
    type: 'Tambah Mesin Baru',
    status: 'Menunggu',
    date: '12 April 2026',
    title: 'Vending Kopi - Mall Central Park',
    description: 'Pengajuan penambahan mesin vending kopi di area food court.',
    details: [
      { label: 'Lokasi', value: 'Mall Central Park, Jakarta Barat' },
      { label: 'Kategori', value: 'Vending Machine' },
      { label: 'Kapasitas', value: '50 slot' },
    ],
  },
  {
    id: 'PG-2026-002',
    type: 'Upgrade Mesin',
    status: 'Diproses',
    date: '07 April 2026',
    title: 'Upgrade Vending Snack - Gedung Sudirman',
    description: 'Upgrade modul pendingin dan penambahan slot produk.',
    details: [
      { label: 'Mesin', value: 'Vending Snack - Gedung Sudirman' },
      { label: 'Kondisi', value: 'Pendingin kurang stabil, sering hangat.' },
      { label: 'Tujuan', value: 'Ganti kompresor + tambah kapasitas rak.' },
    ],
  },
  {
    id: 'PG-2026-003',
    type: 'Ajukan Pencairan',
    status: 'Disetujui',
    date: '01 April 2026',
    title: 'Pencairan Saldo Digital',
    description: 'Pencairan sebagian saldo digital ke rekening utama.',
    details: [
      { label: 'Jumlah', value: 'Rp 1.500.000' },
      { label: 'Rekening', value: 'BCA • 1234567890' },
      { label: 'Nama Pemilik', value: 'Ahmad Wijaya' },
    ],
  },
];

const statusStyles: Record<SubmissionStatus, string> = {
  Menunggu: 'bg-yellow-100 text-yellow-800',
  Diproses: 'bg-blue-100 text-blue-800',
  Disetujui: 'bg-green-100 text-green-800',
  Ditolak: 'bg-red-100 text-red-800',
};

export default function PengajuanPage() {
  const [selectedId, setSelectedId] = useState(submissions[0]?.id ?? '');

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.id === selectedId),
    [selectedId]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="account" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Ahmad Wijaya" userEmail="ahmad.wijaya@email.com" />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Link
                  href="/dashboard/account"
                  className="inline-flex items-center gap-2 text-sm hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </Link>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    Pengajuan Saya
                  </h1>
                  <p className="text-sm text-gray-600">
                    Daftar pengajuan yang pernah Anda kirimkan
                  </p>
                </div>
                <Link
                  href="/dashboard/ajukan"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Buat Pengajuan
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {submissions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left bg-white border rounded-lg p-4 transition-colors shadow-sm ${
                        selectedId === item.id
                          ? 'border-blue-500 ring-1 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{item.date}</p>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">{item.type}</p>
                      <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  {selectedSubmission ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">
                            ID Pengajuan
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedSubmission.id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedSubmission.date}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[selectedSubmission.status]}`}
                        >
                          {selectedSubmission.status}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedSubmission.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedSubmission.type}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          {selectedSubmission.description}
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100 border-t border-gray-100">
                        {selectedSubmission.details.map((detail) => (
                          <div
                            key={detail.label}
                            className="flex items-start justify-between gap-4 py-3"
                          >
                            <p className="text-xs text-gray-500">
                              {detail.label}
                            </p>
                            <p className="text-sm text-gray-900 text-right">
                              {detail.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Pilih pengajuan untuk melihat detail.
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
