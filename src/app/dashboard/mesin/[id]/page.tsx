'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, AlertCircle, Wifi, Video, Zap, Copy } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { resolveCommissionDetails } from '@/lib/commission';
import {
  Channel as ApiChannel,
  Product as ApiProduct,
  createPartnerMachineProduct,
  deletePartnerMachineProduct,
  getChannels,
  getCurrentMerchantRealtimeTransactions,
  getCurrentMerchantTransactions,
  getCurrentPartnerMachineTransactions,
  getMachine,
  getPartnerId,
  getPartnerMachineProducts,
  getProducts,
  normalizeApiError,
  updateProduct,
  updatePartnerMachineProduct,
  updateChannel,
  updateCurrentWiFiSettings,
  Machine as ApiMachine,
} from '@/lib/services';

interface MachineDetail {
  apiId?: number;
  id: string;
  type: 'vending' | 'locker';
  machineTypeCode?: string;
  machineSerialNumber?: string;
  machineTypeLabel: string;
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

interface ControllerConfig {
  id: number;
  name: string;
  capacity: string;
  channelUsed: number;
  channelTotal: number;
}

interface ChannelConfig {
  id: number;
  controllerId: number;
  jenisMesin?: string;
  machineTypeCode?: string;
  machineSerialNumber?: string;
  name: string;
  type: string;
  productId?: number;
  product: string;
  capacity: number;
  stock: number;
  status: boolean;
  spiralDiameter: string;
  traySize: string;
  doorSize: string;
}

interface ProductConfig {
  id: number;
  code: string;
  name: string;
  price: number;
  image: string;
  category: string;
  tag: string;
  stock: number;
  status: string;
}

type MachineTransactionMetrics = {
  amount: number;
  count: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeMachineType(type: string | undefined): MachineDetail['type'] {
  const normalizedType = normalizeMachineTypeKey(type);

  if (normalizedType === 'vmj' || normalizedType === 'vending') {
    return 'vending';
  }

  if (
    normalizedType === 'sls' ||
    normalizedType === 'laundry' ||
    normalizedType === 'loundry' ||
    normalizedType === 'space' ||
    normalizedType === 'locker' ||
    isLockerLaundryType(type)
  ) {
    return 'locker';
  }

  return 'vending';
}

function normalizeMachineTypeKey(type: string | undefined) {
  return type?.toLowerCase().replace(/[\s_-]/g, '');
}

function isLockerLaundryType(type: string | undefined) {
  const normalizedType = normalizeMachineTypeKey(type);
  return normalizedType === 'lockerlaundry' || normalizedType === 'lockerloundry';
}

function shouldHideDoorSizeField(
  machineTypeCode?: string,
  machineSerialNumber?: string
): boolean {
  const normalizedTypeCode = machineTypeCode?.trim().toUpperCase() ?? '';
  const normalizedSerial = machineSerialNumber?.trim().toUpperCase() ?? '';

  return normalizedTypeCode === 'VENDING' || normalizedSerial.startsWith('VJ');
}

function getMachineTypeValue(machine: ApiMachine) {
  return (
    machine.machine_type_code ||
    machine.mechine_type_code ||
    machine.machine_type ||
    machine.mechine_type ||
    machine.type
  );
}

function formatMachineTypeLabel(type: string | undefined) {
  const normalizedType = normalizeMachineTypeKey(type);

  if (normalizedType === 'vmj' || normalizedType === 'vending') {
    return 'Vending Machine';
  }

  if (
    normalizedType === 'sls' ||
    normalizedType === 'laundry' ||
    normalizedType === 'loundry' ||
    normalizedType === 'space' ||
    normalizedType === 'locker' ||
    isLockerLaundryType(type)
  ) {
    return 'Locker Laundry';
  }

  return type || 'Mesin Venjual';
}

function normalizeStatus(status: string | undefined): MachineDetail['status'] {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'maintenance') {
    return 'Maintenance';
  }

  if (normalizedStatus === 'inactive' || normalizedStatus === 'nonactive') {
    return 'Inactive';
  }

  return 'Aktif';
}

function formatDate(value: string | undefined) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapApiMachine(
  machine: ApiMachine,
  metrics?: MachineTransactionMetrics
): MachineDetail {
  const dailyEarning = metrics?.amount ?? machine.daily_earning ?? 0;
  const { percentage: commissionPercentage, amount: commissionAmount } =
    resolveCommissionDetails(
      dailyEarning,
      machine.commission_percentage,
      machine.commission_amount
    );
  const channelCount = machine.channels ?? 0;
  const machineTypeValue = getMachineTypeValue(machine);

  return {
    apiId: typeof machine.id === 'number' ? machine.id : toNumber(machine.id),
    id: String(machine.machine_id ?? machine.id),
    type: normalizeMachineType(machineTypeValue),
    machineTypeCode: machineTypeValue,
    machineSerialNumber:
      machine.machine_serial_number ??
      machine.machineSerialNumber ??
      machine.serial_number ??
      machine.serialNumber,
    machineTypeLabel: formatMachineTypeLabel(machineTypeValue),
    name: machine.name || 'Mesin Venjual',
    location: machine.location_name || machine.location || '-',
    address: machine.address || '-',
    dailyEarning: formatCurrency(dailyEarning),
    commission: `${commissionPercentage}%`,
    commissionAmount: formatCurrency(commissionAmount),
    transactions: metrics?.count ?? machine.transaction_count ?? 0,
    capacity: machine.capacity ?? 0,
    utilities: machine.utilities ?? 0,
    status: normalizeStatus(machine.status),
    installationDate: formatDate(machine.installation_date || machine.created_at),
    commissionPercentage: String(commissionPercentage),
    cctvStatus: machine.cctv_status || '-',
    machineHours: `${channelCount}/${channelCount} Channel`,
    channels: channelCount,
    products: machine.products ?? 0,
  };
}

function toOptionalNumber(value: string | number | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }

