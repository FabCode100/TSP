'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mic, Image as ImageIcon, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getOrCreateUser, updateProfile } from '@/actions/db';

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Voz feminina suave e expressiva', gender: 'Feminino' },
];

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState({
    photoUrl: '',
    voiceId: 'EXAVITQu4vr4xnSDxMaL'
  });

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getOrCreateUser();
        setProfile({
          photoUrl: user.photoUrl || '',
          voiceId: user.voiceId || 'TX3LPaxmHKxFOn773SBA'
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await updateProfile(profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pulse border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-signal p-6 pb-24 font-sans selection:bg-pulse/30">
      {/* Header */}
      <header className="max-w-2xl mx-auto mb-12 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-membrane/20 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium tracking-tight bg-gradient-to-r from-signal to-signal/60 bg-clip-text text-transparent">
          Configurações do Gêmeo
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto space-y-12">
        {/* Foto de Perfil */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-pulse/60 mb-2">
            <ImageIcon size={18} />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Identidade Visual</h2>
          </div>
          
          <div className="flex flex-col items-center gap-6 p-8 bg-membrane/10 border border-membrane/20 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-pulse/5 to-transparent pointer-events-none" />
            
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-pulse/30 bg-membrane/40 group-hover:border-pulse transition-colors shadow-2xl shadow-pulse/10">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Avatar prototype" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pulse/20">
                  <User size={48} />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <label className="text-xs text-signal/40 ml-1">URL da Imagem (Avatar)</label>
              <input 
                type="text"
                value={profile.photoUrl}
                onChange={(e) => setProfile(prev => ({ ...prev, photoUrl: e.target.value }))}
                placeholder="https://exemplo.com/sua-foto.jpg"
                className="w-full bg-void/50 border border-membrane/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all placeholder:text-signal/20"
              />
            </div>
          </div>
        </section>

        {/* Seleção de Voz */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-pulse/60 mb-2">
            <Mic size={18} />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Identidade Auditiva</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VOICES.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setProfile(prev => ({ ...prev, voiceId: voice.id }))}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                  profile.voiceId === voice.id 
                    ? 'bg-pulse/10 border-pulse ring-1 ring-pulse/30 shadow-lg shadow-pulse/5' 
                    : 'bg-membrane/5 border-membrane/20 hover:border-membrane/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${profile.voiceId === voice.id ? 'text-pulse' : 'text-signal'}`}>
                    {voice.name}
                  </span>
                  {profile.voiceId === voice.id && (
                    <motion.div layoutId="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 size={16} className="text-pulse" />
                    </motion.div>
                  )}
                </div>
                <span className="text-[10px] text-signal/40 mb-2 leading-tight">
                  {voice.desc}
                </span>
                <span className="text-[9px] uppercase tracking-tighter bg-membrane/20 self-start px-2 py-0.5 rounded-full text-signal/30">
                  {voice.gender}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <footer className="pt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full max-w-sm flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all shadow-xl shadow-pulse/10 ${
              success 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-pulse text-void hover:bg-pulse/90 hover:scale-[1.02] active:scale-[0.98]'
            } disabled:opacity-50 disabled:hover:scale-100`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-void/50 border-t-white rounded-full animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 size={20} />
                <span>Perfil Atualizado</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-signal/30 text-center max-w-xs uppercase tracking-widest leading-relaxed">
            As alterações de voz requerem que os novos áudios sejam gerados na próxima interação.
          </p>
        </footer>
      </main>
    </div>
  );
}
