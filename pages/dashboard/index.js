import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [stats, setStats] = useState({ total: 40, terisi: 0, kosong: 40 });
  const [tamuAktif, setTamuAktif] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');

      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setRole(prof?.role || 'penjaga');

      const { data: kamar } = await supabase.from('kamar').select('status');
      const terisi = kamar?.filter((k) => k.status === 'terisi').length || 0;
      setStats({ total: kamar?.length || 40, terisi, kosong: (kamar?.length || 40) - terisi });

      const { data: tamu } = await supabase
        .from('tamu').select('*, kamar(nomor_kamar)')
        .is('tanggal_keluar', null)
        .order('created_at', { ascending: false }).limit(10);
      setTamuAktif(tamu || []);
    })();
  }, [router]);

  if (!role) return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <Layout role={role}>
      <h1 className="text-3xl font-bold mb-6">
        {role === 'pemilik' ? '📊 Dashboard Pemilik' : '📊 Dashboard Penjaga'}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="card bg-info text-info-content shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-lg opacity-90">Total Kamar</h2>
            <p className="text-5xl font-extrabold">{stats.total}</p>
          </div>
        </div>
        <div className="card bg-success text-success-content shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-lg opacity-90">Terisi</h2>
            <p className="text-5xl font-extrabold">{stats.terisi}</p>
          </div>
        </div>
        <div className="card bg-warning text-warning-content shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-lg opacity-90">Kosong</h2>
            <p className="text-5xl font-extrabold">{stats.kosong}</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">👥 Penghuni Aktif (10 terbaru)</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Nama</th><th>Kamar</th><th>Periode</th><th>Masuk</th>
                </tr>
              </thead>
              <tbody>
                {tamuAktif.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-500">Belum ada tamu aktif.</td></tr>
                )}
                {tamuAktif.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold">{t.nama}</td>
                    <td><div className="badge badge-outline">{t.kamar?.nomor_kamar || '-'}</div></td>
                    <td className="capitalize">{t.periode}</td>
                    <td>{t.tanggal_masuk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
