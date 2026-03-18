import { redirect } from 'next/navigation';
import { getOrCreateUser } from '@/actions/db';

export default async function Home() {
  const user = await getOrCreateUser();

  if (user.onboarding) {
    redirect('/pulso');
  } else {
    redirect('/onboarding');
  }
}
