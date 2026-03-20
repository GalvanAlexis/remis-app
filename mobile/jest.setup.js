// ── Mocks globales de módulos nativos de Expo/React Native ───────────────────
// Jest corre en Node.js puro — los módulos nativos deben ser reemplazados.

// expo-secure-store: simula un key-value store en memoria
jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    setItemAsync: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key) => Promise.resolve(store[key] ?? null)),
    deleteItemAsync: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

// expo-notifications: mock de funciones de permisos y tokens
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// expo-router: mock del router de navegación
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// socket.io-client: mock para evitar conexiones reales de red
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  };
  return { io: jest.fn(() => mockSocket) };
});

// react-native Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: jest.fn((obj) => obj.android ?? obj.default),
  Version: 30,
  isPad: false,
  isTVOS: false,
}));

// react-native-safe-area-context (necesario en component tests)
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// @expo/vector-icons (no disponible en Node.js)
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
  Ionicons: () => null,
  FontAwesome: () => null,
  Feather: () => null,
}));
