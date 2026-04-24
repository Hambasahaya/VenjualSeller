'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import EmailInput from '@/components/EmailInput';
import PasswordInput from '@/components/PasswordInput';
import Checkbox from '@/components/Checkbox';
import Button from '@/components/Button';
import { Shield } from 'lucide-react';
import { loginUser, ApiError } from '@/lib/services';
import { useRedirectIfAuthenticated } from '@/lib/auth';

function LoginPageFallback() {
  return (
    <AuthLayout
      title="Partner Venjual"
      subtitle="Portal Mitra - Kelola Bisnis Anda"
      logo={
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-10 h-10 text-blue-600" />
        </div>
      }
    >
      <div className="py-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600">Memuat halaman login...</p>
      </div>
    </AuthLayout>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});
  const checkingSession = useRedirectIfAuthenticated('/dashboard');
  const redirectTo = useMemo(() => {
    const redirectPath = searchParams.get('redirect');
    return redirectPath?.startsWith('/dashboard') ? redirectPath : '/dashboard';
  }, [searchParams]);
  const emailFromQuery = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams]);
  const emailVerified = searchParams.get('verified') === '1';
  const [showVerificationHelp, setShowVerificationHelp] = useState(false);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      return;
    }

    const rememberedEmail = localStorage.getItem('remember_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [emailFromQuery]);

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
    setErrors({});
    setShowVerificationHelp(false);
    try {
      // Call login API
      await loginUser({ email, password });
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }
      
      // Redirect to dashboard
      window.location.replace(redirectTo);
      return;
    } catch (error) {
      const apiError = error as ApiError;
      setShowVerificationHelp(
        /verif|verify|aktivasi|email.+belum/i.test(apiError.message || '')
      );
      setErrors({ api: apiError.message });
    } finally {
      setLoading(false);
    }
  };

  const logoComponent = (
    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
      <Shield className="w-10 h-10 text-blue-600" />
    </div>
  );

  if (checkingSession) {
    return (
      <AuthLayout
        title="Partner Venjual"
        subtitle="Portal Mitra - Kelola Bisnis Anda"
        logo={logoComponent}
      >
        <div className="py-10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Memeriksa sesi login...</p>
        </div>
      </AuthLayout>
    );
  }

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

        {/* Error Message */}
        {errors.api && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.api}
          </div>
        )}

        {emailVerified && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Email berhasil diverifikasi. Silakan login menggunakan akun Anda.
          </div>
        )}

        {showVerificationHelp && email.trim() && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            Akun Anda kemungkinan belum diverifikasi.
            {' '}
            <Link
              href={`/auth/verify-email?email=${encodeURIComponent(email.trim())}`}
              className="font-semibold underline underline-offset-2"
            >
              Buka halaman verifikasi email
            </Link>
          </div>
        )}

        <EmailInput
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setShowVerificationHelp(false);
            if (errors.email) {
              setErrors({ ...errors, email: '' });
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
              setErrors({ ...errors, password: '' });
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

    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
