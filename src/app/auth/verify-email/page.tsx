'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import EmailInput from '@/components/EmailInput';
import { CheckCircle2, Mail } from 'lucide-react';
import {
  ApiError,
  requestVerificationEmail,
  verifyEmailToken,
} from '@/lib/services';

const RESEND_INTERVAL_SECONDS = 60;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function VerifyEmailPageFallback() {
  return (
    <AuthLayout
      title="Verifikasi Email"
      subtitle="Klik link dari email atau masukkan token verifikasi Anda"
      logo={
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
          <Mail className="w-10 h-10 text-blue-600" />
        </div>
      }
    >
      <div className="py-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600">Memuat data verifikasi...</p>
      </div>
    </AuthLayout>
  );
}

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams]);
  const tokenFromQuery = useMemo(
    () =>
      searchParams.get('token')?.trim() ??
      searchParams.get('verify_token')?.trim() ??
      '',
    [searchParams]
  );
  const autoVerifyAttemptedRef = useRef(false);

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const pendingEmail =
      emailFromQuery ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('pending_email')?.trim() ?? ''
        : '');

    if (pendingEmail) {
      setEmail(pendingEmail);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_email', pendingEmail);
      }
    }

    if (tokenFromQuery) {
      setToken(tokenFromQuery);
    }
  }, [emailFromQuery, tokenFromQuery]);

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendTimer((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const handleVerificationSuccess = useCallback(() => {
    setVerified(true);
    setError('');
    setInfoMessage('Email berhasil diverifikasi. Anda akan diarahkan ke halaman login.');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('pending_email');
    }

    window.setTimeout(() => {
      const query = email.trim()
        ? `?email=${encodeURIComponent(email.trim())}&verified=1`
        : '?verified=1';
      router.replace(`/auth/login${query}`);
    }, 2200);
  }, [email, router]);

  const performVerify = useCallback(async (nextToken?: string) => {
    const resolvedToken = (nextToken ?? token).trim();

    if (!resolvedToken) {
      setError('Token verifikasi harus diisi.');
      return;
    }

    setVerifyLoading(true);
    setError('');
    setInfoMessage('');

    try {
      await verifyEmailToken({ token: resolvedToken });
      handleVerificationSuccess();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Token verifikasi tidak valid.');
    } finally {
      setVerifyLoading(false);
    }
  }, [handleVerificationSuccess, token]);

  useEffect(() => {
    if (!tokenFromQuery || autoVerifyAttemptedRef.current) {
      return;
    }

    autoVerifyAttemptedRef.current = true;
    setInfoMessage('Memverifikasi token dari link email...');
    void performVerify(tokenFromQuery);
  }, [performVerify, tokenFromQuery]);

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await performVerify();
  };

  const handleResendVerificationEmail = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('Email harus diisi untuk mengirim ulang email verifikasi.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Format email tidak valid.');
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      const response = await requestVerificationEmail({ email: normalizedEmail });
      setInfoMessage(
        response.message || 'Email verifikasi baru berhasil dikirim.'
      );
      setResendTimer(RESEND_INTERVAL_SECONDS);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_email', normalizedEmail);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setResendLoading(false);
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
        subtitle="Akun Anda siap digunakan"
        logo={
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        }
      >
        <div className="py-4 text-center">
          <p className="mb-6 text-gray-600">
            Verifikasi email berhasil. Silakan login menggunakan akun Anda.
          </p>

          <Link
            href={email.trim() ? `/auth/login?email=${encodeURIComponent(email.trim())}&verified=1` : '/auth/login?verified=1'}
            className="w-full"
          >
            <Button fullWidth variant="primary" size="md">
              Lanjut ke Login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verifikasi Email"
      subtitle="Klik link dari email atau masukkan token verifikasi Anda"
      logo={logoComponent}
    >
      <form onSubmit={handleVerifySubmit} className="space-y-4">
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          Email verifikasi dikirim setelah registrasi. Jika Anda membuka link dari email,
          halaman ini akan mencoba memverifikasi token secara otomatis.
        </div>

        {infoMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {infoMessage}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <EmailInput
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError('');
            setInfoMessage('');
          }}
          placeholder="partner@venjual.com"
        />

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Verification Token
          </label>
          <input
            type="text"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setError('');
              setInfoMessage('');
            }}
            placeholder="Paste token dari email di sini"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Token bisa berasal dari link email atau disalin langsung dari isi email.
          </p>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={verifyLoading}
          variant="primary"
          size="md"
        >
          Verifikasi Token
        </Button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-6 text-center">
        <p className="mb-4 text-sm text-gray-600">
          Belum menerima email verifikasi?
        </p>

        <Button
          type="button"
          fullWidth
          variant="outline"
          size="md"
          loading={resendLoading}
          disabled={resendTimer > 0}
          onClick={handleResendVerificationEmail}
        >
          {resendTimer > 0
            ? `Kirim ulang dalam ${resendTimer}s`
            : 'Request Verification Email'}
        </Button>

        <p className="mt-4 text-sm text-gray-600">
          Sudah terverifikasi?
          {' '}
          <Link
            href={email.trim() ? `/auth/login?email=${encodeURIComponent(email.trim())}` : '/auth/login'}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Kembali ke login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailPageFallback />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
