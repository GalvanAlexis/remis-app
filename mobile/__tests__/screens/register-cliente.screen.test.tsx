// __tests__/screens/register-cliente.screen.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockRegister = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isAuthenticated: false,
    isLoading: false,
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

jest.mock('../../components/ThemeSelector', () => ({
  ThemeSelector: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
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
    Alert: { alert: jest.fn() },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, ...p }: any) => React.createElement('View', p, children),
  };
});

jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    Text: ({ children, ...p }: any) => React.createElement('Text', p, children),
    TextInput: ({ label, value, onChangeText, ...p }: any) => React.createElement('TextInput', { testID: label, value, onChangeText, accessibilityLabel: label, ...p }),
    Button: ({ children, onPress, loading, ...p }: any) => React.createElement('TouchableOpacity', { testID: String(children), onPress, ...p }, React.createElement('Text', null, loading ? 'Cargando...' : children)),
    Surface: ({ children, ...p }: any) => React.createElement('View', p, children),
    Divider: () => null,
  };
});

import RegisterClienteScreen from '../../app/(auth)/register-cliente';

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────

describe('RegisterClienteScreen — renderizado', () => {
  it('muestra el título "Registro - Cliente"', () => {
    render(<RegisterClienteScreen />);
    expect(screen.getByText('Registro - Cliente')).toBeTruthy();
  });

  it('muestra los 6 campos del formulario', () => {
    render(<RegisterClienteScreen />);
    expect(screen.getByTestId('Nombre de usuario')).toBeTruthy();
    expect(screen.getByTestId('Contraseña')).toBeTruthy();
    expect(screen.getByTestId('Nombre')).toBeTruthy();
    expect(screen.getByTestId('Apellido')).toBeTruthy();
    expect(screen.getByTestId('DNI')).toBeTruthy();
    expect(screen.getByTestId('Dirección')).toBeTruthy();
  });

  it('muestra el botón Registrarme', () => {
    render(<RegisterClienteScreen />);
    expect(screen.getByTestId('Registrarme')).toBeTruthy();
  });
});

describe('RegisterClienteScreen — validación', () => {
  it('muestra Alert si se envía con campos vacíos', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<RegisterClienteScreen />);
    fireEvent.press(screen.getByTestId('Registrarme'));
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Por favor complete todos los campos');
    expect(mockRegister).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('bloquea el submit si falta el DNI', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<RegisterClienteScreen />);
    fireEvent.changeText(screen.getByTestId('Nombre de usuario'), 'juancho');
    fireEvent.changeText(screen.getByTestId('Contraseña'), 'pass123');
    fireEvent.changeText(screen.getByTestId('Nombre'), 'Juan');
    fireEvent.changeText(screen.getByTestId('Apellido'), 'García');
    fireEvent.changeText(screen.getByTestId('Dirección'), 'Calle Falsa 123');
    fireEvent.press(screen.getByTestId('Registrarme'));
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe('RegisterClienteScreen — registro exitoso', () => {
  const fillAll = () => {
    fireEvent.changeText(screen.getByTestId('Nombre de usuario'), 'juancho');
    fireEvent.changeText(screen.getByTestId('Contraseña'), 'pass123');
    fireEvent.changeText(screen.getByTestId('Nombre'), 'Juan');
    fireEvent.changeText(screen.getByTestId('Apellido'), 'García');
    fireEvent.changeText(screen.getByTestId('DNI'), '12345678');
    fireEvent.changeText(screen.getByTestId('Dirección'), 'Calle Falsa 123');
  };

  it('llama a register() con role=CLIENTE y todos los campos', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    render(<RegisterClienteScreen />);
    fillAll();
    fireEvent.press(screen.getByTestId('Registrarme'));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'juancho',
          password: 'pass123',
          nombre: 'Juan',
          apellido: 'García',
          dni: '12345678',
          direccion: 'Calle Falsa 123',
          role: 'CLIENTE',
        }),
      );
    });
  });

  it('muestra Alert si el registro falla con mensaje del servidor', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Username ya en uso' } },
    });
    render(<RegisterClienteScreen />);
    fillAll();
    fireEvent.press(screen.getByTestId('Registrarme'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Username ya en uso');
    });
    alertSpy.mockRestore();
  });
});
