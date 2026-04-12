'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import EmailInput from '@/components/EmailInput';
import PasswordInput from '@/components/PasswordInput';
import TextInput from '@/components/TextInput';
import Checkbox from '@/components/Checkbox';
import Button from '@/components/Button';
import { User, Building2 } from 'lucide-react';

export default function RegisterPage() {
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
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(formData);
      // Redirect to verify email
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
