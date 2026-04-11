import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Komponen helper untuk mengakses context
function TestConsumer() {
  const { token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'null'}</span>
      <button onClick={() => login('test.token.123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('token awal null jika localStorage kosong', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('null');
  });

  test('token awal diambil dari localStorage jika ada', () => {
    localStorage.setItem('token', 'existing.token');
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('existing.token');
  });

  test('login() menyimpan token ke state dan localStorage', async () => {
    const user = userEvent.setup();
    render(<AuthProvider><TestConsumer /></AuthProvider>);

    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    expect(screen.getByTestId('token').textContent).toBe('test.token.123');
    expect(localStorage.getItem('token')).toBe('test.token.123');
  });

  test('logout() menghapus token dari state dan localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'existing.token');

    render(<AuthProvider><TestConsumer /></AuthProvider>);

    await act(async () => {
      await user.click(screen.getByText('Logout'));
    });

    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('useAuth() throw error jika digunakan di luar AuthProvider', () => {
    // Suppress console.error untuk test ini
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth harus digunakan di dalam AuthProvider'
    );

    spy.mockRestore();
  });
});
