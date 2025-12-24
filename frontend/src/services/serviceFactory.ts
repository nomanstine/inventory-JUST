import api from "@/lib/api";

export default function serviceFactory<T, TForm>(baseUrl: string) {
  return {
    create: async (data: TForm): Promise<T> => {
      const response = await api.post(baseUrl, data);
      return response.data;
    },

    getAll: async (): Promise<T[]> => {
      const response = await api.get(baseUrl);
      return response.data;
    },

    getById: async (id: number): Promise<T> => {
      const response = await api.get(`${baseUrl}/${id}`);
      return response.data;
    },

    update: async (id: number, data: Partial<TForm>): Promise<T> => {
      const response = await api.put(`${baseUrl}/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await api.delete(`${baseUrl}/${id}`);
    },
  };
}
