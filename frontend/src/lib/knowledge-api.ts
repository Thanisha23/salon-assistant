import api from "./api";
import type { KnowledgeBaseEntry } from "@/app/types/help-request";

export const knowledgeApi = {
  getAll: async () => {
    const response = await api.get("/knowledge");
    return response.data;
  },
  
  create: async (entry: KnowledgeBaseEntry) => {
    const response = await api.post("/knowledge", entry);
    return response.data;
  },
  
  update: async (id: string, entry: KnowledgeBaseEntry) => {
    const response = await api.put(`/knowledge/${id}`, entry);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/knowledge/${id}`);
    return response.data;
  },
  
  addFromRequest: async (requestId: string) => {
    const response = await api.post(`/knowledge/learn/${requestId}`);
    return response.data;
  }
};