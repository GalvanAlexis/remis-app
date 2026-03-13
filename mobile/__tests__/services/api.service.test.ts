// __tests__/services/api.service.test.ts
//
// Tests para api.ts: interceptors de request/response y lógica de auto-refresh en 401.

import * as SecureStore from 'expo-secure-store';

// Mock del módulo events para poder espiar el emitter que usa api.ts internamente
const mockEmit = jest.fn();
jest.mock('../../utils/events', () => ({
  appEvents: { on: jest.fn(), off: jest.fn(), emit: jest.fn((...args: any[]) => mockEmit(...args)) },
  APP_EVENTS: { SESSION_EXPIRED: 'session_expired', NETWORK_ERROR: 'network_error' },
}));
import { APP_EVENTS } from '../../utils/events';

// ── Mocks ANTES de importar api.ts ──
const mockGet = jest.fn();
const mockPost = jest.fn();

// Mock de axios.create para controlar la instancia
jest.mock('axios', () => {
  const interceptors: any = {
    request: { handlers: [] as any[], use: jest.fn() },
    response: { handlers: [] as any[], use: jest.fn() },
  };

  interceptors.request.use.mockImplementation((fn: any) => {
    interceptors.request.handlers.push(fn);
  });

  interceptors.response.use.mockImplementation((success: any, error: any) => {
    interceptors.response.handlers.push({ success, error });
  });

  const instance = {
    interceptors,
    get: mockGet,
    post: mockPost,
    defaults: { headers: { common: {} } },
  };

  return {
    create: jest.fn(() => instance),
    post: jest.fn(), // axios.post directo usado para refresh
    default: { create: jest.fn(() => instance) },
  };
});

import axios from 'axios';

// Importar api.ts DESPUÉS del mock — registra los interceptors
import '../../services/api';

// Acceder a los interceptors registrados
const axiosInstance = (axios.create as jest.Mock).mock.results[0]?.value;

function getRequestInterceptor(): ((config: any) => any) | undefined {
  return axiosInstance?.interceptors?.request?.handlers?.[0];
}

function getResponseErrorInterceptor(): ((error: any) => any) | undefined {
  return axiosInstance?.interceptors?.response?.handlers?.[0]?.error;
}

function getResponseSuccessInterceptor(): ((res: any) => any) | undefined {
  return axiosInstance?.interceptors?.response?.handlers?.[0]?.success;
}

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

beforeEach(() => {
  jest.clearAllMocks();
  // Resetear handlers entre tests para evitar duplicados
  if (axiosInstance) {
    axiosInstance.interceptors.request.handlers = [];
    axiosInstance.interceptors.response.handlers = [];
  }
  // Re-registrar los interceptors importando de nuevo el servicio
  jest.isolateModules(() => {
    require('../../services/api');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('api.ts — Request interceptor', () => {
  it('agrega Bearer token si existe en SecureStore', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('my-access-token');
    const interceptor = getRequestInterceptor();
    const config = { headers: {} as Record<string, string> };

    const result = await interceptor?.(config);

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('token');
    expect(result?.headers?.Authorization).toBe('Bearer my-access-token');
  });

  it('no modifica headers si no hay token', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
    const interceptor = getRequestInterceptor();
    const config = { headers: {} as Record<string, string> };

    const result = await interceptor?.(config);

    expect(result?.headers?.Authorization).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('api.ts — Response interceptor', () => {
  it('pasa respuestas exitosas sin modificar', async () => {
    const interceptor = getResponseSuccessInterceptor();
    const response = { status: 200, data: { ok: true } };
    const result = await interceptor?.(response);
    expect(result).toBe(response);
  });

  it('en 401 con _retry=true: no vuelve a intentar refresh (previene loop)', async () => {
    const interceptor = getResponseErrorInterceptor();
    const error = { response: { status: 401 }, config: { _retry: true, headers: {} } };

    await expect(interceptor?.(error)).rejects.toBe(error);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('errores no-401 se propagan sin intentar refresh', async () => {
    const interceptor = getResponseErrorInterceptor();
    const error = { response: { status: 403 }, config: { _retry: false, headers: {} } };

    await expect(interceptor?.(error)).rejects.toBe(error);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('en 401 sin refresh token: limpia sesión y emite SESSION_EXPIRED', async () => {
    mockEmit.mockClear();
    mockSecureStore.getItemAsync.mockResolvedValue(null);

    const interceptor = getResponseErrorInterceptor();
    const error = { response: { status: 401 }, config: { _retry: false, headers: {} } };

    await expect(interceptor?.(error)).rejects.toBeDefined();

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
    expect(mockEmit).toHaveBeenCalledWith(APP_EVENTS.SESSION_EXPIRED);
  });

  it('en 401 sin _retry: intenta refresh con los tokens guardados y actualiza SecureStore', async () => {
    const newTokens = { access_token: 'new-access', refresh_token: 'new-refresh' };
    // Mock del refresh endpoint (axios.post directo, no la instancia)
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: newTokens });

    mockSecureStore.getItemAsync
      .mockResolvedValueOnce('old-refresh') // refresh_token
      .mockResolvedValueOnce('user-123');   // user_id

    const interceptor = getResponseErrorInterceptor();
    const error = {
      response: { status: 401 },
      config: { _retry: false, headers: {} as Record<string, string> },
    };

    // El re-intento del request original puede fallar (no tenemos el servidor real),
    // pero verificamos que el refresh fue llamado y los tokens se actualizaron.
    try {
      await interceptor?.(error);
    } catch {
      // Ignoramos el error del re-intento — solo nos importa que el refresh ocurrió
    }

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      expect.objectContaining({ userId: 'user-123', refreshToken: 'old-refresh' }),
      expect.any(Object),
    );
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token', 'new-access');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'new-refresh');
  });

});
