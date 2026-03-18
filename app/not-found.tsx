'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
      <h1 className="text-4xl font-display mb-4 italic">Protocolo Interrompido</h1>
      <p className="text-white/60 mb-8 font-body">Caminho não encontrado na rede neural.</p>
      <Link href="/" className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-colors">
        Retornar ao Início
      </Link>
    </div>
  );
}
