'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import PasswordInput from '@/components/PasswordInput';
import Button from '@/components/Button';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const logoComponent = (
    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
      <Lock className="w-10 h-10 text-blue-600" />
    </div>
  );

  if (success) {
    return (
      <AuthLayout
        title="Password Berhasil Diatur Ulang"
        subtitle="Akun Anda sudah siap"
        logo={
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        }
      >
        <div className="text-center py-4">
          <p className="text-gray-600 mb-8">
            Password Anda telah berhasil diatur ulang. Silakan login dengan password
            baru Anda.
          </p>

          <Link href="/auth/login" className="w-full">
            <Button fullWidth variant="primary" size="md">
              Ke Halaman Login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Atur Ulang Password"
      subtitle="Masukkan password baru Anda"
      logo={logoComponent}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-6">
          <p className="text-gray-600 text-sm">
            Silakan masukkan password baru Anda. Password harus minimal 8 karakter
            dan mengandung kombinasi huruf dan angka.
          </p>
        </div>

        <PasswordInput
          label="Password Baru"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors((prev) => ({ ...prev, password: '' }));
            }
          }}
          error={errors.password}
        />

        <PasswordInput
          label="Konfirmasi Password"
          placeholder="Ulangi password Anda"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) {
              setErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }
          }}
          error={errors.confirmPassword}
        />

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>List Password:</strong> Minimal 8 karakter, gunakan kombinasi
            huruf besar, huruf kecil, angka, dan simbol untuk keamanan maksimal.
          </p>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          variant="primary"
          size="md"
          className="mt-6"
        >
          Atur Ulang Password
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
