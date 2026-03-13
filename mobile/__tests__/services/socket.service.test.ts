// __tests__/services/socket.service.test.ts
//
// El SocketService es un singleton. La estrategia correcta es mockear socket.io-client
// a nivel de módulo y resetear el estado interno del singleton entre tests.

let mockSocket: {
  on: jest.Mock;
  off: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
  connected: boolean;
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

import { io } from 'socket.io-client';
import { socketService } from '../../services/socket.service';

const mockIo = io as jest.Mock;

// Resetear mockSocket y el singleton antes de cada test
beforeEach(() => {
  jest.clearAllMocks();
  mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  };
  mockIo.mockReturnValue(mockSocket);

  // Limpiar el estado interno del singleton
  socketService.disconnect();
});

// Helper: simular evento 'connect' en el socket
function simulateConnect() {
  const connectCb = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'connect')?.[1];
  connectCb?.();
}

// ─────────────────────────────────────────────────────────────────────────────
describe('socketService.connect()', () => {
  it('debe llamar a io() con el token en auth', () => {
    socketService.connect('my-jwt-token');
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'my-jwt-token' } }),
    );
  });

  it('debe registrar listeners de connect, disconnect y connect_error', () => {
    socketService.connect('token');
    const events = mockSocket.on.mock.calls.map(([e]: [string]) => e);
    expect(events).toContain('connect');
    expect(events).toContain('disconnect');
    expect(events).toContain('connect_error');
  });

  it('isConnected() empieza en false antes de conectarse', () => {
    expect(socketService.isConnected()).toBe(false);
  });

  it('isConnected() retorna true después del evento "connect"', () => {
    socketService.connect('token');
    simulateConnect();
    expect(socketService.isConnected()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('socketService.disconnect()', () => {
  it('debe llamar socket.disconnect() y limpiar el estado', () => {
    socketService.connect('token');
    simulateConnect();

    socketService.disconnect();

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(socketService.isConnected()).toBe(false);
    expect(socketService.getSocket()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('socketService.emit()', () => {
  it('debe emitir si está conectado', () => {
    socketService.connect('token');
    simulateConnect();

    socketService.emit('ride_request', { origin: 'A', dest: 'B' });
    expect(mockSocket.emit).toHaveBeenCalledWith('ride_request', { origin: 'A', dest: 'B' });
  });

  it('no debe emitir si no está conectado (muestra warn)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    socketService.emit('ride_request', {});
    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('socketService.request()', () => {
  it('resuelve con null si no está conectado', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await socketService.request('get_offers', {});
    expect(result).toBeNull();
    consoleWarn.mockRestore();
  });

  it('emite y resuelve con la respuesta del callback (ACK) si está conectado', async () => {
    socketService.connect('token');
    simulateConnect();

    // Mockear emit para que llame al callback con la respuesta del servidor
    mockSocket.emit.mockImplementation((_event: string, _data: unknown, cb: (r: unknown) => void) => {
      cb({ status: 'ok' });
    });

    const result = await socketService.request('send_offer', { price: 100 });
    expect(result).toEqual({ status: 'ok' });
  });
});
