import StatusBadge from './StatusBadge';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ReminderTable({ reminders, onEdit, onDelete }) {
  if (reminders.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">Belum ada reminder. Buat yang pertama!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
          <tr>
            <th className="px-4 py-3">Penerima</th>
            <th className="px-4 py-3">Pesan</th>
            <th className="px-4 py-3">Waktu Kirim</th>
            <th className="px-4 py-3">Tipe</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {reminders.map((r) => (
            <tr key={r.id} className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
              <td className="px-4 py-3 font-mono text-slate-300 max-w-[160px] truncate">
                {r.phone_number}
              </td>
              <td className="px-4 py-3 text-slate-300 max-w-[200px]">
                <span className="line-clamp-2">{r.message}</span>
              </td>
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                {formatDate(r.scheduled_time)}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  r.recipient_type === 'phone'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {r.recipient_type === 'phone' ? 'Telepon' : 'Grup'}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {r.status === 'pending' && (
                    <button
                      onClick={() => onEdit(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {r.status !== 'sent' && (
                    <button
                      onClick={() => onDelete(r.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Hapus"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
