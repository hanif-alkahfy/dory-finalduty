import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TAB = { EMAIL: 'email', PASSWORD: 'password', DELETE: 'delete' };

export default function AccountModal({ onClose }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState(TAB.EMAIL);

  // Form states
  const [emailForm, setEmailForm]     = useState({ new_email: '', current_password: '' });
  const [passForm, setPassForm]       = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [deleteForm, setDeleteForm]   = useState({ current_password: '' });

  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  const reset = () => { setSuccess(''); setError(''); };

  // ── Ganti Email ──────────────────────────────────────────────────────────
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    reset();
    if (!emailForm.new_email || !emailForm.current_password) {
      return setError('Semua field wajib diisi');
    }
    setLoading(true);
    try {
      await api.put('/auth/account/email', emailForm);
      setSuccess('Email berhasil diperbarui. Silakan login ulang.');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui email');
    } finally {
      setLoading(false);
    }
  };

  // ── Ganti Password ───────────────────────────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    reset();
    if (!passForm.current_password || !passForm.new_password || !passForm.confirm_password) {
      return setError('Semua field wajib diisi');
    }
    if (passForm.new_password !== passForm.confirm_password) {
      return setError('Konfirmasi password tidak cocok');
    }
    if (passForm.new_password.length < 6) {
      return setError('Password baru minimal 6 karakter');
    }
    setLoading(true);
    try {
      await api.put('/auth/account/password', {
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      setSuccess('Password berhasil diperbarui. Silakan login ulang.');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setLoading(false);
    }
  };

  // ── Hapus Akun ───────────────────────────────────────────────────────────
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    reset();
    if (!deleteForm.current_password) {
      return setError('Password wajib diisi untuk konfirmasi');
    }
    setLoading(true);
    try {
      await api.delete('/auth/account', { data: { current_password: deleteForm.current_password } });
      setSuccess('Akun berhasil dihapus.');
      setTimeout(() => logout(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (t) =>
    `flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
      tab === t
        ? 'bg-slate-700 text-white'
        : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Kelola Akun</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl">
            <button className={tabClass(TAB.EMAIL)}   onClick={() => { setTab(TAB.EMAIL);    reset(); }}>Ganti Email</button>
            <button className={tabClass(TAB.PASSWORD)} onClick={() => { setTab(TAB.PASSWORD); reset(); }}>Ganti Password</button>
            <button className={tabClass(TAB.DELETE)}  onClick={() => { setTab(TAB.DELETE);   reset(); }}>Hapus Akun</button>
          </div>
        </div>

        {/* Alert */}
        <div className="px-6 pt-3">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}
        </div>

        {/* ── Tab: Ganti Email ── */}
        {tab === TAB.EMAIL && (
          <form onSubmit={handleUpdateEmail} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Baru</label>
              <input
                type="email"
                value={emailForm.new_email}
                onChange={e => setEmailForm(f => ({ ...f, new_email: e.target.value }))}
                placeholder="email-baru@contoh.com"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password Saat Ini</label>
              <input
                type="password"
                value={emailForm.current_password}
                onChange={e => setEmailForm(f => ({ ...f, current_password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Menyimpan...</> : 'Simpan Email Baru'}
            </button>
          </form>
        )}

        {/* ── Tab: Ganti Password ── */}
        {tab === TAB.PASSWORD && (
          <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
            <div>
              <label htmlFor="cur-pass" className="block text-sm font-medium text-slate-300 mb-1.5">Password Saat Ini</label>
              <input
                id="cur-pass"
                type="password"
                value={passForm.current_password}
                onChange={e => setPassForm(f => ({ ...f, current_password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>
            <div>
              <label htmlFor="new-pass" className="block text-sm font-medium text-slate-300 mb-1.5">Password Baru</label>
              <input
                id="new-pass"
                type="password"
                value={passForm.new_password}
                onChange={e => setPassForm(f => ({ ...f, new_password: e.target.value }))}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>
            <div>
              <label htmlFor="confirm-pass" className="block text-sm font-medium text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
              <input
                id="confirm-pass"
                type="password"
                value={passForm.confirm_password}
                onChange={e => setPassForm(f => ({ ...f, confirm_password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Menyimpan...</> : 'Simpan Password Baru'}
            </button>
          </form>
        )}

        {/* ── Tab: Hapus Akun ── */}
        {tab === TAB.DELETE && (
          <form onSubmit={handleDeleteAccount} className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <p className="font-semibold mb-1">⚠ Tindakan ini tidak dapat dibatalkan</p>
              <p>Semua data reminder dan riwayat pengiriman akan ikut terhapus secara permanen.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Konfirmasi Password</label>
              <input
                type="password"
                value={deleteForm.current_password}
                onChange={e => setDeleteForm({ current_password: e.target.value })}
                placeholder="Masukkan password untuk konfirmasi"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Menghapus...</> : 'Hapus Akun Saya'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
