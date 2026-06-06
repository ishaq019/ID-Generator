import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  // "http://localhost:5000/api";
  "https://id-generator-backend-jet.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE_URL
});

export const templateAPI = {
  getAll: category =>
    api.get(`/templates${category && category !== "All" ? `?category=${category}` : ""}`),

  getById: id => api.get(`/templates/${id}`),

  create: data => api.post("/templates", data),

  update: (id, data) => api.put(`/templates/${id}`, data),

  delete: id => api.delete(`/templates/${id}`)
};

export const cardAPI = {
  getAll: () => api.get("/cards"),

  getById: id => api.get(`/cards/${id}`),

  create: data => api.post("/cards", data),

  update: (id, data) => api.put(`/cards/${id}`, data),

  delete: id => api.delete(`/cards/${id}`)
};

export const uploadAPI = {
  image: file => {
    const formData = new FormData();
    formData.append("image", file);

    return api.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  }
};