  return undefined;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  return fallback;
}

async function getMachineTransactionMetrics(
  machineId: string | number
): Promise<MachineTransactionMetrics> {
  try {
    const summary = await getCurrentMerchantRealtimeTransactions({
      machine_id: machineId,
      status: 'PAID',
    });

    return {
      amount: summary.total_amount,
      count: summary.total_transactions,
    };
  } catch {
    // Fallback to listing below when realtime summary is unavailable.
  }

  try {
    const response = await getCurrentMerchantTransactions({
      machine_id: machineId,
      status: 'PAID',
      limit: 100,
      offset: 0,
    });

    return {
      amount: response.data.reduce((sum, tx) => sum + toNumber(tx.amount), 0),
      count: response.data.length,
    };
  } catch {
    // Fallback to partner machine transaction endpoint below.
  }

  try {
    const response = await getCurrentPartnerMachineTransactions(machineId, {
      status: 'PAID',
      limit: 100,
      offset: 0,
    });

    return {
      amount: response.data.reduce((sum, tx) => sum + toNumber(tx.amount), 0),
      count: response.data.length,
    };
  } catch {
    return { amount: 0, count: 0 };
  }
}

function mapApiProduct(product: ApiProduct): ProductConfig {
  return {
    id: product.id,
    code: product.code || product.sku || `P-${product.id}`,
    name: product.name,
    price: toNumber(product.default_price ?? product.price),
    image:
      product.image_url ||
      product.image ||
      'https://images.unsplash.com/photo-1535950202760-b8b3e78bb8db?w=150&h=150&fit=crop',
    category: product.category || 'Produk',
    tag: product.tag || product.sku || '-',
    stock: toNumber(product.stock),
    status: product.status || 'Y',
  };
}

function buildProductCode(name: string, nextId: number) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 12);

  return `${slug || 'P'}-${String(nextId).padStart(3, '0')}`;
}

function getChannelTrayType(channel: ApiChannel) {
  if (channel.tray_type) {
    return channel.tray_type.includes(' - ')
      ? channel.tray_type
      : `Tray - ${channel.tray_type}`;
  }

  return 'Tray - Spiral';
}

function mapApiChannel(channel: ApiChannel): ChannelConfig {
  const productName =
    channel.product?.name ||
    channel.product_name ||
    channel.productName ||
    'Belum ada produk';

  return {
    id: channel.id,
    controllerId: channel.controller_id ?? 1,    
    jenisMesin: channel.jenis_mesin,
    machineTypeCode: channel.machine_type_code,
    machineSerialNumber: channel.machine_serial_number ?? channel.machineSerialNumber,
    name: channel.tray_label || channel.name || `Channel ${channel.id}`,
    type: channel.function || getChannelTrayType(channel),
    productId: channel.product_id ?? channel.product?.id,
    product: productName,
    capacity: toNumber(channel.capacity),
    stock: toNumber(channel.stock ?? channel.product?.stock),
    status:
      channel.is_active ??
      (channel.active === true ||
        channel.active === 'true' ||
        channel.status_now === 'ON'),
    spiralDiameter: channel.spiral_diameter || '',
    traySize: channel.tray_size || '',
    doorSize: channel.door_size || '',
  };
}

