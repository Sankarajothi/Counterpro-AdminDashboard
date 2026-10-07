'use client';

import React, { useState } from 'react';
import { Shop, Subscription } from '../../types/database';
import { MessageSquare, Phone, Send, Sparkles, Search, Store, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';

interface SupportOutreachViewProps {
  shops: Shop[];
  subscriptions: Subscription[];
  onShowToast: (msg: string) => void;
}

export function SupportOutreachView({
  shops,
  subscriptions,
  onShowToast,
}: SupportOutreachViewProps) {
  const [search, setSearch] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(shops[0] || null);
  const [templateType, setTemplateType] = useState<'welcome' | 'renewal' | 'printer' | 'tips'>('welcome');
  const [customText, setCustomText] = useState('');

  const templates = {
    welcome: (shopName: string) =>
      `Hello ${shopName}! Welcome to Counter365. We are here to support your retail counter operations. Let us know if you need any assistance setting up your menu catalog or thermal bill printer.`,
    renewal: (shopName: string) =>
      `Hello ${shopName}! This is Counter365 Support. Your subscription period is up for renewal soon. Please connect with us to keep enjoying seamless uninterrupted cloud billing and backups.`,
    printer: (shopName: string) =>
      `Hello ${shopName}! Regarding your 58mm/80mm ESC/POS thermal printer setup with Counter365: Our engineering team can help pair your wireless Bluetooth printer instantly.`,
    tips: (shopName: string) =>
      `Hello ${shopName}! Tip from Counter365: You can track daily expense records and pending customer credit directly from your counter terminal to simplify your daily closing reports.`,
  };

  const currentMessage = customText || (selectedShop ? templates[templateType](selectedShop.name) : '');

  const handleSendWhatsApp = () => {
    if (!selectedShop) return;
    const cleanPhone = selectedShop.phone?.replace(/[^0-9]/g, '') || '';
    if (!cleanPhone) {
      onShowToast('Selected shop does not have a valid phone number recorded.');
      return;
    }
    const encoded = encodeURIComponent(currentMessage);
    window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
    onShowToast(`Opened WhatsApp chat for ${selectedShop.name}`);
  };

  const handleDirectCall = () => {
    if (!selectedShop) return;
    const cleanPhone = selectedShop.phone?.replace(/[^0-9]/g, '') || '';
    if (!cleanPhone) {
      onShowToast('Selected shop does not have a valid phone number recorded.');
      return;
    }
    window.location.href = `tel:+91${cleanPhone}`;
    onShowToast(`Calling +91 ${cleanPhone}`);
  };

  const filteredShops = shops.filter((s) => {
    const q = search.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Top Banner */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_20px] border border-[var(--color-divider)] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-[16px] font-bold text-[#101318] m-0">
              Customer Support & WhatsApp Outreach Center
            </h3>
          </div>
          <p className="text-xs text-gray-500 m-0 mt-0.5">
            Direct real-time merchant engagement, proactive onboarding assistance, and subscription renewal communications.
          </p>
        </div>
      </div>

      {/* Main Dual-Column Workspace */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Column: Shop Directory (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-[8px] shadow-sm p-4 border border-[var(--color-divider)] flex flex-col h-[600px]">
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search shop by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-[var(--color-divider)] bg-[#FAFAFB] focus:bg-white focus:border-[#FD5E03] outline-none"
            />
          </div>

          <div className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
            Registered Merchants ({filteredShops.length})
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredShops.map((shop) => {
              const isSelected = selectedShop?.id === shop.id;
              const sub = subscriptions.find((s) => s.shop_id === shop.id);
              return (
                <div
                  key={shop.id}
                  onClick={() => {
                    setSelectedShop(shop);
                    setCustomText('');
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#FD5E03] bg-[#FFF7ED] shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-gray-900 truncate">
                      {shop.name}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <span>{shop.city || 'India'}</span>
                      <span>&bull;</span>
                      <span className="font-mono">+91 {shop.phone}</span>
                    </div>
                  </div>

                  <span
                    className={`tag text-[10px] uppercase font-bold shrink-0 ${
                      sub?.plan === 'pro'
                        ? 'bg-[#FD5E03] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sub?.plan || 'TRIAL'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Message Composer & Quick Trigger (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-[8px] shadow-sm p-5 border border-[var(--color-divider)] flex flex-col justify-between h-[600px]">
          {selectedShop ? (
            <div className="flex flex-col h-full">
              {/* Selected Shop Header */}
              <div className="pb-4 border-b border-[var(--color-divider)] flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#FD5E03]">
                    Active Merchant
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 m-0">
                    {selectedShop.name}
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Phone: <span className="font-mono font-medium text-gray-800">+91 {selectedShop.phone}</span> &bull; Category: {selectedShop.shop_type || 'Retail'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDirectCall}
                    className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Call Owner</span>
                  </button>
                </div>
              </div>

              {/* Template Selectors */}
              <div className="my-3">
                <div className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#FD5E03]" />
                  <span>Choose Template:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'welcome', label: 'Welcome Onboard' },
                    { id: 'renewal', label: 'Subscription Renewal' },
                    { id: 'printer', label: 'Printer Setup' },
                    { id: 'tips', label: 'Daily Best Practices' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setTemplateType(tpl.id as any);
                        setCustomText('');
                      }}
                      className={`text-xs p-2 rounded-md border font-medium transition-all text-center ${
                        templateType === tpl.id && !customText
                          ? 'bg-[#101318] text-white border-[#101318]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer Box */}
              <div className="flex-1 flex flex-col mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-1">
                  Message Preview / Custom Reply Text:
                </label>
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={6}
                  className="w-full flex-1 p-3 text-xs rounded-md border border-[var(--color-divider)] bg-[#FAFAFB] focus:bg-white focus:border-[#FD5E03] outline-none resize-none leading-relaxed text-gray-800"
                  placeholder="Type a customized message for this merchant..."
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendWhatsApp}
                className="w-full btn btn-primary text-xs min-h-[42px] gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-lg shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Chat & Send Message</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              Select a shop from the directory to compose an outreach message.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
