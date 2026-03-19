'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getConnections, getShareLogs } from '@/actions/db';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function Conexoes() {
  const router = useRouter();
  const [connections, setConnections] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [conns, accessLogs] = await Promise.all([
        getConnections(),
        getShareLogs(),
      ]);
      setConnections(conns || []);
      setLogs(accessLogs || []);
    } catch (e) {
      console.error('[Conexoes] Error loading data:', e);
    }
    setLoading(false);
  }

  // Calculate weekly session count from logs
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyLogs = logs.filter(l => new Date(l.createdAt).getTime() > weekAgo);

  return (
    <div className="h-[100dvh] bg-[#050508] text-[#E8E4D9] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 bg-[#050508] flex justify-between items-center px-6 py-4 border-b border-[#444652]/10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-[#7B9CFF]">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h1 className="text-2xl font-['Cormorant_Garamond'] font-light italic truncate">Archivist's Circle</h1>
        </div>
        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-tight text-[#7B9CFF] shrink-0">v.2.0.4</span>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 space-y-12 max-w-2xl mx-auto w-full">
        {/* Pending Synapses */}
        {pendingRequests.length > 0 && (
          <section>
            <header className="mb-6 flex justify-between items-end">
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-light">Pending Synapses</h2>
              <span className="font-['DM_Mono'] text-[10px] uppercase tracking-widest opacity-40">
                {pendingRequests.length} requests
              </span>
            </header>
            <div className="space-y-4">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1b1b1f] border border-[#444652]/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#353439] flex items-center justify-center border border-[#7B9CFF]/20 font-['Cormorant_Garamond'] text-lg">
                      {req.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{req.name}</p>
                      <p className="font-['DM_Mono'] text-[9px] uppercase tracking-tight opacity-40">
                        Identity Match: {req.match || '—'}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#7B9CFF] hover:opacity-70 transition-opacity">
                      [Accept]
                    </button>
                    <button className="font-['DM_Mono'] text-[10px] uppercase tracking-widest opacity-40 hover:opacity-70 transition-opacity">
                      [Decline]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Synchronized Identities */}
        <section>
          <header className="mb-6 flex justify-between items-end">
            <h2 className="font-['Cormorant_Garamond'] text-3xl font-light">Synchronized Identities</h2>
            <span className="font-['DM_Mono'] text-[10px] uppercase tracking-widest opacity-40">Active Links</span>
          </header>

          {loading ? (
            <div className="text-center py-12">
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest opacity-40">Scanning network...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest opacity-40">No synchronized identities</p>
              <button
                onClick={() => router.push('/conectar')}
                className="px-6 py-3 bg-[#1b1b1f] text-[#7B9CFF] rounded-xl font-['DM_Mono'] text-[10px] uppercase tracking-widest hover:bg-[#2a292e] transition-colors"
              >
                Connect your first twin
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {connections.map((conn: any, i: number) => (
                <motion.div
                  key={conn.ownerId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/explorar?token=${conn.token}`)}
                  className="group flex items-center justify-between py-6 border-b border-[#444652]/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-[#131317] flex items-center justify-center text-xl font-['Cormorant_Garamond'] border border-[#444652]/20">
                        {conn.ownerName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#050508] ${
                        conn.isActive ? 'bg-[#7B9CFF] shadow-[0_0_10px_rgba(123,156,255,0.5)]' : 'bg-[#353439]'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-['Cormorant_Garamond'] text-[18px]">{conn.ownerName}</h3>
                      <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#E8E4D9]/40 mt-1">
                        Last sync: {timeAgo(conn.lastSync)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-[#E8E4D9]/20 group-hover:text-[#7B9CFF] transition-colors" />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Activity Summary */}
        {weeklyLogs.length > 0 && (
          <section className="pt-8">
            <div className="backdrop-blur-[20px] bg-[#131317]/60 p-6 rounded-2xl border border-[#7B9CFF]/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#7B9CFF] mb-2">
                    TwinAccessLog // Summary
                  </p>
                  <h4 className="font-['Cormorant_Garamond'] text-xl italic">
                    {weeklyLogs.length} active session{weeklyLogs.length !== 1 ? 's' : ''} this week
                  </h4>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[0, 1, 2, 3, 4, 5, 6].map(d => {
                    const dayLogs = weeklyLogs.filter(l => {
                      const logDay = new Date(l.createdAt).getDay();
                      return logDay === d;
                    });
                    return (
                      <span key={d} className={`w-1.5 h-1.5 rounded-full ${
                        dayLogs.length > 0 ? 'bg-[#7B9CFF] shadow-[0_0_8px_rgba(123,156,255,0.8)]' : 'bg-[#7B9CFF]/40'
                      }`} />
                    );
                  })}
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end gap-1 h-12 w-full">
                {[20, 45, 60, 85, 30, 70, 15, 25, 55, 90].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${
                      i % 3 === 0 ? 'bg-[#7B9CFF]' : i % 3 === 1 ? 'bg-[#7B9CFF]/40' : 'bg-[#353439]'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 font-['DM_Mono'] text-[8px] uppercase tracking-widest opacity-30">
                <span>Cycle Start</span>
                <span>Real-Time Projection</span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
