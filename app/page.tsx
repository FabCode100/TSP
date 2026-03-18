'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateUser } from '@/actions/db';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getOrCreateUser().then(user => {
      if (user.onboarding) {
        router.push('/pulso');
      } else {
        router.push('/onboarding');
      }
    });
  }, [router]);

  return (
    <div className="h-full w-full bg-void flex items-center justify-center">
      <div className="text-pulse animate-pulse font-display">Conectando...</div>
    </div>
  );
}
