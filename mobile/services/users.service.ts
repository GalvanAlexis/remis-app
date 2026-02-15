import api from "./api";
import { UserProfile } from "./auth.service";

export interface UpdateProfileDto {
  nombre?: string;
  apellido?: string;
  direccion?: string;
  themePreference?: string;
}

export const usersService = {
  async updateProfile(data: UpdateProfileDto): Promise<any> {
    const response = await api.put("/users/profile", data);
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await api.get("/users/profile");
    return response.data;
  },
};
