// __tests__/services/notifications.service.test.ts
import * as Notifications from 'expo-notifications';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import api from '../../services/api';
import {
  registerForPushNotificationsAsync,
  registerPushTokenOnServer,
  setupNotificationHandler,
} from '../../services/notifications.service';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe('registerForPushNotificationsAsync()', () => {
  it('devuelve null si el permiso ya está denegado', async () => {
    // status 'denied' → NO es 'granted' → pide permiso → también deniega
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as any);

    const result = await registerForPushNotificationsAsync();
    expect(result).toBeNull();
  });

  it('pide permiso si no estaba granted y retorna null si el usuario rechaza', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as any);

    const result = await registerForPushNotificationsAsync();
    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('devuelve el token si el permiso es granted (sin pedir de nuevo)', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValueOnce({
      data: 'ExponentPushToken[abc123XYZ]',
      type: 'expo',
    } as any);

    const result = await registerForPushNotificationsAsync();
    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(result).toBe('ExponentPushToken[abc123XYZ]');
  });

  it('devuelve null silenciosamente si getExpoPushTokenAsync lanza error', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('Not a physical device'));

    const result = await registerForPushNotificationsAsync();
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('registerPushTokenOnServer()', () => {
  it('debe llamar a POST /notifications/register-token con el token', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { success: true } });

    await registerPushTokenOnServer('ExponentPushToken[test123]');

    expect(mockApi.post).toHaveBeenCalledWith('/notifications/register-token', {
      pushToken: 'ExponentPushToken[test123]',
    });
  });

  it('no lanza si el servidor falla — fallo silencioso', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Server error'));
    await expect(registerPushTokenOnServer('token')).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('setupNotificationHandler()', () => {
  it('debe llamar a Notifications.setNotificationHandler', () => {
    setupNotificationHandler();
    expect(mockNotifications.setNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({ handleNotification: expect.any(Function) }),
    );
  });

  it('el handler devuelve shouldShowAlert: true', async () => {
    setupNotificationHandler();
    const handlerArg = mockNotifications.setNotificationHandler.mock.calls[0][0] as any;
    const config = await handlerArg?.handleNotification({} as any);
    expect(config?.shouldShowAlert).toBe(true);
    expect(config?.shouldPlaySound).toBe(true);
  });
});
