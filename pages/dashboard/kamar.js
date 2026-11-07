import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

export default function KamarPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [kamar, setKamar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof?.role !== 'penjaga') return router.replace('/dashboard');
      setRole(prof.role);
      const { data } = await supabase.from('kamar').select('*').order('nomor_kamar');
      setKamar(data || []);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span></div>;

  const terisi = kamar.filter((k) => k.status === 'terisi').length;

  return (
    <Layout role={role}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold">🏠 Denah Kamar</h1>
          <p className="text-sm text-gray-500 mt-1">Terisi: <span className="font-bold text-success">{terisi}</span> / {kamar.length} kamar</p>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-success rounded"></span> Terisi</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-base-300 rounded"></span> Kosong</div>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
        {kamar.map((k) => (
          <div key={k.id}
            className={`aspect-square rounded-xl flex flex-col items-center justify-center font-bold shadow-sm border-2 transition-all
              ${k.status === 'terisi' 
                ? 'bg-success text-success-content border-success-content/20' 
                : 'bg-base-100 text-base-content/50 border-base-300'}`}>
            <div className="text-xl">{k.nomor_kamar}</div>
            <div className="text-[10px] uppercase opacity-80">{k.status}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
