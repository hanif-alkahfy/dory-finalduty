import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ManualMessagePage() {
  const [form, setForm] = useState({
    recipient: '',
    message: '',
    recipient_type: 'group'
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipient || !form.message) {
      setStatus({ type: 'error', message: 'Penerima dan isi pesan wajib diisi' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/messages/send', form);
      setStatus({ type: 'success', message: res.data.message || 'Pesan berhasil dikirim!' });
      setForm({ ...form, message: '' }); // Reset message only
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim pesan.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard" 
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">Kirim Pesan Manual</h1>
        </div>

        {/* Card Form */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
          <p className="text-slate-400 text-sm mb-6">
            Gunakan halaman ini untuk mengirim pesan WhatsApp secara instan tanpa melalui sistem penjadwalan.
          </p>

          {status.message && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm ${
              status.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {status.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipe Penerima */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Tipe Penerima</label>
              <div className="flex flex-wrap gap-4">
                {['group', 'phone'].map((type) => (
                  <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="recipient_type"
                      value={type}
                      checked={form.recipient_type === type}
                      onChange={handleChange}
                      className="w-4 h-4 border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-slate-400 group-hover:text-slate-200 transition capitalize">
                      {type === 'phone' ? 'Nomor WhatsApp' : 'Grup WhatsApp'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-slate-300 mb-1.5">
                {form.recipient_type === 'phone' ? 'Nomor WhatsApp (628xxx)' : 'ID Grup WhatsApp'}
              </label>
              <input
                id="recipient"
                name="recipient"
                type="text"
                autoComplete="off"
                value={form.recipient}
                onChange={handleChange}
                placeholder={form.recipient_type === 'phone' ? '628123456789' : '1234567890@g.us'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1.5">Isi Pesan</label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={form.message}
                onChange={handleChange}
                placeholder="Tulis pesan yang ingin dikirim segera..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
              ></textarea>
            </div>

            {/* Submit */}
            <button
              id="btn-send-manual"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Mengirim...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Kirim Pesan Sekarang
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-slate-600 text-xs mt-8">
          Pastikan scan QR WhatsApp di server aktif agar pesan dapat terkirim.
        </p>
      </div>
    </div>
  );
}
