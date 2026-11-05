'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Shop, AppBroadcast } from '../../types/database';
import {
  fetchBroadcasts,
  createBroadcast,
  deleteBroadcast,
  archiveBroadcast,
  getActiveDeviceTokensCount,
} from '../../services/broadcastService';
import {
  Bell,
  Radio,
  Layers,
  Send,
  Trash2,
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
  XCircle,
  X,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Archive,
  Upload,
  UploadCloud,
  FileImage,
  Check,
  Link as LinkIcon,
} from 'lucide-react';

interface BroadcastNotificationsViewProps {
  type?: 'broadcast' | 'scheduled' | 'push';
  shops: Shop[];
  onShowToast: (msg: string) => void;
}

export function BroadcastNotificationsView({
  type: initialType = 'broadcast',
  shops,
  onShowToast,
}: BroadcastNotificationsViewProps) {
  // Navigation Channel Tab
  const [broadcastType, setBroadcastType] = useState<'popup' | 'push' | 'in_app'>(
    initialType === 'push' ? 'push' : 'popup'
  );

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [targetAudience, setTargetAudience] = useState<'all' | 'free_plan' | 'pro_plan' | 'specific_shop' | 'specific_city'>('all');
  const [targetShopId, setTargetShopId] = useState<string>(shops[0]?.id || '');
  const [targetCity, setTargetCity] = useState<string>('');
  
  // Image Upload / URL State
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageFileSize, setImageFileSize] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pop-up CTA Fields
  const [actionLabel, setActionLabel] = useState<string>('Upgrade to Pro');
  const [actionDeepLink, setActionDeepLink] = useState<string>('counter365://upgrade');
  const [isDismissible, setIsDismissible] = useState<boolean>(true);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [expiryDateTime, setExpiryDateTime] = useState<string>('');

  // Data State
  const [broadcasts, setBroadcasts] = useState<AppBroadcast[]>([]);
  const [deviceTokens, setDeviceTokens] = useState<{ total: number; android: number; ios: number; web: number }>({
    total: 0,
    android: 0,
    ios: 0,
    web: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'android' | 'ios'>('android');

  // Quick Preset Templates for Counter365
  const presets = [
    {
      label: 'Free Plan 100 Quota Warning',
      type: 'popup' as const,
      title: 'Free 100 Sales Limit Reached',
      message: 'You have reached your 100 free sales bills for this month. Upgrade to Counter365 Pro for unlimited cloud billing and multi-device sync.',
      actionLabel: 'Upgrade to Pro @ ₹499',
      actionDeepLink: 'counter365://upgrade',
      targetAudience: 'free_plan' as const,
      priority: 'urgent' as const,
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Thermal Printer Auto-Reconnect Live',
      type: 'in_app' as const,
      title: 'Bluetooth & USB Printer Auto-Reconnect',
      message: 'New Counter365 update enables instant auto-pairing with ESC/POS 58mm & 80mm thermal receipt printers without manual reconnects.',
      actionLabel: 'Test Printer',
      actionDeepLink: 'counter365://settings/printer',
      targetAudience: 'all' as const,
      priority: 'high' as const,
      imageUrl: '',
    },
    {
      label: 'Critical Cloud Sync Advisory',
      type: 'push' as const,
      title: 'Counter365 Cloud Engine v2.4 Live',
      message: 'Your offline sales bills are synced seamlessly with the cloud ledger. Please keep your app updated.',
      actionLabel: 'View Audit',
      actionDeepLink: 'counter365://bills',
      targetAudience: 'all' as const,
      priority: 'high' as const,
      imageUrl: '',
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setBroadcastType(preset.type);
    setTitle(preset.title);
    setMessage(preset.message);
    setActionLabel(preset.actionLabel);
    setActionDeepLink(preset.actionDeepLink);
    setTargetAudience(preset.targetAudience);
    setPriority(preset.priority);
    setImageUrl(preset.imageUrl);
    setImageFileName(preset.imageUrl ? 'preset-image.jpg' : '');
    setImageFileSize('');
    onShowToast(`Loaded template: "${preset.label}"`);
  };

  // Image File Handling with Client-side Compression for Mobile Fast Loading
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onShowToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onShowToast('Image size should be under 8MB.');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        // Create canvas to scale down to max 1200px wide for optimal mobile performance
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setImageUrl(compressedDataUrl);
          setImageFileName(file.name);
          setImageFileSize(`${(file.size / 1024).toFixed(0)} KB`);
          onShowToast(`Uploaded "${file.name}" successfully!`);
        } else {
          setImageUrl(dataUrl);
          setImageFileName(file.name);
        }
        setIsUploadingImage(false);
      };
      img.onerror = () => {
        setImageUrl(dataUrl);
        setImageFileName(file.name);
        setIsUploadingImage(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const removeUploadedImage = () => {
    setImageUrl('');
    setImageFileName('');
    setImageFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onShowToast('Banner image removed.');
  };

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
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalDismissed = 0;

    broadcasts.forEach((b) => {
      if (b.interactions_count) {
        totalImpressions += b.interactions_count.viewed || 0;
        totalClicks += b.interactions_count.clicked || 0;
        totalDismissed += b.interactions_count.dismissed || 0;
      }
    });

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

    return {
      activeDevices: Math.max(deviceTokens.total, shops.length),
      androidCount: deviceTokens.android,
      iosCount: deviceTokens.ios,
      totalBroadcasts: broadcasts.length,
      totalImpressions,
      totalClicks,
      ctr,
    };
  }, [broadcasts, deviceTokens, shops.length]);

  // Handle Form Submission
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onShowToast('Please provide both notification title and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createBroadcast({
        title: title.trim(),
        message: message.trim(),
        type: broadcastType,
        priority,
        target_audience: targetAudience,
        target_shop_id: targetAudience === 'specific_shop' ? targetShopId : null,
        target_city: targetAudience === 'specific_city' ? targetCity.trim() : null,
        image_url: imageUrl.trim() || null,
        action_label: broadcastType === 'popup' ? actionLabel.trim() : null,
        action_deep_link: broadcastType === 'popup' ? actionDeepLink.trim() : null,
        is_dismissible: isDismissible,
        scheduled_for: isScheduled && scheduleDateTime ? new Date(scheduleDateTime).toISOString() : null,
        expires_at: expiryDateTime ? new Date(expiryDateTime).toISOString() : null,
        status: isScheduled ? 'scheduled' : 'sent',
      });

      if (res.success) {
        onShowToast(
          isScheduled
            ? 'Broadcast scheduled successfully in Supabase!'
            : `Live ${broadcastType === 'popup' ? 'In-App Pop-up' : broadcastType === 'push' ? 'Push Alert' : 'App Notification'} dispatched to live POS counter terminals!`
        );
        // Reset inputs
        setTitle('');
        setMessage('');
        setImageUrl('');
        setImageFileName('');
        setImageFileSize('');
        setIsScheduled(false);
        setScheduleDateTime('');
        await loadData();
      } else {
        onShowToast(`Failed to dispatch: ${res.error || 'Check database permissions'}`);
      }
    } catch (err: any) {
      onShowToast(`Dispatch error: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this broadcast record and its interactions?')) {
      const ok = await deleteBroadcast(id);
      if (ok) {
        onShowToast('Broadcast deleted from database.');
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      } else {
        onShowToast('Failed to delete broadcast.');
      }
    }
  };

  const handleArchive = async (id: string) => {
    const ok = await archiveBroadcast(id);
    if (ok) {
      onShowToast('Broadcast archived.');
      setBroadcasts((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'archived' } : b))
      );
    } else {
      onShowToast('Failed to archive broadcast.');
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
              Merchant Engagement & In-App Pop-up Dispatch Console
            </h2>
          </div>
          <p className="text-xs text-neutral-500 m-0 mt-1">
            Dispatch instant push notifications, system-wide announcements, and interactive In-App Pop-ups directly to Counter365 POS devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Active Terminals
            </div>
            <div className="text-2xl font-black text-[#101318] mt-1 font-mono">
              {metrics.activeDevices}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {deviceTokens.android} Android • {deviceTokens.ios} iOS / Windows
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center border border-orange-100">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Total Dispatches
            </div>
            <div className="text-2xl font-black text-[#101318] mt-1 font-mono">
              {metrics.totalBroadcasts}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Pop-ups, Pushes & Banners
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Pop-up Impressions
            </div>
            <div className="text-2xl font-black text-[#101318] mt-1 font-mono">
              {metrics.totalImpressions}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Cashier Screen Views</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              CTA Click Rate (CTR)
            </div>
            <div className="text-2xl font-black text-[#EA580C] mt-1 font-mono">
              {metrics.ctr}%
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {metrics.totalClicks} Total CTA Interactions
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200/80 p-3.5 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#EA580C]" />
          <span className="text-xs font-bold text-[#101318]">One-Click Preset Templates:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#F8F3F0] hover:bg-[#F0EAE5] text-[#101318] border border-neutral-200/70 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Composer Form on Left, Live Mobile Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Composer Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-[#101318]">Broadcast & Pop-up Composer</h3>
              <p className="text-[11.5px] text-neutral-500 mt-0.5">Configure message copy, media, targeting & call-to-action</p>
            </div>

            {/* Channel Type Pills */}
            <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200">
              <button
                type="button"
                onClick={() => setBroadcastType('popup')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  broadcastType === 'popup'
                    ? 'bg-white text-[#EA580C] shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>In-App Pop-up</span>
              </button>
              <button
                type="button"
                onClick={() => setBroadcastType('push')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  broadcastType === 'push'
                    ? 'bg-white text-[#EA580C] shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Mobile Push</span>
              </button>
              <button
                type="button"
                onClick={() => setBroadcastType('in_app')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  broadcastType === 'in_app'
                    ? 'bg-white text-[#EA580C] shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>App Banner</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleDispatch} className="space-y-4">
            {/* Title & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                  Headline Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free 100 Sales Limit Reached"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                  Delivery Priority
                </label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
                >
                  <option value="normal">Normal (Standard)</option>
                  <option value="high">High (Foreground Alert)</option>
                  <option value="urgent">Urgent (Modal Alert)</option>
                </select>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                Message Body <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Explain the update, upgrade benefit, or critical notice in clear language..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-hidden resize-none"
                required
              />
            </div>

            {/* Audience Targeting Matrix */}
            <div className="p-3.5 rounded-xl bg-[#F8F3F0]/60 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Audience Targeting</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {targetAudience === 'all'
                    ? `Broadcasting to all ${shops.length} merchant shops`
                    : targetAudience === 'free_plan'
                    ? 'Targeting Free Plan shops only (100 limit)'
                    : targetAudience === 'pro_plan'
                    ? 'Targeting Pro Plan active subscribers'
                    : targetAudience === 'specific_shop'
                    ? 'Targeting single merchant counter'
                    : 'Targeting specific city territory'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'all', label: 'All Shops' },
                  { id: 'free_plan', label: 'Free Plan' },
                  { id: 'pro_plan', label: 'Pro Plan' },
                  { id: 'specific_shop', label: 'Single Shop' },
                  { id: 'specific_city', label: 'City / Region' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                      targetAudience === aud.id
                        ? 'bg-[#181311] text-white shadow-xs'
                        : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>

              {/* Conditional Target Selectors */}
              {targetAudience === 'specific_shop' && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Select Target Shop
                  </label>
                  <select
                    value={targetShopId}
                    onChange={(e) => setTargetShopId(e.target.value)}
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

              {targetAudience === 'specific_city' && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Enter Target City / Region
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Chennai, Madurai, Coimbatore, Bangalore"
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* In-App Pop-up Specific Controls (Image File Upload, CTA, Deep Link) */}
            {broadcastType === 'popup' && (
              <div className="p-4 rounded-xl border border-orange-200/80 bg-orange-50/20 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#EA580C] flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>In-App Pop-up Modal Controls</span>
                  </span>
                  
                  {/* Mode switcher: Upload File vs Web URL */}
                  <div className="flex items-center bg-white rounded-lg p-0.5 border border-orange-200">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('file')}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                        imageUploadMode === 'file'
                          ? 'bg-[#EA580C] text-white shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('url')}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                        imageUploadMode === 'url'
                          ? 'bg-[#EA580C] text-white shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* File Upload Zone */}
                {imageUploadMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {imageUrl ? (
                      /* Uploaded Image Preview & Controls Card */
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-16 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                            <img
                              src={imageUrl}
                              alt="Uploaded Banner Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-neutral-900 truncate">
                              {imageFileName || 'Uploaded Banner'}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                              <Check className="w-3 h-3" />
                              <span>Ready & formatted for mobile POS</span>
                              {imageFileSize && <span className="text-neutral-400">({imageFileSize})</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={removeUploadedImage}
                            className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Dropzone */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(true);
                        }}
                        onDragLeave={() => setIsDraggingOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer text-center bg-white ${
                          isDraggingOver
                            ? 'border-[#EA580C] bg-orange-50/50'
                            : 'border-neutral-300 hover:border-[#EA580C] hover:bg-orange-50/30'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-[#EA580C] flex items-center justify-center mb-1.5 border border-orange-100">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-neutral-800">
                          Click to upload banner image or drag and drop
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          PNG, JPG, WEBP up to 8MB • Auto-optimized for phone display
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Web Image URL Option */
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Banner Image URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        placeholder="https://... (direct image URL)"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImageFileName(e.target.value ? 'web-image.jpg' : '');
                        }}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Call to Action Button & Deep Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Action Button Text (CTA)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Upgrade to Pro @ ₹499"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Deep Link URI (Mobile Route)
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

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-neutral-700 font-medium">Merchant can close / dismiss modal</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDismissible}
                      onChange={(e) => setIsDismissible(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EA580C]"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Scheduling & Expiry Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-neutral-700">
                    Schedule for Later
                  </label>
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="cursor-pointer"
                  />
                </div>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                    required={isScheduled}
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiryDateTime}
                  onChange={(e) => setExpiryDateTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                />
              </div>
            </div>

            {/* Submit Dispatch Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="w-full py-3 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Writing to Supabase & Queuing Dispatch...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {isScheduled
                        ? 'Queue Scheduled Broadcast'
                        : broadcastType === 'popup'
                        ? 'Dispatch In-App Pop-up to Live POS'
                        : broadcastType === 'push'
                        ? 'Send Mobile Push Notification Now'
                        : 'Dispatch In-App Notification Banner'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Mobile Device Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Live Terminal Simulator
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Real-time visual rendering on POS terminal
              </div>
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                onClick={() => setPreviewDeviceMode('android')}
                className={`px-2 py-1 rounded text-[10.5px] font-semibold cursor-pointer ${
                  previewDeviceMode === 'android' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-neutral-500'
                }`}
              >
                Android POS
              </button>
              <button
                onClick={() => setPreviewDeviceMode('ios')}
                className={`px-2 py-1 rounded text-[10.5px] font-semibold cursor-pointer ${
                  previewDeviceMode === 'ios' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-neutral-500'
                }`}
              >
                iOS / Tablet
              </button>
            </div>
          </div>

          {/* Smartphone Frame with realistic bezel */}
          <div className="w-[290px] sm:w-[320px] h-[560px] bg-[#181311] rounded-[40px] p-3 shadow-2xl border-4 border-neutral-800 relative flex flex-col overflow-hidden">
            {/* Top Dynamic Island / Camera */}
            <div className="w-full flex justify-center pb-2 pt-1 z-20">
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-between px-2">
                <span className="w-2 h-2 rounded-full bg-neutral-800" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
              </div>
            </div>

            {/* Screen Inner Canvas */}
            <div className="w-full flex-1 bg-[#F8F3F0] rounded-[28px] overflow-hidden relative flex flex-col font-sans select-none border border-neutral-200/40">
              {/* POS App Topbar Mockup */}
              <div className="bg-[#181311] text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#EA580C] flex items-center justify-center text-[10px] font-black">
                    C
                  </div>
                  <span className="text-[11.5px] font-bold tracking-tight">Counter365 POS</span>
                </div>
                <div className="text-[10px] font-mono text-stone-300">₹0.00 Cart</div>
              </div>

              {/* In-App Top Notification Banner Mode */}
              {broadcastType === 'in_app' && (
                <div className="m-2.5 p-3 bg-white rounded-xl shadow-md border-l-4 border-l-[#EA580C] border border-neutral-200/80 flex items-start gap-2.5 animate-bounce-short z-10">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#EA580C] flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] font-bold text-[#101318] truncate">
                      {title || 'Counter365 Notification'}
                    </div>
                    <div className="text-[10.5px] text-neutral-600 line-clamp-2 mt-0.5">
                      {message || 'Your announcement copy will appear here...'}
                    </div>
                  </div>
                </div>
              )}

              {/* POS Terminal Background Content Mock */}
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

              {/* Push Notification Lockscreen Style Overlay */}
              {broadcastType === 'push' && (
                <div className="absolute inset-0 bg-neutral-900/65 backdrop-blur-[2px] p-3 flex flex-col justify-start pt-6 z-20">
                  <div className="text-center text-white/80 text-[11px] font-mono mb-3">
                    Lock Screen Notification
                  </div>
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/40">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 pb-1 mb-1 border-b border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-[#EA580C] text-white flex items-center justify-center text-[8px] font-bold">
                          C
                        </span>
                        <span className="font-semibold text-neutral-800">COUNTER365</span>
                      </div>
                      <span>now</span>
                    </div>
                    <div className="text-xs font-bold text-neutral-900 mt-1">
                      {title || 'Critical Update Announcement'}
                    </div>
                    <div className="text-[11px] text-neutral-600 mt-0.5 line-clamp-3 leading-relaxed">
                      {message || 'Type your push notification message in the composer on the left to preview...'}
                    </div>
                  </div>
                </div>
              )}

              {/* In-App Pop-up Dialog Modal: Perfectly Formatted & Visible */}
              {broadcastType === 'popup' && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-3 z-30">
                  <div className="w-full bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col relative max-h-[94%]">
                    {/* Dismiss X button */}
                    {isDismissible && (
                      <button
                        type="button"
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center z-20 backdrop-blur-md cursor-pointer transition-transform active:scale-95 shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Banner Graphic Image: Crisp, 16:9 ratio, perfectly visible */}
                    {imageUrl ? (
                      <div className="w-full h-36 bg-neutral-900 relative overflow-hidden shrink-0 border-b border-neutral-100">
                        <img
                          src={imageUrl}
                          alt="Banner Graphic"
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full h-20 bg-gradient-to-r from-[#181311] via-[#2A1E1A] to-[#EA580C] flex items-center justify-center shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20">
                          <Sparkles className="w-5 h-5 text-[#EA580C]" />
                        </div>
                      </div>
                    )}

                    {/* Modal Content */}
                    <div className="p-3.5 text-center flex flex-col items-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-[#EA580C] uppercase mb-1.5 tracking-wide">
                        {priority === 'urgent' ? 'Important Alert' : 'Counter365 Notice'}
                      </div>
                      <h4 className="text-[13px] font-bold text-neutral-900 leading-snug">
                        {title || 'Notice Headline'}
                      </h4>
                      <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed line-clamp-4">
                        {message || 'Type your announcement message to preview it here in real-time.'}
                      </p>

                      {/* Primary CTA Button */}
                      <button
                        type="button"
                        className="w-full mt-3 py-2 px-3 bg-[#EA580C] text-white text-[11px] font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{actionLabel || 'Check Now'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {/* Deep Link Hint */}
                      {actionDeepLink && (
                        <div className="text-[8.5px] font-mono text-neutral-400 mt-1.5 truncate max-w-full">
                          Deep Link: {actionDeepLink}
                        </div>
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

      {/* Broadcast History & Delivery Ledger */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200/80 p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
              Live Broadcasts & Pop-up Ledger
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              History of all dispatched notices, modal impressions, and user interactions
            </div>
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            {broadcasts.length} recorded broadcasts
          </span>
        </div>

        <div className="overflow-x-auto">
          {broadcasts.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              No broadcasts recorded in Supabase table yet. Compose and dispatch one above!
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200/80 bg-neutral-50 text-[11px] font-mono font-bold text-neutral-600 uppercase">
                  <th className="py-2.5 px-3">Channel & Headline</th>
                  <th className="py-2.5 px-3">Target Audience</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Impressions</th>
                  <th className="py-2.5 px-3 text-center">Clicks</th>
                  <th className="py-2.5 px-3 text-center">Dismissals</th>
                  <th className="py-2.5 px-3">Dispatched At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Channel & Headline */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            b.type === 'popup'
                              ? 'bg-orange-100 text-[#EA580C]'
                              : b.type === 'push'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {b.type === 'popup' ? (
                            <Layers className="w-3.5 h-3.5" />
                          ) : b.type === 'push' ? (
                            <Bell className="w-3.5 h-3.5" />
                          ) : (
                            <Radio className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900">{b.title}</div>
                          <div className="text-[11px] text-neutral-500 line-clamp-1 max-w-[280px]">
                            {b.message}
                          </div>
                          {b.action_label && (
                            <div className="text-[10px] text-[#EA580C] font-mono mt-0.5">
                              CTA: {b.action_label} &rarr; {b.action_deep_link || 'N/A'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target Audience */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 uppercase">
                        <Users className="w-2.5 h-2.5" />
                        <span>
                          {b.target_audience === 'specific_shop'
                            ? b.target_shop?.name || 'Single Shop'
                            : b.target_audience === 'specific_city'
                            ? `City: ${b.target_city}`
                            : b.target_audience.replace('_', ' ')}
                        </span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'scheduled'
                            ? 'bg-amber-100 text-amber-800'
                            : b.status === 'archived'
                            ? 'bg-neutral-100 text-neutral-500'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{b.status}</span>
                      </span>
                    </td>

                    {/* Impressions */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-neutral-800">
                      {b.interactions_count?.viewed || 0}
                    </td>

                    {/* Clicks */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-[#EA580C]">
                      {b.interactions_count?.clicked || 0}
                    </td>

                    {/* Dismissals */}
                    <td className="py-3 px-3 text-center font-mono text-neutral-500">
                      {b.interactions_count?.dismissed || 0}
                    </td>

                    {/* Sent Date */}
                    <td className="py-3 px-3 text-[11px] font-mono text-neutral-500">
                      {b.sent_at
                        ? new Date(b.sent_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : b.scheduled_for
                        ? `Scheduled: ${new Date(b.scheduled_for).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}`
                        : new Date(b.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(b.id)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Archive Broadcast"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1 rounded text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Broadcast"
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
    </div>
  );
}
