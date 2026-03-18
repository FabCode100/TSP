'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithGoogleMock } from '@/actions/db';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const token = await loginWithGoogleMock();
      if (token) {
        // Redireciona para o verificador principal (onboarding ou pulso)
        router.push('/');
      }
    } catch (error) {
      console.error('Falha no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-void text-signal font-sans h-screen flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] bg-nodes relative overflow-hidden">
      {/* Decoração de Fundo */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(123, 156, 255, 0.05) 0%, transparent 70%)' }}>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-md mx-auto">
        <div className="mb-10 flex flex-col items-center">
          <div className="w-32 h-32 mb-6 rounded-3xl overflow-hidden flex items-center justify-center bg-membrane border border-white/5 shadow-[0_0_40px_rgba(123,156,255,0.15)]">
            <img 
              alt="The Symbiosis Protocol Logo" 
              className="w-full h-full object-cover opacity-90 object-center" 
              src="/icon-512.png" 
            />
          </div>
          <h1 className="font-display text-[32px] font-light tracking-wide text-signal mb-3 text-center">
              Continuity OS
          </h1>
          <p className="text-whisper italic text-center text-sm px-4">
              "Sua identidade, descentralizada e emergente."
          </p>
        </div>

        <div className="w-full mt-8 space-y-6">
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-membrane text-signal border border-white/10 rounded-full py-4 px-6 flex items-center justify-center space-x-3 hover:bg-white/5 transition-all duration-300 shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-pulse" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span className="font-medium">Continuar com Google</span>
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="w-full px-8 pb-8 text-center relative z-10 mt-auto">
        <p className="text-xs text-whisper leading-relaxed">
          Ao entrar, você concorda com nossos <br/>
          <a className="text-pulse hover:underline underline-offset-4 decoration-pulse/30 transition-all font-medium" href="#">Termos de Uso</a> 
          {' '}e{' '}
          <a className="text-pulse hover:underline underline-offset-4 decoration-pulse/30 transition-all font-medium" href="#">Política de Privacidade</a>.
        </p>
      </footer>
    </div>
  );
}
