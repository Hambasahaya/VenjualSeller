'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import EmailInput from '@/components/EmailInput';
import Button from '@/components/Button';
import { ApiError, requestPasswordResetEmail, verifyPasswordResetToken } from '@/lib/services';
import { Mail } from 'lucide-react';

type PasswordResetStep = 'request' | 'verify';

const PASSWORD_RESET_EMAIL_KEY = 'password_reset_email';
const PASSWORD_RESET_TOKEN_KEY = 'password_reset_token';
const PASSWORD_RESET_USER_ID_KEY = 'password_reset_user_id';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<PasswordResetStep>('request');
  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    const storedEmail =
      typeof window !== 'undefined'
        ? localStorage.getItem(PASSWORD_RESET_EMAIL_KEY)?.trim() ?? ''
        : '';

    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleRequestSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfoMessage('');

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Email format is invalid');
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordResetEmail({ email: normalizedEmail });

      if (typeof window !== 'undefined') {
        localStorage.setItem(PASSWORD_RESET_EMAIL_KEY, normalizedEmail);
        localStorage.removeItem(PASSWORD_RESET_TOKEN_KEY);
        localStorage.removeItem(PASSWORD_RESET_USER_ID_KEY);
      }

      setStep('verify');
      setInfoMessage(
        response.message ||
          'Kode verifikasi berhasil dikirim. Silakan cek email Anda.'
      );
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Gagal mengirim email reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfoMessage('');

    const normalizedToken = verificationToken.trim();
    const normalizedEmail = email.trim();

    if (!normalizedToken) {
      setError('Verification code is required');
      return;
    }

    setLoading(true);

    try {
      const response = await verifyPasswordResetToken({
        email: normalizedEmail,
        token: normalizedToken,
      });
      const resolvedToken =
        response.reset_token ??
        response.verify_token ??
        response.token ??
        normalizedToken;
      const resolvedUserId =
        response.user_id !== undefined && response.user_id !== null
          ? String(response.user_id).trim()
          : '';

      if (typeof window !== 'undefined') {
        localStorage.setItem(PASSWORD_RESET_EMAIL_KEY, normalizedEmail);
        localStorage.setItem(PASSWORD_RESET_TOKEN_KEY, resolvedToken);
        if (resolvedUserId) {
          localStorage.setItem(PASSWORD_RESET_USER_ID_KEY, resolvedUserId);
        } else {
          localStorage.removeItem(PASSWORD_RESET_USER_ID_KEY);
        }
      }

      router.push(
        `/auth/reset-password?email=${encodeURIComponent(
          normalizedEmail
        )}&token=${encodeURIComponent(resolvedToken)}${
          resolvedUserId ? `&user_id=${encodeURIComponent(resolvedUserId)}` : ''
        }`
      );
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Kode verifikasi tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const logoComponent = (
    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
      <Mail className="w-10 h-10 text-blue-600" />
    </div>
  );

  return (
    <AuthLayout
      title="Lupa Password?"
      subtitle={
        step === 'request'
          ? 'Kami akan membantu Anda mengatur ulang password'
          : 'Masukkan kode verifikasi dari email'
      }
      logo={logoComponent}
    >
      {step === 'request' ? (
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-4">
              Masukkan email akun Anda. Kami akan mengirimkan kode verifikasi
              untuk melanjutkan proses reset password.
            </p>
          </div>

          {infoMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {infoMessage}
            </div>
          )}

          <EmailInput
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) {
                setError('');
              }
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
            Kirim Kode Verifikasi
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <p>Kode verifikasi telah dikirim ke:</p>
            <p className="mt-1 font-semibold">{email}</p>
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationToken}
              onChange={(e) => {
                setVerificationToken(e.target.value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="Masukkan kode dari email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`w-full rounded-lg border bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            variant="primary"
            size="md"
          >
            Verifikasi Kode
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep('request');
              setVerificationToken('');
              setError('');
              setInfoMessage('');
              if (typeof window !== 'undefined') {
                localStorage.removeItem(PASSWORD_RESET_TOKEN_KEY);
                localStorage.removeItem(PASSWORD_RESET_USER_ID_KEY);
              }
            }}
            className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ganti email atau kirim ulang kode
          </button>
        </form>
      )}

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
