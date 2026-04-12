'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import EmailInput from '@/components/EmailInput';
import Button from '@/components/Button';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email format is invalid');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const logoComponent = (
    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
      <Mail className="w-10 h-10 text-blue-600" />
    </div>
  );

  if (submitted) {
    return (
      <AuthLayout
        title="Link Pengaturan Ulang Dikirim"
        subtitle="Periksa email Anda"
        logo={
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        }
      >
        <div className="text-center py-4">
          <p className="text-gray-600 mb-2">
            Kami telah mengirimkan link pengaturan ulang password ke:
          </p>
          <p className="font-semibold text-gray-900 mb-6">{email}</p>

          <p className="text-gray-600 text-sm mb-8">
            Silakan cek email Anda dan klik link untuk mengatur ulang password Anda.
            Link akan berlaku selama 24 jam.
          </p>

          <Link href="/auth/login" className="w-full">
            <Button fullWidth variant="primary" size="md">
              Kembali ke Login
            </Button>
          </Link>

          <p className="text-gray-600 text-sm mt-6">
            Belum menerima email?{' '}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Coba lagi
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Lupa Password?"
      subtitle="Kami akan membantu Anda mengatur ulang"
      logo={logoComponent}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-4">
            Masukkan email akun Anda dan kami akan mengirimkan link untuk mengatur
            ulang password Anda.
          </p>
        </div>

        <EmailInput
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="partner@venjual.com"
          error={error}
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          variant="primary"
          size="md"
        >
          Kirim Link Reset
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-gray-600 text-sm">
          Kembali ke{' '}
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
