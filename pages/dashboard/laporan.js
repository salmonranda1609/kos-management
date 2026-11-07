import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

export default function LaporanPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Filter Bulan & Tahun
  const currentDate = new Date();
  const [bulan, setBulan] = useState(currentDate.getMonth() + 1); // 1-12
  const [tahun, setTahun] = useState(currentDate.getFullYear());

  const listBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const fetchLaporan = async () => {
    setLoading(true);
    
    // Tentukan awal dan akhir bulan berdasarkan filter
    const startDate = new Date(tahun, bulan - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('tamu')
      .select('*, kamar(nomor_kamar)')
      .not('harga', 'is', null)
      // Filter berdasarkan tanggal masuk (antara awal bulan dan akhir bulan)
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

  // Panggil ulang fetchLaporan jika filter bulan/tahun berubah
  useEffect(() => {
    if (role === 'pemilik') fetchLaporan();
  }, [bulan, tahun]);

  if (!role || loading) return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span></div>;

  // Hitung total pendapatan berdasarkan filter bulan ini
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

      {/* Kartu Rekap */}
      <div className="stats shadow w-full mb-6 bg-base-100 border border-base-300">
        <div className="stat">
          <div className="stat-title">Periode Laporan</div>
          <div className="stat-value text-primary text-xl md:text-2xl">{listBulan[bulan - 1]} {tahun}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Transaksi</div>
          <div className="stat-value text-secondary">{laporan.length} <span className="text-sm font-normal">Tamu</span></div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Pendapatan</div>
          <div className="stat-value text-success text-xl md:text-3xl">Rp {totalPendapatan.toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* Tabel Laporan */}
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
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
              {laporan.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Tidak ada data pendapatan pada bulan {listBulan[bulan - 1]} {tahun}.
                  </td>
                </tr>
              )}
              {laporan.map((t) => (
                <tr key={t.id}>
                  <td>{t.tanggal_masuk}</td>
                  <td className="font-semibold">{t.nama}</td>
                  <td><div className="badge badge-outline">{t.kamar?.nomor_kamar || '-'}</div></td>
                  <td className="capitalize">{t.periode}</td>
                  <td className="font-bold text-success">Rp {t.harga?.toLocaleString('id-ID')}</td>
                  <td>
                    {t.tanggal_keluar
                      ? <span className="badge badge-ghost">Selesai (Checkout)</span>
                      : <span className="badge badge-success text-white">Masih Menghuni</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            
            {/* Footer Total */}
            {laporan.length > 0 && (
              <tfoot>
                <tr className="bg-base-200">
                  <th colSpan={4} className="text-right text-lg">Total Pendapatan :</th>
                  <th className="text-left text-lg text-success">Rp {totalPendapatan.toLocaleString('id-ID')}</th>
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
