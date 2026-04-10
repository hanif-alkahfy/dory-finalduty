import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReminderTable from '../components/ReminderTable';
import ReminderForm from '../components/ReminderForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function DashboardPage() {
  const { logout } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State untuk Modal Form
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  
  // State untuk Modal Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reminders');
      setReminders(res.data.data);
      setError('');
    } catch (err) {
      setError('Gagal memuat data reminder.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleCreate = () => {
    setEditingReminder(null);
    setShowForm(true);
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleDeleteRequest = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/reminders/${deletingId}`);
      setShowDeleteModal(false);
      setDeletingId(null);
      fetchReminders();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus reminder');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingReminder) {
        await api.put(`/reminders/${editingReminder.id}`, data);
      } else {
        await api.post('/reminders', data);
      }
      setShowForm(false);
      fetchReminders();
    } catch (err) {
      // Error ditangani di dalam ReminderForm (throw error kembali ke form)
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Navbar Minimalis */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">DoryMind</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                id="btn-manual"
                to="/messages"
                className="text-sm text-slate-400 hover:text-white transition hidden sm:block font-medium"
              >
                Pesan Manual
              </Link>
              <button
                id="btn-logout"
                onClick={logout}
                className="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Reminder Manager</h1>
            <p className="text-slate-400 text-sm">Kelola jadwal pengiriman pesan WhatsApp otomatis Anda.</p>
          </div>
          <button
            id="btn-add-reminder"
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg shadow-violet-500/20 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Reminder
          </button>
        </div>

        {/* Content Section */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <svg className="w-10 h-10 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-slate-500">Memuat data...</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-red-400">{error}</p>
              <button onClick={fetchReminders} className="mt-4 text-violet-400 hover:underline text-sm font-medium">Coba lagi</button>
            </div>
          ) : (
            <ReminderTable 
              reminders={reminders} 
              onEdit={handleEdit} 
              onDelete={handleDeleteRequest} 
            />
          )}
        </div>
      </main>

      {/* Modal Form */}
      {showForm && (
        <ReminderForm 
          initialData={editingReminder} 
          onSave={handleSave} 
          onCancel={() => setShowForm(false)} 
        />
      )}
      
      {/* Modal Delete */}
      <DeleteConfirmModal 
        isOpen={showDeleteModal}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <footer className="py-6 border-t border-slate-800/50 text-center text-slate-600 text-xs">
        DoryMind System &copy; {new Date().getFullYear()} – All Rights Reserved
      </footer>
    </div>
  );
}
