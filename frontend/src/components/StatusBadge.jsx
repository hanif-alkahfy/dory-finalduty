export default function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    sent: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labels = {
    pending: 'Menunggu',
    sent: 'Terkirim',
    failed: 'Gagal',
  };

  const style = styles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {label}
    </span>
  );
}
