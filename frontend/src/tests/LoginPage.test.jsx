import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthContext';

// Mock api module
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../services/api';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('LoginPage', () => {
  test('render form login dengan field email dan password', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument();
  });

  test('menampilkan error jika submit form kosong', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /masuk/i }));
    expect(screen.getByText('Email dan password wajib diisi')).toBeInTheDocument();
  });

  test('menampilkan error jika hanya email diisi', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.click(screen.getByRole('button', { name: /masuk/i }));
    expect(screen.getByText('Email dan password wajib diisi')).toBeInTheDocument();
  });

  test('login berhasil → simpan token dan redirect ke dashboard', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { data: { token: 'jwt.token.here' } } });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('jwt.token.here');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  test('login gagal 401 → tampilkan pesan error dari API', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Email atau password salah' } },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText('Email atau password salah')).toBeInTheDocument();
    });
  });

  test('login gagal tanpa response → tampilkan pesan fallback', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue(new Error('Network Error'));

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText('Terjadi kesalahan. Coba lagi.')).toBeInTheDocument();
    });
  });

  test('tombol disabled saat loading', async () => {
    const user = userEvent.setup();
    // Buat promise yang tidak resolve segera
    api.post.mockImplementation(() => new Promise(() => {}));

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /memproses/i })).toBeDisabled();
    });
  });

  test('error dihapus saat user mulai mengetik', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // Trigger error dulu
    await user.click(screen.getByRole('button', { name: /masuk/i }));
    expect(screen.getByText('Email dan password wajib diisi')).toBeInTheDocument();

    // Mulai ketik → error hilang
    await user.type(screen.getByLabelText(/email/i), 'a');
    expect(screen.queryByText('Email dan password wajib diisi')).not.toBeInTheDocument();
  });
});
