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
    <div className="min-h-screen bg-base-200 pb-16 md:pb-0">
      {/* Top Navbar */}
      <div className="navbar bg-primary text-primary-content shadow-lg sticky top-0 z-50">
        <div className="flex-1">
          <Link href="/dashboard" className="btn btn-ghost text-xl normal-case">🏠 Kos App</Link>
        </div>
        <div className="flex-none gap-2">
          <span className="hidden sm:inline text-sm opacity-80">{email}</span>
          <div className="badge badge-secondary uppercase font-bold">{role}</div>
          <button onClick={logout} className="btn btn-sm btn-error text-white">Logout</button>
        </div>
      </div>

      {/* Navigasi Menu (Tabs) */}
      <div className="bg-base-100 shadow-sm border-b sticky top-[64px] z-40">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto flex gap-2 py-3 no-scrollbar">
          
          {role === 'penjaga' && (
            <>
              <Link href="/dashboard" className={`btn btn-sm ${router.pathname === '/dashboard' ? 'btn-primary' : 'btn-ghost bg-base-200'}`}>Dashboard</Link>
              <Link href="/dashboard/tamu" className={`btn btn-sm ${router.pathname === '/dashboard/tamu' ? 'btn-primary' : 'btn-ghost bg-base-200'}`}>Data Tamu</Link>
              <Link href="/dashboard/kamar" className={`btn btn-sm ${router.pathname === '/dashboard/kamar' ? 'btn-primary' : 'btn-ghost bg-base-200'}`}>Denah Kamar</Link>
            </>
          )}

          {role === 'pemilik' && (
            <>
              <Link href="/dashboard" className={`btn btn-sm ${router.pathname === '/dashboard' ? 'btn-primary' : 'btn-ghost bg-base-200'}`}>Dashboard</Link>
              <Link href="/dashboard/laporan" className={`btn btn-sm ${router.pathname === '/dashboard/laporan' ? 'btn-primary' : 'btn-ghost bg-base-200'}`}>Laporan Pembayaran</Link>
            </>
          )}

        </div>
      </div>

      {/* Konten Utama */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
