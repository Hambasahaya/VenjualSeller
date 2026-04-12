'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, AlertCircle, Wifi, Video, Zap, Copy } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';

interface MachineDetail {
  id: string;
  type: 'vending' | 'laundry' | 'space';
  name: string;
  location: string;
  address: string;
  dailyEarning: string;
  commission: string;
  commissionAmount: string;
  transactions: number;
  capacity: number;
  utilities: number;
  status: 'Aktif' | 'Maintenance' | 'Inactive';
  installationDate: string;
  commissionPercentage: string;
  cctvStatus: string;
  machineHours: string;
  channels: number;
  products: number;
}

// Mock machine data
const machineDetails: Record<string, MachineDetail> = {
  'VM-JKT-001': {
    id: 'VM-JKT-001',
    type: 'vending',
    name: 'Reguler Vending Machine',
    location: 'Mall Central Park Lt. 1',
    address: 'Latien S. Parman, Jakarta Barat',
    dailyEarning: 'Rp 450.000',
    commission: '20%',
    commissionAmount: 'Rp 90.000',
    transactions: 32,
    capacity: 60,
    utilities: 73,
    status: 'Aktif',
    installationDate: '15 Des. 2025',
    commissionPercentage: '20',
    cctvStatus: 'Terpasang',
    machineHours: '16/16 Channel',
    channels: 3,
    products: 18,
  },
  'VM-JKT-002': {
    id: 'VM-JKT-002',
    type: 'vending',
    name: 'Premium Vending Machine',
    location: 'Gedung Perkantoran Sudirman',
    address: 'Jl. Sudirman, Jakarta Pusat',
    dailyEarning: 'Rp 380.000',
    commission: '10%',
    commissionAmount: 'Rp 38.000',
    transactions: 28,
    capacity: 60,
    utilities: 65,
    status: 'Aktif',
    installationDate: '10 Okt. 2025',
    commissionPercentage: '10',
    cctvStatus: 'Tidak Terpasang',
    machineHours: '14/16 Channel',
    channels: 2,
    products: 15,
  },
};

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'setting' | 'produk' | 'aku'>('info');
  const [activeSettingTab, setActiveSettingTab] = useState<'koneksi' | 'gambar' | 'controller' | 'channel'>('koneksi');
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [wifiSSID, setWifiSSID] = useState('VendingMachine1');
  const [wifiPassword, setWifiPassword] = useState('Password WiFi');
  const [powerEnabled, setPowerEnabled] = useState(true);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [selectedControllerId, setSelectedControllerId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [editChannelForm, setEditChannelForm] = useState({
    type: '',
    capacity: '',
  });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    category: 'Minuman',
    stock: '',
    supplier: '',
  });
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    price: '',
    category: 'Minuman',
    supplier: '',
  });
  const [machineImageUrl, setMachineImageUrl] = useState(
    'https://images.unsplash.com/photo-1753863474-dfc2508b5bab?w=500&h=400&fit=crop'
  );
  const [controllers, setControllers] = useState([
    {
      id: 1,
      name: 'Controller 1',
      capacity: '16 channel',
      channelUsed: 16,
      channelTotal: 16,
    },
    {
      id: 2,
      name: 'Controller 2',
      capacity: '16 channel',
      channelUsed: 16,
      channelTotal: 16,
    },
    {
      id: 3,
      name: 'Controller 3',
      capacity: '16 channel',
      channelUsed: 12,
      channelTotal: 16,
    },
  ]);

  const [channels, setChannels] = useState([
    {
      id: 1,
      controllerId: 1,
      name: 'Channel 1',
      type: 'Tray - Spiral',
      product: 'Air Mineral 600ml',
      capacity: 25,
      stock: 18,
      status: true,
    },
    {
      id: 2,
      controllerId: 1,
      name: 'Channel 2',
      type: 'Tray - Spiral',
      product: 'Teh Botol Sosro',
      capacity: 25,
      stock: 15,
      status: true,
    },
    {
      id: 3,
      controllerId: 1,
      name: 'Channel 3',
      type: 'Tray - Spiral',
      product: 'Coca Cola 330ml',
      capacity: 25,
      stock: 12,
      status: true,
    },
    {
      id: 4,
      controllerId: 1,
      name: 'Channel 4',
      type: 'Tray - Spiral',
      product: 'Fanta Orange',
      capacity: 25,
      stock: 20,
      status: true,
    },
    {
      id: 5,
      controllerId: 1,
      name: 'Channel 5',
      type: 'Tray - Spiral',
      product: 'Sprite 330ml',
      capacity: 25,
      stock: 16,
      status: true,
    },
    {
      id: 6,
      controllerId: 1,
      name: 'Channel 6',
      type: 'Tray - Spiral',
      product: 'Pocari Sweat',
      capacity: 25,
      stock: 14,
      status: true,
    },
  ]);

  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Air Mineral 600ml',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1535950202760-b8b3e78bb8db?w=150&h=150&fit=crop',
      category: 'Minuman',
      tag: 'Aqua',
      stock: 100,
    },
    {
      id: 2,
      name: 'Teh Botol Sosro',
      price: 6000,
      image: 'https://images.unsplash.com/photo-1554688573-e32b59fd2b17?w=150&h=150&fit=crop',
      category: 'Minuman',
      tag: 'Sosro',
      stock: 80,
    },
    {
      id: 3,
      name: 'Coca Cola 330ml',
      price: 7000,
      image: 'https://images.unsplash.com/photo-1554866585-f91c7f91b9d2?w=150&h=150&fit=crop',
      category: 'Minuman',
      tag: 'Cola',
      stock: 65,
    },
    {
      id: 4,
      name: 'Fanta Orange',
      price: 6500,
      image: 'https://images.unsplash.com/photo-1535952514142-5d1d3c46a3a5?w=150&h=150&fit=crop',
      category: 'Minuman',
      tag: 'Fanta',
      stock: 72,
    },
    {
      id: 5,
      name: 'Sprite 330ml',
      price: 6500,
      image: 'https://images.unsplash.com/photo-1535945675385-6b8c3b5c8b5c?w=150&h=150&fit=crop',
      category: 'Minuman',
      tag: 'Sprite',
      stock: 55,
    },
    {
      id: 6,
      name: 'Pocari Sweat',
      price: 7500,
      image: 'https://images.unsplash.com/photo-1532634726-8021309a91d1?w=150&h=150&fit=crop',
      category: 'Minuman',
      tag: 'Sweat',
      stock: 48,
    },
  ]);

  const getProgressBarColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage === 100) return 'bg-red-600';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-600';
  };

  const handleAddController = (capacity: 'mini' | 'standar') => {
    const newControllerId = Math.max(...controllers.map((c) => c.id), 0) + 1;
    const channelCount = capacity === 'mini' ? 6 : 16;

    // Add new controller
    const newController = {
      id: newControllerId,
      name: `Controller ${newControllerId}`,
      capacity: `${channelCount} channel`,
      channelUsed: 0,
      channelTotal: channelCount,
    };
    setControllers([...controllers, newController]);

    // Add 1 new channel for the controller
    const newChannelId = Math.max(...channels.map((ch) => ch.id), 0) + 1;
    const newChannel = {
      id: newChannelId,
      controllerId: newControllerId,
      name: `Channel 1`,
      type: 'Tray - Spiral',
      product: 'Produk Baru',
      capacity: 25,
      stock: 0,
      status: true,
    };
    setChannels([...channels, newChannel]);

    setShowAddChannelModal(false);
  };

  const handleEditChannel = (channel: any) => {
    setEditingChannel(channel);
    setEditChannelForm({
      type: channel.type.split(' - ')[1] || 'Spiral',
      capacity: channel.capacity.toString(),
    });
    setShowEditChannelModal(true);
  };

  const handleSaveChannel = () => {
    if (editingChannel) {
      const updatedChannels = channels.map((ch) =>
        ch.id === editingChannel.id
          ? {
              ...ch,
              type: `Tray - ${editChannelForm.type}`,
              capacity: parseInt(editChannelForm.capacity) || ch.capacity,
            }
          : ch
      );
      setChannels(updatedChannels);
      setShowEditChannelModal(false);
      setEditingChannel(null);
    }
  };

  const handleIncreaseProductStock = (productId: number) => {
    setProducts(
      products.map((prod) =>
        prod.id === productId ? { ...prod, stock: prod.stock + 1 } : prod
      )
    );
  };

  const handleDecreaseProductStock = (productId: number) => {
    setProducts(
      products.map((prod) =>
        prod.id === productId && prod.stock > 0
          ? { ...prod, stock: prod.stock - 1 }
          : prod
      )
    );
  };

  const handleAddProduct = () => {
    if (
      newProductForm.name.trim() &&
      newProductForm.price.trim() &&
      newProductForm.stock.trim()
    ) {
      const newProduct = {
        id: Math.max(...products.map((p) => p.id), 0) + 1,
        name: newProductForm.name,
        price: parseInt(newProductForm.price),
        image: 'https://images.unsplash.com/photo-1535950202760-b8b3e78bb8db?w=150&h=150&fit=crop',
        category: newProductForm.category,
        tag: newProductForm.supplier || newProductForm.category,
        stock: parseInt(newProductForm.stock),
      };
      setProducts([...products, newProduct]);
      setShowAddProductModal(false);
      setNewProductForm({
        name: '',
        price: '',
        category: 'Minuman',
        stock: '',
        supplier: '',
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      supplier: product.tag,
    });
    setShowEditProductModal(true);
  };

  const handleSaveProductChanges = () => {
    if (editingProduct) {
      const updatedProducts = products.map((prod) =>
        prod.id === editingProduct.id
          ? {
              ...prod,
              name: editProductForm.name,
              price: parseInt(editProductForm.price),
              category: editProductForm.category,
              tag: editProductForm.supplier,
            }
          : prod
      );
      setProducts(updatedProducts);
      setShowEditProductModal(false);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = () => {
    if (editingProduct) {
      setProducts(products.filter((prod) => prod.id !== editingProduct.id));
      setShowEditProductModal(false);
      setEditingProduct(null);
    }
  };

  const machineId = params.id as string;
  const machine = machineDetails[machineId] || machineDetails['VM-JKT-001'];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-700';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'vending':
        return '🤖';
      case 'laundry':
        return '🧺';
      case 'space':
        return '🏢';
      default:
        return '📦';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto pb-32 px-4 py-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>

          {/* Machine Header Card */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            {/* Machine Image */}
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-4 text-6xl border border-gray-200">
              {getMachineIcon(machine.type)}
            </div>

            {/* Machine Title and Status */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{machine.id}</h2>
                <p className="text-sm text-gray-600">{machine.name}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBg(
                  machine.status
                )}`}
              >
                {machine.status}
              </span>
            </div>

            {/* Location */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">{machine.location}</p>
              <p className="text-xs text-gray-600">{machine.address}</p>
            </div>

            {/* Earnings Section */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Pendapatan Harian</p>
                <p className="font-bold text-gray-900">{machine.dailyEarning}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Komisi Harian</p>
                <p className="font-bold text-green-700">{machine.commissionAmount}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 bg-white rounded-lg p-2 shadow-sm">
            {(['info', 'setting', 'produk', 'aku'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Add Controller Modal */}
          {isMounted && showAddChannelModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Pilih Kapasitas Controller
                  </h3>
                  <button
                    onClick={() => setShowAddChannelModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Option Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 6 Channel Option */}
                  <button
                    onClick={() => handleAddController('mini')}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9.5 3C7.57 3 6 4.57 6 6.5v11C6 19.43 7.57 21 9.5 21h5c1.93 0 3.5-1.57 3.5-3.5v-11C18 4.57 16.43 3 14.5 3h-5zm0 2h5c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5v-11c0-.83.67-1.5 1.5-1.5z" />
                      </svg>
                    </div>
                    <p className="font-bold text-gray-900 mb-1">6 Channel</p>
                    <p className="text-xs text-gray-600">Controller Mini</p>
                  </button>

                  {/* 16 Channel Option */}
                  <button
                    onClick={() => handleAddController('standar')}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9.5 3C7.57 3 6 4.57 6 6.5v11C6 19.43 7.57 21 9.5 21h5c1.93 0 3.5-1.57 3.5-3.5v-11C18 4.57 16.43 3 14.5 3h-5zm0 2h5c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5v-11c0-.83.67-1.5 1.5-1.5z" />
                      </svg>
                    </div>
                    <p className="font-bold text-gray-900 mb-1">16 Channel</p>
                    <p className="text-xs text-gray-600">Controller Standart</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Channel Modal */}
          {isMounted && showEditChannelModal && editingChannel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border-2 border-blue-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Edit Channel #{editingChannel.name.split(' ')[1]}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditChannelModal(false);
                      setEditingChannel(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form Content */}
                <div className="space-y-4">
                  {/* Jenis Tray */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Jenis Tray
                    </label>
                    <select
                      value={editChannelForm.type}
                      onChange={(e) =>
                        setEditChannelForm({ ...editChannelForm, type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Pilih Jenis Tray</option>
                      <option value="Spiral">Spiral</option>
                      <option value="Helical">Helical</option>
                      <option value="Shelf">Shelf</option>
                    </select>
                  </div>

                  {/* Kapasitas Stok */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Kapasitas Stok (10-30 pcs)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="30"
                      value={editChannelForm.capacity}
                      onChange={(e) =>
                        setEditChannelForm({
                          ...editChannelForm,
                          capacity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveChannel}
                  className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                  Simpan Channel
                </button>
              </div>
            </div>
          )}

          {/* Add Product Modal */}
          {isMounted && showAddProductModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border-2 border-blue-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Tambah Produk Baru
                  </h3>
                  <button
                    onClick={() => setShowAddProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form Content */}
                <div className="space-y-4">
                  {/* Nama Produk */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Nama Produk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProductForm.name}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, name: e.target.value })
                      }
                      placeholder="Contoh: Air Mineral 600ml"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  {/* Harga */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Harga (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newProductForm.price}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, price: e.target.value })
                      }
                      placeholder="5000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newProductForm.category}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="Minuman">Minuman</option>
                      <option value="Makanan">Makanan</option>
                      <option value="Snack">Snack</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* Stok Awal */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Stok Awal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newProductForm.stock}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, stock: e.target.value })
                      }
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Supplier (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newProductForm.supplier}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, supplier: e.target.value })
                      }
                      placeholder="Nama supplier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleAddProduct}
                  className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  Simpan Produk
                </button>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {isMounted && showEditProductModal && editingProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border-2 border-blue-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Edit Produk
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditProductModal(false);
                      setEditingProduct(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form Content */}
                <div className="space-y-4">
                  {/* Nama Produk */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Nama Produk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editProductForm.name}
                      onChange={(e) =>
                        setEditProductForm({ ...editProductForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  {/* Harga */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Harga (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editProductForm.price}
                      onChange={(e) =>
                        setEditProductForm({ ...editProductForm, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 block mb-2">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editProductForm.category}
                      onChange={(e) =>
                        setEditProductForm({ ...editProductForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="Minuman">Minuman</option>
                      <option value="Makanan">Makanan</option>
                      <option value="Snack">Snack</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Supplier (Opsional)
                    </label>
                    <input
                      type="text"
                      value={editProductForm.supplier}
                      onChange={(e) =>
                        setEditProductForm({ ...editProductForm, supplier: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-6">
                  <button
                    onClick={handleSaveProductChanges}
                    className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Machine Information Card */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Informasi Mesin</h3>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Machine ID */}
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-500 mb-1">ID Mesin</p>
                    <p className="text-sm font-semibold text-gray-900">{machine.id}</p>
                  </div>

                  {/* Machine Type */}
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Tipe Mesin</p>
                    <p className="text-sm font-semibold text-gray-900">{machine.name}</p>
                  </div>

                  {/* Location */}
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Lokasi</p>
                    <p className="text-sm font-semibold text-gray-900">{machine.location}</p>
                  </div>

                  {/* Address */}
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Alamat Lengkap</p>
                    <p className="text-sm font-semibold text-gray-900">Jl. {machine.address}</p>
                  </div>

                  {/* Installation Date */}
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Tanggal Instalasi</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{machine.installationDate}</p>
                      <p className="text-xs text-gray-500">
                        Stock: {machine.capacity} pcs
                      </p>
                    </div>
                  </div>

                  {/* Commission */}
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Komisi</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{machine.commissionPercentage}%</p>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Kapasitas</p>
                    <p className="text-sm font-semibold text-gray-900">{machine.capacity} Item</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${machine.utilities}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{machine.utilities}%</p>
                  </div>

                  {/* CCTV Status */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-start gap-3">
                    <Video className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900">Buka CCTV</p>
                      <p className="text-xs text-blue-700">Pantau status terkini setiap saat</p>
                    </div>
                  </div>

                  {/* Machine Status Alert */}
                  <div className="bg-red-50 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-900">Hapus Mesin</p>
                      <p className="text-xs text-red-700">Hapus mesin VM-JKT-001 secara permanen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'setting' && (
            <div className="space-y-4">
              {/* Setting Sub-tabs */}
              <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
                {(['koneksi', 'gambar', 'controller', 'channel'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSettingTab(tab)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      activeSettingTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Koneksi Tab */}
              {activeSettingTab === 'koneksi' && (
                <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
                  {/* Koneksi & Power Section */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Koneksi & Power</h4>

                    {/* WiFi Section */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Wifi className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">WiFi</p>
                            <p className="text-xs text-gray-500">
                              {wifiEnabled ? 'VendingMachine1' : 'Tidak aktif'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setWifiEnabled(!wifiEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            wifiEnabled ? 'bg-blue-600' : 'bg-gray-300'
                          } flex items-center ${wifiEnabled ? 'justify-end' : 'justify-start'} p-1`}
                        >
                          <div className="w-5 h-5 bg-white rounded-full" />
                        </button>
                      </div>

                      {wifiEnabled && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-gray-600 font-medium">SSID</label>
                            <input
                              type="text"
                              value={wifiSSID}
                              onChange={(e) => setWifiSSID(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 font-medium">Password</label>
                            <input
                              type="password"
                              value={wifiPassword}
                              onChange={(e) => setWifiPassword(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                            Update WiFi
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Power Mesin Section */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Power Mesin</p>
                            <p className="text-xs text-gray-500">Mesin menyala</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPowerEnabled(!powerEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            powerEnabled ? 'bg-blue-600' : 'bg-gray-300'
                          } flex items-center ${powerEnabled ? 'justify-end' : 'justify-start'} p-1`}
                        >
                          <div className="w-5 h-5 bg-white rounded-full" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gambar Tab */}
              {activeSettingTab === 'gambar' && (
                <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900">Gambar Mesin</h4>

                  {/* Image Display */}
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden h-60 flex items-center justify-center group">
                    <img
                      src={machineImageUrl}
                      alt="Machine"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3EGambar tidak dapat dimuat%3C/text%3E%3C/svg%3E';
                      }}
                    />

                    {/* Change Image Button */}
                    <label className="absolute bottom-4 right-4 cursor-pointer">
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setMachineImageUrl(event.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2 shadow-md"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Ganti Gambar
                      </button>
                    </label>
                  </div>

                  {/* URL Gambar Section */}
                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-2">
                      URL Gambar
                    </label>
                    <input
                      type="text"
                      value={machineImageUrl}
                      onChange={(e) => setMachineImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://images.example.com/machine.jpg"
                    />
                  </div>
                </div>
              )}

              {/* Controller Tab */}
              {activeSettingTab === 'controller' && (
                <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-gray-900">
                      {controllers.length} controller terpasang
                    </h4>
                    <button 
                      onClick={() => setShowAddChannelModal(true)}
                      className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <span>+</span>
                      Tambah
                    </button>
                  </div>

                  {/* Controllers List */}
                  <div className="space-y-4">
                    {controllers.map((controller) => (
                      <div key={controller.id} className="border border-gray-200 rounded-lg p-4">
                        {/* Controller Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{controller.name}</p>
                              <p className="text-xs text-gray-500">
                                Kapasitas: {controller.capacity}
                              </p>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() =>
                              setControllers(
                                controllers.filter((c) => c.id !== controller.id)
                              )
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Channel Usage */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-700">
                              Penggunaan Channel
                            </p>
                            <p className="text-xs font-semibold text-gray-900">
                              {controller.channelUsed} / {controller.channelTotal}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressBarColor(
                                controller.channelUsed,
                                controller.channelTotal
                              )}`}
                              style={{
                                width: `${(controller.channelUsed / controller.channelTotal) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Add Channel Button */}
                        <button 
                          onClick={() => setShowAddChannelModal(true)}
                          className="w-full mt-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-gray-200"
                        >
                          <span>+</span>
                          Tambah Channel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel Tab */}
              {activeSettingTab === 'channel' && (
                <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
                  {/* Header */}
                  <h4 className="text-sm font-bold text-gray-900">
                    {channels.length} channel terkonfigurasi dari total kapasitas{' '}
                    {channels.length} channel
                  </h4>

                  {/* Channels by Controller */}
                  <div className="space-y-6">
                    {controllers.map((controller) => {
                      const controllerChannels = channels.filter(
                        (ch) => ch.controllerId === controller.id
                      );

                      return (
                        <div key={controller.id}>
                          {/* Controller Header */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M9.5 3C7.57 3 6 4.57 6 6.5v11C6 19.43 7.57 21 9.5 21h5c1.93 0 3.5-1.57 3.5-3.5v-11C18 4.57 16.43 3 14.5 3h-5zm0 2h5c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5v-11c0-.83.67-1.5 1.5-1.5z" />
                              </svg>
                              <span className="font-bold text-gray-900">
                                {controller.name}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {controller.capacity}
                            </span>
                          </div>

                          {/* Channels List */}
                          <div className="space-y-3">
                            {controllerChannels.map((channel) => (
                              <div
                                key={channel.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                              >
                                {/* Channel Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900">
                                      {channel.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                        {channel.type}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Toggle & Edit */}
                                  <div className="flex items-center gap-2">
                                    {/* Toggle Switch */}
                                    <button
                                      onClick={() => {
                                        setChannels(
                                          channels.map((ch) =>
                                            ch.id === channel.id
                                              ? {
                                                  ...ch,
                                                  status: !ch.status,
                                                }
                                              : ch
                                          )
                                        );
                                      }}
                                      className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                                        channel.status
                                          ? 'bg-gray-800'
                                          : 'bg-gray-300'
                                      } p-1`}
                                    >
                                      <div
                                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                          channel.status
                                            ? 'translate-x-4'
                                            : 'translate-x-0'
                                        }`}
                                      />
                                    </button>

                                    {/* Status Text */}
                                    <span className="text-xs font-semibold text-gray-600 w-6 text-right">
                                      {channel.status ? 'ON' : 'OFF'}
                                    </span>

                                    {/* Edit Button */}
                                    <button 
                                      onClick={() => handleEditChannel(channel)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Product Info */}
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-gray-600">Produk:</p>
                                    <p className="text-sm text-gray-900 font-medium">
                                      {channel.product}
                                    </p>
                                  </div>

                                  <p className="text-xs text-gray-500">
                                    Kapasitas: {channel.capacity} pcs | Stok:{' '}
                                    {channel.stock} pcs
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'produk' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-blue-600">
                  {products.length} produk terdaftar
                </h3>
                <button 
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium text-sm"
                >
                  <span>+</span>
                  Tambah Produk
                </button>
              </div>

              {/* Products Grid */}
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">
                              {product.name}
                            </h4>
                            <p className="text-blue-600 font-bold text-sm mt-1">
                              Rp {product.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2 mb-3">
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                            {product.category}
                          </span>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                            {product.tag}
                          </span>
                        </div>

                        {/* Stock Section */}
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">Stok Total</p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleDecreaseProductStock(product.id)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              −
                            </button>
                            <span className="font-bold text-gray-900 text-lg">
                              {product.stock} pcs
                            </span>
                            <button
                              onClick={() => handleIncreaseProductStock(product.id)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'aku' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Akun Mesin</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
                  <p className="text-sm font-semibold text-gray-900">{machine.transactions} transaksi</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-xs text-gray-500 mb-1">Total Pendapatan</p>
                  <p className="text-sm font-semibold text-gray-900">{machine.dailyEarning}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Komisi</p>
                  <p className="text-sm font-semibold text-green-700">{machine.commissionAmount}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
