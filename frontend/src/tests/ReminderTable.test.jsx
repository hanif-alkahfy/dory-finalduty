import { render, screen, fireEvent } from '@testing-library/react';
import ReminderTable from '../components/ReminderTable';

const mockReminders = [
  {
    id: 1,
    phone_number: '120363XXXXXXXXXX@g.us',
    recipient_name: 'Grup Wisuda 2026',
    message: 'Reminder kehadiran wisuda',
    scheduled_time: '2026-06-01T08:00:00.000Z',
    recipient_type: 'group',
    status: 'pending',
  },
  {
    id: 2,
    phone_number: '6281234567890',
    recipient_name: null,
    message: 'Pesan sudah terkirim',
    scheduled_time: '2026-05-01T08:00:00.000Z',
    recipient_type: 'phone',
    status: 'sent',
  },
  {
    id: 3,
    phone_number: '6289876543210',
    recipient_name: null,
    message: 'Pesan gagal dikirim',
    scheduled_time: '2026-04-01T08:00:00.000Z',
    recipient_type: 'phone',
    status: 'failed',
  },
];

describe('ReminderTable', () => {
  test('menampilkan pesan kosong jika tidak ada reminder', () => {
    render(<ReminderTable reminders={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/Belum ada reminder/i)).toBeInTheDocument();
  });

  test('menampilkan semua reminder yang diberikan', () => {
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Reminder kehadiran wisuda')).toBeInTheDocument();
    expect(screen.getByText('Pesan sudah terkirim')).toBeInTheDocument();
    expect(screen.getByText('Pesan gagal dikirim')).toBeInTheDocument();
  });

  test('menampilkan recipient_name jika tersedia, bukan phone_number', () => {
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Grup Wisuda 2026')).toBeInTheDocument();
  });

  test('menampilkan phone_number jika recipient_name null', () => {
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('6281234567890')).toBeInTheDocument();
  });

  test('menampilkan StatusBadge untuk setiap reminder', () => {
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Menunggu')).toBeInTheDocument();
    expect(screen.getByText('Terkirim')).toBeInTheDocument();
    expect(screen.getByText('Gagal')).toBeInTheDocument();
  });

  test('tombol edit hanya muncul untuk reminder pending', () => {
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={vi.fn()} />);
    // Hanya 1 reminder pending → 1 tombol edit
    const editButtons = screen.getAllByTitle('Edit');
    expect(editButtons).toHaveLength(1);
  });

  test('tombol hapus muncul untuk semua reminder', () => {
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const deleteButtons = screen.getAllByTitle('Hapus');
    expect(deleteButtons).toHaveLength(3);
  });

  test('klik edit memanggil onEdit dengan data reminder', () => {
    const onEdit = vi.fn();
    render(<ReminderTable reminders={mockReminders} onEdit={onEdit} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockReminders[0]);
  });

  test('klik hapus memanggil onDelete dengan id reminder', () => {
    const onDelete = vi.fn();
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTitle('Hapus');
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  test('menampilkan label tipe "Grup" dan "Telepon"', () => {
    render(<ReminderTable reminders={mockReminders} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Grup')).toBeInTheDocument();
    expect(screen.getAllByText('Telepon')).toHaveLength(2);
  });
});
