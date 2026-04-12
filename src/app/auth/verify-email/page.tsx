'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Handle timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCodes = [...codes];
      newCodes[index] = value;
      setCodes(newCodes);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = codes.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setVerified(true);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResendTimer(60);
    } finally {
      setLoading(false);
    }
  };

  const logoComponent = (
    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
      <Mail className="w-10 h-10 text-blue-600" />
    </div>
  );

  if (verified) {
    return (
      <AuthLayout
        title="Email Terverifikasi"
        subtitle="Akun Anda telah berhasil diverifikasi"
        logo={
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        }
      >
        <div className="text-center py-4">
          <p className="text-gray-600 mb-8">
            Selamat! Email Anda telah berhasil diverifikasi. Silakan login dengan
            akun Anda.
          </p>

          <Link href="/auth/login" className="w-full">
            <Button fullWidth variant="primary" size="md">
              Kembali ke Login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verifikasi Email"
      subtitle="Kami telah mengirimkan kode verifikasi"
      logo={logoComponent}
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-4">
            Masukkan kode verifikasi 6 digit yang telah kami kirimkan ke email
            Anda.
          </p>

          <div className="flex justify-between gap-2 mb-4">
            {codes.map((code, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 md:w-14 md:h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          variant="primary"
          size="md"
        >
          Verifikasi
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-gray-600 text-sm mb-4">Tidak menerima kode?</p>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendTimer > 0 || loading}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {resendTimer > 0
            ? `Kirim ulang dalam ${resendTimer}s`
            : 'Kirim ulang kode'}
        </button>
      </div>
    </AuthLayout>
  );
}
