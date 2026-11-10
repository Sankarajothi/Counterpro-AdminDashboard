'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Shop, AppBroadcast } from '../../types/database';
import {
  fetchBroadcasts,
  createBroadcast,
  updateBroadcast,
  toggleBroadcastActive,
  deleteBroadcast,
  getActiveDeviceTokensCount,
} from '../../services/broadcastService';
import {
  Bell,
  Radio,
  Layers,
  Send,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Store,
  Smartphone,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
  MousePointerClick,
  X,
  MapPin,
  Calendar,
  Image as ImageIcon,
  UploadCloud,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Power,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';

interface BroadcastNotificationsViewProps {
  type?: 'broadcast' | 'scheduled' | 'push';
  shops: Shop[];
  onShowToast: (msg: string) => void;
}

// Indian States List for targeting
const INDIAN_STATES = [
  'All States',
  'Tamil Nadu',
  'Karnataka',
  'Kerala',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Delhi NCR',
  'Gujarat',
  'Puducherry',
  'Goa',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Odisha',
  'Bihar',
  'Assam',
];

export function BroadcastNotificationsView({
  type: initialType = 'broadcast',
  shops,
  onShowToast,
}: BroadcastNotificationsViewProps) {
  // Mode: In-App Pop-up vs Push Notification
  const [broadcastChannel, setBroadcastChannel] = useState<'popup' | 'push'>('popup');

  // Form Fields for In-App Pop-up
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState<string>('all_users');
  const [selectedShopId, setSelectedShopId] = useState<string>(shops[0]?.id || '');
  const [targetState, setTargetState] = useState<string>('All States');
  const [targetCity, setTargetCity] = useState<string>('');
  const [placement, setPlacement] = useState<'full_screen' | 'banner'>('full_screen');
  const [displayType, setDisplayType] = useState<'single' | 'carousel'>('single');
  const [canSkipDismiss, setCanSkipDismiss] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [actionLabel, setActionLabel] = useState<string>('Upgrade to Pro');
  const [actionDeepLink, setActionDeepLink] = useState<string>('counter365://upgrade');
  const [frequency, setFrequency] = useState<string>('Once per user');

  // Image Uploads State
  const [images, setImages] = useState<string[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data & Ledger State
  const [broadcasts, setBroadcasts] = useState<AppBroadcast[]>([]);
  const [deviceTokens, setDeviceTokens] = useState<{ total: number; android: number; ios: number; web: number }>({
    total: 0,
    android: 0,
    ios: 0,
    web: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit Modal State
  const [editingBroadcast, setEditingBroadcast] = useState<AppBroadcast | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAudience, setEditAudience] = useState('all_users');
  const [editTargetState, setEditTargetState] = useState('All States');
  const [editTargetCity, setEditTargetCity] = useState('');
  const [editPlacement, setEditPlacement] = useState<'full_screen' | 'banner'>('full_screen');
  const [editDisplayType, setEditDisplayType] = useState<'single' | 'carousel'>('single');
  const [editCanSkip, setEditCanSkip] = useState(true);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editActionLabel, setEditActionLabel] = useState('');
  const [editActionDeepLink, setEditActionDeepLink] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Load Real Data from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [broadcastsList, tokenStats] = await Promise.all([
        fetchBroadcasts(),
        getActiveDeviceTokensCount(),
      ]);
      setBroadcasts(broadcastsList);
      setDeviceTokens(tokenStats);
    } catch (err) {
      console.error('Error loading broadcasts data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalViews = 0;
    let totalClicks = 0;
    let totalDismissed = 0;

    broadcasts.forEach((b) => {
      if (b.interactions_count) {
        totalViews += b.interactions_count.viewed || 0;
        totalClicks += b.interactions_count.clicked || 0;
        totalDismissed += b.interactions_count.dismissed || 0;
      }
    });

    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

    return {
      activeDevices: Math.max(deviceTokens.total, shops.length),
      totalPopups: broadcasts.filter((b) => b.type === 'popup' || b.type === 'in_app').length,
      totalViews,
      totalClicks,
      ctr,
    };
  }, [broadcasts, deviceTokens, shops.length]);

  // File Upload Processing (Single or Multiple) with Canvas Compression
  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploadingImage(true);
    const filesArray = Array.from(fileList);
    const validImageFiles = filesArray.filter((f) => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      onShowToast('Please select valid image files (PNG, JPG, WEBP).');
      setIsUploadingImage(false);
      return;
    }

    const compressedResults: string[] = [];
    let processedCount = 0;

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            compressedResults.push(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            compressedResults.push(dataUrl);
          }

          processedCount++;
          if (processedCount === validImageFiles.length) {
            if (displayType === 'single') {
              setImages([compressedResults[0]]);
            } else {
              setImages((prev) => [...prev, ...compressedResults]);
            }
            setIsUploadingImage(false);
            onShowToast(`Uploaded ${compressedResults.length} image(s) formatted for mobile.`);
          }
        };
        img.onerror = () => {
          compressedResults.push(dataUrl);
          processedCount++;
          if (processedCount === validImageFiles.length) {
            if (displayType === 'single') {
              setImages([compressedResults[0]]);
            } else {
              setImages((prev) => [...prev, ...compressedResults]);
            }
            setIsUploadingImage(false);
          }
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImageAt = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activeSlideIndex >= next.length) {
        setActiveSlideIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Submit Handler: Create Pop-up
  const handleCreatePopup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      onShowToast('Please choose at least one banner/popup image.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createBroadcast({
        title: title.trim() || undefined,
        message: message.trim() || undefined,
        type: placement === 'banner' ? 'in_app' : 'popup',
        placement,
        display_type: displayType,
        target_audience: audience,
        target_shop_id: audience === 'individual_user' ? selectedShopId : null,
        target_state: targetState !== 'All States' ? targetState : 'all',
        target_city: targetCity.trim() || null,
        images,
        image_url: images[0] || null,
        action_label: actionLabel.trim() || null,
        action_deep_link: actionDeepLink.trim() || null,
        is_dismissible: canSkipDismiss,
        is_active: isActive,
        frequency,
        scheduled_for: startDate ? new Date(startDate).toISOString() : null,
        expires_at: endDate ? new Date(endDate).toISOString() : null,
        status: isActive ? (startDate ? 'scheduled' : 'sent') : 'draft',
      });

      if (res.success) {
        onShowToast('In-App Pop-up created and saved successfully!');
        // Reset Form
        setTitle('');
        setMessage('');
        setImages([]);
        setTargetCity('');
        setStartDate('');
        setEndDate('');
        setActiveSlideIndex(0);
        await loadData();
      } else {
        onShowToast(`Failed to create pop-up: ${res.error || 'Check Supabase permissions'}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status ON/OFF directly in table
  const handleToggleActive = async (b: AppBroadcast) => {
    const nextActive = !b.is_active;
    const ok = await toggleBroadcastActive(b.id, nextActive);
    if (ok) {
      setBroadcasts((prev) =>
        prev.map((item) =>
          item.id === b.id ? { ...item, is_active: nextActive, status: nextActive ? 'sent' : 'draft' } : item
        )
      );
      onShowToast(`Pop-up "${b.title || 'Untitled'}" switched ${nextActive ? 'ON (Active)' : 'OFF (Inactive)'}`);
    } else {
      onShowToast('Failed to update status.');
    }
  };

  // Delete Handler
  const handleDeletePopup = async (id: string) => {
    if (confirm('Are you sure you want to delete this pop-up and its delivery history?')) {
      const ok = await deleteBroadcast(id);
      if (ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        onShowToast('Pop-up deleted successfully.');
      } else {
        onShowToast('Failed to delete pop-up.');
      }
    }
  };

  // Open Edit Modal
  const openEditModal = (b: AppBroadcast) => {
    setEditingBroadcast(b);
    setEditTitle(b.title || '');
    setEditAudience(b.target_audience || 'all_users');
    setEditTargetState(b.target_state && b.target_state !== 'all' ? b.target_state : 'All States');
    setEditTargetCity(b.target_city || '');
    setEditPlacement(b.placement || (b.type === 'in_app' ? 'banner' : 'full_screen'));
    setEditDisplayType(b.display_type || (b.images && b.images.length > 1 ? 'carousel' : 'single'));
    setEditCanSkip(b.is_dismissible !== false);
    setEditIsActive(b.is_active !== false);
    setEditStartDate(b.scheduled_for ? b.scheduled_for.slice(0, 16) : '');
    setEditEndDate(b.expires_at ? b.expires_at.slice(0, 16) : '');
    setEditActionLabel(b.action_label || '');
    setEditActionDeepLink(b.action_deep_link || '');
    setEditImages(b.images && b.images.length > 0 ? b.images : (b.image_url ? [b.image_url] : []));
  };

  // Save Edit Handler
  const handleSaveEdit = async () => {
    if (!editingBroadcast) return;
    setIsSavingEdit(true);
    try {
      const res = await updateBroadcast(editingBroadcast.id, {
        title: editTitle.trim() || undefined,
        target_audience: editAudience,
        target_state: editTargetState !== 'All States' ? editTargetState : 'all',
        target_city: editTargetCity.trim() || null,
        placement: editPlacement,
        display_type: editDisplayType,
        is_dismissible: editCanSkip,
        is_active: editIsActive,
        images: editImages,
        scheduled_for: editStartDate ? new Date(editStartDate).toISOString() : null,
        expires_at: editEndDate ? new Date(editEndDate).toISOString() : null,
        action_label: editActionLabel.trim() || null,
        action_deep_link: editActionDeepLink.trim() || null,
        status: editIsActive ? (editStartDate ? 'scheduled' : 'sent') : 'draft',
      });

      if (res.success) {
        onShowToast('Pop-up updated successfully!');
        setEditingBroadcast(null);
        await loadData();
      } else {
        onShowToast(`Failed to update: ${res.error}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Format Audience Label for display
  const getAudienceDisplay = (aud: string) => {
    switch (aud) {
      case 'all_users':
      case 'all':
        return 'All Users';
      case 'active_7d':
        return 'Active Last 7 Days';
      case 'no_orders':
        return 'No Orders Yet';
      case 'has_orders':
        return 'Has Created Orders';
      case 'active_today':
        return 'Active Today';
      case 'individual_user':
      case 'specific_shop':
        return 'Individual User';
      case 'free_plan':
        return 'Free Plan (100 Limit)';
      case 'pro_plan':
        return 'Pro Plan';
      default:
        return aud;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-neutral-200/80 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-pulse" />
            <h2 className="text-lg font-bold text-[#101318] m-0">
              In-App Pop-up & Broadcast Campaign Manager
            </h2>
          </div>
          <p className="text-xs text-neutral-500 m-0 mt-1">
            Create high-converting full-screen popups and in-app banners for Counter365 POS terminals and mobile apps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Channel selector */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setBroadcastChannel('popup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                broadcastChannel === 'popup'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>In-App Pop-up</span>
            </button>
            <button
              type="button"
              onClick={() => setBroadcastChannel('push')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                broadcastChannel === 'push'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Push Notification</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Live Pop-ups & Banners
            </div>
            <div className="text-2xl font-black text-[#101318] mt-1 font-mono">
              {metrics.totalPopups}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Active across mobile POS
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center border border-orange-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Active Terminals
            </div>
            <div className="text-2xl font-black text-[#101318] mt-1 font-mono">
              {metrics.activeDevices}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {deviceTokens.android} Android • {deviceTokens.ios} iOS/Windows
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Total Screen Views
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              {metrics.totalViews}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Verified Impressions</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Click-Through Rate (CTR)
            </div>
            <div className="text-2xl font-black text-[#EA580C] mt-1 font-mono">
              {metrics.ctr}%
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {metrics.totalClicks} CTA button taps
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Composer Section (Left: Form, Right: Live Mobile Simulator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: In-App Pop-up Creator */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-[#101318]">Create New In-App Pop-up</h3>
              <p className="text-[11.5px] text-neutral-500 mt-0.5">
                Targeted modal popup or banner for Counter365 mobile &amp; POS terminals
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8F3F0] text-[#EA580C] border border-[#FED7AA]">
              {placement === 'full_screen' ? 'Full-Screen Modal' : 'Property Banner'}
            </span>
          </div>

          <form onSubmit={handleCreatePopup} className="space-y-4">
            {/* 1. Title (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11.5px] font-semibold text-neutral-700">
                  Title <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-neutral-400">Headline visible on the pop-up</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Counter365 Summer Fest - 20% Off on Pro Plan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-hidden"
              />
            </div>

            {/* 2. Audience Dropdown */}
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
              >
                <option value="all_users">All Users (All active shops)</option>
                <option value="active_7d">Active users in the last 7 days</option>
                <option value="no_orders">No orders yet</option>
                <option value="has_orders">Has created orders</option>
                <option value="active_today">Active today</option>
                <option value="individual_user">Individual user (Choose specific shop)...</option>
              </select>
            </div>

            {/* Individual User Selector (Conditional) */}
            {audience === 'individual_user' && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Select Specific User / Shop
                </label>
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city || 'Tamil Nadu'}) — ID: {s.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. State & City (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                  Target State
                </label>
                <select
                  value={targetState}
                  onChange={(e) => setTargetState(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11.5px] font-semibold text-neutral-700">
                    Target City
                  </label>
                  <span className="text-[10px] text-neutral-400 font-normal">Optional</span>
                </div>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Chennai, Madurai, Coimbatore"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 4. Placement & Display Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                  Placement
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPlacement('full_screen')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer border ${
                      placement === 'full_screen'
                        ? 'bg-[#181311] text-white border-[#181311] shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    Full-screen popup
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacement('banner')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer border ${
                      placement === 'banner'
                        ? 'bg-[#181311] text-white border-[#181311] shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    Banner
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                  Display Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayType('single');
                      if (images.length > 1) setImages([images[0]]);
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer border ${
                      displayType === 'single'
                        ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    Single Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayType('carousel')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer border ${
                      displayType === 'carousel'
                        ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    Carousel (Multi)
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Images: Choose File / Drag & Drop */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#EA580C]" />
                  <span>Images</span>
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {images.length === 0
                    ? 'No file chosen'
                    : `${images.length} image${images.length > 1 ? 's' : ''} chosen`}
                </span>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFilesSelected(e.target.files)}
                accept="image/*"
                multiple={displayType === 'carousel'}
                className="hidden"
              />

              {/* File Picker Button & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className={`p-3.5 rounded-xl border-2 border-dashed transition-all flex items-center justify-between gap-3 bg-white ${
                  isDraggingOver
                    ? 'border-[#EA580C] bg-orange-50/50'
                    : 'border-neutral-300 hover:border-[#EA580C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer border border-neutral-200 shadow-2xs"
                  >
                    Choose File
                  </button>
                  <span className="text-xs text-neutral-500">
                    {images.length === 0 ? 'No file chosen' : `${images.length} file(s) selected`}
                  </span>
                </div>

                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  {displayType === 'carousel'
                    ? 'Select multiple for slides'
                    : 'PNG, JPG, WEBP'}
                </span>
              </div>

              {/* Uploaded Thumbnails Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`relative rounded-lg overflow-hidden border-2 aspect-video bg-neutral-900 group cursor-pointer ${
                        activeSlideIndex === idx ? 'border-[#EA580C] ring-2 ring-[#EA580C]/20' : 'border-neutral-200'
                      }`}
                    >
                      <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-mono">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImageAt(idx);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 cursor-pointer shadow-xs"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {displayType === 'carousel' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border-2 border-dashed border-neutral-300 hover:border-[#EA580C] aspect-video flex flex-col items-center justify-center text-neutral-400 hover:text-[#EA580C] text-[10px] font-bold cursor-pointer bg-white transition-colors"
                    >
                      <Plus className="w-4 h-4 mb-0.5" />
                      <span>Add Slide</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 6. Two Checkboxes: Skip/Dismiss & Active */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50/70 rounded-xl border border-neutral-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={canSkipDismiss}
                  onChange={(e) => setCanSkipDismiss(e.target.checked)}
                  className="w-4 h-4 text-[#EA580C] rounded border-neutral-300 focus:ring-[#EA580C] cursor-pointer"
                />
                <span className="text-xs font-medium text-neutral-800">
                  User can skip or dismiss
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#EA580C] rounded border-neutral-300 focus:ring-[#EA580C] cursor-pointer"
                />
                <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                  <span>Active (Live Immediately)</span>
                </span>
              </label>
            </div>

            {/* 7. Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Start Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  End Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                />
              </div>
            </div>

            {/* Optional Call to Action Button & Deep Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  CTA Button Label <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Upgrade Now"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Action Deep Link <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="counter365://upgrade"
                  value={actionDeepLink}
                  onChange={(e) => setActionDeepLink(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="w-full py-3 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Create &amp; Publish In-App Pop-up</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Mobile Terminal Simulator */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Live Terminal Simulator
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Real-time preview of {placement === 'full_screen' ? 'Full-screen pop-up' : 'Banner'}
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider font-mono">
              {displayType === 'carousel' ? `Carousel (${images.length} slides)` : 'Single Image'}
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[290px] sm:w-[320px] h-[580px] bg-[#181311] rounded-[40px] p-3 shadow-2xl border-4 border-neutral-800 relative flex flex-col overflow-hidden">
            {/* Top Speaker / Dynamic Island */}
            <div className="w-full flex justify-center pb-2 pt-1 z-20">
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-between px-2">
                <span className="w-2 h-2 rounded-full bg-neutral-800" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
              </div>
            </div>

            {/* Screen Inner Canvas */}
            <div className="w-full flex-1 bg-[#F8F3F0] rounded-[28px] overflow-hidden relative flex flex-col font-sans select-none border border-neutral-200/40">
              {/* POS Topbar */}
              <div className="bg-[#181311] text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#EA580C] flex items-center justify-center text-[10px] font-black">
                    C
                  </div>
                  <span className="text-[11.5px] font-bold tracking-tight">Counter365 POS</span>
                </div>
                <div className="text-[10px] font-mono text-stone-300">Cart (₹0.00)</div>
              </div>

              {/* 1. Placement: Property List Banner Mode */}
              {placement === 'banner' && (
                <div className="m-2.5 bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden relative animate-bounce-short z-10">
                  {canSkipDismiss && (
                    <button
                      type="button"
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center z-20 cursor-pointer shadow-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {images.length > 0 ? (
                    <div className="w-full h-24 bg-neutral-900 relative">
                      <img
                        src={images[activeSlideIndex] || images[0]}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-20 bg-gradient-to-r from-[#181311] to-[#EA580C] flex items-center justify-center text-white text-[11px] font-bold">
                      Banner Preview (Upload image)
                    </div>
                  )}

                  {title && (
                    <div className="p-2 text-left">
                      <div className="text-[11px] font-bold text-neutral-900 line-clamp-1">{title}</div>
                      {actionLabel && (
                        <div className="text-[10px] text-[#EA580C] font-semibold mt-0.5">
                          {actionLabel} &rarr;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* POS Terminal Background Content Mockup */}
              <div className="flex-1 p-3 flex flex-col justify-between opacity-45 pointer-events-none">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200 shadow-2xs">
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Today Sales</div>
                    <div className="text-sm font-bold text-neutral-900 mt-0.5 font-mono">₹4,250.00</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200 shadow-2xs">
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Total Bills</div>
                    <div className="text-sm font-bold text-neutral-900 mt-0.5 font-mono">18 orders</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2.5 bg-neutral-300 rounded w-3/4"></div>
                  <div className="h-2.5 bg-neutral-300 rounded w-1/2"></div>
                  <div className="h-2.5 bg-neutral-300 rounded w-5/6"></div>
                </div>

                <div className="h-8 bg-[#EA580C]/25 border border-[#EA580C]/40 rounded-xl flex items-center justify-center text-[11px] text-neutral-800 font-bold">
                  + Add New Bill (F1)
                </div>
              </div>

              {/* 2. Placement: Full-Screen Pop-up Modal Mode */}
              {placement === 'full_screen' && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-3 z-30">
                  <div className="w-full bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col relative max-h-[94%] animate-scale-in">
                    {/* User can skip or dismiss X button */}
                    {canSkipDismiss && (
                      <button
                        type="button"
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center z-30 backdrop-blur-md cursor-pointer transition-transform active:scale-95 shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Pop-up Image / Carousel Container */}
                    <div className="w-full h-40 bg-neutral-900 relative overflow-hidden shrink-0">
                      {images.length > 0 ? (
                        <img
                          src={images[activeSlideIndex] || images[0]}
                          alt="Popup Graphic"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#181311] via-[#2A1E1A] to-[#EA580C] flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-[#EA580C]" />
                        </div>
                      )}

                      {/* Carousel Next/Prev Controls */}
                      {displayType === 'carousel' && images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                            }
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlideIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                            }
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Dots */}
                          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
                            {images.map((_, i) => (
                              <span
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  activeSlideIndex === i ? 'bg-white w-3' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Modal Content */}
                    <div className="p-3 text-center flex flex-col items-center overflow-y-auto">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-[#EA580C] uppercase mb-1 tracking-wide">
                        {targetState !== 'All States' ? targetState : 'Special Notice'}
                      </div>

                      {title && (
                        <h4 className="text-[12.5px] font-bold text-neutral-900 leading-snug">
                          {title}
                        </h4>
                      )}

                      {message && (
                        <p className="text-[10.5px] text-neutral-600 mt-1 line-clamp-3 leading-relaxed">
                          {message}
                        </p>
                      )}

                      {actionLabel && (
                        <button
                          type="button"
                          className="w-full mt-2.5 py-1.5 px-3 bg-[#EA580C] text-white text-[10.5px] font-bold rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{actionLabel}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Home Indicator */}
            <div className="w-full flex justify-center pt-2">
              <div className="w-28 h-1 bg-neutral-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up List Table (Title, Audience, Placement, Type, Frequency, Images, Views, Status ON/OFF, Schedule, Created, Actions) */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200/80 p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
              In-App Pop-up &amp; Banner Campaigns Ledger
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Live directory of all configured pop-ups, impressions, state targeting &amp; active status
            </div>
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            {broadcasts.length} recorded items
          </span>
        </div>

        <div className="overflow-x-auto">
          {broadcasts.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              No pop-ups or banners created yet. Use the composer above to create one!
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200/80 bg-neutral-50 text-[11px] font-mono font-bold text-neutral-600 uppercase">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Audience</th>
                  <th className="py-2.5 px-3">Placement</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3 text-center">Images</th>
                  <th className="py-2.5 px-3 text-center">Views</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Schedule</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* 1. Title */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-neutral-900">
                        {b.title || <span className="text-neutral-400 italic">(Untitled Pop-up)</span>}
                      </div>
                      {b.action_label && (
                        <div className="text-[10px] text-[#EA580C] font-mono mt-0.5 truncate max-w-[200px]">
                          CTA: {b.action_label} &rarr; {b.action_deep_link || 'N/A'}
                        </div>
                      )}
                    </td>

                    {/* 2. Audience */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                        <Users className="w-2.5 h-2.5 text-neutral-500" />
                        <span>{getAudienceDisplay(b.target_audience)}</span>
                      </div>
                      {b.target_state && b.target_state !== 'all' && (
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          State: <strong>{b.target_state}</strong>
                        </div>
                      )}
                      {b.target_city && (
                        <div className="text-[10px] text-neutral-400">City: {b.target_city}</div>
                      )}
                    </td>

                    {/* 3. Placement */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.placement === 'banner'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {b.placement === 'banner' ? 'Banner' : 'Full-screen'}
                      </span>
                    </td>

                    {/* 4. Type */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-medium text-neutral-700">
                        {b.display_type === 'carousel' ? 'Carousel Multi' : 'Single Image'}
                      </span>
                    </td>

                    {/* 5. Frequency */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-neutral-600 font-mono">
                        {b.frequency || (b.max_impressions === 1 ? 'Once per user' : 'Every session')}
                      </span>
                    </td>

                    {/* 6. Images */}
                    <td className="py-3 px-3 text-center">
                      {b.images && b.images.length > 0 ? (
                        <div className="flex items-center justify-center -space-x-2">
                          {b.images.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Thumbnail"
                              className="w-7 h-7 rounded-md object-cover border border-white shadow-2xs"
                            />
                          ))}
                          {b.images.length > 3 && (
                            <span className="w-7 h-7 rounded-md bg-neutral-200 text-neutral-700 text-[10px] font-bold flex items-center justify-center border border-white">
                              +{b.images.length - 3}
                            </span>
                          )}
                        </div>
                      ) : b.image_url ? (
                        <img
                          src={b.image_url}
                          alt="Thumbnail"
                          className="w-7 h-7 rounded-md object-cover mx-auto border border-neutral-200 shadow-2xs"
                        />
                      ) : (
                        <span className="text-neutral-400 text-[11px]">&mdash;</span>
                      )}
                    </td>

                    {/* 7. Views */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-neutral-800">
                      {b.interactions_count?.viewed || 0}
                    </td>

                    {/* 8. Status: Interactive Switch ON / OFF */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(b)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          b.is_active ? 'bg-[#EA580C]' : 'bg-neutral-300'
                        }`}
                        title={b.is_active ? 'Click to turn OFF' : 'Click to turn ON'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            b.is_active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div className="text-[9px] font-mono mt-0.5 text-neutral-500 uppercase">
                        {b.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </td>

                    {/* 9. Schedule */}
                    <td className="py-3 px-3 text-[10.5px] font-mono text-neutral-600">
                      <div>
                        Start:{' '}
                        {b.scheduled_for
                          ? new Date(b.scheduled_for).toLocaleDateString()
                          : 'Immediate'}
                      </div>
                      {b.expires_at && (
                        <div className="text-neutral-400">
                          End: {new Date(b.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* 10. Created */}
                    <td className="py-3 px-3 text-[10.5px] font-mono text-neutral-400">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>

                    {/* 11. Actions: Edit and Delete */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1 rounded text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Edit Pop-up"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePopup(b.id)}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Pop-up"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Pop-up Modal Dialog */}
      {editingBroadcast && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#EA580C]" />
                <span>Edit In-App Pop-up</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBroadcast(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Audience</label>
                  <select
                    value={editAudience}
                    onChange={(e) => setEditAudience(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value="all_users">All Users</option>
                    <option value="active_7d">Active Last 7 Days</option>
                    <option value="no_orders">No Orders Yet</option>
                    <option value="has_orders">Has Created Orders</option>
                    <option value="active_today">Active Today</option>
                    <option value="individual_user">Individual User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">State</label>
                  <select
                    value={editTargetState}
                    onChange={(e) => setEditTargetState(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Placement</label>
                  <select
                    value={editPlacement}
                    onChange={(e: any) => setEditPlacement(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value="full_screen">Full-screen popup</option>
                    <option value="banner">Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Display Type</label>
                  <select
                    value={editDisplayType}
                    onChange={(e: any) => setEditDisplayType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value="single">Single Image</option>
                    <option value="carousel">Carousel Multi-image</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCanSkip}
                    onChange={(e) => setEditCanSkip(e.target.checked)}
                    className="w-4 h-4 text-[#EA580C] rounded"
                  />
                  <span className="text-xs font-medium text-neutral-800">User can skip or dismiss</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#EA580C] rounded"
                  />
                  <span className="text-xs font-semibold text-neutral-900">Active Status</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">CTA Label</label>
                  <input
                    type="text"
                    value={editActionLabel}
                    onChange={(e) => setEditActionLabel(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Deep Link</label>
                  <input
                    type="text"
                    value={editActionDeepLink}
                    onChange={(e) => setEditActionDeepLink(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-neutral-100 flex items-center justify-end gap-2 bg-neutral-50/50">
              <button
                type="button"
                onClick={() => setEditingBroadcast(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
