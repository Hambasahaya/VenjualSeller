'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import PasswordInput from '@/components/PasswordInput';
import Button from '@/components/Button';
import { ApiError, resetPasswordWithToken } from '@/lib/services';
import { PASSWORD_POLICY_MESSAGE, validatePasswordPolicy } from '@/lib/password-policy';
import { Lock, CheckCircle2 } from 'lucide-react';

const PASSWORD_RESET_EMAIL_KEY = 'password_reset_email';
const PASSWORD_RESET_TOKEN_KEY = 'password_reset_token';
const PASSWORD_RESET_USER_ID_KEY = 'password_reset_user_id';

function ResetPasswordPageFallback() {
  return (
    <AuthLayout
      title="Atur Ulang Password"
      subtitle="Masukkan password baru Anda"
      logo={
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-blue-600" />
        </div>
      }
    >
      <div className="py-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600">Memuat data reset password...</p>
      </div>
    </AuthLayout>
  );
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams]);
  const queryToken = useMemo(
    () =>
      searchParams.get('token')?.trim() ??
      searchParams.get('verify_token')?.trim() ??
      '',
    [searchParams]
  );
  const queryUserId = useMemo(
    () => searchParams.get('user_id')?.trim() ?? '',
    [searchParams]
  );
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedEmail =
      typeof window !== 'undefined'
        ? localStorage.getItem(PASSWORD_RESET_EMAIL_KEY)?.trim() ?? ''
        : '';
    const storedToken =
      typeof window !== 'undefined'
        ? localStorage.getItem(PASSWORD_RESET_TOKEN_KEY)?.trim() ?? ''
        : '';
    const storedUserId =
      typeof window !== 'undefined'
        ? localStorage.getItem(PASSWORD_RESET_USER_ID_KEY)?.trim() ?? ''
        : '';

    setEmail(queryEmail || storedEmail);
    setToken(queryToken || storedToken);
    setUserId(queryUserId || storedUserId);
  }, [queryEmail, queryToken, queryUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!token.trim()) {
      newErrors.token = 'Token reset password tidak ditemukan';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    } else {
      const passwordError = validatePasswordPolicy(password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
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
    setErrors({});
    try {
      await resetPasswordWithToken({
        email: email.trim() || undefined,
        user_id: userId.trim() || undefined,
        verify_token: token.trim(),
        new_password: password,
        confirm_password: confirmPassword,
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem(PASSWORD_RESET_EMAIL_KEY);
        localStorage.removeItem(PASSWORD_RESET_TOKEN_KEY);
        localStorage.removeItem(PASSWORD_RESET_USER_ID_KEY);
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.replace(
          email.trim()
            ? `/auth/login?email=${encodeURIComponent(email.trim())}`
            : '/auth/login'
        );
      }, 1800);
    } catch (err) {
      const apiError = err as ApiError;
      setErrors({
        api: apiError.message || 'Gagal mengatur ulang password.',
      });
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

          <Link
            href={email.trim() ? `/auth/login?email=${encodeURIComponent(email.trim())}` : '/auth/login'}
            className="w-full"
          >
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
            Silakan masukkan password baru Anda sesuai aturan keamanan yang
            ditetapkan.
          </p>
          {email && (
            <p className="mt-3 text-sm font-medium text-gray-900">
              Email: {email}
            </p>
          )}
        </div>

        {errors.api && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.api}
          </div>
        )}

        {errors.token && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.token}
          </div>
        )}

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
            <strong>Aturan password:</strong> {PASSWORD_POLICY_MESSAGE}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
