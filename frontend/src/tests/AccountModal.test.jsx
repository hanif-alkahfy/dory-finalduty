import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AccountModal from '../components/AccountModal';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  default: {
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import api from '../services/api';

function renderModal(onClose = vi.fn()) {
  return render(
    <AuthProvider>
      <AccountModal onClose={onClose} />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ─── Render & Navigasi Tab ────────────────────────────────────────────────

describe('AccountModal — render & tabs', () => {
  test('render modal dengan judul Kelola Akun', () => {
    renderModal();
    expect(screen.getByText('Kelola Akun')).toBeInTheDocument();
  });

  test('tab default adalah Ganti Email', () => {
    renderModal();
    expect(screen.getByPlaceholderText('email-baru@contoh.com')).toBeInTheDocument();
  });

  test('klik tab Ganti Password menampilkan form password', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText('Ganti Password'));
    expect(screen.getByText('Password Saat Ini')).toBeInTheDocument();
    expect(screen.getByText('Password Baru')).toBeInTheDocument();
    expect(screen.getByText('Konfirmasi Password Baru')).toBeInTheDocument();
  });

  test('klik tab Hapus Akun menampilkan warning dan form konfirmasi', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText('Hapus Akun'));
    expect(screen.getByText(/Tindakan ini tidak dapat dibatalkan/i)).toBeInTheDocument();
    expect(screen.getByText('Hapus Akun Saya')).toBeInTheDocument();
  });

  test('klik tombol X memanggil onClose', () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.click(screen.getByRole('button', { name: '' })); // tombol X
    // Cari tombol close (svg X)
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(b => b.querySelector('svg'));
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Tab Ganti Email ──────────────────────────────────────────────────────

describe('AccountModal — Ganti Email', () => {
  test('submit form kosong → error validasi', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText('Simpan Email Baru'));
    expect(screen.getByText('Semua field wajib diisi')).toBeInTheDocument();
  });

  test('berhasil ganti email → tampilkan pesan sukses', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByPlaceholderText('email-baru@contoh.com'), 'baru@test.com');
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'password123');
    await user.click(screen.getByText('Simpan Email Baru'));

    await waitFor(() => {
      expect(screen.getByText(/Email berhasil diperbarui/i)).toBeInTheDocument();
    });
    expect(api.put).toHaveBeenCalledWith('/auth/account/email', {
      new_email: 'baru@test.com',
      current_password: 'password123',
    });
  });

  test('API error → tampilkan pesan error dari server', async () => {
    const user = userEvent.setup();
    api.put.mockRejectedValue({
      response: { data: { message: 'Password saat ini tidak sesuai' } },
    });
    renderModal();

    await user.type(screen.getByPlaceholderText('email-baru@contoh.com'), 'baru@test.com');
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'salah');
    await user.click(screen.getByText('Simpan Email Baru'));

    await waitFor(() => {
      expect(screen.getByText('Password saat ini tidak sesuai')).toBeInTheDocument();
    });
  });
});

// ─── Tab Ganti Password ───────────────────────────────────────────────────

describe('AccountModal — Ganti Password', () => {
  async function goToPasswordTab() {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText('Ganti Password'));
    return user;
  }

  test('submit form kosong → error validasi', async () => {
    const user = await goToPasswordTab();
    await user.click(screen.getByText('Simpan Password Baru'));
    expect(screen.getByText('Semua field wajib diisi')).toBeInTheDocument();
  });

  test('konfirmasi password tidak cocok → error', async () => {
    const user = await goToPasswordTab();
    await user.type(screen.getByLabelText('Password Saat Ini'), 'lama123');
    await user.type(screen.getByLabelText('Password Baru'), 'baru123');
    await user.type(screen.getByLabelText('Konfirmasi Password Baru'), 'berbeda');
    await user.click(screen.getByText('Simpan Password Baru'));
    expect(screen.getByText('Konfirmasi password tidak cocok')).toBeInTheDocument();
  });

  test('password baru < 6 karakter → error', async () => {
    const user = await goToPasswordTab();
    await user.type(screen.getByLabelText('Password Saat Ini'), 'lama123');
    await user.type(screen.getByLabelText('Password Baru'), '123');
    await user.type(screen.getByLabelText('Konfirmasi Password Baru'), '123');
    await user.click(screen.getByText('Simpan Password Baru'));
    expect(screen.getByText('Password baru minimal 6 karakter')).toBeInTheDocument();
  });

  test('berhasil ganti password → tampilkan pesan sukses', async () => {
    api.put.mockResolvedValue({});
    const user = await goToPasswordTab();
    await user.type(screen.getByLabelText('Password Saat Ini'), 'lama123');
    await user.type(screen.getByLabelText('Password Baru'), 'baru123456');
    await user.type(screen.getByLabelText('Konfirmasi Password Baru'), 'baru123456');
    await user.click(screen.getByText('Simpan Password Baru'));

    await waitFor(() => {
      expect(screen.getByText(/Password berhasil diperbarui/i)).toBeInTheDocument();
    });
    expect(api.put).toHaveBeenCalledWith('/auth/account/password', {
      current_password: 'lama123',
      new_password: 'baru123456',
    });
  });
});

// ─── Tab Hapus Akun ───────────────────────────────────────────────────────

describe('AccountModal — Hapus Akun', () => {
  async function goToDeleteTab() {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText('Hapus Akun'));
    return user;
  }

  test('submit tanpa password → error validasi', async () => {
    const user = await goToDeleteTab();
    await user.click(screen.getByText('Hapus Akun Saya'));
    expect(screen.getByText('Password wajib diisi untuk konfirmasi')).toBeInTheDocument();
  });

  test('password salah → tampilkan error dari server', async () => {
    api.delete.mockRejectedValue({
      response: { data: { message: 'Password tidak sesuai' } },
    });
    const user = await goToDeleteTab();
    await user.type(screen.getByPlaceholderText(/Masukkan password/i), 'salah');
    await user.click(screen.getByText('Hapus Akun Saya'));

    await waitFor(() => {
      expect(screen.getByText('Password tidak sesuai')).toBeInTheDocument();
    });
  });

  test('berhasil hapus akun → tampilkan pesan sukses', async () => {
    api.delete.mockResolvedValue({});
    const user = await goToDeleteTab();
    await user.type(screen.getByPlaceholderText(/Masukkan password/i), 'benar123');
    await user.click(screen.getByText('Hapus Akun Saya'));

    await waitFor(() => {
      expect(screen.getByText('Akun berhasil dihapus.')).toBeInTheDocument();
    });
    expect(api.delete).toHaveBeenCalledWith('/auth/account', {
      data: { current_password: 'benar123' },
    });
  });
});
