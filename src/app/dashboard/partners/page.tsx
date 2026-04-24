'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Users, Plus, Search, Loader2 } from 'lucide-react';
import { getProducts, Product } from '@/lib/services/product';
import { ApiError } from '@/lib/services/api';

export default function PartnersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await getProducts();
        setProducts(result.data);
        setFilteredProducts(result.data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Gagal memuat mitra');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredProducts(filtered);
  };
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="partners" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Mitra Saya
                  </h1>
                  <p className="text-gray-600">
                    Kelola dan lihat daftar mitra bisnis Anda
                  </p>
                </div>
                <button className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <Plus className="w-4 h-4" />
                  Tambah Mitra
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari mitra..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-gray-600">Memuat mitra...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Partners Grid */}
              {!loading && filteredProducts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 md:p-6"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Rp {product.price?.toLocaleString('id-ID') || '0'}
                          </p>
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
                        Lihat Detail
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredProducts.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 text-center">
                    {searchTerm ? 'Tidak ada mitra yang cocok' : 'Belum ada mitra'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="partners" />
    </div>
  );
}
