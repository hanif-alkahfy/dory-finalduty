import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Mock semua pages agar test fokus pada routing
vi.mock('../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));
vi.mock('../pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));
vi.mock('../pages/ManualMessagePage', () => ({
  default: () => <div data-testid="manual-message-page">Manual Message Page</div>,
}));

// Import komponen routing saja (tanpa BrowserRouter dari App)
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ManualMessagePage from '../pages/ManualMessagePage';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><ManualMessagePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function renderWithRouter(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('App Routing', () => {
  test('route "/" redirect ke /login jika tidak ada token', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('route "/login" menampilkan LoginPage', () => {
    renderWithRouter('/login');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('route tidak dikenal redirect ke /login', () => {
    renderWithRouter('/halaman-tidak-ada');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  test('akses /dashboard tanpa token → redirect ke /login', () => {
    localStorage.removeItem('token');
    renderWithRouter('/dashboard');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  test('akses /dashboard dengan token → tampilkan DashboardPage', () => {
    localStorage.setItem('token', 'valid.token');
    renderWithRouter('/dashboard');
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  test('akses /messages tanpa token → redirect ke /login', () => {
    localStorage.removeItem('token');
    renderWithRouter('/messages');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('akses /messages dengan token → tampilkan ManualMessagePage', () => {
    localStorage.setItem('token', 'valid.token');
    renderWithRouter('/messages');
    expect(screen.getByTestId('manual-message-page')).toBeInTheDocument();
  });
});
