'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import {
  getCurrentUserProfile,
  normalizeApiError,
  updateCurrentUserProfile,
  User as UserType,
} from '@/lib/services';
import { useRequireAuth } from '@/lib/auth';

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  address: string;
  avatarUrl: string;
};

function mapProfileToForm(profile: UserType): ProfileForm {
  return {
    fullName: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    city: profile.city || '',
    province: profile.province || '',
    address: profile.address || '',
    avatarUrl: profile.avatar_url || '',
  };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
}

export default function EditAccountPage() {
  const router = useRouter();
  const checkingSession = useRequireAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    province: '',
    address: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});

  useEffect(() => {
    if (checkingSession) {
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
        setForm(mapProfileToForm(userProfile));
      } catch (err) {
        const apiError = normalizeApiError(err, 'Gagal memuat profil.');
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [checkingSession]);

  const avatarLabel = useMemo(
    () => getInitials(form.fullName || profile?.username || 'PV'),
    [form.fullName, profile?.username]
  );

  const handleFieldChange = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccessMessage('');
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof ProfileForm, string>> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Nama lengkap wajib diisi.';
    }

    if (form.phone.trim() && !/^[0-9+\-\s()]+$/.test(form.phone.trim())) {
      nextErrors.phone = 'Format nomor telepon belum valid.';
    }

    if (form.avatarUrl.trim()) {
      try {
        new URL(form.avatarUrl.trim());
      } catch {
        nextErrors.avatarUrl = 'URL foto profil harus valid.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      const updatedProfile = await updateCurrentUserProfile({
        full_name: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        province: form.province.trim() || undefined,
        address: form.address.trim() || undefined,
        avatar_url: form.avatarUrl.trim() || undefined,
      });

      setProfile(updatedProfile);
      setForm(mapProfileToForm(updatedProfile));
      setSuccessMessage('Profil berhasil diperbarui.');
    } catch (err) {
      const apiError = normalizeApiError(err, 'Gagal menyimpan perubahan profil.');
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="account" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={profile?.full_name || profile?.username || 'Partner'}
          userEmail={profile?.email}
        />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Edit Profil</h1>
                  <p className="text-sm text-gray-500">
                    Perbarui informasi akun partner Anda.
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center rounded-lg bg-white p-10 shadow-sm border border-gray-100">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-600">Memuat profil...</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 md:p-6"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <TextInput
                          label="Nama Lengkap"
                          placeholder="Masukkan nama lengkap"
                          value={form.fullName}
                          onChange={(event) => handleFieldChange('fullName', event.target.value)}
                          error={fieldErrors.fullName}
                          icon={<User className="w-5 h-5" />}
                        />
                      </div>

                      <div className="md:col-span-2 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={form.email}
                            disabled
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 cursor-not-allowed"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Email akun mengikuti data login dan belum bisa diubah dari sini.
                        </p>
                      </div>

                      <TextInput
                        type="tel"
                        label="Nomor Telepon"
                        placeholder="Contoh: 081234567890"
                        value={form.phone}
                        onChange={(event) => handleFieldChange('phone', event.target.value)}
                        error={fieldErrors.phone}
                        icon={<Phone className="w-5 h-5" />}
                      />

                      <TextInput
                        label="Kota"
                        placeholder="Contoh: Jakarta Barat"
                        value={form.city}
                        onChange={(event) => handleFieldChange('city', event.target.value)}
                        error={fieldErrors.city}
                        icon={<Building2 className="w-5 h-5" />}
                      />

                      <TextInput
                        label="Provinsi"
                        placeholder="Contoh: DKI Jakarta"
                        value={form.province}
                        onChange={(event) => handleFieldChange('province', event.target.value)}
                        error={fieldErrors.province}
                        icon={<MapPin className="w-5 h-5" />}
                      />

                      <TextInput
                        label="URL Foto Profil"
                        placeholder="https://example.com/avatar.jpg"
                        value={form.avatarUrl}
                        onChange={(event) => handleFieldChange('avatarUrl', event.target.value)}
                        error={fieldErrors.avatarUrl}
                        icon={<ImagePlus className="w-5 h-5" />}
                      />

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alamat
                        </label>
                        <textarea
                          value={form.address}
                          onChange={(event) => handleFieldChange('address', event.target.value)}
                          rows={5}
                          placeholder="Masukkan alamat lengkap"
                          className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors resize-y ${
                            fieldErrors.address
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {fieldErrors.address && (
                          <p className="mt-1 text-sm text-red-500">{fieldErrors.address}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <Link
                        href="/dashboard/account"
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Batal
                      </Link>
                      <Button
                        type="submit"
                        loading={submitting}
                        disabled={submitting}
                        variant="primary"
                        size="md"
                      >
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                      </Button>
                    </div>
                  </form>

                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 md:p-6 h-fit">
                    <div className="flex flex-col items-center text-center border-b border-gray-100 pb-5">
                      {form.avatarUrl ? (
                        <img
                          src={form.avatarUrl}
                          alt={form.fullName || 'Foto profil'}
                          className="w-24 h-24 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
                          {avatarLabel || 'PV'}
                        </div>
                      )}
                      <h2 className="mt-4 text-lg font-bold text-gray-900">
                        {form.fullName || profile?.username || 'Partner Venjual'}
                      </h2>
                      <p className="text-sm text-gray-500">{form.email || '-'}</p>
                    </div>

                    <div className="space-y-4 pt-5">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Partner ID</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {profile?.partner_id || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Nomor Telepon</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {form.phone || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Lokasi</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {[form.city, form.province].filter(Boolean).join(', ') || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Alamat</p>
                        <p className="text-sm font-semibold text-gray-900 whitespace-pre-line">
                          {form.address || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="account" />
    </div>
  );
}
