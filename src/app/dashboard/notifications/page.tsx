'use client';

import React from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Maintenance dimulai',
      message: 'Vending machine VM-JKT-003 akan di-maintenance pada 15 April',
      time: '2 jam lalu',
      icon: AlertCircle,
    },
    {
      id: 2,
      type: 'success',
      title: 'Komisi berhasil ditambahkan',
      message: 'Komisi Anda sebesar Rp 235.000 telah ditambahkan ke saldo',
      time: '5 jam lalu',
      icon: CheckCircle,
    },
    {
      id: 3,
      type: 'info',
      title: 'Update sistem',
      message: 'Platform kami telah diperbarui dengan fitur baru',
      time: '1 hari lalu',
      icon: Info,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="notifications" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-2xl mx-auto">
              {/* Header Section */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Notifikasi
                </h1>
                <p className="text-gray-600">
                  Pantau update dan informasi penting terbaru
                </p>
              </div>

              {/* Notification List */}
              <div className="space-y-3">
                {notifications.map((notif) => {
                  const Icon = notif.icon;
                  const typeColors = {
                    alert: 'bg-red-50 text-red-600',
                    success: 'bg-green-50 text-green-600',
                    info: 'bg-blue-50 text-blue-600',
                  };

                  return (
                    <div
                      key={notif.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                            typeColors[notif.type as keyof typeof typeColors]
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {notif.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notif.time}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State */}
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  Tidak ada notifikasi baru
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="notifications" />
    </div>
  );
}
