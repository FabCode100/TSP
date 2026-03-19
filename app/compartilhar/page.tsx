'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Ban, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createShareToken, listShareTokens, revokeShareToken, getShareLogs } from '@/actions/db';

const PERMISSION_LEVELS = ['PUBLIC', 'TRUSTED', 'INTIMATE'];
const EXPIRY_OPTIONS = [
  { label: 'Never', value: '' },
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
];

function getExpiryDate(value: string): string | undefined {
  if (!value) return undefined;
  const now = new Date();
  if (value === '1h') now.setHours(now.getHours() + 1);
  else if (value === '24h') now.setHours(now.getHours() + 24);
  else if (value === '7d') now.setDate(now.getDate() + 7);
  return now.toISOString();
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Compartilhar() {
  const router = useRouter();
  const [tokens, setTokens] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [permission, setPermission] = useState('PUBLIC');
  const [role, setRole] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [t, l] = await Promise.all([listShareTokens(), getShareLogs()]);
    setTokens(t || []);
    setLogs(l || []);
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      await createShareToken(permission, role || 'General', '', getExpiryDate(expiry));
      await loadData();
      setRole('');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleRevoke(id: string) {
    await revokeShareToken(id);
    await loadData();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/explorar?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="h-[100dvh] bg-[#050508] text-[#E8E4D9] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 bg-[#050508] border-b border-[#444652]/10">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-[#7B9CFF] hover:opacity-80 transition-opacity">
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <h1 className="font-['Cormorant_Garamond'] font-light text-2xl">Share Twin</h1>
          </div>
          <div className="font-['DM_Mono'] text-[#E8E4D9]/40 text-[10px] uppercase tracking-tight">TSP</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-12 space-y-12 max-w-2xl mx-auto w-full">
        {/* Protocol 01: Create Share Token */}
        <section className="space-y-8">
          <div className="flex flex-col gap-1">
            <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#7B9CFF]">Protocol 01</span>
            <h2 className="font-['Cormorant_Garamond'] text-3xl">Create Share Token</h2>
          </div>

          <div className="space-y-6">
            {/* Permission Level */}
            <div className="space-y-3">
              <label className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#8e909e]">Permission Level</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#1b1b1f] rounded-xl">
                {PERMISSION_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setPermission(level)}
                    className={`py-2 text-[10px] font-['DM_Mono'] uppercase tracking-[0.15em] rounded-lg transition-colors ${
                      permission === level
                        ? 'bg-[#353439] text-[#7B9CFF] border border-[#7B9CFF]/20'
                        : 'text-[#c4c6d4] hover:bg-[#2a292e]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Description */}
            <div className="space-y-3">
              <label className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#8e909e]">Role Description</label>
              <textarea
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g., Professional Advisor"
                className="w-full bg-[#1b1b1f] border-none rounded-xl p-4 text-[#E8E4D9] placeholder:text-[#444652] focus:ring-1 focus:ring-[#7B9CFF]/30 min-h-[100px] text-sm font-serif outline-none resize-none"
              />
            </div>

            {/* Temporal Expiry */}
            <div className="space-y-3">
              <label className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#8e909e]">Temporal Expiry</label>
              <select
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="w-full bg-[#1b1b1f] border-none rounded-xl p-4 text-[#E8E4D9] text-sm outline-none appearance-none"
              >
                {EXPIRY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-5 bg-[#7B9CFF] text-[#003086] font-['Cormorant_Garamond'] text-xl rounded-xl relative overflow-hidden hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Token'}
            </motion.button>
          </div>
        </section>

        {/* Protocol 02: Active Synapses */}
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#A78BFA]">Protocol 02</span>
              <h2 className="font-['Cormorant_Garamond'] text-3xl">Active Synapses</h2>
            </div>
            <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#444652]">{tokens.length} Active</span>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {tokens.map(t => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#1b1b1f] p-5 rounded-2xl space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7B9CFF] animate-pulse" />
                        <h3 className="font-['Cormorant_Garamond'] text-xl">{t.role}</h3>
                      </div>
                      <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#8e909e]">
                        Permission: {t.permissionLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#8e909e]">Expires</p>
                      <p className="text-xs text-[#c4c6d4]">
                        {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => copyLink(t.token)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2a292e] rounded-lg hover:bg-[#353439] transition-colors"
                    >
                      <Copy size={14} />
                      <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em]">
                        {copied === t.token ? 'Copied!' : 'Copy Link'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleRevoke(t.id)}
                      className="px-4 flex items-center justify-center py-2.5 border border-[#ffb4ab]/20 text-[#ffb4ab] rounded-lg hover:bg-[#ffb4ab]/5 transition-colors"
                    >
                      <Ban size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {tokens.length === 0 && (
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#444652] text-center py-8">
                No active synapses
              </p>
            )}
          </div>
        </section>

        {/* Protocol 03: Access Log */}
        <section className="space-y-8">
          <div className="flex flex-col gap-1">
            <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#cac6bc]">Protocol 03</span>
            <h2 className="font-['Cormorant_Garamond'] text-3xl">Access Log</h2>
          </div>

          <div className="space-y-px bg-[#444652]/10 rounded-2xl overflow-hidden">
            {logs.map((log: any) => (
              <div key={log.id} className="bg-[#0e0e12] p-4 flex justify-between items-center hover:bg-[#1b1b1f] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2a292e] flex items-center justify-center">
                    {log.accessorName === 'Visitante' ? <EyeOff size={18} className="text-[#8e909e]" /> : <Eye size={18} className="text-[#7B9CFF]" />}
                  </div>
                  <div>
                    <p className="text-sm">
                      Accessed by <span className="text-[#7B9CFF]">{log.accessorName}</span>
                    </p>
                    <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.15em] text-[#8e909e]">
                      {log.summary?.substring(0, 40) || 'Session'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#c4c6d4]">{timeAgo(log.createdAt)}</p>
                  <p className="font-['DM_Mono'] text-[8px] uppercase tracking-[0.15em] text-[#444652]">
                    Duration: {log.duration ? `${Math.floor(log.duration / 60)}m` : '—'}
                  </p>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="bg-[#0e0e12] p-8 text-center">
                <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#444652]">No access logs yet</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
