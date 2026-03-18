'use client';

import { motion } from 'motion/react';
import { Network, Activity, Clock } from 'lucide-react';

export default function Padroes() {
  return (
    <div className="min-h-full w-full bg-void flex flex-col relative pb-32">
      <header className="sticky top-0 z-10 bg-void/80 backdrop-blur-md px-6 pt-12 pb-4 border-b border-threshold">
        <h1 className="font-display text-[28px] text-signal leading-none">Padrões</h1>
        <div className="font-interface text-[11px] text-whisper mt-1 uppercase">
          47 nodes · Núcleo identificado
        </div>
      </header>

      <div className="flex-1 px-6 py-8 flex flex-col gap-12">
        {/* NÚCLEO DO EU */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Network size={16} className="text-pulse" />
            <h2 className="font-interface text-[12px] text-whisper uppercase tracking-widest">Núcleo do Eu</h2>
          </div>
          
          <div className="p-6 rounded-[24px] bg-membrane/40 border border-threshold relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, var(--pulse) 0%, transparent 70%)' }} />
            
            {/* Mini-grafo visual representation */}
            <div className="relative h-24 w-full mb-6 flex items-center justify-center">
              <div className="absolute w-[1px] h-16 bg-pulse/30 rotate-45" />
              <div className="absolute w-[1px] h-16 bg-pulse/30 -rotate-45" />
              <div className="absolute w-4 h-4 rounded-full bg-pulse shadow-[0_0_15px_rgba(123,156,255,0.6)] z-10" />
              <div className="absolute w-3 h-3 rounded-full bg-synapse top-2 left-1/4 z-10" />
              <div className="absolute w-3 h-3 rounded-full bg-emergence bottom-2 right-1/4 z-10" />
            </div>

            <p className="font-body text-[18px] text-signal leading-relaxed">
              Sua identidade atual orbita a necessidade de criar estrutura no caos. Há uma busca constante por significado nas pequenas interações.
            </p>
          </div>
        </section>

        {/* TENSÕES ATIVAS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-synapse" />
            <h2 className="font-interface text-[12px] text-whisper uppercase tracking-widest">Tensões Ativas</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {[
              ['Desejo de isolamento', 'Necessidade de conexão'],
              ['Criação impulsiva', 'Perfeccionismo paralisante']
            ].map((tension, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-[16px] bg-membrane/20 border border-threshold">
                <span className="font-body text-[16px] text-signal/80 flex-1 text-right">{tension[0]}</span>
                <span className="font-display text-[20px] text-synapse mx-4">↔</span>
                <span className="font-body text-[16px] text-signal/80 flex-1 text-left">{tension[1]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CRONOLOGIA */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Clock size={16} className="text-emergence" />
            <h2 className="font-interface text-[12px] text-whisper uppercase tracking-widest">Cronologia</h2>
          </div>
          
          <div className="relative w-full overflow-x-auto no-scrollbar pb-4">
            <div className="flex gap-8 min-w-max px-2">
              <div className="absolute top-3 left-0 right-0 h-[1px] bg-threshold" />
              
              {[
                { date: '12 OUT', title: 'Ruptura', desc: 'Primeiro registro de exaustão' },
                { date: '15 OUT', title: 'Silêncio', desc: 'Pausa nas interações sociais' },
                { date: '20 OUT', title: 'Retorno', desc: 'Nova perspectiva criativa' },
                { date: '24 OUT', title: 'Síntese', desc: 'Integração das tensões' }
              ].map((marco, idx) => (
                <div key={idx} className="relative flex flex-col items-center w-32">
                  <div className="w-6 h-6 rounded-full bg-void border-2 border-emergence flex items-center justify-center z-10 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emergence" />
                  </div>
                  <span className="font-interface text-[10px] text-whisper mb-2">{marco.date}</span>
                  <span className="font-display text-[16px] text-signal mb-1">{marco.title}</span>
                  <span className="font-body text-[14px] text-signal/60 text-center leading-tight">{marco.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
