import api from "./api";

export interface RideHistoryItem {
  id: string;
  status: "COMPLETED" | "CANCELLED";
  originAddress: string;
  destAddress: string;
  detalle?: string;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  client?: {
    profile?: { nombre: string; apellido: string };
  };
  selectedOffer?: {
    id: string;
    quotedPrice: number;
    estimatedMinutes: number;
    driverId: string;
    driver?: {
      profile?: { nombre: string; apellido: string };
    };
  };
  rating?: {
    score: number;
    comment?: string;
  };
}

export interface HistoryResponse {
  data: RideHistoryItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const ridesService = {
  async getHistory(page = 1, limit = 20): Promise<HistoryResponse> {
    const res = await api.get(`/rides/history?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getPendingRides(): Promise<any[]> {
    const res = await api.get("/rides/pending");
    return res.data;
  },
};
