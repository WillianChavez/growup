import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export default async function Home() {
  // Verificar si el usuario está autenticado
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  let isAuthenticated = false;
  if (token) {
    const payload = await verifyToken(token);
    isAuthenticated = !!payload;
  }

  // Redirigir según el estado de autenticación
  if (isAuthenticated) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
