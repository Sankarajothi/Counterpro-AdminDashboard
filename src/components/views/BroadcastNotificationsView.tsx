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
  Copy,
  Filter,
  Zap,
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
  // Main Channel/Tab: In-App Pop-up vs Push Notification vs Scheduled Pushes
  const [activeTab, setActiveTab] = useState<'popup' | 'push' | 'scheduled'>(() => {
    if (initialType === 'push') return 'push';
    if (initialType === 'scheduled') return 'scheduled';
    return 'popup';
  });

  // Sync prop changes into activeTab if prop changes
  useEffect(() => {
    if (initialType === 'push') setActiveTab('push');
    else if (initialType === 'scheduled') setActiveTab('scheduled');
    else setActiveTab('popup');
  }, [initialType]);

  // Push Tab Mode Slider: Send Now vs Schedule for Later
  const [pushSendMode, setPushSendMode] = useState<'now' | 'scheduled'>('now');

  // ==================== IN-APP POP-UP FORM STATE ====================
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
  const [actionLabel, setActionLabel] = useState<string>('Upgrade to Pro');
  const [actionDeepLink, setActionDeepLink] = useState<string>('counter365://upgrade');
  const [frequency, setFrequency] = useState<string>('Once per user');

  // Pop-up Image Uploads State
  const [images, setImages] = useState<string[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== PUSH NOTIFICATION FORM STATE ====================
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushAudience, setPushAudience] = useState<string>('all_users');
  const [pushSelectedShopId, setPushSelectedShopId] = useState<string>(shops[0]?.id || '');
  const [pushState, setPushState] = useState<string>('All States');
  const [pushCity, setPushCity] = useState<string>('');
  const [pushImage, setPushImage] = useState<string>('');
  const [pushScheduledAt, setPushScheduledAt] = useState<string>('');
  const [isSubmittingPush, setIsSubmittingPush] = useState<boolean>(false);
  const pushFileInputRef = useRef<HTMLInputElement>(null);

  // ==================== SCHEDULED PUSHES FILTERS ====================
  const [scheduledStatusFilter, setScheduledStatusFilter] = useState<'all' | 'pending' | 'sending' | 'sent'>('all');
  const [scheduledDateFilter, setScheduledDateFilter] = useState<string>('');

  // ==================== EDIT MODALS ====================
  // 1. In-App Pop-up Edit
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

  // 2. Scheduled Push Edit
  const [editingScheduled, setEditingScheduled] = useState<AppBroadcast | null>(null);
  const [editSchedTitle, setEditSchedTitle] = useState('');
  const [editSchedMessage, setEditSchedMessage] = useState('');
  const [editSchedAudience, setEditSchedAudience] = useState('all_users');
  const [editSchedState, setEditSchedState] = useState('All States');
  const [editSchedCity, setEditSchedCity] = useState('');
  const [editSchedTime, setEditSchedTime] = useState('');
  const [editSchedStatus, setEditSchedStatus] = useState<'draft' | 'scheduled' | 'sent'>('scheduled');
  const [isSavingSchedEdit, setIsSavingSchedEdit] = useState(false);

  // Data & Ledger State
  const [broadcasts, setBroadcasts] = useState<AppBroadcast[]>([]);
  const [deviceTokens, setDeviceTokens] = useState<{ total: number; android: number; ios: number; web: number }>({
    total: 0,
    android: 0,
    ios: 0,
    web: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingPopup, setIsSubmittingPopup] = useState<boolean>(false);

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

  // Push Reach Calculations (Strictly Counter365 Registered Members)
  const pushReach = useMemo(() => {
    const totalRegisteredMembers = shops.length;
    const canReceivePush = deviceTokens.total > 0 ? deviceTokens.total : Math.min(totalRegisteredMembers, 8);
    const notReceivedPush = Math.max(0, totalRegisteredMembers - canReceivePush);
    const reachPercent = totalRegisteredMembers > 0
      ? Math.min(100, Math.round((canReceivePush / totalRegisteredMembers) * 100))
      : 100;

    return {
      totalRegisteredMembers,
      canReceivePush,
      notReceivedPush,
      reachPercent,
      android: deviceTokens.android,
      ios: deviceTokens.ios,
    };
  }, [shops.length, deviceTokens]);

  // Filtered Ledgers
  const popupLedger = useMemo(() => {
    return broadcasts.filter((b) => b.type === 'popup' || b.type === 'in_app');
  }, [broadcasts]);

  const pushHistoryLedger = useMemo(() => {
    return broadcasts.filter((b) => b.type === 'push' && b.status !== 'scheduled');
  }, [broadcasts]);

  const scheduledLedger = useMemo(() => {
    return broadcasts.filter((b) => {
      const isSched = b.status === 'scheduled' || (b.scheduled_for && new Date(b.scheduled_for) > new Date());
      if (!isSched) return false;

      // Status filter
      if (scheduledStatusFilter === 'pending' && b.status !== 'scheduled') return false;
      if (scheduledStatusFilter === 'sending' && b.status !== 'draft') return false;
      if (scheduledStatusFilter === 'sent' && b.status !== 'sent') return false;

      // Date filter
      if (scheduledDateFilter && b.scheduled_for) {
        const schedDay = b.scheduled_for.slice(0, 10);
        if (schedDay !== scheduledDateFilter) return false;
      }

      return true;
    });
  }, [broadcasts, scheduledStatusFilter, scheduledDateFilter]);

  // File Upload Processing (In-App Popups)
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

  // Push Image Upload
  const handlePushImageUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith('image/')) {
      onShowToast('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPushImage(e.target?.result as string);
      onShowToast('Notification icon/image attached.');
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler: Create Pop-up
  const handleCreatePopup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      onShowToast('Please choose at least one banner/popup image.');
      return;
    }

    setIsSubmittingPopup(true);
    try {
      const res = await createBroadcast({
        title: title.trim() || undefined,
        message: undefined, // Announcement body text intentionally omitted per requirement
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
        setTitle('');
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
      setIsSubmittingPopup(false);
    }
  };

  // Submit Handler: Push Broadcast (Immediate or Scheduled)
  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pushTitle.trim()) {
      onShowToast('Campaign Title is required for push broadcast.');
      return;
    }
    if (!pushMessage.trim()) {
      onShowToast('Notification Message body is required.');
      return;
    }
    if (pushSendMode === 'scheduled' && !pushScheduledAt) {
      onShowToast('Please pick a scheduled date and time.');
      return;
    }

    setIsSubmittingPush(true);
    try {
      const isScheduled = pushSendMode === 'scheduled';
      const scheduledIso = isScheduled ? new Date(pushScheduledAt).toISOString() : null;

      const res = await createBroadcast({
        title: pushTitle.trim(),
        message: pushMessage.trim(),
        type: 'push',
        target_audience: pushAudience,
        target_shop_id: pushAudience === 'individual_user' ? pushSelectedShopId : null,
        target_state: pushState !== 'All States' ? pushState : 'all',
        target_city: pushCity.trim() || null,
        image_url: pushImage || null,
        images: pushImage ? [pushImage] : [],
        scheduled_for: scheduledIso,
        status: isScheduled ? 'scheduled' : 'sent',
      });

      if (res.success) {
        if (isScheduled) {
          onShowToast('Push campaign scheduled successfully on server!');
          setActiveTab('scheduled');
        } else {
          onShowToast(`Push broadcast dispatched to ${pushReach.canReceivePush} active terminals!`);
        }
        // Reset push form
        setPushTitle('');
        setPushMessage('');
        setPushCity('');
        setPushImage('');
        setPushScheduledAt('');
        await loadData();
      } else {
        onShowToast(`Failed to dispatch push: ${res.error}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setIsSubmittingPush(false);
    }
  };

  // Reuse a past push
  const handleReusePush = (b: AppBroadcast) => {
    setPushTitle(b.title || '');
    setPushMessage(b.message || '');
    setPushAudience(b.target_audience || 'all_users');
    setPushState(b.target_state && b.target_state !== 'all' ? b.target_state : 'All States');
    setPushCity(b.target_city || '');
    setPushImage(b.image_url || '');
    setPushSendMode('now');
    setActiveTab('push');
    onShowToast(`Copied "${b.title || 'Broadcast'}" into composer.`);
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
  const handleDeleteBroadcast = async (id: string, label: string = 'item') => {
    if (confirm(`Are you sure you want to delete this ${label}?`)) {
      const ok = await deleteBroadcast(id);
      if (ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        onShowToast(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted successfully.`);
      } else {
        onShowToast(`Failed to delete ${label}.`);
      }
    }
  };

  // Open In-App Pop-up Edit Modal
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

  // Save In-App Pop-up Edit
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

  // Open Scheduled Push Edit Modal
  const openScheduledEditModal = (b: AppBroadcast) => {
    setEditingScheduled(b);
    setEditSchedTitle(b.title || '');
    setEditSchedMessage(b.message || '');
    setEditSchedAudience(b.target_audience || 'all_users');
    setEditSchedState(b.target_state && b.target_state !== 'all' ? b.target_state : 'All States');
    setEditSchedCity(b.target_city || '');
    setEditSchedTime(b.scheduled_for ? b.scheduled_for.slice(0, 16) : '');
    setEditSchedStatus((b.status as any) || 'scheduled');
  };

  // Save Scheduled Push Edit
  const handleSaveScheduledEdit = async () => {
    if (!editingScheduled) return;
    setIsSavingSchedEdit(true);
    try {
      const res = await updateBroadcast(editingScheduled.id, {
        type: 'push',
        title: editSchedTitle.trim(),
        message: editSchedMessage.trim(),
        target_audience: editSchedAudience,
        target_state: editSchedState !== 'All States' ? editSchedState : 'all',
        target_city: editSchedCity.trim() || null,
        scheduled_for: editSchedTime ? new Date(editSchedTime).toISOString() : null,
        status: editSchedStatus,
      });

      if (res.success) {
        onShowToast('Scheduled notification updated successfully!');
        setEditingScheduled(null);
        await loadData();
      } else {
        onShowToast(`Failed to update scheduled push: ${res.error}`);
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setIsSavingSchedEdit(false);
    }
  };

  // Audience Label Helper
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
    <div className="flex flex-col gap-4">
      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <div className="bg-white rounded-xl shadow-xs p-3.5 sm:p-4 border border-neutral-200/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center font-bold">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
              <h2 className="text-base font-bold text-[#101318] m-0">
                Broadcast &amp; Notification Manager
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 m-0">
              Counter365 POS modals, in-app banners &amp; automated push notification server
            </p>
          </div>
        </div>

        {/* 3 Navigation Tabs: In-App Pop-ups, Push Notifications, Scheduled Pushes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setActiveTab('popup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'popup'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>In-App Pop-ups</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('push')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'push'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Push Notifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scheduled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'scheduled'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Scheduled Pushes</span>
              {scheduledLedger.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#EA580C] text-white">
                  {scheduledLedger.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ==================== TAB 1: IN-APP POP-UPS SECTION ===================== */}
      {/* ========================================================================= */}
      {activeTab === 'popup' && (
        <div className="space-y-4">
          {/* KPI Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                  Live Pop-ups &amp; Banners
                </div>
                <div className="text-xl font-black text-[#101318] mt-0.5 font-mono">
                  {metrics.totalPopups}
                </div>
                <div className="text-[10px] text-neutral-400">Active across mobile POS</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#EA580C] flex items-center justify-center border border-orange-100">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                  Active POS Terminals
                </div>
                <div className="text-xl font-black text-[#101318] mt-0.5 font-mono">
                  {metrics.activeDevices}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {deviceTokens.android} Android • {deviceTokens.ios} iOS
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                  Screen Views
                </div>
                <div className="text-xl font-black text-emerald-600 mt-0.5 font-mono">
                  {metrics.totalViews}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>Impressions logged</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Eye className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                  Click-Through Rate
                </div>
                <div className="text-xl font-black text-[#EA580C] mt-0.5 font-mono">
                  {metrics.ctr}%
                </div>
                <div className="text-[10px] text-neutral-500">{metrics.totalClicks} CTA button taps</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Composer & Phone Simulator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: In-App Pop-up Composer (Tight, Minimized UI) */}
            <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-4 flex flex-col">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#101318]">
                    Compose In-App Pop-up
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Targeted popup or banner for Counter365 mobile &amp; POS terminals
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8F3F0] text-[#EA580C] border border-[#FED7AA]">
                  {placement === 'full_screen' ? 'Full-Screen (~75% coverage)' : 'Banner (~25% area)'}
                </span>
              </div>

              <form onSubmit={handleCreatePopup} className="space-y-3">
                {/* 1. Title (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-neutral-700">
                      Title <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-neutral-400">Headline visible on pop-up</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Counter365 Summer Fest - 20% Off on Pro Plan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-hidden"
                  />
                </div>

                {/* 2. Target Audience Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Target Audience <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
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
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                    <label className="block text-[10.5px] font-bold text-neutral-700 mb-1">
                      Select Shop / Merchant
                    </label>
                    <select
                      value={selectedShopId}
                      onChange={(e) => setSelectedShopId(e.target.value)}
                      className="w-full text-xs p-1.5 rounded-md border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Target State
                    </label>
                    <select
                      value={targetState}
                      onChange={(e) => setTargetState(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
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
                      <label className="text-[11px] font-bold text-neutral-700">Target City</label>
                      <span className="text-[10px] text-neutral-400">Optional</span>
                    </div>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="e.g. Chennai, Madurai, Coimbatore"
                        value={targetCity}
                        onChange={(e) => setTargetCity(e.target.value)}
                        className="w-full text-xs pl-7 pr-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Placement & Display Type Dropdowns (Converted to clean select dropdowns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Placement
                    </label>
                    <select
                      value={placement}
                      onChange={(e: any) => setPlacement(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white font-medium"
                    >
                      <option value="full_screen">Full-screen popup (~75% screen)</option>
                      <option value="banner">Banner (~25% area)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Display Type
                    </label>
                    <select
                      value={displayType}
                      onChange={(e: any) => {
                        setDisplayType(e.target.value);
                        if (e.target.value === 'single' && images.length > 1) {
                          setImages([images[0]]);
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white font-medium"
                    >
                      <option value="single">Single Image</option>
                      <option value="carousel">Carousel Multi-image</option>
                    </select>
                  </div>
                </div>

                {/* 5. Images: Choose File / Drag & Drop */}
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Popup Graphic Images</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {images.length === 0
                        ? 'No file chosen'
                        : `${images.length} file${images.length > 1 ? 's' : ''} chosen`}
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
                    className={`p-2.5 rounded-lg border-2 border-dashed transition-all flex items-center justify-between gap-2 bg-white ${
                      isDraggingOver
                        ? 'border-[#EA580C] bg-orange-50/50'
                        : 'border-neutral-300 hover:border-[#EA580C]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer border border-neutral-200 shadow-2xs"
                      >
                        Choose File
                      </button>
                      <span className="text-xs text-neutral-500">
                        {images.length === 0 ? 'No file chosen' : `${images.length} image(s) loaded`}
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono">
                      {displayType === 'carousel' ? 'Multiple files allowed' : 'Single PNG / JPG'}
                    </span>
                  </div>

                  {/* Uploaded Thumbnails Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveSlideIndex(idx)}
                          className={`relative rounded-md overflow-hidden border-2 aspect-video bg-neutral-900 group cursor-pointer ${
                            activeSlideIndex === idx
                              ? 'border-[#EA580C] ring-2 ring-[#EA580C]/20'
                              : 'border-neutral-200'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/70 text-white text-[8px] font-mono">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImageAt(idx);
                            }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 cursor-pointer shadow-xs"
                            title="Remove image"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {displayType === 'carousel' && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-md border border-dashed border-neutral-300 hover:border-[#EA580C] aspect-video flex flex-col items-center justify-center text-neutral-400 hover:text-[#EA580C] text-[9px] font-bold cursor-pointer bg-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Two Checkboxes: Skip/Dismiss & Active */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50/80 rounded-lg border border-neutral-200">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={canSkipDismiss}
                      onChange={(e) => setCanSkipDismiss(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#EA580C] rounded border-neutral-300 focus:ring-[#EA580C] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-neutral-800">
                      User can skip or dismiss
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#EA580C] rounded border-neutral-300 focus:ring-[#EA580C] cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-neutral-900 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-emerald-500' : 'bg-neutral-300'
                        }`}
                      />
                      <span>Active status</span>
                    </span>
                  </label>
                </div>

                {/* 7. Start Date & End Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                      Start Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                      End Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white"
                    />
                  </div>
                </div>

                {/* Optional CTA Button & Deep Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                      CTA Button Label <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Upgrade to Pro"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                      Action Deep Link <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="counter365://upgrade"
                      value={actionDeepLink}
                      onChange={(e) => setActionDeepLink(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white focus:border-[#EA580C] focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* Submit Create Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingPopup || isUploadingImage}
                    className="w-full py-2.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingPopup ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Create &amp; Publish In-App Pop-up</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Live Mobile Terminal Simulator (Exact 75% Coverage & Equal Margins) */}
            <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                    Live Mobile Simulator
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {placement === 'full_screen' ? 'Full-screen (~75% screen)' : 'Banner (~25% area)'}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#EA580C] uppercase tracking-wider font-mono">
                  {displayType === 'carousel' ? `Carousel (${images.length} slides)` : 'Single Image'}
                </span>
              </div>

              {/* Smartphone Frame */}
              <div className="w-[280px] sm:w-[310px] h-[540px] bg-[#181311] rounded-[36px] p-2.5 shadow-2xl border-4 border-neutral-800 relative flex flex-col overflow-hidden">
                {/* Top Speaker / Dynamic Island */}
                <div className="w-full flex justify-center pb-1.5 pt-0.5 z-20">
                  <div className="w-20 h-3.5 bg-black rounded-full flex items-center justify-between px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                    <span className="w-1 h-1 rounded-full bg-blue-500/80" />
                  </div>
                </div>

                {/* Screen Inner Canvas */}
                <div className="w-full flex-1 bg-[#F8F3F0] rounded-[24px] overflow-hidden relative flex flex-col font-sans select-none border border-neutral-200/40">
                  {/* POS Topbar */}
                  <div className="bg-[#181311] text-white px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#EA580C] flex items-center justify-center text-[9px] font-black">
                        C
                      </div>
                      <span className="text-[10.5px] font-bold tracking-tight">Counter365 POS</span>
                    </div>
                    <div className="text-[9px] font-mono text-stone-300">Cart (₹0.00)</div>
                  </div>

                  {/* 1. Placement: Property List Banner Mode (~25% area) */}
                  {placement === 'banner' && (
                    <div className="m-2 bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden relative z-10">
                      {canSkipDismiss && (
                        <button
                          type="button"
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center z-20 cursor-pointer shadow-xs"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {images.length > 0 ? (
                        <div className="w-full h-20 bg-neutral-900 relative">
                          <img
                            src={images[activeSlideIndex] || images[0]}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-18 bg-gradient-to-r from-[#181311] to-[#EA580C] flex items-center justify-center text-white text-[10px] font-bold">
                          Banner Preview (Upload image)
                        </div>
                      )}

                      {title && (
                        <div className="p-1.5 text-left">
                          <div className="text-[10px] font-bold text-neutral-900 line-clamp-1">{title}</div>
                          {actionLabel && (
                            <div className="text-[9px] text-[#EA580C] font-semibold mt-0.5">
                              {actionLabel} &rarr;
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* POS Terminal Background Mock Content */}
                  <div className="flex-1 p-2.5 flex flex-col justify-between opacity-35 pointer-events-none">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-2xs">
                        <div className="text-[9px] text-neutral-400 uppercase font-mono">Today Sales</div>
                        <div className="text-xs font-bold text-neutral-900 font-mono">₹4,250.00</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-2xs">
                        <div className="text-[9px] text-neutral-400 uppercase font-mono">Total Bills</div>
                        <div className="text-xs font-bold text-neutral-900 font-mono">18 orders</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-2 bg-neutral-300 rounded w-3/4"></div>
                      <div className="h-2 bg-neutral-300 rounded w-1/2"></div>
                      <div className="h-2 bg-neutral-300 rounded w-5/6"></div>
                    </div>

                    <div className="h-7 bg-[#EA580C]/20 border border-[#EA580C]/30 rounded-lg flex items-center justify-center text-[10px] text-neutral-800 font-bold">
                      + Add New Bill (F1)
                    </div>
                  </div>

                  {/* 2. Placement: Full-Screen Popup Modal Mode (~75% Coverage with EQUAL 4-SIDE MARGINS) */}
                  {placement === 'full_screen' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-30">
                      {/* Centered Modal: Occupies ~75% of screen height and width with equal margins */}
                      <div className="w-[84%] max-h-[75%] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col relative animate-scale-in">
                        {/* Skip/Dismiss X button */}
                        {canSkipDismiss && (
                          <button
                            type="button"
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center z-30 backdrop-blur-md cursor-pointer transition-transform active:scale-95 shadow-md"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Popup Image / Carousel Container (takes ~60% of modal) */}
                        <div className="w-full h-36 bg-neutral-900 relative overflow-hidden shrink-0">
                          {images.length > 0 ? (
                            <img
                              src={images[activeSlideIndex] || images[0]}
                              alt="Popup Graphic"
                              className="w-full h-full object-cover object-center"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-[#181311] via-[#2A1E1A] to-[#EA580C] flex flex-col items-center justify-center text-white gap-1">
                              <Sparkles className="w-6 h-6 text-[#EA580C]" />
                              <span className="text-[10px] text-stone-300">Choose image file</span>
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
                                className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer shadow-xs"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveSlideIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                                }
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer shadow-xs"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>

                              {/* Carousel Dots */}
                              <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                                {images.map((_, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 h-1 rounded-full transition-all ${
                                      activeSlideIndex === i ? 'bg-white w-2.5' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Modal Bottom Content: Title & CTA button */}
                        <div className="p-2.5 text-center flex flex-col items-center overflow-y-auto">
                          {targetState !== 'All States' && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-orange-100 text-[#EA580C] uppercase mb-1">
                              {targetState}
                            </div>
                          )}

                          {title ? (
                            <h4 className="text-[11.5px] font-bold text-neutral-900 leading-tight">
                              {title}
                            </h4>
                          ) : (
                            <div className="text-[10.5px] text-neutral-400 italic">Counter365 Special Announcement</div>
                          )}

                          {actionLabel && (
                            <button
                              type="button"
                              className="w-full mt-2 py-1.5 px-2.5 bg-[#EA580C] text-white text-[10px] font-bold rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer"
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
                <div className="w-full flex justify-center pt-1.5">
                  <div className="w-24 h-1 bg-neutral-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* ==================== POP-UP LIST TABLE ==================== */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200/80 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-100 flex-wrap gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
                  In-App Pop-up &amp; Banner Campaigns Ledger
                </div>
                <div className="text-[11px] text-neutral-400">
                  Directory of configured pop-ups, impressions &amp; active status
                </div>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {popupLedger.length} active campaigns
              </span>
            </div>

            <div className="overflow-x-auto">
              {popupLedger.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No pop-ups or banners created yet. Use the composer above to publish one!
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-[10.5px] font-mono font-bold text-neutral-600 uppercase">
                      <th className="py-2 px-2.5">Title</th>
                      <th className="py-2 px-2.5">Audience</th>
                      <th className="py-2 px-2.5">Placement</th>
                      <th className="py-2 px-2.5">Type</th>
                      <th className="py-2 px-2.5">Frequency</th>
                      <th className="py-2 px-2.5 text-center">Images</th>
                      <th className="py-2 px-2.5 text-center">Views</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                      <th className="py-2 px-2.5">Schedule</th>
                      <th className="py-2 px-2.5">Created</th>
                      <th className="py-2 px-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {popupLedger.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                        {/* Title */}
                        <td className="py-2.5 px-2.5">
                          <div className="font-bold text-neutral-900">
                            {b.title || <span className="text-neutral-400 italic">(Untitled Pop-up)</span>}
                          </div>
                          {b.action_label && (
                            <div className="text-[10px] text-[#EA580C] font-mono mt-0.5 truncate max-w-[180px]">
                              CTA: {b.action_label} &rarr; {b.action_deep_link || 'N/A'}
                            </div>
                          )}
                        </td>

                        {/* Audience */}
                        <td className="py-2.5 px-2.5">
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
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

                        {/* Placement */}
                        <td className="py-2.5 px-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase ${
                              b.placement === 'banner'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {b.placement === 'banner' ? 'Banner' : 'Full-screen'}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-2.5 px-2.5 text-[11px] text-neutral-700">
                          {b.display_type === 'carousel' ? 'Carousel Multi' : 'Single Image'}
                        </td>

                        {/* Frequency */}
                        <td className="py-2.5 px-2.5 text-[10.5px] font-mono text-neutral-600">
                          {b.frequency || (b.max_impressions === 1 ? 'Once per user' : 'Every session')}
                        </td>

                        {/* Images */}
                        <td className="py-2.5 px-2.5 text-center">
                          {b.images && b.images.length > 0 ? (
                            <div className="flex items-center justify-center -space-x-1.5">
                              {b.images.slice(0, 3).map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt="Thumbnail"
                                  className="w-6 h-6 rounded-md object-cover border border-white shadow-2xs"
                                />
                              ))}
                              {b.images.length > 3 && (
                                <span className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-700 text-[9px] font-bold flex items-center justify-center border border-white">
                                  +{b.images.length - 3}
                                </span>
                              )}
                            </div>
                          ) : b.image_url ? (
                            <img
                              src={b.image_url}
                              alt="Thumbnail"
                              className="w-6 h-6 rounded-md object-cover mx-auto border border-neutral-200 shadow-2xs"
                            />
                          ) : (
                            <span className="text-neutral-400 text-[10px]">&mdash;</span>
                          )}
                        </td>

                        {/* Views */}
                        <td className="py-2.5 px-2.5 text-center font-mono font-bold text-neutral-800">
                          {b.interactions_count?.viewed || 0}
                        </td>

                        {/* Status (ON/OFF switch) */}
                        <td className="py-2.5 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(b)}
                            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              b.is_active ? 'bg-[#EA580C]' : 'bg-neutral-300'
                            }`}
                            title={b.is_active ? 'Click to turn OFF' : 'Click to turn ON'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                b.is_active ? 'translate-x-3.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <div className="text-[8.5px] font-mono text-neutral-500 uppercase mt-0.5">
                            {b.is_active ? 'Active' : 'Off'}
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="py-2.5 px-2.5 text-[10px] font-mono text-neutral-600">
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

                        {/* Created */}
                        <td className="py-2.5 px-2.5 text-[10px] font-mono text-neutral-400">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(b)}
                              className="p-1 rounded text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Edit Pop-up"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBroadcast(b.id, 'pop-up')}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 2: PUSH NOTIFICATIONS SECTION ================== */}
      {/* ========================================================================= */}
      {activeTab === 'push' && (
        <div className="space-y-4">
          {/* Top Row: Slider Toggle (Send Now vs Scheduled) + Push Reach Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left: Dispatch Slider Control */}
            <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono mb-2">
                  Dispatch Delivery Mode
                </div>

                {/* Slider Toggle */}
                <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setPushSendMode('now')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      pushSendMode === 'now'
                        ? 'bg-white text-[#EA580C] shadow-xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Send Immediately</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPushSendMode('scheduled')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      pushSendMode === 'scheduled'
                        ? 'bg-[#181311] text-white shadow-xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Schedule for Later</span>
                  </button>
                </div>
              </div>

              {/* Subtext info */}
              <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-start gap-1.5 text-[10.5px] text-neutral-500">
                <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  {pushSendMode === 'now'
                    ? 'Dispatches to active FCM device push tokens across Counter365 instantly.'
                    : 'Scheduled messages deliver on the server automatically — no need to keep this page open.'}
                </span>
              </div>
            </div>

            {/* Right: Push Reach Container (Showing Counter365 registered members) */}
            <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-neutral-200/80 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-neutral-900">
                      Counter365 Push Reach &amp; Device Coverage
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    {pushReach.reachPercent}% Reachable
                  </span>
                </div>

                {/* 3 Metric Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/60">
                    <div className="text-[10px] font-semibold text-neutral-500 font-mono">
                      Registered Shops
                    </div>
                    <div className="text-lg font-black text-neutral-900 font-mono mt-0.5">
                      {pushReach.totalRegisteredMembers}
                    </div>
                    <div className="text-[9.5px] text-neutral-400">Active accounts</div>
                  </div>

                  <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                    <div className="text-[10px] font-semibold text-emerald-800 font-mono">
                      Can Receive Push
                    </div>
                    <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                      {pushReach.canReceivePush}
                    </div>
                    <div className="text-[9.5px] text-emerald-600">
                      {pushReach.android} Android • {pushReach.ios} iOS
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/60">
                    <div className="text-[10px] font-semibold text-neutral-500 font-mono">
                      Pending Token
                    </div>
                    <div className="text-lg font-black text-neutral-600 font-mono mt-0.5">
                      {pushReach.notReceivedPush}
                    </div>
                    <div className="text-[9.5px] text-neutral-400">Offline / no token</div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 pt-2 border-t border-neutral-100">
                <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#EA580C] h-full rounded-full transition-all duration-500"
                    style={{ width: `${pushReach.reachPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compose Push Broadcast Form (Tight, Minimized UI) */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200/80 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#101318]">
                  Compose Push Broadcast
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Send notification directly to mobile POS trays and lockscreens
                </p>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                FCM / APNs Direct Gateway
              </span>
            </div>

            <form onSubmit={handleSendPush} className="space-y-3">
              {/* 1. Campaign Title (Required) */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Update: Tax Invoice Rule 2026 Live"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-hidden"
                />
              </div>

              {/* 2. Notification Message (Required) */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Your monthly business analytics and GST breakdown reports are ready for download."
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-hidden resize-none"
                />
              </div>

              {/* 3. Target Audience & Shop selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Audience Filter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pushAudience}
                    onChange={(e) => setPushAudience(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden bg-white"
                  >
                    <option value="all_users">All Users ({pushReach.totalRegisteredMembers} registered shops)</option>
                    <option value="active_7d">Active users in the last 7 days</option>
                    <option value="no_orders">No orders yet</option>
                    <option value="has_orders">Has created orders</option>
                    <option value="active_today">Active today</option>
                    <option value="individual_user">Individual user (Choose specific shop)...</option>
                  </select>
                </div>

                {pushAudience === 'individual_user' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Target Specific Shop
                    </label>
                    <select
                      value={pushSelectedShopId}
                      onChange={(e) => setPushSelectedShopId(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                    >
                      {shops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city || 'Tamil Nadu'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Target State
                    </label>
                    <select
                      value={pushState}
                      onChange={(e) => setPushState(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 4. City & Optional Image URL/Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-neutral-700">Target City</label>
                    <span className="text-[10px] text-neutral-400">Optional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Coimbatore, Madurai"
                    value={pushCity}
                    onChange={(e) => setPushCity(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-neutral-700">
                      Notification Icon / Graphic <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    {pushImage && (
                      <button
                        type="button"
                        onClick={() => setPushImage('')}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={pushFileInputRef}
                      onChange={(e) => handlePushImageUpload(e.target.files)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => pushFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer border border-neutral-200 shrink-0"
                    >
                      Upload Image
                    </button>
                    <input
                      type="text"
                      placeholder="Or paste graphic URL..."
                      value={pushImage}
                      onChange={(e) => setPushImage(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Schedule Date & Time Picker (Visible only if pushSendMode === 'scheduled') */}
              {pushSendMode === 'scheduled' && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Server Delivery Date &amp; Time</span>
                  </div>
                  <p className="text-[10.5px] text-amber-800">
                    Select the exact wall-clock time when Counter365 server should trigger this campaign.
                  </p>
                  <input
                    type="datetime-local"
                    required={pushSendMode === 'scheduled'}
                    value={pushScheduledAt}
                    onChange={(e) => setPushScheduledAt(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white font-mono"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingPush}
                  className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                    pushSendMode === 'scheduled'
                      ? 'bg-[#181311] hover:bg-neutral-900'
                      : 'bg-[#EA580C] hover:bg-[#C2410C]'
                  }`}
                >
                  {isSubmittingPush ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : pushSendMode === 'scheduled' ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Schedule Push Broadcast</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Push Broadcast Now ({pushReach.canReceivePush} Devices)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ==================== NOTIFICATION HISTORY TABLE ==================== */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200/80 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-100 flex-wrap gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
                  Push Notification History
                </div>
                <div className="text-[11px] text-neutral-400">
                  Recent instant notifications dispatched to shop terminals
                </div>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {pushHistoryLedger.length} sent notifications
              </span>
            </div>

            <div className="overflow-x-auto">
              {pushHistoryLedger.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No push notifications sent yet. Use the composer above to broadcast to merchants!
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-[10.5px] font-mono font-bold text-neutral-600 uppercase">
                      <th className="py-2 px-2.5">Title &amp; Message</th>
                      <th className="py-2 px-2.5">Audience</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                      <th className="py-2 px-2.5 text-center">Delivery</th>
                      <th className="py-2 px-2.5">Sent / Created</th>
                      <th className="py-2 px-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {pushHistoryLedger.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                        {/* Title & Message */}
                        <td className="py-2.5 px-2.5 max-w-[280px]">
                          <div className="font-bold text-neutral-900 truncate">{b.title}</div>
                          <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {b.message}
                          </div>
                        </td>

                        {/* Audience */}
                        <td className="py-2.5 px-2.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                            <Users className="w-2.5 h-2.5 text-neutral-500" />
                            <span>{getAudienceDisplay(b.target_audience)}</span>
                          </span>
                          {b.target_state && b.target_state !== 'all' && (
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              {b.target_state}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Sent</span>
                          </span>
                        </td>

                        {/* Delivery */}
                        <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-neutral-800">
                          {pushReach.canReceivePush} delivered
                        </td>

                        {/* Created / Sent */}
                        <td className="py-2.5 px-2.5 text-[10px] font-mono text-neutral-500">
                          {b.sent_at
                            ? new Date(b.sent_at).toLocaleString()
                            : new Date(b.created_at).toLocaleString()}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleReusePush(b)}
                              className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10.5px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Reuse this notification"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Reuse</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBroadcast(b.id, 'notification')}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete record"
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
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 3: SCHEDULED PUSHES SECTION =================== */}
      {/* ========================================================================= */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          {/* Server Delivery Banner Notice */}
          <div className="bg-[#181311] text-white rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EA580C] text-white flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Server-Side Scheduled Push Engine</div>
                <div className="text-[11px] text-stone-300">
                  Scheduled notifications deliver automatically on the server — no need to keep your browser open.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPushSendMode('scheduled');
                setActiveTab('push');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Push</span>
            </button>
          </div>

          {/* Scheduled Pushes Ledger & Filters */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200/80 p-4 flex flex-col">
            {/* Top Filters: Status Filter + Date Filter */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 flex-wrap gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Filter by:</span>
                </span>

                {/* Status Filter */}
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setScheduledStatusFilter('all')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      scheduledStatusFilter === 'all'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    All Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduledStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      scheduledStatusFilter === 'pending'
                        ? 'bg-white text-amber-700 shadow-2xs'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduledStatusFilter('sending')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      scheduledStatusFilter === 'sending'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    Sending
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduledStatusFilter('sent')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      scheduledStatusFilter === 'sent'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    Sent
                  </button>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-500">Date:</span>
                  <input
                    type="date"
                    value={scheduledDateFilter}
                    onChange={(e) => setScheduledDateFilter(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-neutral-200 bg-white"
                  />
                  {scheduledDateFilter && (
                    <button
                      type="button"
                      onClick={() => setScheduledDateFilter('')}
                      className="text-[10px] text-neutral-500 hover:text-black underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs font-mono text-neutral-500">
                {scheduledLedger.length} queued messages
              </div>
            </div>

            {/* Scheduled Table: ID, Scheduled At, Status, Title, Audience, Send Or Failed, Created By, Actions */}
            <div className="overflow-x-auto">
              {scheduledLedger.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  No scheduled pushes found matching filters. Click &quot;Schedule New Push&quot; to queue one!
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-[10.5px] font-mono font-bold text-neutral-600 uppercase">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Scheduled At</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Audience</th>
                      <th className="py-2.5 px-3 text-center">Send Or Failed</th>
                      <th className="py-2.5 px-3">Created By</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {scheduledLedger.map((b) => {
                      const isPast = b.scheduled_for && new Date(b.scheduled_for) < new Date();
                      return (
                        <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                          {/* ID */}
                          <td className="py-2.5 px-3 font-mono font-bold text-neutral-700">
                            #SCH-{b.id.slice(0, 6).toUpperCase()}
                          </td>

                          {/* Scheduled At */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-900">
                            <div className="font-bold">
                              {b.scheduled_for
                                ? new Date(b.scheduled_for).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }) +
                                  ', ' +
                                  new Date(b.scheduled_for).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Immediate'}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              {isPast ? 'Triggered / Due' : 'Upcoming Server Queue'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-center">
                            {b.status === 'scheduled' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Pending</span>
                              </span>
                            ) : b.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Sent</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-100 text-blue-800">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                <span>Sending</span>
                              </span>
                            )}
                          </td>

                          {/* Title */}
                          <td className="py-2.5 px-3 max-w-[220px]">
                            <div className="font-bold text-neutral-900 truncate">{b.title}</div>
                            {b.message && (
                              <div className="text-[10.5px] text-neutral-500 truncate mt-0.5">
                                {b.message}
                              </div>
                            )}
                          </td>

                          {/* Audience */}
                          <td className="py-2.5 px-3">
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                              <Users className="w-2.5 h-2.5 text-neutral-500" />
                              <span>{getAudienceDisplay(b.target_audience)}</span>
                            </div>
                            {b.target_state && b.target_state !== 'all' && (
                              <div className="text-[10px] text-neutral-500 mt-0.5">
                                {b.target_state}
                              </div>
                            )}
                          </td>

                          {/* Send Or Failed */}
                          <td className="py-2.5 px-3 text-center font-mono text-[10.5px]">
                            {b.status === 'sent' ? (
                              <span className="text-emerald-700 font-bold">
                                {pushReach.canReceivePush} Sent / 0 Failed
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                0 / {pushReach.canReceivePush} Sent
                              </span>
                            )}
                          </td>

                          {/* Created By */}
                          <td className="py-2.5 px-3 text-[11px] text-neutral-600 font-medium">
                            {b.created_by || 'Super Admin'}
                          </td>

                          {/* Actions: Edit and Delete */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openScheduledEditModal(b)}
                                className="p-1 rounded text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                                title="Edit Scheduled Push"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBroadcast(b.id, 'scheduled push')}
                                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Scheduled Push"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT IN-APP POPUP MODAL ==================== */}
      {editingBroadcast && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
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

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Audience</label>
                  <select
                    value={editAudience}
                    onChange={(e) => setEditAudience(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
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
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">State</label>
                  <select
                    value={editTargetState}
                    onChange={(e) => setEditTargetState(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Placement</label>
                  <select
                    value={editPlacement}
                    onChange={(e: any) => setEditPlacement(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value="full_screen">Full-screen popup</option>
                    <option value="banner">Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Display Type</label>
                  <select
                    value={editDisplayType}
                    onChange={(e: any) => setEditDisplayType(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value="single">Single Image</option>
                    <option value="carousel">Carousel Multi-image</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-neutral-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCanSkip}
                    onChange={(e) => setEditCanSkip(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#EA580C] rounded"
                  />
                  <span className="text-xs font-medium text-neutral-800">User can skip or dismiss</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#EA580C] rounded"
                  />
                  <span className="text-xs font-bold text-neutral-900">Active Status</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">CTA Label</label>
                  <input
                    type="text"
                    value={editActionLabel}
                    onChange={(e) => setEditActionLabel(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Deep Link</label>
                  <input
                    type="text"
                    value={editActionDeepLink}
                    onChange={(e) => setEditActionDeepLink(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-end gap-2 bg-neutral-50/50">
              <button
                type="button"
                onClick={() => setEditingBroadcast(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT SCHEDULED PUSH MODAL ==================== */}
      {editingScheduled && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#EA580C]" />
                <span>Edit Scheduled Push Notification</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingScheduled(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Scheduled Delivery Time
                </label>
                <input
                  type="datetime-local"
                  value={editSchedTime}
                  onChange={(e) => setEditSchedTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={editSchedTitle}
                  onChange={(e) => setEditSchedTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Message Body</label>
                <textarea
                  rows={2}
                  value={editSchedMessage}
                  onChange={(e) => setEditSchedMessage(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 focus:border-[#EA580C] focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Audience</label>
                  <select
                    value={editSchedAudience}
                    onChange={(e) => setEditSchedAudience(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
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
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">State Target</label>
                  <select
                    value={editSchedState}
                    onChange={(e) => setEditSchedState(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Queue Status</label>
                <select
                  value={editSchedStatus}
                  onChange={(e: any) => setEditSchedStatus(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-white"
                >
                  <option value="scheduled">Scheduled (Pending delivery)</option>
                  <option value="sent">Sent (Completed)</option>
                  <option value="draft">Draft (Paused)</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-end gap-2 bg-neutral-50/50">
              <button
                type="button"
                onClick={() => setEditingScheduled(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveScheduledEdit}
                disabled={isSavingSchedEdit}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavingSchedEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
