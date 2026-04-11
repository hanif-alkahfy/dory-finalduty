import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  test('menampilkan label "Menunggu" untuk status pending', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Menunggu')).toBeInTheDocument();
  });

  test('menampilkan label "Terkirim" untuk status sent', () => {
    render(<StatusBadge status="sent" />);
    expect(screen.getByText('Terkirim')).toBeInTheDocument();
  });

  test('menampilkan label "Gagal" untuk status failed', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('Gagal')).toBeInTheDocument();
  });

  test('menampilkan status mentah jika tidak dikenal', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  test('memiliki class warna kuning untuk pending', () => {
    const { container } = render(<StatusBadge status="pending" />);
    expect(container.firstChild).toHaveClass('text-yellow-400');
  });

  test('memiliki class warna hijau untuk sent', () => {
    const { container } = render(<StatusBadge status="sent" />);
    expect(container.firstChild).toHaveClass('text-green-400');
  });

  test('memiliki class warna merah untuk failed', () => {
    const { container } = render(<StatusBadge status="failed" />);
    expect(container.firstChild).toHaveClass('text-red-400');
  });
});
