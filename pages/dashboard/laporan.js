import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

export default function LaporanPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
  const [tahun, setTahun] = useState(currentDate.getFullYear());

  const listBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const fetchLaporan = async () => {
    setLoading(true);
    const startDate = new Date(tahun, bulan - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('tamu')
      .select('*, kamar(nomor_kamar)')
      .not('harga', 'is', null)
      .gte('tanggal_masuk', startDate)
      .lte('tanggal_masuk', endDate)
      .order('tanggal_masuk', { ascending: false });
    
    setLaporan(data || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');
      
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof?.role !== 'pemilik') return router.replace('/dashboard');
      setRole(prof.role);
      
      await fetchLaporan();
    })();
  }, [router]);

  useEffect(() => {
    if (role === 'pemilik') fetchLaporan();
  }, [bulan, tahun]);

  if (!role || loading) return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span></div>;

  const totalPendapatan = laporan.reduce((sum, item) => sum + (item.harga || 0), 0);

  return (
    <Layout role={role}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">💰 Laporan Keuangan</h1>
        
        {/* Filter Bulan & Tahun */}
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={bulan} 
            onChange={(e) => setBulan(parseInt(e.target.value))}
            className="select select-bordered w-full md:w-auto"
          >
            {listBulan.map((b, i) => (
              <option key={i} value={i + 1}>{b}</option>
            ))}
          </select>
          
          <select 
            value={tahun} 
            onChange={(e) => setTahun(parseInt(e.target.value))}
            className="select select-bordered w-full md:w-auto"
          >
            {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kartu Rekap - Menumpuk ke bawah di HP */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
          <div className="text-sm text-gray-500 mb-1">Periode Laporan</div>
          <div className="text-xl font-bold text-primary">{listBulan[bulan - 1]} {tahun}</div>
        </div>
        <div className="flex-1 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
          <div className="text-sm text-gray-500 mb-1">Total Transaksi</div>
          <div className="text-xl font-bold text-secondary">
            {laporan.length} <span className="text-sm font-normal text-gray-500">Tamu</span>
          </div>
        </div>
        <div className="flex-1 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
          <div className="text-sm text-gray-500 mb-1">Total Pendapatan</div>
          <div className="text-xl font-bold text-success break-words">
            Rp {totalPendapatan.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* TAMPILAN MOBILE (CARD LIST) - Murni pakai DIV tanpa tabel */}
      <div className="block md:hidden space-y-3">
        {laporan.length === 0 && (
          <div className="text-center py-8 bg-base-100 rounded-box shadow text-sm text-gray-500">
            Tidak ada data pendapatan pada bulan ini.
          </div>
        )}
        {laporan.map((t) => (
          <div key={t.id} className="bg-base-100 shadow-sm border border-base-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2 gap-2">
              <div>
                <h3 className="font-bold text-sm text-gray-800">{t.nama}</h3>
                <p className="text-xs text-gray-500 mt-1">Kamar {t.kamar?.nomor_kamar || '-'} • {t.periode}</p>
              </div>
              <div className="font-bold text-success text-sm whitespace-nowrap">
                Rp {t.harga?.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>Masuk: {t.tanggal_masuk}</span>
              {t.tanggal_keluar
                ? <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-[10px]">Selesai</span>
                : <span className="bg-green-500 text-white px-2 py-1 rounded-md text-[10px]">Aktif</span>}
            </div>
          </div>
        ))}
      </div>

      {/* TAMPILAN DESKTOP (TABEL) */}
      <div className="hidden md:block bg-base-100 shadow-xl border border-base-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Tgl Masuk</th>
                <th>Nama Tamu</th>
                <th>Kamar</th>
                <th>Periode</th>
                <th>Nominal Pendapatan</th>
                <th>Status Kamar</th>
              </tr>
            </thead>
            <tbody>
              {laporan.map((t) => (
                <tr key={t.id} className="hover">
                  <td className="whitespace-nowrap">{t.tanggal_masuk}</td>
                  <td className="font-semibold">{t.nama}</td>
                  <td><div className="badge badge-outline">{t.kamar?.nomor_kamar || '-'}</div></td>
                  <td className="capitalize">{t.periode}</td>
                  <td className="font-bold text-success">Rp {t.harga?.toLocaleString('id-ID')}</td>
                  <td>
                    {t.tanggal_keluar
                      ? <span className="badge badge-ghost">Selesai</span>
                      : <span className="badge badge-success text-white">Masih Menghuni</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            {laporan.length > 0 && (
              <tfoot>
                <tr className="bg-base-200">
                  <th colSpan={4} className="text-right text-base">Total Pendapatan :</th>
                  <th className="text-left text-base text-success">Rp {totalPendapatan.toLocaleString('id-ID')}</th>
                  <th></th>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Layout>
  );
}
