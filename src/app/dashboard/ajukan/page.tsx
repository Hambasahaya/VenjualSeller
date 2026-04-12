'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Package, Upload, X } from 'lucide-react';

type SubmissionType = 'add-machine' | 'upgrade-machine' | 'withdrawal' | '';

interface FormData {
  submissionType: SubmissionType;
  machineName: string;
  location: string;
  category: string;
  capacity: string;
  description: string;
  withdrawalAmount: string;
  uploadedFile: File | null;
  // For upgrade machine
  existingMachineId: string;
  upgradePurpose: string;
  currentCondition: string;
}

export default function AjukanPage() {
  const [formData, setFormData] = useState<FormData>({
    submissionType: 'add-machine',
    machineName: '',
    location: '',
    category: '',
    capacity: '',
    description: '',
    withdrawalAmount: '',
    uploadedFile: null,
    existingMachineId: '',
    upgradePurpose: '',
    currentCondition: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const submissionTypes = [
    { value: 'add-machine', label: 'Tambah Mesin Baru' },
    { value: 'upgrade-machine', label: 'Upgrade Mesin' },
    { value: 'withdrawal', label: 'Ajukan Pencairan' },
  ];

  const categories = [
    { value: 'vending', label: 'Vending Machine' },
    { value: 'laundry', label: 'Mesin Laundry' },
    { value: 'space', label: 'Locker Space' },
  ];

  // Mock data for existing machines
  const existingMachines = [
    { id: 'VM-JKT-001', name: 'Vending Kopi - Mall Central Park' },
    { id: 'VM-JKT-002', name: 'Vending Snack - Gedung Sudirman' },
    { id: 'LM-JKT-003', name: 'Laundry Otomatis - UI Depok' },
  ];

  const digitalBalance = 7500000; // Dummy saldo digital

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          file: 'Format file harus PNG, JPG, atau PDF',
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          file: 'Ukuran file tidak boleh lebih dari 5MB',
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        uploadedFile: file,
      }));
      setErrors((prev) => ({
        ...prev,
        file: '',
      }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          file: 'Format file harus PNG, JPG, atau PDF',
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          file: 'Ukuran file tidak boleh lebih dari 5MB',
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        uploadedFile: file,
      }));
      setErrors((prev) => ({
        ...prev,
        file: '',
      }));
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({
      ...prev,
      uploadedFile: null,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.submissionType) {
      newErrors.submissionType = 'Jenis pengajuan harus dipilih';
    }

    if (formData.submissionType === 'add-machine') {
      if (!formData.machineName.trim()) {
        newErrors.machineName = 'Nama mesin harus diisi';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Lokasi/Alamat harus diisi';
      }
      if (!formData.category) {
        newErrors.category = 'Kategori harus dipilih';
      }
      if (!formData.capacity.trim()) {
        newErrors.capacity = 'Kapasitas harus diisi';
      }
    } else if (formData.submissionType === 'upgrade-machine') {
      if (!formData.existingMachineId) {
        newErrors.existingMachineId = 'Pilih mesin yang ingin di-upgrade';
      }
      if (!formData.upgradePurpose.trim()) {
        newErrors.upgradePurpose = 'Tujuan upgrade harus diisi';
      }
    } else if (formData.submissionType === 'withdrawal') {
      const amount = Number(formData.withdrawalAmount);
      if (!formData.withdrawalAmount || Number.isNaN(amount) || amount <= 0) {
        newErrors.withdrawalAmount = 'Jumlah pencairan harus diisi';
      } else if (amount > digitalBalance) {
        newErrors.withdrawalAmount =
          'Jumlah pencairan tidak boleh melebihi saldo digital';
      }
    }

    if (
      formData.submissionType !== 'withdrawal' &&
      !formData.description.trim()
    ) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log('Form submitted:', formData);
      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          submissionType: 'add-machine',
          machineName: '',
          location: '',
          category: '',
          capacity: '',
          description: '',
          withdrawalAmount: '',
          uploadedFile: null,
          existingMachineId: '',
          upgradePurpose: '',
          currentCondition: '',
        });
        setErrors({});
        setSubmitted(false);
      }, 3000);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="ajukan" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Pemilik Mesin" userRole="Partner" />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-2xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Pengajuan Baru
                </h1>
                <p className="text-sm text-gray-600">
                  {formData.submissionType === 'add-machine'
                    ? 'Ajukan mesin baru'
                    : formData.submissionType === 'upgrade-machine'
                      ? 'Upgrade mesin Anda'
                      : 'Ajukan pencairan saldo digital'}
                </p>
              </div>

              {/* Success Message */}
              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium text-sm">
                    ✓ Pengajuan Anda berhasil dikirim. Tim kami akan menghubungi Anda segera.
                  </p>
                </div>
              )}

              {/* Form Container */}
              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Form Section Title */}
                  <h2 className="text-lg font-semibold text-gray-900">
                    Form Pengajuan
                  </h2>

                  {/* Jenis Pengajuan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Pengajuan
                    </label>
                    <select
                      name="submissionType"
                      value={formData.submissionType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 appearance-none cursor-pointer bg-gray-50 ${
                        errors.submissionType
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    >
                      {submissionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.submissionType && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.submissionType}
                      </p>
                    )}
                  </div>

                  {/* FORM FOR TAMBAH MESIN BARU */}
                  {formData.submissionType === 'add-machine' && (
                    <>
                      {/* Nama Mesin */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Mesin
                        </label>
                        <input
                          type="text"
                          name="machineName"
                          placeholder="Masukkan nama"
                          value={formData.machineName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 bg-gray-50 ${
                            errors.machineName
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.machineName && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.machineName}
                          </p>
                        )}
                      </div>

                      {/* Lokasi/Alamat */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lokasi/Alamat
                        </label>
                        <input
                          type="text"
                          name="location"
                          placeholder="Masukkan alamat"
                          value={formData.location}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 bg-gray-50 ${
                            errors.location
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.location && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.location}
                          </p>
                        )}
                      </div>

                      {/* Kategori */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kategori
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 appearance-none cursor-pointer bg-gray-50 ${
                            errors.category
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Pilih kategori</option>
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        {errors.category && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.category}
                          </p>
                        )}
                      </div>

                      {/* Kapasitas */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kapasitas
                        </label>
                        <input
                          type="text"
                          name="capacity"
                          placeholder="Contoh: 50 slot"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 bg-gray-50 ${
                            errors.capacity
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.capacity && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.capacity}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* FORM FOR UPGRADE MESIN */}
                  {formData.submissionType === 'upgrade-machine' && (
                    <>
                      {/* Pilih Mesin yang Ingin Di-upgrade */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mesin yang Ingin Di-upgrade
                        </label>
                        <select
                          name="existingMachineId"
                          value={formData.existingMachineId}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 appearance-none cursor-pointer bg-gray-50 ${
                            errors.existingMachineId
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Pilih mesin</option>
                          {existingMachines.map((machine) => (
                            <option key={machine.id} value={machine.id}>
                              {machine.name}
                            </option>
                          ))}
                        </select>
                        {errors.existingMachineId && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.existingMachineId}
                          </p>
                        )}
                      </div>

                      {/* Kondisi Sekarang */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kondisi Mesin Sekarang
                        </label>
                        <textarea
                          name="currentCondition"
                          placeholder="Jelaskan kondisi mesin saat ini..."
                          value={formData.currentCondition}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none text-gray-900 bg-gray-50"
                          rows={3}
                        />
                      </div>

                      {/* Tujuan Upgrade */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tujuan Upgrade
                        </label>
                        <input
                          type="text"
                          name="upgradePurpose"
                          placeholder="Contoh: Menambah kapasitas, Penggantian komponen"
                          value={formData.upgradePurpose}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 bg-gray-50 ${
                            errors.upgradePurpose
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.upgradePurpose && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.upgradePurpose}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* FORM FOR AJUKAN PENCAIRAN */}
                  {formData.submissionType === 'withdrawal' && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="text-xs text-blue-700">Saldo Digital</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {formatCurrency(digitalBalance)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jumlah Pencairan
                        </label>
                        <input
                          type="number"
                          name="withdrawalAmount"
                          placeholder="Contoh: 1000000"
                          value={formData.withdrawalAmount}
                          onChange={handleInputChange}
                          min={1}
                          max={digitalBalance}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 bg-gray-50 ${
                            errors.withdrawalAmount
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Maksimal {formatCurrency(digitalBalance)}
                        </p>
                        {errors.withdrawalAmount && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.withdrawalAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deskripsi (untuk tambah/upgrade) */}
                  {formData.submissionType !== 'withdrawal' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        name="description"
                        placeholder="Jelaskan detail pengajuan Anda"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none text-gray-900 bg-gray-50 ${
                          errors.description
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        rows={4}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* File Upload */}
                  {formData.submissionType !== 'withdrawal' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto/Dokumen Pendukung
                      </label>

                      {!formData.uploadedFile ? (
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            dragActive
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 bg-gray-50'
                          } ${errors.file ? 'border-red-500 bg-red-50' : ''}`}
                        >
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="fileInput"
                          />
                          <label
                            htmlFor="fileInput"
                            className="cursor-pointer"
                          >
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Klik untuk upload foto
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG hingga 5MB
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Package className="w-8 h-8 text-blue-600" />
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-900">
                                  {formData.uploadedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(formData.uploadedFile.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                      {errors.file && (
                        <p className="mt-1 text-sm text-red-500">{errors.file}</p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    ⓘ Kirim Pengajuan
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="ajukan" />
    </div>
  );
}
