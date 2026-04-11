import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReminderForm from '../components/ReminderForm';

const futureDateTime = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

describe('ReminderForm', () => {
  test('render form buat reminder baru', () => {
    render(<ReminderForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Buat Reminder Baru')).toBeInTheDocument();
  });

  test('render form edit jika initialData diberikan', () => {
    const initialData = {
      id: 1,
      phone_number: '120363XXXXXXXXXX@g.us',
      message: 'Pesan lama',
      scheduled_time: new Date(Date.now() + 3600000).toISOString(),
      recipient_type: 'group',
    };
    render(<ReminderForm initialData={initialData} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Edit Reminder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pesan lama')).toBeInTheDocument();
  });

  test('klik batal memanggil onCancel', () => {
    const onCancel = vi.fn();
    render(<ReminderForm onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Batal'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('klik tombol X memanggil onCancel', () => {
    const onCancel = vi.fn();
    render(<ReminderForm onSave={vi.fn()} onCancel={onCancel} />);
    // Tombol X adalah button pertama di header
    const closeBtn = screen.getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  test('submit form kosong menampilkan error validasi', async () => {
    const user = userEvent.setup();
    render(<ReminderForm onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByText('Simpan Reminder'));
    expect(screen.getByText('Semua field wajib diisi')).toBeInTheDocument();
  });

  test('validasi format nomor HP saat recipient_type=phone', async () => {
    const user = userEvent.setup();
    render(<ReminderForm onSave={vi.fn()} onCancel={vi.fn()} />);

    // Pilih tipe phone
    await user.click(screen.getByDisplayValue('phone'));

    // Isi form dengan nomor salah
    await user.type(screen.getByPlaceholderText(/628123456789/), '08123456789');
    await user.type(screen.getByPlaceholderText(/Tulis pesan/), 'Halo');
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: futureDateTime() } });

    await user.click(screen.getByText('Simpan Reminder'));
    expect(screen.getByText(/Format nomor HP tidak valid/i)).toBeInTheDocument();
  });

  test('tidak validasi format nomor saat recipient_type=group', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue();
    render(<ReminderForm onSave={onSave} onCancel={vi.fn()} />);

    // Default sudah group, isi dengan group ID
    await user.type(screen.getByPlaceholderText(/1234567890@g.us/), '120363XXXXXXXXXX@g.us');
    await user.type(screen.getByPlaceholderText(/Tulis pesan/), 'Reminder wisuda');
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: futureDateTime() } });

    await user.click(screen.getByText('Simpan Reminder'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
    expect(screen.queryByText(/Format nomor HP tidak valid/i)).not.toBeInTheDocument();
  });

  test('onSave dipanggil dengan data form yang benar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue();
    render(<ReminderForm onSave={onSave} onCancel={vi.fn()} />);

    const time = futureDateTime();
    await user.type(screen.getByPlaceholderText(/1234567890@g.us/), '120363XXXXXXXXXX@g.us');
    await user.type(screen.getByPlaceholderText(/Tulis pesan/), 'Reminder wisuda');
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: time } });

    await user.click(screen.getByText('Simpan Reminder'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          phone_number: '120363XXXXXXXXXX@g.us',
          message: 'Reminder wisuda',
          recipient_type: 'group',
        })
      );
    });
  });

  test('default recipient_type adalah group', () => {
    render(<ReminderForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByDisplayValue('group')).toBeChecked();
  });
});
