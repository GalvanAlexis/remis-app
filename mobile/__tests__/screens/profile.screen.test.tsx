// __tests__/screens/profile.screen.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockLogout = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F8FAFC',
      primary: '#3B82F6',
      divider: '#334155',
    },
    isDark: true,
    theme: 'dark',
  }),
}));

jest.mock('../../components/ThemeSelector', () => ({
  ThemeSelector: () => null,
}));

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'android', select: (obj: any) => obj.android },
    View: ({ children, ...p }: any) => React.createElement('View', p, children),
    Text: ({ children, ...p }: any) => React.createElement('Text', p, children),
    TouchableOpacity: ({ children, ...p }: any) => React.createElement('TouchableOpacity', p, children),
    ScrollView: ({ children, ...p }: any) => React.createElement('View', p, children),
    Image: ({ ...p }: any) => React.createElement('View', p),
    StyleSheet: { create: (s: any) => s, flatten: (s: any) => Array.isArray(s) ? Object.assign({}, ...s) : (s || {}) },
    Alert: { alert: jest.fn() },
  };
});

jest.mock('react-native-paper', () => {
  const React = require('react');

  return {
    Text: ({ children, ...p }: any) => React.createElement('Text', p, children),
    Card: Object.assign(
      ({ children, ...p }: any) => React.createElement('View', p, children),
      { Content: ({ children }: any) => React.createElement('View', null, children) }
    ),
    Button: ({ children, onPress, ...p }: any) => React.createElement('TouchableOpacity', { testID: String(children), onPress, ...p }, React.createElement('Text', null, children)),
    Divider: () => null,
    Chip: ({ children }: any) => React.createElement('Text', null, children),
    Avatar: {
      Icon: (props: any) => React.createElement('View', { testID: 'avatar-icon', ...props }),
    },
  };
});

import ProfileScreen from '../../app/(tabs)/profile';
import { useAuth } from '../../hooks/useAuth';

const mockUseAuth = useAuth as jest.Mock;

const mockUser = {
  id: 'u-123',
  username: 'juancho',
  role: 'CLIENTE',
  profile: {
    nombre: 'Juan',
    apellido: 'García',
    dni: '12345678',
    direccion: 'Av. Siempre Viva 123',
    profilePictureUrl: null,
  },
  driverDocument: null,
};

const mockChofer = {
  ...mockUser,
  role: 'CHOFER',
  driverDocument: {
    vehicleModel: 'Ford Ka',
    vehiclePlate: 'ABC-123',
    vehicleColor: 'Rojo',
  },
};

beforeEach(() => jest.clearAllMocks());

describe('ProfileScreen — sin usuario', () => {
  it('muestra "No hay usuario" si user es null', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: mockLogout });
    render(<ProfileScreen />);
    expect(screen.getByText('No hay usuario')).toBeTruthy();
  });
});

describe('ProfileScreen — cliente logueado', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser, logout: mockLogout });
  });

  it('muestra el nombre completo', () => {
    render(<ProfileScreen />);
    expect(screen.getByText(/Juan/)).toBeTruthy();
    expect(screen.getByText(/García/)).toBeTruthy();
  });

  it('muestra el username', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('juancho')).toBeTruthy();
  });

  it('muestra el rol CLIENTE', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('CLIENTE')).toBeTruthy();
  });

  it('muestra el DNI', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('12345678')).toBeTruthy();
  });

  it('muestra el botón Cerrar Sesión', () => {
    render(<ProfileScreen />);
    expect(screen.getByTestId('Cerrar Sesión')).toBeTruthy();
  });

  it('al presionar Cerrar Sesión abre Alert de confirmación', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId('Cerrar Sesión'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Cerrar Sesión',
      expect.any(String),
      expect.any(Array),
    );
    alertSpy.mockRestore();
  });
});

describe('ProfileScreen — chofer', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockChofer, logout: mockLogout });
  });

  it('muestra datos del vehículo', () => {
    render(<ProfileScreen />);
    expect(screen.getByText(/Ford Ka/)).toBeTruthy();
  });

  it('muestra el rol CHOFER', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('CHOFER')).toBeTruthy();
  });
});
