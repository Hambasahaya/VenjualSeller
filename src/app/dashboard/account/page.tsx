'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import {
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  Building2,
  Calendar,
  Pencil,
  FileText,
} from 'lucide-react';

export default function AccountPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="account" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Ahmad Wijaya" userEmail="ahmad.wijaya@email.com" />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <h1 className="text-lg md:text-xl font-bold text-gray-900">
                  Profil Partner
                </h1>
              </div>

              <div className="bg-white rounded-2xl shadow p-5 md:p-6 mb-4 border border-gray-100">
                <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-3">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Ahmad Wijaya</h2>
                  <p className="text-sm text-gray-500">Pemilik Mesin Pintar</p>
                  <p className="text-xs text-gray-400 mt-1">ID: MV-2024-0123</p>
                </div>

                <div className="divide-y divide-gray-100">
                  <div className="flex items-start gap-3 py-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">ahmad.wijaya@email.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Nomor Telepon</p>
                      <p className="text-sm text-gray-900">+62 812-3456-7890</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Alamat</p>
                      <p className="text-sm text-gray-900">Jl. Sudirman No. 123, Jakarta Selatan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <Building2 className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Perusahaan</p>
                      <p className="text-sm text-gray-900">PT. Mitra Venjual Indonesia</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Bergabung Sejak</p>
                      <p className="text-sm text-gray-900">15 Januari 2024</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/dashboard/account/pengajuan"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Pengajuan Saya
                </Link>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors">
                  <Pencil className="w-4 h-4" />
                  Edit Profil
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="account" />
    </div>
  );
}
