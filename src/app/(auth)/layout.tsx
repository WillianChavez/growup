import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación - GrowUp',
  description: 'Inicia sesión o regístrate en GrowUp',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

