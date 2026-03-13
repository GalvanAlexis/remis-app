// __tests__/services/users.service.test.ts
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}));

import api from '../../services/api';
import { usersService } from '../../services/users.service';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

const fakeProfile = {
  id: 'user-123',
  username: 'test@remis.com',
  role: 'CLIENTE',
  profile: {
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '38000000',
    direccion: 'Av. Corrientes 1234',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
describe('usersService.getProfile()', () => {
  it('debe llamar a GET /users/profile y retornar el perfil', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeProfile });

    const result = await usersService.getProfile();

    expect(mockApi.get).toHaveBeenCalledWith('/users/profile');
    expect(result.username).toBe('test@remis.com');
    expect(result.profile?.nombre).toBe('Juan');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('usersService.updateProfile()', () => {
  it('debe llamar a PUT /users/profile con los datos actualizados', async () => {
    const updatedProfile = { ...fakeProfile, profile: { ...fakeProfile.profile, nombre: 'Carlos' } };
    mockApi.put.mockResolvedValueOnce({ data: updatedProfile });

    const result = await usersService.updateProfile({ nombre: 'Carlos' });

    expect(mockApi.put).toHaveBeenCalledWith('/users/profile', { nombre: 'Carlos' });
    expect(result.profile.nombre).toBe('Carlos');
  });

  it('puede actualizar solo algunos campos (partial update)', async () => {
    mockApi.put.mockResolvedValueOnce({ data: fakeProfile });

    await usersService.updateProfile({ direccion: 'Palermo 500' });

    expect(mockApi.put).toHaveBeenCalledWith('/users/profile', { direccion: 'Palermo 500' });
  });
});
