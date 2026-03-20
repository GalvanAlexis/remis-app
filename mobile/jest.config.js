/** @type {import('jest').Config} */
module.exports = {
  // ── Project base para ambos entornos ──────────────────────────────────────
  projects: [
    // ── Unit tests de servicios (Node.js puro, ~2s) ───────────────────────
    {
      displayName: 'services',
      preset: 'jest-expo',
      setupFiles: ['./jest.setup.js'],
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      testMatch: ['**/__tests__/services/**/*.test.ts'],
      testEnvironment: 'node',
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
    // ── Component tests de pantallas (jsdom + RN) ────────────────────────
    {
      displayName: 'screens',
      preset: 'jest-expo',
      setupFiles: ['./jest.setup.js'],
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      testMatch: ['**/__tests__/screens/**/*.test.tsx'],
      testEnvironment: 'jsdom',
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        // KeyboardAvoidingView → pass-through para evitar errores de Platform.OS
        '^react-native/Libraries/Components/Keyboard/KeyboardAvoidingView$': '<rootDir>/__mocks__/KeyboardAvoidingView.js',
      },
    },
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.ts',
    'app/**/*.tsx',
    '!**/*.d.ts',
  ],
};
