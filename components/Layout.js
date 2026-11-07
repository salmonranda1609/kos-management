import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Layout({ children, role }) {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''));
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-primary text-primary-content shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl normal-case">🏠 Kos App</a>
        </div>
        <div className="flex-none gap-2">
          <span className="hidden sm:inline text-sm opacity-80">{email}</span>
          <div className="badge badge-secondary uppercase">{role}</div>
          <button onClick={logout} className="btn btn-sm btn-error text-white">Logout</button>
        </div>
      </div>

      {role === 'penjaga' && (
        <div className="tabs tabs-boxed bg-base-100 p-2 rounded-none border-b justify-center gap-2">
          <Link href="/dashboard" className={`tab ${router.pathname === '/dashboard' ? 'tab-active' : ''}`}>Dashboard</Link>
          <Link href="/dashboard/tamu" className={`tab ${router.pathname === '/dashboard/tamu' ? 'tab-active' : ''}`}>Data Tamu</Link>
          <Link href="/dashboard/kamar" className={`tab ${router.pathname === '/dashboard/kamar' ? 'tab-active' : ''}`}>Denah Kamar</Link>
        </div>
      )}

      {role === 'pemilik' && (
        <div className="tabs tabs-boxed bg-base-100 p-2 rounded-none border-b justify-center gap-2">
          <Link href="/dashboard" className={`tab ${router.pathname === '/dashboard' ? 'tab-active' : ''}`}>Dashboard Pemilik</Link>
          <Link href="/dashboard/laporan-baru" className={`tab ${router.pathname === '/dashboard/laporan' ? 'tab-active' : ''}`}>Laporan Pembayaran</Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
