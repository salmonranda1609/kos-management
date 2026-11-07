import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import { useReactToPrint } from 'react-to-print';

export default function TamuPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [tamu, setTamu] = useState([]);
  const [kamarSemua, setKamarSemua] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [form, setForm] = useState({
    nama: '', no_hp: '', kamar_id: '', periode: 'bulanan',
    tanggal_masuk: new Date().toISOString().slice(0, 10), harga: '', catatan: '',
  });
  const [loading, setLoading] = useState(false);

  const [printData, setPrintData] = useState(null);
  const componentRef = useRef();
  const handlePrint = useReactToPrint({ content: () => componentRef.current });

  const loadData = async () => {
    const { data: kamarAll } = await supabase.from('kamar').select('*').order('nomor_kamar');
    setKamarSemua(kamarAll || []);
    
    const { data } = await supabase.from('tamu').select('*, kamar(nomor_kamar)').order('created_at', { ascending: false });
    setTamu(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof?.role !== 'penjaga') return router.replace('/dashboard');
      setRole(prof.role);
      await loadData();
    })();
  }, [router]);

  const resetForm = () => {
    setForm({
      nama: '', no_hp: '', kamar_id: '', periode: 'bulanan',
      tanggal_masuk: new Date().toISOString().slice(0, 10), harga: '', catatan: '',
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (t) => {
    setForm({
      nama: t.nama, no_hp: t.no_hp, kamar_id: t.kamar_id || '',
      periode: t.periode, tanggal_masuk: t.tanggal_masuk,
      harga: t.harga || '', catatan: t.catatan || ''
    });
    setEditId(t.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      nama: form.nama, no_hp: form.no_hp,
      kamar_id: form.kamar_id ? parseInt(form.kamar_id) : null,
      periode: form.periode, tanggal_masuk: form.tanggal_masuk,
      harga: form.harga ? parseFloat(form.harga) : null,
      catatan: form.catatan || null,
    };

    let error;
    if (editId) {
      const res = await supabase.from('tamu').update(payload).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('tamu').insert(payload);
      error = res.error;
    }

    setLoading(false);
    if (error) return alert('Gagal: ' + error.message);
    
    resetForm();
    await loadData();
  };

  const checkOut = async (id) => {
    if (!confirm('Checkout tamu ini? Kamar akan menjadi kosong.')) return;
    await supabase.from('tamu').update({ tanggal_keluar: new Date().toISOString().slice(0, 10) }).eq('id', id);
    await loadData();
  };

  const triggerPrint = (t) => {
    setPrintData(t);
    setTimeout(() => handlePrint(), 100);
  };

  if (!role) return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <Layout role={role}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">📝 Data Tamu</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data penghuni kos</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className={`btn ${showForm ? 'btn-ghost' : 'btn-primary'} w-full sm:w-auto`}>
          {showForm ? '✖ Batal' : '+ Input Tamu Baru'}
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="card bg-base-100 shadow-xl mb-6 border border-base-200">
          <div className="card-body p-5 md:p-8">
            <h2 className="card-title text-lg mb-2">{editId ? 'Edit Data Tamu' : 'Form Tamu Baru'}</h2>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="form-control w-full">
                <label className="label pt-0"><span className="label-text font-semibold">Nama Lengkap *</span></label>
                <input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div className="form-control w-full">
                <label className="label pt-0"><span className="label-text font-semibold">No. HP *</span></label>
                <input required value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div className="form-control w-full">
                <label className="label pt-0"><span className="label-text font-semibold">Kamar *</span></label>
                <select required value={form.kamar_id} onChange={(e) => setForm({ ...form, kamar_id: e.target.value })} className="select select-bordered w-full">
                  <option value="">-- Pilih Kamar --</option>
                  {kamarSemua.filter(k => k.status === 'kosong' || k.id === parseInt(form.kamar_id)).map((k) => (
                    <option key={k.id} value={k.id}>Kamar {k.nomor_kamar} ({k.status})</option>
                  ))}
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label pt-0"><span className="label-text font-semibold">Periode *</span></label>
                <select required value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} className="select select-bordered w-full">
                  <option value="harian">Harian</option>
                  <option value="mingguan">Mingguan</option>
                  <option value="bulanan">Bulanan</option>
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label pt-0"><span className="label-text font-semibold">Tanggal Masuk *</span></label>
                <input type="date" required value={form.tanggal_masuk} onChange={(e) => setForm({ ...form, tanggal_masuk: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div className="form-control w-full">
                <label className="label pt-0"><span className="label-text font-semibold">Harga (Rp)</span></label>
                <input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div className="form-control w-full md:col-span-2">
                <label className="label pt-0"><span className="label-text font-semibold">Catatan</span></label>
                <textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="textarea textarea-bordered w-full" rows={2} />
              </div>
              <div className="md:col-span-2 mt-4 flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="btn btn-ghost">Batal</button>
                <button disabled={loading} className="btn btn-success text-white">
                  {loading ? <span className="loading loading-spinner"></span> : (editId ? '💾 Simpan Perubahan' : '💾 Simpan Tamu')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAMPILAN MOBILE (DESAIN LIST MODERN) */}
      {/* ======================================================== */}
      <div className="block md:hidden bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden">
        {tamu.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">Belum ada data tamu.</div>
        )}
        <div className="divide-y divide-base-200">
          {tamu.map((t) => {
            // Mengambil inisial nama (max 2 huruf)
            const initials = t.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            return (
              <div key={t.id} className="p-4 flex gap-3">
                {/* Avatar Inisial */}
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                    <span>{initials}</span>
                  </div>
                </div>
                
                {/* Info Tamu */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-base-content truncate">{t.nama}</h3>
                      <p className="text-[11px] text-gray-500">{t.no_hp}</p>
                    </div>
                    <div className="badge badge-primary badge-sm font-semibold text-[10px] whitespace-nowrap">Kmr {t.kamar?.nomor_kamar || '-'}</div>
                  </div>
                  
                  {/* Detail Waktu */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                      {t.tanggal_masuk}
                    </span>
                    <span className="capitalize px-1.5 py-0.5 bg-base-200 rounded text-[9px] font-medium">{t.periode}</span>
                    {t.tanggal_keluar ? (
                      <span className="text-gray-400">Selesai</span>
                    ) : (
                      <span className="text-success font-semibold">Aktif</span>
                    )}
                  </div>
                  
                  {/* Tombol Aksi (Kanan Bawah) */}
                  <div className="flex justify-end gap-1 mt-2">
                    <button onClick={() => handleEdit(t)} className="btn btn-xs btn-ghost text-gray-500 h-6 min-h-0 px-2 font-normal">Edit</button>
                    <button onClick={() => triggerPrint(t)} className="btn btn-xs btn-ghost text-info h-6 min-h-0 px-2 font-normal">Cetak</button>
                    {!t.tanggal_keluar && (
                      <button onClick={() => checkOut(t.id)} className="btn btn-xs btn-ghost text-error h-6 min-h-0 px-2 font-normal">Checkout</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAMPILAN DESKTOP (TABEL) */}
      {/* ======================================================== */}
      <div className="hidden md:block card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Nama Tamu</th>
                <th>Kamar</th>
                <th>Periode</th>
                <th>Tgl Masuk</th>
                <th>Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tamu.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Belum ada data tamu.</td></tr>
              )}
              {tamu.map((t) => (
                <tr key={t.id} className="hover">
                  <td>
                    <div className="font-bold">{t.nama}</div>
                    <div className="text-xs text-gray-500">{t.no_hp}</div>
                  </td>
                  <td><div className="badge badge-outline font-semibold">Kamar {t.kamar?.nomor_kamar || '-'}</div></td>
                  <td className="capitalize text-sm">{t.periode}</td>
                  <td className="text-sm whitespace-nowrap">{t.tanggal_masuk}</td>
                  <td>
                    {t.tanggal_keluar
                      ? <span className="badge badge-ghost badge-sm">Selesai</span>
                      : <span className="badge badge-success text-white badge-sm">Aktif</span>}
                  </td>
                  <td className="text-center">
                    <div className="flex flex-nowrap justify-center gap-1">
                      <button onClick={() => handleEdit(t)} className="btn btn-xs btn-warning btn-outline">Edit</button>
                      <button onClick={() => triggerPrint(t)} className="btn btn-xs btn-info btn-outline">Cetak</button>
                      {!t.tanggal_keluar && (
                        <button onClick={() => checkOut(t.id)} className="btn btn-xs btn-error btn-outline">Checkout</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TEMPLATE PRINT PDF ================= */}
      <div className="hidden">
        <div ref={componentRef} className="p-8 text-black font-sans w-[800px]">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-3xl font-bold uppercase">Bukti Masuk Kos</h1>
            <p className="text-sm">Kos App Management</p>
          </div>
          
          {printData && (
            <div className="space-y-3 text-base">
              <div className="grid grid-cols-3 gap-2"><span className="font-bold">Nama Lengkap</span><span>:</span><span>{printData.nama}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="font-bold">No. HP</span><span>:</span><span>{printData.no_hp}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="font-bold">Kamar</span><span>:</span><span>{printData.kamar?.nomor_kamar || '-'}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="font-bold">Periode</span><span>:</span><span className="capitalize">{printData.periode}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="font-bold">Tanggal Masuk</span><span>:</span><span>{printData.tanggal_masuk}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="font-bold">Harga</span><span>:</span><span>Rp {printData.harga ? printData.harga.toLocaleString('id-ID') : '-'}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="font-bold">Catatan</span><span>:</span><span>{printData.catatan || '-'}</span></div>
            </div>
          )}
          <div className="mt-16 text-right pr-12">
            <p className="mb-20">Penjaga Kos,</p>
            <p className="font-bold underline">_____________________</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
