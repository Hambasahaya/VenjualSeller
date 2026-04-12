'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import EmailInput from '@/components/EmailInput';
import PasswordInput from '@/components/PasswordInput';
import Checkbox from '@/components/Checkbox';
import Button from '@/components/Button';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log({ email, password, rememberMe });
    } finally {
      setLoading(false);
    }
  };

  const logoComponent = (
    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
      <Shield className="w-10 h-10 text-blue-600" />
    </div>
  );

  return (
    <AuthLayout
      title="Partner Venjual"
      subtitle="Portal Mitra - Kelola Bisnis Anda"
      logo={logoComponent}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Login ke Akun Anda
        </h2>

        <EmailInput
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) {
              setErrors({ ...errors, email: undefined });
            }
          }}
          placeholder="partner@venjual.com"
          error={errors.email}
        />

        <PasswordInput
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors({ ...errors, password: undefined });
            }
          }}
          placeholder="Masukkan password"
          error={errors.password}
        />

        <div className="flex items-center justify-between mb-6">
          <Checkbox
            label="Ingat saya"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Lupa password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          variant="primary"
          size="md"
        >
          Login
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-gray-600 text-sm mb-4">
          Atau gunakan akun demo
        </p>

        <div className="space-y-3">
          {[
            { name: 'Pemilik Mitra Pesan', email: 'pemilik@venjual.com' },
            { name: 'Penyedia Lokasi', email: 'lokasi@venjual.com' },
            { name: 'Supplier Produk', email: 'supplier@venjual.com' },
            { name: 'Partner Laundry', email: 'laundry@venjual.com' },
          ].map((demo) => (
            <div key={demo.email} className="text-sm">
              <p className="font-medium text-gray-900">{demo.name}</p>
              <p className="text-gray-500">{demo.email}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Belum punya akun?{' '}
          <Link
            href="/auth/register"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Daftar sebagai Partner
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
