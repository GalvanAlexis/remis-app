// __tests__/services/rides.service.test.ts
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import api from '../../services/api';
import { ridesService } from '../../services/rides.service';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

const fakeHistory = {
  data: [
    {
      id: 'ride-1',
      status: 'COMPLETED',
      originAddress: 'Av. Corrientes 1234',
      destAddress: 'Palermo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  hasMore: false,
};

// ─────────────────────────────────────────────────────────────────────────────
describe('ridesService.getHistory()', () => {
  it('debe llamar a GET /rides/history con page y limit correctos', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeHistory });

    const result = await ridesService.getHistory(1, 20);

    expect(mockApi.get).toHaveBeenCalledWith('/rides/history?page=1&limit=20');
    expect(result.data).toHaveLength(1);
    expect(result.hasMore).toBe(false);
  });

  it('usa page=1 y limit=20 como defaults', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeHistory });

    await ridesService.getHistory();

    expect(mockApi.get).toHaveBeenCalledWith('/rides/history?page=1&limit=20');
  });

  it('puede usar page y limit personalizados', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { ...fakeHistory, page: 2, limit: 5 } });

    await ridesService.getHistory(2, 5);

    expect(mockApi.get).toHaveBeenCalledWith('/rides/history?page=2&limit=5');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ridesService.getPendingRides()', () => {
  it('debe llamar a GET /rides/pending y retornar el array', async () => {
    const fakePending = [{ id: 'ride-2', status: 'PENDING' }];
    mockApi.get.mockResolvedValueOnce({ data: fakePending });

    const result = await ridesService.getPendingRides();

    expect(mockApi.get).toHaveBeenCalledWith('/rides/pending');
    expect(result).toEqual(fakePending);
  });

  it('retorna array vacío si no hay viajes pendientes', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });

    const result = await ridesService.getPendingRides();

    expect(result).toEqual([]);
  });
});
