'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import EmailInput from '@/components/EmailInput';
import PasswordInput from '@/components/PasswordInput';
import TextInput from '@/components/TextInput';
import Checkbox from '@/components/Checkbox';
import Button from '@/components/Button';
import { User, Building2 } from 'lucide-react';
import { registerUser, ApiError } from '@/lib/services';
import { PASSWORD_POLICY_MESSAGE, validatePasswordPolicy } from '@/lib/password-policy';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nama lengkap is required';
    }
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Nama bisnis is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else {
      const passwordError = validatePasswordPolicy(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Call register API
      await registerUser({
        username: formData.email.split('@')[0], // Use email prefix as username
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
      });
      
      // Store email for verify-email page
      localStorage.setItem('pending_email', formData.email);
      
      // Redirect to verify email
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      const apiError = error as ApiError;
      setErrors({ api: apiError.message });
    } finally {
      setLoading(false);
    }
  };

  const logoComponent = (
    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
      <Building2 className="w-10 h-10 text-blue-600" />
    </div>
  );

  return (
    <AuthLayout
      title="Daftar sebagai Partner"
      subtitle="Bergabunglah dengan Venjual Partner Anda"
      logo={logoComponent}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Buat Akun Baru
        </h2>

        {/* API Error Message */}
        {errors.api && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.api}
          </div>
        )}

        <TextInput
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap Anda"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          error={errors.fullName}
          icon={<User className="w-5 h-5" />}
        />

        <TextInput
          label="Nama Bisnis"
          placeholder="Masukkan nama bisnis Anda"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          error={errors.businessName}
          icon={<Building2 className="w-5 h-5" />}
        />

        <EmailInput
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="partner@venjual.com"
          error={errors.email}
        />

        <TextInput
          type="tel"
          label="Nomor Telepon"
          placeholder="Contoh: 081234567890"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          error={errors.phone}
        />

        <PasswordInput
          label="Password"
          placeholder="Minimal 8 karakter"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
        />

        <p className="text-xs text-gray-500 -mt-2">
          {PASSWORD_POLICY_MESSAGE}
        </p>

        <PasswordInput
          label="Konfirmasi Password"
          placeholder="Ulangi password Anda"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
        />

        <div className="pt-2">
          <Checkbox
            label="Saya setuju dengan Syarat & Ketentuan dan Kebijakan Privasi"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (errors.terms) {
                setErrors((prev) => ({ ...prev, terms: '' }));
              }
            }}
            error={errors.terms}
          />
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          variant="primary"
          size="md"
          className="mt-6"
        >
          Daftar
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-gray-600 text-sm">
          Sudah punya akun?{' '}
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Login di sini
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