function buildControllersFromChannels(channels: ChannelConfig[]): ControllerConfig[] {
  const controllerIds = Array.from(
    new Set(channels.map((channel) => channel.controllerId))
  ).sort((a, b) => a - b);

  return controllerIds.map((controllerId) => {
    const controllerChannels = channels.filter(
      (channel) => channel.controllerId === controllerId
    );
    const channelTotal = Math.max(controllerChannels.length, 16);

    return {
      id: controllerId,
      name: `Controller ${controllerId}`,
      capacity: `${channelTotal} channel`,
      channelUsed: controllerChannels.length,
      channelTotal,
    };
  });
}


export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'setting' | 'produk' | 'aku'>('info');
  const [activeSettingTab, setActiveSettingTab] = useState<'koneksi' | 'gambar' | 'channel'>('koneksi');
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [wifiSSID, setWifiSSID] = useState('VendingMachine1');
  const [wifiPassword, setWifiPassword] = useState('Password WiFi');
  const [powerEnabled, setPowerEnabled] = useState(true);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [selectedControllerId, setSelectedControllerId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [apiMachine, setApiMachine] = useState<MachineDetail | null>(null);
  const [machineLoading, setMachineLoading] = useState(true);
  const [machineError, setMachineError] = useState('');
  const [wifiSubmitting, setWifiSubmitting] = useState(false);
  const [wifiMessage, setWifiMessage] = useState('');
  const [channelSubmitting, setChannelSubmitting] = useState(false);
  const [channelLoading, setChannelLoading] = useState(true);
  const [channelMessage, setChannelMessage] = useState('');
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productStockSubmitting, setProductStockSubmitting] = useState<Record<number, boolean>>(
    {}
  );
  const [productLoading, setProductLoading] = useState(true);
  const [productMessage, setProductMessage] = useState('');
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);
  const [showConfigureControllerModal, setShowConfigureControllerModal] = useState(false);
  const [configuringController, setConfiguringController] = useState<ControllerConfig | null>(null);
  const [editChannelForm, setEditChannelForm] = useState({
    type: '',
    capacity: '',
    productId: '',
    product: '',
    spiralDiameter: '',
    traySize: '',
    doorSize: '',
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
  const [editingProduct, setEditingProduct] = useState<ProductConfig | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    price: '',
    category: 'Minuman',
    supplier: '',
  });
  const [machineImageUrl, setMachineImageUrl] = useState(
    'https://images.unsplash.com/photo-1753863474-dfc2508b5bab?w=500&h=400&fit=crop'
  );
  const [controllers, setControllers] = useState<ControllerConfig[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [products, setProducts] = useState<ProductConfig[]>([]);

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
      productId: undefined,
      product: 'Produk Baru',
      capacity: 25,
      stock: 0,
      status: true,
      spiralDiameter: '6mm',
      traySize: 'A',
      doorSize: 'Standard',
    };
    setChannels([...channels, newChannel]);

    setShowAddChannelModal(false);
  };

  const handleEditChannel = (channel: ChannelConfig) => {
    setEditingChannel(channel);
    setChannelMessage('');
    setEditChannelForm({
      type: channel.type.split(' - ')[1] || 'Spiral',
      capacity: channel.capacity.toString(),
      productId: channel.productId?.toString() || '',
      product: channel.product || '',
      spiralDiameter: channel.spiralDiameter || '',
      traySize: channel.traySize || '',
      doorSize: channel.doorSize || '',
    });
    setShowEditChannelModal(true);
  };

  const handleSaveChannel = async () => {
    if (!editingChannel) {
      return;
    }

    const hideDoorSize =
      isVendingMachine ||
      shouldHideDoorSizeField(
        editingChannel.machineTypeCode ?? apiMachine?.machineTypeCode,
        editingChannel.machineSerialNumber ?? apiMachine?.machineSerialNumber
      );
    const selectedProduct = products.find(
      (product) => product.id === Number(editChannelForm.productId)
    );
    const capacity = parseInt(editChannelForm.capacity, 10);
    const updatedChannel: ChannelConfig = {
      ...editingChannel,
      type: isVendingMachine
        ? `Tray - ${editChannelForm.type || 'Spiral'}`
        : editingChannel.type,
      capacity:
        isVendingMachine && Number.isFinite(capacity)
          ? capacity
          : editingChannel.capacity,
      productId: isVendingMachine ? selectedProduct?.id : editingChannel.productId,
      product: isVendingMachine
        ? selectedProduct?.name || editChannelForm.product || editingChannel.product
        : editingChannel.product,
      spiralDiameter:
        editChannelForm.spiralDiameter || editingChannel.spiralDiameter,
      traySize: editChannelForm.traySize || editingChannel.traySize,
      doorSize: editChannelForm.doorSize || editingChannel.doorSize,
    };

    try {
      setChannelSubmitting(true);
      setChannelMessage('');
      if (!machineRequestId) {
        setChannelMessage('ID mesin numerik belum tersedia. Tunggu data mesin selesai dimuat.');
        return;
      }

      await updateChannel(editingChannel.id, {
        name: updatedChannel.name,
        jenis_mesin: channelMachineType,
        tray_label: updatedChannel.name,
        machine_id: machineRequestId,
        controller_id: updatedChannel.controllerId,
        ...(hideDoorSize ? {} : { door_size: updatedChannel.doorSize }),
        active: String(updatedChannel.status),
        status_now: updatedChannel.status ? 'ON' : 'OFF',
        is_active: updatedChannel.status,
        ...(isVendingMachine
          ? {
              function: editChannelForm.type || 'SNACK',
              product_id: updatedChannel.productId,
              capacity: updatedChannel.capacity,
              tray_type: editChannelForm.type || 'Spiral',
              spiral_diameter: updatedChannel.spiralDiameter,
              tray_size: updatedChannel.traySize,
              price_now: selectedProduct?.price,
            }
          : {}),
      });

      await loadChannels();
      setShowEditChannelModal(false);
      setEditingChannel(null);
    } catch (err) {
      const apiError = normalizeApiError(
        err,
        'Gagal menyimpan perubahan channel.'
      );
      setChannelMessage(apiError.message);
    } finally {
      setChannelSubmitting(false);
    }
  };

  const handleAddChannelToController = (controllerId: number) => {
    const controller = controllers.find((c) => c.id === controllerId);
    
    if (controller && controller.channelUsed < controller.channelTotal) {
      // Add 1 to channel count
      const updatedControllers = controllers.map((c) =>
        c.id === controllerId
          ? { ...c, channelUsed: c.channelUsed + 1 }
          : c
      );
      setControllers(updatedControllers);

      // Create new channel
      const newChannelId = Math.max(...channels.map((ch) => ch.id), 0) + 1;
      const newChannel = {
        id: newChannelId,
        controllerId: controllerId,
        name: `Channel ${controller.channelUsed + 1}`,
        type: 'Tray - Spiral',
        productId: undefined,
        product: 'Produk Baru',
        capacity: 25,
        stock: 0,
        status: true,
        spiralDiameter: '6mm',
        traySize: 'A',
        doorSize: 'Standard',
      };
      setChannels([...channels, newChannel]);
    }
  };

  const handleRemoveChannelFromController = (controllerId: number) => {
    const controller = controllers.find((c) => c.id === controllerId);
    
    if (controller && controller.channelUsed > 0) {
      // Reduce 1 from channel count
      const updatedControllers = controllers.map((c) =>
        c.id === controllerId
          ? { ...c, channelUsed: c.channelUsed - 1 }
          : c
      );
      setControllers(updatedControllers);

      // Remove the last channel of this controller
      const controllerChannels = channels.filter((ch) => ch.controllerId === controllerId);
      if (controllerChannels.length > 0) {
        const lastChannel = controllerChannels[controllerChannels.length - 1];
        setChannels(channels.filter((ch) => ch.id !== lastChannel.id));
      }
    }
  };

  const updateProductStock = async (productId: number, nextStock: number) => {
    const resolvedNextStock = Math.max(0, nextStock);
    const previousProduct = products.find((item) => item.id === productId) ?? null;

    setProductStockSubmitting((currentValue) => ({
      ...currentValue,
      [productId]: true,
    }));
    setProductMessage('');
    setProducts((currentValue) =>
      currentValue.map((item) =>
        item.id === productId ? { ...item, stock: resolvedNextStock } : item
      )
    );

    try {
      const partnerId = getPartnerId();

      if (partnerId && machineRequestId) {
        await updatePartnerMachineProduct(partnerId, machineRequestId, productId, {
          code: previousProduct?.code,
          name: previousProduct?.name,
          default_price: previousProduct?.price,
          currency: 'IDR',
          status: previousProduct?.status,
          stock: resolvedNextStock,
        });
        return;
      }

      await updateProduct(productId, { stock: resolvedNextStock });
    } catch (err) {
      const apiError = normalizeApiError(err, 'Gagal memperbarui stok produk.');
      setProductMessage(apiError.message);
      if (previousProduct) {
        setProducts((currentValue) =>
          currentValue.map((item) =>
            item.id === productId ? { ...item, stock: previousProduct.stock } : item
          )
        );
      }
    } finally {
      setProductStockSubmitting((currentValue) => ({
        ...currentValue,
        [productId]: false,
      }));
    }
  };

  const handleIncreaseProductStock = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product || productStockSubmitting[productId]) {
      return;
    }

    void updateProductStock(productId, product.stock + 1);
  };

  const handleDecreaseProductStock = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product || product.stock <= 0 || productStockSubmitting[productId]) {
      return;
    }

    void updateProductStock(productId, product.stock - 1);
  };

  const handleAddProduct = async () => {
    if (!isVendingMachine) {
      setProductMessage('Locker Laundry tidak mendukung penambahan produk.');
      return;
    }

    if (
      !newProductForm.name.trim() ||
      !newProductForm.price.trim() ||
      !newProductForm.stock.trim()
    ) {
      setProductMessage('Nama produk, harga, dan stok wajib diisi.');
      return;
    }

      const partnerId = getPartnerId();

      if (!partnerId) {
        setProductMessage('partner_id belum tersedia. Silakan login ulang dengan akun partner.');
        return;
      }

    try {
      setProductSubmitting(true);
      setProductMessage('');
      const nextId = Math.max(...products.map((p) => p.id), 0) + 1;
      const parsedStock = parseInt(newProductForm.stock, 10);

      if (!Number.isFinite(parsedStock) || parsedStock < 0) {
        setProductMessage('Stok harus berupa angka yang valid.');
        return;
      }
      if (!machineRequestId) {
        setProductMessage('ID mesin numerik belum tersedia. Tunggu data mesin selesai dimuat.');
        return;
      }

    await createPartnerMachineProduct(partnerId, machineRequestId, {
        code: buildProductCode(newProductForm.name, nextId),
        name: newProductForm.name.trim(),
        default_price: parseInt(newProductForm.price, 10),
        currency: 'IDR',
        category: newProductForm.category,
        tag: newProductForm.supplier || undefined,
        stock: parsedStock,
        status: 'Y',
      });
      await loadProducts();
      setShowAddProductModal(false);
      setNewProductForm({
        name: '',
        price: '',
        category: 'Minuman',
        stock: '',
        supplier: '',
      });
      setProductMessage('Produk berhasil ditambahkan.');
    } catch (err) {
      const apiError = normalizeApiError(err, 'Gagal menambahkan produk.');
      setProductMessage(apiError.message);
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleEditProduct = (product: ProductConfig) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      supplier: product.tag,
    });
    setShowEditProductModal(true);
  };

  const handleSaveProductChanges = async () => {
    if (!editingProduct) {
      return;
    }

    const partnerId = getPartnerId();

    if (!partnerId) {
      setProductMessage('partner_id belum tersedia. Silakan login ulang dengan akun partner.');
      return;
    }

    try {
      setProductSubmitting(true);
      setProductMessage('');
      if (!machineRequestId) {
        setProductMessage('ID mesin numerik belum tersedia. Tunggu data mesin selesai dimuat.');
        return;
      }

      await updatePartnerMachineProduct(partnerId, machineRequestId, editingProduct.id, {
        code: editingProduct.code,
        name: editProductForm.name.trim(),
        default_price: parseInt(editProductForm.price, 10),
        currency: 'IDR',
        stock: editingProduct.stock,
        status: editingProduct.status || 'Y',
      });
      await loadProducts();
      setShowEditProductModal(false);
      setEditingProduct(null);
      setProductMessage('Produk berhasil diperbarui.');
    } catch (err) {
      const apiError = normalizeApiError(err, 'Gagal menyimpan produk.');
      setProductMessage(apiError.message);
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) {
      return;
    }

    const partnerId = getPartnerId();

    if (!partnerId) {
      setProductMessage('partner_id belum tersedia. Silakan login ulang dengan akun partner.');
      return;
    }

    try {
      setProductSubmitting(true);
      setProductMessage('');
      if (!machineRequestId) {
        setProductMessage('ID mesin numerik belum tersedia. Tunggu data mesin selesai dimuat.');
        return;
      }

      await deletePartnerMachineProduct(partnerId, machineRequestId, editingProduct.id);
      await loadProducts();
      setShowEditProductModal(false);
      setEditingProduct(null);
      setProductMessage('Produk berhasil dihapus.');
    } catch (err) {
      const apiError = normalizeApiError(err, 'Gagal menghapus produk.');
      setProductMessage(apiError.message);
    } finally {
      setProductSubmitting(false);
    }
  };

  const machineId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const machine = apiMachine;
  const isVendingMachine =
    machine?.type === 'vending' ||
    shouldHideDoorSizeField(machine?.machineTypeCode, machine?.machineSerialNumber);
  const isLockerLaundryMachine = isLockerLaundryType(machine?.machineTypeCode);
  const channelMachineType = isVendingMachine ? 'venmachine' : 'locker';
  const machineRequestId = apiMachine?.apiId ?? toOptionalNumber(machineId);
  const hideDoorSizeInChannelEditor =
    isVendingMachine ||
    shouldHideDoorSizeField(
      editingChannel?.machineTypeCode ?? machine?.machineTypeCode,
      editingChannel?.machineSerialNumber ?? machine?.machineSerialNumber
    );
  const getChannelTypeLabel = (channel: ChannelConfig) => {
    const shouldUseDoorSize =
      Boolean(channel.doorSize) &&
      !shouldHideDoorSizeField(channel.machineTypeCode, channel.machineSerialNumber) &&
      (
        !isVendingMachine ||
        isLockerLaundryMachine ||
        isLockerLaundryType(channel.jenisMesin) ||
        isLockerLaundryType(channel.machineTypeCode)
      );

    return shouldUseDoorSize ? channel.doorSize : channel.type;
  };

  const loadProducts = useCallback(async () => {
    try {
      setProductLoading(true);
      setProductMessage('');

      if (!isVendingMachine) {
        setProducts([]);
        return;
      }

      if (!machineRequestId) {
        setProducts([]);
        return;
      }

      const partnerId = getPartnerId();
      const response = partnerId
        ? await getPartnerMachineProducts(partnerId, machineRequestId)
        : await getProducts({
            limit: 100,
            machine_id: machineRequestId,
          });
      setProducts(response.data.map(mapApiProduct));
    } catch (err) {
      const apiError = normalizeApiError(
        err,
        'Gagal memuat produk dari API.'
      );
      setProductMessage(apiError.message);
      setProducts([]);
    } finally {
      setProductLoading(false);
    }
  }, [isVendingMachine, machineRequestId]);

  const loadChannels = useCallback(async () => {
    if (!machineRequestId) {
      setChannelLoading(false);
      return;
    }

    try {
      setChannelLoading(true);
      setChannelMessage('');
      const response = await getChannels({ machine_id: machineRequestId, limit: 100 });
      const mappedChannels = response.data.map(mapApiChannel);
      setChannels(mappedChannels);
      setControllers(buildControllersFromChannels(mappedChannels));
    } catch (err) {
      const apiError = normalizeApiError(
        err,
        'Gagal memuat channel dari API.'
      );
      setChannelMessage(apiError.message);
      setChannels([]);
      setControllers([]);
    } finally {
      setChannelLoading(false);
    }
  }, [machineRequestId]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (!isVendingMachine && activeTab === 'produk') {
      setActiveTab('info');
    }
  }, [activeTab, isVendingMachine]);

  useEffect(() => {
    if (!machineId) {
      return;
    }

    const fetchMachine = async () => {
      try {
        setMachineLoading(true);
        setMachineError('');
        const response = await getMachine(machineId);
        const responseMachineId = response.id ?? response.machine_id ?? machineId;
        const metrics = await getMachineTransactionMetrics(responseMachineId);
        setApiMachine(mapApiMachine(response, metrics));

        if (response.wifi_ssid) {
          setWifiSSID(response.wifi_ssid);
        }

        if (typeof response.wifi_enabled === 'boolean') {
          setWifiEnabled(response.wifi_enabled);
        }

        if (typeof response.power_enabled === 'boolean') {
          setPowerEnabled(response.power_enabled);
        }

        if (response.image_url) {
          setMachineImageUrl(response.image_url);
        }
      } catch (err) {
        const apiError = normalizeApiError(
          err,
          'Gagal memuat detail mesin dari API.'
        );
        setMachineError(apiError.message);
      } finally {
        setMachineLoading(false);
      }
    };

    fetchMachine();
  }, [machineId]);

  const handleUpdateWifi = async () => {
    try {
      setWifiSubmitting(true);
      setWifiMessage('');
      if (!machineRequestId) {
        setWifiMessage('ID mesin numerik belum tersedia. Tunggu data mesin selesai dimuat.');
        return;
      }

      await updateCurrentWiFiSettings({
        machine_id: String(machineRequestId),
        wifi_ssid: wifiSSID,
        wifi_password: wifiPassword,
      });
      setWifiMessage('Pengaturan WiFi berhasil diperbarui.');
    } catch (err) {
      const apiError = normalizeApiError(
        err,
        'Gagal memperbarui WiFi mesin.'
      );
      setWifiMessage(apiError.message);
    } finally {
      setWifiSubmitting(false);
    }
  };

  const handleToggleChannelStatus = async (channel: ChannelConfig) => {
    try {
      setChannelMessage('');
      if (!machineRequestId) {
        setChannelMessage('ID mesin numerik belum tersedia. Tunggu data mesin selesai dimuat.');
        return;
      }

      await updateChannel(channel.id, {
        jenis_mesin: channelMachineType,
        machine_id: machineRequestId,
        controller_id: channel.controllerId,
        product_id: channel.productId,
        active: String(!channel.status),
        status_now: !channel.status ? 'ON' : 'OFF',
        is_active: !channel.status,
      });
      await loadChannels();
    } catch (err) {
      const apiError = normalizeApiError(
        err,
        'Gagal memperbarui status channel.'
      );
      setChannelMessage(apiError.message);
    }
  };

  const handleBackClick = () => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        router.back();
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to dashboard if back navigation fails
        router.push('/dashboard');
      }
    }
  };

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
      case 'locker':
        return '🏢';
      default:
        return '📦';
    }
  };

  if (!machine) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto pb-32 px-4 py-4">
            <button
              onClick={handleBackClick}
              disabled={!isMounted}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>

            {machineLoading ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                Memuat detail mesin...
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {machineError || 'Detail mesin tidak ditemukan dari API.'}
              </div>
            )}
          </div>
        </div>
        <BottomNav active="home" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto pb-32 px-4 py-4">
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            disabled={!isMounted}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>

          {machineError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {machineError}
            </div>
          )}

          {machineLoading && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              Memuat detail mesin...
            </div>
          )}

          {/* Machine Header Card */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            {/* Machine Image */}
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-4 text-6xl border border-gray-200">
              {getMachineIcon(machine.type)}
            </div>

            {/* Machine Title and Status */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {machine.machineTypeLabel}
                </h2>
                <p className="text-sm text-gray-600">{machine.name}</p>
                <p className="text-xs text-gray-500">ID Mesin {machine.id}</p>
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
            {(
              isVendingMachine
                ? (['info', 'setting', 'produk', 'aku'] as const)
                : (['info', 'setting', 'aku'] as const)
            ).map((tab) => (
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
                  {isVendingMachine && (
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
                  )}

                  {/* Spiral Diameter - Hanya untuk Spiral di Vending */}
                  {editChannelForm.type === 'Spiral' && isVendingMachine && (
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block mb-2">
                        Spiral Diameter (mm)
                      </label>
                      <input
                        type="number"
                        value={editChannelForm.spiralDiameter}
                        onChange={(e) =>
                          setEditChannelForm({
                            ...editChannelForm,
                            spiralDiameter: e.target.value,
                          })
                        }
                        placeholder="Contoh: 25"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Tray Size - Hanya untuk Spiral di Vending */}
                  {editChannelForm.type === 'Spiral' && isVendingMachine && (
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block mb-2">
                        Tray Size
                      </label>
                      <select
                        value={editChannelForm.traySize}
                        onChange={(e) =>
                          setEditChannelForm({
                            ...editChannelForm,
                            traySize: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Pilih Ukuran Tray...</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="Extra Large">Extra Large</option>
                      </select>
                    </div>
                  )}

                  {/* Door Size - hanya untuk tipe locker */}
                  {!hideDoorSizeInChannelEditor && (
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block mb-2">
                        Door Size
                      </label>
                      <select
                        value={editChannelForm.doorSize}
                        onChange={(e) =>
                          setEditChannelForm({
                            ...editChannelForm,
                            doorSize: e.target.value,
                          })
                        }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Pilih Ukuran Pintu...</option>
                          <option value="Small">Small (30x30cm)</option>
                          <option value="Medium">Medium (40x40cm)</option>
                          <option value="Large">Large (50x50cm)</option>
                          <option value="Extra Large">Extra Large (60x60cm)</option>
                        </select>
                      </div>
                    )}

                  {/* Kapasitas Stok */}
                  {isVendingMachine && (
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
                  )}

                  {/* Pilih Produk */}
                  {isVendingMachine && (
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block mb-2">
                        Pilih Produk
                      </label>
                      <select
                        value={editChannelForm.productId}
                        disabled={productLoading}
                        onChange={(e) =>
                          setEditChannelForm({
                            ...editChannelForm,
                            productId: e.target.value,
                            product:
                              products.find(
                                (prod) => prod.id === Number(e.target.value)
                              )?.name || '',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">
                          {productLoading ? 'Memuat produk...' : 'Pilih Produk...'}
                        </option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} (Rp {prod.price.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                      {productMessage && (
                        <p className="mt-1 text-xs text-red-600">
                          {productMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {channelMessage && (
                  <p className="mt-4 text-sm text-red-600">{channelMessage}</p>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveChannel}
                  disabled={channelSubmitting}
                  className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                  {channelSubmitting ? 'Menyimpan...' : 'Simpan Channel'}
                </button>
              </div>
            </div>
          )}

          {/* Configure Controller Modal */}
          {isMounted && showConfigureControllerModal && configuringController && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 border-2 border-blue-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Konfigurasi {configuringController.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowConfigureControllerModal(false);
                      setConfiguringController(null);
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

                {/* Controller Info */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Nama Controller</p>
                      <p className="text-sm font-bold text-gray-900">{configuringController.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Kapasitas Total</p>
                      <p className="text-sm font-bold text-gray-900">{configuringController.capacity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Channel Digunakan</p>
                      <p className="text-sm font-bold text-blue-600">{configuringController.channelUsed} / {configuringController.channelTotal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Channel Tersedia</p>
                      <p className="text-sm font-bold text-green-600">{configuringController.channelTotal - configuringController.channelUsed}</p>
                    </div>
                  </div>
                </div>

                {/* Channels List */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Channel Terkonfigurasi ({channels.filter(ch => ch.controllerId === configuringController.id).length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {channels.filter(ch => ch.controllerId === configuringController.id).length > 0 ? (
                      channels.filter(ch => ch.controllerId === configuringController.id).map((channel) => (
                        <div key={channel.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{channel.name}</p>
                            <p className="text-xs text-gray-600">{getChannelTypeLabel(channel)} - {channel.product}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-gray-700">Stok: {channel.stock}/{channel.capacity}</p>
                            <button
                              onClick={() => handleEditChannel(channel)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-1"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <p className="text-sm">Belum ada channel yang dikonfigurasi</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowConfigureControllerModal(false);
                    setConfiguringController(null);
                  }}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* Add Product Modal */}
          {isMounted && isVendingMachine && showAddProductModal && (
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
                  disabled={productSubmitting}
                  className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  {productSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {isMounted && isVendingMachine && showEditProductModal && editingProduct && (
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
                    disabled={productSubmitting}
                    className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {productSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    disabled={productSubmitting}
                    className="p-3 text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors border border-red-200"
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
                      <p className="text-xs text-red-700">Hapus mesin ini secara permanen</p>
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
                {(['koneksi', 'gambar', 'channel'] as const).map((tab) => (
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

                          {wifiMessage && (
                            <p className="text-xs text-gray-600">{wifiMessage}</p>
                          )}

                          <button
                            type="button"
                            onClick={handleUpdateWifi}
                            disabled={wifiSubmitting}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                          >
                            {wifiSubmitting ? 'Mengupdate WiFi...' : 'Update WiFi'}
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

              {/* Channel Tab */}
              {activeSettingTab === 'channel' && (
                <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
                  {/* Header */}
                  <h4 className="text-sm font-bold text-gray-900">
                    {channels.length} channel terkonfigurasi dari total kapasitas{' '}
                    {channels.length} channel
                  </h4>

                  {channelMessage && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {channelMessage}
                    </div>
                  )}

                  {channelLoading && (
                    <p className="text-sm text-gray-500">Memuat channel...</p>
                  )}

                  {!channelLoading && channels.length === 0 && !channelMessage && (
                    <p className="text-sm text-gray-500">
                      Belum ada channel terdaftar untuk mesin ini.
                    </p>
                  )}

                  {/* Channels by Controller */}
                  {!channelLoading && channels.length > 0 && (
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
                                        {getChannelTypeLabel(channel)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Toggle & Edit */}
                                  <div className="flex items-center gap-2">
                                    {/* Toggle Switch */}
                                    <button
                                      onClick={() => handleToggleChannelStatus(channel)}
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
                                {isVendingMachine && (
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
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'produk' && isVendingMachine && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-blue-600">
                  {products.length} produk terdaftar
                </h3>
                <button 
                  onClick={() => setShowAddProductModal(true)}
                  disabled={productSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium text-sm"
                >
                  <span>+</span>
                  Tambah Produk
                </button>
              </div>

              {productMessage && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                  {productMessage}
                </div>
              )}

              {productLoading && (
                <p className="text-sm text-gray-500">Memuat produk...</p>
              )}

              {/* Products Grid */}
              <div className="space-y-3">
                {!productLoading && products.map((product) => (
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
                              disabled={
                                product.stock <= 0 ||
                                Boolean(productStockSubmitting[product.id])
                              }
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                            >
                              −
                            </button>
                            <span className="font-bold text-gray-900 text-lg">
                              {product.stock} pcs
                            </span>
                            <button
                              onClick={() => handleIncreaseProductStock(product.id)}
                              disabled={Boolean(productStockSubmitting[product.id])}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!productLoading && products.length === 0 && (
                  <p className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow-md">
                    Belum ada produk untuk mesin ini.
                  </p>
                )}
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
