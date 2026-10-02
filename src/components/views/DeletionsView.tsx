'use client';

import React, { useState } from 'react';
import { AccountDeletion } from '../../types/database';
import { timeAgo, formatDate } from '../../lib/adminData';
import { UserX, MessageSquare, Phone, X, AlertTriangle, ExternalLink, Calendar, FileText } from 'lucide-react';

interface DeletionsViewProps {
  deletions: AccountDeletion[];
  searchQuery: string;
  onShowToast: (msg: string) => void;
}

export function DeletionsView({
  deletions,
  searchQuery,
  onShowToast,
}: DeletionsViewProps) {
  const [filter, setFilter] = useState('All');
  const [selectedDeletion, setSelectedDeletion] = useState<AccountDeletion | null>(null);

  // Group by reason to find top reasons and reason chips
  const reasonMap: { [key: string]: number } = {};
  deletions.forEach((d) => {
    const r = d.reason || 'Unspecified Reason';
    reasonMap[r] = (reasonMap[r] || 0) + 1;
  });

  const sortedReasons = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]);
  const primaryReason = sortedReasons.length > 0 ? sortedReasons[0][0] : 'None';
  const feedbackCount = deletions.filter((d) => d.feedback && d.feedback.trim().length > 0).length;
  const latestDeletion = deletions[0];

  const filterChips = ['All', ...sortedReasons.map(([r]) => r)];

  // Filtering
  const q = searchQuery.trim().toLowerCase();
  let filtered = deletions.filter((d) => {
    if (!q) return true;
    const matchStr = `${d.shop_name || ''} ${d.owner_name || ''} ${d.phone || ''} ${d.reason || ''} ${d.feedback || ''}`.toLowerCase();
    return matchStr.includes(q);
  });

  if (filter !== 'All') {
    filtered = filtered.filter((d) => (d.reason || 'Unspecified Reason') === filter);
  }

  const handleMessageFormerOwner = (phone?: string | null, name?: string | null, shop?: string | null) => {
    const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';
    if (cleanPhone) {
      const msg = encodeURIComponent(
        `Hello ${name || 'there'}, we noticed you recently deleted your Counter365 account for ${shop || 'your shop'}. We'd love to learn how we can improve or help resolve any issues.`
      );
      window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
      onShowToast(`Opened WhatsApp chat for ${name || shop}`);
    } else {
      onShowToast('No phone number on record for this account.');
    }
  };

  const handleCallFormerOwner = (phone?: string | null) => {
    const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';
    if (cleanPhone) {
      window.location.href = `tel:+91${cleanPhone}`;
      onShowToast(`Calling +91 ${cleanPhone}`);
    } else {
      onShowToast('No phone number on record for this account.');
    }
  };

  const handleCopyDeleteUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/delete-account` : '/delete-account';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      onShowToast('Public Delete Account URL copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Public URL Action Banner */}
      <div className="bg-white rounded-[8px] shadow-sm p-[14px_18px] border border-[var(--color-divider)] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#101318]">Public Account Deletion URL:</span>
              <code className="text-[12px] bg-red-50 text-red-700 font-mono px-2 py-0.5 rounded border border-red-200">
                /delete-account
              </code>
              <span className="tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                Accessible without login
              </span>
            </div>
            <p className="text-[12px] text-[#64748B] m-0 mt-0.5">
              Self-service account deletion URL for Play Store / App Store compliance & user data rights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDeleteUrl}
            className="btn btn-secondary text-[12px] min-h-[34px] px-3 gap-1.5"
          >
            <span>Copy Public URL</span>
          </button>
          <a
            href="/delete-account"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary text-[12px] min-h-[34px] px-3 gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C]"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white" />
            <span>Open Public Page</span>
          </a>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[14px]">
        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">TOTAL DELETED ACCOUNTS</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#DC2626]">
            {deletions.length}
          </div>
          <div className="text-[11px] text-black/50">
            recorded offboarding requests
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">PRIMARY CHURN REASON</div>
          <div className="font-heading text-[18px] font-bold leading-tight text-[#101318] truncate mt-1">
            {primaryReason}
          </div>
          <div className="text-[11px] text-black/50 mt-0.5">
            {sortedReasons[0] ? `${sortedReasons[0][1]} of ${deletions.length} accounts` : 'None'}
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">DETAILED FEEDBACK SUBMITTED</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {feedbackCount}
          </div>
          <div className="text-[11px] text-black/50">
            {deletions.length > 0 ? Math.round((feedbackCount / deletions.length) * 100) : 0}% response rate
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">LATEST DELETION</div>
          <div className="font-heading text-[20px] font-bold leading-none text-[#101318] mt-1">
            {latestDeletion ? timeAgo(latestDeletion.deleted_at) : 'None'}
          </div>
          <div className="text-[11px] text-black/50 mt-0.5">
            {latestDeletion ? formatDate(latestDeletion.deleted_at) : '—'}
          </div>
        </div>
      </div>

      {/* Main Account Deletions Table Card */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_16px_10px] border border-[var(--color-divider)]">
        {/* Filters and Header Bar */}
        <div className="flex items-center gap-2 flex-wrap pb-3.5 border-b border-[var(--color-divider)]">
          {filterChips.map((chip) => {
            const isActive = filter === chip;
            return (
              <button
                key={chip}
                onClick={() => setFilter(chip)}
                className={`min-h-[32px] px-3 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? 'border-[#DC2626] bg-[#DC2626] text-white shadow-xs'
                    : 'border-[var(--color-divider)] bg-white text-[#101318] hover:bg-red-50 hover:text-red-700'
                }`}
              >
                {chip}
              </button>
            );
          })}
          <span className="text-[12px] text-black/50 ml-auto font-medium">
            {filtered.length} of {deletions.length} deleted accounts
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Shop & Owner</th>
                <th>Registered Phone</th>
                <th>Reason for Deletion</th>
                <th>Feedback / Exit Survey</th>
                <th className="text-right">Deleted Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-black/40 py-10">
                    No account deletions matching “{searchQuery || filter}”.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDeletion(d)}
                    className="cursor-pointer hover:bg-red-50/40 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-heading font-black text-[13px] flex-none border border-red-200">
                          {d.shop_name?.charAt(0).toUpperCase() || 'X'}
                        </span>
                        <div className="min-w-0">
                          <span className="block font-heading font-bold text-[14px] text-[#101318] truncate">
                            {d.shop_name || 'Unnamed Shop'}
                          </span>
                          <span className="text-[11px] text-black/50 truncate block">
                            Owner: {d.owner_name || 'Shop Owner'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="text-black/80 font-mono text-[12.5px]">
                      {d.phone ? `+91 ${d.phone}` : '—'}
                    </td>

                    <td>
                      <span className="tag bg-red-50 text-red-700 border border-red-200 font-medium text-[11px]">
                        {d.reason || 'Not Specified'}
                      </span>
                    </td>

                    <td className="text-black/70 text-[12px] max-w-[280px] truncate">
                      {d.feedback ? (
                        <span className="text-[#101318] font-normal">{d.feedback}</span>
                      ) : (
                        <span className="text-black/40 italic">No comments</span>
                      )}
                    </td>

                    <td className="text-right text-black/60 text-[12px]">
                      <div>{formatDate(d.deleted_at)}</div>
                      <div className="text-[10.5px] text-black/40">{timeAgo(d.deleted_at)}</div>
                    </td>

                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeletion(d);
                        }}
                        className="btn btn-secondary text-[11.5px] py-1 px-2.5 h-7 border-gray-300 hover:border-[#FD5E03] hover:text-[#FD5E03]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Deletion Detail Drawer */}
      {selectedDeletion && (
        <div className="fixed inset-0 bg-[#101318]/50 flex justify-end z-50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setSelectedDeletion(null)} />

          <div className="w-[min(480px,94vw)] bg-white h-full overflow-y-auto shadow-2xl flex flex-col border-l border-[var(--color-divider)]">
            {/* Drawer Header */}
            <div className="p-[20px] bg-[#101318] text-white flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center font-heading font-black text-[20px] flex-none text-red-400">
                <UserX className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-[20px] font-bold leading-tight truncate text-white">
                  {selectedDeletion.shop_name || 'Deleted Account'}
                </h2>
                <div className="text-[11px] text-red-400 mt-1 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  ACCOUNT PERMANENTLY DELETED
                </div>
              </div>
              <button
                onClick={() => setSelectedDeletion(null)}
                className="w-8 h-8 rounded-md flex items-center justify-center border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-[20px_22px_32px] flex flex-col gap-6">
              {/* Alert notice */}
              <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-[12.5px] flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
                <div>
                  <div className="font-bold text-red-900">Offboarded Account</div>
                  <div>
                    This account was deleted on {formatDate(selectedDeletion.deleted_at)} ({timeAgo(selectedDeletion.deleted_at)}). All operational records are retained for auditing.
                  </div>
                </div>
              </div>

              {/* Reason and Feedback Card */}
              <div className="bg-[#F8F9FA] rounded-[8px] p-4 border border-[var(--color-divider)] flex flex-col gap-3">
                <div>
                  <div className="card-kicker mb-1">Reason for Leaving</div>
                  <div className="inline-flex tag bg-red-100 text-red-800 font-bold text-[12px] border border-red-200">
                    {selectedDeletion.reason || 'No specific reason given'}
                  </div>
                </div>

                <div>
                  <div className="card-kicker mb-1">Detailed Feedback & Comments</div>
                  <div className="text-[13px] text-[#101318] bg-white p-3 rounded-[6px] border border-[var(--color-divider)] leading-relaxed min-h-[60px]">
                    {selectedDeletion.feedback ? (
                      selectedDeletion.feedback
                    ) : (
                      <span className="text-black/40 italic">
                        The user did not provide additional comments in the feedback survey.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Details Table */}
              <div>
                <h3 className="text-[13px] font-bold text-[#101318] uppercase tracking-wider mb-2">
                  Account Snapshot
                </h3>
                <div className="rounded-[8px] border border-[var(--color-divider)] overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <tbody className="divide-y divide-[var(--color-divider)]">
                      <tr>
                        <td className="px-3 py-2 text-black/60 bg-gray-50/50 w-2/5">Shop Name</td>
                        <td className="px-3 py-2 font-medium text-right">{selectedDeletion.shop_name || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-black/60 bg-gray-50/50">Owner Name</td>
                        <td className="px-3 py-2 font-medium text-right">{selectedDeletion.owner_name || 'Shop Owner'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-black/60 bg-gray-50/50">Phone Number</td>
                        <td className="px-3 py-2 font-mono font-medium text-right">
                          {selectedDeletion.phone ? `+91 ${selectedDeletion.phone}` : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-black/60 bg-gray-50/50">Deleted Timestamp</td>
                        <td className="px-3 py-2 text-right">
                          {formatDate(selectedDeletion.deleted_at)}, {new Date(selectedDeletion.deleted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-black/60 bg-gray-50/50">User ID</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-right truncate max-w-[200px]">
                          {selectedDeletion.user_id}
                        </td>
                      </tr>
                      {selectedDeletion.shop_id && (
                        <tr>
                          <td className="px-3 py-2 text-black/60 bg-gray-50/50">Shop ID</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-right truncate max-w-[200px]">
                            {selectedDeletion.shop_id}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Direct Actions to Reach Out */}
              <div className="flex gap-3 mt-2 pt-3 border-t border-[var(--color-divider)]">
                <button
                  onClick={() =>
                    handleMessageFormerOwner(
                      selectedDeletion.phone,
                      selectedDeletion.owner_name,
                      selectedDeletion.shop_name
                    )
                  }
                  className="btn btn-secondary flex-1 min-h-[42px] gap-2 font-semibold border-gray-300 hover:border-[#FD5E03]"
                >
                  <MessageSquare className="w-4 h-4 text-[#FD5E03]" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handleCallFormerOwner(selectedDeletion.phone)}
                  className="btn btn-primary flex-1 min-h-[42px] gap-2 font-semibold"
                >
                  <Phone className="w-4 h-4 text-white" />
                  Call Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
