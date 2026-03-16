// __tests__/screens/stats.screen.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import StatsScreen from '../../app/(tabs)/stats';
import { useAuth } from '../../hooks/useAuth';

// ─── 1. API mock ─────────────────────────────────────────────────────────────
// IMPORTANTE: no podemos referenciar variables externas dentro de jest.mock() por hoisting.
// Usamos jest.requireMock() para obtener la referencia después.

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

// ─── 2. Hooks / Contexts ─────────────────────────────────────────────────────

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({
    colors: {
      primary: '#2563EB',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F8FAFC',
    },
  }),
}));

// ─── 3. React Native — mock mínimo con children propagados ───────────────────

jest.mock('react-native', () => {
  const React = require('react');
  const rn: any = {
    Platform: { OS: 'android', select: (obj: any) => obj.android },
    StyleSheet: {
      create: (s: any) => s,
      flatten: (s: any) =>
        Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean)) : (s ?? {}),
    },
    Dimensions: { get: () => ({ width: 400, height: 800 }) },
    View: ({ children, ...p }: any) =>
      React.createElement('View', p, children),
    Text: ({ children, ...p }: any) =>
      React.createElement('Text', p, children),
    TouchableOpacity: ({ children, onPress, ...p }: any) =>
      React.createElement('TouchableOpacity', { onPress, ...p }, children),
    ScrollView: ({ children, ...p }: any) =>
      React.createElement('View', p, children),
    ActivityIndicator: ({ ...p }: any) =>
      React.createElement('View', { testID: 'loading', ...p }),
    FlatList: ({ data, renderItem, keyExtractor, ...p }: any) =>
      React.createElement(
        'View',
        p,
        data
          ? data.map((item: any, index: number) =>
              renderItem({ item, index, separators: {} as any })
            )
          : null,
      ),
    Alert: { alert: jest.fn() },
    Image: ({ ...p }: any) => React.createElement('View', p),
    KeyboardAvoidingView: ({ children, ...p }: any) =>
      React.createElement('View', p, children),
  };
  return rn;
});

// ─── 4. React Native Paper — mock liviano con children propagados ─────────────

jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    Text: ({ children, ...p }: any) =>
      React.createElement('Text', p, children),
    Surface: ({ children, ...p }: any) =>
      React.createElement('View', p, children),
    Button: ({ children, onPress, ...p }: any) =>
      React.createElement(
        'TouchableOpacity',
        { testID: String(children), onPress, ...p },
        React.createElement('Text', null, children),
      ),
    Chip: ({ children, onPress, testID, ...p }: any) =>
      React.createElement(
        'TouchableOpacity',
        { testID: testID ?? `chip-${String(children).replace(/\s+/g, '-')}`, onPress },
        React.createElement('Text', null, children),
      ),
    Divider: () => null,
    ProgressBar: () => null,
    Card: Object.assign(
      ({ children, ...p }: any) => React.createElement('View', p, children),
      {
        Content: ({ children, ...p }: any) =>
          React.createElement('View', p, children),
        Title: ({ title, ...p }: any) =>
          React.createElement('Text', p, title),
      },
    ),
  };
});

// ─── 5. Iconos ───────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    MaterialCommunityIcons: () =>
      React.createElement('View', { testID: 'mocked-icon' }),
  };
});

// ─── 6. SafeAreaContext ───────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, ...p }: any) =>
      React.createElement('View', p, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// ─── 7. Datos de prueba y setup ──────────────────────────────────────────────

const mockUseAuth = useAuth as jest.Mock;
// Recuperamos la referencia al mock de api.get (creado con jest.fn() dentro del factory)
const mockApiGet = jest.requireMock('../../services/api').default.get as jest.Mock;

const freeStats = {
  totalRides: 42,
  earningsThisMonth: 15000,
  avgRating: 4.8,
  totalRatings: 30,
  history: [
    {
      id: 'ride-1',
      origin: 'Centro',
      dest: 'Terminal',
      price: 800,
      date: '2026-03-01T10:00:00Z',
    },
  ],
};

beforeEach(() => jest.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('StatsScreen — acceso por rol', () => {
  it('muestra mensaje de restricción si el user es CLIENTE', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'CLIENTE', id: 'u1' } });
    render(<StatsScreen />);
    expect(screen.getByText(/Solo disponible para choferes/)).toBeTruthy();
  });
});

describe('StatsScreen — CHOFER logueado, tab básico', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { role: 'CHOFER', id: 'chofer-1' } });
    mockApiGet.mockResolvedValue({ data: freeStats });
  });

  it('carga y muestra el totalRides del free plan', async () => {
    render(<StatsScreen />);
    // findByText espera hasta que aparezca (timeout 1000ms por defecto)
    const el = await screen.findByText('42');
    expect(el).toBeTruthy();
  });

  it('llama a GET /stats/free al montar el componente', async () => {
    render(<StatsScreen />);
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/stats/free');
    });
  });

  it('muestra el historial de viajes', async () => {
    render(<StatsScreen />);
    const el = await screen.findByText('Centro');
    expect(el).toBeTruthy();
  });
});

describe('StatsScreen — tab Premium bloqueado (403)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { role: 'CHOFER', id: 'chofer-1' } });
    mockApiGet
      .mockResolvedValueOnce({ data: freeStats })
      .mockRejectedValueOnce({ response: { status: 403 } });
  });

  it('muestra el paywall al navegar al tab Premium con 403', async () => {
    render(<StatsScreen />);

    // Esperar a que carguen los datos libres
    await screen.findByText('42');

    await act(async () => {
      fireEvent.press(screen.getByTestId('chip-👑-Premium'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Estadísticas Premium/)).toBeTruthy();
    });
  });
});
