'use client';

import React, { useState } from 'react';
import { Shop } from '../../types/database';
import { Printer, Bluetooth, Smartphone, Wifi, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Server } from 'lucide-react';

interface HardwareTelemetryViewProps {
  shops: Shop[];
  onShowToast: (msg: string) => void;
}

export function HardwareTelemetryView({ shops, onShowToast }: HardwareTelemetryViewProps) {
  const [filter, setFilter] = useState<'All' | 'PrinterEnabled' | 'PrinterDisabled'>('All');

  const printerEnabledShops = shops.filter((s) => s.printer_enabled);
  const backupEnabledShops = shops.filter((s) => s.daily_backup_enabled);
  const roundOffShops = shops.filter((s) => s.round_off_enabled);

  const filteredShops = shops.filter((s) => {
    if (filter === 'PrinterEnabled') return s.printer_enabled;
    if (filter === 'PrinterDisabled') return !s.printer_enabled;
    return true;
  });

  return (
    <div className="flex flex-col gap-[18px]">
      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px]">
        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">PRINTER EQUIPPED SHOPS</div>
          <div className="font-heading text-[28px] font-bold leading-none text-[#FD5E03]">
            {printerEnabledShops.length}
          </div>
          <div className="text-[11px] text-black/50">
            {shops.length > 0 ? Math.round((printerEnabledShops.length / shops.length) * 100) : 0}% of retail stores
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">BLUETOOTH ESC/POS PROTOCOL</div>
          <div className="font-heading text-[28px] font-bold leading-none text-emerald-600">
            58mm / 80mm
          </div>
          <div className="text-[11px] text-black/50">wireless receipt hardware supported</div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">CLOUD BACKUP ENABLED</div>
          <div className="font-heading text-[28px] font-bold leading-none text-blue-600">
            {backupEnabledShops.length}
          </div>
          <div className="text-[11px] text-black/50">daily transaction snapshot active</div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">AUTO ROUND-OFF ENABLED</div>
          <div className="font-heading text-[28px] font-bold leading-none text-purple-600">
            {roundOffShops.length}
          </div>
          <div className="text-[11px] text-black/50">cash transaction auto rounding</div>
        </div>
      </div>

      {/* Hardware Architecture Architecture Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[8px] p-4 border border-[var(--color-divider)] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bluetooth className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-[14px] text-gray-900 m-0">Thermal ESC/POS Link</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed m-0">
            High-speed direct Bluetooth pairing with 58mm/80mm ESC/POS thermal printers. Supports standard baud rates, bitmap graphics for shop logos, and paper-cut signals.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>BLUETOOTH_CONNECT & SCAN Verified</span>
          </div>
        </div>

        <div className="bg-white rounded-[8px] p-4 border border-[var(--color-divider)] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-[14px] text-gray-900 m-0">Offline Sync Queue</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed m-0">
            Zero-downtime offline counter billing. Orders and inventory sales are queued in local SQLite storage when network connection drops, and flushed to Supabase upon recovery.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Background Sync Workers Active</span>
          </div>
        </div>

        <div className="bg-white rounded-[8px] p-4 border border-[var(--color-divider)] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-[14px] text-gray-900 m-0">Device Telemetry</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed m-0">
            Multi-platform client compatibility across Android POS billing devices (Sunmi, iMin), consumer Android tablets/smartphones, and iOS counter terminals.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-purple-600 font-semibold">
            <Server className="w-3.5 h-3.5" />
            <span>Production Build v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Main Hardware Configuration Table Card */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_16px_10px] border border-[var(--color-divider)]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--color-divider)] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Filter Status:</span>
            {(['All', 'PrinterEnabled', 'PrinterDisabled'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                  filter === mode
                    ? 'bg-[#101318] text-white border-[#101318]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {mode === 'All' ? 'All Shops' : mode === 'PrinterEnabled' ? 'Printer Configured' : 'No Printer'}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 font-medium">
            Showing {filteredShops.length} of {shops.length} hardware profiles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Category</th>
                <th>City / Region</th>
                <th>Thermal Printer Status</th>
                <th>Configured Printer Name</th>
                <th>Daily Backup</th>
                <th>Cash Round-Off</th>
                <th className="text-right">GST Enabled</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((s) => (
                <tr key={s.id} className="hover:bg-[#FAFAFB]">
                  <td className="font-semibold text-gray-900">{s.name}</td>
                  <td><span className="tag bg-gray-100 text-gray-700">{s.shop_type || 'Retail'}</span></td>
                  <td className="text-gray-600">{s.city || 'India'}</td>
                  <td>
                    {s.printer_enabled ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                        <Printer className="w-3.5 h-3.5" />
                        Enabled
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        Not Configured
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-xs text-gray-700">
                    {s.printer_name || (s.printer_enabled ? 'Default 58mm Thermal' : '—')}
                  </td>
                  <td>
                    {s.daily_backup_enabled ? (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Disabled</span>
                    )}
                  </td>
                  <td>
                    {s.round_off_enabled ? (
                      <span className="text-xs text-blue-600 font-medium">Yes (₹1 round)</span>
                    ) : (
                      <span className="text-xs text-gray-400">Exact decimals</span>
                    )}
                  </td>
                  <td className="text-right">
                    {s.gst_enabled ? (
                      <span className="tag bg-purple-50 text-purple-700 font-semibold">
                        {s.gst_rate || 5}% GST
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Exempt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
