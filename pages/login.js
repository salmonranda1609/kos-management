import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
    else router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-700 p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1 text-center">🏠 Kos-Kika</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Login Penjaga / Pemilik</p>

        {err && <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">{err}</div>}

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg p-2 mb-3 focus:ring-2 focus:ring-sky-500 outline-none"
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-sky-500 outline-none"
        />

        <button
          disabled={loading}
          className="w-full bg-sky-600 text-white rounded-lg py-2 font-semibold hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
