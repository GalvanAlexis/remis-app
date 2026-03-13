// __tests__/services/auth.service.test.ts
import * as SecureStore from 'expo-secure-store';

// Mock de api.ts — interceptamos antes de que Axios haga requests reales
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import api from '../../services/api';
import { authService } from '../../services/auth.service';

const mockApi = api as jest.Mocked<typeof api>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const fakeAuthResponse = {
  access_token: 'access-token-abc',
  refresh_token: 'refresh-token-xyz',
  user: { id: 'user-123', username: 'test@remis.com', role: 'CLIENTE' },
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('authService.login()', () => {
  it('debe llamar a POST /auth/login y guardar tokens en SecureStore', async () => {
    mockApi.post.mockResolvedValueOnce({ data: fakeAuthResponse });

    const result = await authService.login({ username: 'test@remis.com', password: '1234' });

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
      username: 'test@remis.com',
      password: '1234',
    });
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token', 'access-token-abc');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-token-xyz');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('user_id', 'user-123');
    expect(result).toEqual(fakeAuthResponse);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('authService.register()', () => {
  it('debe llamar a POST /auth/register y guardar tokens en SecureStore', async () => {
    mockApi.post.mockResolvedValueOnce({ data: fakeAuthResponse });

    const result = await authService.register({
      username: 'nuevo@remis.com',
      password: '1234',
      role: 'CLIENTE',
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '38000000',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      username: 'nuevo@remis.com',
      role: 'CLIENTE',
    }));
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token', 'access-token-abc');
    expect(result.user.role).toBe('CLIENTE');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('authService.logout()', () => {
  it('debe llamar a POST /auth/logout y borrar SecureStore', async () => {
    mockApi.post.mockResolvedValueOnce({});

    await authService.logout();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('user_id');
  });

  it('debe borrar SecureStore incluso si la llamada al servidor falla', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Network error'));

    await authService.logout(); // no debe lanzar

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('user_id');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('authService — getters de SecureStore', () => {
  it('getToken() debe leer "token" de SecureStore', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('my-token');
    const token = await authService.getToken();
    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('token');
    expect(token).toBe('my-token');
  });

  it('getRefreshToken() debe leer "refresh_token" de SecureStore', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('my-refresh');
    const tok = await authService.getRefreshToken();
    expect(tok).toBe('my-refresh');
  });

  it('getUserId() debe leer "user_id" de SecureStore', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('user-abc');
    const id = await authService.getUserId();
    expect(id).toBe('user-abc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('authService.saveNewTokens()', () => {
  it('debe guardar los 3 valores en SecureStore', async () => {
    await authService.saveNewTokens('new-access', 'new-refresh', 'user-999');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token', 'new-access');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'new-refresh');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('user_id', 'user-999');
  });
});
