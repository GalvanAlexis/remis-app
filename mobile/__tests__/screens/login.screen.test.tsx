// __tests__/screens/login.screen.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockLogin = jest.fn();
const mockShowWarning = jest.fn();
const mockShowError = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showWarning: mockShowWarning,
    showError: mockShowError,
    showInfo: jest.fn(),
    showSuccess: jest.fn(),
  }),
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

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: jest.fn(),
  }),
}));

// En jsdom (necesario para @testing-library/react-native), react-native tira undefined
// en Platform. Mockamos las dependencias directo.
jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'android', select: (obj: any) => obj.android },
    View: ({ children, ...p }: any) => React.createElement('View', p, children),
    Text: ({ children, ...p }: any) => React.createElement('Text', p, children),
    TextInput: ({ children, ...p }: any) => React.createElement('TextInput', p, children),
    TouchableOpacity: ({ children, ...p }: any) => React.createElement('TouchableOpacity', p, children),
    ScrollView: ({ children, ...p }: any) => React.createElement('ScrollView', p, children),
    KeyboardAvoidingView: ({ children, ...p }: any) => React.createElement('View', p, children),
    StyleSheet: { create: (s: any) => s, flatten: (s: any) => Array.isArray(s) ? Object.assign({}, ...s) : (s || {}) },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, ...p }: any) => React.createElement('View', p, children),
  };
});

// Mock limpio para Paper sin tocar el react-native original que rompe
jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    Text: ({ children, ...p }: any) => React.createElement('Text', p, children),
    TextInput: ({ label, value, onChangeText, ...p }: any) => React.createElement('TextInput', { testID: label, value, onChangeText, accessibilityLabel: label, ...p }),
    Button: ({ children, onPress, loading, ...p }: any) => React.createElement('TouchableOpacity', { testID: String(children), onPress, ...p }, React.createElement('Text', null, loading ? 'Cargando...' : children)),
    Surface: ({ children, ...p }: any) => React.createElement('View', p, children),
  };
});

import LoginScreen from '../../app/(auth)/login';

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────

describe('LoginScreen — renderizado', () => {
  it('muestra el título REMIS APP', () => {
    render(<LoginScreen />);
    expect(screen.getByText('REMIS APP')).toBeTruthy();
  });

  it('muestra los campos de usuario y contraseña', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('Nombre de usuario')).toBeTruthy();
    expect(screen.getByTestId('Contraseña')).toBeTruthy();
  });

  it('muestra el botón Ingresar', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('Ingresar')).toBeTruthy();
  });
});

describe('LoginScreen — validación', () => {
  it('muestra warning si se presiona Ingresar con campos vacíos', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('Ingresar'));
    expect(mockShowWarning).toHaveBeenCalledWith(
      'Campos incompletos',
      expect.any(String),
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

describe('LoginScreen — login exitoso', () => {
  it('llama a login() con usuario y password correctos', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('Nombre de usuario'), 'juancho');
    fireEvent.changeText(screen.getByTestId('Contraseña'), 'password123');
    fireEvent.press(screen.getByTestId('Ingresar'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'juancho',
        password: 'password123',
      });
    });
  });

  it('muestra toast de error si login falla con mensaje del servidor', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Credenciales incorrectas' } },
    });
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('Nombre de usuario'), 'x');
    fireEvent.changeText(screen.getByTestId('Contraseña'), 'x');
    fireEvent.press(screen.getByTestId('Ingresar'));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        'No pudimos iniciar sesión',
        'Credenciales incorrectas',
      );
    });
  });
});

describe('LoginScreen — navegación', () => {
  it('navega al registro al presionar "¿No tienes cuenta? Regístrate"', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('¿No tienes cuenta? Regístrate'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/register-choice');
  });

  it('navega al welcome al presionar "Volver al inicio"', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('Volver al inicio'));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/welcome');
  });
});
