import { useState, useEffect } from 'react';

// Helper untuk format tanggal ke format input datetime-local (YYYY-MM-DDTHH:mm)
function formatToDateTimeLocal(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const pad = (num) => String(num).padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ReminderForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({
    phone_number: '',
    message: '',
    scheduled_time: '',
    recipient_type: 'group'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        scheduled_time: formatToDateTimeLocal(initialData.scheduled_time)
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi dasar
    if (!form.phone_number || !form.message || !form.scheduled_time) {
      setError('Semua field wajib diisi');
      return;
    }

    // Validasi nomor telepon jika tipe 'phone'
    if (form.recipient_type === 'phone' && !/^628\d{7,12}$/.test(form.phone_number)) {
      setError('Format nomor HP tidak valid (gunakan 628xxx)');
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan reminder';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {initialData ? 'Edit Reminder' : 'Buat Reminder Baru'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Tipe Penerima */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Tipe Penerima</label>
              <div className="flex gap-4">
                {['group', 'phone'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="recipient_type"
                      value={type}
                      checked={form.recipient_type === type}
                      onChange={handleChange}
                      className="w-4 h-4 border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition capitalize">
                      {type === 'phone' ? 'Nomor WhatsApp' : 'Grup WhatsApp'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ID / Nomor */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {form.recipient_type === 'phone' ? 'Nomor (Contoh: 628xxx)' : 'ID Grup WhatsApp'}
              </label>
              <input
                type="text"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder={form.recipient_type === 'phone' ? '628123456789' : '1234567890@g.us'}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>

            {/* Waktu Kirim */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Jadwal Pengiriman</label>
              <input
                type="datetime-local"
                name="scheduled_time"
                value={form.scheduled_time}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>

            {/* Pesan */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Isi Pesan</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows="4"
                placeholder="Tulis pesan pengingat di sini..."
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
              ></textarea>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              id="btn-cancel"
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
            >
              Batal
            </button>
            <button
              id="btn-save"
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-bold transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Menyimpan...
                </>
              ) : 'Simpan Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
